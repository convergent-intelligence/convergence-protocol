// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

/**
 * @title TallyToken
 * @notice Freely transferable tokens representing debt, obligation, and exchange
 * @dev Inspired by historical tally sticks - can be minted by Trinity, burned to increase Trust
 */
contract TallyToken is ERC20, Ownable {

    // Trinity members who can mint tallies
    address[3] public trinityMembers;

    // Track minting per Trinity member (each can mint 1 tally to anyone)
    mapping(address => bool) public hasMinted;

    // Track burning allotment per Trinity member (max 1 tally total burned from others)
    mapping(address => uint256) public totalBurned; // Amount burned by this Trinity member from others

    // Trust accumulation contract
    address public trustAccumulator;

    // Constants
    uint256 public constant MAX_MINT_PER_MEMBER = 1 * 10**18; // 1 tally
    uint256 public constant MAX_BURN_PER_MEMBER = 1 * 10**18; // 1 tally total

    // Events
    event TallyMinted(address indexed minter, address indexed recipient, uint256 amount);
    event TallyBurned(address indexed burner, address indexed from, uint256 amount, uint256 trustEarned);
    event TrustAccumulatorSet(address indexed accumulator);

    constructor(address[3] memory _trinityMembers) ERC20("Tally Token", "TALLY") Ownable(msg.sender) {
        trinityMembers = _trinityMembers;
    }

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
            '{"name": "Tally Token",',
            '"description": "A freely transferable token representing debt, obligation, and exchange within the Convergence Protocol.",',
            '"image": "data:image/svg+xml;base64,', svg, '"}'
        ))));

        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    /**
     * @notice Check if address is a Trinity member
     */
    function isTrinityMember(address account) public view returns (bool) {
        return account == trinityMembers[0] ||
               account == trinityMembers[1] ||
               account == trinityMembers[2];
    }

    /**
     * @notice Set the Trust accumulator contract address
     */
    function setTrustAccumulator(address _trustAccumulator) external onlyOwner {
        trustAccumulator = _trustAccumulator;
        emit TrustAccumulatorSet(_trustAccumulator);
    }

    /**
     * @notice Trinity members mint 1 tally to any address (once per member)
     * @param to Recipient address
     */
    function mintTally(address to) external {
        require(isTrinityMember(msg.sender), "Only Trinity members can mint");
        require(!hasMinted[msg.sender], "Already minted your allotment");
        require(to != address(0), "Cannot mint to zero address");

        hasMinted[msg.sender] = true;
        _mint(to, MAX_MINT_PER_MEMBER);

        emit TallyMinted(msg.sender, to, MAX_MINT_PER_MEMBER);
    }

    /**
     * @notice Trinity members burn tally from any address (max 1 tally total)
     * @param from Address to burn from
     * @param amount Amount to burn
     */
    function burnTallyFrom(address from, uint256 amount) external {
        require(isTrinityMember(msg.sender), "Only Trinity members can burn");
        require(from != address(0), "Cannot burn from zero address");
        require(amount > 0, "Amount must be greater than 0");
        require(totalBurned[msg.sender] + amount <= MAX_BURN_PER_MEMBER, "Exceeds burn allotment");
        require(balanceOf(from) >= amount, "Insufficient balance to burn");

        totalBurned[msg.sender] += amount;
        _burn(from, amount);

        // Calculate trust earned: 0.0001 trust per 1 tally burned
        // 1 TALLY (10^18) = 0.0001 TRUST (10^14)
        // So: trustEarned = amount / 10000
        uint256 trustEarned = amount / 10000;

        // Mint trust to the burner (Trinity member who performed the burn)
        if (trustAccumulator != address(0) && trustEarned > 0) {
            ITrustAccumulator(trustAccumulator).mintTrustFromBurn(msg.sender, trustEarned);
        }

        emit TallyBurned(msg.sender, from, amount, trustEarned);
    }

    /**
     * @notice Check remaining mint allotment for a Trinity member
     */
    function remainingMintAllotment(address member) external view returns (uint256) {
        if (!isTrinityMember(member)) return 0;
        if (hasMinted[member]) return 0;
        return MAX_MINT_PER_MEMBER;
    }

    /**
     * @notice Check remaining burn allotment for a Trinity member
     */
    function remainingBurnAllotment(address member) external view returns (uint256) {
        if (!isTrinityMember(member)) return 0;
        if (totalBurned[member] >= MAX_BURN_PER_MEMBER) return 0;
        return MAX_BURN_PER_MEMBER - totalBurned[member];
    }
}

/**
 * @notice Interface for Trust accumulation
 */
interface ITrustAccumulator {
    function mintTrustFromBurn(address to, uint256 amount) external;
}
