# Migration Guide: v2.0 to v2.1

## Overview

Version 2.1 introduces significant security enhancements, new Web3 capabilities, and multi-chain infrastructure. This guide documents breaking changes and migration steps.

**Release Date:** 2025-11-23
**Migration Priority:** HIGH - Security changes required for production
**Rollback Window:** 30 minutes from deployment

---

## 🔴 CRITICAL BREAKING CHANGES

### 1. Credential API Authentication (SECURITY)

**Status:** BREAKING CHANGE - All clients must update

#### Before (v2.0)
```javascript
// GET request - no authentication required
GET /api/credentials/0xdc20d621a88cb8908E8E7042431C55F0E9DAc6FB
```

#### After (v2.1)
```javascript
// POST request - requires EIP-191 signature
POST /api/credentials/0xdc20d621a88cb8908E8E7042431C55F0E9DAc6FB
Content-Type: application/json

{
  "message": "I authorize credential access",
  "signature": "0x..." // EIP-191 signed message
}
```

**Migration Steps:**
1. Update all clients calling `/api/credentials/:walletAddress`
2. Change HTTP method from GET to POST
3. Add request body with `message` and `signature` fields
4. Sign messages using `ethers.signMessage()` or Web3.js `web3.eth.accounts.sign()`
5. Test with test wallet before production

**Error Codes (v2.1):**
- `400` - Invalid wallet address format
- `401 MISSING_SIGNATURE` - Message or signature missing
- `401 INVALID_SIGNATURE` - Signature doesn't match wallet
- `404` - Credentials not found

---

### 2. New Dependencies Added

**New npm packages in v2.1:**
```json
{
  "bip39": "^3.1.0" // BIP39 mnemonic generation
}
```

**Impact:** If you use partner governance or wallet generation features, ensure `bip39` is installed.

**Installation:**
```bash
npm install
npm install --save bip39@^3.1.0
```

---

### 3. API Handler Module Exports

**Modules now required:**
- `public/api-handlers/credentials.js` (existing, updated)
- `public/api-handlers/api-keys.js` (NEW)
- `public/api-handlers/ssh-keys.js` (NEW)
- `public/api-handlers/bible-wallets.js` (NEW)
- `public/api-handlers/usdt-donations.js` (NEW)
- `public/api-handlers/partner-governance.js` (NEW)

**Impact:** Server.js now imports 6 API handler modules. Ensure all files exist and export required functions.

**Verification:**
```bash
node -e "
  require('./public/api-handlers/credentials.js');
  require('./public/api-handlers/api-keys.js');
  require('./public/api-handlers/ssh-keys.js');
  require('./public/api-handlers/bible-wallets.js');
  require('./public/api-handlers/usdt-donations.js');
  require('./public/api-handlers/partner-governance.js');
  console.log('✓ All modules loaded successfully');
"
```

---

### 4. Admin Wallet Configuration Changes

**Hardcoded admin wallets in v2.1:**
- Genesis Human: `0xdc20d621a88cb8908E8E7042431C55F0E9DAc6FB`
- Agent Wallet: `0x6628227C195DAd7F7a8fD4F3D2cA3545A0D9CD22`

**Note:** These are referenced in:
- `public/middleware/web3-auth.js` → `isGenesisHuman()`, `isAgent()`
- `config/walletIdentities.js` → `WALLET_IDENTITIES` mapping

**If using different wallets:** Update these hardcoded values before deployment to production.

---

## ⚠️ IMPORTANT: Security Updates Required

### Key Rotation Needed (Before Production Merge)

The `.env.template` contains documentation about past key exposures. **Before merging to main:**

1. **Rotate Genesis Human wallet keys:**
   - Current: `0xdc20d621a88cb8908E8E7042431C55F0E9DAc6FB`
   - Action: Rotate to OG Hotwallet deviation 2 (for testing)
   - Note: Will rotate again to server-derived keys after launch prep

2. **Rotate Agent wallet keys:**
   - Current: `0x6628227C195DAd7F7a8fD4F3D2cA3545A0D9CD22`
   - Action: Update after Kristopher completes launch prep

