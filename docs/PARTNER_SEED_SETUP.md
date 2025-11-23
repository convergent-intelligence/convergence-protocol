# Partner Governance Seed Setup Guide

## Quick Start

### Step 1: Install Dependencies

```bash
cd /home/convergence/convergence-protocol
npm install
```

### Step 2: Generate the 12-Word Partner Seed

```bash
npm run generate-partner-seed generate 0xdc20d621a88cb8908E8E7042431C55F0E9DAc6FB
```

**Output Example:**
```
🔐 GENERATING PARTNER GOVERNANCE SEED

✅ Partner seed generated successfully

Details:
- Word Count: 12
- Created At: 2025-11-22T15:30:45.123Z
- Initiated By: 0xdc20d621a88cb8908E8E7042431C55F0E9DAc6FB
- Maximum Partners: 65

⚠️  WARNING:
🔐 KEEP THIS SEED SECURE. This is for covenant commitment among human partners.

Seed:
praise volcano wealth motion cancel chapter rhythm fortune fetch submit library fortune

Next Step: Share with Genesis Human for safe custody. Distribute to partners on achievement.
```

**⚠️ CRITICAL: Save this seed in a secure location!**

---

## Seed Security Best Practices

### Master Copy (Genesis Human)

1. **Print on paper** - Use high-quality, archival paper
2. **Laminate** - Protect from water/damage
3. **Store in vault** - Physical security required
4. **Sign & date** - Your initials confirm authenticity
5. **Backup** - Keep 2 sealed copies in separate locations

### Encrypted Copy (Agent Wallet)

1. Generate encrypted backup
2. Store encrypted copy on secure server
3. Key available only to Genesis + Agent
4. Requires both signatures to decrypt

### Distribution to Partners

1. **In-person preferred** - Face-to-face handoff
2. **Encrypted email** - If in-person impossible
3. **Verbal confirmation** - Partner repeats it back
4. **Written acknowledgment** - Partner confirms receipt
5. **On-chain commitment** - Partner signs covenant

---

## Partner Seed Information

### Characteristics

| Property | Value |
|----------|-------|
| **Format** | 12 English words (BIP-39) |
| **Security** | 128-bit entropy |
| **Shared Among** | All 65 human partners |
| **Distribution** | One per partner achievement |
| **Transferability** | Non-transferable (collective property) |
| **Revocation** | Cannot be revoked (permanent) |
| **Purpose** | Covenant commitment + collective identity |

### What the Seed Represents

