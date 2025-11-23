// ============================================
// CONVERGENCE PROTOCOL DASHBOARD
// Main Application Logic
// ============================================

// Global state
const DashboardState = {
    connected: false,
    userAddress: null,
    operatorMode: false,
    wsConnection: null,
    contractAddress: process.env.REACT_APP_RESERVE_DASHBOARD_ADDRESS || '0x...',
    exchangeAddress: process.env.REACT_APP_TALLY_EXCHANGE_ADDRESS || '0x...',
    provider: null,
    signer: null,
    contracts: {
        reserveDashboard: null,
        tallyExchange: null,
        tally: null
    },
    realTimeData: {
        totalReserveUSD: 0,
        tallyPrice: 0,
        tallyCirculation: 0,
        reserves: {
            bitcoin: 0,
            ethereum: 0,
            tron: 0,
            solana: 0,
            cosmos: 0,
            dogecoin: 0
        },
        prices: {
            bitcoin: 0,
            ethereum: 0,
            tron: 0,
            solana: 0,
            cosmos: 0,
            dogecoin: 0
        },
        slippage: 0,
        healthStatus: 'healthy'
    },
    priceHistory: {
        tally: [],
        reserves: {}
    }
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🔷 Convergence Protocol Dashboard Initializing...');

    // Initialize UI
    initializeNavigation();
    initializeEventListeners();
    initializeCharts();

    // Try to connect to provider
    await initializeWeb3();

    // Initialize real-time data updates
    startRealtimeUpdates();

    // Initialize WebSocket connection for real-time updates
    initializeWebSocket();

    console.log('✅ Dashboard Ready');
});

// ============================================
// TAB NAVIGATION
// ============================================

function initializeNavigation() {
    const navTabs = document.querySelectorAll('.nav-tab');
    const tabContents = document.querySelectorAll('.tab-content');

    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.getAttribute('data-tab');

            // Update active nav tab
            navTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Update active content
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(`${targetTab}-tab`).classList.add('active');

            // Log analytics
            console.log(`📊 Navigated to: ${targetTab}`);
        });
    });
}

// ============================================
// WEB3 CONNECTION
// ============================================

async function initializeWeb3() {
    try {
        // Check if MetaMask is available
        if (typeof window.ethereum !== 'undefined') {
            DashboardState.provider = new ethers.BrowserProvider(window.ethereum);

            // Listen for account changes
            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', handleChainChanged);

            // Try to get current accounts
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                await connectWallet(accounts[0]);
            }
        } else {
            console.warn('MetaMask not detected. Dashboard in view-only mode.');
            updateConnectionStatus(false);
        }
    } catch (error) {
        console.error('❌ Web3 initialization error:', error);
        updateConnectionStatus(false);
    }
}

async function connectWallet(address) {
    try {
        DashboardState.userAddress = address;
        DashboardState.signer = await DashboardState.provider.getSigner();
        DashboardState.connected = true;

        // Initialize contracts
        await initializeContracts();

        updateConnectionStatus(true);
        console.log(`✅ Connected wallet: ${address.substring(0, 10)}...`);

        return true;
    } catch (error) {
        console.error('❌ Wallet connection error:', error);
        updateConnectionStatus(false);
        return false;
    }
}

async function initializeContracts() {
    try {
        if (!DashboardState.signer) return;

        // Import ABIs
        const reserveDashboardABI = await fetchABI('RESERVE_DASHBOARD');
        const tallyExchangeABI = await fetchABI('TALLY_EXCHANGE');
        const erc20ABI = await fetchABI('ERC20');

        // Initialize contract instances
        DashboardState.contracts.reserveDashboard = new ethers.Contract(
            DashboardState.contractAddress,
            reserveDashboardABI,
            DashboardState.signer
        );

        DashboardState.contracts.tallyExchange = new ethers.Contract(
            DashboardState.exchangeAddress,
            tallyExchangeABI,
            DashboardState.signer
        );

        // Note: TALLY token address would be set from environment

        console.log('✅ Contracts initialized');
    } catch (error) {
        console.error('❌ Contract initialization error:', error);
    }
}