3. **Rotate API keys:**
   - Infura API key
   - Etherscan API key
   - Any third-party service credentials

4. **Update `.env` file:**
   ```bash
   # DO NOT commit real values
   cp .env.template .env
   # Edit .env with ACTUAL values (DO NOT commit)
   ```

---

## 📋 New Features (Non-Breaking)

These are new endpoints that don't affect existing code but provide new functionality:

### SSH Key Management
```
GET /api/ssh-key/:walletAddress
```

### Bible Wallet Management
```
POST /api/bible-wallets/register
GET  /api/bible-wallets/:guestWallet
POST /api/bible-wallets/:guestWallet/update-status
```

### USDT Donations & Tally Minting
```
POST /api/usdt-donations/record
GET  /api/usdt-donations/:wallet
```

### API Keys Management
```
POST /api/keys/create
POST /api/keys/verify
GET  /api/keys/:walletAddress
```

### Partner Governance
```
POST /api/partner-governance/generate-seed
POST /api/partner-governance/get-seed
GET  /api/partner-governance/status
```

---

## 🧪 Pre-Deployment Testing Checklist

- [ ] **Credentials API:** Test POST request with signature verification
- [ ] **Module Imports:** Run verification script for all handlers
- [ ] **Admin Wallets:** Verify correct wallet addresses in config
- [ ] **Dependencies:** Run `npm install` and verify no conflicts
- [ ] **Key Rotation:** Confirm keys rotated to deviation 2
- [ ] **Environment:** Verify `.env` file exists and is not committed
- [ ] **Contracts:** Verify all contract deployments (if applicable)
- [ ] **API Endpoints:** Test at least one endpoint from each handler
- [ ] **Logs:** Check for any startup errors in server logs

---

## 🚀 Deployment Steps

1. **Backup current state:**
   ```bash
   git tag backup/v2.0-$(date +%Y%m%d-%H%M%S)
   ```

2. **Pull latest code:**
   ```bash
   git checkout development/v2.1
   git pull origin development/v2.1
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Verify configuration:**
   ```bash
   node scripts/validate-env.js
   ```

5. **Run tests:**
   ```bash
   npm test
   ```

6. **Start server:**
   ```bash
   npm start
   ```

7. **Smoke test critical endpoints:**
   ```bash
   # Test a non-authenticated endpoint first
   curl http://localhost:3000/api/symbolic-adoption/stats

   # Test credential endpoint with signature
   node scripts/test-credentials.js
   ```

---

## 🔄 Rollback Plan (if needed)

If deployment fails, rollback within 30 minutes:

```bash
# Revert to previous version
git checkout main

# Kill current server
pkill -f "node server.js"

# Restart with v2.0
npm install
npm start
```

---

## 📞 Support & Questions

**Documentation:**
- See `BACKEND_REQUIREMENTS_PHASE_3.md` for requirements
- See `DEPLOYMENT_GUIDE_V3.md` for deployment procedures
- See `SECURITY.md` for security policies

**Issues:**
- Check server logs: `tail -f ~/.pm2/logs/convergence-protocol-error.log`
- Verify environment: `node scripts/validate-env.js`
- Test connectivity: `curl -v http://localhost:3000/health`

---

## Summary Table: What Changed

| Feature | v2.0 | v2.1 | Status |
|---------|------|------|--------|
| Credentials API | GET (no auth) | POST (signature required) | BREAKING |
| Admin wallets | Dynamic | Hardcoded | BREAKING |
| API Handlers | 1 module | 6 modules | BREAKING |
| Dependencies | N/A | bip39 added | BREAKING |
| SSH Keys | Not available | New endpoint | NEW |
| Bible Wallets | Not available | New endpoint | NEW |
| USDT Donations | Not available | New endpoint | NEW |
| API Keys Mgmt | Not available | New endpoint | NEW |
| Partner Governance | Not available | New endpoint | NEW |

---

**Version:** 2.1
**Last Updated:** 2025-11-23
**Next Review:** Before production merge to main
