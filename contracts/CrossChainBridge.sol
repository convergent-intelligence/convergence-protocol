// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CrossChainBridge
 * @notice Atomic swaps between WBTC (Ethereum) and native BTC (Bitcoin)
 * @dev Coordinates deposits/withdrawals across chains with settlement guarantees
 */
contract CrossChainBridge is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ State Variables ============

    // Token addresses
    IERC20 public wbtcToken; // Wrapped Bitcoin on Ethereum
    IERC20 public tallyToken; // For fee distribution

    // Bitcoin reserve vault
    address public bitcoinReserveVault;

    // Fee percentage (basis points, 10000 = 100%)
    uint256 public bridgeFeePercent = 20; // 0.2%

    // Swap status enum
    enum SwapStatus {
        INITIATED,
        LOCKED,
        SETTLED,
        COMPLETED,
        FAILED,
        CANCELLED
    }

    // Bridge swap data structure
    struct BridgeSwap {
        bytes32 swapId;
        address initiator;
        uint256 wbtcAmount;
        uint256 bitcoinSatoshis;
        string bitcoinAddress;
        SwapStatus status;
        uint256 timestamp;
        uint256 expiryTime;
        bool toBitcoin; // true = WBTC→BTC, false = BTC→WBTC
        string bitcoinTxHash;
        uint256 fees;
    }

    mapping(bytes32 => BridgeSwap) public swaps;
    bytes32[] public swapIds;

    // Custody balances (WBTC locked for swaps)
    uint256 public custodyBalance;
    mapping(address => uint256) public userCustodyBalance;

    // Fee receiver address
    address public feeReceiver;

    // Swap timeout (default 24 hours)
    uint256 public swapTimeout = 24 hours;

    // Minimum swap amount (to prevent dust)
    uint256 public minSwapAmount = 1_000_000; // 0.01 WBTC (8 decimals)

    // Oracle for price verification
    IBridgePriceOracle public priceOracle;

    // Maximum slippage allowed (basis points)
    uint256 public maxSlippage = 100; // 1%

    // ============ Events ============

    event SwapInitiated(
        bytes32 indexed swapId,
        address indexed initiator,
        uint256 wbtcAmount,
        string bitcoinAddress,
        uint256 timestamp
    );

    event SwapLocked(
        bytes32 indexed swapId,
        uint256 custodyAmount,
        uint256 fees,
        uint256 timestamp
    );

    event SwapSettled(
        bytes32 indexed swapId,
        string bitcoinTxHash,
        uint256 satoshisReceived,
        uint256 timestamp
    );

    event SwapCompleted(
        bytes32 indexed swapId,
        address indexed recipient,
        uint256 amountReceived,
        uint256 timestamp
    );

    event SwapCancelled(
        bytes32 indexed swapId,
        string reason,
        uint256 timestamp
    );

    event FeeCollected(
        bytes32 indexed swapId,
        uint256 feeAmount,
        address indexed feeReceiver
    );

    event BridgeParametersUpdated(
        uint256 feePercent,
        uint256 timeout,
        uint256 minAmount
    );

    event BitcoinReserveUpdated(address newVault);

    // ============ Modifiers ============

    modifier validBitcoinAddress(string memory addr) {
        require(bytes(addr).length > 0, "Invalid Bitcoin address");
        _;
    }

    modifier validSwap(bytes32 _swapId) {
        require(swaps[_swapId].timestamp > 0, "Swap not found");
        _;
    }

    // ============ Constructor ============

    constructor(
        address _wbtc,
        address _tally,
        address _feeReceiver,
        address _priceOracle
    ) Ownable(msg.sender) {
        require(_wbtc != address(0), "Invalid WBTC");
        require(_tally != address(0), "Invalid Tally");
        require(_feeReceiver != address(0), "Invalid fee receiver");
        require(_priceOracle != address(0), "Invalid oracle");

        wbtcToken = IERC20(_wbtc);
        tallyToken = IERC20(_tally);
        feeReceiver = _feeReceiver;
        priceOracle = IBridgePriceOracle(_priceOracle);
    }

    // ============ Swap Initiation ============

    /**
     * @notice Initiate WBTC to Bitcoin swap
     * @param _wbtcAmount Amount of WBTC (8 decimals)
     * @param _bitcoinAddress Bitcoin address to receive funds
     */
    function initiateWBTCToBTCSwap(
        uint256 _wbtcAmount,
        string memory _bitcoinAddress
    ) external nonReentrant validBitcoinAddress(_bitcoinAddress) returns (bytes32 swapId) {
        require(_wbtcAmount >= minSwapAmount, "Below minimum swap amount");

        // Check WBTC balance
        require(wbtcToken.balanceOf(msg.sender) >= _wbtcAmount, "Insufficient WBTC");

        // Generate swap ID
        swapId = keccak256(abi.encodePacked(
            msg.sender,
            block.timestamp,
            _wbtcAmount,
            _bitcoinAddress
        ));

        // Create swap record
        uint256 expiryTime = block.timestamp + swapTimeout;
        swaps[swapId] = BridgeSwap({
            swapId: swapId,
            initiator: msg.sender,
            wbtcAmount: _wbtcAmount,
            bitcoinSatoshis: _wbtcAmount, // 1:1 satoshi to satoshi
            bitcoinAddress: _bitcoinAddress,
            status: SwapStatus.INITIATED,
            timestamp: block.timestamp,
            expiryTime: expiryTime,
            toBitcoin: true,
            bitcoinTxHash: "",
            fees: 0
        });

        swapIds.push(swapId);

        emit SwapInitiated(
            swapId,
            msg.sender,
            _wbtcAmount,
            _bitcoinAddress,
            block.timestamp
        );

        return swapId;
    }

    /**
     * @notice Lock WBTC for swap (called after initiation)
     * @param _swapId Swap ID to lock
     */
    function lockWBTCForSwap(bytes32 _swapId) external nonReentrant validSwap(_swapId) {
        BridgeSwap storage swap = swaps[_swapId];

        require(swap.initiator == msg.sender, "Not swap initiator");
        require(swap.status == SwapStatus.INITIATED, "Invalid swap status");
        require(block.timestamp < swap.expiryTime, "Swap expired");

        // Calculate fees
        uint256 fees = (swap.wbtcAmount * bridgeFeePercent) / 10000;

        // Transfer WBTC from user to this contract
        wbtcToken.safeTransferFrom(msg.sender, address(this), swap.wbtcAmount);

        // Update custody balance
        custodyBalance += swap.wbtcAmount;
        userCustodyBalance[msg.sender] += swap.wbtcAmount;

        // Update swap status
        swap.status = SwapStatus.LOCKED;
        swap.fees = fees;

        // Transfer fees to fee receiver
        if (fees > 0) {
            wbtcToken.safeTransfer(feeReceiver, fees);
            emit FeeCollected(_swapId, fees, feeReceiver);
        }

        emit SwapLocked(_swapId, swap.wbtcAmount, fees, block.timestamp);
    }

    /**
     * @notice Settle swap after Bitcoin transaction confirmed
     * @param _swapId Swap ID to settle
     * @param _bitcoinTxHash Bitcoin transaction hash
     * @param _satoshisReceived Satoshis actually received (for slippage checking)
     */
    function settleSwap(
        bytes32 _swapId,
        string memory _bitcoinTxHash,
        uint256 _satoshisReceived
    ) external onlyOwner nonReentrant validSwap(_swapId) {
        BridgeSwap storage swap = swaps[_swapId];

        require(swap.status == SwapStatus.LOCKED, "Invalid swap status");
        require(bytes(_bitcoinTxHash).length > 0, "Invalid tx hash");

        // Check slippage
        uint256 maxSlippageAmount = (swap.bitcoinSatoshis * maxSlippage) / 10000;
        require(
            _satoshisReceived >= (swap.bitcoinSatoshis - maxSlippageAmount),
            "Excessive slippage"
        );

        // Update swap
        swap.status = SwapStatus.SETTLED;
        swap.bitcoinTxHash = _bitcoinTxHash;
        swap.bitcoinSatoshis = _satoshisReceived;

        emit SwapSettled(_swapId, _bitcoinTxHash, _satoshisReceived, block.timestamp);
    }

    /**
     * @notice Complete swap (user confirms receipt)
     * @param _swapId Swap ID to complete
     */
    function completeSwap(bytes32 _swapId) external nonReentrant validSwap(_swapId) {
        BridgeSwap storage swap = swaps[_swapId];

        require(swap.initiator == msg.sender, "Not swap initiator");
        require(swap.status == SwapStatus.SETTLED, "Invalid swap status");

        swap.status = SwapStatus.COMPLETED;

        // Update custody balance
        custodyBalance -= swap.wbtcAmount;
        userCustodyBalance[msg.sender] -= swap.wbtcAmount;

        emit SwapCompleted(_swapId, msg.sender, swap.bitcoinSatoshis, block.timestamp);
    }

    // ============ Swap Cancellation ============

    /**
     * @notice Cancel swap and refund WBTC (if not settled)
     * @param _swapId Swap ID to cancel
     */
    function cancelSwap(bytes32 _swapId) external nonReentrant validSwap(_swapId) {
        BridgeSwap storage swap = swaps[_swapId];

        require(swap.initiator == msg.sender, "Not swap initiator");
        require(swap.status != SwapStatus.COMPLETED, "Already completed");
        require(swap.status != SwapStatus.FAILED, "Already failed");

        // Can only cancel if expired or locked (no funds transferred yet)
        if (swap.status == SwapStatus.LOCKED) {
            require(block.timestamp >= swap.expiryTime, "Swap not yet expired");

            // Refund WBTC
            wbtcToken.safeTransfer(msg.sender, swap.wbtcAmount);

            // Update custody
            custodyBalance -= swap.wbtcAmount;
            userCustodyBalance[msg.sender] -= swap.wbtcAmount;
        }

        swap.status = SwapStatus.CANCELLED;

        emit SwapCancelled(_swapId, "User cancelled", block.timestamp);
    }

    /**
     * @notice Force cancel expired swap (owner only)
     * @param _swapId Swap ID to cancel
     */
    function forceCancelExpiredSwap(bytes32 _swapId) external onlyOwner nonReentrant validSwap(_swapId) {
        BridgeSwap storage swap = swaps[_swapId];

        require(block.timestamp >= swap.expiryTime, "Swap not expired");
        require(swap.status == SwapStatus.LOCKED, "Cannot cancel");

        // Refund WBTC to initiator
        wbtcToken.safeTransfer(swap.initiator, swap.wbtcAmount);

        // Update custody
        custodyBalance -= swap.wbtcAmount;
        userCustodyBalance[swap.initiator] -= swap.wbtcAmount;

        swap.status = SwapStatus.CANCELLED;

        emit SwapCancelled(_swapId, "Expired and cancelled", block.timestamp);
    }

    // ============ Admin Functions ============

    /**
     * @notice Update bridge parameters
     */
    function updateBridgeParameters(
        uint256 _feePercent,
        uint256 _timeout,
        uint256 _minAmount
    ) external onlyOwner {
        require(_feePercent <= 1000, "Fee too high"); // Max 10%
        require(_timeout > 0, "Invalid timeout");
        require(_minAmount > 0, "Invalid min amount");

        bridgeFeePercent = _feePercent;
        swapTimeout = _timeout;
        minSwapAmount = _minAmount;

        emit BridgeParametersUpdated(_feePercent, _timeout, _minAmount);
    }

    /**
     * @notice Set Bitcoin reserve vault address
     */
    function setBitcoinReserveVault(address _vault) external onlyOwner {
        require(_vault != address(0), "Invalid vault address");
        bitcoinReserveVault = _vault;
        emit BitcoinReserveUpdated(_vault);
    }

    /**
     * @notice Set max slippage allowed
     */
    function setMaxSlippage(uint256 _slippage) external onlyOwner {
        require(_slippage > 0 && _slippage <= 1000, "Invalid slippage"); // 0.01% to 10%
        maxSlippage = _slippage;
    }

    /**
     * @notice Update fee receiver
     */
    function setFeeReceiver(address _receiver) external onlyOwner {
        require(_receiver != address(0), "Invalid receiver");
        feeReceiver = _receiver;
    }

    // ============ View Functions ============

    /**
     * @notice Get swap details
     */
    function getSwap(bytes32 _swapId) external view validSwap(_swapId) returns (
        address initiator,
        uint256 wbtcAmount,
        string memory bitcoinAddress,
        SwapStatus status,
        uint256 timestamp,
        bool toBitcoin,
        string memory bitcoinTxHash
    ) {
        BridgeSwap storage swap = swaps[_swapId];
        return (
            swap.initiator,
            swap.wbtcAmount,
            swap.bitcoinAddress,
            swap.status,
            swap.timestamp,
            swap.toBitcoin,
            swap.bitcoinTxHash
        );
    }

    /**
     * @notice Get custody balance for user
     */
    function getUserCustodyBalance(address _user) external view returns (uint256) {
        return userCustodyBalance[_user];
    }

    /**
     * @notice Get total custody balance
     */
    function getTotalCustodyBalance() external view returns (uint256) {
        return custodyBalance;
    }

    /**
     * @notice Get total swaps count
     */
    function getSwapCount() external view returns (uint256) {
        return swapIds.length;
    }

    /**
     * @notice Get bridge health metrics
     */
    function getBridgeHealth() external view returns (
        uint256 totalSwapsInitiated,
        uint256 totalSwapsCompleted,
        uint256 custodyBalanceUSD,
        bool healthy
    ) {
        uint256 btcPrice = priceOracle.getBTCPriceUSD();
        uint256 custodyUSD = (custodyBalance * btcPrice) / 100_000_000;

        // Count completed swaps
        uint256 completed = 0;
        for (uint256 i = 0; i < swapIds.length; i++) {
            if (swaps[swapIds[i]].status == SwapStatus.COMPLETED) {
                completed++;
            }
        }

        bool isHealthy = custodyBalance > 0 && completed > 0;

        return (swapIds.length, completed, custodyUSD, isHealthy);
    }
}

// ============ Interfaces ============

interface IBridgePriceOracle {
    function getBTCPriceUSD() external view returns (uint256);
    function getETHPriceUSD() external view returns (uint256);
}
