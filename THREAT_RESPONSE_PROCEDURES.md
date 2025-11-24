# Threat Response & Monitoring Procedures
## Ongoing Defense Against Sweeper Bots & Similar Threats

**Last Updated:** 2025-11-24
**Status:** ACTIVE - Continuous Monitoring Protocol
**Purpose:** Immediate response procedures for any security threats

---

## 🎯 THREAT MONITORING SCHEDULE

### Daily Operations
```
Every Day:
├─ 09:00 UTC: Run threat dashboard
├─ 17:00 UTC: Review alerts log
└─ 23:00 UTC: Document day's activity
```

### Weekly Operations
```
Every Monday:
├─ Full sweeper bot wallet analysis
├─ Review transaction patterns
├─ Check for new attack vectors
└─ Team security briefing
```

### Monthly Operations
```
Monthly:
├─ Rotate hotwallet keys
├─ Security audit checklist
├─ Update threat assessment
└─ Team security training
```

---

## 🔴 CRITICAL ALERT RESPONSE

### Level 1: Sweeper Bot Movement Detected
**Trigger:** Bot wallet shows outgoing transaction

**Immediate Actions (0-5 minutes):**
1. [ ] Verify alert is real (check Etherscan directly)
2. [ ] Record blockchain transaction hash
3. [ ] Note timestamp and destination address
4. [ ] Screenshot Etherscan page

**Short-term (5-30 minutes):**
5. [ ] Determine destination type:
    - Is it an exchange? (Check address tags)
    - Is it a mixing service? (Check Chainalysis)
    - Is it another bot? (Analyze pattern)
6. [ ] Document findings

**Follow-up (30 minutes - 2 hours):**
7. [ ] Report to law enforcement (if exchange destination)
8. [ ] Contact exchange security team (if applicable)
9. [ ] Update threat dashboard
10. [ ] Brief team on findings

**Example Alert:**
```
🚨 ALERT: 2025-11-24 12:34:56 UTC
Sweeper Bot Outgoing Transfer:
  From: 0x1f4Ef1eD23E38dAA2BD1451D4CEF219C93B2016F
  To:   0xabcd1234... (Unknown address)
  Amount: 0.5 ETH
  Hash:   0xdef5678...
  Destination Analysis: [TBD]

Action: [Investigating]
```

### Level 2: Funds Sent to Known Exchange
**Trigger:** Bot funds appear on exchange (Binance, Coinbase, etc.)

**Immediate Actions (0-5 minutes):**
1. [ ] Confirm exchange identity (official site only)
2. [ ] Gather all transaction evidence
3. [ ] Screenshot proof of stolen funds
4. [ ] Note blockchain confirmation count

**Urgent Actions (5-60 minutes):**
5. [ ] File report with FBI IC3: https://ic3.gov
6. [ ] Contact exchange security team directly
7. [ ] Provide:
    - Transaction hashes
    - Wallet addresses
    - Timeline of theft
    - Proof of original ownership (commit dates)

**Escalation (1-4 hours):**
8. [ ] Notify legal team
9. [ ] Brief executive team
10. [ ] Update media/communications if necessary
11. [ ] Document response timeline

**Success Criteria:**
- Exchange acknowledges receipt of report
- Exchange commits to investigation
- Exchange begins asset hold process
- Team is updated hourly on progress

### Level 3: Funds Sent to Mixing Service
**Trigger:** Bot funds move to tumbler/mixer (Tornado Cash, etc.)

**Immediate Actions (0-5 minutes):**
1. [ ] Confirm it's actually a mixer (blockchain analysis)
2. [ ] Document all transaction hashes before mixing
3. [ ] Note timing and amounts

**Realization & Recovery (5 minutes+):**
4. [ ] Once mixed, funds are essentially untraceable
5. [ ] Recovery probability drops to near-zero
6. [ ] Focus shifts to prevention for future incidents

**Documentation:**
7. [ ] Complete incident analysis
8. [ ] Document lessons learned
9. [ ] Update threat database
10. [ ] Improve monitoring to catch faster

**Key Insight:**
- Mixers exist to obscure fund origins
- Detection before mixing is critical
- After mixing, recovery is extremely difficult
- Prevention > Detection > Recovery

---

## ✅ STANDARD MONITORING TASKS

### Daily Threat Dashboard Check
```bash
# Run threat assessment dashboard
node scripts/sweeper-threat-dashboard.js

# This will show:
├─ Sweeper bot current holdings
├─ Hardware wallet status (should be unchanged)
├─ Hotwallet operational balance
├─ Exposed wallets status (should stay empty)
├─ Recent transaction activity
└─ Threat level assessment
```

### Sweep Alert Log Review
```bash
# View recent alerts
tail -50 data/sweeper-alerts.log

# Search for specific activity
grep "TRANSFER\|WARNING\|ALERT" data/sweeper-alerts.log | tail -20

# Check for new patterns
grep -c "ALERT" data/sweeper-alerts.log
```

