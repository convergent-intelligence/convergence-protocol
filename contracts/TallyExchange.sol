// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title TallyExchange
 * @notice Convergence Protocol: Low/zero-fee TALLY trading and burning for services
 * @dev Real-time TALLY ↔ Stablecoin exchange with minimal slippage
 */
contract TallyExchange is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ State Variables ============

    // TALLY token
    IERC20 public tally;

    // Stablecoins accepted (USDC, USDT, etc)
    mapping(address => bool) public acceptedStables;
    address[] public stablesList;

    // TRUST token (for burn rewards)
    IERC20 public trust;

    // Exchange rate (TALLY per USD) - updated in real time
    uint256 public tallyPerUSD = 10**18; // 1 TALLY = $1 (18 decimals)
    uint256 public lastRateUpdate;

    // Fee structure
    uint256 public buyFeePercent = 0;   // 0% buy fee
    uint256 public sellFeePercent = 0;  // 0% sell fee
    uint256 public burnFeePercent = 50; // 0.5% burn fee (optional)

    // Liquidity pool
    uint256 public totalTallyLiquidity;
    uint256 public totalStableLiquidity;

    // Burn mechanisms and rewards
    struct BurnReward {
        string serviceType;
        uint256 trustPerTally;      // TRUST earned per TALLY burned
        bool active;
    }

    mapping(string => BurnReward) public burnRewards;
    string[] public serviceTypes;

    // Burn tracking
    struct BurnEvent {
        bytes32 burnId;
        address burner;
        uint256 tallyAmount;
        string serviceType;
        uint256 trustEarned;
        uint256 timestamp;
    }

    mapping(bytes32 => BurnEvent) public burns;
    bytes32[] public recentBurns;

    // Real-time market data
    struct MarketData {
        uint256 timestamp;
        uint256 price;              // TALLY price in USD (18 decimals)
        uint256 volume24h;          // 24-hour volume
        uint256 liquidity;          // Total liquidity
    }

    MarketData[] public marketHistory;
    uint256 public maxHistoryLength = 288; // 24 hours of 5-min data

    // Approved operators for minting TALLY
    mapping(address => bool) public approvedMinters;

    // ============ Events ============

    event TallyBought(
        address indexed buyer,
        uint256 stableAmount,
        uint256 tallyReceived,
        uint256 pricePerTally,
        uint256 timestamp
    );

    event TallySold(
        address indexed seller,
        uint256 tallyAmount,
        uint256 stableReceived,
        uint256 pricePerTally,
        uint256 timestamp
    );

    event TallyBurned(
        bytes32 indexed burnId,
        address indexed burner,
        uint256 tallyAmount,
        string serviceType,
        uint256 trustEarned,
        uint256 timestamp
    );

    event RateUpdated(
        uint256 newRate,
        uint256 timestamp
    );

    event LiquidityAdded(
        uint256 tallyAmount,
        uint256 stableAmount,
        uint256 timestamp
    );

    event BurnRewardAdded(
        string serviceType,
        uint256 trustPerTally
    );

    // ============ Modifiers ============

    modifier onlyMinter() {
        require(approvedMinters[msg.sender] || msg.sender == owner(), "Not minter");
        _;
    }

    // ============ Constructor ============

    constructor(
        address _tally,
        address _trust,
        address _usdc,
        address _usdt
    ) Ownable(msg.sender) {
        tally = IERC20(_tally);
        trust = IERC20(_trust);

        // Add stables
        if (_usdc != address(0)) {
            acceptedStables[_usdc] = true;
            stablesList.push(_usdc);
        }
        if (_usdt != address(0)) {
            acceptedStables[_usdt] = true;
            stablesList.push(_usdt);
        }

        // Initialize burn rewards
        _initializeBurnRewards();
    }

    /**
     * @notice Initialize standard burn rewards
     */
    function _initializeBurnRewards() internal {
        burnRewards["governance-vote"] = BurnReward({
            serviceType: "governance-vote",
            trustPerTally: 1 * 10**18,      // 1 TRUST per 1 TALLY burned
            active: true
        });

        burnRewards["premium-nft-eval"] = BurnReward({
            serviceType: "premium-nft-eval",
            trustPerTally: 5 * 10**18,      // 5 TRUST per TALLY (premium service)
            active: true
        });

        burnRewards["accelerated-yield"] = BurnReward({
            serviceType: "accelerated-yield",
            trustPerTally: 2 * 10**18,      // 2 TRUST per TALLY
            active: true
        });

        burnRewards["governance-proposal"] = BurnReward({
            serviceType: "governance-proposal",
            trustPerTally: 10 * 10**18,     // 10 TRUST per TALLY (high value)
            active: true
        });

        serviceTypes.push("governance-vote");
        serviceTypes.push("premium-nft-eval");
        serviceTypes.push("accelerated-yield");
        serviceTypes.push("governance-proposal");
    }

    // ============ Buy TALLY ============

    /**
     * @notice Buy TALLY with stablecoins (no fee)
     * @param _stableToken Stablecoin address (USDC, USDT, etc)
     * @param _stableAmount Amount of stablecoin to trade
     */
    function buyTally(
        address _stableToken,
        uint256 _stableAmount
    ) external nonReentrant returns (uint256 tallyReceived) {
        require(acceptedStables[_stableToken], "Stablecoin not accepted");
        require(_stableAmount > 0, "Invalid amount");

        // Get TALLY amount (rate is TALLY per USD, normalize to token decimals)
        tallyReceived = (_stableAmount * tallyPerUSD) / 10**18;
        require(tallyReceived > 0, "Insufficient liquidity");
        require(tallyReceived <= totalTallyLiquidity, "Insufficient pool liquidity");

        // Transfer stablecoin from user
        IERC20(_stableToken).safeTransferFrom(msg.sender, address(this), _stableAmount);

        // Transfer TALLY to user (NO FEE)
        tally.safeTransfer(msg.sender, tallyReceived);

        // Update liquidity
        totalStableLiquidity += _stableAmount;
        totalTallyLiquidity -= tallyReceived;

        // Update market data
        _updateMarketData(tallyPerUSD);

        emit TallyBought(
            msg.sender,
            _stableAmount,
            tallyReceived,
            tallyPerUSD,
            block.timestamp
        );

        return tallyReceived;
    }

    /**
     * @notice Sell TALLY for stablecoins (no fee)
     * @param _stableToken Stablecoin to receive
     * @param _tallyAmount TALLY to sell
     */
    function sellTally(
        address _stableToken,
        uint256 _tallyAmount
    ) external nonReentrant returns (uint256 stableReceived) {
        require(acceptedStables[_stableToken], "Stablecoin not accepted");
        require(_tallyAmount > 0, "Invalid amount");

        // Get stablecoin amount
        stableReceived = (_tallyAmount * 10**18) / tallyPerUSD;
        require(stableReceived > 0, "Insufficient liquidity");
        require(stableReceived <= totalStableLiquidity, "Insufficient pool liquidity");

        // Transfer TALLY from user
        tally.safeTransferFrom(msg.sender, address(this), _tallyAmount);

        // Transfer stablecoin to user (NO FEE)
        IERC20(_stableToken).safeTransfer(msg.sender, stableReceived);

        // Update liquidity
        totalTallyLiquidity += _tallyAmount;
        totalStableLiquidity -= stableReceived;

        // Update market data
        _updateMarketData(tallyPerUSD);

        emit TallySold(
            msg.sender,
            _tallyAmount,
            stableReceived,
            tallyPerUSD,
            block.timestamp
        );

        return stableReceived;
    }

    // ============ Burn for Services ============

    /**
     * @notice Burn TALLY to access services or gain TRUST
     * @param _tallyAmount TALLY amount to burn
     * @param _serviceType Type of service (see burnRewards)
     */
    function burnTallyForService(
        uint256 _tallyAmount,
        string memory _serviceType
    ) external nonReentrant returns (uint256 trustEarned) {
        require(_tallyAmount > 0, "Invalid amount");

        BurnReward storage reward = burnRewards[_serviceType];
        require(reward.active, "Service not available");

        // Transfer TALLY from user (includes any burn fee)
        uint256 burnAmount = _tallyAmount;
        if (burnFeePercent > 0) {
            uint256 fee = (_tallyAmount * burnFeePercent) / 10000;
            burnAmount = _tallyAmount - fee;
        }

        tally.safeTransferFrom(msg.sender, address(0), burnAmount); // Burn to 0x0

        // Calculate TRUST earned
        trustEarned = (_tallyAmount * reward.trustPerTally) / 10**18;

        // Award TRUST (if available)
        if (trust != IERC20(address(0))) {
            trust.safeTransfer(msg.sender, trustEarned);
        }

        // Record burn
        bytes32 burnId = keccak256(abi.encodePacked(
            msg.sender,
            _tallyAmount,
            _serviceType,
            block.timestamp
        ));

        burns[burnId] = BurnEvent({
            burnId: burnId,
            burner: msg.sender,
            tallyAmount: _tallyAmount,
            serviceType: _serviceType,
            trustEarned: trustEarned,
            timestamp: block.timestamp
        });

        // Track recent burns
        recentBurns.push(burnId);
        if (recentBurns.length > 100) {
            recentBurns = _popOldest(recentBurns);
        }

        emit TallyBurned(
            burnId,
            msg.sender,
            _tallyAmount,
            _serviceType,
            trustEarned,
            block.timestamp
        );

        return trustEarned;
    }

    // ============ Rate Management ============

    /**
     * @notice Update TALLY price in real-time
     * @param _pricePerUSD TALLY per USD (18 decimals)
     * @dev Called by oracle or operator to keep price current
     */
    function updateTallyPrice(uint256 _pricePerUSD) external onlyMinter {
        require(_pricePerUSD > 0, "Invalid price");

        tallyPerUSD = _pricePerUSD;
        lastRateUpdate = block.timestamp;

        _updateMarketData(_pricePerUSD);

        emit RateUpdated(_pricePerUSD, block.timestamp);
    }

    // ============ Liquidity Management ============

    /**
     * @notice Add liquidity to the exchange (protocol only)
     * @param _tallyAmount TALLY to add
     * @param _stableAmount Stablecoin to add
     */
    function addLiquidity(
        uint256 _tallyAmount,
        uint256 _stableAmount,
        address _stableToken
    ) external onlyOwner {
        require(_tallyAmount > 0 && _stableAmount > 0, "Invalid amounts");
        require(acceptedStables[_stableToken], "Stablecoin not accepted");

        // Transfer assets
        tally.safeTransferFrom(msg.sender, address(this), _tallyAmount);
        IERC20(_stableToken).safeTransferFrom(msg.sender, address(this), _stableAmount);

        // Update pools
        totalTallyLiquidity += _tallyAmount;
        totalStableLiquidity += _stableAmount;

        emit LiquidityAdded(_tallyAmount, _stableAmount, block.timestamp);
    }

    // ============ Burn Rewards Management ============

    /**
     * @notice Add new burn reward type
     */
    function addBurnReward(
        string memory _serviceType,
        uint256 _trustPerTally
    ) external onlyOwner {
        require(_trustPerTally > 0, "Invalid reward");

        if (!burnRewards[_serviceType].active) {
            serviceTypes.push(_serviceType);
        }

        burnRewards[_serviceType] = BurnReward({
            serviceType: _serviceType,
            trustPerTally: _trustPerTally,
            active: true
        });

        emit BurnRewardAdded(_serviceType, _trustPerTally);
    }

    /**
     * @notice Update burn reward
     */
    function updateBurnReward(
        string memory _serviceType,
        uint256 _trustPerTally
    ) external onlyOwner {
        require(burnRewards[_serviceType].active, "Service not found");
        burnRewards[_serviceType].trustPerTally = _trustPerTally;
    }

    /**
     * @notice Disable burn reward
     */
    function disableBurnReward(string memory _serviceType) external onlyOwner {
        burnRewards[_serviceType].active = false;
    }

    // ============ View Functions ============

    /**
     * @notice Calculate TALLY received for stablecoin amount
     */
    function getTallyForStable(uint256 _stableAmount) external view returns (uint256) {
        return (_stableAmount * tallyPerUSD) / 10**18;
    }

    /**
     * @notice Calculate stablecoin received for TALLY amount
     */
    function getStableForTally(uint256 _tallyAmount) external view returns (uint256) {
        return (_tallyAmount * 10**18) / tallyPerUSD;
    }

    /**
     * @notice Get TALLY current price in USD
     */
    function getTallyPrice() external view returns (uint256) {
        return tallyPerUSD;
    }

    /**
     * @notice Get market data
     */
    function getMarketData() external view returns (
        uint256 price,
        uint256 liquidity,
        uint256 tallyPool,
        uint256 stablePool
    ) {
        return (
            tallyPerUSD,
            totalTallyLiquidity + totalStableLiquidity,
            totalTallyLiquidity,
            totalStableLiquidity
        );
    }

    /**
     * @notice Get burn reward info
     */
    function getBurnReward(string memory _serviceType) external view returns (
        string memory serviceType,
        uint256 trustPerTally,
        bool active
    ) {
        BurnReward storage reward = burnRewards[_serviceType];
        return (
            reward.serviceType,
            reward.trustPerTally,
            reward.active
        );
    }

    /**
     * @notice Get recent burns
     */
    function getRecentBurns(uint256 _count) external view returns (bytes32[] memory) {
        uint256 len = recentBurns.length > _count ? _count : recentBurns.length;
        bytes32[] memory recent = new bytes32[](len);

        for (uint256 i = 0; i < len; i++) {
            recent[i] = recentBurns[recentBurns.length - 1 - i];
        }

        return recent;
    }

    /**
     * @notice Get all accepted stablecoins
     */
    function getAcceptedStables() external view returns (address[] memory) {
        return stablesList;
    }

    /**
     * @notice Get all service types
     */
    function getServiceTypes() external view returns (string[] memory) {
        return serviceTypes;
    }

    // ============ Internal Helper Functions ============

    /**
     * @notice Update market data history
     */
    function _updateMarketData(uint256 _price) internal {
        marketHistory.push(MarketData({
            timestamp: block.timestamp,
            price: _price,
            volume24h: 0, // Would track actual volume
            liquidity: totalTallyLiquidity + totalStableLiquidity
        }));

        if (marketHistory.length > maxHistoryLength) {
            for (uint256 i = 0; i < marketHistory.length - 1; i++) {
                marketHistory[i] = marketHistory[i + 1];
            }
            marketHistory.pop();
        }
    }

    /**
     * @notice Remove oldest element
     */
    function _popOldest(bytes32[] memory arr) internal pure returns (bytes32[] memory) {
        bytes32[] memory result = new bytes32[](arr.length - 1);
        for (uint256 i = 0; i < result.length; i++) {
            result[i] = arr[i + 1];
        }
        return result;
    }

    // ============ Admin Functions ============

    /**
     * @notice Add stablecoin
     */
    function addStablecoin(address _token) external onlyOwner {
        require(_token != address(0), "Invalid token");
        if (!acceptedStables[_token]) {
            acceptedStables[_token] = true;
            stablesList.push(_token);
        }
    }

    /**
     * @notice Add approved minter
     */
    function addMinter(address _minter) external onlyOwner {
        approvedMinters[_minter] = true;
    }

    /**
     * @notice Remove minter
     */
    function removeMinter(address _minter) external onlyOwner {
        approvedMinters[_minter] = false;
    }

    /**
     * @notice Update fees
     */
    function setFees(uint256 _buyFee, uint256 _sellFee, uint256 _burnFee) external onlyOwner {
        require(_buyFee <= 100 && _sellFee <= 100 && _burnFee <= 100, "Fees too high");
        buyFeePercent = _buyFee;
        sellFeePercent = _sellFee;
        burnFeePercent = _burnFee;
    }
}
