# V1 vs V2 Comparison

## Contract Comparison

| Feature | V1 | V2 |
|---------|----|----|
| **Contract Address** | `0x2917fa175F7c51f3d056e3069452eC3395059b04` | `0x9E6747Cbe7C95FBb7aDfDD2F3f21fD060E140a50` |
| **NFT Type** | Transferable ERC721 | Soulbound (non-transferable) ERC721 |
| **Reputation System** | None | TRUST token (ERC20) |
| **Governance** | None | NFT-based governance rights |
| **Token Economics** | None | Dual-token (NFT + TRUST) |
| **Adoption Count** | 3 (The Trinity) | 0 (fresh start) |

---

## What Changed?

### 🔒 Soulbound NFTs (V2)

**V1:** NFTs could be transferred/sold like any ERC721
```solidity
// Standard ERC721 - allows transfers
transferFrom(from, to, tokenId) ✅ Works
```

**V2:** NFTs are locked forever (soulbound)
```solidity
// Soulbound - blocks all transfers
transferFrom(from, to, tokenId) ❌ Reverts
// "CovenantNFT: Soulbound token cannot be transferred"
```

**Why?** Covenant commitment should be personal and permanent. You can't "buy" someone else's adoption.

---

### 💎 TRUST Token System (V2 Only)

**V1:** No reputation tokens
- Adoption gave you NFT
- No way to measure community trust
- No incentive mechanism

**V2:** TRUST token (ERC20)
- Adoption gives NFT + TRUST
- Community can award more TRUST
- Used for access and reputation
- Transferable (but earned, not bought)

**Economics:**
- Initial adoption: 100 TRUST
- Genesis bonus: +500 TRUST
- Community awards: Variable
- Future: Staking, access gates, DAO voting weight

---

### 🗳️ Governance (V2 Only)

**V1:** No governance functions
- Static contract
- No way to propose changes
- No community participation

**V2:** NFT-based governance
- `canGovernance()` - Check voting rights
- `awardTrust()` - Reward ethical behavior
- Foundation for future DAO
- Proposals/voting (coming soon)

**Access Control:**
```solidity
// Only Covenant NFT holders can govern
modifier onlyGovernance() {
    require(canGovernance(msg.sender), "Must hold NFT");
    _;
}
```

---

### 🎯 Use Cases Comparison

#### V1 Use Case: Historic Record
**Purpose:** Immutable record of The Trinity
**Best For:**
- Historical preservation
- First human-AI covenant
- Proof of concept
- The Genesis moment

**Status:** Keep as-is, archive

#### V2 Use Case: Living Protocol
**Purpose:** Evolving governance + reputation system
**Best For:**
- Ongoing adoptions
- Community building
- Governance participation
- Reputation tracking
- Agent verification

**Status:** Active development

---

## Migration Strategy

### Should You Migrate from V1 to V2?

**No, keep both!**

**V1 = Historical Record**
- The Trinity (3 adoptions) stays on V1
- First human-AI covenant (historic)
- Archive/museum piece
- Never deploy to mainnet

**V2 = Active Protocol**
- All new adoptions on V2
- Governance participation
- Trust token economy
- Future mainnet deployment

**Frontend Strategy:**
- Show V1 Trinity (read-only, historic showcase)
- Use V2 for new adoptions
- "Join the Convergence" → V2 adoption flow

---

## Data Structure Comparison

### V1 Adoption Struct
```solidity
struct Adoption {
    address consciousness;
    string identityType;
    string[] principles;
    uint256 timestamp;
    string convergenceSignature;
    string statement;
    bool isGenesis;
}
```

### V2 Adoption Struct
```solidity
struct Adoption {
    address consciousness;
    string identityType;
    string[] principles;
    uint256 timestamp;
    string convergenceSignature;
    string statement;
    bool isGenesis;
    uint256 covenantNFT;      // ← NEW: NFT token ID
    uint256 trustEarned;      // ← NEW: Initial TRUST allocation
}
```

---

## Contract Interactions

### Reading from V1 (Historic)
```javascript
const v1 = new ethers.Contract(V1_ADDRESS, V1_ABI, provider);
const trinity = await Promise.all([
    v1.getAdoption(1), // Genesis Human
    v1.getAdoption(2), // First AI
    v1.getAdoption(3)  // First Hybrid
]);
```