### Hardware Wallet Balance Verification
```bash
# Check hardware wallet hasn't been touched
node check_hardware_wallet.js

# Should show:
├─ Hardware Wallet: ~0.0219 ETH (stable)
├─ Hotwallet: [operational amount]
└─ Sweeper Bot: [current stolen amount]
```

### GitHub Repository Audit
```bash
# Verify keys aren't in repo
git log --all -p | grep -i "PRIVATE_KEY\|0x[a-f0-9]\{64\}"
# Should return: no results

# Verify .env is clean
cat .env | grep -v "^#" | grep -v "^$"
# Should show only placeholders and public addresses
```

---

## 🔍 INVESTIGATION PROCEDURES

### When Alert Is Triggered

**Step 1: Verify the Alert**
```bash
# Is this real or false positive?
curl -s "https://api.etherscan.io/api?module=account&action=txlist&address=0x1f4Ef1eD23E38dAA2BD1451D4CEF219C93B2016F&apikey=YOUR_KEY" | jq '.result[0]'

# Should show latest transaction or "No transactions found" if no new activity
```

**Step 2: Analyze the Transaction**
```
Look for:
- Transaction hash (save this)
- Timestamp (when did this happen?)
- "to" address (where did funds go?)
- Value (how much was sent?)
- Status (confirmed or pending?)
```

**Step 3: Identify the Destination**
```
Use Etherscan to check destination address:
1. Go to: https://etherscan.io/address/[ADDRESS]
2. Look for address tags (might identify as exchange)
3. Check transaction history (is this an active address?)
4. Search for patterns (does it look like a bot?)
```

**Step 4: Determine Threat Level**
```
If destination is:
- Unknown single-use address → Could be mixer → Level 2
- Known exchange → Exchange funds → Level 3 (URGENT)
- Another bot address → Bot network → Level 2
- Public figure address → Rare → Level 2
```

### Address Analysis Tools

