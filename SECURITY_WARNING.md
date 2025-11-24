# ⚠️ CRITICAL SECURITY WARNING FOR CONTRIBUTORS

**Last Updated:** 2025-11-24
**Status:** ACTIVE THREAT - Sweeper Bot Monitoring Repository

---

## 🚨 IMMEDIATE THREAT ALERT

This repository has been compromised by an automated sweeper bot that:
1. **Scans GitHub repositories for exposed private keys**
2. **Extracts keys from git commit history**
3. **Automatically drains any funds from exposed wallets**
4. **Executes transactions within 1-2 Ethereum blocks (~12-24 seconds)**

**Attacker Address:** `0x1f4Ef1eD23E38dAA2BD1451D4CEF219C93B2016F`
**Current Holdings:** ~$10,435 USD in stolen crypto assets
**Attack Timeline:** 2025-11-23 to present

---

## 📋 INCIDENT SUMMARY

### What Happened
On November 23, 2025, private cryptocurrency wallet keys were accidentally exposed in this repository's git history. An automated bot detected the keys, extracted them, and began monitoring associated wallet addresses. When recovery funds were sent to the compromised wallets, the bot automatically drained them.

### Losses Incurred
- $200 PYUSD (recovery attempt)
- ~$100 ETH (initial fund drain)
- **Total: ~$302 USD**

### Lessons Learned
This incident demonstrated that:
- **Git history is permanent** - Keys committed once are exposed forever
- **Automated attacks are faster than manual response** - Bot executes in seconds; manual recovery takes minutes
- **Server-side key management is essential** - Never store private keys in version control
- **Pre-commit hooks save lives** - Automated prevention beats manual recovery every time

---

## ✅ REMEDIATION COMPLETED

### Git History Cleanup (DONE)
- ✅ Used BFG tool to remove exposed keys from all commits
- ✅ Force-pushed cleaned history to remote repository
- ✅ All team members must re-clone the repository
- ✅ Old git URLs will still contain exposed keys - **DO NOT USE OLD CLONES**

### New Security Infrastructure (ACTIVE)
- ✅ Pre-commit hooks installed (blocks key uploads automatically)
- ✅ Private key storage moved to server-side encrypted system
- ✅ Sweeper monitor deployed (24/7 threat monitoring)
- ✅ Hardware wallet established for cold storage
- ✅ Key management policies documented and enforced

---

## 🔐 SECURITY REQUIREMENTS FOR CONTRIBUTORS

### RULE #1: NEVER COMMIT PRIVATE KEYS
**These will be rejected by pre-commit hooks:**
```
PRIVATE_KEY=0x...
GENESIS_PRIVATE_KEY=0x...
AGENT_PRIVATE_KEY=0x...
Mnemonic seed phrases
Wallet export files (.json)
Key files (.key, .pem, .seed)
```

### RULE #2: PROTECT .env FILES
**If you create a .env file locally:**
```bash
# ✅ CORRECT: Keep keys out of .env
PRIVATE_KEY=0x_YOUR_KEY_HERE_PLACEHOLDER_ONLY

# ❌ WRONG: Never fill in actual keys
PRIVATE_KEY=0xe678cb3bb7be02a75156e4611b2a4f186bc17d257fb526aa1b8b811096542202
```

**Before committing, verify:**
```bash
# Check if you've accidentally added real keys
git diff --staged | grep "0x[a-fA-F0-9]\\{64\\}"  # Should find nothing
git diff --staged | grep "PRIVATE_KEY="            # Should only find placeholders
```

### RULE #3: USE .env.example FOR DOCUMENTATION
- **Where:** `.env.example` (in git, safe to share)
- **Purpose:** Shows required environment variables
- **Values:** Use only placeholders like `0x_YOUR_KEY_HERE`
- **Never:** Commit actual keys to .env.example

### RULE #4: UNDERSTAND PRE-COMMIT HOOKS
Before you commit, the pre-commit hook will:
```
1. Check staged files for private key patterns
2. Block commits with real key values (0x followed by 64 hex chars)
3. Block commits with known compromised keys
4. Show an error message if blocking a commit
```

**If blocked:**
```bash
# Don't try to bypass - fix the actual issue
git diff --cached  # See what was staged
git reset          # Unstage the problematic file
# Remove the actual keys from your .env file
# Then re-stage and commit
```

---

## 🛡️ WALLET SECURITY STRUCTURE

