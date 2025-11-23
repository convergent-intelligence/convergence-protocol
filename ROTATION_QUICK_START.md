# Wallet Rotation Quick Start Guide

**⏱️ Estimated Time:** 2-4 hours
**🔐 Risk Level:** HIGH - Must follow exactly
**📋 Pre-requisite:** Read PRE_ROTATION_AUDIT.md first

---

## Summary

You're rotating two active wallets (Genesis Human and Agent) to remove exposure from .env while preserving all asset history.

**Bible wallets:** NOT rotating - just encrypting private keys in place

---

## Step-by-Step Execution

### STEP 1: Audit Current Assets (30 minutes)

```bash
cd /home/convergence/convergence-protocol

# Run the audit script
node scripts/pre-rotation-audit.js

# This will:
# ✓ Check Genesis Human holdings (ETH, Tally, Trust, Voucher, NFTs)
# ✓ Check Agent holdings
# ✓ Check Cold Reserve (should be untouched)
# ✓ Verify contract ownership
# ✓ Create audit-TIMESTAMP.json with full snapshot

# Review the output and JSON file
cat data/pre-rotation-audit-*.json | less
```

**Verification:**
- [ ] All token balances > 0 for Genesis and Agent
- [ ] Cold Reserve shows expected balance
- [ ] No errors in output
- [ ] JSON file created successfully

### STEP 2: Generate New Wallets (5 minutes)

Use ethers.js or hardhat to create new wallets:

```bash
# Option A: Using node directly
node -e "
const ethers = require('ethers');
const genesis = ethers.Wallet.createRandom();
const agent = ethers.Wallet.createRandom();

console.log('NEW GENESIS:');
console.log('Address:', genesis.address);
console.log('Private Key:', genesis.privateKey);
console.log('');
console.log('NEW AGENT:');
console.log('Address:', agent.address);
console.log('Private Key:', agent.privateKey);
"

# Option B: Using Hardhat
npx hardhat node &
# In another terminal:
hardhat console --network localhost
# ethers.Wallet.createRandom()
```

**Save these securely:**
```bash
# Create a secure file (NOT in git, NOT in .env yet)
cat > ~/.convergence-new-keys-BACKUP-$(date +%s).txt << EOF
NEW GENESIS ADDRESS: 0x...
NEW GENESIS PRIVATE KEY: 0x...

NEW AGENT ADDRESS: 0x...
NEW AGENT PRIVATE KEY: 0x...
EOF

# Restrict permissions
chmod 600 ~/.convergence-new-keys-BACKUP-*.txt
```

**Do NOT continue until keys are safely backed up**

### STEP 3: Transfer Assets (1-2 hours)

**CRITICAL:** Genesis Human must be the one running these transfers (using old private key)

```bash
# DRY RUN FIRST (verify transactions are correct)
node scripts/safe-rotation-transfer.js \
  --old-genesis 0xdc20d621a88cb8908E8E7042431C55F0E9DAc6FB \
  --new-genesis 0x[NEW_ADDRESS] \
  --old-agent 0x6628227C195DAd7F7a8fD4F3D2cA3545A0D9CD22 \
  --new-agent 0x[NEW_ADDRESS] \
  --dry-run

# Review the output carefully
# Check each transaction would go to the correct address
```

**If dry run looks good, execute:**
```bash
node scripts/safe-rotation-transfer.js \
  --old-genesis 0xdc20d621a88cb8908E8E7042431C55F0E9DAc6FB \
  --new-genesis 0x[NEW_ADDRESS] \
  --old-agent 0x6628227C195DAd7F7a8fD4F3D2cA3545A0D9CD22 \
  --new-agent 0x[NEW_ADDRESS] \
  --execute

# Wait for all transactions to confirm
# Script will output:
# - Transaction hashes
# - Block numbers
# - Confirmation receipts
```

**Verification:**
- [ ] All token transfers succeeded
- [ ] Contract ownership transferred
- [ ] No errors in output
- [ ] Log file created

### STEP 4: Verify Assets Arrived (30 minutes)

Using Etherscan or web3 calls, verify:

