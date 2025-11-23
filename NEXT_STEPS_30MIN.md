# Next 30 Minutes - What You Need To Do

## Goal
Create new Genesis wallet in Exodus, test transaction, provide completed `.env.template`

---

## Timeline

| Time | Task | Duration |
|------|------|----------|
| 0:00 | Start - Read this file | 2 min |
| 0:02 | Install Exodus (if needed) | 5 min |
| 0:07 | Create Genesis wallet in Exodus | 5 min |
| 0:12 | Get private key from Exodus | 5 min |
| 0:17 | Test transaction old→new | 10 min |
| 0:27 | Get API keys (Infura/Etherscan) | 10 min |
| 0:37 | Fill in `.env.template` | 5 min |
| **0:42** | **DONE - Provide template** | |

---

## Quick Checklist (Do These Steps)

### 1️⃣ Exodus Setup (12 minutes)
```
[ ] Download Exodus from https://www.exodus.com
[ ] Install and launch
[ ] Create new Ethereum wallet (NOT restore existing)
[ ] SAVE THE SEED PHRASE (12 or 24 words)
[ ] Settings → View private key for Ethereum
[ ] COPY the address: 0x_________________________
[ ] COPY the private key: 0x____________________________...
```

**Write them here temporarily:**
```
New Genesis Address: _________________________________

New Genesis Private Key: ________________________________...
```

### 2️⃣ Test Transaction (10 minutes)
```
[ ] Send small amount of ETH from current wallet to new Genesis address
[ ] Wait ~1 minute for confirmation
[ ] Verify it appears in Exodus
[ ] Check on Etherscan: https://etherscan.io
   - Search for old Genesis: 0xdc20d621a88cb8908E8E7042431C55F0E9DAc6FB
   - Find the transaction you just sent
   - Verify "To" is your new Genesis address ✓
```

### 3️⃣ Get New API Keys (10 minutes)
```
[ ] Infura: https://infura.io/dashboard
   - Create new project
   - Copy API key: ________________________________

[ ] Etherscan: https://etherscan.io/apis
   - Create new API key
   - Copy key: ________________________________

[ ] Generate encryption key:
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

   Output: ________________________________________________________________
```

### 4️⃣ Fill in `.env.template` (5 minutes)
```
[ ] Copy `.env.template` to `.env`
[ ] Fill in all values from steps above:
   - ADDRESS = [new Genesis address]
   - PRIVATE_KEY = [new Genesis private key]
   - INFURA_KEY = [new Infura key]
   - ETHERSCAN_KEY = [new Etherscan key]
   - CREDENTIAL_ENCRYPTION_KEY = [new random key]

[ ] SAVE `.env`
[ ] Verify NOT committed to git
[ ] Ready to provide
```

---

## Files You'll Use

| File | Purpose |
|------|---------|
| `EXODUS_WALLET_SETUP.md` | Detailed Exodus walkthrough |
| `.env.template` | Template to fill in |
| `scripts/validate-env.js` | Verify your .env is correct |

---

## When You're Done

After ~30 minutes:

1. Send me the completed `.env.template` (or just the values)
2. I will:
   ```bash
   # Verify all values
   node scripts/validate-env.js

   # Check for old exposed keys
   # Verify addresses are valid format
   # Check private keys are new
   # Ensure API keys rotated
   ```
3. Once verified → Ready to execute rotation!

---

## Important Notes

⚠️ **DO NOT:**
- Commit `.env` to git
- Share private keys via email/Slack
- Delete the seed phrase backup
- Continue if test transaction fails

✅ **DO:**
- Test the transaction (it's free and proves wallets work)
- Back up the seed phrase securely
- Generate NEW keys (not reuse old ones)
- Verify on Etherscan the transaction went to new wallet

---

## Quick Reference: What You're Creating

| Wallet | Old Address | New Address | Status |
|--------|------------|-------------|--------|
| Genesis | 0xdc20d6... | 0x[NEW] | 🔄 Rotating |
| Agent | 0x662822... | 0x[NEW] | 🔄 Rotating |
| Reserve | 0xB64564... | Same | ✅ Untouched |
| Bible | (historic) | Same | ✅ Untouched |

---

## Example: What Your Completed .env Will Look Like

```env
ADDRESS=0x1234567890abcdef1234567890abcdef12345678
***REMOVED***abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890

AGENT_ADDRESS=0xfedcba0987654321fedcba0987654321fedcba09
AGENT_***REMOVED***0987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba
AGENT_EMAIL_PASSWORD=SomeNewPassword123!

INFURA_KEY=1234567890abcdef1234567890abcdef
ETHERSCAN_KEY=ABCDEF1234567890ABCDEF1234567890ABCDEF

CREDENTIAL_ENCRYPTION_KEY=abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890
```

---

## After 30 Minutes

You'll have:
✅ New Genesis wallet created & tested
✅ New API keys generated
✅ Completed .env.template ready to provide
✅ Seeds/keys backed up securely
✅ Transaction confirmed on Etherscan

Then I'll:
✅ Validate your environment
✅ Verify all keys are new (not old exposed ones)
✅ Confirm ready for rotation

Then we'll:
✅ Execute pre-rotation audit
✅ Run safe transfer script
✅ Update server with new keys
✅ Deploy to production

---

## Let's Go! 🚀

**Start with:** `EXODUS_WALLET_SETUP.md`
**Then fill:** `.env.template`
**Then run:** `node scripts/validate-env.js`
**Then send:** The completed `.env.template` (or values)

⏱️ Timer starts now - ~30 minutes!
