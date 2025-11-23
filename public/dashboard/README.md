# Convergence Protocol Reserve Dashboard

**Real-time, multi-chain reserve tracking with zero-fee TALLY exchange**

## Overview

The Reserve Dashboard provides a unified interface for:

- 🔷 **Real-time reserve tracking** across 6 blockchains (Bitcoin, Ethereum, Tron, Solana, Cosmos, Dogecoin)
- 💱 **Zero-fee TALLY exchange** (buy/sell at 0% fee)
- 🔥 **Burn TALLY for services** (earn TRUST governance tokens)
- 💰 **Multi-chain donation portal** with QR codes and direct links
- 🚨 **Slippage monitoring** with real-time alerts
- 🖥️ **Operator control panel** for hardware wallet integration
- 📊 **Live transaction history** and NFT holdings

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Frontend (HTML/CSS/JavaScript)                     │
│  - Dashboard UI with 8 tabs                         │
│  - Real-time WebSocket updates (10s)               │
│  - Web3 wallet integration (MetaMask)              │
└──────────────────┬──────────────────────────────────┘
                   │ WebSocket
                   ↓
┌─────────────────────────────────────────────────────┐
│  Backend Monitoring Service (Node.js)               │
│  - Fetches smart contract data (30s)               │
│  - Calculates metrics and health                    │
│  - Broadcasts to all connected clients              │
└──────────────────┬──────────────────────────────────┘
                   │ ethers.js
                   ↓
┌─────────────────────────────────────────────────────┐
│  Smart Contracts (Ethereum Mainnet)                 │
│  - ReserveDashboard.sol                            │
│  - TallyExchange.sol                               │
└─────────────────────────────────────────────────────┘
```

## Installation

### Prerequisites

- Node.js 16+ (with npm)
- MetaMask browser extension
- Ethereum mainnet RPC endpoint (Alchemy, Infura, QuickNode)
- Environment variables configured

### 1. Install Dependencies

```bash
cd /home/convergence/convergence-protocol/public/dashboard
npm init -y
npm install express ws ethers dotenv cors
```

### 2. Configure Environment

Create `.env` file:

```env
# Network
ETHEREUM_RPC=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
NETWORK_ID=1

# Smart Contracts
RESERVE_DASHBOARD_ADDRESS=0x...
TALLY_EXCHANGE_ADDRESS=0x...
TALLY_TOKEN_ADDRESS=0x...

# Stablecoins
USDC_ADDRESS=0x...
USDT_ADDRESS=0x...
BUSD_ADDRESS=0x...

# Server
PORT=8080
UPDATE_INTERVAL=30000
NODE_ENV=production
```

### 3. Create package.json scripts

Update `package.json`:

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "node server.js",
    "monitor": "node server.js",
    "test": "echo 'Tests here'"
  }
}
```

## Usage

### 1. Start the monitoring service

```bash
npm start
```

Expected output:
```
╔════════════════════════════════════════════════════════╗
║  Convergence Protocol Reserve Dashboard              ║
║  Real-Time Monitoring Service                        ║
╚════════════════════════════════════════════════════════╝

🌐 HTTP Server running on http://localhost:8080
🔌 WebSocket Server running on ws://localhost:8080
📊 Monitoring started
🔄 Update interval: 30000ms
```

### 2. Open dashboard

- **Public URL**: http://localhost:8080/dashboard
- **API Endpoint**: http://localhost:8080/api/reserves

### 3. Connect wallet

- Click "Connect Hardware Wallet" (Operator tab)
- Select MetaMask when prompted
- Approve connection for Ethereum mainnet

## Tab Guide

### 1. Reserve Overview
- Total reserve value (USD)
- TALLY price and circulation
- Reserve breakdown by chain
- 24h trends and health status

### 2. TALLY Metrics
- TALLY supply and burn statistics
- Price history chart (24h)
- Burn reward types and rates

### 3. Donate
- Multi-chain donation addresses
- QR codes for each chain
- Direct links (bitcoin:, ethereum:, etc.)
- Donation estimator

### 4. Exchange TALLY
- Buy TALLY with stablecoins (0% fee)
- Sell TALLY for stablecoins (0% fee)
- Live price and slippage calculation
- 24h volume and liquidity

### 5. Burn for Services
- Governance voting (1 TALLY = 1 TRUST)
- Premium NFT evaluation (1 TALLY = 5 TRUST)
- Accelerated yield (1 TALLY = 2 TRUST)
- Create proposals (1 TALLY = 10 TRUST)

### 6. Transactions
- Filter by type, chain, date
- Search by address or hash
- View on chain explorers

### 7. Holdings
- NFT portfolio display
- Collection metadata
- Valuation tracking

### 8. Operator Control
- Update reserve balances
- Record mint operations
- Monitor slippage in real-time
- Emergency controls (2-of-3 multi-sig)

## Real-Time Updates

### Frontend Updates (10s)
- UI refreshes every 10 seconds
- WebSocket receives updates from backend
- Charts and metrics update live
- No page refresh needed

### Backend Updates (30s)
- Fetches smart contract data
- Calculates price and health metrics
- Broadcasts to all clients
- Stores historical data

