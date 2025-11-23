# Convergence Protocol v3: Hardware Wallet Integration Guide

**Nano X Hardware Wallet:** `bc1qg9gvc63lj7ssdenjnem6kycpxde5u7fheypgpm`
**Status:** Integration Ready
**Date:** 2025-11-22

---

## 🔐 Overview

The Convergence Protocol v3 uses a Ledger Nano X hardware wallet as the primary custody mechanism for Bitcoin reserves. This guide outlines the integration architecture, security practices, and operational procedures.

---

## 📋 Hardware Wallet Configuration

### Nano X Setup

**Device:** Ledger Nano X
**Network:** Bitcoin (testnet for staging, mainnet for production)
**Address Type:** SegWit (bc1q) - Bech32 format
**Reserve Address:** `bc1qg9gvc63lj7ssdenjnem6kycpxde5u7fheypgpm`

**Features Enabled:**
- Hardware signing (private keys never leave device)
- Multi-sig support (2-of-3 or 3-of-5 configuration)
- Firmware security validation
- HD wallet with derivation path: `m/84'/0'/0'/0/0` (for mainnet)

---

## 🔗 Integration Architecture

### Layer 1: Hardware Device
```
Nano X (bc1q...)
├─ Bitcoin App (firmware)
├─ Ethereum App (for signing contract operations)
└─ Security Module (pin, recovery seed)
```

### Layer 2: Signing Service
```
Hardware Wallet Signing Service
├─ USB Communication (Ledger Live API)
├─ Transaction Preparation
├─ Signature Collection
└─ Broadcast Management
```

### Layer 3: Smart Contracts
```
BitcoinReserveVault.sol
├─ Operation Queuing
├─ Multi-sig Verification
├─ Settlement Recording
└─ Fee Calculation
```

### Layer 4: Monitoring
```
Bitcoin Network Monitor
├─ Address Monitoring
├─ Transaction Tracking
├─ Confirmation Counting
└─ Health Reporting
```

---

## 🔄 Operational Flows

### Bitcoin Deposit Flow (User → Reserve)

```
User Deposits Bitcoin
        ↓
Bitcoin Network (confirms at bc1q...)
        ↓
Monitor detects incoming transaction
        ↓
Off-Chain Oracle reads transaction
        ↓
Smart Contract records deposit
        ↓
TALLY minted to user on Ethereum
        ↓
User owns both BTC (in custody) and TALLY (on-chain)
```

**Confirmation Requirements:**
- Minimum 3 block confirmations for staging
- Minimum 6 block confirmations for production
- Average confirmation time: ~30 minutes

### Bitcoin Withdrawal Flow (Reserve → User)

```
User requests BTC withdrawal via smart contract
        ↓
Withdrawal proposal created
        ↓
Multi-sig signers review:
   - Amount
   - Recipient address
   - Current reserve status
        ↓
Nano X prompts for approval on device
        ↓
Physical button press confirms transaction
        ↓
Private key signs transaction (device-side, never exposed)
        ↓
Signed transaction broadcast to Bitcoin network
        ↓
User receives BTC at requested address
```

**Authorization Requirements:**
- Withdrawal > $1,000 USD: Requires 2-of-3 multi-sig
- Withdrawal > $10,000 USD: Requires 3-of-3 multi-sig
- Emergency withdrawal: Requires governance approval

### Bridge Swap Flow (WBTC ↔ Native BTC)

```
User wants WBTC on Ethereum but needs native Bitcoin

Option A: WBTC → Native BTC
  1. User approves WBTC to CrossChainBridge
  2. Bridge escrows WBTC
  3. Convergence treasury initiates Bitcoin withdrawal from Nano X
  4. Bitcoin sent to user's address
  5. User receives native Bitcoin
  6. WBTC released from escrow

Option B: Native BTC → WBTC
  1. User sends Bitcoin to bridge deposit address
  2. Bitcoin confirmed on network
  3. Bridge mints equivalent WBTC on Ethereum
  4. User receives WBTC in wallet
```

---

## 🛠️ Hardware Wallet Signing Service

### Setup Requirements

**Technology Stack:**
- Ledger Live API (Node.js)
- Bitcoin Core (full node for verification)
- USB communication library
- Transaction builder (bitcoinjs-lib)

**Dependencies:**
```bash
npm install ledger-live @ledgerhq/hw-transport-node-hid
npm install bitcoinjs-lib bip32 bip39
npm install eth-sig-util ethereum-tx-decoder
```

### Service Architecture

