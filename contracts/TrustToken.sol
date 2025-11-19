// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

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
