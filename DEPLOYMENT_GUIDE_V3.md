# Convergence Protocol v3: Complete Deployment Guide

**Status:** Ready for Sepolia Testnet Deployment
**Date:** 2025-11-22
**Target Networks:** Sepolia (staging) → Mainnet (production)

---

## 🚀 Quick Start

### Prerequisites
```bash
# Node.js and npm
node --version  # Should be v18+
npm --version

# Hardhat
npm install --save-dev hardhat
npm install @nomicfoundation/hardhat-toolbox

# Dependencies
npm install
npm install web3 ethers
```

### Environment Setup
```bash
# Create .env file
cp .env.example .env

# Update with your values
SEPOLIA_RPC_URL="https://sepolia.infura.io/v3/YOUR_KEY"
MAINNET_RPC_URL="https://mainnet.infura.io/v3/YOUR_KEY"
PRIVATE_KEY="your_private_key_here"
BITCOIN_PRICE_FEED_URL="https://api.coingecko.com/api/v3/simple/price"
```

---

## 📋 Deployment Sequence

### Phase 1: Deploy Core Contracts (Sepolia)

#### Step 1.1: Deploy BitcoinPriceOracle
```bash
npx hardhat run scripts/deploy-v3/1-deploy-oracle.js --network sepolia
```

**Output:**
```
BitcoinPriceOracle deployed to: 0x...
- BTC price: $51,000
- ETH price: $1,750
- Status: Ready
```

#### Step 1.2: Deploy BitcoinReserveVault
```bash
npx hardhat run scripts/deploy-v3/2-deploy-bitcoin-vault.js --network sepolia
```

**Requires:**
- TALLY token address (from v2)
- BitcoinPriceOracle address
- Multi-sig signer addresses [Genesis, COO, Treasury]

**Output:**
```
BitcoinReserveVault deployed to: 0x...
- Hardware wallet: bc1qg9gvc63lj7ssdenjnem6kycpxde5u7fheypgpm
- Multi-sig: 2-of-3 configured
- Status: Ready
```

#### Step 1.3: Deploy CrossChainBridge
```bash
npx hardhat run scripts/deploy-v3/3-deploy-bridge.js --network sepolia
```

**Requires:**
- WBTC token address (or mock for testnet)
- TALLY token address
- Fee receiver address
- BitcoinPriceOracle address

**Output:**
```
CrossChainBridge deployed to: 0x...
- WBTC token: 0x...
- Fee: 0.2%
- Bridge timeout: 24 hours
- Min swap: 0.01 WBTC
- Status: Ready
```

#### Step 1.4: Deploy Treasury Governance v3
```bash
npx hardhat run scripts/deploy-v3/4-deploy-governance.js --network sepolia
```

**Output:**
```
TreasuryGovernanceV3 deployed to: 0x...
- Bitcoin allocation target: 45%
- Voting period: 3 days
- Quorum: 50%
- Status: Ready
```

### Phase 2: Configure Contracts

#### Step 2.1: Link Contracts
```bash
npx hardhat run scripts/deploy-v3/5-link-contracts.js --network sepolia
```

**Operations:**
- BitcoinReserveVault knows about CrossChainBridge
- CrossChainBridge knows about BitcoinReserveVault
- Oracle set for all contracts
- Multi-sig addresses configured

#### Step 2.2: Initialize Reserve Parameters
```bash
npx hardhat run scripts/deploy-v3/6-init-parameters.js --network sepolia
```

**Parameters Set:**
```javascript
{
  minBitcoinConfirmations: 3,
  targetBitcoinPercent: 4500,  // 45%
  bridgeFeePercent: 20,         // 0.2%
  maxSlippage: 100,             // 1%
  swapTimeout: 86400,           // 24 hours
  minSwapAmount: 1000000        // 0.01 WBTC
}
```

#### Step 2.3: Grant Roles
```bash
npx hardhat run scripts/deploy-v3/7-grant-roles.js --network sepolia
```

**Roles Granted:**
- BitcoinReserveVault: MINTER role for TALLY
- CrossChainBridge: TRANSFER role for WBTC custody
- TreasuryGovernanceV3: ADMIN role for updates
- Price operators: can update oracle feeds

---

## 🧪 Testing Phase (Sepolia Testnet)

### Unit Tests
```bash
# Run all tests
npx hardhat test

# Run specific test file
npx hardhat test test/BitcoinReserveVault.test.js

# Run with coverage
npx hardhat coverage
```

### Integration Tests
```bash
# Test full Bitcoin deposit flow
npx hardhat run test/integration/bitcoin-deposit.test.js --network sepolia

# Test bridge swap flow
npx hardhat run test/integration/bridge-swap.test.js --network sepolia

# Test multi-sig operations
npx hardhat run test/integration/multisig.test.js --network sepolia
```

### Staging Environment Setup
```bash
# Deploy mock Bitcoin monitor
npx hardhat run scripts/deploy-v3/staging-monitor.js --network sepolia

# Create test wallets
npx hardhat run scripts/utils/create-test-wallets.js

# Fund test wallets
npx hardhat run scripts/utils/fund-test-wallets.js --network sepolia
```

