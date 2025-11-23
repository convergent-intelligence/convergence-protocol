# Launch Prep Checklist for v2.1 to Main

**Target Deployment:** Post-launch prep (after Kristopher's dev tomorrow)
**Current Status:** development/v2.1 branch pushed and ready for testing
**Breaking Changes:** Documented in MIGRATION_GUIDE.md

---

## 📋 Pre-Deployment Preparation

### Phase 1: Code & Documentation Review
- [ ] **MIGRATION_GUIDE.md reviewed** - All breaking changes documented
  - Credentials API: GET → POST with signature requirement
  - Admin wallets: Now hardcoded instead of dynamic
  - API handlers: 6 modules instead of 1
  - New dependency: bip39@^3.1.0
- [ ] **BREAKING_CHANGES.md** created and visible to team
- [ ] **Version numbers synced** between package.json and VERSION.md
- [ ] **GitHub Actions CI/CD** configured and passing
  - URL: `.github/workflows/test.yml`
  - Status: Automated testing on PR and push

### Phase 2: Environment & Keys
- [ ] **OG Hotwallet deviation 2 keys generated** (current plan for testing)
  - Genesis Human wallet: `0xdc20d621a88cb8908E8E7042431C55F0E9DAc6FB`
  - Update `.env` with deviation 2 private key
  - Keep `.env` file PRIVATE, never commit

- [ ] **Validate environment configuration**
  ```bash
  node scripts/validate-env.js
  ```
  - Genesis address ✓
  - Genesis private key ✓ (not old exposed key)
  - Agent address ✓
  - Agent private key ✓ (not old exposed key)
  - Infura API key ✓ (not old exposed key)
  - Etherscan API key ✓ (not old exposed key)
  - Encryption key ✓ (not default value)

### Phase 3: Dependency Installation
- [ ] **npm dependencies installed and up-to-date**
  ```bash
  npm install
  npm audit --production
  ```
  - bip39@^3.1.0 installed ✓
  - No high-severity vulnerabilities ✓

### Phase 4: Automated Testing
- [ ] **Module import verification passes**
  ```bash
  node -e "
    const modules = [
      './public/api-handlers/credentials.js',
      './public/api-handlers/api-keys.js',
      './public/api-handlers/ssh-keys.js',
      './public/api-handlers/bible-wallets.js',
      './public/api-handlers/usdt-donations.js',
      './public/api-handlers/partner-governance.js'
    ];
    modules.forEach(m => require(m));
    console.log('✓ All modules loaded');
  "
  ```

- [ ] **Smart contract compilation passes**
  ```bash
  npx hardhat compile
  ```

- [ ] **Hardhat tests pass**
  ```bash
  npm test
  ```

- [ ] **GitHub Actions tests passing**
  - Check: `.github/workflows/test.yml` status on latest push
  - All matrix versions (Node 18.x, 20.x) pass

---

## 🔐 Security & Key Rotation

### Current Status (v2.1 Ready for Testing)
- **Genesis Human:** Will use OG Hotwallet deviation 2 for testing
- **Agent Wallet:** Will update after launch prep
- **Timeline:**
  1. Rotation to deviation 2 (now) - for testing on main
  2. Second rotation to server-derived keys (after Kristopher's launch prep)

### Rotation Checklist
- [ ] **OG Hotwallet deviation 2 generated and tested**
  - Private key securely stored in `.env` (not committed)
  - Public address verified in `config/walletIdentities.js`
  - Transaction tested in Exodus

- [ ] **Server-derived keys prepared** (for second rotation tomorrow)
  - Genesis Human new private key ready
  - Agent Wallet new private key ready
  - Scheduled rotation time: [TIME TBD - After Kristopher's prep]

- [ ] **Old exposed keys deactivated**
  - Genesis: `***REMOVED***`
  - Agent: `***REMOVED***`

- [ ] **API keys rotated** (Infura, Etherscan)
  - Old Infura: `961fbd3e82da4c3da2f706356425d430`
  - Old Etherscan: `4JHTT9IG6H5IHSJ54S2JIT58AAZC2XMF5D`

---

## 🧪 Integration Testing

### Test 1: Credentials API with Signature Verification
```bash
node scripts/test-credentials-api.js [wallet-address] [private-key]
```

**Expected Results:**
- [ ] Missing signature → 401 error ✓
- [ ] Invalid signature → 401 error ✓
- [ ] Valid signature → 200 with credentials ✓
- [ ] Invalid wallet format → 400 error ✓

### Test 2: Web3 Auth Middleware
```bash
node -e "
  const { isGenesisHuman, isAgent, verifySignature } = require('./public/middleware/web3-auth.js');
  console.log('Genesis check:', isGenesisHuman('0xdc20d621a88cb8908E8E7042431C55F0E9DAc6FB'));
  console.log('Agent check:', isAgent('0x6628227C195DAd7F7a8fD4F3D2cA3545A0D9CD22'));
"
```

**Expected Results:**
- [ ] Genesis wallet recognized ✓
- [ ] Agent wallet recognized ✓
- [ ] Admin functions callable ✓

### Test 3: Wallet Identities Config
```bash
node -e "
  const { getIdentity, hasAdminAccess } = require('./config/walletIdentities.js');
  const id = getIdentity('0xdc20d621a88cb8908E8E7042431C55F0E9DAc6FB');
  console.log('Identity:', id?.displayName, 'Admin:', hasAdminAccess('0xdc20d621a88cb8908E8E7042431C55F0E9DAc6FB'));
"
```

**Expected Results:**
- [ ] Genesis identity returns correctly ✓
- [ ] Admin access confirmed ✓
- [ ] Permission checks work ✓

### Test 4: Server Startup
```bash
npm start
# Should see: 🤝 Convergence Protocol server is running on http://localhost:3000
```

**Expected Results:**
- [ ] No module import errors ✓
- [ ] Server starts on port 3000 ✓
- [ ] All API handlers loaded ✓
- [ ] No syntax errors ✓

### Test 5: API Health Check
```bash
curl http://localhost:3000/api/symbolic-adoption/stats
```

**Expected Results:**
- [ ] HTTP 200 response ✓
- [ ] Valid JSON data ✓
- [ ] Endpoint accessible ✓

---

## 📊 QA Signoff

- [ ] **Code Review:** All breaking changes understood and documented
- [ ] **Testing:** All automated tests passing (local + CI/CD)
- [ ] **Integration:** All integration tests passed
- [ ] **Security:** Environment validation passed, keys rotated to deviation 2
- [ ] **Documentation:** MIGRATION_GUIDE.md complete and accurate
- [ ] **Team Readiness:** Team understands POST vs GET change for credentials API

---

## 🚀 Deployment Steps (When Ready)

### Pre-Deployment (5 min before)
```bash
# Final backup
git tag backup/v2.1-$(date +%Y%m%d-%H%M%S)

# Verify we're on correct branch
git status
git log -1 --oneline

# One final test
npm install
npm test
```

### Deployment (3-5 min)
```bash
# Merge to main
git checkout main
git pull origin main
git merge development/v2.1

# Install and test
npm install
npm test

# Create release tag
git tag v2.1.0 -m "Release v2.1: Security enhancements and multi-chain infrastructure"

# Push everything
git push origin main --tags
```

### Post-Deployment (5 min)
```bash
# Restart server
pkill -f "node server.js"
npm start

# Health checks
curl http://localhost:3000/api/symbolic-adoption/stats
node scripts/test-credentials-api.js 0xdc20d621a88cb8908E8E7042431C55F0E9DAc6FB

# Verify git
git log -1 --oneline
```

---

## 📞 Rollback Plan (If Needed)

**Window:** First 30 minutes after deployment

```bash
# Identify current state
git log -1 --oneline
git status

# If issues found, revert immediately
git revert HEAD
git push origin main

# Or hard rollback to v2.0
git checkout backup/[version-tag]
npm install
npm test
npm start
```

---

## 🔄 Second Rotation (After Kristopher's Launch Prep)

After Kristopher finishes launch preparation tomorrow:

1. **Generate server-derived keys:**
   - New Genesis Human private key
   - New Agent Wallet private key

2. **Update `.env`** with new keys

3. **Re-run environment validation:**
   ```bash
   node scripts/validate-env.js
   ```

4. **Test transactions:**
   - Genesis wallet test transaction
   - Agent wallet test transaction

5. **Update config if needed:**
   - `config/walletIdentities.js` if addresses change
   - `public/middleware/web3-auth.js` if hardcoded addresses change

6. **Re-run full test suite**

7. **Deploy update to main** (if on main already)

---

## 📋 Dependencies & Versions

| Component | Version | Status |
|-----------|---------|--------|
| Node.js | 18.x, 20.x | ✓ Required |
| npm | Latest | ✓ Required |
| Hardhat | ^2.x | ✓ Installed |
| ethers.js | ^6.x | ✓ Installed |
| bip39 | ^3.1.0 | ✓ NEW - Installed |
| OpenZeppelin | ^5.0.1 | ✓ Installed |

---

## 🎯 Success Criteria

- [x] MIGRATION_GUIDE.md created with all breaking changes documented
- [x] GitHub Actions workflow configured (.github/workflows/test.yml)
- [x] All automated tests passing
- [x] Environment validation script available
- [x] Credentials API test script created (scripts/test-credentials-api.js)
- [ ] OG Hotwallet deviation 2 keys tested (in progress)
- [ ] Team trained on signature verification requirement
- [ ] Ready for deployment to main

---

## 📝 Notes

- **Current Branch:** development/v2.1 (112 files changed, 39,775+ insertions)
- **Key Changes:** Security auth, multi-chain contracts, governance, Web3 integration
- **Deadline:** Ready for main merge after all checklist items complete
- **Support:** Check MIGRATION_GUIDE.md and DEPLOYMENT_GUIDE_V3.md for details

---

**Last Updated:** 2025-11-23
**Prepared By:** Claude Code
**Review Status:** Ready for Kristopher's launch prep validation