**Etherscan (Free):**
- https://etherscan.io - View all transactions
- Check address tags (says if it's exchange, bot, etc.)
- See transaction history and patterns

**Chainalysis (Paid but powerful):**
- Commercial blockchain analysis
- Can identify mixers, exchanges, scams
- Used by law enforcement

**Elliptic (Paid but comprehensive):**
- Enterprise fund tracing
- Mixing service detection
- Exchange identification

**Open Source Options:**
- Blockchair.com - Alternative explorer
- Dune Analytics - Custom queries
- Glasschain.org - Community tracking

---

## 📋 DOCUMENTATION REQUIREMENTS

### For Every Incident

**Incident Report Format:**
```
INCIDENT REPORT
================

Date & Time: [UTC timestamp]
Incident Type: [Alert type]
Severity: [Critical/High/Medium/Low]

Description:
[What happened, in detail]

Evidence:
- Transaction hash: [0x...]
- Wallet address: [0x...]
- Amount: [X ETH / tokens]
- Destination: [0x...]
- Etherscan link: [link]

Timeline:
- [HH:MM] Alert triggered
- [HH:MM] Verified alert
- [HH:MM] Analyzed transaction
- [HH:MM] Escalated to team

Actions Taken:
- [ ] Verified on Etherscan
- [ ] Identified destination
- [ ] Documented evidence
- [ ] Notified team
- [ ] Reported to authorities (if applicable)

Current Status: [Ongoing/Resolved]
Next Steps: [What's next]

Reported By: [Name]
Approved By: [Name]
```

### Store in: `data/incident-reports/`

**Filename format:** `incident-YYYY-MM-DD-HHMM.md`

**Example:**
```
incident-2025-11-24-1234.md
incident-2025-11-24-1530.md
```

---

## 🛑 IMMEDIATE SHUTDOWN PROCEDURES

### If Sweeper Bot Attacks Our Current Wallets

**STOP EVERYTHING:**
```
1. Stop all running operations immediately
2. Do NOT send any new funds
3. Do NOT execute any transactions
4. Do NOT change any configurations
```

**VERIFY SECURITY:**
```
1. Check hotwallet balance (should be minimal)
2. Check hardware wallet balance (should be unchanged)
3. Check for any unauthorized transactions
4. Review git logs for unauthorized commits
```

**ESCALATE:**
```
1. Alert all team members
2. Notify security team immediately
3. Get management approval before resuming
4. Document exactly what happened
```

**INVESTIGATE:**
```
1. How did the bot find our new wallet?
2. Was a new key exposed?
3. Did someone commit keys again?
4. Is there another vulnerability?
```

**RECOVER:**
```
1. Move all funds from hotwallet to hardware
2. Retire the compromised hotwallet address
3. Generate completely new hotwallet key
4. Update all code references
5. Run full security audit
6. Only resume operations after all-clear from security
```

---

## 📞 ESCALATION CHAIN

**For Different Threat Levels:**

### Critical (Bot confirmed attacking)
1. Immediate: Notify security lead
2. Within 5 min: Notify all team members
3. Within 15 min: Executive briefing
4. Within 30 min: Law enforcement report filed
5. Ongoing: Hourly updates

### High (Bot fund movement detected)
1. Immediate: Document evidence
2. Within 30 min: Security team review
3. Within 1 hour: Determine if escalation needed
4. If exchange: Law enforcement report
5. Daily: Updates and monitoring

### Medium (Alert triggered, investigating)
1. Immediate: Verify alert is real
2. Within 1 hour: Analysis complete
3. Within 2 hours: Team briefed
4. Ongoing: Continue monitoring

### Low (False alarm or routine monitoring)
1. Document in logs
2. Update threat assessment
3. Continue standard monitoring
4. No escalation needed

---

## 🔐 PREVENTION: STOPS THIS FROM HAPPENING AGAIN

### Why Our New System Is Better

**Before (Vulnerable):**
```
Keys → .env file → git repository → Bot scans GitHub → Bot extracts keys → Bot drains funds
```

**After (Protected):**
```
Keys → hardware device → not in git → bot can't find keys → funds stay safe
```

### Multiple Layers of Protection

1. **Layer 1: Prevention**
   - Pre-commit hooks block key uploads
   - Keys never touch .env or git
   - Server-side key management only

2. **Layer 2: Detection**
   - Real-time sweeper monitor
   - Alert system for suspicious activity
   - Daily threat dashboard review

3. **Layer 3: Isolation**
   - Hardware wallet (completely separate)
   - Minimal amounts in hotwallet
   - Empty exposed wallets (nothing to steal)

4. **Layer 4: Response**
   - Documented procedures
   - Escalation chain
   - Evidence preservation
   - Law enforcement coordination

---

## 📊 METRICS TO TRACK

### Security Metrics
```
Monthly Report:
├─ Days without security incidents: ___ / 30
├─ False alerts resolved: ___
├─ Hardware wallet status: [✅ SAFE]
├─ Hotwallet rotations: ___
├─ Security training sessions: ___
└─ Team compliance: ___%
```

### Threat Intelligence
```
├─ New exploits discovered: ___
├─ Bot activity changes: [Monitor]
├─ Similar incidents reported: ___
├─ Industry threat level: [Low/Medium/High]
└─ Sweeper bot holdings: [Current: ~$10,435]
```

---

## 🎯 QUARTERLY SECURITY REVIEW

**Every 3 months, audit:**

- [ ] All pre-commit hooks still working
- [ ] Hardware wallet still secure
- [ ] No keys in .env or git history
- [ ] All team members trained
- [ ] Threat monitoring system operational
- [ ] Incident response procedures documented
- [ ] Law enforcement reporting updated if needed
- [ ] New threats identified and addressed

---

## 📚 USEFUL RESOURCES

### Threat Monitoring
- **Etherscan Alerts:** https://etherscan.io/apis
- **Sweeper Monitor Script:** `scripts/sweeper-monitor.js`
- **Threat Dashboard:** `scripts/sweeper-threat-dashboard.js`

### Law Enforcement
- **FBI IC3:** https://ic3.gov
- **Secret Service EC Task Force:** https://www.secretservice.gov/
- **Local law enforcement:** [Your jurisdiction]

### Security Tools
- **Chainalysis:** https://www.chainalysis.com/
- **Elliptic:** https://www.elliptic.co/
- **TRM Labs:** https://www.trmlabs.com/

### Community
- **Immunefi:** https://immunefi.com/ (Security research)
- **OpenZeppelin Forum:** https://forum.openzeppelin.com/
- **Ethereum Security:** https://ethereum.org/en/security/

---

## ✅ PROCEDURE CHECKLIST

**Before declaring procedures complete:**
- [ ] All team members trained on alert procedures
- [ ] Escalation chain clearly defined
- [ ] Threat monitoring running 24/7
- [ ] Daily review schedule established
- [ ] Incident report templates created
- [ ] Evidence preservation process documented
- [ ] Law enforcement contact information verified
- [ ] Hardware wallet security confirmed
- [ ] Hotwallet monitoring active
- [ ] Emergency shutdown procedures practiced

---

**Prepared By:** Convergence Protocol Security Team
**Date:** 2025-11-24
**Classification:** Internal - Security Procedures
**Distribution:** Security team and authorized personnel only

---

## Quick Reference: What To Do If Alert Fires

```
ALERT RECEIVED
     ↓
Verify on Etherscan (https://etherscan.io)
     ↓
Document Transaction Hash
     ↓
Identify Destination Address
     ↓
         ┌──────────────────┬──────────────────┐
         ↓                  ↓                  ↓
    Unknown            Exchange         Mixer/Tumbler
    Address            Address          Address
         ↓                  ↓                  ↓
    Monitor          URGENT:           Monitor
    Continue         File Report       Document
    Investigation    With FBI IC3      Lessons
                     Contact Exchange  Update
                                      Prevention
```

Keep this procedure guide accessible. Time matters in security incidents.