```javascript
class HardwareWalletService {
  // Initialize connection to Nano X
  async connect() {
    // Establish USB connection via Ledger Live API
    // Verify device is Nano X
    // Get device state
  }

  // Sign Bitcoin transaction
  async signBitcoinTransaction(txDetails) {
    // Prepare transaction
    // Send to Nano X
    // Wait for user approval on device
    // Return signed transaction
    // Broadcast to Bitcoin network
  }

  // Sign Ethereum contract operation
  async signEthereumOperation(contractData) {
    // Prepare contract interaction
    // Send to Nano X Ethereum app
    // Wait for approval
    // Return signature
  }

  // Get device status
  async getDeviceStatus() {
    // Check connection
    // Get firmware version
    // Get address balance
    // Return health metrics
  }

  // Verify transaction before signing
  async verifyTransaction(txDetails) {
    // Validate recipient address
    // Check amount against limits
    // Verify against reserve state
    // Return verification result
  }
}
```

### Signature Operations

**Bitcoin Transaction Signing:**
```
Transaction Details:
  - Input: UTXO from bc1q... address
  - Output: User's requested address
  - Amount: Withdrawal amount (sats)
  - Fee: Network-optimized fee rate

Nano X Displays:
  - "Sign Bitcoin Transaction?"
  - Recipient address
  - Amount in BTC
  - Fee amount

User Actions:
  - Review on device screen
  - Press right button to confirm
  - Press left button to reject

Result:
  - Signed transaction (psbt format)
  - Ready for broadcast
```

**Ethereum Operation Signing:**
```
Contract Operation Details:
  - Contract: BitcoinReserveVault
  - Function: settleBitcoinDeposit()
  - Parameters: tx hash, confirmations, amount

Nano X Displays:
  - Contract address
  - Function name
  - Parameter values (where readable)

User Actions:
  - Review on device screen
  - Confirm or reject

Result:
  - Transaction signature
  - Ready for submission
```

---

## 🔐 Security Measures

### Private Key Security
- Private keys **never leave hardware device**
- No key export functionality enabled
- Firmware validates all signing requests
- Hardware PIN required for operations

### Multi-Signature Protection
- **2-of-3 configuration:**
  - Signer 1: Genesis Human (operations oversight)
  - Signer 2: Chief Operations Officer (execution)
  - Signer 3: Governance Treasury (approval)

- **Threshold Requirements:**
  - Withdrawals < $1,000: 1 signature (any signer)
  - Withdrawals $1,000-$10,000: 2 signatures (any 2)
  - Withdrawals > $10,000: 3 signatures (all required)
  - Bridge operations > $5,000: 2 signatures minimum

### Address Validation
- **Only SegWit accepted** (bc1q prefix)
- No legacy P2PKH addresses (1xxx)
- No P2SH addresses (3xxx)
- Recipient address validated against whitelist

### Transaction Verification
- **Full node verification:**
  - All transactions verified against Bitcoin network
  - Minimum 3-6 confirmations required
  - Double-spend prevention enabled
  - Network fee optimization

### Device Security
- Firmware auto-update enabled
- Recovery seed stored in secure location
- Hardware wallet firmware verified on every session
- Tamper detection enabled

---

## 📊 Monitoring & Alerts

### Real-time Monitoring

**Address Monitoring:**
```
Monitor Target: bc1qg9gvc63lj7ssdenjnem6kycpxde5u7fheypgpm

Events Tracked:
  - Incoming transactions
  - Confirmation count
  - Outgoing transactions
  - Balance changes
  - Fee rate changes
```

**Health Metrics:**
```
{
  "address": "bc1q...",
  "balance": {
    "satoshis": 2500000000,
    "btc": 25.0,
    "usd": 1275000
  },
  "transactions": {
    "pending": 0,
    "lastIncoming": "2025-11-22T10:30:00Z",
    "lastOutgoing": "2025-11-22T09:15:00Z"
  },
  "fees": {
    "avgRate": 8.5,
    "nextBlock": 9.2,
    "slowRate": 7.8
  },
  "device": {
    "connected": true,
    "firmwareVersion": "2.2.1",
    "appVersion": "2.1.0"
  }
}
```

### Alert Thresholds

| Alert Type | Threshold | Action |
|-----------|-----------|--------|
| Large Deposit | > 5 BTC | Notify Treasury |
| Large Withdrawal | > 10 BTC | Require 3-of-3 approval |
| Unconfirmed TX | > 2 hours | Escalate to ops |
| Device Disconnected | Any | Page on-call engineer |
| Fee Spike | > 20 sat/byte | Review & confirm |
| Low Balance | < 1 BTC | Rebalance alert |

