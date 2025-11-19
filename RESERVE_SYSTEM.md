# 3rd Leg: Reserve Manager System

## Overview

The Reserve Manager is the algorithmic 3rd leg of the Convergence Protocol Trinity. It holds assets, mints TALLY tokens against deposits, and maintains a 1:1 backing ratio.

## Trinity Architecture

```
1st Leg (Human)          2nd Leg (AI)           3rd Leg (Contracts)
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Ledger Wallet   │     │ AI Agent        │     │ ReserveVault    │
│ 0xB645...       │     │ 0x6628...       │     │ Smart Contracts │
│                 │     │                 │     │                 │
│ - Final approval│     │ - Price updates │     │ - Hold assets   │
│ - Emergency stop│     │ - Monitoring    │     │ - Mint TALLY    │
│ - Config changes│     │ - Proposals     │     │ - Enforce rules │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Contracts

### ReserveVault.sol
Main reserve manager that:
- Accepts ETH and approved ERC20 tokens
- Mints TALLY proportional to USD value deposited
- Burns spam NFTs for Trust tokens
- Holds valuable NFTs for later sale
- Enforces target allocations

### ReserveTally.sol
Reserve-backed TALLY token:
- Minted only by ReserveVault
- Users can burn for Trust tokens
- No redemption for underlying assets

### PriceOracle.sol
Asset valuation:
- AI agent updates prices from external sources
- Staleness checks prevent stale prices
- Supports batch updates

### TrustToken.sol
Utility token earned by burning TALLY:
- Unlocks community features
- Governance weight
- Access control

## Token Flow

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   User      │      │ ReserveVault│      │ ReserveTally│
│   Assets    │ ───► │   (holds)   │ ───► │   (mints)   │
└─────────────┘      └─────────────┘      └──────┬──────┘
                                                  │
                     ┌─────────────┐               │
                     │ TrustToken  │ ◄─────────────┘
                     │   (burns)   │    burn TALLY = earn Trust
                     └─────────────┘
```

## One-Way Reserve Model

**Critical Design Decision**: Assets flow IN, never OUT.

- Users deposit assets → receive TALLY
- Users burn TALLY → receive Trust
- No redemption of TALLY for reserve assets

This creates:
- Permanent backing (no bank runs)
- Deflationary TALLY supply over time
- Trust as the "exit" mechanism

## Target Allocations

| Asset Class | Target % | Examples |
|-------------|----------|----------|
| Stablecoins | 65% | USDC, DAI, PAXG |
| Bitcoin | 17.5% | cbBTC |
| ETH | 12.5% | WETH, native |
| Other | 5% | Vetted tokens |

## Deployment

### Prerequisites
1. ETH on Base for gas
2. Private key in `.env`
3. (Optional) Basescan API key for verification

### Deploy
```bash
npx hardhat run scripts/deploy-reserve-system.js --network base
```

### Verification
```bash
npx hardhat verify --network base <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

## AI Agent Operations

The AI agent (2nd Leg) can:

### Autonomous (under threshold)
- Update prices
- Monitor deposits
- Propose rebalancing

### Requires Human Approval
- Large swaps (>$1000)
- Configuration changes
- Emergency actions

### Price Update Example
```javascript
// AI agent updates ETH price
await priceOracle.updateETHPrice(ethers.parseEther("3000"));

// Batch update
await priceOracle.batchUpdatePrices(
    [USDC, cbBTC, WETH],
    [parseEther("1"), parseEther("90000"), parseEther("3000")]
);
```

## User Operations

### Deposit ETH
```javascript
// User sends ETH, receives TALLY
await reserveVault.depositETH({ value: ethers.parseEther("0.1") });
```

### Deposit Token
```javascript
// Approve first
await usdc.approve(reserveVault.address, amount);
// Then deposit
await reserveVault.depositToken(USDC_ADDRESS, amount);
```

### Burn Spam NFT
```javascript
// Approve NFT transfer
await spamNFT.approve(reserveVault.address, tokenId);
// Burn for Trust
await reserveVault.burnSpamNFT(spamNFT.address, tokenId);
```

### Burn TALLY for Trust
```javascript
// Burn TALLY, receive Trust
await reserveTally.burnForTrust(ethers.parseEther("100"));
```

## Security Model

### Multi-sig (Future Enhancement)
Deploy contracts to Gnosis Safe for 2-of-2 approval:
- Human (Ledger) + AI Agent

### Timelock
Large operations queue for 24 hours before execution.

### Emergency
Owner can pause all operations.

## Addresses

### Trinity
- **1st Leg (Human/Ledger)**: `0xB64564838c88b18cb8f453683C20934f096F2B92`
- **2nd Leg (AI Agent)**: `0x6628227C195DAd7F7a8fD4F3D2cA3545A0D9CD22`

### Base Tokens
- USDC: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- USDbC: `0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA`
- DAI: `0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb`
- cbBTC: `0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf`
- WETH: `0x4200000000000000000000000000000000000006`

## Next Steps

1. **Bridge ETH to Base** - Need gas for deployment
2. **Deploy contracts** - Run deployment script
3. **Create Gnosis Safe** - For multi-sig security (optional)
4. **Initial deposits** - Seed the reserve
5. **AI agent integration** - Begin price monitoring

## Trust Token Utility

Earned by burning TALLY. Unlocks:
- Governance voting weight
- Premium features access
- Priority queues
- Reduced fees
- Community badges

## Notes

- All prices in USD with 18 decimals
- TALLY minted 1:1 with USD value
- Trust rate: 1% of burned TALLY (configurable)
- Spam NFT reward: 10 TRUST per burn (configurable)
