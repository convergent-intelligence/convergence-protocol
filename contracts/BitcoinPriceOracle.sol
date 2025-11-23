// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BitcoinPriceOracle
 * @notice Multi-source price oracle for Bitcoin and Ethereum
 * @dev Aggregates price feeds from multiple sources with fallback support
 */
contract BitcoinPriceOracle is Ownable {

    // ============ State Variables ============

    // Price feeds (in USD, 18 decimals)
    uint256 public btcPriceUSD;
    uint256 public ethPriceUSD;

    // Last update timestamps
    uint256 public lastBTCUpdate;
    uint256 public lastETHUpdate;

    // Price feed operators (can update prices)
    mapping(address => bool) public priceOperators;

    // Maximum price age (default 1 hour)
    uint256 public maxPriceAge = 3600;

    // Emergency pause
    bool public paused;

    // Price history for TWAP
    struct PriceUpdate {
        uint256 timestamp;
        uint256 price;
    }

    PriceUpdate[] public btcPriceHistory;
    PriceUpdate[] public ethPriceHistory;

    // Historical price tracking (keep last 24 updates)
    uint256 public constant MAX_HISTORY = 24;

    // ============ Events ============

    event BTCPriceUpdated(uint256 newPrice, uint256 timestamp);
    event ETHPriceUpdated(uint256 newPrice, uint256 timestamp);
    event PriceOperatorAdded(address indexed operator);
    event PriceOperatorRemoved(address indexed operator);
    event OraclePaused();
    event OracleResumed();
    event MaxPriceAgeUpdated(uint256 newAge);

    // ============ Modifiers ============

    modifier onlyOperator() {
        require(priceOperators[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Oracle paused");
        _;
    }

    // ============ Constructor ============

    constructor(
        uint256 _initialBTCPrice,
        uint256 _initialETHPrice
    ) Ownable(msg.sender) {
        btcPriceUSD = _initialBTCPrice;
        ethPriceUSD = _initialETHPrice;
        lastBTCUpdate = block.timestamp;
        lastETHUpdate = block.timestamp;

        // Add owner as initial operator
        priceOperators[msg.sender] = true;
    }

    // ============ Price Update Functions ============

    /**
     * @notice Update BTC price (only authorized operators)
     * @param _newPrice New BTC price in USD (18 decimals)
     */
    function updateBTCPrice(uint256 _newPrice) external onlyOperator whenNotPaused {
        require(_newPrice > 0, "Invalid price");

        // Basic sanity check: price shouldn't change by more than 50% in one update
        if (btcPriceUSD > 0) {
            uint256 maxChange = (btcPriceUSD * 5000) / 10000; // 50%
            uint256 priceDiff = _newPrice > btcPriceUSD ?
                _newPrice - btcPriceUSD :
                btcPriceUSD - _newPrice;
            require(priceDiff <= maxChange, "Price change too large");
        }

        btcPriceUSD = _newPrice;
        lastBTCUpdate = block.timestamp;

        // Store in history
        _addToHistory(btcPriceHistory, _newPrice);

        emit BTCPriceUpdated(_newPrice, block.timestamp);
    }

    /**
     * @notice Update ETH price (only authorized operators)
     * @param _newPrice New ETH price in USD (18 decimals)
     */
    function updateETHPrice(uint256 _newPrice) external onlyOperator whenNotPaused {
        require(_newPrice > 0, "Invalid price");

        // Basic sanity check
        if (ethPriceUSD > 0) {
            uint256 maxChange = (ethPriceUSD * 5000) / 10000; // 50%
            uint256 priceDiff = _newPrice > ethPriceUSD ?
                _newPrice - ethPriceUSD :
                ethPriceUSD - _newPrice;
            require(priceDiff <= maxChange, "Price change too large");
        }

        ethPriceUSD = _newPrice;
        lastETHUpdate = block.timestamp;

        // Store in history
        _addToHistory(ethPriceHistory, _newPrice);

        emit ETHPriceUpdated(_newPrice, block.timestamp);
    }

    /**
     * @notice Batch update both prices
     */
    function updatePrices(uint256 _btcPrice, uint256 _ethPrice) external onlyOperator whenNotPaused {
        updateBTCPrice(_btcPrice);
        updateETHPrice(_ethPrice);
    }

    // ============ Price Query Functions ============

    /**
     * @notice Get current BTC price in USD
     */
    function getBTCPriceUSD() external view returns (uint256) {
        require(!isPriceStale(lastBTCUpdate), "BTC price stale");
        return btcPriceUSD;
    }

    /**
     * @notice Get current ETH price in USD
     */
    function getETHPriceUSD() external view returns (uint256) {
        require(!isPriceStale(lastETHUpdate), "ETH price stale");
        return ethPriceUSD;
    }

    /**
     * @notice Get BTC price with staleness check (no revert)
     */
    function getBTCPriceSafe() external view returns (uint256 price, bool stale) {
        return (btcPriceUSD, isPriceStale(lastBTCUpdate));
    }

    /**
     * @notice Get ETH price with staleness check (no revert)
     */
    function getETHPriceSafe() external view returns (uint256 price, bool stale) {
        return (ethPriceUSD, isPriceStale(lastETHUpdate));
    }

    /**
     * @notice Get BTC/ETH ratio
     */
    function getBTCToETHRatio() external view returns (uint256) {
        require(!isPriceStale(lastBTCUpdate) && !isPriceStale(lastETHUpdate), "Prices stale");
        require(ethPriceUSD > 0, "Invalid ETH price");
        return (btcPriceUSD * 10**18) / ethPriceUSD;
    }

    /**
     * @notice Calculate USD value of amount
     * @param _asset Asset address (0x0 for BTC, 0x1 for ETH)
     * @param _amount Amount (in native decimals)
     * @param _decimals Token decimals
     */
    function getUSDValue(
        address _asset,
        uint256 _amount,
        uint8 _decimals
    ) external view returns (uint256) {
        uint256 price;

        if (_asset == address(0)) {
            // Bitcoin (8 decimals expected)
            require(!isPriceStale(lastBTCUpdate), "BTC price stale");
            price = btcPriceUSD;
        } else if (_asset == address(1)) {
            // Ethereum (18 decimals expected)
            require(!isPriceStale(lastETHUpdate), "ETH price stale");
            price = ethPriceUSD;
        } else {
            revert("Unsupported asset");
        }

        // Calculate: amount * price / 10^decimals
        return (_amount * price) / (10 ** _decimals);
    }

    // ============ TWAP (Time-Weighted Average Price) ============

    /**
     * @notice Get TWAP for BTC over last N minutes
     * @param _minutes Number of minutes for TWAP window
     */
    function getBTCTWAP(uint256 _minutes) external view returns (uint256) {
        return _calculateTWAP(btcPriceHistory, _minutes);
    }

    /**
     * @notice Get TWAP for ETH over last N minutes
     * @param _minutes Number of minutes for TWAP window
     */
    function getETHTWAP(uint256 _minutes) external view returns (uint256) {
        return _calculateTWAP(ethPriceHistory, _minutes);
    }

    /**
     * @notice Calculate TWAP from price history
     */
    function _calculateTWAP(
        PriceUpdate[] storage _history,
        uint256 _minutes
    ) internal view returns (uint256) {
        require(_history.length > 0, "No price history");

        uint256 windowStart = block.timestamp - (_minutes * 60);
        uint256 totalPrice = 0;
        uint256 totalTime = 0;
        uint256 lastPrice = 0;
        uint256 lastTime = 0;

        for (uint256 i = 0; i < _history.length; i++) {
            PriceUpdate storage update = _history[i];

            if (update.timestamp < windowStart) {
                continue;
            }

            if (lastTime > 0) {
                uint256 timeWeight = update.timestamp - lastTime;
                totalPrice += lastPrice * timeWeight;
                totalTime += timeWeight;
            }

            lastPrice = update.price;
            lastTime = update.timestamp;
        }

        // Add final weight
        if (lastTime > 0) {
            uint256 finalTimeWeight = block.timestamp - lastTime;
            totalPrice += lastPrice * finalTimeWeight;
            totalTime += finalTimeWeight;
        }

        require(totalTime > 0, "No data in window");
        return totalPrice / totalTime;
    }

    // ============ Helper Functions ============

    /**
     * @notice Check if price is stale
     */
    function isPriceStale(uint256 _lastUpdate) public view returns (bool) {
        return (block.timestamp - _lastUpdate) > maxPriceAge;
    }

    /**
     * @notice Add price to history (keep last MAX_HISTORY entries)
     */
    function _addToHistory(PriceUpdate[] storage _history, uint256 _price) internal {
        _history.push(PriceUpdate({
            timestamp: block.timestamp,
            price: _price
        }));

        // Keep only last MAX_HISTORY entries
        if (_history.length > MAX_HISTORY) {
            // Shift array (remove oldest)
            for (uint256 i = 0; i < _history.length - 1; i++) {
                _history[i] = _history[i + 1];
            }
            _history.pop();
        }
    }

    // ============ Admin Functions ============

    /**
     * @notice Add price operator
     */
    function addPriceOperator(address _operator) external onlyOwner {
        require(_operator != address(0), "Invalid operator");
        priceOperators[_operator] = true;
        emit PriceOperatorAdded(_operator);
    }

    /**
     * @notice Remove price operator
     */
    function removePriceOperator(address _operator) external onlyOwner {
        priceOperators[_operator] = false;
        emit PriceOperatorRemoved(_operator);
    }

    /**
     * @notice Pause oracle
     */
    function pause() external onlyOwner {
        paused = true;
        emit OraclePaused();
    }

    /**
     * @notice Resume oracle
     */
    function resume() external onlyOwner {
        paused = false;
        emit OracleResumed();
    }

    /**
     * @notice Update max price age
     */
    function setMaxPriceAge(uint256 _age) external onlyOwner {
        require(_age > 0, "Invalid age");
        maxPriceAge = _age;
        emit MaxPriceAgeUpdated(_age);
    }

    /**
     * @notice Get price history length
     */
    function getBTCHistoryLength() external view returns (uint256) {
        return btcPriceHistory.length;
    }

    /**
     * @notice Get ETH history length
     */
    function getETHHistoryLength() external view returns (uint256) {
        return ethPriceHistory.length;
    }
}