### Protected Architecture
```
SECURE WALLETS (Your Assets):
├─ Hardware Wallet: 0xB64564838c88b18cb8f453683C20934f096F2B92
│  └─ Cold storage, keys on hardware device, NOT in this repo
│
└─ Hotwallet: 0xCa1d6cB726145d7da0591409B148C9D504cC8AC8
   └─ Server-side keys in: data/hotwallet-keys.json (0600 perms, NOT in git)

COMPROMISED WALLETS (Sweeper Bot Monitors These):
├─ Genesis Deviation 1: 0xdc20d621a88cb8908e8e7042431c55f0e9dac6fb ❌ RETIRED
└─ Agent Wallet: 0x6628227C195DAd7F7a8fD4F3D2cA3545A0D9CD22 ❌ RETIRED
   └─ DO NOT SEND FUNDS - Bot will immediately drain them

SWEEPER BOT WALLET (Holding Stolen Funds):
└─ 0x1f4Ef1eD23E38dAA2BD1451D4CEF219C93B2016F ⚠️ UNDER MONITORING
   └─ Current holdings: ~$10,435 USD
   └─ Monitor at: https://etherscan.io/address/0x1f4Ef1eD23E38dAA2BD1451D4CEF219C93B2016F
```

---

## 📊 ONGOING THREAT MONITORING

### What We're Tracking
- **Sweeper Bot Address:** `0x1f4Ef1eD23E38dAA2BD1451D4CEF219C93B2016F`
- **Monitoring Frequency:** Every 12 seconds (per Ethereum block)
- **Alert System:** Automatic alerts to `data/sweeper-alerts.log`
- **Current Status:** Bot holding stolen funds, awaiting movement

### How to Monitor
```bash
# Real-time monitoring
node scripts/sweeper-monitor.js

# View alerts
tail -f data/sweeper-alerts.log

# Check bot on Etherscan
# https://etherscan.io/address/0x1f4Ef1eD23E38dAA2BD1451D4CEF219C93B2016F
```

### What We're Looking For
1. **Fund Movements:** When bot transfers stolen assets
2. **Exchange Deposits:** If funds go to known exchange addresses
3. **Mixing Services:** If funds go to tumbling/mixing contracts
4. **New Attacks:** If bot attacks other wallets (pattern detection)

### Law Enforcement Support
If funds are traced to an exchange:
- **Report to:** FBI IC3 (ic3.gov)
- **Data Needed:** Transaction hashes, timestamps, addresses
- **Next Steps:** Exchange can freeze funds if properly reported

---

## 🔍 INCIDENT RESPONSE PROCEDURES

### For Team Members
If you notice suspicious activity:

1. **IMMEDIATELY stop all operations**
   ```bash
   # Don't continue - security takes priority
   ```

2. **Run the sweeper monitor**
   ```bash
   node scripts/sweeper-monitor.js
   ```

3. **Check the alerts log**
   ```bash
   cat data/sweeper-alerts.log
   ```

4. **Document everything**
   - Note the exact time you discovered the issue
   - Save the sweeper monitor output
   - Copy relevant blockchain transaction hashes

5. **Escalate to security team**
   - Share logs and evidence
   - Do NOT continue operations
   - Wait for all-clear before resuming

### For Code Reviewers
Before approving any PRs:

1. **Check for key patterns**
   ```bash
   grep -n "PRIVATE_KEY\|GENESIS\|AGENT.*KEY" <changed-files>
   ```

2. **Verify no 0x + 64 hex chars**
   ```bash
   grep -n "0x[a-fA-F0-9]\{64\}" <changed-files>
   ```

3. **Confirm .env.example uses placeholders**
   ```bash
   grep "PRIVATE_KEY=" .env.example | grep -v "0x_"
   # Should find nothing
   ```

4. **Approve only if all checks pass**

---

## 📚 RESOURCES & DOCUMENTATION

### Security Policies
- **Recovery Plan:** `INCIDENT_RECOVERY_PLAN.md` - Full incident details and recovery options
- **Security Report:** `SECURITY_INCIDENT_2025_11_23.md` - Timeline and technical analysis
- **Environment Config:** `.env.example` - Safe template for configuration

### Key Management Scripts
- **Sweeper Monitor:** `scripts/sweeper-monitor.js` - Real-time threat detection
- **Key Manager:** `scripts/exodus-seed-manager.py` - Server-side key generation
- **Validation:** `scripts/validate-env.js` - Verify security configuration

### Monitoring & Alerts
- **Alert Log:** `data/sweeper-alerts.log` - Automatic threat alerts
- **Etherscan Link:** https://etherscan.io/address/0x1f4Ef1eD23E38dAA2BD1451D4CEF219C93B2016F
- **Transaction Details:** Use Etherscan to track bot activity

---

## ⚠️ WHAT NOT TO DO

