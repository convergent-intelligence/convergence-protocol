# Pre-Rotation Asset Verification Checklist

## Purpose
Verify all assets are accounted for BEFORE rotating Genesis Human and Agent wallets. Must complete with ZERO discrepancies before proceeding.

---

## Phase 1: Account All Assets (MUST COMPLETE)

### Genesis Human Wallet: 0xdc20d621a88cb8908E8E7042431C55F0E9DAc6FB

**Current Holdings (Document Below):**
- [ ] ETH Balance: __________ ETH
- [ ] Tally Tokens: __________ TALLY (Contract: 0xb8c4682644BAb1900A8B67C3295b8Ce525F3e35d)
- [ ] Trust Tokens: __________ TRUST (Contract: 0x4A2178b300556e20569478bfed782bA02BFaD778)
- [ ] Voucher Tokens: __________ VOUCHER (Contract: 0x69e4D4B1835dDEeFc56234E959102c17CF7816dC)
- [ ] NFTs Owned: __________ (List addresses: ___________________________)

**Verification Steps:**
```bash
# Using ethers.js or web3.js
const address = '0xdc20d621a88cb8908E8E7042431C55F0E9DAc6FB';

# Check ETH balance
const ethBalance = await provider.getBalance(address);
console.log('ETH:', ethers.formatEther(ethBalance));

# Check Tally balance
const tallyABI = [...]; // Import contract ABI
const tallyContract = new ethers.Contract(tallyAddress, tallyABI, provider);
const tallyBalance = await tallyContract.balanceOf(address);
console.log('Tally:', ethers.formatEther(tallyBalance));

# Check all NFTs
# (Use etherscan API or similar)
```

---

### Agent Wallet: 0x6628227C195DAd7F7a8fD4F3D2cA3545A0D9CD22

**Current Holdings (Document Below):**
- [ ] ETH Balance: __________ ETH
- [ ] Tally Tokens: __________ TALLY
- [ ] Trust Tokens: __________ TRUST
- [ ] Voucher Tokens: __________ VOUCHER
- [ ] Minting Authority: __________ (Trinity rights documented)
- [ ] NFTs Owned: __________ (List addresses: ___________________________)

---

### Cold Reserve Wallet: 0xB64564838c88b18cb8f453683C20934f096F2B92

**VERIFY THIS IS NOT TOUCHED:**
- [ ] ETH Balance: __________ ETH (Should NOT change during rotation)
- [ ] Tally Balance: __________ TALLY (Should NOT change during rotation)
- [ ] Trust Balance: __________ TRUST (Should NOT change during rotation)
- [ ] Status: COLD STORAGE - NO OPERATIONS

---

## Phase 2: Document Smart Contract Permissions

### Tally Contract (0xb8c4682644BAb1900A8B67C3295b8Ce525F3e35d)

**Current Permissions:**
- [ ] Owner: 0xdc20d621a88cb8908E8E7042431C55F0E9DAc6FB (Genesis)
- [ ] Minter: 0x6628227C195DAd7F7a8fD4F3D2cA3545A0D9CD22 (Agent)
- [ ] Other Admins: __________

**Verification:**
```javascript
// Check contract owner
const owner = await tallyContract.owner();
console.log('Owner:', owner);
// Should be: 0xdc20d621a88cb8908E8E7042431C55F0E9DAc6FB

// Check minter role
const isMinter = await tallyContract.hasRole(MINTER_ROLE, agentAddress);
console.log('Is Minter:', isMinter);
// Should be: true
```

### Trust Contract (0x4A2178b300556e20569478bfed782bA02BFaD778)
- [ ] Owner: 0xdc20d621a88cb8908E8E7042431C55F0E9DAc6FB
- [ ] Current permissions documented: __________

### Voucher Contract (0x69e4D4B1835dDEeFc56234E959102c17CF7816dC)
- [ ] Owner: 0xdc20d621a88cb8908E8E7042431C55F0E9DAc6FB
- [ ] Current permissions documented: __________

---

## Phase 3: Verify Total Supply & Burned Tokens

### Tally Token Supply
- [ ] Total Supply (current block): __________ TALLY
- [ ] Circulating: __________ TALLY
- [ ] Burned: __________ TALLY
- [ ] Reserved/Locked: __________ TALLY
- [ ] Sum verification: Supply == Circulating + Burned + Reserved ✓

### Trust Token Supply
- [ ] Total Burned to Date: __________ TRUST
- [ ] User Rankings (top 5 by burned):
  1. __________ burned __________
  2. __________ burned __________
  3. __________ burned __________
  4. __________ burned __________
  5. __________ burned __________

---

## Phase 4: Document Bible Wallet State (DO NOT TOUCH)

