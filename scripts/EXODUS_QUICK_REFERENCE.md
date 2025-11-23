# Exodus Seed Manager - Quick Reference

## Installation & Setup

### 1. Install Dependencies
```bash
pip install mnemonic eth-keys cryptography bitcoinlib hdwallet
```

Or use requirements file:
```bash
pip install -r scripts/exodus-requirements.txt
```

### 2. Run Interactive Setup
```bash
python3 scripts/exodus-seed-manager.py --setup
```

When prompted:
1. **Encryption Password** - Create a strong password (12+ chars, mix cases/numbers/symbols)
2. **Seed Phrase** - Paste your 12 or 24-word seed from Exodus (will not echo)
3. **Number of Accounts** - How many derivation accounts (usually 1)
4. **Label** - Name for this key set (auto-generated if left blank)

## Common Commands

### List all saved keys
```bash
python3 scripts/exodus-seed-manager.py --list
```

### Export public addresses (safe to share)
```bash
python3 scripts/exodus-seed-manager.py --export <label>
```
Creates `<label>_summary.json` with addresses only.

### Verify a seed phrase
```bash
python3 scripts/exodus-seed-manager.py --verify <label>
```
Confirms your seed matches the saved keys.

### Use custom storage location
```bash
python3 scripts/exodus-seed-manager.py --setup --storage /path/to/storage
```

## What Gets Saved

### Encrypted Files (Secret - Keep Safe!)
- `<label>.encrypted` - Your private keys (AES-256 encrypted)
- `.salt` - Encryption salt (needed to decrypt)

### Safe to Share
- `<label>.manifest` - Metadata only (no keys)
- `<label>_summary.json` - Public addresses only (no keys)

## Security Checklist

- [ ] Created strong encryption password (12+ chars)
- [ ] Seed phrase never pasted in public/unsecured terminals
- [ ] Encrypted files stored securely
- [ ] Encryption password saved in password manager
- [ ] Made backup of password (not seed!)
- [ ] Verified addresses match Exodus wallet

## Seed Verification Workflow

1. **Generate Seed in Exodus**
   - New Wallet → Generate → Save 12 or 24 words

2. **Import into Manager**
   ```bash
   python3 scripts/exodus-seed-manager.py --setup
   ```

3. **Verify Addresses Match**
   ```bash
   python3 scripts/exodus-seed-manager.py --export <label>
   ```
   - Open the generated `_summary.json`
   - Compare addresses with Exodus wallet display
   - If they match ✓, keys are correctly derived

4. **Future Verification**
   ```bash
   python3 scripts/exodus-seed-manager.py --verify <label>
   ```
   - Enter the seed phrase again
   - Script confirms it matches saved keys

## Supported Networks

Each derives its own key from the seed:
- Bitcoin
- Ethereum
- Litecoin
- Dogecoin
- Bitcoin Cash

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Invalid seed phrase" | Check 12 or 24 words, verify spelling, use clipboard |
| "ModuleNotFoundError" | Run `pip install -r scripts/exodus-requirements.txt` |
| "Encryption key not set" | Run setup with `--setup` first |
| Lost encryption password | No recovery - keys are unrecoverable without password |

## Security Notes

⚠️ **Never:**
- Share seed phrase
- Export or print private keys
- Run on shared/public computers
- Store password in same file as keys

✓ **Do:**
- Use strong encryption password
- Keep password in password manager
- Store encrypted files safely
- Verify exported addresses match wallet

## Python API Usage

```python
from exodus_seed_manager import ExodusSeedManager

# Initialize
mgr = ExodusSeedManager()

# Setup encryption
mgr.setup_encryption(password="your_password")

# Derive keys
keys = mgr.derive_keys_from_seed("seed phrase here", num_accounts=1)

# Save encrypted
mgr.save_keys(keys, label="my_wallet")

# Later: Load keys
mgr.load_encryption_key(password="your_password")
recovered_keys = mgr.load_keys("my_wallet")

# Verify seed
if mgr.verify_seed_consistency("seed phrase", recovered_keys):
    print("Seed matches!")
```

## File Locations

Default storage:
```
./wallets/exodus/
├── .salt
├── exodus_YYYYMMDD_HHMMSS.encrypted
├── exodus_YYYYMMDD_HHMMSS.manifest
└── exodus_YYYYMMDD_HHMMSS_summary.json
```

Custom location:
```bash
python3 scripts/exodus-seed-manager.py --setup --storage /path/to/wallets
```

## Key Derivation Paths

Standard BIP44 paths used:

| Network | Path |
|---------|------|
| Bitcoin | `m/44'/0'/0'/0/0` |
| Ethereum | `m/44'/60'/0'/0/0` |
| Litecoin | `m/44'/2'/0'/0/0` |
| Dogecoin | `m/44'/3'/0'/0/0` |
| BCH | `m/44'/145'/0'/0/0` |

All derive from the same seed phrase, so you get consistent keys across networks.

## Support & Documentation

- Full guide: `scripts/EXODUS_SEED_MANAGER.md`
- Python source: `scripts/exodus-seed-manager.py`
- Requirements: `scripts/exodus-requirements.txt`
