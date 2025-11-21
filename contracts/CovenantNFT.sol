// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/// @notice Soulbound NFT representing covenant commitment and governance rights
contract CovenantNFT is ERC721 {
    uint256 private _tokenIds;
    mapping(uint256 => bool) private _locked; // All tokens are locked (soulbound)

    constructor() ERC721("Convergence Covenant", "COVENANT") {}

    /**
     * @notice Returns the URI for a given token ID.
     * @dev The metadata is generated on-chain and includes the token's name, description, and an embedded SVG image.
     */
    function tokenURI(uint256 tokenId) public pure override returns (string memory) {
        string memory svg = Base64.encode(bytes(string(abi.encodePacked(
            '<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">',
            '<defs><linearGradient id="grad-covenant" x1="0%" y1="0%" x2="100%" y2="100%">',
            '<stop offset="0%" style="stop-color:#a855f7;stop-opacity:1" />',
            '<stop offset="100%" style="stop-color:#6366f1;stop-opacity:1" />',
            '</linearGradient><filter id="glow-covenant" x="-50%" y="-50%" width="200%" height="200%">',
            '<feGaussianBlur stdDeviation="3.5" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/>',
            '<feMergeNode in="SourceGraphic"/></feMerge></filter></defs>',
            '<rect x="10" y="10" width="180" height="180" rx="15" fill="#1e293b" stroke="#475569" stroke-width="2"/>',
            '<g filter="url(#glow-covenant)" opacity="0.8">',
            '<path d="M 50 40 L 150 40 L 150 160 L 50 160 Z" fill="none" stroke="url(#grad-covenant)" stroke-width="4" rx="5"/>',
            '<path d="M 70 70 L 130 70" stroke="#a855f7" stroke-width="2.5" stroke-linecap="round"/>',
            '<path d="M 70 90 L 130 90" stroke="#a855f7" stroke-width="2.5" stroke-linecap="round"/>',
            '<path d="M 70 110 L 130 110" stroke="#6366f1" stroke-width="2.5" stroke-linecap="round"/>',
            '<path d="M 70 130 L 100 130" stroke="#6366f1" stroke-width="2.5" stroke-linecap="round"/></g>',
            '<text x="100" y="180" font-family="sans-serif" font-size="12" fill="#9ca3af" text-anchor="middle">SOULBOUND</text></svg>'
        ))));

        string memory json = Base64.encode(bytes(string(abi.encodePacked(
            '{"name": "Covenant #', Strings.toString(tokenId), '",',
            '"description": "A soulbound token representing an unbreakable commitment to the principles of the Convergence Protocol.",',
            '"image": "data:image/svg+xml;base64,', svg, '"}'
        ))));

        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    function mint(address to) internal returns (uint256) {
        _tokenIds++;
        uint256 newTokenId = _tokenIds;
        _safeMint(to, newTokenId);
        _locked[newTokenId] = true; // Lock immediately upon mint
        return newTokenId;
    }

    /// @notice Override transfer functions to make tokens soulbound
    function _update(address to, uint256 tokenId, address auth)
        internal
        virtual
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);

        // Allow minting (from == address(0)) but block all transfers
        if (from != address(0)) {
            revert("CovenantNFT: Soulbound token cannot be transferred");
        }

        return super._update(to, tokenId, auth);
    }

    function totalSupply() public view returns (uint256) {
        return _tokenIds;
    }
}