```javascript
// Check new Genesis has all tokens
const newGenesisAddress = '0x[NEW]';
const tallyBalance = await tallyContract.balanceOf(newGenesisAddress);
console.log('Genesis Tally:', ethers.formatEther(tallyBalance));
// Should match Phase 1 snapshot

// Check old Genesis is empty
const oldGenesisAddress = '0xdc20d621a88cb8908E8E7042431C55F0E9DAc6FB';
const oldBalance = await tallyContract.balanceOf(oldGenesisAddress);
console.log('Old Genesis Tally:', ethers.formatEther(oldBalance));
// Should be 0 (or very close)

// Check contracts are owned by new Genesis
const owner = await tallyContract.owner();
console.log('Tally Owner:', owner);
// Should be newGenesisAddress
```

**Verification Checklist:**
- [ ] New Genesis has all Genesis tokens
- [ ] New Agent has all Agent tokens
- [ ] Old Genesis has 0 tokens
- [ ] Old Agent has 0 tokens
- [ ] Contract ownership transferred
- [ ] Cold Reserve unchanged

### STEP 5: Stop Server & Update Environment (15 minutes)

```bash
# Backup current .env
cp .env .env.backup.$(date +%s)

# Store old keys in secure location
# (you already have backup from Step 2)

# Update .env with NEW keys
cat > .env << EOF
ADDRESS=0x[NEW_GENESIS_ADDRESS]
***REMOVED***[NEW_GENESIS_PRIVATE_KEY]
INFURA_KEY=[NEW_INFURA_KEY]
ETHERSCAN_KEY=[NEW_ETHERSCAN_KEY]

AGENT_***REMOVED***[NEW_AGENT_PRIVATE_KEY]
AGENT_ADDRESS=0x[NEW_AGENT_ADDRESS]
AGENT_EMAIL_PASSWORD=[NEW_PASSWORD]

CREDENTIAL_ENCRYPTION_KEY=convergence-trinity-secure-encryption-key-2025-11-22-genesis
EOF

# Verify NO SECRETS in git
git status
# Should NOT show .env as changed (if it's in .gitignore)
git diff .env 2>/dev/null || echo "✓ .env not tracked in git"

# Stop server gracefully
pm2 stop convergence-server
# OR: kill -TERM $(pgrep -f "node server.js")
# Wait ~30 seconds for graceful shutdown
```

**Verification:**
- [ ] .env backed up
- [ ] .env updated with new keys
- [ ] .env NOT in git
- [ ] Server stopped

### STEP 6: Update Server Code (5 minutes)

Edit `server.js` to update hardcoded addresses (if any):

```javascript
// In server.js, update Trinity member list:
// OLD:
// { role: 'Agent', address: '0x6628227C195DAd7F7a8fD4F3D2cA3545A0D9CD22' },

// NEW:
// { role: 'Agent', address: '0x[NEW_AGENT_ADDRESS]' },
```

Also check `config/walletIdentities.js` for Genesis address if needed.

**Verification:**
- [ ] All hardcoded Genesis references updated
- [ ] All Agent references updated
- [ ] Code doesn't contain old private keys

### STEP 7: Restart Server (5 minutes)

```bash
# Start server
node server.js

# Or with pm2:
pm2 start ecosystem.config.js

# Wait for startup
sleep 5

# Verify health check
curl http://localhost:8080/health

# Should return: { "status": "ok", ... }
```

**Verification:**
- [ ] Server starts without errors
- [ ] Health endpoint returns 200
- [ ] Logs show startup messages
- [ ] No wallet-related errors

### STEP 8: Verify Server Operations (30 minutes)

```bash
# Test Genesis operations
curl http://localhost:8080/api/protocol-config | jq .trinity

# Should show NEW Agent address in Trinity member list

# Try a Genesis-only operation (if exists)
# Should work with NEW Genesis private key

# Monitor logs for errors
tail -f /path/to/logs | grep ERROR
```

**Verification:**
- [ ] Server reflects new addresses
- [ ] Genesis-only operations work
- [ ] No permission errors
- [ ] No transaction signing failures

### STEP 9: Notify Clients (if needed)

```bash
# Email/message to integrators:
"
Genesis Human and Agent wallets have been rotated for security.

IMPORTANT CHANGES:
- Genesis address is now: 0x[NEW]
- Agent address is now: 0x[NEW]
- All API signatures still required (no change to auth flow)

VERIFY:
- Your integration still works
- You can sign requests as before
- All endpoints return 200

QUESTIONS? Contact [your contact info]
"
```

