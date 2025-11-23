# Exodus Hot Wallet Rotation - Integration Guide

Complete guide for rotating to a new Exodus hot wallet with secure seed management and key derivation across multiple blockchain networks.

## Overview

This system provides:
1. **BIP39/BIP44 Compliant Key Derivation** - Industry-standard hierarchical deterministic wallets
2. **Multi-Chain Support** - Bitcoin, Ethereum, Litecoin, Dogecoin, Bitcoin Cash
3. **Encrypted Storage** - AES-256 encryption with PBKDF2 key derivation
4. **Verification System** - Validate seed phrases and generated keys
5. **Secure Input** - Seed phrases never echo to terminal

## Files Created

```
scripts/
├── exodus-seed-manager.py         # Main application (16KB)
├── test-exodus-manager.py         # Test/validation suite (9KB)
├── setup-exodus-wallet.sh         # Setup automation
├── exodus-requirements.txt        # Python dependencies
├── EXODUS_SEED_MANAGER.md        # Full documentation
└── EXODUS_QUICK_REFERENCE.md     # Quick command reference

EXODUS_WALLET_INTEGRATION.md       # This file
```

## Installation

### Step 1: Install Python Dependencies

```bash
cd /home/convergence/convergence-protocol

# Option A: Using requirements file
pip install -r scripts/exodus-requirements.txt

# Option B: Manual installation
pip install mnemonic eth-keys cryptography bitcoinlib hdwallet
```

### Step 2: Verify Installation

```bash
python3 scripts/test-exodus-manager.py
```

Expected output:
```
✓ PASS: Seed Validation
✓ PASS: Encryption
✓ PASS: File Operations
✓ PASS: List Operations
✓ PASS: Address Export
✓ PASS: Seed Consistency

Total: 6/6 passed
✓ All tests passed! System is ready.
```

## Workflow: Hot Wallet Rotation

### Phase 1: Generate Seed in Exodus App

1. **Open Exodus Wallet** on your machine
2. **Create New Wallet**
3. **Generate Seed Phrase** (12 or 24 words)
4. **Write Down Seed** in secure location (physical note, not digital yet)

**⚠️ Security Note:** Never copy/paste seed into unsecured applications

### Phase 2: Import & Secure Seed

```bash
cd /home/convergence/convergence-protocol

python3 scripts/exodus-seed-manager.py --setup
```

The script will guide you through:

1. **Set Encryption Password**
   - Minimum 12 characters
   - Mix uppercase, lowercase, numbers, symbols
   - Example: `ExodusSeed@2024!Hot`

2. **Enter Seed Phrase**
   - Type or paste your 12/24-word seed
   - Input will NOT echo to screen
   - Press Enter when complete

3. **Select Number of Accounts**
   - How many derivation accounts per network
   - Usually `1` (standard)
   - Can increase for multiple address patterns later

4. **Label Your Keys**
   - Auto-generated: `exodus_20240115_120000`
   - Or custom: `exodus_hot_mainnet`, `exodus_rotation_2024`

5. **Review Files Created**
   ```
   wallets/exodus/
   ├── .salt                           # Keep secret
   ├── exodus_20240115_120000.encrypted    # Keep secret
   ├── exodus_20240115_120000.manifest     # Metadata only
   └── exodus_20240115_120000_summary.json # Public addresses
   ```

### Phase 3: Verify Address Derivation

```bash
# Export public addresses (safe to compare)
python3 scripts/exodus-seed-manager.py --export exodus_20240115_120000
```

This creates `exodus_20240115_120000_summary.json`:

```json
{
  "label": "exodus_20240115_120000",
  "created_at": "2024-01-15T12:00:00",
  "networks": {
    "ethereum": {
      "account_0": {
        "path": "m/44'/60'/0'/0/0",
        "public_key": "0x1234567890123456789012345678901234567890"
      }
    },
    "bitcoin": {
      "account_0": {
        "path": "m/44'/0'/0'/0/0",
        "public_key": "1A1z7agoatauQ8..."
      }
    }
    // ... other networks
  }
}
```

