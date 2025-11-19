// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ReserveVault
 * @notice 3rd Leg of the Trinity - Algorithmic Reserve Manager
 * @dev Holds assets (ETH, tokens, NFTs), mints TALLY against deposits
 *      One-way accumulation: assets in, TALLY out. No redemption.
 *      Users burn TALLY for Trust tokens (separate mechanism).
 */
contract ReserveVault is Ownable, ReentrancyGuard, IERC721Receiver {
    using SafeERC20 for IERC20;

    // ============ State Variables ============

    // TALLY token contract (minted when assets deposited)
    IReserveTally public tallyToken;

    // Trust token contract (for spam NFT burns)
    ITrustToken public trustToken;

    // Price oracle for asset valuation
    IPriceOracle public priceOracle;

    // Approved assets for reserve
    mapping(address => bool) public approvedTokens;

    // Reserve balances per token
    mapping(address => uint256) public reserveBalance;

    // Total reserve value in USD (18 decimals)
    uint256 public totalReserveValueUSD;

    // Target allocation percentages (basis points, 10000 = 100%)
    uint256 public targetStablePercent = 6500;  // 65% stables
    uint256 public targetBTCPercent = 1750;     // 17.5% BTC
    uint256 public targetETHPercent = 1250;     // 12.5% ETH
    uint256 public targetOtherPercent = 500;    // 5% other

    // Asset categories
    mapping(address => AssetCategory) public assetCategory;

    enum AssetCategory {
        NONE,
        STABLE,
        BTC,
        ETH,
        OTHER
    }

    // Trust rewards for spam NFT burning
    uint256 public trustPerSpamNFT = 10 * 10**18; // 10 TRUST per spam burn

    // AI Agent address for autonomous operations
    address public aiAgent;

    // Threshold for AI-only operations (in USD, 18 decimals)
    uint256 public aiAutonomousThreshold = 1000 * 10**18; // $1000

    // Pending operations queue (for timelock)
    struct PendingOperation {
        bytes32 operationHash;
        uint256 executeAfter;
        bool executed;
    }

    mapping(bytes32 => PendingOperation) public pendingOperations;
    uint256 public timelockDuration = 24 hours;

    // ============ Events ============

    event AssetDeposited(
        address indexed depositor,
        address indexed token,
        uint256 amount,
        uint256 tallyMinted,
        uint256 usdValue
    );

    event ETHDeposited(
        address indexed depositor,
        uint256 amount,
        uint256 tallyMinted,
        uint256 usdValue
    );

    event SpamNFTBurned(
        address indexed depositor,
        address indexed nftContract,
        uint256 tokenId,
        uint256 trustMinted
    );

    event ValuableNFTDeposited(
        address indexed depositor,
        address indexed nftContract,
        uint256 tokenId
    );

    event TokenApproved(address indexed token, AssetCategory category);
    event TokenRemoved(address indexed token);
    event AIAgentUpdated(address indexed newAgent);
    event ThresholdUpdated(uint256 newThreshold);
    event TimelockUpdated(uint256 newDuration);
    event OperationQueued(bytes32 indexed opHash, uint256 executeAfter);
    event OperationExecuted(bytes32 indexed opHash);
    event ReserveRebalanced(address indexed token, uint256 amount, bool incoming);

    // ============ Modifiers ============

    modifier onlyAIAgent() {
        require(msg.sender == aiAgent, "Only AI agent");
        _;
    }

    modifier onlyOwnerOrAgent() {
        require(msg.sender == owner() || msg.sender == aiAgent, "Not authorized");
        _;
    }

    // ============ Constructor ============

    constructor(
        address _tallyToken,
        address _trustToken,
        address _priceOracle,
        address _aiAgent
    ) Ownable(msg.sender) {
        tallyToken = IReserveTally(_tallyToken);
        trustToken = ITrustToken(_trustToken);
        priceOracle = IPriceOracle(_priceOracle);
        aiAgent = _aiAgent;
    }

    // ============ Deposit Functions ============

    /**
     * @notice Deposit ETH to reserve, receive TALLY
     */
    function depositETH() external payable nonReentrant {
        require(msg.value > 0, "No ETH sent");

        // Get USD value from oracle
        uint256 usdValue = priceOracle.getETHPrice() * msg.value / 10**18;

        // Mint TALLY 1:1 with USD value
        uint256 tallyToMint = usdValue;
        tallyToken.mint(msg.sender, tallyToMint);

        // Update reserve tracking
        reserveBalance[address(0)] += msg.value; // address(0) = ETH
        totalReserveValueUSD += usdValue;

        emit ETHDeposited(msg.sender, msg.value, tallyToMint, usdValue);
    }

    /**
     * @notice Deposit approved ERC20 token to reserve, receive TALLY
     * @param token Token address
     * @param amount Amount to deposit
     */
    function depositToken(address token, uint256 amount) external nonReentrant {
        require(approvedTokens[token], "Token not approved");
        require(amount > 0, "Amount must be positive");

        // Transfer token to vault
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        // Get USD value from oracle
        uint256 usdValue = priceOracle.getTokenPrice(token) * amount / 10**18;

        // Mint TALLY 1:1 with USD value
        uint256 tallyToMint = usdValue;
        tallyToken.mint(msg.sender, tallyToMint);

        // Update reserve tracking
        reserveBalance[token] += amount;
        totalReserveValueUSD += usdValue;

        emit AssetDeposited(msg.sender, token, amount, tallyToMint, usdValue);
    }

    /**
     * @notice Burn spam NFT for Trust tokens (no reserve value)
     * @param nftContract NFT contract address
     * @param tokenId Token ID to burn
     */
    function burnSpamNFT(address nftContract, uint256 tokenId) external nonReentrant {
        // Transfer NFT to this contract (will be held/burned)
        IERC721(nftContract).safeTransferFrom(msg.sender, address(this), tokenId);

        // Mint Trust tokens to depositor
        trustToken.mint(msg.sender, trustPerSpamNFT, "Spam NFT burn");

        emit SpamNFTBurned(msg.sender, nftContract, tokenId, trustPerSpamNFT);
    }

    /**
     * @notice Deposit valuable NFT (needs to be sold before counting toward reserve)
     * @param nftContract NFT contract address
     * @param tokenId Token ID
     */
    function depositValuableNFT(address nftContract, uint256 tokenId) external nonReentrant {
        // Transfer NFT to this contract
        IERC721(nftContract).safeTransferFrom(msg.sender, address(this), tokenId);

        // NFT is held but not valued until sold
        // TODO: Integrate with marketplace for listing

        emit ValuableNFTDeposited(msg.sender, nftContract, tokenId);
    }

    // ============ Admin Functions ============

    /**
     * @notice Approve token for reserve deposits
     * @param token Token address
     * @param category Asset category for allocation tracking
     */
    function approveToken(address token, AssetCategory category) external onlyOwner {
        require(category != AssetCategory.NONE, "Invalid category");
        approvedTokens[token] = true;
        assetCategory[token] = category;
        emit TokenApproved(token, category);
    }

    /**
     * @notice Remove token from approved list
     */
    function removeToken(address token) external onlyOwner {
        approvedTokens[token] = false;
        assetCategory[token] = AssetCategory.NONE;
        emit TokenRemoved(token);
    }

    /**
     * @notice Update AI agent address
     */
    function setAIAgent(address _aiAgent) external onlyOwner {
        aiAgent = _aiAgent;
        emit AIAgentUpdated(_aiAgent);
    }

    /**
     * @notice Update autonomous threshold
     */
    function setAutonomousThreshold(uint256 _threshold) external onlyOwner {
        aiAutonomousThreshold = _threshold;
        emit ThresholdUpdated(_threshold);
    }

    /**
     * @notice Update timelock duration
     */
    function setTimelockDuration(uint256 _duration) external onlyOwner {
        timelockDuration = _duration;
        emit TimelockUpdated(_duration);
    }

    /**
     * @notice Update target allocations
     */
    function setTargetAllocations(
        uint256 _stable,
        uint256 _btc,
        uint256 _eth,
        uint256 _other
    ) external onlyOwner {
        require(_stable + _btc + _eth + _other == 10000, "Must sum to 100%");
        targetStablePercent = _stable;
        targetBTCPercent = _btc;
        targetETHPercent = _eth;
        targetOtherPercent = _other;
    }

    /**
     * @notice Update trust per spam NFT
     */
    function setTrustPerSpamNFT(uint256 _amount) external onlyOwner {
        trustPerSpamNFT = _amount;
    }

    // ============ AI Agent Operations ============

    /**
     * @notice AI agent queues operation for timelock (above threshold)
     */
    function queueOperation(bytes32 opHash) external onlyAIAgent {
        require(pendingOperations[opHash].executeAfter == 0, "Already queued");

        uint256 executeAfter = block.timestamp + timelockDuration;
        pendingOperations[opHash] = PendingOperation({
            operationHash: opHash,
            executeAfter: executeAfter,
            executed: false
        });

        emit OperationQueued(opHash, executeAfter);
    }

    /**
     * @notice Execute queued operation after timelock
     */
    function executeOperation(bytes32 opHash) external onlyOwnerOrAgent {
        PendingOperation storage op = pendingOperations[opHash];
        require(op.executeAfter > 0, "Not queued");
        require(block.timestamp >= op.executeAfter, "Timelock not expired");
        require(!op.executed, "Already executed");

        op.executed = true;
        emit OperationExecuted(opHash);

        // Actual execution logic would be here
        // For now, marking as executed allows off-chain verification
    }

    // ============ View Functions ============

    /**
     * @notice Get current reserve allocation percentages
     */
    function getCurrentAllocations() external view returns (
        uint256 stablePercent,
        uint256 btcPercent,
        uint256 ethPercent,
        uint256 otherPercent
    ) {
        if (totalReserveValueUSD == 0) {
            return (0, 0, 0, 0);
        }

        // This would sum up values per category
        // Simplified for now - would need oracle calls
        return (0, 0, 0, 0);
    }

    /**
     * @notice Check if reserve needs rebalancing
     */
    function needsRebalancing() external view returns (bool) {
        // Would compare current vs target allocations
        // Return true if any category is >5% off target
        return false;
    }

    /**
     * @notice Get reserve health metrics
     */
    function getReserveHealth() external view returns (
        uint256 totalValueUSD,
        uint256 tallySupply,
        uint256 backingRatio
    ) {
        totalValueUSD = totalReserveValueUSD;
        tallySupply = tallyToken.totalSupply();

        if (tallySupply == 0) {
            backingRatio = 0;
        } else {
            backingRatio = (totalValueUSD * 10000) / tallySupply;
        }
    }

    // ============ ERC721 Receiver ============

    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    // ============ Emergency Functions ============

    /**
     * @notice Emergency pause - owner only
     */
    function pause() external onlyOwner {
        // Would integrate with Pausable
    }

    /**
     * @notice Receive ETH
     */
    receive() external payable {
        // Accept ETH transfers
    }
}

// ============ Interfaces ============

interface IReserveTally {
    function mint(address to, uint256 amount) external;
    function burn(address from, uint256 amount) external;
    function totalSupply() external view returns (uint256);
}

interface ITrustToken {
    function mint(address to, uint256 amount, string memory reason) external;
}

interface IPriceOracle {
    function getETHPrice() external view returns (uint256);
    function getTokenPrice(address token) external view returns (uint256);
}
