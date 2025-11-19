// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ReserveTally
 * @notice Reserve-backed TALLY token for the 3rd Leg
 * @dev Minted by ReserveVault when assets are deposited
 *      Burned by users to earn Trust tokens (one-way out)
 *      Value pegged to reserve holdings
 */
contract ReserveTally is ERC20, ERC20Burnable, Ownable {

    // ============ State Variables ============

    // Addresses authorized to mint (ReserveVault)
    mapping(address => bool) public minters;

    // Trust accumulator for burn rewards
    address public trustAccumulator;

    // Trust earned per TALLY burned (in basis points relative to TALLY)
    // 100 = 1%, so burning 100 TALLY = 1 TRUST
    uint256 public trustRateBasisPoints = 100;

    // Total TALLY ever minted (for tracking)
    uint256 public totalMinted;

    // Total TALLY burned for trust
    uint256 public totalBurnedForTrust;

    // ============ Events ============

    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);
    event TallyMinted(address indexed to, uint256 amount);
    event TallyBurnedForTrust(address indexed burner, uint256 tallyBurned, uint256 trustEarned);
    event TrustAccumulatorSet(address indexed accumulator);
    event TrustRateUpdated(uint256 newRate);

    // ============ Constructor ============

    constructor() ERC20("Reserve Tally", "TALLY") Ownable(msg.sender) {}

    // ============ Modifiers ============

    modifier onlyMinter() {
        require(minters[msg.sender], "Not a minter");
        _;
    }

    // ============ Minting Functions ============

    /**
     * @notice Mint TALLY (only by authorized minters like ReserveVault)
     * @param to Recipient address
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external onlyMinter {
        require(to != address(0), "Cannot mint to zero address");
        require(amount > 0, "Amount must be positive");

        _mint(to, amount);
        totalMinted += amount;

        emit TallyMinted(to, amount);
    }

    // ============ Burn for Trust Functions ============

    /**
     * @notice Burn TALLY to earn Trust tokens
     * @param amount Amount of TALLY to burn
     */
    function burnForTrust(uint256 amount) external {
        require(amount > 0, "Amount must be positive");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        require(trustAccumulator != address(0), "Trust accumulator not set");

        // Burn the TALLY
        _burn(msg.sender, amount);
        totalBurnedForTrust += amount;

        // Calculate trust earned
        uint256 trustEarned = (amount * trustRateBasisPoints) / 10000;

        // Mint trust to burner
        if (trustEarned > 0) {
            ITrustAccumulator(trustAccumulator).mintTrustFromBurn(msg.sender, trustEarned);
        }

        emit TallyBurnedForTrust(msg.sender, amount, trustEarned);
    }

    // ============ Admin Functions ============

    /**
     * @notice Add minter (ReserveVault)
     */
    function addMinter(address minter) external onlyOwner {
        require(minter != address(0), "Invalid minter");
        minters[minter] = true;
        emit MinterAdded(minter);
    }

    /**
     * @notice Remove minter
     */
    function removeMinter(address minter) external onlyOwner {
        minters[minter] = false;
        emit MinterRemoved(minter);
    }

    /**
     * @notice Set trust accumulator contract
     */
    function setTrustAccumulator(address _trustAccumulator) external onlyOwner {
        trustAccumulator = _trustAccumulator;
        emit TrustAccumulatorSet(_trustAccumulator);
    }

    /**
     * @notice Update trust rate (basis points)
     * @param _rate New rate (100 = 1%)
     */
    function setTrustRate(uint256 _rate) external onlyOwner {
        require(_rate <= 10000, "Rate too high");
        trustRateBasisPoints = _rate;
        emit TrustRateUpdated(_rate);
    }

    // ============ View Functions ============

    /**
     * @notice Get circulation stats
     */
    function getCirculationStats() external view returns (
        uint256 currentSupply,
        uint256 minted,
        uint256 burnedForTrust
    ) {
        return (totalSupply(), totalMinted, totalBurnedForTrust);
    }

    /**
     * @notice Preview trust earned for a burn amount
     */
    function previewTrustEarned(uint256 amount) external view returns (uint256) {
        return (amount * trustRateBasisPoints) / 10000;
    }
}

// ============ Interface ============

interface ITrustAccumulator {
    function mintTrustFromBurn(address to, uint256 amount) external;
}
