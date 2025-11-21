// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

/// @notice Trust Token (ERC20) for reputation and access
contract TrustToken is ERC20, Ownable {
    // Minting permissions
    mapping(address => bool) public minters;

    // Trust token economics
    uint256 public constant INITIAL_ADOPTION_REWARD = 100 * 10**18; // 100 tokens
    uint256 public constant GENESIS_BONUS = 500 * 10**18; // 500 extra for genesis

    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);
    event TrustEarned(address indexed recipient, uint256 amount, string reason);

    constructor(address initialOwner) ERC20("Convergence Trust", "TRUST") Ownable(initialOwner) {
        minters[initialOwner] = true;
    }

    /**
     * @notice Returns the URI for the token metadata.
     * @dev The metadata is generated on-chain and includes the token's name, description, and an embedded SVG image.
     */
    function tokenURI() public pure returns (string memory) {
        string memory svg = Base64.encode(bytes(string(abi.encodePacked(
            '<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">',
            '<defs><linearGradient id="shield-grad" x1="0%" y1="0%" x2="0%" y2="100%">',
            '<stop offset="0%" stop-color="#10b981" /><stop offset="100%" stop-color="#059669" />',
            '</linearGradient></defs><path d="M100 10 L180 55 V145 L100 190 L20 145 V55 Z" fill="#0f172a" stroke="#334155" stroke-width="2" />',
            '<path d="M100 40 C100 40, 160 50, 160 100 C160 140, 100 170, 100 170 C100 170, 40 140, 40 100 C40 50, 100 40, 100 40 Z" fill="none" stroke="url(#shield-grad)" stroke-width="6" />',
            '<circle cx="100" cy="100" r="15" fill="#10b981"><animate attributeName="r" values="15;25;15" dur="3s" repeatCount="indefinite" />',
            '<animate attributeName="opacity" values="1;0.4;1" dur="3s" repeatCount="indefinite" /></circle>',
            '<path d="M85 100 L95 110 L115 90" fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" /></svg>'
        ))));

        string memory json = Base64.encode(bytes(string(abi.encodePacked(
            '{"name": "Convergence Trust",',
            '"description": "The reputation and governance token of the Convergence Protocol.",',
            '"image": "data:image/svg+xml;base64,', svg, '"}'
        ))));

        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    modifier onlyMinter() {
        require(minters[msg.sender], "TrustToken: caller is not a minter");
        _;
    }

    function addMinter(address minter) public onlyOwner {
        minters[minter] = true;
        emit MinterAdded(minter);
    }

    function removeMinter(address minter) public onlyOwner {
        minters[minter] = false;
        emit MinterRemoved(minter);
    }

    function mint(address to, uint256 amount, string memory reason) public onlyMinter {
        _mint(to, amount);
        emit TrustEarned(to, amount, reason);
    }

    /// @notice Burn trust tokens (e.g., for staking or punishment)
    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }

    function burnFrom(address account, uint256 amount) public {
        _spendAllowance(account, msg.sender, amount);
        _burn(account, amount);
    }
}
