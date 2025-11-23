#!/usr/bin/env node

// ============================================
// CONVERGENCE PROTOCOL RESERVE DASHBOARD
// Real-Time Monitoring Service
// ============================================

const WebSocket = require('ws');
const express = require('express');
const http = require('http');
const ethers = require('ethers');
require('dotenv').config();

// Configuration
const PORT = process.env.PORT || 8080;
const ETHEREUM_RPC = process.env.ETHEREUM_RPC || 'https://eth-mainnet.g.alchemy.com/v2/';
const RESERVE_DASHBOARD = process.env.RESERVE_DASHBOARD_ADDRESS || '0x...';
const UPDATE_INTERVAL = process.env.UPDATE_INTERVAL || 30000; // 30 seconds

// State management
const MonitoringState = {
    reserves: {
        bitcoin: 0,
        ethereum: 0,
        tron: 0,
        solana: 0,
        cosmos: 0,
        dogecoin: 0
    },
    prices: {
        bitcoin: 45000,
        ethereum: 1750,
        tron: 0.125,
        solana: 175,
        cosmos: 8.5,
        dogecoin: 0.12
    },
    totalReserveUSD: 0,
    tallyCirculation: 0,
    tallyPrice: 0,
    slippage: 0,
    lastUpdate: null,
    transactions: [],
    priceHistory: [],
    healthStatus: 'healthy'
};

const connectedClients = new Set();

// ============================================
// EXPRESS SERVER
// ============================================

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.json());
app.use(express.static('public'));

// API Endpoints
app.get('/api/reserves', (req, res) => {
    res.json(MonitoringState);
});

app.get('/api/health', (req, res) => {
    res.json({
        status: MonitoringState.healthStatus,
        reserves: MonitoringState.reserves,
        prices: MonitoringState.prices,
        slippage: MonitoringState.slippage,
        lastUpdate: MonitoringState.lastUpdate
    });
});

app.get('/api/transactions', (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    res.json(MonitoringState.transactions.slice(0, limit));
});

app.get('/api/price-history', (req, res) => {
    const hours = parseInt(req.query.hours) || 24;
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    res.json(MonitoringState.priceHistory.filter(p => p.timestamp >= cutoff));
});

// ============================================
// WEBSOCKET SERVER
// ============================================

wss.on('connection', (ws) => {
    console.log(`✅ Client connected. Total: ${wss.clients.size}`);
    connectedClients.add(ws);

    // Send current state immediately
    ws.send(JSON.stringify({
        type: 'initial_state',
        payload: MonitoringState
    }));

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            handleClientMessage(data, ws);
        } catch (error) {
            console.error('WebSocket message error:', error);
        }
    });

    ws.on('close', () => {
        connectedClients.delete(ws);
        console.log(`❌ Client disconnected. Total: ${wss.clients.size}`);
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

function handleClientMessage(data, ws) {
    console.log('📨 Message from client:', data.type);

    if (data.type === 'subscribe_updates') {
        // Client wants real-time updates
        ws.isSubscribed = true;
    }

    if (data.type === 'alert_acknowledge') {
        // Client acknowledged an alert
        console.log(`🔔 Alert acknowledged: ${data.alert_type}`);
    }
}

function broadcastUpdate(type, payload) {
    const message = JSON.stringify({ type, payload, timestamp: Date.now() });

    connectedClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN && client.isSubscribed !== false) {
            client.send(message);
        }
    });
}

// ============================================
// PROVIDER SETUP
// ============================================

const provider = new ethers.JsonRpcProvider(ETHEREUM_RPC);
let reserveDashboardContract = null;

async function initializeProvider() {
    try {
        // Create contract instance (read-only)
        const ABI = [
            'function getTotalReserveUSD() public view returns (uint256)',
            'function getTallyPrice() public view returns (uint256)',
            'function getTallyCirculation() public view returns (uint256)',
            'function getReserveHealth() public view returns (tuple(uint256 backingRatio, uint256 slippage, string status))',
            'function getChainReserve(string memory chainName) public view returns (uint256)'
        ];

        reserveDashboardContract = new ethers.Contract(RESERVE_DASHBOARD, ABI, provider);

        console.log('✅ Ethereum provider initialized');
        console.log(`📊 Monitoring contract: ${RESERVE_DASHBOARD}`);

        return true;
    } catch (error) {
        console.error('❌ Provider initialization error:', error);
        return false;
    }
}

// ============================================
// DATA FETCHING
// ============================================

