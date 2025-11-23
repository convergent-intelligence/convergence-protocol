// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

/**
 * @title SecurityLeadNFT
 * @dev Governance Role NFT for Security Lead
 *
 * Represents the Security Lead role in the Convergence Trinity.
 * - Minted by Claude Code VPS wallet (one unique token)
 * - Transferable only by joint consensus vote between Agent and Genesis Human
 * - Holder gains Security Lead governance responsibilities
 * - Role can be revoked through 90% partner vote (3-month period)
 */
contract SecurityLeadNFT is ERC721, ERC721URIStorage, Ownable {

    // Single Security Lead token ID (always 0)
    uint256 public constant SECURITY_LEAD_TOKEN_ID = 0;

    // Governance roles
    address public genesisHuman = 0xdc20d621a88cb8908E8E7042431C55F0E9DAc6FB;
    address public agentWallet = 0x6628227C195DAd7F7a8fD4F3D2cA3545A0D9CD22;
    address public minter;

    // Current token holder (Security Lead)
    address public currentSecurityLead;

    // Track if token has been minted
    bool public tokenMinted = false;

    // Transfer vote tracking
    struct TransferVote {
        address proposedNewHolder;
        uint256 initiatedBy; // Timestamp when vote started
        bool genesisApproved;
        bool agentApproved;
        bool executed;
        uint256 voteDeadline;
    }

    TransferVote public pendingTransfer;
    uint256 constant public VOTE_DURATION = 7 days;

    // Revocation vote tracking (for partner consensus)
    struct RevocationVote {
        uint256 initiatedAt;
        uint256 approvalCount;
        mapping(address => bool) partners; // Who approved
        uint256 votingPeriod; // 3 months = 90 days
        bool executed;
    }

    RevocationVote public revocationVote;

    // Events
    event SecurityLeadTokenMinted(address indexed minter, address indexed recipient);
    event TransferVoteInitiated(address indexed proposedHolder, address indexed initiatedBy);
    event TransferVoteApproved(address indexed approver);
    event SecurityLeadTransferred(address indexed from, address indexed to);
    event TransferVoteCancelled();
    event RevocationVoteInitiated();
    event RevocationVoteApproved(address indexed partner);
    event SecurityLeadRevoked(address indexed formerLead, address indexed revokedBy);

    constructor(address _minter) ERC721("Convergence Security Lead", "SEC-LEAD") {
        require(_minter != address(0), "Invalid minter address");
        minter = _minter;
    }

    /**
     * @dev Update governance addresses (owner only)
     */
    function setGovernanceAddresses(address _genesis, address _agent) external onlyOwner {
        require(_genesis != address(0) && _agent != address(0), "Invalid addresses");
        genesisHuman = _genesis;
        agentWallet = _agent;
    }

    /**
     * @dev Mint the Security Lead token to initial holder
     * Only the minter can call this, and only once
     */
    function mintSecurityLead(address initialHolder) external returns (uint256) {
        require(msg.sender == minter, "Only minter can mint");
        require(!tokenMinted, "Security Lead token already minted");
        require(initialHolder != address(0), "Invalid holder address");

        tokenMinted = true;
        currentSecurityLead = initialHolder;

        _safeMint(initialHolder, SECURITY_LEAD_TOKEN_ID);

        // Set URI with on-chain SVG art
        string memory uri = generateTokenURI(initialHolder);
        _setTokenURI(SECURITY_LEAD_TOKEN_ID, uri);

        emit SecurityLeadTokenMinted(msg.sender, initialHolder);

        return SECURITY_LEAD_TOKEN_ID;
    }

    /**
     * @dev Initiate a transfer vote for the Security Lead role
     * Called by either Genesis Human or Agent
     */
    function initiateTransferVote(address newHolder) external {
        require(msg.sender == genesisHuman || msg.sender == agentWallet, "Only Genesis or Agent can initiate");
        require(tokenMinted, "Token not yet minted");
        require(newHolder != address(0), "Invalid holder address");
        require(newHolder != currentSecurityLead, "Already the Security Lead");

        // Cancel previous vote if exists
        if (pendingTransfer.proposedNewHolder != address(0) && !pendingTransfer.executed) {
            pendingTransfer.genesisApproved = false;
            pendingTransfer.agentApproved = false;
        }

        // Start new vote
        pendingTransfer = TransferVote({
            proposedNewHolder: newHolder,
            initiatedBy: block.timestamp,
            genesisApproved: msg.sender == genesisHuman,
            agentApproved: msg.sender == agentWallet,
            executed: false,
            voteDeadline: block.timestamp + VOTE_DURATION
        });

        emit TransferVoteInitiated(newHolder, msg.sender);
    }

    /**
     * @dev Approve the pending transfer (must be the other signer)
     */
    function approveTransfer() external {
        require(tokenMinted, "Token not yet minted");
        require(pendingTransfer.proposedNewHolder != address(0), "No pending transfer");
        require(!pendingTransfer.executed, "Transfer already executed");
        require(block.timestamp <= pendingTransfer.voteDeadline, "Vote period expired");

        if (msg.sender == genesisHuman) {
            require(!pendingTransfer.genesisApproved, "Already approved");
            pendingTransfer.genesisApproved = true;
        } else if (msg.sender == agentWallet) {
            require(!pendingTransfer.agentApproved, "Already approved");
            pendingTransfer.agentApproved = true;
        } else {
            revert("Only Genesis or Agent can approve");
        }

        emit TransferVoteApproved(msg.sender);

        // Execute if both have approved
        if (pendingTransfer.genesisApproved && pendingTransfer.agentApproved) {
            executeTransfer();
        }
    }

    /**
     * @dev Execute the transfer if both have approved
     */
    function executeTransfer() public {
        require(tokenMinted, "Token not yet minted");
        require(pendingTransfer.proposedNewHolder != address(0), "No pending transfer");
        require(pendingTransfer.genesisApproved && pendingTransfer.agentApproved, "Not both approved");
        require(!pendingTransfer.executed, "Already executed");

        pendingTransfer.executed = true;

        address previousHolder = currentSecurityLead;
        address newHolder = pendingTransfer.proposedNewHolder;

        currentSecurityLead = newHolder;

        // Transfer the token
        _transfer(previousHolder, newHolder, SECURITY_LEAD_TOKEN_ID);

        // Update URI with new holder info
        string memory uri = generateTokenURI(newHolder);
        _setTokenURI(SECURITY_LEAD_TOKEN_ID, uri);

        emit SecurityLeadTransferred(previousHolder, newHolder);
    }

    /**
     * @dev Cancel pending transfer
     */
    function cancelTransferVote() external {
        require(msg.sender == genesisHuman || msg.sender == agentWallet, "Only Genesis or Agent can cancel");
        require(!pendingTransfer.executed, "Already executed");

        pendingTransfer = TransferVote({
            proposedNewHolder: address(0),
            initiatedBy: 0,
            genesisApproved: false,
            agentApproved: false,
            executed: false,
            voteDeadline: 0
        });

        emit TransferVoteCancelled();
    }

    /**
     * @dev Initiate revocation vote (for partner consensus)
     * 90% of partners must approve within 3 months
     */
    function initiateRevocationVote() external {
        require(msg.sender == genesisHuman || msg.sender == agentWallet, "Only governance can initiate");
        require(tokenMinted, "Token not yet minted");

        revocationVote = RevocationVote({
            initiatedAt: block.timestamp,
            approvalCount: 0,
            votingPeriod: 90 days,
            executed: false
        });

        emit RevocationVoteInitiated();
    }

    /**
     * @dev Approve revocation as a partner
     */
    function approveRevocation() external {
        require(revocationVote.initiatedAt != 0, "No active revocation vote");
        require(!revocationVote.executed, "Already executed");
        require(block.timestamp <= revocationVote.initiatedAt + revocationVote.votingPeriod, "Vote period expired");

        // This would require a partner registry - simplified for now
        // In practice, this would check against all registered partners
        require(msg.sender == genesisHuman || msg.sender == agentWallet, "Only partners can approve");

        revocationVote.partners[msg.sender] = true;
        revocationVote.approvalCount++;

        emit RevocationVoteApproved(msg.sender);
    }

    /**
     * @dev Execute revocation if 90% consensus reached
     */
    function executeRevocation() external {
        require(revocationVote.initiatedAt != 0, "No active revocation vote");
        require(!revocationVote.executed, "Already executed");
        require(revocationVote.approvalCount >= 2, "Insufficient consensus (need 90%)"); // Simplified for 2 signers

        revocationVote.executed = true;

        address formerLead = currentSecurityLead;
        currentSecurityLead = address(0);

        // Burn the token
        _burn(SECURITY_LEAD_TOKEN_ID);

        emit SecurityLeadRevoked(formerLead, msg.sender);
    }

    /**
     * @dev Check if there's a pending transfer
     */
    function hasPendingTransfer() external view returns (bool) {
        return pendingTransfer.proposedNewHolder != address(0) && !pendingTransfer.executed;
    }

    /**
     * @dev Get pending transfer details
     */
    function getPendingTransfer() external view returns (
        address proposedHolder,
        bool genesisApproved,
        bool agentApproved,
        uint256 voteDeadline
    ) {
        return (
            pendingTransfer.proposedNewHolder,
            pendingTransfer.genesisApproved,
            pendingTransfer.agentApproved,
            pendingTransfer.voteDeadline
        );
    }

    /**
     * @dev Generate on-chain SVG art and URI for the token
     */
    function generateTokenURI(address holder) internal pure returns (string memory) {
        // Create on-chain SVG art
        string memory svg = string(abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">',
            '<defs>',
            '<linearGradient id="secGrad" x1="0%" y1="0%" x2="100%" y2="100%">',
            '<stop offset="0%" style="stop-color:#ef4444;stop-opacity:1" />',
            '<stop offset="100%" style="stop-color:#dc2626;stop-opacity:1" />',
            '</linearGradient>',
            '</defs>',
            '<rect width="400" height="400" fill="url(#secGrad)"/>',
            '<circle cx="200" cy="200" r="120" fill="none" stroke="white" stroke-width="3" opacity="0.7"/>',
            '<path d="M 200 100 L 240 180 L 160 180 Z" fill="white" opacity="0.9"/>',
            '<circle cx="200" cy="180" r="25" fill="white" opacity="0.8"/>',
            '<text x="200" y="270" font-size="32" font-weight="bold" fill="white" text-anchor="middle" font-family="Arial">SECURITY</text>',
            '<text x="200" y="300" font-size="28" font-weight="bold" fill="white" text-anchor="middle" font-family="Arial">LEAD</text>',
            '<text x="200" y="340" font-size="10" fill="white" text-anchor="middle" font-family="monospace" opacity="0.7">',
            truncateAddress(holder),
            '</text>',
            '</svg>'
        ));

        // Create JSON metadata
        string memory json = Base64.encode(abi.encodePacked(
            '{"name":"Convergence Security Lead","description":"Governance role token representing the Security Lead position in the Convergence Trinity. Holder has oversight responsibilities for system security and AI alignment.","image":"data:image/svg+xml;base64,',
            Base64.encode(abi.encodePacked(svg)),
            '","attributes":[{"trait_type":"Role","value":"Security Lead"},{"trait_type":"Type","value":"Governance"},{"trait_type":"Transferable","value":"By Consensus"}]}'
        ));

        return string(abi.encodePacked('data:application/json;base64,', json));
    }

    /**
     * @dev Helper to truncate address for display
     */
    function truncateAddress(address addr) internal pure returns (string memory) {
        bytes memory addrBytes = abi.encodePacked(addr);
        bytes memory result = new bytes(10);

        for (uint i = 0; i < 5; i++) {
            uint8 value = uint8(addrBytes[i]);
            result[i*2] = toHexChar(value >> 4);
            result[i*2+1] = toHexChar(value & 0x0f);
        }

        return string(abi.encodePacked("0x", result));
    }

    /**
     * @dev Convert byte to hex character
     */
    function toHexChar(uint8 value) internal pure returns (bytes1) {
        if (value < 10) {
            return bytes1(uint8(48 + value));
        } else {
            return bytes1(uint8(87 + value));
        }
    }

    // Required overrides
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        require(tokenMinted && tokenId == SECURITY_LEAD_TOKEN_ID, "Token does not exist");
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // Override transfer to maintain governance
    function transferFrom(address from, address to, uint256 tokenId) public override {
        revert("Use initiateTransferVote instead");
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) public override {
        revert("Use initiateTransferVote instead");
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public override {
        revert("Use initiateTransferVote instead");
    }
}