async function fetchABI(contractName) {
    // Placeholder for ABI fetching
    // In production, these would be imported from compiled contracts
    const ABIs = {
        'RESERVE_DASHBOARD': [],
        'TALLY_EXCHANGE': [],
        'ERC20': []
    };
    return ABIs[contractName] || [];
}

function handleAccountsChanged(accounts) {
    if (accounts.length > 0) {
        connectWallet(accounts[0]);
    } else {
        DashboardState.connected = false;
        updateConnectionStatus(false);
    }
}

function handleChainChanged(chainId) {
    // In production, would validate correct chain
    console.log('Chain changed to:', chainId);
    window.location.reload();
}

function updateConnectionStatus(connected) {
    DashboardState.connected = connected;
    const statusEl = document.getElementById('connectionStatus');

    if (connected) {
        statusEl.textContent = '● Connected';
        statusEl.classList.add('connected');
        statusEl.style.color = '#10b981';
    } else {
        statusEl.textContent = '● Disconnected';
        statusEl.classList.remove('connected');
        statusEl.style.color = '#ef4444';
    }
}

// ============================================
// REAL-TIME DATA UPDATES
// ============================================

function startRealtimeUpdates() {
    // Update metrics every 10 seconds
    setInterval(updateDashboardMetrics, 10000);

    // Update price data every 30 seconds
    setInterval(updatePriceData, 30000);

    // Update last update timestamp
    setInterval(updateLastUpdateTime, 1000);

    // Initial update
    updateDashboardMetrics();
    updatePriceData();
}

function updateLastUpdateTime() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString();
    document.getElementById('lastUpdate').textContent = `Last updated: ${timeStr}`;
}

async function updateDashboardMetrics() {
    try {
        // In production, these would fetch from smart contracts
        // For now, we'll use placeholder data and update periodically

        // Simulate real-time data
        const data = await fetchDashboardData();

        // Update state
        Object.assign(DashboardState.realTimeData, data);

        // Update UI elements
        updateMetricsUI();

    } catch (error) {
        console.error('Error updating metrics:', error);
    }
}

async function fetchDashboardData() {
    // Placeholder function - would call smart contract in production
    return {
        totalReserveUSD: 2500000 + Math.random() * 50000,
        tallyPrice: 0.00185 + (Math.random() * 0.0001 - 0.00005),
        tallyCirculation: 1500000000,
        reserves: {
            bitcoin: 50 + (Math.random() * 0.1 - 0.05),
            ethereum: 300 + (Math.random() * 1 - 0.5),
            tron: 2000000 + (Math.random() * 5000 - 2500),
            solana: 5000 + (Math.random() * 10 - 5),
            cosmos: 200000 + (Math.random() * 500 - 250),
            dogecoin: 2000000 + (Math.random() * 5000 - 2500)
        },
        slippage: Math.random() * 0.5,
        healthStatus: 'healthy'
    };
}

function updateMetricsUI() {
    const data = DashboardState.realTimeData;

    // Update main metrics
    setElementValue('totalReserveUSD', `$${formatCurrency(data.totalReserveUSD)}`);
    setElementValue('tallyCirculation', formatNumber(data.tallyCirculation));
    setElementValue('tallyPrice', `$${data.tallyPrice.toFixed(6)}`);

    // Update backing ratio
    const backingRatio = (data.totalReserveUSD / (data.tallyCirculation * data.tallyPrice)) * 100;
    setElementValue('backingRatio', `${backingRatio.toFixed(2)}%`);

    // Update health status
    const healthEl = document.getElementById('healthStatus');
    healthEl.textContent = `● ${data.healthStatus.toUpperCase()}`;
    healthEl.classList = `metric-value health-status ${data.healthStatus}-status`;

    // Update slippage
    setElementValue('lastSlippage', `${data.slippage.toFixed(2)}%`);

    // Update chain breakdowns
    updateChainMetrics(data);
}