This seed is NOT:
- ❌ A private key (no direct crypto access)
- ❌ A wallet recovery phrase (not individual custody)
- ❌ An access token (no authentication by itself)
- ❌ A password (can't log in with just this)

This seed IS:
- ✅ A collective commitment identifier
- ✅ A symbol of partnership covenant
- ✅ Shared among all 65 partners
- ✅ Part of governance records
- ✅ A human-readable 12 words
- ✅ Cryptographically secure (BIP-39)

---

## Implementation Timeline

### Week 1: Setup & Generation

**Monday: Generate the Seed**
```bash
npm run generate-partner-seed generate 0xdc20d621a88cb8908E8E7042431C55F0E9DAc6FB
```

**Tuesday: Secure Storage**
- Print seed (3 copies)
- Laminate
- Store in vault
- Document custody chain

**Wednesday: Back Copies**
- Create encrypted backup
- Store with Agent wallet
- Update audit log

**Thursday: System Readiness**
- Deploy PartnerGovernanceToken contract
- Initialize API endpoints
- Configure security logging
- Document procedures

**Friday: Documentation**
- Partner governance guide complete
- Intent declaration process ready
- Covenant commitments defined
- Security audit trail initialized

---

## Paul/Leviticus Onboarding Example

### Week 1: Guest Registration

**Day 1:**
```bash
# Paul registers wallet with Bible alias
curl -X POST http://localhost:8080/api/bible-wallets/register \
  -H "Content-Type: application/json" \
  -d '{
    "guestWallet": "0xPaul123...",
    "bibleAlias": "paul-leviticus"
  }'
```

**Day 2-3:**
- Participates in ceremony
- Earns 100 TRUST tokens
- System logs participation

**Day 4-5:**
- Donates $100 USDT
- Receives 100 TALLY tokens
- Update status tracking

**Day 6:**
- Burns 100 TRUST tokens
- Achieves "user" status
- Can log in with Bible wallet

### Week 2-3: User Progression

**Accumulate Value:**
- More ceremonies (more trust)
- More donations (more tally)
- Total burned trust tracked
- Tally accumulation recorded

**Competition Phase:**
- Ranked by trust burned
- Tally as tiebreaker
- Progresses toward partner

### Week 4: Partnership Path

**Declare Intentions:**
```bash
curl -X POST http://localhost:8080/api/partner-governance/declare-intentions \
  -H "Content-Type: application/json" \
  -d '{
    "wallet": "0xPaul123...",
    "name": "Paul",
    "intentType": "SEEK_PARTNERSHIP",
    "statement": "I have been interested in AI alignment and governance for years. I want to join the Convergence partner collective and help ensure the protocol remains true to its principles. I commit to the covenant values of human autonomy, AI alignment, and shared wisdom."
  }'
```

**Genesis Reviews:**
- Checks declaration
- Verifies human identity
- Reviews reputation/tally
- Evaluates alignment
- Approves partnership

**Paul Achieves Partner Status:**
```javascript
// In smart contracts:
userStatusTracker.assignPartnerStatus(0xPaul123..., "leviticus");

// Mint governance token:
partnerGovernanceToken.mintPartnerToken(
  0xPaul123...,
  "paul-leviticus",
  0xPaulBibleWallet...
);
```

### Week 5: Seed Distribution

**Genesis Distributes Seed:**
```
In-person or encrypted channel:
"praise volcano wealth motion cancel chapter rhythm fortune fetch submit library fortune"
```

**Paul Acknowledges Receipt:**
```bash
curl -X POST http://localhost:8080/api/partner-governance/acknowledge-seed \
  -H "Content-Type: application/json" \
  -d '{
    "wallet": "0xPaul123...",
    "intentStatement": "I have securely received the partner governance seed. I commit to protecting it and upholding the Convergence covenant principles."
  }'
```

**Paul Signs Covenant:**
```javascript
partnerGovernanceToken.signCovenant(
  tokenId,
  "I, Paul, commit to the Convergence Protocol. I pledge to defend human autonomy, ensure AI alignment, steward shared wisdom, and maintain security. I recognize my responsibility as one of 65 partners in this governance collective."
);
```

**Result: Paul is Now Partner #1**

```
Status: PARTNER
Bible Alias: paul-leviticus
Governance Token: Minted & Soulbound
Covenant Signed: ✅
Partner Seed: Received & Secured
Voting Rights: Active
Proposal Rights: Active
Responsibilities: Full
```

---

## Daily Operations

### Checking Status

```bash
# View partnership status
npm run partner-status

# Output:
{
  "maxPartners": 65,
  "currentPartners": 1,
  "seatsFilled": 1,
  "seatsAvailable": 64,
  "seedGenerated": true,
  "partners": [
    {
      "wallet": "0xPaul123...",
      "bibleAlias": "paul-leviticus",
      "achievedAt": "2025-11-25T...",
      "seedDistributed": true,
      "seedAcknowledged": true,
      "governanceVotes": 0
    }
  ]
}
```

### Monitoring Security

```bash
# View security log (HIGH severity events)
npm run partner-security-log HIGH

# View intent declarations (non-partners only)
npm run partner-declarations -- --non-partners
```

### Intent Declarations

People interested in partnership will submit:
```
POST /api/partner-governance/declare-intentions

All declarations logged for review
Responses guide next steps
Security monitoring prevents fraud
Transparent process builds trust
```

---

## Governance Operations

### Recording a Vote

**Partner Votes on Proposal:**
```javascript
// Smart contract call:
partnerGovernanceToken.recordGovernanceVote(tokenId, proposalId);

// Logged to:
// - Blockchain (immutable)
// - Audit trail (transparent)
// - Partnership records (historical)
```

### Creating a Proposal

**Partner Proposes Protocol Change:**
```javascript
// Must have signed covenant first
require(partner.covenantSignedAt > 0, "Must sign covenant");

// Create proposal
partnerGovernanceToken.createGovernanceProposal(tokenId);

// Partners vote for 7 days (protocol changes)
// 50%+ consensus needed for approval
// Vote record saved permanently
```

### Revoking a Partner (Emergency)

**If partner violates covenant:**
```bash
# Genesis initiates revocation vote
# 90% consensus required
# 3-month voting period
# Covenant NFT becomes transferable

partnerGovernanceToken.revokePartner(
  tokenId,
  "Reason: Violation of covenant principles regarding AI alignment"
);
```

---

## Three Seed Phrases Summary

### Seed #1: Exodus (12-word) - Individual
```
NOT YET: To be distributed to each partner for personal custody
Purpose: Individual partner's private asset custody
Status: Future implementation
Max: One per partner (65 total)
```

### Seed #2: Hardware (24-word) - System Reserve
```
✅ ALREADY EXISTS: Genesis Human holds
Purpose: System-level reserve custody
Status: Deployed and secured
Max: One for entire system
Holder: Genesis Human (hardware wallet backup)
```

### Seed #3: Partner Governance (12-word) - Collective ✅ READY
```
✅ READY TO GENERATE: Use command below
Purpose: 65-partner collective governance
Status: Implementation complete
Max: One, shared among all 65
Holder: All partners collectively

Command to generate:
npm run generate-partner-seed generate 0xdc20d621a88cb8908E8E7042431C55F0E9DAc6FB
```

---

## File Structure

```
convergence-protocol/
├── scripts/governance/
│   └── generate-partner-seed.js          # Partner seed generator
│
├── public/api-handlers/
│   └── partner-governance.js             # API endpoints
│
├── contracts/
│   └── PartnerGovernanceToken.sol        # Governance NFT contract
│
├── data/
│   ├── partner-governance.json           # Seed + partner records
│   └── audit-logs/
│       └── partner-governance-2025-*.log # Daily audit logs
│
├── docs/
│   ├── PARTNER_GOVERNANCE_SYSTEM.md      # Full documentation
│   ├── PARTNER_SEED_SETUP.md             # This file
│   └── IMPLEMENTATION_GUIDE.md           # Complete system guide
│
└── server.js                             # API endpoints registered
```

---

## Deployment Checklist

- [ ] **Generate Partner Seed**
  ```bash
  npm run generate-partner-seed generate 0xdc20d621a88cb8908E8E7042431C55F0E9DAc6FB
  ```

- [ ] **Secure Storage**
  - [ ] Print 3 copies
  - [ ] Laminate
  - [ ] Store in vault
  - [ ] Create encrypted backup

- [ ] **Deploy Smart Contract**
  ```bash
  npx hardhat run scripts/deployment/deploy-partner-governance-token.js --network mainnet
  ```

- [ ] **Initialize Systems**
  - [ ] Audit logging configured
  - [ ] Intent declaration process live
  - [ ] API endpoints verified
  - [ ] Security monitoring active

- [ ] **Documentation**
  - [ ] Partner procedures documented
  - [ ] Governance voting rules confirmed
  - [ ] Covenant language finalized
  - [ ] Security protocols established

- [ ] **First Partner (Paul/Leviticus)**
  - [ ] Guest registration
  - [ ] Ceremony participation
  - [ ] Contribution + trust burning
  - [ ] Partnership approval
  - [ ] Seed distribution
  - [ ] Covenant signing

- [ ] **Governance Ready**
  - [ ] First partner votes on dummy proposal
  - [ ] Voting system verified
  - [ ] Audit trail confirmed
  - [ ] Process documentation complete

---

## Support & Questions

### For Genesis Human
- Seed generation and custody
- Partner approvals and revocations
- Security oversight
- Governance decisions

### For Partners
- Intent declarations
- Ceremony participation
- Covenant signing
- Governance participation

### For All Users
- Guest registration
- Bible wallet creation
- USDT donations
- Trust burning
- Progression tracking

---

## Security Reminders

🔐 **Golden Rules:**

1. **Never share the partner seed** except with approved partners
2. **Never log the seed** in plaintext - only log access
3. **Never hardcode the seed** - store securely
4. **Always verify identity** before distribution
5. **Always log distribution** for audit trail
6. **Always monitor access** for unauthorized attempts

---

## Next Steps

1. **TODAY: Generate Partner Seed**
   ```bash
   npm run generate-partner-seed generate 0xdc20d621a88cb8908E8E7042431C55F0E9DAc6FB
   ```

2. **TOMORROW: Secure Storage**
   - Print and store seed securely
   - Create backup copy

3. **THIS WEEK: Deploy Contract**
   ```bash
   npx hardhat run scripts/deployment/deploy-partner-governance-token.js --network mainnet
   ```

4. **WEEK 2: Paul Onboarding**
   - Register as guest
   - Achieve user status
   - Declare partnership intent
   - Receive approval

5. **WEEK 3: First Distribution**
   - Distribute seed to Paul
   - Paul signs covenant
   - First partner active
   - Governance ready

---

**Partner Governance System Ready to Deploy** ✅