**Verification Steps:**
1. Open Exodus app and view wallet addresses for Bitcoin/Ethereum/etc
2. Compare with addresses in the exported JSON file
3. ✓ If they match → Key derivation is correct
4. ✗ If they don't match → Do NOT proceed, verify seed phrase

### Phase 4: Future Seed Verification

To verify a seed phrase matches your saved keys:

```bash
python3 scripts/exodus-seed-manager.py --verify exodus_20240115_120000
```

When prompted:
- Enter encryption password
- Enter seed phrase to verify
- Script outputs: ✓ "Seed phrase matches!" or ✗ "Seed phrase does NOT match!"

### Phase 5: Key Usage & Rotation

**For Hot Wallet Transactions:**
```python
# Programmatic access (if needed for automation)
from exodus_seed_manager import ExodusSeedManager

manager = ExodusSeedManager()
manager.load_encryption_key(password="your_password")
keys = manager.load_keys("exodus_20240115_120000")

# Access keys for a specific network
eth_account = keys['networks']['ethereum']['account_0']
bitcoin_account = keys['networks']['bitcoin']['account_0']
```

**For Key Rotation:**
1. Generate new seed in Exodus app
2. Repeat Phase 1-3 with new seed phrase
3. Old encrypted files remain (consider secure deletion)
4. Can verify both old and new seeds independently

## Security Architecture

### Encryption

```
Your Seed Phrase
    ↓ (BIP39)
Master Seed (512 bits)
    ↓ (BIP44 Derivation)
Network-Specific Keys
    ↓ (AES-256 Fernet)
Encrypted Storage
```

**Encryption Details:**
- **Algorithm:** Fernet (AES-128 CBC + HMAC)
- **Key Derivation:** PBKDF2-SHA256, 480,000 iterations
- **Salt:** Random 16-byte salt
- **Key Size:** 256 bits

### File Permissions

All sensitive files created with `0600` (readable/writable by owner only):
```bash
ls -la wallets/exodus/
# -rw------- exodus exodus .salt
# -rw------- exodus exodus *.encrypted
```

### What's Protected

| File | Content | Protection |
|------|---------|-----------|
| `.encrypted` | Private keys | AES-256 encryption |
| `.salt` | Encryption salt | File permissions `0600` |
| `.manifest` | Metadata only | File permissions `0600` |
| `_summary.json` | Public addresses | Can be shared openly |

## Key Derivation Paths

All networks derive from your single seed using BIP44 standard:

```
Seed → Master Key → Purpose(44) → Coin Type → Account → Change → Address
                        ↓              ↓
                        44             ↓
                      Bitcoin: 0       Ethereum: 60       Litecoin: 2
                      Dogecoin: 3      Bitcoin Cash: 145
```

**Example Paths:**
```
Bitcoin:      m/44'/0'/0'/0/0
Ethereum:     m/44'/60'/0'/0/0
Litecoin:     m/44'/2'/0'/0/0
Dogecoin:     m/44'/3'/0'/0/0
Bitcoin Cash: m/44'/145'/0'/0/0
```

All derive **identical public keys** across tools (Exodus, MyEtherWallet, etc) if using same seed.

## Recovery Scenarios

### Scenario 1: Lost Encryption Password

❌ **Not recoverable** - Private keys are encrypted
✓ **Recovery:** Restore seed phrase in Exodus, regenerate new encryption password

### Scenario 2: Lost Encrypted Files

✓ **Recoverable** - Seed phrase can regenerate all keys
- Keep seed phrase safe
- Can generate new encryption passwords
- Run `--setup` again to create new encrypted files

### Scenario 3: Verify Seed After Time

```bash
python3 scripts/exodus-seed-manager.py --verify exodus_20240115_120000
```

Confirms your current seed phrase matches the saved keys without exposing keys.

## Advanced Usage

### Multiple Accounts Per Network

