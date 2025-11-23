# Partner Seed - Quick Reference Card

## Immediate Actions

### If You Have the Original 12-Word Seed:

```bash
# Import it (one-time)
node scripts/governance/import-partner-seed.js \
  0xdc20d621a88cb8908e8e7042431c55f0e9dac6fb \
  "abandon ability able about above absent absorb abstract abuse access account across"
```

### After Import - View the Seed:

```bash
# Etch format (for metal etching)
node scripts/governance/show-partner-seed.js 0xdc20d621a88cb8908e8e7042431c55f0e9dac6fb etch

# Numbered format (for verification)
node scripts/governance/show-partner-seed.js 0xdc20d621a88cb8908e8e7042431c55f0e9dac6fb numbered

# Grid format (for memorization)
node scripts/governance/show-partner-seed.js 0xdc20d621a88cb8908e8e7042431c55f0e9dac6fb grid

# JSON format (for digital backup)
node scripts/governance/show-partner-seed.js 0xdc20d621a88cb8908e8e7042431c55f0e9dac6fb json
```

## Format Comparison

| Format | Use Case | Example |
|--------|----------|---------|
| **plain** | Simple reference | `word1\nword2\n...` |
| **numbered** | Ordered list | `1. word1\n2. word2\n...` |
| **grid** | Memorization | 4 columns × 3 rows |
| **etch** | Metal etching | Large box with checksum |
| **json** | Data export | Structured JSON |
| **all** | See everything | All formats combined |

## For Partners

### To View the Seed (after being added)

```bash
node scripts/governance/show-partner-seed.js <your-wallet> <format>
```

### To Memorize It

1. Display grid format
2. Group words in sets of 4
3. Practice daily for 3 days
4. Verify with numbered format

### To Etch It

1. Display etch format
2. Print on archival paper
3. Use metal stamp kit or engraving service
4. Verify checksum before storage
5. Store in vault + secondary location

## Files Created

```
scripts/governance/
  ├── show-partner-seed.js     ← Display in multiple formats
  └── import-partner-seed.js   ← Restore from backup

docs/
  └── PARTNER_SEED_DISPLAY.md  ← Full guide

data/
  ├── .partner-seed.key        ← Actual seed (after import)
  └── audit-logs/              ← Access logs
```

## Security

- ✅ Only Genesis, Agent, and Partners can access
- ✅ All access is logged with timestamp
- ✅ Unauthorized attempts are blocked
- ✅ Seed file has permissions 0600 (owner only)
- ✅ JSON always shows `[REDACTED]` for safety

## Status Check

```bash
# View partnership status
npm run partner-status

# View all access events
npm run partner-security-log

# View security log (critical events only)
npm run partner-security-log CRITICAL
```

## Emergency Recovery

**If the seed key file is lost:**

1. Locate your backup copy of the 12 words
2. Run import command above
3. All partners can access again

**If you don't have a backup:**

1. Contact Genesis Human
2. They should have a copy
3. They can provide the 12 words
4. Use import command to restore

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Not authorized" | You must be Genesis, Agent, or a partner |
| "Seed file not initialized" | Import the seed using import-partner-seed.js |
| "Invalid seed phrase" | Check all 12 words are correct and separated by spaces |
| "Checksum mismatch" | One word might be wrong - verify carefully |

## Recommended Storage

1. **Primary** - Laminated print in fireproof safe
2. **Secondary** - Metal etch in bank vault
3. **Memory** - Memorize key 3-4 words for emergency
4. **Backup** - Digital copy (encrypted) in cloud backup

## Key Wallets

```
Genesis Human:  0xdc20d621a88cb8908e8e7042431c55f0e9dac6fb
Agent:          0x6628227c195dad7f7a8fd4f3d2ca3545a0d9cd22
Partners:       (Added individually)
```

## One-Minute Setup

```bash
# 1. Import seed (replace with your 12 words)
node scripts/governance/import-partner-seed.js \
  0xdc20d621a88cb8908e8e7042431c55f0e9dac6fb \
  "word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12"

# 2. View in etch format
node scripts/governance/show-partner-seed.js \
  0xdc20d621a88cb8908e8e7042431c55f0e9dac6fb etch

# 3. Print and etch onto metal
# Done! Now partners can view anytime using their wallet
```

## Long-Term

- **Weekly** - Verify you can still access
- **Monthly** - Test memorization
- **Quarterly** - Review backup locations
- **Annually** - Confirm all 12 words still correct
- **Every 2 years** - Rotate key holders if possible

---

**See full documentation**: `docs/PARTNER_SEED_DISPLAY.md`
**Setup guide**: `PARTNER_SEED_SCRIPTS_SETUP.md`