### Manual Testing Checklist

**Bitcoin Deposit Flow:**
- [ ] User initiates deposit via contract
- [ ] Monitor detects Bitcoin transaction
- [ ] Confirmations tracked
- [ ] TALLY minted successfully
- [ ] User receives TALLY in wallet

**Bridge Swap Flow:**
- [ ] User initiates WBTC ↔ BTC swap
- [ ] WBTC locked in escrow
- [ ] Bitcoin transaction triggered from mock vault
- [ ] Swap settled with Bitcoin confirmation
- [ ] User receives native Bitcoin

**Multi-sig Operations:**
- [ ] Withdrawal proposal created
- [ ] All signers receive notification
- [ ] First signer approves
- [ ] Second signer approves
- [ ] Operation executed successfully

**Price Oracle:**
- [ ] Prices updated every minute
- [ ] TWAP calculated correctly
- [ ] Staleness checks working
- [ ] Price sanity checks prevent manipulation

---

## 🔗 Bitcoin Testnet Integration

### Setup Bitcoin Testnet Monitor
```bash
# Install Bitcoin node (or use public RPC)
npm install bitcoin-core

# Create monitor service
npx hardhat run scripts/bitcoin-monitor/setup.js --network sepolia
```

### Configure Address Monitoring
```bash
# Add address to monitor
npx hardhat run scripts/bitcoin-monitor/add-address.js \
  --address bc1qg9gvc63lj7ssdenjnem6kycpxde5u7fheypgpm \
  --network sepolia
```

### Test Bitcoin Transactions
```bash
# Send test Bitcoin to monitored address
# (Use Bitcoin testnet faucet)

# Monitor will automatically:
# 1. Detect incoming transaction
# 2. Track confirmations
# 3. Notify smart contract
# 4. Record deposit in contract
```

---

## 🔐 Security Review Checklist

### Smart Contract Security
- [ ] All contracts pass Slither analysis
- [ ] No reentrancy vulnerabilities
- [ ] No integer overflow/underflow
- [ ] Access control properly implemented
- [ ] Event logging complete
- [ ] Error messages descriptive

### Hardware Wallet Security
- [ ] Nano X USB communication tested
- [ ] Transaction signing works
- [ ] Recovery procedures verified
- [ ] No key export functionality enabled
- [ ] PIN protection verified

### Oracle Security
- [ ] Price feeds from multiple sources
- [ ] Staleness detection working
- [ ] Circuit breakers implemented
- [ ] Historical price tracking working
- [ ] TWAP calculations verified

### Bridge Security
- [ ] Atomic swap logic verified
- [ ] Slippage protection working
- [ ] Timeout mechanisms functional
- [ ] Custody balance tracked correctly
- [ ] Fee collection verified

---

## 📊 Verification & Monitoring

### Contract Verification (Etherscan)
```bash
# Verify BitcoinPriceOracle
npx hardhat verify --network sepolia <ORACLE_ADDRESS> \
  <INITIAL_BTC_PRICE> <INITIAL_ETH_PRICE>

# Verify BitcoinReserveVault
npx hardhat verify --network sepolia <VAULT_ADDRESS> \
  <TALLY_ADDRESS> <ORACLE_ADDRESS> \
  <SIGNER1> <SIGNER2> <SIGNER3>

# Verify CrossChainBridge
npx hardhat verify --network sepolia <BRIDGE_ADDRESS> \
  <WBTC_ADDRESS> <TALLY_ADDRESS> \
  <FEE_RECEIVER> <ORACLE_ADDRESS>
```

### Health Checks
```bash
# Get Oracle status
npx hardhat run scripts/monitor/oracle-health.js --network sepolia

# Get Vault status
npx hardhat run scripts/monitor/vault-health.js --network sepolia

# Get Bridge status
npx hardhat run scripts/monitor/bridge-health.js --network sepolia

# Get Overall system status
npx hardhat run scripts/monitor/system-health.js --network sepolia
```

### Monitoring Dashboard
```bash
# Start real-time monitoring
npm run monitor:v3:sepolia

# View metrics at http://localhost:3000
# Metrics include:
# - Reserve balance and composition
# - Bitcoin address balance
# - Bridge active swaps
# - Oracle price feeds
# - Transaction history
# - Health indicators
```

---

## 🚀 Mainnet Deployment (When Ready)

### Pre-Mainnet Checklist
- [ ] All tests passing on Sepolia (100% success rate)
- [ ] Security audit completed and approved
- [ ] Mainnet wallet funded with ETH for gas
- [ ] Bitcoin mainnet address generated on Nano X
- [ ] Insurance policy in place
- [ ] Legal review completed
- [ ] Team training completed
- [ ] 24/7 monitoring setup verified
- [ ] Emergency response procedures tested
- [ ] Backup systems verified

