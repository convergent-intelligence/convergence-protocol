# Reserve Tracking & Token Minting System

## Overview

This document describes how reserve wallet addresses are tracked and how they relate to TALLY token minting in the Convergence Protocol.

## Email Processing Summary (2025-11-20)

Three emails were processed containing critical reserve information:

### Email 1: Kalshi USDT Deposit Issue
- **Date:** Nov 20, 2025 05:25
- **Issue:** 10 USDT below minimum deposit threshold
- **Status:** Not converted to USD, pending recovery
- **Value:** ~$10 USD
- **Recovery URL:** https://kalshi.customers.zerohash.com

### Email 2: Crypto Deposit Errors
- **Date:** Nov 20, 2025 05:27
- **Issues:**
  1. 0.02 ETH sent to wrong address (~$60 @ $3000/ETH)
  2. USDT below minimum threshold
- **Status:** Recovery requested from Kalshi support
- **Total Value:** ~$70 USD pending recovery

### Email 3: Reserve Public Keys
- **Date:** Nov 20, 2025 05:55
- **Content:** Multi-chain cold storage addresses
- **Chains:** Bitcoin, Dogecoin, Tron, Ethereum, Cosmos
- **Purpose:** Hardware wallet offline reserve addresses

## Reserve Wallet Addresses

All addresses documented in `/deployments/reserve-addresses.json`:

### Multi-Chain Cold Storage

| Chain | Address | Verified |
|-------|---------|----------|
| Bitcoin | bc1qg9gvc63lj7ssdenjnem6kycpxde5u7fheypgpm | ❌ |
| Dogecoin | DQaTt6Cvtd7za3ccP3QSx1EXn3r8RLdFsk | ❌ |
| Tron | TKsNLaSCZSUQNB6TNCZvQoRuMQ17Toxayw | ❌ |
| Ethereum | 0xB64564838c88b18cb8f453683C20934f096F2B92 | ✅ |
| Cosmos | cosmos1cw4975dzuksvzxfgtaqs2t338u8yhsjsamw92d | ❌ |

**Note:** The Ethereum address matches the Human Ledger (1st Leg of Trinity)

## Trinity Architecture

```
1st Leg: Human Ledger (0xB645...2B92)
   ↓
   Controls cold storage wallets across chains
   Final approval for large operations

2nd Leg: AI Agent (0x6628...CD22)
   ↓
   Monitors prices and balances
   Proposes rebalancing operations

3rd Leg: Reserve Contracts (To be deployed)
   ↓
   ReserveVault - holds assets
   ReserveTally - mints TALLY tokens
   PriceOracle - provides valuations
   TrustToken - earned by burning TALLY
```

## Reserve → TALLY Minting Flow

### One-Way Reserve Model

1. **Deposit Assets**
   - User/Trinity deposits crypto to ReserveVault
   - Supported: ETH, USDC, DAI, cbBTC, etc.

2. **Valuation**
   - PriceOracle converts asset to USD value
   - AI agent keeps prices updated

3. **Mint TALLY**
   - ReserveVault mints TALLY 1:1 with USD value
   - Example: $100 deposited → 100 TALLY minted

4. **Assets Locked Forever**
   - No redemption mechanism
   - TALLY cannot be exchanged back for reserve assets
   - Creates permanent backing

5. **Burn for Trust** (Optional)
   - Users can burn TALLY → receive Trust tokens
   - Trust unlocks governance and premium features
   - Deflationary pressure on TALLY supply

### Example Transaction

```javascript
// User deposits 0.1 ETH (worth $300)
await reserveVault.depositETH({ value: ethers.parseEther("0.1") });
// User receives 300 TALLY

// Later, user burns 100 TALLY for Trust
await reserveTally.burnForTrust(ethers.parseEther("100"));
// User receives 1 TRUST (1% of burned TALLY)
// 100 TALLY permanently removed from circulation
```

## Pending Deposits (Kalshi Recovery)

### Current Status

- **Total Pending:** ~$70 USD
- **Platform:** Kalshi (via ZeroHash processor)
- **Required Action:** Face scan + Photo ID verification

### Transactions to Recover