```bash
python3 scripts/exodus-seed-manager.py --setup

# When prompted for accounts, enter: 5

# Results in:
# bitcoin.account_0 → m/44'/0'/0'/0/0
# bitcoin.account_1 → m/44'/0'/0'/1/0
# bitcoin.account_2 → m/44'/0'/0'/2/0
# ... etc
```

### Custom Storage Location

```bash
python3 scripts/exodus-seed-manager.py --setup --storage /secure/external/drive
```

### Batch Verification

```bash
python3 scripts/exodus-seed-manager.py --list

# Shows all saved key sets:
# Label: exodus_20240115_120000
# Created: 2024-01-15T12:00:00
# Networks: ethereum, bitcoin, litecoin, dogecoin, bch
```

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| "Invalid seed phrase" | Wrong word count or spelling | Use clipboard to paste, verify 12 or 24 words |
| "ModuleNotFoundError" | Dependencies not installed | `pip install -r scripts/exodus-requirements.txt` |
| "Encryption key not set" | Haven't run `--setup` yet | Run `--setup` first to create encryption |
| Keys don't match Exodus | Different seed or derivation path | Verify seed phrase in input, check BIP44 path |
| Can't decrypt old files | Wrong password | Use correct encryption password from setup |

## Compliance & Standards

This implementation follows:
- **BIP32** - Hierarchical Deterministic Wallets
- **BIP39** - Mnemonic Code for Generating Deterministic Keys
- **BIP44** - Multi-Account Hierarchy for Deterministic Wallets
- **NIST SP 800-132** - PBKDF2 key derivation (480K iterations)
- **FIPS 197** - AES encryption

Compatible with:
- Exodus Wallet
- MetaMask (Ethereum)
- Electrum (Bitcoin)
- MyEtherWallet
- Ledger/Trezor hardware wallets (same seed compatibility)

## Best Practices

### Setup
- [ ] Use strong encryption password (12+ chars, mixed case/numbers/symbols)
- [ ] Store password in password manager (1Password, Bitwarden, etc)
- [ ] Verify addresses match Exodus app before using
- [ ] Keep seed phrase written down, not digital

### Ongoing
- [ ] Keep `wallets/exodus/` directory backed up
- [ ] Don't share encrypted files without encryption
- [ ] Re-verify seed phrase periodically
- [ ] Use `--export` for address verification, not key export

### Rotation
- [ ] Generate new seed in Exodus app
- [ ] Run `--setup` with new seed
- [ ] Verify new addresses match new wallet
- [ ] Keep old encrypted files until confident in new setup
- [ ] Document rotation date and reason

## References

- Full Documentation: `scripts/EXODUS_SEED_MANAGER.md`
- Quick Reference: `scripts/EXODUS_QUICK_REFERENCE.md`
- [BIP32 Specification](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki)
- [BIP39 Specification](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki)
- [BIP44 Specification](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki)
- [Exodus Documentation](https://exodus.com/articles/)

## Support

For issues or questions:
1. Check `EXODUS_QUICK_REFERENCE.md` for common commands
2. Run tests: `python3 scripts/test-exodus-manager.py`
3. Review full docs: `scripts/EXODUS_SEED_MANAGER.md`
4. Check script inline comments: `scripts/exodus-seed-manager.py`

## Summary

You now have a complete, secure system for:
- ✓ Deriving private keys from Exodus seed across multiple networks
- ✓ Encrypting keys with strong password-based encryption
- ✓ Verifying seed phrases match saved keys
- ✓ Exporting public addresses without exposing keys
- ✓ Managing multiple wallet rotations independently

**Next Steps:**
1. Install dependencies: `pip install -r scripts/exodus-requirements.txt`
2. Run tests: `python3 scripts/test-exodus-manager.py`
3. Generate seed in Exodus app
4. Run setup: `python3 scripts/exodus-seed-manager.py --setup`
5. Verify addresses match: Check `_summary.json` against Exodus app
6. Use encrypted keys for transactions/integration
