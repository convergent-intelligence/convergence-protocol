// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TrustAccumulator
 * @notice Accumulates Trust tokens from burning Tally, backed by stablecoin deposits
 * @dev Trust increases 0.0001 per Tally burned, can be wrapped with stablecoin backing
 */
contract TrustAccumulator is Ownable {

    // Trust token balances (not an ERC20 itself, but tracks trust scores)
    mapping(address => uint256) public trustBalance;

    // Stablecoin backing (e.g., USDC, DAI)
    IERC20 public stablecoin;

    // Stablecoin deposits backing trust
    mapping(address => uint256) public stablecoinBacking;

    // Total trust in circulation
    uint256 public totalTrust;

    // Total stablecoin backing
    uint256 public totalBacking;

    // Authorized burners (TallyToken contract)
    mapping(address => bool) public authorizedBurners;

    // Conversion rate: How much stablecoin backs 1 unit of trust
    // Default: 1 trust = 1 stablecoin (can be adjusted)
    uint256 public trustToStablecoinRate = 1 * 10**18; // 1:1 with 18 decimals

    // Events
    event TrustEarned(address indexed account, uint256 amount, string reason);
    event StablecoinDeposited(address indexed account, uint256 amount);
    event StablecoinWithdrawn(address indexed account, uint256 amount);
    event TrustWrapped(address indexed account, uint256 trustAmount, uint256 stablecoinAmount);
    event TrustUnwrapped(address indexed account, uint256 trustAmount, uint256 stablecoinAmount);
    event AuthorizedBurnerAdded(address indexed burner);
    event RateUpdated(uint256 newRate);

    constructor(address _stablecoin) Ownable(msg.sender) {
        stablecoin = IERC20(_stablecoin);
    }

    /**
     * @notice Add authorized burner (TallyToken contract)
     */
    function addAuthorizedBurner(address burner) external onlyOwner {
        authorizedBurners[burner] = true;
        emit AuthorizedBurnerAdded(burner);
    }

    /**
     * @notice Update trust to stablecoin conversion rate
     */
    function setConversionRate(uint256 newRate) external onlyOwner {
        require(newRate > 0, "Rate must be positive");
        trustToStablecoinRate = newRate;
        emit RateUpdated(newRate);
    }

    /**
     * @notice Mint trust from burning tally (called by TallyToken)
     * @param to Recipient of trust
     * @param amount Amount of trust to mint
     */
    function mintTrustFromBurn(address to, uint256 amount) external {
        require(authorizedBurners[msg.sender], "Not authorized to mint trust");
        require(amount > 0, "Amount must be positive");

        trustBalance[to] += amount;
        totalTrust += amount;

        emit TrustEarned(to, amount, "Burned Tally");
    }

    /**
     * @notice Deposit stablecoin to back your trust
     * @param amount Amount of stablecoin to deposit
     */
    function depositStablecoin(uint256 amount) external {
        require(amount > 0, "Amount must be positive");
        require(trustBalance[msg.sender] > 0, "No trust to back");

        // Transfer stablecoin from sender
        require(stablecoin.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        stablecoinBacking[msg.sender] += amount;
        totalBacking += amount;

        emit StablecoinDeposited(msg.sender, amount);
    }

    /**
     * @notice Withdraw stablecoin backing
     * @param amount Amount to withdraw
     */
    function withdrawStablecoin(uint256 amount) external {
        require(amount > 0, "Amount must be positive");
        require(stablecoinBacking[msg.sender] >= amount, "Insufficient backing");

        stablecoinBacking[msg.sender] -= amount;
        totalBacking -= amount;

        require(stablecoin.transfer(msg.sender, amount), "Transfer failed");

        emit StablecoinWithdrawn(msg.sender, amount);
    }

    /**
     * @notice Wrap trust with stablecoin to create backed trust tokens
     * @param trustAmount Amount of trust to wrap
     */
    function wrapTrust(uint256 trustAmount) external {
        require(trustAmount > 0, "Amount must be positive");
        require(trustBalance[msg.sender] >= trustAmount, "Insufficient trust");

        // Calculate required stablecoin backing
        uint256 requiredBacking = (trustAmount * trustToStablecoinRate) / 10**18;
        require(stablecoinBacking[msg.sender] >= requiredBacking, "Insufficient stablecoin backing");

        // This would mint wrapped trust tokens (future: deploy separate WrappedTrust ERC20)
        // For now, just emit event showing the wrapping

        emit TrustWrapped(msg.sender, trustAmount, requiredBacking);
    }

    /**
     * @notice Get trust backing ratio for an account
     * @param account Address to check
     * @return Percentage of trust backed by stablecoin (in basis points, 10000 = 100%)
     */
    function getBackingRatio(address account) external view returns (uint256) {
        if (trustBalance[account] == 0) return 0;

        uint256 requiredBacking = (trustBalance[account] * trustToStablecoinRate) / 10**18;
        if (requiredBacking == 0) return 10000; // Fully backed if no backing required

        return (stablecoinBacking[account] * 10000) / requiredBacking;
    }

    /**
     * @notice Get account's trust and backing info
     */
    function getAccountInfo(address account) external view returns (
        uint256 trust,
        uint256 backing,
        uint256 backingRatio
    ) {
        trust = trustBalance[account];
        backing = stablecoinBacking[account];

        if (trust == 0) {
            backingRatio = 0;
        } else {
            uint256 requiredBacking = (trust * trustToStablecoinRate) / 10**18;
            backingRatio = requiredBacking == 0 ? 10000 : (backing * 10000) / requiredBacking;
        }
    }
}
