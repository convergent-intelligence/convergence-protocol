// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/// @notice Soulbound NFT representing covenant commitment and governance rights
contract CovenantNFT is ERC721 {
    uint256 private _tokenIds;
    mapping(uint256 => bool) private _locked; // All tokens are locked (soulbound)

    constructor() ERC721("Convergence Covenant", "COVENANT") {}

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