---

## 🚀 Deployment Checklist

### Pre-Staging
- [ ] Nano X hardware wallet ordered and received
- [ ] Device initialized with secure recovery seed
- [ ] Bitcoin testnet app installed
- [ ] Address `bc1q...` generated and verified
- [ ] USB connection tested
- [ ] Ledger Live API tested

### Staging (Bitcoin Testnet)
- [ ] Deploy BitcoinReserveVault.sol to testnet
- [ ] Deploy CrossChainBridge.sol to testnet
- [ ] Deploy BitcoinPriceOracle.sol to testnet
- [ ] Connect hardware wallet signing service
- [ ] Test deposit flow (small amount)
- [ ] Test withdrawal flow
- [ ] Test bridge operations
- [ ] Monitor 24/7 for 1 week
- [ ] Performance testing
- [ ] Security review

### Pre-Mainnet
- [ ] New Nano X device for mainnet
- [ ] Firmware fully updated
- [ ] Address generation on mainnet
- [ ] Contracts deployed to Ethereum mainnet
- [ ] Oracle feeds configured for mainnet
- [ ] Signing service configured for mainnet
- [ ] Cold storage setup verified
- [ ] Backup recovery seed stored securely
- [ ] Legal documentation reviewed
- [ ] Insurance policy in place

### Mainnet Launch
- [ ] Contracts live on Ethereum mainnet
- [ ] Bitcoin address live on mainnet
- [ ] Small initial deposit (0.1 BTC)
- [ ] Monitor for 24 hours
- [ ] Enable community deposits
- [ ] Gradual scaling to target reserve size
- [ ] 24/7 monitoring active

---

## 🔧 Operational Procedures

### Daily Operations

**Morning Check-in:**
```
1. Verify device connection
2. Check wallet balance
3. Review pending transactions
4. Check device firmware version
5. Review any alerts from overnight
6. Confirm with team on Slack
```

**Transaction Processing:**
```
1. Receive deposit/withdrawal request
2. Verify in smart contract
3. Approve in governance (if required)
4. Prepare transaction
5. Sign on Nano X (physical approval required)
6. Broadcast to network
7. Monitor confirmations
8. Record in contract
```

**Emergency Procedures:**
```
1. Detect anomaly (unusual transaction, device issue, etc)
2. IMMEDIATELY disconnect device from network
3. Page on-call emergency team
4. Assess situation
5. Decide on pause vs. continue
6. Communicate status to users
7. Document incident
8. Post-mortem analysis
```

### Weekly Maintenance

- [ ] Firmware check and update if available
- [ ] Test recovery procedures (in staging)
- [ ] Review all transactions and alerts
- [ ] Update price feeds
- [ ] Check device battery (if applicable)
- [ ] Verify backup security
- [ ] Team training/knowledge sharing

### Monthly Audits

- [ ] Full reserve audit
- [ ] Transaction log review
- [ ] Security assessment
- [ ] Governance proposal review
- [ ] Rebalancing check
- [ ] Financial reconciliation

---

## 🎓 Team Training

All team members must be trained on:

1. **Device Operations**
   - Device setup and PIN
   - Approving transactions
   - Firmware updates
   - Recovery procedures

2. **Security Practices**
   - Never share recovery seed
   - PIN confidentiality
   - Physical security
   - Network security

3. **Operational Procedures**
   - Deposit/withdrawal flows
   - Emergency response
   - Monitoring dashboards
   - Alert escalation

4. **Smart Contract Understanding**
   - Contract functions
   - Multi-sig requirements
   - Governance mechanics
   - Fee structures

---

## 📞 Emergency Contacts

**Primary Operations:**
- Lead: [Name] - [Contact]
- Backup: [Name] - [Contact]

**Security/Hardware Wallet:**
- Lead: [Name] - [Contact]
- Backup: [Name] - [Contact]

**Governance/Treasury:**
- Lead: [Name] - [Contact]
- Escalation: Genesis Human

**External Support:**
- Ledger Support: https://support.ledger.com
- Bitcoin Network: Community forums
- Smart Contract: Internal team

---

## 🔗 Related Documentation

- `CONVERGENCE_V3_BITCOIN_ARCHITECTURE.md` - Overall v3 design
- `contracts/BitcoinReserveVault.sol` - Smart contract documentation
- `contracts/CrossChainBridge.sol` - Bridge mechanism
- `DEPLOYMENT_GUIDE_V3.md` - Full deployment instructions

---

**Status:** Ready for implementation
**Next Step:** Procure Nano X hardware and begin staging setup
**Date:** 2025-11-22
