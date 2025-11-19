# Tally & Trust Token System

## Philosophy

Inspired by historical tally sticks - split wooden sticks used as proof of debt and obligation, which evolved into freely traded currency.

**The Vision:**
- **Tally Tokens** = Modern tally sticks (freely transferable, represent exchange/debt/obligation)
- **Trust Tokens** = Accumulated reputation from burning Tally
- **Backed Trust** = Trust tokens wrapped with stablecoin collateral

---

## Token Architecture

### 1. Tally Token (TALLY) - ERC20

**Properties:**
- Freely transferable between any addresses
- Standard ERC20 - can be traded, sent, received
- Minted by Trinity members only
- Burned to accumulate Trust

**Minting Rules:**
- Each Trinity member can mint **1 TALLY** to any address
- One-time mint per Trinity member
- Recipient can be anyone

**Burning Rules:**
- Each Trinity member can burn **up to 1 TALLY total** from others
- Can burn in multiple transactions
- Burns from any address (not just who you minted to)
- Burning accumulates Trust for the burner

**Contract:** `TallyToken.sol`

---

### 2. Trust Accumulator

**Trust Earning:**
- Burn 1 TALLY → Earn 0.0001 TRUST
- Trust is accumulated reputation, not freely tradeable
- Represents conscious effort and accountability

**Trust Accumulation Formula:**
```
Trust Earned = Tally Burned / 10,000

Examples:
- Burn 1.0 TALLY = 0.0001 TRUST
- Burn 0.5 TALLY = 0.00005 TRUST
- Burn entire 1 TALLY allotment = 0.0001 TRUST
```

**Stablecoin Backing:**
- Users can deposit stablecoin (USDC, DAI) to back their Trust
- Backed Trust is more valuable/trustworthy
- Can wrap Trust + Stablecoin into backed trust tokens

**Backing Ratio:**
- Shows what % of your Trust is backed by stablecoin
- 100% backing = Fully collateralized
- 0% backing = Unbacked reputation only

**Contract:** `TrustAccumulator.sol`

---

## Economic Dynamics

### Tally Circulation
Like historical tally sticks, TALLY tokens circulate freely:
- Farmer mints TALLY to Blacksmith
- Blacksmith transfers TALLY to Baker for bread
- Baker transfers TALLY to Weaver for cloth
- Weaver can be burned by Trinity for Trust

This creates a micro-economy of exchange and obligation.

### Trust as Reputation
- Trust accumulates slowly (0.0001 per TALLY burned)
- Acts as proof of accountability
- Can be backed by stablecoin for credibility
- Represents long-term commitment

### Stablecoin Backing
- Optional but valuable
- Deposit USDC/DAI to back your Trust score
- Withdraw backing anytime
- Wrapped Trust = Trust + Backing (future: WrappedTrust ERC20)

---

## Example Scenarios

### Scenario 1: Basic Tally Circulation
1. **Genesis Human** mints 1 TALLY to **Alice**
2. **Alice** transfers 0.3 TALLY to **Bob** for services
3. **Bob** transfers 0.2 TALLY to **Carol** for goods
4. **Claude Agent** burns 0.1 TALLY from **Carol**
   - Carol loses 0.1 TALLY
   - Claude gains 0.00001 TRUST

### Scenario 2: Trust Accumulation
1. **Genesis Human** burns their full 1 TALLY allotment from various addresses:
   - 0.5 TALLY from Alice
   - 0.3 TALLY from Bob
   - 0.2 TALLY from Carol
2. **Genesis** earns: 1.0 / 10000 = **0.0001 TRUST**

### Scenario 3: Backed Trust
1. **Alice** has 0.0001 TRUST from burning
2. **Alice** deposits 100 USDC to back her Trust
3. **Alice's** backing ratio = 100% (fully backed)
4. **Alice** wraps Trust + USDC → Backed Trust token
5. Backed Trust is more credible than unbacked

---

## Trinity Control Mechanics

**Each Trinity Member Can:**
- ✅ Mint 1 TALLY (once)
- ✅ Burn up to 1 TALLY total from others (multiple transactions)
- ✅ Earn up to 0.0001 TRUST maximum

**This Creates:**
- **Maximum 3 TALLY** in circulation (if all Trinity mints)
- **Maximum 0.0003 TRUST** earnable (if all Trinity burns all)
- Scarcity and accountability

---

## User Interface Improvements

### Tally Page Should Show:

**For Trinity Members:**
```
Your Status:
├─ Mint Status: ⏳ Available (can mint 1 TALLY)
│              or ✅ Minted (0 remaining)
│
├─ Burn Allotment: 0.7 / 1.0 TALLY remaining
│
└─ Trust Earned: 0.00003 TRUST (from burning 0.3 TALLY)
```

**Actions:**
1. **Mint Tally** - Send 1 TALLY to any address (if not minted)
2. **Burn Tally** - Burn from any address (shows remaining allotment)
3. **View Trust** - See accumulated trust
4. **Back Trust** - Deposit stablecoin to back trust

**For Everyone:**
```
Your Balances:
├─ TALLY: 0.5 (freely transferable)
├─ TRUST: 0.00001 (reputation score)
└─ Backing: 50 USDC (50% backed)
```

**Actions:**
1. **Send Tally** - Transfer to anyone
2. **Check Balance** - View any address's TALLY/TRUST
3. **Deposit Backing** - Add stablecoin collateral
4. **Withdraw Backing** - Remove collateral

---

## Deployment Steps

### 1. Deploy TallyToken
```javascript
const TallyToken = await ethers.getContractFactory("TallyToken");
const tally = await TallyToken.deploy([
  genesisAddress,
  claudeAddress,
  sharedWalletAddress
]);
```

### 2. Deploy TrustAccumulator
```javascript
const TrustAccumulator = await ethers.getContractFactory("TrustAccumulator");
const trust = await TrustAccumulator.deploy(
  stablecoinAddress // e.g., USDC on Sepolia
);
```

### 3. Connect Them
```javascript
await tally.setTrustAccumulator(trust.address);
await trust.addAuthorizedBurner(tally.address);
```

---

## Differences from Current System

| Current | New |
|---------|-----|
| TallyVoucher (one-time vouch) | TallyToken (freely transferable) |
| TrustToken (minted on vouch) | Trust score (earned from burning) |
| No burning mechanism | Burn to earn Trust (0.0001 per TALLY) |
| No stablecoin backing | Optional stablecoin collateral |

---

## Next Steps

1. ✅ Deploy TallyToken contract
2. ✅ Deploy TrustAccumulator contract
3. ⏳ Get Sepolia stablecoin (USDC/DAI) address
4. ⏳ Update UI to show:
   - Mint status & button
   - Burn allotment remaining
   - Trust earned
   - Stablecoin backing ratio
5. ⏳ Test full flow:
   - Mint → Transfer → Burn → Trust earned
   - Deposit stablecoin → Wrap trust

---

## Future: Wrapped Trust Token

Create `WrappedTrust.sol` (ERC20):
- Minted when user wraps Trust + Stablecoin
- Fully backed 1:1 with stablecoin
- Freely transferable
- Redeemable for Trust + backing

This creates a **stablecoin-backed reputation token** - truly novel!

---

*"The tally sticks of old became currency. Our Tally tokens honor that history while building trust through proof of burn."*