function updateChainMetrics(data) {
    const chains = [
        { key: 'bitcoin', symbol: 'BTC', icon: '₿' },
        { key: 'ethereum', symbol: 'ETH', icon: 'Ξ' },
        { key: 'tron', symbol: 'TRX', icon: '🔗' },
        { key: 'solana', symbol: 'SOL', icon: '◎' },
        { key: 'cosmos', symbol: 'ATOM', icon: '⚛' },
        { key: 'dogecoin', symbol: 'DOGE', icon: '🐕' }
    ];

    const prices = data.prices;
    const reserves = data.reserves;
    const totalUSD = data.totalReserveUSD;

    // Example prices (would come from oracle in production)
    const examplePrices = {
        bitcoin: 45000,
        ethereum: 1750,
        tron: 0.125,
        solana: 175,
        cosmos: 8.5,
        dogecoin: 0.12
    };

    chains.forEach(chain => {
        const amount = reserves[chain.key] || 0;
        const price = prices[chain.key] || examplePrices[chain.key] || 0;
        const value = amount * price;
        const percentage = (value / totalUSD) * 100;

        setElementValue(`${chain.key}Amount`, `${formatNumber(amount)} ${chain.symbol}`);
        setElementValue(`${chain.key}Value`, `$${formatCurrency(value)}`);
        setElementValue(`${chain.key}Percent`, `${percentage.toFixed(1)}%`);
    });
}

async function updatePriceData() {
    // Placeholder for price data updates
    // Would fetch from oracle in production
    console.log('📊 Updating price data...');
}

// ============================================
// WEBSOCKET FOR REAL-TIME UPDATES
// ============================================

function initializeWebSocket() {
    try {
        const wsUrl = process.env.REACT_APP_WEBSOCKET_URL || 'ws://localhost:8080/dashboard';

        DashboardState.wsConnection = new WebSocket(wsUrl);

        DashboardState.wsConnection.onopen = () => {
            console.log('✅ WebSocket connected');
        };

        DashboardState.wsConnection.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                handleWebSocketMessage(data);
            } catch (error) {
                console.error('WebSocket message parse error:', error);
            }
        };

        DashboardState.wsConnection.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        DashboardState.wsConnection.onclose = () => {
            console.warn('⚠️ WebSocket disconnected. Reconnecting...');
            setTimeout(initializeWebSocket, 3000);
        };

    } catch (error) {
        console.error('WebSocket initialization error:', error);
    }
}

function handleWebSocketMessage(data) {
    // Update state with real-time data
    if (data.type === 'reserve_update') {
        Object.assign(DashboardState.realTimeData, data.payload);
        updateMetricsUI();
    }

    if (data.type === 'price_update') {
        Object.assign(DashboardState.realTimeData.prices, data.payload);
        updateMetricsUI();
    }

    if (data.type === 'transaction') {
        addTransactionToHistory(data.payload);
    }

    if (data.type === 'slippage_alert') {
        handleSlippageAlert(data.payload);
    }
}

// ============================================
// EVENT LISTENERS
// ============================================

function initializeEventListeners() {
    // Donation portal
    initializeDonationPortal();

    // Exchange panel
    initializeExchangePanel();

    // Burn services
    initializeBurnServices();

    // Operator controls
    initializeOperatorControls();
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function setElementValue(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    }
}