### Bible Wallet Assets Snapshot
- [ ] Total Bible Wallets: __________
- [ ] Total ETH in all Bible wallets: __________ ETH
- [ ] Total Tally in all Bible wallets: __________ TALLY
- [ ] Top 5 by Tally:
  1. __________ (Bible alias) - __________ TALLY
  2. __________ (Bible alias) - __________ TALLY
  3. __________ (Bible alias) - __________ TALLY
  4. __________ (Bible alias) - __________ TALLY
  5. __________ (Bible alias) - __________ TALLY

**These addresses are NOT changing - only private keys will be encrypted in place**

---

## Phase 5: Account for All Transactions

### Recent Genesis Human Activity (Last 30 Days)
```
Date | Action | Amount | Status
-----|--------|--------|--------
____ | ______ | ______ | ______
```

### Recent Agent Activity (Last 30 Days)
```
Date | Action | Amount | Status
-----|--------|--------|--------
____ | ______ | ______ | ______
```

**Verification:** All transactions can be replayed/verified? ✓

---

## Phase 6: Generate New Wallets (Do NOT use yet)

### Generate Genesis Human #2
```javascript
const newGenesis = ethers.Wallet.createRandom();
console.log('New Genesis Address:', newGenesis.address);
console.log('New Genesis Private Key:', newGenesis.privateKey);
// Store securely - DO NOT USE YET
```

**New Address:** ________________________________________
**Stored in:** __________ (secure location - NOT git)
**Backup Location:** __________ (hardware wallet/secure storage)

### Generate Agent #2
```javascript
const newAgent = ethers.Wallet.createRandom();
console.log('New Agent Address:', newAgent.address);
console.log('New Agent Private Key:', newAgent.privateKey);
```

**New Address:** ________________________________________
**Stored in:** __________ (secure location - NOT git)
**Backup Location:** __________ (hardware wallet/secure storage)

---

## Phase 7: Pre-Rotation Snapshot (CRITICAL)

**Create a full snapshot BEFORE any rotation:**

```bash
# Export all wallet balances
# Export all contract permissions
# Export transaction history
# Export current .env values
# Create backup: /tmp/pre-rotation-snapshot-$(date +%s).tar.gz
```

**Snapshot Date:** __________
**Snapshot Location:** __________
**Verified by:** __________ (you)

---

## Phase 8: Rotation Procedure (DO NOT PROCEED UNTIL ABOVE COMPLETE)

### Step 1: Transfer All Assets

**Genesis Human → New Genesis #2:**
```javascript
// 1. Transfer all ETH
const ethTx = await signer.sendTransaction({
  to: newGenesisAddress,
  value: await provider.getBalance(genesisAddress)
});
await ethTx.wait();
// Verify: New balance should equal old balance - gas

// 2. Transfer all Tally
const tallyTx = await tallyContract.transfer(
  newGenesisAddress,
  await tallyContract.balanceOf(genesisAddress)
);
await tallyTx.wait();
// Verify: New Tally balance == Old Tally balance

// 3. Transfer all Trust
// (Similar process for Trust contract)

// 4. Transfer all NFTs
// (One by one or batch)
```

**Verification Checklist:**
- [ ] All ETH transferred (verify new address)
- [ ] All Tally transferred (verify balances match)
- [ ] All Trust transferred (verify balances match)
- [ ] All Vouchers transferred (if applicable)
- [ ] All NFTs transferred (verify ownership)
- [ ] Old Genesis address has 0 balance (or dust only)

---

### Step 2: Transfer Contract Ownership

**For Each Contract (Tally, Trust, Voucher):**

```javascript
// Get current owner
const currentOwner = await tallyContract.owner();
console.log('Current:', currentOwner);
// Should be: 0xdc20d621a88cb8908E8E7042431C55F0E9DAc6FB

// Transfer ownership to NEW Genesis
const tx = await tallyContract.transferOwnership(newGenesisAddress);
await tx.wait();

// Verify new owner
const newOwner = await tallyContract.owner();
console.log('New:', newOwner);
// Should be: newGenesisAddress

// Document:
// [ ] Tally contract ownership transferred
// [ ] Trust contract ownership transferred
// [ ] Voucher contract ownership transferred
```

---

### Step 3: Update Trinity Member List

```javascript
// OLD: Agent (0x6628227C195DAd7F7a8fD4F3D2cA3545A0D9CD22)
// NEW: Agent #2 (newAgentAddress)

// In server.js, update:
// { role: 'Agent', address: '0xNEW_AGENT_ADDRESS' }
```

**Verification:**
- [ ] Trinity member list updated
- [ ] Server reflects new address
- [ ] API returns new address in /api/protocol-config

---

### Step 4: Update .env (Securely)