### ❌ Do NOT:
- Commit private keys in any form
- Store actual keys in .env or environment files
- Share wallet private keys via Slack, email, or chat
- Reuse keys from compromised wallets
- Send large amounts to hotwallet (keep minimal for gas)
- Bypass pre-commit hooks (`git commit --no-verify`)
- Use old clones with exposed git history
- Create personal branches with test keys

### ❌ If Someone Commits Keys:
- Do NOT panic - pre-commit hooks should have blocked it
- Do NOT try to "delete" the commit
- Do NOT commit a new version with the key removed (it's still in history)
- Do NOT push - notify security team immediately
- Do NOT continue operations - secure first, debug later

---

## ✅ WHAT TO DO

### ✅ DO:
- Review pre-commit hook rules before first commit
- Use `.env.example` as your template
- Test your .env file before committing any changes
- Ask on #security if you're unsure about anything
- Run `git diff --staged` before every commit
- Keep hotwallet keys server-side only
- Report suspicious blockchain activity immediately
- Keep hardware wallet private and secure

### ✅ If You Suspect an Issue:
1. Stop operations immediately
2. Run sweeper monitor to check for activity
3. Check logs for alerts
4. Document everything with timestamps
5. Contact security team
6. Wait for all-clear before resuming

---

## 🎯 LONG-TERM SECURITY GOALS

### This Quarter
- [x] Incident response and containment
- [x] Git history cleanup with BFG
- [x] Pre-commit hooks deployed
- [x] Hardware wallet secured
- [ ] Team security training completion
- [ ] Quarterly security audit

### Ongoing
- Daily sweeper monitor checks
- Monthly hotwallet key rotation
- Quarterly security audits
- Continuous team training
- Threat intelligence sharing

---

## 📞 GET HELP

### Before You Code
- Read `.env.example` to understand required configuration
- Ask in #security-team if you're unsure
- Test your .env locally before staging
- Review pre-commit hook requirements

### If Something Goes Wrong
1. Stop and don't continue operations
2. Run `node scripts/sweeper-monitor.js`
3. Check `data/sweeper-alerts.log`
4. Document what you observed
5. Contact security team with logs

### For Security Questions
- **Pre-commit hooks:** `.git/hooks/pre-commit` (source of truth)
- **Key management:** `data/hotwallet-keys.json` policies
- **Incident details:** `INCIDENT_RECOVERY_PLAN.md` (comprehensive guide)
- **Sweeper bot tracking:** Run monitor script for latest status

---

## 📝 INCIDENT TIMELINE

| Date | Time | Event |
|------|------|-------|
| 2025-11-23 | 20:00 UTC | Private keys discovered exposed in git history |
| 2025-11-23 | 20:30 UTC | Sweeper bot begins monitoring exposed wallets |
| 2025-11-23 | 22:00 UTC | Recovery attempt: $200 PYUSD sent to exposed wallet |
| 2025-11-23 | 22:01 UTC | Bot drains recovery funds within 1 Ethereum block |
| 2025-11-23 | 23:00 UTC | New secure hotwallet created and deployed |
| 2025-11-24 | 00:00 UTC | Security monitoring and documentation systems activated |
| 2025-11-24 | 01:00 UTC | BFG cleanup executed on git history |
| 2025-11-24 | 01:15 UTC | Cleaned history force-pushed to remote |
| 2025-11-24 | NOW | Ongoing monitoring and threat tracking active |

---

## 🔐 COMMITMENT TO SECURITY

This incident has taught us that:
1. **Prevention beats recovery** - We've invested in automated prevention
2. **Transparency helps** - We're documenting everything so others learn
3. **Community protects community** - Your vigilance helps protect the project

**By contributing to this project, you're agreeing to follow these security practices.**

Thank you for being part of a secure, transparent development community.

---

**Security Team**
Convergence Protocol
2025-11-24

---

## Footnote: How Sweeper Bots Work

If you're curious about the attack vector (for defensive knowledge):

1. **Scanning:** Bots scan GitHub for patterns like `PRIVATE_KEY=0x` followed by 64 hex characters
2. **Extraction:** Keys are extracted from git history via `git log` and public APIs
3. **Validation:** Bot tests if extracted key has funds (via blockchain RPC calls)
4. **Automation:** Bot sets up automatic draining whenever funds arrive
5. **Speed:** Using smart contracts, transfers execute within 1-2 blocks (~12-24 sec)
6. **Hiding:** Stolen funds are quickly moved to multiple wallets or mixing services

**Our Defense:**
- Server-side key generation (keys never in .env)
- Pre-commit hooks (automatic prevention)
- Real-time monitoring (immediate alerting)
- Minimal amounts in hotwallet (less to steal)
- Hardware wallet (completely separate)
- Clean git history (no keys to extract)

This is why our new approach is fundamentally more secure.