function formatCurrency(value) {
    return value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function formatNumber(value) {
    return value.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    const text = element.value || element.textContent;

    navigator.clipboard.writeText(text).then(() => {
        const btn = event.target;
        const originalText = btn.textContent;
        btn.textContent = '✅ Copied!';
        setTimeout(() => {
            btn.textContent = originalText;
        }, 2000);
    }).catch(err => {
        console.error('Copy failed:', err);
    });
}

function addTransactionToHistory(txData) {
    const tbody = document.getElementById('transactionsBody');

    if (tbody.querySelector('.no-data')) {
        tbody.innerHTML = '';
    }

    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${new Date(txData.timestamp).toLocaleString()}</td>
        <td>${txData.type}</td>
        <td>${txData.chain}</td>
        <td>${txData.details}</td>
        <td>${txData.amount}</td>
        <td><span class="status-badge ${txData.status}">${txData.status}</span></td>
        <td><a href="${txData.link}" target="_blank">🔗 View</a></td>
    `;

    tbody.insertBefore(row, tbody.firstChild);
}

function handleSlippageAlert(data) {
    console.warn('🚨 Slippage Alert:', data);

    // Visual alert
    const el = document.getElementById('lastSlippage');
    if (el) {
        el.style.color = '#ef4444';
        el.textContent = `${data.slippage}% ⚠️`;
        setTimeout(() => {
            el.style.color = '';
            updateMetricsUI();
        }, 5000);
    }
}

// ============================================
// PLACEHOLDER SECTION INITIALIZERS
// (Detailed implementations in separate files)
// ============================================

function initializeDonationPortal() {
    // Implemented in donation-portal.js
    console.log('💰 Donation portal initialized');
}

function initializeExchangePanel() {
    // Implemented in exchange-panel.js
    console.log('🔄 Exchange panel initialized');
}

function initializeBurnServices() {
    // Implemented in monitoring.js
    console.log('🔥 Burn services initialized');
}

function initializeOperatorControls() {
    const authBtn = document.getElementById('operatorAuthBtn');
    if (authBtn) {
        authBtn.addEventListener('click', handleOperatorAuth);
    }
}

async function handleOperatorAuth() {
    try {
        if (!DashboardState.connected) {
            alert('Please connect your wallet first');
            return;
        }

        DashboardState.operatorMode = true;
        document.getElementById('operatorControls').style.display = 'grid';
        document.getElementById('operatorAuthStatus').textContent = 'Connected';
        console.log('🔐 Operator mode activated');

    } catch (error) {
        console.error('Operator auth error:', error);
    }
}

// ============================================
// CHARTS
// ============================================

let reserveChartInstance = null;
let tallyPriceChartInstance = null;

function initializeCharts() {
    initializeReserveChart();
    initializeTallyPriceChart();
}

function initializeReserveChart() {
    const ctx = document.getElementById('reserveChart');
    if (!ctx) return;

    reserveChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Bitcoin', 'Ethereum', 'Tron', 'Solana', 'Cosmos', 'Dogecoin'],
            datasets: [{
                data: [45, 15, 10, 10, 15, 5],
                backgroundColor: [
                    '#f7931a',
                    '#627eea',
                    '#f01d28',
                    '#14f195',
                    '#2d82c7',
                    '#ba3636'
                ],
                borderColor: '#ffffff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: { size: 12 }
                    }
                }
            }
        }
    });
}

function initializeTallyPriceChart() {
    const ctx = document.getElementById('tallyPriceChart');
    if (!ctx) return;

    const last24h = generatePriceHistory(24);

    tallyPriceChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: last24h.labels,
            datasets: [{
                label: 'TALLY Price (USD)',
                data: last24h.prices,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 3,
                pointBackgroundColor: '#3b82f6',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toFixed(6);
                        }
                    }
                }
            }
        }
    });
}

function generatePriceHistory(hours) {
    const labels = [];
    const prices = [];

    for (let i = hours; i >= 0; i--) {
        const date = new Date();
        date.setHours(date.getHours() - i);
        labels.push(date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
        prices.push(0.0018 + Math.random() * 0.0005);
    }

    return { labels, prices };
}

// Export for use in other modules
window.Dashboard = {
    state: DashboardState,
    formatCurrency,
    formatNumber,
    setElementValue,
    copyToClipboard,
    addTransactionToHistory
};

console.log('✅ Dashboard.js loaded');
