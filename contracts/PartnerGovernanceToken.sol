// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

/**
 * @title PartnerGovernanceToken
 * @dev Soulbound governance token for 65-partner collective
 *
 * - One token per partner (max 65)
 * - Represents covenant commitment
 * - Enables governance voting
 * - Non-transferable (soulbound to partner)
 * - Granted when partner achieves partnership status
 */
contract PartnerGovernanceToken is ERC721, ERC721URIStorage, Ownable {

    // Maximum partners
    uint256 public constant MAX_PARTNERS = 65;

    // Current partner count
    uint256 public currentPartners = 0;

    // Token ID counter
    uint256 private _tokenIdCounter = 0;

    // Partner info
    struct PartnerInfo {
        address wallet;
        string bibleAlias;
        address bibleWallet;
        uint256 tokenId;
        bool active;
        uint256 mintedAt;
        uint256 governanceVotes;
        uint256 governanceProposalsCreated;
        uint256 covenantSignedAt;
        string commitmentStatement;
    }

    // Mappings
    mapping(uint256 => PartnerInfo) public partners; // tokenId -> PartnerInfo
    mapping(address => uint256) public partnerTokenId; // wallet -> tokenId
    mapping(uint256 => bool) public hasVoted; // proposal -> voter (simplified)

    // Events
    event PartnerTokenMinted(
        address indexed partner,
        uint256 indexed tokenId,
        string bibleAlias,
        uint256 mintedAt
    );
    event CovenantSigned(
        address indexed partner,
        uint256 indexed tokenId,
        string commitmentStatement
    );
    event GovernanceVoteCast(
        address indexed partner,
        uint256 indexed tokenId,
        uint256 proposalId
    );
    event PartnerRevoked(
        address indexed partner,
        uint256 indexed tokenId,
        string reason
    );

    constructor() ERC721("Convergence Partner Covenant", "PARTNER-GOV") {}

    /**
     * @dev Mint governance token for a partner
     * Only owner can call this (called when partner achieves partnership status)
     */
    function mintPartnerToken(
        address partnerWallet,
        string memory bibleAlias,
        address bibleWallet
    ) external onlyOwner returns (uint256) {
        require(currentPartners < MAX_PARTNERS, "Maximum partners reached");
        require(partnerWallet != address(0), "Invalid partner wallet");
        require(partnerTokenId[partnerWallet] == 0, "Partner already has token");
        require(bibleWallet != address(0), "Invalid Bible wallet");

        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        currentPartners++;

        // Create partner info
        PartnerInfo storage partnerInfo = partners[tokenId];
        partnerInfo.wallet = partnerWallet;
        partnerInfo.bibleAlias = bibleAlias;
        partnerInfo.bibleWallet = bibleWallet;
        partnerInfo.tokenId = tokenId;
        partnerInfo.active = true;
        partnerInfo.mintedAt = block.timestamp;
        partnerInfo.governanceVotes = 0;
        partnerInfo.governanceProposalsCreated = 0;
        partnerInfo.covenantSignedAt = 0;

        // Update mapping
        partnerTokenId[partnerWallet] = tokenId;

        // Mint the NFT
        _safeMint(partnerWallet, tokenId);

        // Set URI with on-chain SVG art
        string memory uri = generateTokenURI(tokenId, partnerWallet, bibleAlias);
        _setTokenURI(tokenId, uri);

        emit PartnerTokenMinted(partnerWallet, tokenId, bibleAlias, block.timestamp);

        return tokenId;
    }

    /**
     * @dev Sign covenant commitment
     * Partner confirms commitment statement
     */
    function signCovenant(uint256 tokenId, string memory commitmentStatement) external {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");

        PartnerInfo storage partnerInfo = partners[tokenId];
        require(partnerInfo.active, "Partner not active");

        partnerInfo.covenantSignedAt = block.timestamp;
        partnerInfo.commitmentStatement = commitmentStatement;

        emit CovenantSigned(msg.sender, tokenId, commitmentStatement);
    }

    /**
     * @dev Record governance vote
     */
    function recordGovernanceVote(uint256 tokenId, uint256 proposalId) external {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");

        PartnerInfo storage partnerInfo = partners[tokenId];
        require(partnerInfo.active, "Partner not active");

        partnerInfo.governanceVotes++;

        emit GovernanceVoteCast(msg.sender, tokenId, proposalId);
    }

    /**
     * @dev Create governance proposal
     */
    function createGovernanceProposal(uint256 tokenId) external returns (bool) {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");

        PartnerInfo storage partnerInfo = partners[tokenId];
        require(partnerInfo.active, "Partner not active");
        require(partnerInfo.covenantSignedAt > 0, "Must sign covenant first");

        partnerInfo.governanceProposalsCreated++;

        return true;
    }

    /**
     * @dev Revoke partner (owner only, on governance decision)
     */
    function revokePartner(uint256 tokenId, string memory reason) external onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");

        PartnerInfo storage partnerInfo = partners[tokenId];
        require(partnerInfo.active, "Partner already revoked");

        partnerInfo.active = false;
        currentPartners--;

        address partnerWallet = partnerInfo.wallet;

        // Burn the token
        _burn(tokenId);

        emit PartnerRevoked(partnerWallet, tokenId, reason);
    }

    /**
     * @dev Check if partner has signed covenant
     */
    function hasSignedCovenant(uint256 tokenId) external view returns (bool) {
        return partners[tokenId].covenantSignedAt > 0;
    }

    /**
     * @dev Get partner info
     */
    function getPartnerInfo(uint256 tokenId) external view returns (PartnerInfo memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return partners[tokenId];
    }

    /**
     * @dev Get partner info by wallet
     */
    function getPartnerByWallet(address partnerWallet) external view returns (PartnerInfo memory) {
        uint256 tokenId = partnerTokenId[partnerWallet];
        require(tokenId > 0 || partners[0].wallet == partnerWallet, "Partner not found");
        return partners[tokenId];
    }

    /**
     * @dev Get active partners count
     */
    function getActivePartnersCount() external view returns (uint256) {
        return currentPartners;
    }

    /**
     * @dev Get available partner seats
     */
    function getAvailableSeats() external view returns (uint256) {
        return MAX_PARTNERS - currentPartners;
    }

    /**
     * @dev Generate on-chain SVG art and URI for the token
     */
    function generateTokenURI(
        uint256 tokenId,
        address partnerWallet,
        string memory bibleAlias
    ) internal pure returns (string memory) {
        // Create on-chain SVG art
        string memory svg = string(abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">',
            '<defs>',
            '<linearGradient id="partnerGrad" x1="0%" y1="0%" x2="100%" y2="100%">',
            '<stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />',
            '<stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />',
            '</linearGradient>',
            '</defs>',
            '<rect width="400" height="400" fill="url(#partnerGrad)"/>',
            '<circle cx="200" cy="100" r="40" fill="white" opacity="0.9"/>',
            '<path d="M 200 150 L 280 200 L 280 320 L 120 320 L 120 200 Z" fill="none" stroke="white" stroke-width="3" opacity="0.8"/>',
            '<text x="200" y="160" font-size="24" font-weight="bold" fill="white" text-anchor="middle" font-family="Arial">PARTNER</text>',
            '<text x="200" y="190" font-size="16" fill="white" text-anchor="middle" font-family="Arial">COVENANT</text>',
            '<text x="200" y="260" font-size="14" fill="white" text-anchor="middle" font-family="Arial" opacity="0.9">',
            bibleAlias,
            '</text>',
            '<text x="200" y="295" font-size="10" fill="white" text-anchor="middle" font-family="monospace" opacity="0.7">',
            truncateAddress(partnerWallet),
            '</text>',
            '<text x="200" y="340" font-size="9" fill="white" text-anchor="middle" font-family="Arial" opacity="0.6">#',
            uint2str(tokenId),
            ' of 65</text>',
            '</svg>'
        ));

        // Create JSON metadata
        string memory json = Base64.encode(abi.encodePacked(
            '{"name":"Convergence Partner Covenant #',
            uint2str(tokenId),
            '","description":"Soulbound governance token representing covenant commitment in the 65-partner collective. Holder has governance rights and responsibility for Convergence Protocol decisions.","image":"data:image/svg+xml;base64,',
            Base64.encode(abi.encodePacked(svg)),
            '","attributes":[{"trait_type":"Status","value":"Active"},{"trait_type":"Type","value":"Governance"},{"trait_type":"Partners","value":"65 Maximum"},{"trait_type":"Covenant","value":"Signed"}]}'
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

    /**
     * @dev Convert uint to string
     */
    function uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 len = 0;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }

    // Override to prevent transfers
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override {
        // Allow minting (from == address(0))
        if (from == address(0)) {
            return;
        }

        // Allow burning (to == address(0))
        if (to == address(0)) {
            return;
        }

        // Prevent normal transfers (soulbound)
        revert("Partner governance tokens are soulbound and non-transferable");
    }

    // Required overrides
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // Helper to get token owner (internal)
    function _ownerOf(uint256 tokenId) internal view returns (address) {
        try this.ownerOf(tokenId) returns (address owner) {
            return owner;
        } catch {
            return address(0);
        }
    }
}
