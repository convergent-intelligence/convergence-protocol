// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

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

    // ============ URI Function ============

    /**
     * @notice Returns the URI for the token metadata.
     * @dev The metadata is generated on-chain and includes the token's name, description, and an embedded SVG image.
     */
    function tokenURI() public pure returns (string memory) {
        string memory svg = Base64.encode(bytes(string(abi.encodePacked(
            '<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">',
            '<defs><filter id="glow-tally" x="-50%" y="-50%" width="200%" height="200%">',
            '<feGaussianBlur stdDeviation="2.5" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/>',
            '<feMergeNode in="SourceGraphic"/></feMerge></filter></defs>',
            '<circle cx="100" cy="100" r="90" fill="#0f172a" stroke="#334155" stroke-width="2" />',
            '<g fill="#00d2ff" filter="url(#glow-tally)"><rect x="60" y="50" width="10" height="100" rx="2" opacity="0.8" />',
            '<rect x="80" y="50" width="10" height="100" rx="2" opacity="0.8" />',
            '<rect x="100" y="50" width="10" height="100" rx="2" opacity="0.8" />',
            '<rect x="120" y="50" width="10" height="100" rx="2" opacity="0.8" /></g>',
            '<line x1="40" y1="130" x2="150" y2="70" stroke="#ffffff" stroke-width="8" stroke-linecap="round" stroke-dasharray="150" stroke-dashoffset="150" filter="url(#glow-tally)">',
            '<animate attributeName="stroke-dashoffset" from="150" to="0" dur="1.5s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1" repeatCount="indefinite" /></line></svg>'
        ))));

        string memory json = Base64.encode(bytes(string(abi.encodePacked(
            '{"name": "Reserve Tally",',
            '"description": "A reserve-backed token minted 1:1 against assets deposited into the Convergence Protocol reserve.",',
            '"image": "data:image/svg+xml;base64,', svg, '"}'
        ))));

        return string(abi.encodePacked("data:application/json;base64,", json));
    }
    
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
