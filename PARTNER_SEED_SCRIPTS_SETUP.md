# Partner Seed Display Scripts - Setup Summary

## What Was Created

I've created a complete system for displaying, sharing, and managing the Partner Seed across your governance collective:

### New Scripts

1. **show-partner-seed.js** - Display the seed in multiple formats
   - Location: `scripts/governance/show-partner-seed.js`
   - Formats: plain, numbered, grid, etch, json, all
   - Authorization: Genesis, Agent, Partners only
   - Logging: All access attempts tracked

2. **import-partner-seed.js** - Restore seed from backup
   - Location: `scripts/governance/import-partner-seed.js`
   - Use when: Seed file lost or recovering from backup
   - Authorization: Genesis and Agent only
   - Validation: BIP39 mnemonic validation

3. **generate-partner-seed.js** (Enhanced)
   - Now loads and preserves actual seed from secure file
   - Added `loadSeedKey()` and `saveSeedKey()` methods
   - Stores actual seed in `data/.partner-seed.key` (permissions: 0600)
   - Maintains backward compatibility

### NPM Scripts Added

```json
{
  "show-partner-seed": "node scripts/governance/show-partner-seed.js",
  "show-seed-plain": "node scripts/governance/show-partner-seed.js $npm_config_wallet plain",
  "show-seed-numbered": "node scripts/governance/show-partner-seed.js $npm_config_wallet numbered",
  "show-seed-grid": "node scripts/governance/show-partner-seed.js $npm_config_wallet grid",
  "show-seed-etch": "node scripts/governance/show-partner-seed.js $npm_config_wallet etch",
  "show-seed-all": "node scripts/governance/show-partner-seed.js $npm_config_wallet all"
}
```

### Documentation

- **PARTNER_SEED_DISPLAY.md** - Comprehensive guide (etching, sharing, recovery)
- Covers all use cases, security practices, and troubleshooting

## Current Situation ⚠️

### Status
- ✅ Seed was generated on **2025-11-22T19:31:33.101Z**
- ✅ Seed generation metadata is stored
- ❌ Actual seed value was not backed up (shows as `[REDACTED]` in JSON)
- ❌ Secure key file doesn't exist yet (`data/.partner-seed.key`)

### What This Means

The seed was generated and only displayed once during generation. However, the actual 12-word phrase was not persisted to the secure key file, so it's currently lost.

**This is normal** - the system is designed to show the seed only at generation time, requiring careful manual backup.

## What You Need To Do

### Option 1: You Have the Original Seed ✅ (Preferred)

If you saved the 12-word seed when it was originally generated:

```bash
# Import the seed
node scripts/governance/import-partner-seed.js \
  0xdc20d621a88cb8908e8e7042431c55f0e9dac6fb \
  "word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12"
```

Replace `0xdc20d621...` with Genesis wallet, and insert your actual 12 words.

**After import**, you can immediately:
```bash
# View the seed in any format
node scripts/governance/show-partner-seed.js 0xdc20d621a88cb8908e8e7042431c55f0e9dac6fb etch

# Use npm shortcut
npm run show-seed-etch --wallet=0xdc20d621a88cb8908e8e7042431c55f0e9dac6fb
```

### Option 2: You Don't Have the Original Seed ⚠️

If the original seed was lost (not backed up during generation):

1. **Whoever generated the seed** may have a backup copy
   - Check email, notes, printed backups, vaults
   - They should have stored it securely

2. **Contact the seed generator**
   - Genesis Human: Whoever initiated the seed generation
   - Check git history for who generated it

3. **Once you have the 12 words**, use the import script above

## Usage Examples

### Display the Seed (After Import)

```bash
# Plain - Copy-pasteable format
node scripts/governance/show-partner-seed.js \
  0xdc20d621a88cb8908e8e7042431c55f0e9dac6fb plain

# Numbered - For verification
node scripts/governance/show-partner-seed.js \
  0xdc20d621a88cb8908e8e7042431c55f0e9dac6fb numbered

# Grid - For memorization
node scripts/governance/show-partner-seed.js \
  0xdc20d621a88cb8908e8e7042431c55f0e9dac6fb grid

# Etch - For physical metal etching
node scripts/governance/show-partner-seed.js \
  0xdc20d621a88cb8908e8e7042431c55f0e9dac6fb etch

# All - All formats combined
node scripts/governance/show-partner-seed.js \
  0xdc20d621a88cb8908e8e7042431c55f0e9dac6fb all
```

### For Partners to Refresh Memory

Once partners are added to the governance collective, they can view the seed anytime:

```bash
# Any authorized wallet can view
node scripts/governance/show-partner-seed.js <partner-wallet> <format>
```

All access is logged and auditable.

## Security Features

### Access Control
- ✅ Only Genesis, Agent, and authorized partners can view seed
- ✅ Unauthorized attempts are logged with timestamps
- ✅ All access events are recorded in security logs

