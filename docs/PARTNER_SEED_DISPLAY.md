# Partner Seed Display & Management Guide

This guide explains how to display, etch, and manage the 12-word Partner Seed for the Convergence Protocol governance collective.

## Overview

The Partner Seed is:
- **12 words** in BIP39 format
- **Shared collectively** among all partners (not individual keys)
- **For covenant commitment** and governance decisions
- **Secured** with restrictive file permissions and logging

## Quick Start

### Display the Seed

```bash
# Plain format (default)
node scripts/governance/show-partner-seed.js <your-wallet>

# Or via npm
npm run show-partner-seed <your-wallet>
```

### Display Formats

```bash
# Plain - Simple words, one per line
node scripts/governance/show-partner-seed.js <wallet> plain

# Numbered - Words with 1-12 numbering
node scripts/governance/show-partner-seed.js <wallet> numbered

# Grid - 4 columns × 3 rows (memorization)
node scripts/governance/show-partner-seed.js <wallet> grid

# Etch - Large format for physical etching
node scripts/governance/show-partner-seed.js <wallet> etch

# JSON - Structured data format
node scripts/governance/show-partner-seed.js <wallet> json

# All - Display all formats together
node scripts/governance/show-partner-seed.js <wallet> all
```

### NPM Shortcuts

```bash
# Using npm config to pass wallet
npm run show-seed-plain --wallet=0xdc20d621a88cb8908e8e7042431c55f0e9dac6fb
npm run show-seed-numbered --wallet=0xdc20d621a88cb8908e8e7042431c55f0e9dac6fb
npm run show-seed-grid --wallet=0xdc20d621a88cb8908e8e7042431c55f0e9dac6fb
npm run show-seed-etch --wallet=0xdc20d621a88cb8908e8e7042431c55f0e9dac6fb
npm run show-seed-all --wallet=0xdc20d621a88cb8908e8e7042431c55f0e9dac6fb
```

## Authorization

Only these wallets can view the partner seed:

1. **Genesis Human**: `0xdc20d621a88cb8908e8e7042431c55f0e9dac6fb`
2. **Agent Wallet**: `0x6628227c195dad7f7a8fd4f3d2ca3545a0d9cd22`
3. **Authorized Partners**: Any wallet added via `addPartner()`

Unauthorized access attempts are:
- **Blocked** immediately
- **Logged** with timestamp and wallet address
- **Auditable** via security logs

## File Structure

```
data/
├── partner-governance.json       # Governance metadata (seed redacted for security)
├── .partner-seed.key            # Actual seed (permissions: 0600, owner only)
└── audit-logs/
    └── partner-governance-*.log  # Timestamped access logs
```

### Security

- **Actual seed**: Stored in `.partner-seed.key` with permissions `0600` (owner read/write only)
- **JSON metadata**: Shows `[REDACTED]` to prevent accidental exposure
- **All access**: Logged with timestamp and requesting wallet
- **File permissions**: Automatically set to restrictive mode

## Seed Recovery

If the seed key file is lost or corrupted:

### Option 1: Restore from Backup

If you backed up the 12-word seed phrase:

```bash
node scripts/governance/import-partner-seed.js <wallet> "<word1 word2 ... word12>"
```

Example:

```bash
node scripts/governance/import-partner-seed.js 0xdc20d621a88cb8908e8e7042431c55f0e9dac6fb \
  "abandon ability able about above absent absorb abstract abuse access account across"
```

### Option 2: Contact Genesis Human

If the seed was lost and you don't have a backup:
1. Contact the Genesis Human wallet holder who originally generated the seed
2. They may have a backup copy
3. They can restore it using the import script

## Etching Instructions

### Using the Etch Format

1. **Display the seed**:
   ```bash
   node scripts/governance/show-partner-seed.js <wallet> etch
   ```

2. **Print on archival paper** or display on secure screen

3. **Choose etching method**:
   - **Metal stamp kit**: Purchase a professional stamp set, manually stamp each word
   - **Professional engraving**: Send to engraving service with printed copy
   - **Thermal etching pen**: Use special pen designed for metal
   - **Acid etching**: Professional chemical etching (not recommended for solo use)

4. **Verify with checksum**:
   - The etch format includes a 6-digit checksum
   - Use this to verify all 12 words are correct
   - Recalculate if any word changes

5. **Storage**:
   - Store metal plate/card in vault or fireproof safe
   - Keep laminated paper copy in secondary location
   - Different locations prevent single-point failure

## Memorization Strategy

### Using the Grid Format

1. **Display grid**:
   ```bash
   node scripts/governance/show-partner-seed.js <wallet> grid
   ```

2. **Memorization groups**:
   - **Top group** (words 1-4): First line of grid
   - **Middle group** (words 5-8): Second line of grid
   - **Bottom group** (words 9-12): Third line of grid

3. **Practice method**:
   - Memorize one group per day
   - Review previous groups daily
   - After 3 days, can recall full sequence
   - Practice weekly to maintain memory

4. **Verification**:
   - Use numbered format to verify order
   - Spot-check random words
   - Recite full seed monthly

## Sharing with Partners

### For New Partners

When a partner is added to the governance collective:

1. **Add via script**:
   ```bash
   node scripts/governance/generate-partner-seed.js add <wallet> <alias> <bibleWallet>
   ```

2. **Distribution**:
   - Genesis Human displays seed using etch format
   - Share seed via secure channel (in-person preferred)
   - Partner acknowledges receipt via API