### Mainnet Deployment Steps
```bash
# 1. Deploy to mainnet
npm run deploy:v3:mainnet

# 2. Verify contracts on Etherscan
npm run verify:v3:mainnet

# 3. Initialize with mainnet parameters
npm run init:v3:mainnet

# 4. Start monitoring
npm run monitor:v3:mainnet

# 5. Verify Bitcoin address on mainnet
# (Ensure address is live on Nano X)

# 6. Enable deposits (start small)
npm run enable:deposits:v3

# 7. Announce launch
npm run announce:launch:v3
```

### Mainnet Initial Phase
```
Week 1: Small deposits only
  - Max: 1 BTC per transaction
  - Max: 5 BTC total
  - Monitor 24/7
  - No community deposits yet

Week 2: Gradual scaling
  - Max: 5 BTC per transaction
  - Max: 20 BTC total
  - Open to early adopters
  - Weekly audits

Week 3-4: Full operations
  - Unlimited deposits
  - Bridge fully operational
  - Community participation
  - Governance active

Month 2+: Optimization phase
  - Monitor performance
  - Implement improvements
  - Scale infrastructure
  - Add new features
```

---

## 📈 Performance Targets

### Smart Contracts
```
Deployment Gas Costs:
  BitcoinPriceOracle:    ~1.2M gas
  BitcoinReserveVault:   ~1.8M gas
  CrossChainBridge:      ~2.0M gas
  TreasuryGovernanceV3:  ~1.5M gas
  Total:                 ~6.5M gas

Runtime Gas Costs:
  Bitcoin deposit record: ~50k gas
  Bridge swap initiate:   ~80k gas
  Swap complete:         ~40k gas
  Governance vote:       ~100k gas
```

### Performance Metrics
```
API Response Times:
  Get vault status:      < 100ms
  Get bridge status:     < 100ms
  Get oracle prices:     < 50ms
  Get user balance:      < 100ms

Bitcoin Network:
  Average confirmation:  ~30 minutes
  Min confirmations:     3-6
  Fee optimization:      automatic

Bridge Performance:
  Swap initiation:       < 2 minutes
  Settlement:            < 1 hour (after BTC confirms)
  Complete:             < 5 minutes (user action)
```

---

## 🔧 Maintenance & Operations

### Daily Tasks
- [ ] Monitor oracle prices
- [ ] Check Bitcoin address balance
- [ ] Review pending transactions
- [ ] Check system health
- [ ] Review alerts and logs

### Weekly Tasks
- [ ] Review all transactions
- [ ] Test recovery procedures
- [ ] Update monitoring dashboards
- [ ] Governance check-in
- [ ] Team sync

### Monthly Tasks
- [ ] Full reserve audit
- [ ] Security assessment
- [ ] Rebalancing review
- [ ] Performance optimization
- [ ] Documentation updates

---

## 📞 Support & Escalation

### Deployment Issues
**Problem:** Oracle price not updating
**Solution:** Check price feed connectivity, restart feed service

**Problem:** Bitcoin transaction not detected
**Solution:** Verify monitor is running, check Bitcoin node sync

**Problem:** Bridge swap stuck
**Solution:** Check escrow balance, verify Bitcoin network, extend timeout

**Problem:** Hardware wallet not signing
**Solution:** Check USB connection, verify Nano X app, restart signing service

---

## ✅ Post-Deployment Verification

### Health Checks Script
```bash
npx hardhat run scripts/post-deploy/health-check.js --network sepolia
```

**Verifies:**
- All contracts deployed correctly
- All roles and permissions set
- Oracle feeds active
- Bitcoin monitor connected
- Bridge functionality operational
- Multi-sig configuration correct
- Emergency procedures functional

### Smoke Tests Script
```bash
npx hardhat run scripts/post-deploy/smoke-tests.js --network sepolia
```

**Tests:**
- Oracle price updates
- Vault deposit recording
- Bridge swap initiation
- Governance proposal creation
- Multi-sig signing
- Event emission

---

## 📝 Deployment Log Template

```
Deployment Date: 2025-11-22
Network: Sepolia
Deployer: [Your Address]

Contract Deployments:
  BitcoinPriceOracle:    0x...
  BitcoinReserveVault:   0x...
  CrossChainBridge:      0x...
  TreasuryGovernanceV3:  0x...

Configuration:
  Min BTC Confirmations:  3
  Target BTC Allocation:  45%
  Bridge Fee:            0.2%
  Max Slippage:          1%

Testing Results:
  Unit Tests:           PASSED (48/48)
  Integration Tests:    PASSED (12/12)
  Manual Tests:         PASSED
  Security Review:      PASSED

Status: READY FOR MAINNET

Post-Deployment Checklist:
  [ ] All health checks passing
  [ ] All smoke tests passing
  [ ] Monitoring active
  [ ] Team notified
  [ ] Documentation updated
```

---

**Status:** Complete and ready to execute
**Next Step:** Begin Sepolia testnet deployment
**Expected Duration:** 2-3 hours for complete setup
**Post-Deployment Monitoring:** 24/7 for first week, then 8/5 during business hours

---

**Questions?** See `/home/convergence/convergence-protocol/docs/` for detailed documentation.