### File Security
- ✅ Actual seed stored in `data/.partner-seed.key`
- ✅ Permissions set to 0600 (owner read/write only)
- ✅ JSON metadata always shows `[REDACTED]` to prevent accidents
- ✅ Daily audit logs in `data/audit-logs/`

### Data Integrity
- ✅ BIP39 validation for all seed imports
- ✅ Checksum calculation for verification
- ✅ Authorization checks before any operation
- ✅ Immutable generation metadata (can't be regenerated)

## Display Formats Explained

### Plain Format
```
word1
word2
word3
...
word12
```
**Use for**: Copy-paste, digital backup, basic reference

### Numbered Format
```
 1. word1
 2. word2
 3. word3
...
12. word12
```
**Use for**: Verification, printed checklists, ordered reference

### Grid Format
```
 1.word1      2.word2      3.word3      4.word4
 5.word5      6.word6      7.word7      8.word8
 9.word9     10.word10    11.word11    12.word12
```
**Use for**: Memorization, visual learning, quick recall

### Etch Format
```
╔═ PARTNER SEED ═══════════════════════════╗
║                                          ║
║   1. word1      ...                      ║
║   2. word2                               ║
║  ...                                     ║
║  12. word12                              ║
║                                          ║
║  ✓ Word Count: 12                        ║
║  ✓ Checksum: 123456                      ║
╚════════════════════════════════════════╝
```
**Use for**: Physical metal etching, archival storage, vault documentation

### JSON Format
```json
{
  "wordCount": 12,
  "words": ["word1", "word2", ...],
  "checksum": "123456",
  "format": "BIP39 mnemonic",
  "purpose": "Partner governance collective",
  "accessedAt": "2025-11-22T..."
}
```
**Use for**: Programmatic access, secure backups, integrations

## File Structure After Setup

```
convergence-protocol/
├── data/
│   ├── partner-governance.json      # Metadata (seed redacted)
│   ├── .partner-seed.key            # Actual seed (owner only, 0600)
│   └── audit-logs/
│       └── partner-governance-*.log
│
├── scripts/governance/
│   ├── generate-partner-seed.js     # Enhanced with key storage
│   ├── show-partner-seed.js         # NEW - Display formats
│   └── import-partner-seed.js       # NEW - Restore from backup
│
└── docs/
    ├── PARTNER_SEED_DISPLAY.md      # Comprehensive guide
    ├── PARTNER_GOVERNANCE_SYSTEM.md # Full architecture
    └── ...
```

## Testing

Before using with partners, you can test authorization:

```bash
# Test with Genesis wallet (should work after import)
node scripts/governance/show-partner-seed.js 0xdc20d621a88cb8908e8e7042431c55f0e9dac6fb plain

# Test with unauthorized wallet (should fail)
node scripts/governance/show-partner-seed.js 0x0000000000000000000000000000000000000000 plain
# Output: "Not authorized to access partner seed"
```

## Next Steps

1. **Find the original seed** if you have it
   - Check emails, printed documents, vaults
   - It's a 12-word BIP39 phrase
   - Generated on 2025-11-22

2. **Import the seed** using the import script
   ```bash
   node scripts/governance/import-partner-seed.js \
     0xdc20d621a88cb8908e8e7042431c55f0e9dac6fb \
     "your 12 word seed phrase here"
   ```

3. **Test display** in your preferred format
   ```bash
   node scripts/governance/show-partner-seed.js \
     0xdc20d621a88cb8908e8e7042431c55f0e9dac6fb etch
   ```

4. **Back up the seed** in multiple locations
   - Print on archival paper
   - Laminate copies
   - Store in secure locations
   - Etch onto metal for long-term storage

5. **Share with partners** once they're added to the collective
   - Display using etch format
   - Share securely (in-person preferred)
   - Partners acknowledge receipt via API
   - All events are logged

## Command Reference

```bash
# Display commands
node scripts/governance/show-partner-seed.js <wallet> plain
node scripts/governance/show-partner-seed.js <wallet> numbered
node scripts/governance/show-partner-seed.js <wallet> grid
node scripts/governance/show-partner-seed.js <wallet> etch
node scripts/governance/show-partner-seed.js <wallet> json
node scripts/governance/show-partner-seed.js <wallet> all

# Restore from backup
node scripts/governance/import-partner-seed.js <wallet> "<seed>"

# Management
node scripts/governance/generate-partner-seed.js status
node scripts/governance/generate-partner-seed.js security-log
node scripts/governance/generate-partner-seed.js intent-declarations

# Via NPM
npm run show-partner-seed <wallet> [format]
npm run show-seed-etch --wallet=<wallet>
npm run partner-status
npm run partner-security-log
```

## Support

- See **docs/PARTNER_SEED_DISPLAY.md** for detailed guide
- Check **docs/PARTNER_GOVERNANCE_SYSTEM.md** for architecture
- Review **security logs** for all access events

---

**Created**: 2025-11-22
**Scripts**: show-partner-seed.js, import-partner-seed.js
**Enhanced**: generate-partner-seed.js
**Status**: Ready to use after seed import
