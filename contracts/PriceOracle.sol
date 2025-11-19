// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PriceOracle
 * @notice Simple price oracle for reserve valuation
 * @dev AI agent updates prices from off-chain sources (Chainlink, DEX, etc.)
 *      In production, integrate directly with Chainlink or use TWAP
 */
contract PriceOracle is Ownable {

    // ============ State Variables ============

    // ETH price in USD (18 decimals)
    uint256 public ethPrice;

    // Token prices in USD (18 decimals)
    mapping(address => uint256) public tokenPrices;

    // Last update timestamp
    uint256 public lastUpdateTime;

    // Authorized updaters (AI agent, owner)
    mapping(address => bool) public authorizedUpdaters;

    // Price staleness threshold
    uint256 public stalenessThreshold = 1 hours;

    // ============ Events ============

    event ETHPriceUpdated(uint256 newPrice, uint256 timestamp);
    event TokenPriceUpdated(address indexed token, uint256 newPrice, uint256 timestamp);
    event UpdaterAdded(address indexed updater);
    event UpdaterRemoved(address indexed updater);
    event StalenessThresholdUpdated(uint256 newThreshold);

    // ============ Constructor ============

    constructor() Ownable(msg.sender) {
        authorizedUpdaters[msg.sender] = true;
    }

    // ============ Modifiers ============

    modifier onlyUpdater() {
        require(authorizedUpdaters[msg.sender], "Not authorized updater");
        _;
    }

    // ============ Update Functions ============

    /**
     * @notice Update ETH price
     * @param _price Price in USD with 18 decimals
     */
    function updateETHPrice(uint256 _price) external onlyUpdater {
        require(_price > 0, "Invalid price");
        ethPrice = _price;
        lastUpdateTime = block.timestamp;
        emit ETHPriceUpdated(_price, block.timestamp);
    }

    /**
     * @notice Update token price
     * @param token Token address
     * @param _price Price in USD with 18 decimals
     */
    function updateTokenPrice(address token, uint256 _price) external onlyUpdater {
        require(token != address(0), "Invalid token");
        require(_price > 0, "Invalid price");
        tokenPrices[token] = _price;
        lastUpdateTime = block.timestamp;
        emit TokenPriceUpdated(token, _price, block.timestamp);
    }

    /**
     * @notice Batch update multiple token prices
     * @param tokens Array of token addresses
     * @param prices Array of prices
     */
    function batchUpdatePrices(
        address[] calldata tokens,
        uint256[] calldata prices
    ) external onlyUpdater {
        require(tokens.length == prices.length, "Length mismatch");

        for (uint256 i = 0; i < tokens.length; i++) {
            require(tokens[i] != address(0), "Invalid token");
            require(prices[i] > 0, "Invalid price");
            tokenPrices[tokens[i]] = prices[i];
            emit TokenPriceUpdated(tokens[i], prices[i], block.timestamp);
        }

        lastUpdateTime = block.timestamp;
    }

    // ============ View Functions ============

    /**
     * @notice Get ETH price in USD
     * @return Price with 18 decimals
     */
    function getETHPrice() external view returns (uint256) {
        require(ethPrice > 0, "ETH price not set");
        require(!isPriceStale(), "Price is stale");
        return ethPrice;
    }

    /**
     * @notice Get token price in USD
     * @param token Token address
     * @return Price with 18 decimals
     */
    function getTokenPrice(address token) external view returns (uint256) {
        require(tokenPrices[token] > 0, "Token price not set");
        require(!isPriceStale(), "Price is stale");
        return tokenPrices[token];
    }

    /**
     * @notice Check if prices are stale
     */
    function isPriceStale() public view returns (bool) {
        return block.timestamp > lastUpdateTime + stalenessThreshold;
    }

    /**
     * @notice Get time until prices go stale
     */
    function timeUntilStale() external view returns (uint256) {
        uint256 staleTime = lastUpdateTime + stalenessThreshold;
        if (block.timestamp >= staleTime) {
            return 0;
        }
        return staleTime - block.timestamp;
    }

    // ============ Admin Functions ============

    /**
     * @notice Add authorized updater
     */
    function addUpdater(address updater) external onlyOwner {
        authorizedUpdaters[updater] = true;
        emit UpdaterAdded(updater);
    }

    /**
     * @notice Remove authorized updater
     */
    function removeUpdater(address updater) external onlyOwner {
        authorizedUpdaters[updater] = false;
        emit UpdaterRemoved(updater);
    }

    /**
     * @notice Update staleness threshold
     */
    function setStalenessThreshold(uint256 _threshold) external onlyOwner {
        stalenessThreshold = _threshold;
        emit StalenessThresholdUpdated(_threshold);
    }
}