### STEP 10: Finalize (30 minutes)

```bash
# Audit final state
node scripts/pre-rotation-audit.js

# Compare with Phase 1 snapshot
# All balances should match (minus gas fees)

# Run final security check
# [ ] All signature verification working
# [ ] Old wallets have no authority
# [ ] New wallets have all authority
# [ ] Cold Reserve untouched

# Clean up temporary files
rm ~/.convergence-new-keys-BACKUP-*.txt  # After secure storage confirmed

# Create final rotation report
cat > data/rotation-complete-$(date +%Y%m%d-%H%M%S).md << EOF
# Rotation Completed Successfully

**Date:** $(date)
**Old Genesis:** 0xdc20d621a88cb8908E8E7042431C55F0E9DAc6FB
**New Genesis:** 0x[NEW]
**Old Agent:** 0x6628227C195DAd7F7a8fD4F3D2cA3545A0D9CD22
**New Agent:** 0x[NEW]

## Verification Results
- [ ] All assets transferred
- [ ] Contracts ownership updated
- [ ] Server running normally
- [ ] Clients notified
- [ ] Audit passed

## Old Keys
- [ ] Revoked from Infura
- [ ] Revoked from Etherscan
- [ ] Backed up securely
- [ ] Removed from .env
EOF

echo "✅ ROTATION COMPLETE"
```

---

## Rollback Procedure (If Anything Goes Wrong)

```bash
# If you need to rollback before completing:

# 1. Stop server
pm2 stop convergence-server

# 2. Restore old .env
cp .env.backup.$(date -r .env +%s) .env

# 3. Restore old code
git checkout server.js config/walletIdentities.js

# 4. Start server with OLD keys
pm2 start convergence-server

# 5. You'll need to re-transfer assets back manually
#    (Contact someone with old wallets' private keys)
```

**Note:** Only do this if transfers haven't completed. Once assets are in new wallets, you can't roll back without manual intervention.

---

## Troubleshooting

### "Private key does not match Genesis wallet"
**Cause:** Using wrong PRIVATE_KEY in .env
**Fix:** Verify you're using OLD Genesis key for the transfer script

### "Transfer failed - insufficient balance"
**Cause:** Not enough ETH for gas fees
**Fix:** Genesis needs extra ETH to cover gas (ask in server wallet)

### "Contract already owned by new address"
**Cause:** You already ran the transfer once
**Fix:** Check if new Genesis already owns contracts - you're done with this step

### "Assets in new wallet but server won't start"
**Cause:** .env has wrong keys
**Fix:** Double-check ADDRESS and PRIVATE_KEY match new Genesis

---

## Success Criteria

After completing all steps, you should have:

✅ Old Genesis wallet: Empty (or has only dust)
✅ Old Agent wallet: Empty (or has only dust)
✅ New Genesis wallet: Has all Genesis holdings + contract ownership
✅ New Agent wallet: Has all Agent holdings + minting rights
✅ Cold Reserve wallet: Completely unchanged
✅ Server: Running with new keys, fully operational
✅ Clients: Still working with signature verification
✅ Bible wallets: Completely untouched
✅ All audit logs: Showing new wallet addresses

---

## Next: Encrypt Bible Wallets (Optional but Recommended)

After successful rotation, you can encrypt the Bible wallet private keys:

```bash
# This is separate from rotation - can be done later
# See: SECURITY_FIXES_URGENT.md for details
```

---

## Timeline

| Step | Task | Time |
|------|------|------|
| 1 | Audit assets | 30 min |
| 2 | Generate new wallets | 5 min |
| 3 | Transfer assets | 60-120 min |
| 4 | Verify transfers | 30 min |
| 5 | Update environment | 15 min |
| 6 | Update code | 5 min |
| 7 | Restart server | 5 min |
| 8 | Verify operations | 30 min |
| 9 | Notify clients | 15 min |
| 10 | Finalize | 30 min |
| **TOTAL** | | **3.5-4 hours** |

---

## Emergency Contact

If you get stuck:
1. Check the Troubleshooting section above
2. Review PRE_ROTATION_AUDIT.md for details
3. Check transaction hashes on Etherscan
4. Review server logs for errors

**SAFETY FIRST:** When in doubt, STOP and verify before proceeding.