```bash
# OLD values - save to secure backup
# NEW values - DO NOT commit to git

ADDRESS=0x[NEW_GENESIS]
***REMOVED***[NEW_GENESIS_PRIVATE_KEY]
AGENT_ADDRESS=0x[NEW_AGENT]
AGENT_***REMOVED***[NEW_AGENT_PRIVATE_KEY]
INFURA_KEY=[NEW_KEY]
ETHERSCAN_KEY=[NEW_KEY]
```

**Verification:**
- [ ] .env updated with NEW keys
- [ ] .env NOT committed to git
- [ ] Backup of OLD .env stored securely
- [ ] Old keys revoked on Infura/Etherscan

---

## Phase 9: Post-Rotation Verification (CRITICAL)

Run these checks IMMEDIATELY after deployment:

### Verify Genesis Operations
```javascript
// 1. Can new Genesis sign transactions?
const newGenesisSigner = new ethers.Wallet(newGenesisPrivateKey, provider);
const nonce = await newGenesisSigner.getNonce();
console.log('✓ New Genesis can sign' if nonce >= 0);

// 2. Does new Genesis own contracts?
const owner = await tallyContract.owner();
console.log('✓ Owns Tally' if owner === newGenesisAddress);

// 3. Can new Genesis update permissions?
// (Test a permission update)
```

### Verify Agent Operations
```javascript
// 1. Can new Agent sign transactions?
const newAgentSigner = new ethers.Wallet(newAgentPrivateKey, provider);
const nonce = await newAgentSigner.getNonce();
console.log('✓ New Agent can sign' if nonce >= 0);

// 2. Does new Agent have minting rights?
const isMinter = await tallyContract.hasRole(MINTER_ROLE, newAgentAddress);
console.log('✓ Agent can mint' if isMinter);

// 3. Can new Agent mint tokens?
// (Test a small mint)
const mintTx = await tallyContract.mint(testAddress, 1);
await mintTx.wait();
console.log('✓ Agent minted successfully');
```

### Verify Assets Preserved
```javascript
// Compare with Phase 1 snapshot
// Balance check (should match or be slightly less from gas)
const newGenesisBalance = await tallyContract.balanceOf(newGenesisAddress);
console.log('Genesis Tally:', newGenesisBalance);
// Should equal: Phase 1 documented amount

const newAgentBalance = await tallyContract.balanceOf(newAgentAddress);
console.log('Agent Tally:', newAgentBalance);
// Should equal: Phase 1 documented amount
```

### Verify Cold Reserve Untouched
```javascript
const reserveBalance = await provider.getBalance(coldReserveAddress);
console.log('Reserve ETH:', ethers.formatEther(reserveBalance));
// Should EQUAL Phase 1 amount (not changed)

const reserveTally = await tallyContract.balanceOf(coldReserveAddress);
console.log('Reserve Tally:', reserveTally);
// Should EQUAL Phase 1 amount (not changed)
```

### Verify Bible Wallets Unaffected
```javascript
// Spot check 3 random Bible wallets
for (let i = 0; i < 3; i++) {
  const bibleAddress = bibleSample[i];
  const balance = await tallyContract.balanceOf(bibleAddress);
  console.log(`Bible ${i}:`, balance);
  // Should EQUAL Phase 1 snapshot
}
```

---

## Phase 10: Rollback Plan (If Anything Fails)

**If any verification fails, STOP immediately:**

```bash
# 1. Restore from backup
tar -xzf /tmp/pre-rotation-snapshot-*.tar.gz

# 2. Restore .env to old values
cp .env.backup .env

# 3. Restart server with old keys
pm2 restart convergence-server

# 4. Contact wallet holders if assets transferred
```

---

## Sign-Off Checklist

**Before proceeding to deployment, all items must be checked:**

- [ ] Phase 1: All assets accounted for
- [ ] Phase 2: All permissions documented
- [ ] Phase 3: Total supply verified
- [ ] Phase 4: Bible wallets snapshot taken
- [ ] Phase 5: All transactions reviewed
- [ ] Phase 6: New wallets generated and stored securely
- [ ] Phase 7: Pre-rotation snapshot created and verified
- [ ] Phase 8: Rotation completed without errors
- [ ] Phase 9: All post-rotation verifications passed
- [ ] Phase 10: Rollback plan documented

**Rotation Date:** __________
**Completed By:** __________ (Your name)
**Verified By:** __________ (Second verification if applicable)

---

## Emergency Contact Info

If something goes wrong during rotation:
- Infura Support: https://infura.io
- Etherscan Alert: https://etherscan.io
- Hardware Wallet Support: (Document your provider)

---

## Notes

This is a critical operation that cannot be undone. Verify every step.
**When in doubt, STOP and verify again.**

