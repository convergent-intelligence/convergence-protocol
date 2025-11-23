# Exodus Wallet Setup & Test Transaction Guide

**⏱️ Time Required:** ~30 minutes
**🎯 Goal:** Create new Genesis wallet, test transaction, provide private key

---

## Step 1: Download & Install Exodus (5 minutes)

1. Go to https://www.exodus.com
2. Download for your OS (Windows, Mac, Linux)
3. Install and launch
4. Create or restore wallet if first time

---

## Step 2: Create New Ethereum Wallet (5 minutes)

In Exodus:

1. Click **Assets** or **Wallets** tab
2. Search for **Ethereum**
3. Click **Ethereum** and select **"Add Wallet"** or **"Set Up"**
4. Exodus will generate a new Ethereum address
5. **SAVE YOUR SEED PHRASE** (12 or 24 words) in secure location
   - This is the master key for this wallet
   - Never share it
   - You'll need it if you need to restore

**Your New Genesis Wallet Address:**
```
Address: 0x_____________________________
(Copy and paste this into .env.template)
```

---

## Step 3: Get Private Key from Exodus (5 minutes)

**For Exodus Desktop:**

1. Settings → Wallets → Ethereum
2. Look for **"View Seed Phrase"** or **"Show Private Key"**
3. Click and verify you're on the right device
4. Copy the **private key** (starts with 0x)

**For Exodus Mobile:**

1. Settings → Backup & Recovery
2. Find Ethereum wallet
3. View private key (requires authentication)

**Your New Genesis Private Key:**
```
Private Key: 0x________________________________________________________________
(This is 64 hex characters after 0x)
```

⚠️ **DO NOT SHARE THIS - SAVE SECURELY**

---

## Step 4: Test Transaction (10 minutes)

### Fund the New Wallet (if needed)

If the new wallet is empty:
1. Send a small amount of ETH to the new address from your current wallet
2. Wait for confirmation (~1 minute on mainnet)
3. You should see it in Exodus

### Test: Send from OLD Genesis to NEW Genesis

1. In your current wallet, send test amount to new Genesis address
2. Example: Send 0.01 ETH (or small amount)
3. Transaction should appear in Exodus within ~1 minute
4. Verify in Etherscan:
   - Open https://etherscan.io/address/0xdc20d621a88cb8908E8E7042431C55F0E9DAc6FB
   - Look for recent outgoing transactions
   - Click the transaction hash
   - Verify it went to your new Genesis address

**Verification Checklist:**
- [ ] New wallet created in Exodus
- [ ] Address visible in Exodus
- [ ] Test transaction sent
- [ ] Transaction appears in Exodus after ~1 minute
- [ ] Transaction visible on Etherscan
- [ ] "To" address matches new Genesis address

---

## Step 5: Fill in .env.template

Once you have confirmed the test transaction:

```bash
# Edit .env.template with your new values

# New Genesis Address (from Exodus)
ADDRESS=0x[YOUR_NEW_GENESIS_ADDRESS]

# New Genesis Private Key (from Exodus Settings)
***REMOVED***[YOUR_NEW_GENESIS_PRIVATE_KEY]

# New API Keys (generated separately on Infura/Etherscan)
INFURA_KEY=[YOUR_NEW_INFURA_KEY]
ETHERSCAN_KEY=[YOUR_NEW_ETHERSCAN_KEY]

# New Encryption Key (generated)
CREDENTIAL_ENCRYPTION_KEY=[NEW_RANDOM_64_HEX_CHARS]
```

---

## Step 6: Generate External API Keys (10 minutes)

### New Infura Key

1. Go to https://infura.io/dashboard
2. Sign in or create account
3. Create new project
4. Copy the API Key
5. Delete old project (revoke old key)

```
INFURA_KEY=_______________________________
```

### New Etherscan Key

1. Go to https://etherscan.io/apis
2. Sign in or create account
3. Create new API key
4. Copy the key
5. Delete old key in settings

```
ETHERSCAN_KEY=________________________________
```

### New Encryption Key

Generate with:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Output will be 64 hex characters:
```
CREDENTIAL_ENCRYPTION_KEY=________________________________________________________________
```

---

## Step 7: For Agent Wallet (Optional - Can Do Separately)

You can repeat this process for the Agent wallet:

1. Create new Agent wallet in Exodus (or separately)
2. Test transaction
3. Export private key
4. Provide in .env.template:

```
AGENT_ADDRESS=0x[NEW_AGENT_ADDRESS]
AGENT_***REMOVED***[NEW_AGENT_PRIVATE_KEY]
```

---

## Complete .env.template Example

```env
# Genesis Human - Primary Wallet
ADDRESS=0x1234567890abcdef1234567890abcdef12345678
***REMOVED***abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890

# Agent - Minting Wallet
AGENT_ADDRESS=0xfedcba0987654321fedcba0987654321fedcba09
AGENT_***REMOVED***0987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba

# External Services
INFURA_KEY=1234567890abcdef1234567890abcdef
ETHERSCAN_KEY=ABCDEF1234567890ABCDEF1234567890ABCDEF

# Encryption
CREDENTIAL_ENCRYPTION_KEY=abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890
```

---

## Security Checklist

- [ ] New wallets created
- [ ] Test transactions completed
- [ ] Private keys exported securely
- [ ] .env.template filled with new values
- [ ] Old .env backed up securely
- [ ] New .env will NOT be committed to git
- [ ] Seed phrases backed up (12/24 word phrases)
- [ ] All keys stored in secure location

---

## Verification

Once you provide the completed .env.template:

```bash
# I will:
# 1. Verify wallet addresses are valid format
# 2. Verify private keys are valid format
# 3. Verify API keys are correct format
# 4. Check that Cold Reserve is not touched
# 5. Proceed with rotation scripts
```

---

## Emergency: If Something Goes Wrong

**Lost Private Key?**
- Restore from seed phrase in Exodus
- Get new private key from settings

**Transaction stuck?**
- Wait ~5 minutes
- Check Etherscan for status
- If still pending, might need higher gas

**Wallet doesn't show balance?**
- Refresh Exodus (close and reopen)
- Make sure you're on Ethereum network (not ERC-20)
- Give transaction ~1 minute to confirm

---

## Next: Provide .env.template

Once you complete the steps above, provide:

```
.env.template (with all values filled in)
```

I will then:
1. Verify all values are correctly formatted
2. Prepare rotation scripts
3. Ready for execution when you say go

---

## Quick Reference

| What | Where | Time |
|------|-------|------|
| Create wallet | Exodus app | 5 min |
| Get private key | Exodus Settings | 5 min |
| Test transaction | Send ETH to new address | 10 min |
| Infura key | infura.io/dashboard | 5 min |
| Etherscan key | etherscan.io/apis | 5 min |
| Fill template | Edit .env.template | 5 min |
| **TOTAL** | | **~35 min** |