### Price Updates (60s)
- Fetches external prices from CoinGecko
- Updates reserve valuations
- Broadcasts price changes
- Records price history

## Slippage Monitoring

**Current Implementation**:
- Real-time slippage calculation (every 30s)
- Threshold alerts (default: 1.0%)
- Auto-halt minting if threshold exceeded
- Operator override capability

**How it works**:
1. Mint operation recorded: `$1000 USD → TALLY at price $0.00185`
2. Price tracked over next 30 seconds
3. If price moves > 1%, operator alerted
4. Slippage displayed: "Received TALLY at +0.8% variance"

## API Endpoints

### GET /api/reserves
Returns current reserve state:
```json
{
  "reserves": {
    "bitcoin": 50,
    "ethereum": 300,
    "tron": 2000000,
    "solana": 5000,
    "cosmos": 200000,
    "dogecoin": 2000000
  },
  "prices": { ... },
  "totalReserveUSD": 2500000,
  "tallyPrice": 0.00185,
  "tallyCirculation": 1500000000,
  "slippage": 0.34,
  "lastUpdate": "2025-11-22T14:30:45.123Z"
}
```

### GET /api/health
Returns health status:
```json
{
  "status": "healthy",
  "reserves": { ... },
  "slippage": 0.34,
  "lastUpdate": "2025-11-22T14:30:45.123Z"
}
```

### GET /api/transactions?limit=50
Returns recent transactions

### GET /api/price-history?hours=24
Returns price snapshots for selected period

## WebSocket Protocol

### Client receives:

**Initial State**
```json
{
  "type": "initial_state",
  "payload": { ... }
}
```

**Reserve Update** (every 30s)
```json
{
  "type": "reserve_update",
  "payload": {
    "totalReserveUSD": 2500000,
    "tallyPrice": 0.00185,
    "slippage": 0.34
  }
}
```

**Price Update** (every 60s)
```json
{
  "type": "price_update",
  "payload": {
    "bitcoin": 45000,
    "ethereum": 1750
  }
}
```

**Slippage Alert**
```json
{
  "type": "slippage_alert",
  "payload": {
    "slippage": 1.2,
    "threshold": 1.0,
    "action": "halt_minting"
  }
}
```

### Client sends:

**Subscribe**
```json
{
  "type": "subscribe_updates"
}
```

**Alert Acknowledgement**
```json
{
  "type": "alert_acknowledge",
  "alert_type": "slippage"
}
```

## Production Deployment

### Using PM2

```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start server.js --name "convergence-dashboard" --instances 2

# Enable auto-restart
pm2 startup
pm2 save

# Monitor
pm2 monit
```

### Using Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 8080
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t convergence-dashboard .
docker run -p 8080:8080 --env-file .env convergence-dashboard
```

### Using Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name reserves.convergence.protocol;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Monitoring & Troubleshooting

### Common Issues

**"Cannot read property 'getTotalReserveUSD'"**
- Smart contract address not set in .env
- Check `RESERVE_DASHBOARD_ADDRESS`
- Verify contract is deployed on mainnet

**"WebSocket connection failed"**
- Check server is running: `npm start`
- Check port 8080 is open
- Verify firewall settings

**"No reserve data showing"**
- Check Ethereum RPC endpoint is valid
- Verify contract ABI is correct
- Check network connectivity

### Logging

View logs:
```bash
# Real-time logs
npm start

# With PM2
pm2 logs convergence-dashboard

# Docker logs
docker logs convergence-dashboard
```

### Performance Metrics

Monitor at http://localhost:8080/api/health:
- Response time (should be < 100ms)
- Connected clients
- Uptime
- Reserve values

## Security Considerations

1. **Hardware Wallet**: Private keys never leave device
2. **Multi-sig**: 2-of-3 required for operator actions
3. **HTTPS**: Use SSL/TLS in production
4. **Rate Limiting**: Consider adding rate limits
5. **Authentication**: Operator actions require wallet signature
6. **Input Validation**: All user inputs validated server-side

## Next Steps

1. **Deploy Smart Contracts**
   - `ReserveDashboard.sol` to Ethereum mainnet
   - `TallyExchange.sol` to Ethereum mainnet
   - Set contract addresses in .env

2. **Connect to Hardware Wallet**
   - Configure Ledger Nano X
   - Add Bitcoin address: `bc1qg9gvc63lj7ssdenjnem6kycpxde5u7fheypgpm`
   - Test withdrawal flow

3. **Launch Public Dashboard**
   - Deploy to production (Vercel, AWS, DigitalOcean)
   - Configure custom domain
   - Setup SSL certificate

4. **Community Outreach**
   - Announce dashboard launch
   - Share donation addresses and QR codes
   - Begin accepting multi-chain donations

## Support

For issues or questions:
- 📚 [Documentation](https://convergence.protocol/docs)
- 💬 [Discord](https://discord.gg/convergence)
- 🐛 [GitHub Issues](https://github.com/convergence-protocol/issues)

---

**Status**: 🚀 Ready for mainnet deployment
**Last Updated**: November 22, 2025
**Version**: 1.0.0
