// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title BitcoinReserveVault
 * @notice v3 Enhancement: Native Bitcoin Reserve Management
 * @dev Manages Bitcoin held in hardware wallet (Nano X: bc1qg9gvc63lj7ssdenjnem6kycpxde5u7fheypgpm)
 *      Coordinates with Ethereum smart contracts for TALLY minting
 *      Handles cross-chain bridge operations
 */
contract BitcoinReserveVault is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ State Variables ============

    // TALLY token contract
    IERC20 public tallyToken;

    // Bitcoin Oracle for price feeds
    IBitcoinPriceOracle public bitcoinOracle;

    // Hardware Wallet address (Nano X)
    string public constant HARDWARE_WALLET = "bc1qg9gvc63lj7ssdenjnem6kycpxde5u7fheypgpm";

    // Bitcoin reserve tracking (in satoshis, 1 BTC = 100,000,000 sats)
    uint256 public totalBitcoinSatoshis;

    // Reserve value in USD (18 decimals)
    uint256 public totalReserveValueUSD;

    // Minimum confirmations for deposit validity
    uint256 public minConfirmations = 3;

    // Bridge contract address (for WBTC ↔ BTC swaps)
    address public crossChainBridge;

    // Target allocation for Bitcoin (in basis points, 10000 = 100%)
    uint256 public targetBitcoinPercent = 4500; // 45% target

    // Bitcoin deposits tracking
    struct BitcoinDeposit {
        string bitcoinTxHash;
        string bitcoinAddress;
        uint256 satoshis;
        uint256 valueUSD;
        uint256 confirmations;
        uint256 timestamp;
        address ethereumRecipient;
        bool verified;
        uint256 tallyMinted;
    }

    mapping(string => BitcoinDeposit) public bitcoinDeposits;
    string[] public depositTxHashes;

    // Pending Bitcoin operations
    struct PendingBitcoinOp {
        bytes32 operationId;
        string operationType; // "deposit", "withdraw", "rebalance"
        uint256 amount;
        string bitcoinAddress;
        address ethereumAddress;
        uint256 timestamp;
        bool requiresMultiSig;
        uint256 signaturesCollected;
        bool executed;
    }

    mapping(bytes32 => PendingBitcoinOp) public pendingOps;

    // Bridge operations (WBTC ↔ BTC swaps)
    struct BridgeSwap {
        bytes32 swapId;
        address user;
        uint256 wbtcAmount;
        uint256 bitcoinSatoshis;
        bool toBitcoin;
        uint256 timestamp;
        string bitcoinTxHash;
        bool completed;
    }

    mapping(bytes32 => BridgeSwap) public bridgeSwaps;

    // Multi-sig signers
    address[3] public multiSigSigners;
    mapping(bytes32 => mapping(address => bool)) public signatures;

    // ============ Events ============

    event BitcoinDepositRecorded(
        string indexed txHash,
        string bitcoinAddress,
        uint256 satoshis,
        uint256 valueUSD,
        address ethereumRecipient
    );

    event BitcoinDepositConfirmed(
        string indexed txHash,
        uint256 confirmations,
        uint256 tallyMinted
    );

    event BridgeSwapInitiated(
        bytes32 indexed swapId,
        address indexed user,
        uint256 amount,
        bool toBitcoin,
        uint256 timestamp
    );

    event BridgeSwapCompleted(
        bytes32 indexed swapId,
        string bitcoinTxHash,
        uint256 timestamp
    );

    event BitcoinOperationQueued(
        bytes32 indexed operationId,
        string operationType,
        uint256 amount
    );

    event BitcoinOperationExecuted(
        bytes32 indexed operationId,
        bool success
    );

    event MinConfirmationsUpdated(uint256 newMinConfirmations);
    event TargetAllocationUpdated(uint256 newTargetPercent);
    event BridgeContractUpdated(address newBridge);

    // ============ Modifiers ============

    modifier onlyMultiSig() {
        require(isMultiSigSigner(msg.sender), "Not a multi-sig signer");
        _;
    }

    modifier validBitcoinAddress(string memory addr) {
        require(bytes(addr).length > 0, "Invalid Bitcoin address");
        // Further validation would be done off-chain or via oracle
        _;
    }

    // ============ Constructor ============

    constructor(
        address _tallyToken,
        address _bitcoinOracle,
        address[3] memory _multiSigSigners
    ) Ownable(msg.sender) {
        tallyToken = IERC20(_tallyToken);
        bitcoinOracle = IBitcoinPriceOracle(_bitcoinOracle);
        multiSigSigners = _multiSigSigners;
    }

    // ============ Bitcoin Deposit Functions ============

    /**
     * @notice Record a Bitcoin deposit to the reserve
     * @param _txHash Bitcoin transaction hash
     * @param _bitcoinAddress Bitcoin address that sent the funds
     * @param _satoshis Amount of satoshis deposited
     * @param _confirmations Current block confirmations
     * @param _ethereumRecipient Ethereum address to receive TALLY
     */
    function recordBitcoinDeposit(
        string memory _txHash,
        string memory _bitcoinAddress,
        uint256 _satoshis,
        uint256 _confirmations,
        address _ethereumRecipient
    ) external onlyOwner validBitcoinAddress(_bitcoinAddress) nonReentrant {
        require(_satoshis > 0, "Invalid satoshi amount");
        require(_ethereumRecipient != address(0), "Invalid recipient");
        require(bitcoinDeposits[_txHash].timestamp == 0, "Deposit already recorded");

        // Get current BTC price
        uint256 btcPriceUSD = bitcoinOracle.getBTCPriceUSD();
        require(btcPriceUSD > 0, "Invalid BTC price");

        // Calculate USD value: satoshis * BTC_price / 100,000,000
        uint256 valueUSD = (_satoshis * btcPriceUSD) / 100_000_000;

        // Record deposit
        bitcoinDeposits[_txHash] = BitcoinDeposit({
            bitcoinTxHash: _txHash,
            bitcoinAddress: _bitcoinAddress,
            satoshis: _satoshis,
            valueUSD: valueUSD,
            confirmations: _confirmations,
            timestamp: block.timestamp,
            ethereumRecipient: _ethereumRecipient,
            verified: false,
            tallyMinted: 0
        });

        depositTxHashes.push(_txHash);

        emit BitcoinDepositRecorded(
            _txHash,
            _bitcoinAddress,
            _satoshis,
            valueUSD,
            _ethereumRecipient
        );
    }

    /**
     * @notice Confirm a Bitcoin deposit and mint TALLY tokens
     * @param _txHash Bitcoin transaction hash to confirm
     */
    function confirmBitcoinDeposit(string memory _txHash) external onlyOwner nonReentrant {
        BitcoinDeposit storage deposit = bitcoinDeposits[_txHash];
        require(deposit.timestamp > 0, "Deposit not found");
        require(!deposit.verified, "Already verified");
        require(deposit.confirmations >= minConfirmations, "Not enough confirmations");

        // Mark as verified
        deposit.verified = true;

        // Mint TALLY 1:1 with USD value
        uint256 tallyToMint = deposit.valueUSD;
        deposit.tallyMinted = tallyToMint;

        // Update reserve totals
        totalBitcoinSatoshis += deposit.satoshis;
        totalReserveValueUSD += deposit.valueUSD;

        // Mint TALLY to recipient
        require(tallyToken.transfer(deposit.ethereumRecipient, tallyToMint), "TALLY transfer failed");

        emit BitcoinDepositConfirmed(
            _txHash,
            deposit.confirmations,
            tallyToMint
        );
    }

    /**
     * @notice Update confirmation count for a deposit
     * @param _txHash Bitcoin transaction hash
     * @param _confirmations New confirmation count
     */
    function updateConfirmations(
        string memory _txHash,
        uint256 _confirmations
    ) external onlyOwner {
        BitcoinDeposit storage deposit = bitcoinDeposits[_txHash];
        require(deposit.timestamp > 0, "Deposit not found");
        deposit.confirmations = _confirmations;
    }

    // ============ Cross-Chain Bridge Functions ============

    /**
     * @notice Initiate WBTC ↔ Bitcoin bridge swap
     * @param _wbtcAmount WBTC amount (in satoshis, 8 decimals)
     * @param _bitcoinAddress Bitcoin address to receive funds
     * @param _toBitcoin Direction: true = WBTC→BTC, false = BTC→WBTC
     */
    function initiateBridgeSwap(
        uint256 _wbtcAmount,
        string memory _bitcoinAddress,
        bool _toBitcoin
    ) external nonReentrant validBitcoinAddress(_bitcoinAddress) returns (bytes32 swapId) {
        require(crossChainBridge != address(0), "Bridge not configured");
        require(_wbtcAmount > 0, "Invalid amount");

        // Generate swap ID
        swapId = keccak256(abi.encodePacked(msg.sender, block.timestamp, _wbtcAmount));

        // Create bridge swap record
        bridgeSwaps[swapId] = BridgeSwap({
            swapId: swapId,
            user: msg.sender,
            wbtcAmount: _wbtcAmount,
            bitcoinSatoshis: _wbtcAmount, // 1:1 satoshi to satoshi
            toBitcoin: _toBitcoin,
            timestamp: block.timestamp,
            bitcoinTxHash: "",
            completed: false
        });

        emit BridgeSwapInitiated(
            swapId,
            msg.sender,
            _wbtcAmount,
            _toBitcoin,
            block.timestamp
        );

        return swapId;
    }

    /**
     * @notice Complete a bridge swap (called after Bitcoin transaction confirmed)
     * @param _swapId Bridge swap ID
     * @param _bitcoinTxHash Bitcoin transaction hash
     */
    function completeBridgeSwap(
        bytes32 _swapId,
        string memory _bitcoinTxHash
    ) external onlyOwner nonReentrant {
        BridgeSwap storage swap = bridgeSwaps[_swapId];
        require(!swap.completed, "Swap already completed");
        require(swap.timestamp > 0, "Swap not found");

        swap.bitcoinTxHash = _bitcoinTxHash;
        swap.completed = true;

        emit BridgeSwapCompleted(_swapId, _bitcoinTxHash, block.timestamp);
    }

    // ============ Hardware Wallet Multi-Sig Functions ============

    /**
     * @notice Check if address is a multi-sig signer
     */
    function isMultiSigSigner(address _signer) public view returns (bool) {
        return _signer == multiSigSigners[0] ||
               _signer == multiSigSigners[1] ||
               _signer == multiSigSigners[2];
    }

    /**
     * @notice Queue a Bitcoin operation requiring multi-sig approval
     * @param _operationType Type of operation ("deposit", "withdraw", "rebalance")
     * @param _amount Amount in satoshis
     * @param _bitcoinAddress Target Bitcoin address
     */
    function queueBitcoinOperation(
        string memory _operationType,
        uint256 _amount,
        string memory _bitcoinAddress
    ) external onlyMultiSig validBitcoinAddress(_bitcoinAddress) returns (bytes32 opId) {
        require(_amount > 0, "Invalid amount");

        opId = keccak256(abi.encodePacked(msg.sender, block.timestamp, _amount));

        pendingOps[opId] = PendingBitcoinOp({
            operationId: opId,
            operationType: _operationType,
            amount: _amount,
            bitcoinAddress: _bitcoinAddress,
            ethereumAddress: msg.sender,
            timestamp: block.timestamp,
            requiresMultiSig: true,
            signaturesCollected: 1,
            executed: false
        });

        signatures[opId][msg.sender] = true;

        emit BitcoinOperationQueued(opId, _operationType, _amount);

        return opId;
    }

    /**
     * @notice Sign a pending Bitcoin operation (multi-sig)
     * @param _opId Operation ID to sign
     */
    function signBitcoinOperation(bytes32 _opId) external onlyMultiSig {
        PendingBitcoinOp storage op = pendingOps[_opId];
        require(op.timestamp > 0, "Operation not found");
        require(!op.executed, "Already executed");
        require(!signatures[_opId][msg.sender], "Already signed");

        signatures[_opId][msg.sender] = true;
        op.signaturesCollected += 1;
    }

    /**
     * @notice Execute a Bitcoin operation (requires 2-of-3 multi-sig)
     * @param _opId Operation ID to execute
     */
    function executeBitcoinOperation(bytes32 _opId) external onlyOwner nonReentrant {
        PendingBitcoinOp storage op = pendingOps[_opId];
        require(op.timestamp > 0, "Operation not found");
        require(!op.executed, "Already executed");
        require(op.signaturesCollected >= 2, "Insufficient signatures");

        op.executed = true;

        // Operation execution logic would be implemented
        // For now, mark as executed and emit event

        emit BitcoinOperationExecuted(_opId, true);
    }

    // ============ Admin Functions ============

    /**
     * @notice Update minimum confirmations required
     */
    function setMinConfirmations(uint256 _minConfirmations) external onlyOwner {
        require(_minConfirmations > 0 && _minConfirmations <= 100, "Invalid value");
        minConfirmations = _minConfirmations;
        emit MinConfirmationsUpdated(_minConfirmations);
    }

    /**
     * @notice Update target Bitcoin allocation percentage
     */
    function setTargetBitcoinPercent(uint256 _percent) external onlyOwner {
        require(_percent > 0 && _percent <= 10000, "Invalid percentage");
        targetBitcoinPercent = _percent;
        emit TargetAllocationUpdated(_percent);
    }

    /**
     * @notice Set cross-chain bridge contract address
     */
    function setCrossChainBridge(address _bridge) external onlyOwner {
        require(_bridge != address(0), "Invalid bridge address");
        crossChainBridge = _bridge;
        emit BridgeContractUpdated(_bridge);
    }

    /**
     * @notice Update Bitcoin price oracle
     */
    function setBitcoinOracle(address _oracle) external onlyOwner {
        require(_oracle != address(0), "Invalid oracle address");
        bitcoinOracle = IBitcoinPriceOracle(_oracle);
    }

    // ============ View Functions ============

    /**
     * @notice Get current Bitcoin reserve status
     */
    function getBitcoinReserveStatus() external view returns (
        uint256 satoshis,
        uint256 valueUSD,
        uint256 btcCount,
        string memory hardwareWallet
    ) {
        uint256 btcAmount = totalBitcoinSatoshis / 100_000_000; // Convert to BTC
        return (totalBitcoinSatoshis, totalReserveValueUSD, btcAmount, HARDWARE_WALLET);
    }

    /**
     * @notice Get Bitcoin deposit details
     */
    function getBitcoinDeposit(string memory _txHash) external view returns (
        string memory txHash,
        string memory bitcoinAddress,
        uint256 satoshis,
        uint256 valueUSD,
        uint256 confirmations,
        bool verified,
        uint256 tallyMinted
    ) {
        BitcoinDeposit storage deposit = bitcoinDeposits[_txHash];
        return (
            deposit.bitcoinTxHash,
            deposit.bitcoinAddress,
            deposit.satoshis,
            deposit.valueUSD,
            deposit.confirmations,
            deposit.verified,
            deposit.tallyMinted
        );
    }

    /**
     * @notice Get number of recorded deposits
     */
    function getDepositCount() external view returns (uint256) {
        return depositTxHashes.length;
    }

    /**
     * @notice Get bridge swap details
     */
    function getBridgeSwap(bytes32 _swapId) external view returns (
        address user,
        uint256 wbtcAmount,
        bool toBitcoin,
        bool completed,
        string memory bitcoinTxHash
    ) {
        BridgeSwap storage swap = bridgeSwaps[_swapId];
        return (
            swap.user,
            swap.wbtcAmount,
            swap.toBitcoin,
            swap.completed,
            swap.bitcoinTxHash
        );
    }

    /**
     * @notice Get reserve health metrics
     */
    function getReserveHealth() external view returns (
        uint256 totalValueUSD,
        uint256 bitcoinPercent,
        bool isHealthy
    ) {
        uint256 btcPercent = totalReserveValueUSD > 0 ?
            (totalReserveValueUSD * 10000) / totalReserveValueUSD : 0;

        bool healthy = btcPercent >= (targetBitcoinPercent - 500) &&
                      btcPercent <= (targetBitcoinPercent + 500);

        return (totalReserveValueUSD, btcPercent, healthy);
    }
}

// ============ Interfaces ============

interface IBitcoinPriceOracle {
    function getBTCPriceUSD() external view returns (uint256);
    function getETHPriceUSD() external view returns (uint256);
    function getPriceRatio(address token) external view returns (uint256);
}
