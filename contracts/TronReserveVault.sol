// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title TronReserveVault
 * @notice Convergence Protocol v4: Tron Network Reserve Management
 * @dev Manages TRX and TRC20/TRC721 assets on Tron blockchain
 */
contract TronReserveVault is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ State Variables ============

    // Tally token (for minting on Ethereum side)
    address public tallyTokenBridge;

    // Approved TRC20 tokens
    mapping(address => bool) public approvedTokens;

    // Reserve balances
    uint256 public totalTRXBalance;
    mapping(address => uint256) public trc20Balance;

    // TRC721 NFT support (donated NFTs)
    mapping(address => mapping(uint256 => bool)) public hostedNFTs;

    // Target allocation for Tron
    uint256 public targetTronPercent = 1000; // 10% of total reserves

    // Multi-sig signers for Tron
    address[3] public multiSigSigners;
    mapping(bytes32 => mapping(address => bool)) public signatures;

    // Pending operations
    struct PendingOperation {
        bytes32 opId;
        string opType; // "withdraw", "transfer", "nft-accept"
        uint256 amount;
        address token;
        address recipient;
        uint256 timestamp;
        uint256 sigCount;
        bool executed;
    }

    mapping(bytes32 => PendingOperation) public pendingOps;

    // ============ Events ============

    event TRXDeposited(
        address indexed depositor,
        uint256 amount,
        uint256 tallyMinted
    );

    event TRC20Deposited(
        address indexed depositor,
        address indexed token,
        uint256 amount
    );

    event TRC721Received(
        address indexed nftContract,
        uint256 tokenId,
        string nftCollection
    );

    event WithdrawalQueued(
        bytes32 indexed opId,
        address indexed token,
        uint256 amount,
        address recipient
    );

    event WithdrawalExecuted(
        bytes32 indexed opId,
        address recipient,
        uint256 amount
    );

    event TokenApproved(address indexed token);
    event ReserveRebalanced(uint256 newTRXBalance);

    // ============ Modifiers ============

    modifier onlyMultiSig() {
        require(isMultiSigSigner(msg.sender), "Not a multi-sig signer");
        _;
    }

    // ============ Constructor ============

    constructor(
        address _tallyBridge,
        address[3] memory _signers
    ) Ownable(msg.sender) {
        tallyTokenBridge = _tallyBridge;
        multiSigSigners = _signers;
    }

    // ============ Deposit Functions ============

    /**
     * @notice Deposit TRX to reserve (payable)
     */
    receive() external payable nonReentrant {
        require(msg.value > 0, "No TRX sent");

        // Update reserve
        totalTRXBalance += msg.value;

        // In production: would call bridge to mint TALLY on Ethereum
        // For now: emit event and track

        emit TRXDeposited(msg.sender, msg.value, msg.value); // 1:1 ratio
    }

    /**
     * @notice Deposit TRC20 token to reserve
     * @param _token TRC20 token address
     * @param _amount Amount to deposit
     */
    function depositTRC20(address _token, uint256 _amount) external nonReentrant {
        require(approvedTokens[_token], "Token not approved");
        require(_amount > 0, "Invalid amount");

        // Transfer token to vault
        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);

        // Update balance
        trc20Balance[_token] += _amount;

        emit TRC20Deposited(msg.sender, _token, _amount);
    }

    /**
     * @notice Receive TRC721 NFT donation
     * @param _nftContract TRC721 contract
     * @param _tokenId Token ID
     * @param _collectionName Collection name
     */
    function receiveNFT(
        address _nftContract,
        uint256 _tokenId,
        string memory _collectionName
    ) external nonReentrant {
        require(_nftContract != address(0), "Invalid NFT contract");

        // In Tron, would transfer NFT using TRC721 standard
        // This is placeholder for the mechanism

        hostedNFTs[_nftContract][_tokenId] = true;

        emit TRC721Received(_nftContract, _tokenId, _collectionName);
    }

    // ============ Withdrawal Functions ============

    /**
     * @notice Queue withdrawal of funds (requires multi-sig)
     * @param _token Token address (address(0) for TRX)
     * @param _amount Amount to withdraw
     * @param _recipient Recipient address
     */
    function queueWithdrawal(
        address _token,
        uint256 _amount,
        address _recipient
    ) external onlyMultiSig returns (bytes32 opId) {
        require(_recipient != address(0), "Invalid recipient");
        require(_amount > 0, "Invalid amount");

        // Verify balance
        if (_token == address(0)) {
            require(totalTRXBalance >= _amount, "Insufficient TRX");
        } else {
            require(trc20Balance[_token] >= _amount, "Insufficient token");
        }

        // Generate op ID
        opId = keccak256(abi.encodePacked(
            msg.sender,
            _token,
            _amount,
            _recipient,
            block.timestamp
        ));

        // Create pending operation
        pendingOps[opId] = PendingOperation({
            opId: opId,
            opType: "withdraw",
            amount: _amount,
            token: _token,
            recipient: _recipient,
            timestamp: block.timestamp,
            sigCount: 1,
            executed: false
        });

        signatures[opId][msg.sender] = true;

        emit WithdrawalQueued(opId, _token, _amount, _recipient);

        return opId;
    }

    /**
     * @notice Sign a pending withdrawal (multi-sig)
     * @param _opId Operation ID
     */
    function signWithdrawal(bytes32 _opId) external onlyMultiSig {
        PendingOperation storage op = pendingOps[_opId];
        require(op.timestamp > 0, "Operation not found");
        require(!op.executed, "Already executed");
        require(!signatures[_opId][msg.sender], "Already signed");

        signatures[_opId][msg.sender] = true;
        op.sigCount += 1;
    }

    /**
     * @notice Execute withdrawal after multi-sig approval (2-of-3)
     * @param _opId Operation ID
     */
    function executeWithdrawal(bytes32 _opId) external onlyOwner nonReentrant {
        PendingOperation storage op = pendingOps[_opId];
        require(op.timestamp > 0, "Operation not found");
        require(!op.executed, "Already executed");
        require(op.sigCount >= 2, "Insufficient signatures");

        op.executed = true;

        // Execute withdrawal
        if (op.token == address(0)) {
            // Withdraw TRX
            require(address(this).balance >= op.amount, "Insufficient TRX");
            totalTRXBalance -= op.amount;
            (bool success, ) = payable(op.recipient).call{value: op.amount}("");
            require(success, "TRX transfer failed");
        } else {
            // Withdraw TRC20
            trc20Balance[op.token] -= op.amount;
            IERC20(op.token).safeTransfer(op.recipient, op.amount);
        }

        emit WithdrawalExecuted(_opId, op.recipient, op.amount);
    }

    // ============ Admin Functions ============

    /**
     * @notice Approve TRC20 token for deposits
     */
    function approveToken(address _token) external onlyOwner {
        require(_token != address(0), "Invalid token");
        approvedTokens[_token] = true;
        emit TokenApproved(_token);
    }

    /**
     * @notice Check if address is multi-sig signer
     */
    function isMultiSigSigner(address _signer) public view returns (bool) {
        return _signer == multiSigSigners[0] ||
               _signer == multiSigSigners[1] ||
               _signer == multiSigSigners[2];
    }

    // ============ View Functions ============

    /**
     * @notice Get reserve status
     */
    function getReserveStatus() external view returns (
        uint256 trxBalance,
        uint256 usdValue,
        string memory status
    ) {
        return (
            totalTRXBalance,
            totalTRXBalance / 10**18, // Simplified: 1 TRX = 1 USD (placeholder)
            "active"
        );
    }

    /**
     * @notice Get TRC20 token balance
     */
    function getTokenBalance(address _token) external view returns (uint256) {
        return trc20Balance[_token];
    }

    /**
     * @notice Check if NFT is hosted
     */
    function isNFTHosted(address _nftContract, uint256 _tokenId) external view returns (bool) {
        return hostedNFTs[_nftContract][_tokenId];
    }
}
