// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ReserveDashboard
 * @notice Convergence v4: Real-time reserve tracking and public transparency
 * @dev Core contract for monitoring holdings across all networks, TALLY minting, and circulation
 */
contract ReserveDashboard is Ownable, ReentrancyGuard {

    // ============ State Variables ============

    // TALLY token
    IERC20 public tallyToken;

    // Chain data tracking
    struct ChainReserve {
        string chainName;
        address nativeToken;
        uint256 nativeBalance;      // In native currency
        uint256 usdValue;           // In USD (18 decimals)
        uint256 lastUpdate;
        bool active;
    }

    // All chain reserves
    mapping(uint256 => ChainReserve) public chainReserves;
    uint256[] public activeChainIds;

    // Real-time TALLY tracking
    struct TallyMetrics {
        uint256 totalSupply;        // Total TALLY ever minted
        uint256 circulating;        // TALLY held by users
        uint256 burned;             // TALLY burned for services
        uint256 reserved;           // TALLY in reserve
        uint256 lastUpdate;
    }

    TallyMetrics public tallyMetrics;

    // Minting and slippage tracking
    struct MintOperation {
        bytes32 mintId;
        address recipient;
        uint256 donationAmount;     // USD value of donation
        uint256 tallyMinted;        // TALLY given to user
        uint256 priceAtMint;        // USD per TALLY at time of mint
        uint256 timestamp;
        bool completed;
    }

    mapping(bytes32 => MintOperation) public mintOps;
    bytes32[] public recentMints;

    // Price tracking for slippage detection
    struct PriceSnapshot {
        uint256 timestamp;
        uint256 tallyPrice;         // USD per TALLY (18 decimals)
        uint256 circulating;
        uint256 reserved;
    }

    PriceSnapshot[] public priceHistory;
    uint256 public maxPriceHistoryLength = 100; // Keep last 100

    // Slippage protection
    uint256 public maxAcceptableSlippage = 100; // 1% (in basis points)
    uint256 public lastSlippageAlert;

    // Real-time monitoring
    struct ReserveHealth {
        uint256 totalReserveUSD;
        uint256 tallyPerUSD;        // How much TALLY per $1
        uint256 backingRatio;       // Reserve / Circulating
        uint256 slippage24h;        // 24-hour price movement
        bool isHealthy;
    }

    // NFT holdings tracking
    struct NFTHolding {
        address nftContract;
        uint256 tokenId;
        string chainName;
        uint256 estimatedValue;     // USD
        uint256 lastAppraisal;
    }

    mapping(bytes32 => NFTHolding) public nftHoldings;
    bytes32[] public nftIds;

    // Recent transactions for dashboard
    struct Transaction {
        bytes32 txId;
        string txType;              // "deposit", "mint", "burn", "trade"
        address actor;
        uint256 amount;
        uint256 value;              // USD
        string chainName;
        uint256 timestamp;
    }

    Transaction[] public recentTxs;
    uint256 public maxTxHistoryLength = 500;

    // Donation addresses across chains
    struct DonationAddress {
        string chainName;
        string address_;
        string qrCode;              // IPFS hash or URL
        bool active;
    }

    mapping(string => DonationAddress) public donationAddresses;
    string[] public donationChains;

    // ============ Events ============

    event ReserveUpdated(
        uint256 chainId,
        string chainName,
        uint256 nativeBalance,
        uint256 usdValue,
        uint256 timestamp
    );

    event TallyMinted(
        bytes32 indexed mintId,
        address indexed recipient,
        uint256 donationUSD,
        uint256 tallyAmount,
        uint256 pricePerTally,
        uint256 timestamp
    );

    event TallyBurned(
        address indexed burner,
        uint256 tallyAmount,
        string reason,
        uint256 timestamp
    );

    event SlippageDetected(
        uint256 slippagePercent,
        uint256 timestamp
    );

    event PriceSnapshot(
        uint256 tallyPrice,
        uint256 circulating,
        uint256 reserved
    );

    event TransactionRecorded(
        bytes32 indexed txId,
        string txType,
        address indexed actor,
        uint256 timestamp
    );

    event NFTAdded(
        bytes32 indexed nftId,
        address nftContract,
        uint256 tokenId,
        uint256 estimatedValue
    );

    event DonationAddressAdded(
        string chainName,
        string address_
    );

    // ============ Modifiers ============

    modifier onlyOperator() {
        require(msg.sender == owner(), "Not operator");
        _;
    }

    // ============ Constructor ============

    constructor(address _tally) Ownable(msg.sender) {
        tallyToken = IERC20(_tally);
        tallyMetrics.lastUpdate = block.timestamp;
    }

    // ============ Reserve Update Functions ============

    /**
     * @notice Update reserve balance for a chain
     * @param _chainId Chain identifier
     * @param _chainName Human-readable chain name
     * @param _nativeBalance Native token balance
     * @param _usdValue USD value of holdings
     */
    function updateChainReserve(
        uint256 _chainId,
        string memory _chainName,
        uint256 _nativeBalance,
        uint256 _usdValue
    ) external onlyOperator nonReentrant {
        if (!chainReserves[_chainId].active) {
            activeChainIds.push(_chainId);
            chainReserves[_chainId].nativeToken = address(0); // Placeholder
        }

        chainReserves[_chainId] = ChainReserve({
            chainName: _chainName,
            nativeToken: chainReserves[_chainId].nativeToken,
            nativeBalance: _nativeBalance,
            usdValue: _usdValue,
            lastUpdate: block.timestamp,
            active: true
        });

        // Trigger price snapshot
        _takeSnapshot();

        emit ReserveUpdated(_chainId, _chainName, _nativeBalance, _usdValue, block.timestamp);
    }

    /**
     * @notice Record a mint operation (donation → TALLY issuance)
     * @param _recipient User receiving TALLY
     * @param _donationUSD USD value of donation
     * @param _tallyAmount TALLY tokens issued
     */
    function recordMintOperation(
        address _recipient,
        uint256 _donationUSD,
        uint256 _tallyAmount
    ) external onlyOperator returns (bytes32 mintId) {
        require(_recipient != address(0), "Invalid recipient");
        require(_donationUSD > 0, "Invalid donation");
        require(_tallyAmount > 0, "Invalid TALLY amount");

        // Generate mint ID
        mintId = keccak256(abi.encodePacked(
            _recipient,
            _donationUSD,
            block.timestamp
        ));

        // Calculate price at mint time
        uint256 pricePerTally = _donationUSD * 10**18 / _tallyAmount;

        // Record operation
        mintOps[mintId] = MintOperation({
            mintId: mintId,
            recipient: _recipient,
            donationAmount: _donationUSD,
            tallyMinted: _tallyAmount,
            priceAtMint: pricePerTally,
            timestamp: block.timestamp,
            completed: true
        });

        // Track recent mints (keep last 100)
        recentMints.push(mintId);
        if (recentMints.length > 100) {
            recentMints = _popOldest(recentMints);
        }

        // Update metrics
        tallyMetrics.totalSupply += _tallyAmount;
        tallyMetrics.circulating += _tallyAmount;
        tallyMetrics.lastUpdate = block.timestamp;

        // Check for slippage
        _checkSlippage(pricePerTally);

        // Record transaction
        _recordTransaction("mint", _recipient, _tallyAmount, _donationUSD);

        emit TallyMinted(
            mintId,
            _recipient,
            _donationUSD,
            _tallyAmount,
            pricePerTally,
            block.timestamp
        );

        return mintId;
    }

    /**
     * @notice Record TALLY burn for service/trust
     * @param _burner User burning TALLY
     * @param _amount TALLY amount burned
     * @param _reason Reason for burn (service type)
     */
    function burnTally(
        address _burner,
        uint256 _amount,
        string memory _reason
    ) external onlyOperator nonReentrant {
        require(_amount > 0, "Invalid amount");

        // Update metrics
        tallyMetrics.burned += _amount;
        tallyMetrics.circulating -= _amount;
        tallyMetrics.lastUpdate = block.timestamp;

        // Record transaction
        _recordTransaction("burn", _burner, _amount, 0);

        emit TallyBurned(_burner, _amount, _reason, block.timestamp);
    }

    // ============ Slippage Protection ============

    /**
     * @notice Check for excessive slippage
     */
    function _checkSlippage(uint256 _currentPrice) internal {
        if (priceHistory.length == 0) return;

        PriceSnapshot storage lastSnapshot = priceHistory[priceHistory.length - 1];
        if (lastSnapshot.tallyPrice == 0) return;

        // Calculate price change percentage
        uint256 change = _currentPrice > lastSnapshot.tallyPrice ?
            (_currentPrice - lastSnapshot.tallyPrice) * 10000 / lastSnapshot.tallyPrice :
            (lastSnapshot.tallyPrice - _currentPrice) * 10000 / lastSnapshot.tallyPrice;

        if (change > maxAcceptableSlippage) {
            lastSlippageAlert = block.timestamp;
            emit SlippageDetected(change, block.timestamp);
        }
    }

    /**
     * @notice Take price snapshot for history
     */
    function _takeSnapshot() internal {
        uint256 totalReserve = getTotalReserveUSD();
        uint256 circulating = tallyMetrics.circulating;
        uint256 reserved = tallyMetrics.reserved;

        uint256 pricePerTally = circulating > 0 ?
            (totalReserve * 10**18) / circulating :
            10**18; // $1 baseline

        priceHistory.push(PriceSnapshot({
            timestamp: block.timestamp,
            tallyPrice: pricePerTally,
            circulating: circulating,
            reserved: reserved
        }));

        // Keep only recent snapshots
        if (priceHistory.length > maxPriceHistoryLength) {
            // Remove oldest
            for (uint256 i = 0; i < priceHistory.length - 1; i++) {
                priceHistory[i] = priceHistory[i + 1];
            }
            priceHistory.pop();
        }

        emit PriceSnapshot(pricePerTally, circulating, reserved);
    }

    // ============ NFT Holdings ============

    /**
     * @notice Add or update NFT holding
     */
    function addNFTHolding(
        address _nftContract,
        uint256 _tokenId,
        string memory _chainName,
        uint256 _estimatedValue
    ) external onlyOperator returns (bytes32 nftId) {
        nftId = keccak256(abi.encodePacked(_nftContract, _tokenId));

        if (nftHoldings[nftId].nftContract == address(0)) {
            nftIds.push(nftId);
        }

        nftHoldings[nftId] = NFTHolding({
            nftContract: _nftContract,
            tokenId: _tokenId,
            chainName: _chainName,
            estimatedValue: _estimatedValue,
            lastAppraisal: block.timestamp
        });

        emit NFTAdded(nftId, _nftContract, _tokenId, _estimatedValue);

        return nftId;
    }

    // ============ Donation Addresses ============

    /**
     * @notice Add donation address for a chain
     */
    function addDonationAddress(
        string memory _chainName,
        string memory _address,
        string memory _qrCodeHash
    ) external onlyOperator {
        donationAddresses[_chainName] = DonationAddress({
            chainName: _chainName,
            address_: _address,
            qrCode: _qrCodeHash,
            active: true
        });

        // Track chains
        bool found = false;
        for (uint256 i = 0; i < donationChains.length; i++) {
            if (keccak256(bytes(donationChains[i])) == keccak256(bytes(_chainName))) {
                found = true;
                break;
            }
        }
        if (!found) {
            donationChains.push(_chainName);
        }

        emit DonationAddressAdded(_chainName, _address);
    }

    // ============ View Functions ============

    /**
     * @notice Get total reserve value across all chains
     */
    function getTotalReserveUSD() public view returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < activeChainIds.length; i++) {
            total += chainReserves[activeChainIds[i]].usdValue;
        }
        return total;
    }

    /**
     * @notice Get current TALLY price in USD
     */
    function getTallyPrice() public view returns (uint256) {
        uint256 totalReserve = getTotalReserveUSD();
        uint256 circulating = tallyMetrics.circulating;

        if (circulating == 0) return 10**18; // $1 baseline

        return (totalReserve * 10**18) / circulating;
    }

    /**
     * @notice Get reserve health metrics
     */
    function getReserveHealth() external view returns (
        uint256 totalReserveUSD,
        uint256 tallyPerUSD,
        uint256 backingRatio,
        bool isHealthy
    ) {
        uint256 reserve = getTotalReserveUSD();
        uint256 circulating = tallyMetrics.circulating;
        uint256 price = getTallyPrice();

        uint256 backing = circulating > 0 ?
            (reserve * 10000) / circulating :
            10000;

        bool healthy = backing >= 9000; // At least 0.9x backing

        return (
            reserve,
            price,
            backing,
            healthy
        );
    }

    /**
     * @notice Get all chain reserves
     */
    function getChainReserves() external view returns (
        string[] memory chainNames,
        uint256[] memory usdValues,
        uint256[] memory lastUpdates
    ) {
        uint256 count = activeChainIds.length;
        chainNames = new string[](count);
        usdValues = new uint256[](count);
        lastUpdates = new uint256[](count);

        for (uint256 i = 0; i < count; i++) {
            uint256 chainId = activeChainIds[i];
            ChainReserve storage chain = chainReserves[chainId];
            chainNames[i] = chain.chainName;
            usdValues[i] = chain.usdValue;
            lastUpdates[i] = chain.lastUpdate;
        }

        return (chainNames, usdValues, lastUpdates);
    }

    /**
     * @notice Get TALLY metrics
     */
    function getTallyMetrics() external view returns (
        uint256 totalSupply,
        uint256 circulating,
        uint256 burned,
        uint256 reserved
    ) {
        return (
            tallyMetrics.totalSupply,
            tallyMetrics.circulating,
            tallyMetrics.burned,
            tallyMetrics.reserved
        );
    }

    /**
     * @notice Get NFT holdings count
     */
    function getNFTCount() external view returns (uint256) {
        return nftIds.length;
    }

    /**
     * @notice Get NFT holding
     */
    function getNFT(bytes32 _nftId) external view returns (
        address nftContract,
        uint256 tokenId,
        string memory chainName,
        uint256 estimatedValue,
        uint256 lastAppraisal
    ) {
        NFTHolding storage nft = nftHoldings[_nftId];
        return (
            nft.nftContract,
            nft.tokenId,
            nft.chainName,
            nft.estimatedValue,
            nft.lastAppraisal
        );
    }

    /**
     * @notice Get donation address for chain
     */
    function getDonationAddress(string memory _chainName) external view returns (
        string memory address_,
        string memory qrCode,
        bool active
    ) {
        DonationAddress storage addr = donationAddresses[_chainName];
        return (addr.address_, addr.qrCode, addr.active);
    }

    /**
     * @notice Get recent mints
     */
    function getRecentMints(uint256 _count) external view returns (bytes32[] memory) {
        uint256 len = recentMints.length > _count ? _count : recentMints.length;
        bytes32[] memory recent = new bytes32[](len);

        for (uint256 i = 0; i < len; i++) {
            recent[i] = recentMints[recentMints.length - 1 - i];
        }

        return recent;
    }

    /**
     * @notice Get price history
     */
    function getPriceHistory() external view returns (PriceSnapshot[] memory) {
        return priceHistory;
    }

    /**
     * @notice Get recent transactions
     */
    function getRecentTransactions(uint256 _count) external view returns (Transaction[] memory) {
        uint256 len = recentTxs.length > _count ? _count : recentTxs.length;
        Transaction[] memory recent = new Transaction[](len);

        for (uint256 i = 0; i < len; i++) {
            recent[i] = recentTxs[recentTxs.length - 1 - i];
        }

        return recent;
    }

    // ============ Internal Helper Functions ============

    /**
     * @notice Record transaction for dashboard
     */
    function _recordTransaction(
        string memory _type,
        address _actor,
        uint256 _amount,
        uint256 _value
    ) internal {
        bytes32 txId = keccak256(abi.encodePacked(
            _actor,
            _amount,
            block.timestamp
        ));

        recentTxs.push(Transaction({
            txId: txId,
            txType: _type,
            actor: _actor,
            amount: _amount,
            value: _value,
            chainName: "ethereum", // Would be dynamic
            timestamp: block.timestamp
        }));

        if (recentTxs.length > maxTxHistoryLength) {
            // Shift array
            for (uint256 i = 0; i < recentTxs.length - 1; i++) {
                recentTxs[i] = recentTxs[i + 1];
            }
            recentTxs.pop();
        }

        emit TransactionRecorded(txId, _type, _actor, block.timestamp);
    }

    /**
     * @notice Remove oldest element from array
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
     * @notice Update max acceptable slippage
     */
    function setMaxSlippage(uint256 _slippageBps) external onlyOperator {
        require(_slippageBps > 0 && _slippageBps <= 1000, "Invalid slippage");
        maxAcceptableSlippage = _slippageBps;
    }

    /**
     * @notice Update reserved TALLY amount
     */
    function setReservedTally(uint256 _amount) external onlyOperator {
        tallyMetrics.reserved = _amount;
        tallyMetrics.lastUpdate = block.timestamp;
    }
}