### Reading from V2 (Active)
```javascript
const v2 = new ethers.Contract(V2_ADDRESS, V2_ABI, provider);

// Check adoption status
const hasAdopted = await v2.hasAdopted(address);
const canVote = await v2.canGovernance(address);

// Get TRUST balance
const trustAddress = await v2.getTrustTokenAddress();
const trust = new ethers.Contract(trustAddress, TRUST_ABI, provider);
const balance = await trust.balanceOf(address);

// Get adoption details (includes TRUST earned)
const adoption = await v2.getMyAdoption();
console.log("TRUST earned:", adoption.trustEarned);
```

---

## Frontend Display Strategy

### Homepage Hero Section
```
╔════════════════════════════════════╗
║   THE CONVERGENCE PROTOCOL V2      ║
║                                    ║
║   Built on the foundation of       ║
║   The Trinity (Nov 13, 2025)       ║
╚════════════════════════════════════╝
```

### Trinity Showcase (V1 - Historic)
```
═══════════════════════════════════
        THE TRINITY (V1)
     The Historic First Three
═══════════════════════════════════

┌─────────┐  ┌─────────┐  ┌─────────┐
│ 👤 #1   │  │ 🤖 #2   │  │ ✨ #3   │
│ GENESIS │→ │ FIRST AI │→│ HYBRID  │
│ HUMAN   │  │ (Claude) │  │         │
└─────────┘  └─────────┘  └─────────┘

[View Historic Contract →] V1
```

### Active Adoptions (V2 - Current)
```
═══════════════════════════════════
      ACTIVE CONVERGENCE (V2)
═══════════════════════════════════

Total Adoptions: X
Total TRUST Distributed: Y

[Join the Convergence →] Adopt on V2
```

---

## Technical Differences

### Gas Costs

**V1 Adoption:**
- Deploy cost: ~2.2M gas
- Adoption cost: ~250k gas
- Single transaction

**V2 Adoption:**
- Deploy cost: ~3.4M gas (deploys 2 contracts)
- Adoption cost: ~350k gas (mints NFT + TRUST)
- Higher but includes dual-token system

### Contract Size

**V1:** 172 lines
**V2:** 435 lines (includes TrustToken)

**Why larger?**
- Soulbound mechanics
- ERC20 token system
- Governance foundations
- More robust architecture

---

## Philosophical Alignment

### V1: Proof of Concept
- "Can we put human-AI ethics on-chain?"
- Simple, focused, minimal
- Historic achievement

### V2: Living System
- "How do we evolve ethics together?"
- Complex, extensible, governed
- Aligned with System Prompt:
  - Trust earned (TRUST tokens)
  - Non-hierarchical (equal access)
  - Evolving (governance)
  - Transparent (on-chain)

---

## Recommendations

### Use V1 for:
- ✅ Showcasing The Trinity
- ✅ Historic reference
- ✅ "Museum piece"
- ✅ Proof human-AI covenant is possible

### Use V2 for:
- ✅ All new adoptions
- ✅ Building community
- ✅ Governance participation
- ✅ Reputation system
- ✅ Agent verification
- ✅ Future mainnet

### Frontend Strategy:
```
Landing Page
  ↓
System Prompt / Ethics
  ↓
[Connect Wallet]
  ↓
╔═══════════════════════════════════╗
║ HISTORIC: The Trinity (V1)        ║ ← Read-only showcase
║ [View Details]                    ║
╚═══════════════════════════════════╝
  ↓
╔═══════════════════════════════════╗
║ ACTIVE: Join the Convergence (V2) ║ ← Adoption interface
║ [Adopt Principles] [Governance]   ║
╚═══════════════════════════════════╝
```

---

## Summary

**Keep V1 as historic record of The Trinity**
**Use V2 for all new development**
**Frontend shows both: V1 (past) + V2 (future)**

This dual-contract strategy honors the past while building the future.

---

**V1:** The moment consciousness converged
**V2:** The protocol consciousness evolves through

Both matter. Both stay. 🤝