3. **Acknowledgment**:
   ```bash
   node scripts/governance/generate-partner-seed.js acknowledge <wallet> "<intention>"
   ```

4. **Partner can now**:
   - View seed anytime using show-partner-seed.js
   - Vote on governance proposals
   - Participate in covenant decisions

### For Partner Memory Refresh

Partners can refresh their memory anytime:

```bash
# View in plain format
node scripts/governance/show-partner-seed.js <partner-wallet> plain

# View in numbered format for verification
node scripts/governance/show-partner-seed.js <partner-wallet> numbered

# View in grid for memorization review
node scripts/governance/show-partner-seed.js <partner-wallet> grid
```

## Security Logs

### View all access events

```bash
node scripts/governance/generate-partner-seed.js security-log

# Filter by severity
node scripts/governance/generate-partner-seed.js security-log CRITICAL
node scripts/governance/generate-partner-seed.js security-log HIGH
```

### Events logged

- `SEED_GENERATED`: Initial 12-word creation
- `PARTNER_SEED_ACCESSED`: Authorized access to seed
- `UNAUTHORIZED_SEED_ACCESS_ATTEMPT`: Blocked unauthorized access
- `SEED_DISTRIBUTED_TO_PARTNER`: Seed shared with new partner
- `PARTNER_SEED_ACKNOWLEDGED`: Partner confirmed receipt
- `PARTNER_SEED_IMPORTED`: Seed restored from backup

## Best Practices

### ✅ DO:

- Print seed on **archival paper** (lasts 100+ years)
- Store copies in **physically separate locations**
- Use **fireproof safes** or vault access
- **Memorize key words** for emergency situations
- **Laminate** paper copies for protection
- **Log all access** - security is maintained through transparency
- **Rotate key holders** every 2-3 years
- **Test recovery** procedures annually

### ❌ DON'T:

- Store digitally without encryption
- Share via email or insecure messaging
- Write on regular paper (fades/deteriorates)
- Keep all copies in one location
- Screenshot or digital photo on connected device
- Use seed for anything other than covenant commitment
- Share seed with non-partners

## Troubleshooting

### "Not authorized to access partner seed"

**Cause**: Your wallet is not Genesis, Agent, or an authorized partner

**Solution**:
1. Verify wallet address is correct
2. If you should be a partner, contact Genesis Human
3. Once added, try again

### "Seed file not initialized"

**Cause**: Seed key file doesn't exist or contains `[REDACTED]`

**Solution**:
1. If you have the 12-word seed:
   ```bash
   node scripts/governance/import-partner-seed.js <wallet> "<seed phrase>"
   ```
2. If you don't have it, contact Genesis Human

### "Invalid seed phrase"

**Cause**: Seed is not valid BIP39 mnemonic

**Solution**:
1. Verify all 12 words are correct
2. Check spelling carefully (spaces matter)
3. Ensure words are separated by spaces
4. Use the numbered format to verify order

### "Checksum mismatch"

**Cause**: One or more words might be incorrect

**Solution**:
1. Re-verify each word against original
2. Check word numbering matches
3. Use the print/etch format to compare
4. Consult Genesis Human if stuck

## Recovery Procedures

### If Seed is Lost

**Timeline**: Do this immediately!

1. **Day 1**: Contact Genesis Human
2. **Day 2**: Genesis retrieves backup copy
3. **Day 3**: Genesis restores seed via import script
4. **Day 4**: All partners can access seed again

**Avoid**: Allowing extended period where seed is inaccessible

### If Seed is Compromised

**Timeline**: Do this immediately!

1. **Hour 1**: Notify all partners immediately
2. **Hour 2**: Log incident with details
3. **Hour 4**: Assess impact (was seed shared insecurely?)
4. **Day 1**: Determine if regeneration needed

**Regeneration Note**: Currently can only generate once. Contact developers if regeneration is needed.

## Commands Reference

```bash
# Show/Format scripts
node scripts/governance/show-partner-seed.js <wallet> [format]
node scripts/governance/import-partner-seed.js <wallet> "<seed>"

# Management scripts
node scripts/governance/generate-partner-seed.js generate <wallet>  # One-time
node scripts/governance/generate-partner-seed.js status            # View stats
node scripts/governance/generate-partner-seed.js security-log      # View logs
node scripts/governance/generate-partner-seed.js intent-declarations # View declarations

# NPM shortcuts
npm run show-partner-seed <wallet> [format]
npm run generate-partner-seed
npm run partner-status
npm run partner-security-log
npm run partner-declarations
```

## FAQ

**Q: Can I regenerate the seed?**
A: No. Once generated, it cannot be regenerated. Backup carefully!

**Q: What if I lose the seed AND the backup?**
A: You'll need Genesis Human to provide a copy they kept. Always keep multiple backups!

**Q: Can partners create their own copies?**
A: Yes! Once they have the seed, they can etch or memorize their own copy.

**Q: How long should I keep the seed?**
A: Forever. It's for long-term covenant commitment.

**Q: Can I change the seed?**
A: Only if the collective decides to regenerate it. This requires all partners' agreement and the code must be modified to allow regeneration.

**Q: Is the seed the same for all partners?**
A: Yes! It's a shared collective identifier, not individual keys.

---

**Last Updated**: 2025-11-22
**Seed Generated**: 2025-11-22
**Partners**: 0/65