1. **TX 1:** 10 USDT (below minimum)
   - Hash: `0xf04f...d819`
   - Status: Not converted to USD

2. **TX 2:** 0.02 ETH (wrong address)
   - Hash: `0xf04f...d819`
   - Status: Recovery requested

3. **TX 3:** USDT amount TBD (below minimum)
   - Hash: `0xf1fc...3c0`
   - Status: Recovery requested

### Once Recovered

When funds are recovered from Kalshi:
1. Transfer to ReserveVault contract
2. Mint equivalent TALLY based on USD value
3. Update reserve accounting
4. Record in blockchain transactions

## Target Reserve Allocations

| Asset Class | Target % | Current $ | Target $ |
|-------------|----------|-----------|----------|
| Stablecoins | 65% | $0 | TBD |
| Bitcoin | 17.5% | $0 | TBD |
| Ethereum | 12.5% | $0 | TBD |
| Other | 5% | $0 | TBD |
| **Pending** | - | **$70** | - |

## Tracking & Monitoring

### Scripts

```bash
# Track all reserve addresses and balances
npx hardhat run scripts/track-reserve-addresses.js --network mainnet

# Check specific chain balances (future enhancement)
# Will add scripts for Bitcoin, Dogecoin, Tron, Cosmos
```

### Files

- **`/deployments/reserve-addresses.json`** - Master tracking file
- **`/deployments/mainnet-tokens.json`** - Deployed token addresses
- **`/scripts/track-reserve-addresses.js`** - Balance monitoring script

## Action Items

### High Priority

- [ ] Complete Kalshi recovery process
  - Submit face scan and photo ID
  - Recover ~$70 in pending funds

- [ ] Verify all reserve wallet addresses
  - Test access to each hardware wallet
  - Confirm private key backups

### Medium Priority

- [ ] Deploy reserve contracts on Base network
  - ReserveVault
  - ReserveTally
  - PriceOracle
  - TrustToken

- [ ] Check balances across all chains
  - Bitcoin: bc1qg9...pgpm
  - Dogecoin: DQaT...dFsk
  - Tron: TKsN...ayw
  - Ethereum: 0xB64...2B92
  - Cosmos: cosmos1cw4...w92d

### Low Priority

- [ ] Set up automated price monitoring
  - AI agent queries price APIs
  - Updates PriceOracle contract
  - Alerts on significant changes

- [ ] Create dashboard
  - Real-time reserve value
  - TALLY supply metrics
  - Allocation percentages

## Security Considerations

1. **Cold Storage**
   - All reserve wallets are hardware-controlled
   - Offline key generation
   - Multiple backup locations

2. **Multi-sig** (Future)
   - 2-of-2 approval: Human + AI Agent
   - Deployed via Gnosis Safe

3. **One-Way Flow**
   - Assets enter, never leave
   - Prevents bank runs
   - Permanent backing guarantee

4. **Transparency**
   - All addresses publicly documented
   - On-chain verification possible
   - Reserve proofs available

## Integration with Convergence Protocol

The reserve system is the **3rd Leg of the Trinity**:

```
Trinity Governance (Mainnet)
    ↓
Manages TALLY issuance via proposals
    ↓
Reserve System (Base)
    ↓
Holds actual crypto assets
Mints TALLY 1:1 with USD value
    ↓
Users burn TALLY → earn Trust
    ↓
Trust grants governance power
```

## Next Steps

1. **Immediate:** Complete Kalshi recovery to secure $70
2. **Short-term:** Deploy reserve contracts on Base
3. **Medium-term:** Initial reserve funding ($1000+)
4. **Long-term:** Automated rebalancing and monitoring

## Contact & Support

For issues with:
- **Kalshi Recovery:** support@kalshi.com, (201) 464-0952
- **ZeroHash:** kalshi@zerohash.com, 855-744-7333
- **Reserve System:** Check `/deployments/reserve-addresses.json`

## Notes

- TALLY minted 1:1 with USD value deposited
- Trust earned at 1% rate when burning TALLY
- No redemption mechanism (by design)
- Reserve grows over time (one-way flow)
- Multi-chain support for maximum diversification