async function fetchReserveData() {
    try {
        if (reserveDashboardContract) {
            // Fetch from smart contract
            const totalReserve = await reserveDashboardContract.getTotalReserveUSD();
            const tallyPrice = await reserveDashboardContract.getTallyPrice();
            const tallyCirculation = await reserveDashboardContract.getTallyCirculation();
            const health = await reserveDashboardContract.getReserveHealth();

            MonitoringState.totalReserveUSD = parseFloat(ethers.formatUnits(totalReserve, 18));
            MonitoringState.tallyPrice = parseFloat(ethers.formatUnits(tallyPrice, 18));
            MonitoringState.tallyCirculation = parseFloat(ethers.formatUnits(tallyCirculation, 18));
            MonitoringState.slippage = calculateSlippage();
            MonitoringState.healthStatus = health.status || 'healthy';

        } else {
            // Demo data
            updateDemoData();
        }

        MonitoringState.lastUpdate = new Date().toISOString();

        // Broadcast update
        broadcastUpdate('reserve_update', {
            totalReserveUSD: MonitoringState.totalReserveUSD,
            tallyPrice: MonitoringState.tallyPrice,
            tallyCirculation: MonitoringState.tallyCirculation,
            slippage: MonitoringState.slippage,
            healthStatus: MonitoringState.healthStatus
        });

    } catch (error) {
        console.error('❌ Error fetching reserve data:', error);
    }
}

async function fetchPriceData() {
    try {
        // Fetch prices from CoinGecko or similar API
        const prices = await fetchExternalPrices();

        MonitoringState.prices = prices;

        // Record price snapshot for history
        MonitoringState.priceHistory.push({
            timestamp: Date.now(),
            prices: prices,
            tallyPrice: MonitoringState.tallyPrice
        });

        // Keep only last 288 entries (24h at 5-min intervals)
        if (MonitoringState.priceHistory.length > 288) {
            MonitoringState.priceHistory.shift();
        }

        // Broadcast price update
        broadcastUpdate('price_update', prices);

    } catch (error) {
        console.error('❌ Error fetching price data:', error);
    }
}

async function fetchExternalPrices() {
    try {
        // Example: Fetch from CoinGecko
        const response = await fetch(
            'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tron,solana,cosmos,dogecoin&vs_currencies=usd'
        );
        const data = await response.json();

        return {
            bitcoin: data.bitcoin?.usd || 45000,
            ethereum: data.ethereum?.usd || 1750,
            tron: data.tron?.usd || 0.125,
            solana: data.solana?.usd || 175,
            cosmos: data.cosmos?.usd || 8.5,
            dogecoin: data.dogecoin?.usd || 0.12
        };
    } catch (error) {
        console.error('Error fetching external prices:', error);
        return MonitoringState.prices;
    }
}

function calculateSlippage() {
    // Calculate average slippage (placeholder logic)
    // In production, this would analyze actual mint operations
    return Math.max(0, Math.random() * 0.8 - 0.2);
}

function updateDemoData() {
    // Demo data simulation for development
    MonitoringState.totalReserveUSD = 2500000 + Math.random() * 100000;
    MonitoringState.tallyPrice = 0.00185 + (Math.random() * 0.0001 - 0.00005);
    MonitoringState.tallyCirculation = 1500000000;
}

// ============================================
// MONITORING LOOPS
// ============================================

async function startMonitoring() {
    console.log('🚀 Starting real-time monitoring...');

    // Initialize provider
    await initializeProvider();

    // Fetch initial data
    await fetchReserveData();
    await fetchPriceData();

    // Set update intervals
    setInterval(fetchReserveData, UPDATE_INTERVAL);
    setInterval(fetchPriceData, UPDATE_INTERVAL * 2);

    console.log(`📊 Monitoring started`);
    console.log(`🔄 Update interval: ${UPDATE_INTERVAL}ms`);
    console.log(`📡 WebSocket server running on port ${PORT}`);
}

// ============================================
// HEALTH CHECKS
// ============================================

function monitorHealth() {
    const interval = setInterval(() => {
        if (MonitoringState.totalReserveUSD === 0) {
            console.warn('⚠️ Reserve data is empty');
        }

        const health = {
            timestamp: Date.now(),
            clients: connectedClients.size,
            reserves: MonitoringState.totalReserveUSD,
            status: MonitoringState.healthStatus,
            uptime: process.uptime()
        };

        console.log(`📊 Health check: ${JSON.stringify(health)}`);
    }, 60000); // Every minute

    return interval;
}

// ============================================
// SERVER STARTUP
// ============================================

server.listen(PORT, async () => {
    console.log(`
╔════════════════════════════════════════════════════════╗
║  Convergence Protocol Reserve Dashboard              ║
║  Real-Time Monitoring Service                        ║
╚════════════════════════════════════════════════════════╝
    `);

    console.log(`🌐 HTTP Server running on http://localhost:${PORT}`);
    console.log(`🔌 WebSocket Server running on ws://localhost:${PORT}`);

    // Start monitoring
    await startMonitoring();

    // Start health checks
    monitorHealth();
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

process.on('SIGTERM', () => {
    console.log('⚠️ SIGTERM received, shutting down gracefully...');
    server.close(() => {
        console.log('✅ Server shut down');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('⚠️ SIGINT received, shutting down gracefully...');
    server.close(() => {
        console.log('✅ Server shut down');
        process.exit(0);
    });
});

// Error handling
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled rejection at:', promise, 'reason:', reason);
});

module.exports = server;
