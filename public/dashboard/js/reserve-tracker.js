// ============================================
// RESERVE TRACKER MODULE
// Real-time reserve tracking and health monitoring
// ============================================

const ReserveTracker = (() => {
    let updateInterval = null;
    let priceSnapshotHistory = [];
    const MAX_HISTORY_POINTS = 288; // 24 hours at 5-min intervals

    // Initialize
    function init() {
        console.log('📊 Reserve Tracker initializing...');
        startReserveTracking();
    }

    // Start continuous tracking
    function startReserveTracking() {
        // Initial update
        updateReserveData();

        // Update every 30 seconds
        updateInterval = setInterval(updateReserveData, 30000);
    }

    // Update reserve data from smart contract
    async function updateReserveData() {
        try {
            if (Dashboard.state.contracts.reserveDashboard) {
                // Fetch from smart contract
                const totalReserve = await Dashboard.state.contracts.reserveDashboard.getTotalReserveUSD();
                const tallyPrice = await Dashboard.state.contracts.reserveDashboard.getTallyPrice();
                const health = await Dashboard.state.contracts.reserveDashboard.getReserveHealth();

                // Update state
                Dashboard.state.realTimeData.totalReserveUSD = parseFloat(ethers.formatUnits(totalReserve, 18));
                Dashboard.state.realTimeData.tallyPrice = parseFloat(ethers.formatUnits(tallyPrice, 18));

                // Record price snapshot
                recordPriceSnapshot(Dashboard.state.realTimeData.tallyPrice);

                // Update health indicators
                updateHealthStatus(health);

            } else {
                // Demo data
                await updateDemoReserveData();
            }
        } catch (error) {
            console.error('❌ Error updating reserves:', error);
        }
    }

    // Demo data for development
    async function updateDemoReserveData() {
        const basePrice = 0.00185;
        const volatility = 0.00005;
        const randomPrice = basePrice + (Math.random() - 0.5) * volatility;

        Dashboard.state.realTimeData.totalReserveUSD = 2500000 + Math.random() * 100000;
        Dashboard.state.realTimeData.tallyPrice = randomPrice;

        recordPriceSnapshot(randomPrice);
    }

    // Record price snapshot for history
    function recordPriceSnapshot(price) {
        priceSnapshotHistory.push({
            price: price,
            timestamp: Date.now()
        });

        if (priceSnapshotHistory.length > MAX_HISTORY_POINTS) {
            priceSnapshotHistory.shift();
        }

        // Calculate 24h statistics
        calculatePriceStats();
    }

    // Calculate statistics
    function calculatePriceStats() {
        if (priceSnapshotHistory.length === 0) return;

        const prices = priceSnapshotHistory.map(p => p.price);
        const highest = Math.max(...prices);
        const lowest = Math.min(...prices);
        const oldest = priceSnapshotHistory[0].price;
        const newest = priceSnapshotHistory[priceSnapshotHistory.length - 1].price;
        const change = ((newest - oldest) / oldest) * 100;

        // Update UI
        const trendEl = document.getElementById('priceTrend');
        if (trendEl) {
            const arrow = change >= 0 ? '↑' : '↓';
            const color = change >= 0 ? 'green' : 'red';
            trendEl.textContent = `${arrow} ${Math.abs(change).toFixed(2)}% 24h`;
            trendEl.style.color = color === 'green' ? '#10b981' : '#ef4444';
        }
    }

    // Update health status
    function updateHealthStatus(health) {
        const backingRatio = health.backingRatio ? parseFloat(ethers.formatUnits(health.backingRatio, 18)) : 1;
        const slippage = health.slippage ? parseFloat(ethers.formatUnits(health.slippage, 18)) : 0;

        const status = backingRatio >= 1 && slippage < 1 ? 'healthy' :
                       backingRatio >= 0.95 || slippage < 1.5 ? 'warning' : 'critical';

        Dashboard.state.realTimeData.healthStatus = status;

        const statusEl = document.getElementById('healthStatus');
        if (statusEl) {
            statusEl.textContent = `● ${status.toUpperCase()}`;
            statusEl.className = `metric-value health-status ${status}`;
        }

        const detailEl = document.getElementById('healthDetail');
        if (detailEl) {
            detailEl.textContent = `Backing: ${(backingRatio * 100).toFixed(1)}% | Slippage: ${slippage.toFixed(2)}%`;
        }
    }

    // Get reserve health
    function getHealth() {
        return {
            status: Dashboard.state.realTimeData.healthStatus,
            backingRatio: (Dashboard.state.realTimeData.totalReserveUSD /
                          (Dashboard.state.realTimeData.tallyCirculation * Dashboard.state.realTimeData.tallyPrice)) * 100,
            slippage: Dashboard.state.realTimeData.slippage,
            lastUpdate: new Date().toLocaleTimeString()
        };
    }

    // Get price history
    function getPriceHistory(hours = 24) {
        const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
        return priceSnapshotHistory.filter(p => p.timestamp >= cutoffTime);
    }

    // Stop tracking
    function stop() {
        if (updateInterval) {
            clearInterval(updateInterval);
        }
    }

    return {
        init,
        getHealth,
        getPriceHistory,
        stop,
        recordPriceSnapshot
    };
})();

// Initialize when document is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ReserveTracker.init());
} else {
    ReserveTracker.init();
}

console.log('✅ reserve-tracker.js loaded');
