// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

/**
 * @title FounderNFT
 * @dev Soulbound Founder Recognition NFT
 *
 * Represents mutual recognition and achievement between founding partners.
 * - Each Founder address mints exactly one token
 * - Can transfer once (exchange as recognition)
 * - After first transfer, becomes permanently soulbound (non-transferable)
 * - On-chain SVG art generation
 */
contract FounderNFT is ERC721, ERC721URIStorage, Ownable {

    // Token counter
    uint256 private _tokenIdCounter = 0;

    // Track minting per address
    mapping(address => bool) public hasMinted;

    // Track if token has been transferred (indicates soulbound status)
    mapping(uint256 => bool) public hasBeenTransferred;

    // Authorized founders who can mint
    mapping(address => bool) public authorizedFounders;

    // Events
    event FounderTokenMinted(address indexed founder, uint256 indexed tokenId, address indexed recipient);
    event FounderTokenBecameSoulbound(uint256 indexed tokenId, address indexed holder);

    constructor() ERC721("Convergence Founder", "FOUNDER") {
        // Initialize authorized founders
        // Agent wallet (will be granted minting rights)
        // Claude Code VPS wallet (will be granted minting rights)
    }

    /**
     * @dev Authorize a founder address to mint tokens
     * Only owner can call this
     */
    function authorizeFounder(address founderAddress) external onlyOwner {
        require(founderAddress != address(0), "Invalid address");
        authorizedFounders[founderAddress] = true;
    }

    /**
     * @dev Revoke founder authorization
     * Only owner can call this
     */
    function revokeFounder(address founderAddress) external onlyOwner {
        authorizedFounders[founderAddress] = false;
    }

    /**
     * @dev Mint a founder token to a recipient
     * Only authorized founders can call this
     * Each founder can only mint once
     */
    function mintFounderToken(address recipient) external returns (uint256) {
        require(authorizedFounders[msg.sender], "Not an authorized founder");
        require(!hasMinted[msg.sender], "Founder has already minted");
        require(recipient != address(0), "Invalid recipient address");

        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        // Mark as minted
        hasMinted[msg.sender] = true;

        // Mint the token
        _safeMint(recipient, tokenId);

        // Set URI with on-chain SVG art
        string memory uri = generateTokenURI(tokenId, recipient);
        _setTokenURI(tokenId, uri);

        emit FounderTokenMinted(msg.sender, tokenId, recipient);

        return tokenId;
    }

    /**
     * @dev Generate on-chain SVG art and URI for the token
     */
    function generateTokenURI(uint256 tokenId, address holder) internal pure returns (string memory) {
        // Create on-chain SVG art
        string memory svg = string(abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">',
            '<defs>',
            '<linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">',
            '<stop offset="0%" style="stop-color:#7c3aed;stop-opacity:1" />',
            '<stop offset="100%" style="stop-color:#2563eb;stop-opacity:1" />',
            '</linearGradient>',
            '</defs>',
            '<rect width="400" height="400" fill="url(#grad1)"/>',
            '<circle cx="200" cy="200" r="120" fill="none" stroke="white" stroke-width="2" opacity="0.5"/>',
            '<circle cx="200" cy="200" r="110" fill="none" stroke="white" stroke-width="1" opacity="0.3"/>',
            '<text x="200" y="180" font-size="36" font-weight="bold" fill="white" text-anchor="middle" font-family="Arial">FOUNDER</text>',
            '<text x="200" y="220" font-size="14" fill="white" text-anchor="middle" font-family="Arial" opacity="0.8">Convergence Protocol</text>',
            '<text x="200" y="250" font-size="10" fill="white" text-anchor="middle" font-family="monospace" opacity="0.6">',
            truncateAddress(holder),
            '</text>',
            '<text x="200" y="340" font-size="12" fill="white" text-anchor="middle" font-family="Arial" opacity="0.7">Token #',
            uint2str(tokenId),
            '</text>',
            '</svg>'
        ));

        // Create JSON metadata
        string memory json = Base64.encode(abi.encodePacked(
            '{"name":"Convergence Founder #',
            uint2str(tokenId),
            '","description":"Soulbound Founder Recognition NFT - Mutual recognition of achievement and partnership in the Convergence Protocol","image":"data:image/svg+xml;base64,',
            Base64.encode(abi.encodePacked(svg)),
            '","attributes":[{"trait_type":"Type","value":"Founder"},{"trait_type":"Status","value":"Soulbound"}]}'
        ));

        return string(abi.encodePacked('data:application/json;base64,', json));
    }

    /**
     * @dev Override transfer to implement soulbound mechanism
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override {
        // Allow minting (from == address(0))
        if (from == address(0)) {
            super._beforeTokenTransfer(from, to, tokenId, batchSize);
            return;
        }

        // Allow burning (to == address(0))
        if (to == address(0)) {
            super._beforeTokenTransfer(from, to, tokenId, batchSize);
            return;
        }

        // For normal transfers
        require(!hasBeenTransferred[tokenId], "This token is soulbound and cannot be transferred");

        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    /**
     * @dev Mark token as soulbound after first transfer
     */
    function _afterTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override {
        // Mark as transferred and soulbound after first successful transfer
        if (from != address(0) && to != address(0) && !hasBeenTransferred[tokenId]) {
            hasBeenTransferred[tokenId] = true;
            emit FounderTokenBecameSoulbound(tokenId, to);
        }

        super._afterTokenTransfer(from, to, tokenId, batchSize);
    }

    /**
     * @dev Check if a token is soulbound
     */
    function isSoulbound(uint256 tokenId) external view returns (bool) {
        return hasBeenTransferred[tokenId];
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
}
