# Exodus Seed Wallet Manager

Secure key derivation, verification, and encrypted storage for Exodus seed phrases across multiple blockchain networks.

## Features

- **BIP39/BIP44 Compliant**: Derives keys using industry-standard hierarchical deterministic wallet standards
- **Multi-Network Support**: Bitcoin, Ethereum, Litecoin, Dogecoin, Bitcoin Cash
- **Encrypted Storage**: AES-256 encryption with PBKDF2 key derivation
- **Seed Verification**: Verify that a seed phrase matches saved keys
- **Public Key Export**: Export addresses without exposing private keys
- **Secure Input**: Uses `getpass` to prevent seed phrase echo in terminal

## Installation

```bash
# Install dependencies
pip install -r exodus-requirements.txt

# Make script executable
chmod +x scripts/exodus-seed-manager.py
```

## Quick Start

### 1. Initial Setup (Interactive)

```bash
python scripts/exodus-seed-manager.py --setup
```

This will guide you through:
1. Setting up an encryption password (min 12 characters)
2. Entering your Exodus seed phrase (12 or 24 words)
3. Selecting number of accounts to derive
4. Saving encrypted keys
5. Exporting a public address summary

### 2. List Saved Keys

```bash
python scripts/exodus-seed-manager.py --list
```

Shows all saved key sets with metadata (creation date, networks, accounts).

### 3. Export Public Addresses (No Private Keys)

```bash
python scripts/exodus-seed-manager.py --export <label>
```

Creates a JSON file with only public keys/addresses for verification purposes.

### 4. Verify Seed Phrase

```bash
python scripts/exodus-seed-manager.py --verify <label>
```

Verify that a given seed phrase matches the saved keys.

## Security Details

### Encryption
- **Algorithm**: Fernet (AES-128 in CBC mode with HMAC)
- **Key Derivation**: PBKDF2-SHA256 with 480,000 iterations
- **Salt**: Random 16-byte salt stored separately

### File Permissions
- All encrypted files and salts set to `0600` (readable/writable by owner only)
- Stored in `./wallets/exodus/` by default

### Sensitive Data Handling
- Seed phrases are never logged or echoed to stdout
- Private keys exist only in encrypted files
- HMAC prevents tampering with encrypted data

## File Structure

```
wallets/exodus/
├── .salt                          # Encryption salt (secret)
├── exodus_20240115_120000.encrypted  # Encrypted keys (secret)
├── exodus_20240115_120000.manifest   # Metadata only (can be shared)
└── exodus_20240115_120000_summary.json # Public keys only (can be shared)
```

### .manifest File (Safe to Share)
Contains only:
- Label and creation timestamp
- Which networks are included
- Number of accounts per network
- **Does NOT contain any keys**

### _summary.json File (Safe to Share)
Contains only:
- Public keys/addresses
- Derivation paths
- **Does NOT contain any private keys**

## Supported Networks

| Network | BIP44 Path | Use Case |
|---------|-----------|----------|
| Bitcoin | m/44'/0'/0'/0 | Bitcoin transactions |
| Ethereum | m/44'/60'/0'/0 | Ethereum/EVM chains |
| Litecoin | m/44'/2'/0'/0 | Litecoin transactions |
| Dogecoin | m/44'/3'/0'/0 | Dogecoin transactions |
| BCH | m/44'/145'/0'/0 | Bitcoin Cash transactions |

## Key Derivation Process

The script implements **BIP44 Hierarchical Deterministic Wallets**:

```
Seed Phrase (12/24 words)
    ↓
Master Seed (via BIP39)
    ↓
Master Private Key
    ↓
BIP44 Path (m/44'/coin_type'/account'/change/index)
    ↓
Private Keys (per network & account)
    ↓
Public Keys/Addresses
```

Each network and account gets unique keys derived from the same seed.

## Example Workflow

### Step 1: Generate Seed in Exodus App
1. Open Exodus Wallet
2. Create new wallet → Generate Seed
3. Write down 12-word or 24-word seed phrase

### Step 2: Import into Manager
```bash
python scripts/exodus-seed-manager.py --setup

# When prompted, paste your seed phrase
# Set encryption password (will be needed later)
# Choose number of accounts (usually 1-5)
```

### Step 3: Verify Keys
```bash
# Export public addresses
python scripts/exodus-seed-manager.py --export exodus_20240115_120000

# Open the _summary.json file to verify addresses match Exodus wallet
```

### Step 4: Verify Later
```bash
# If you need to confirm a seed phrase matches
python scripts/exodus-seed-manager.py --verify exodus_20240115_120000
```

## Important Security Notes

⚠️ **Seed Phrase Safety:**
- Never share your seed phrase
- Never paste it in public/shared systems
- This script uses `getpass` to hide input - but system might log it
- Run this on a clean, trusted machine

⚠️ **Encryption Password:**
- Use a strong password (min 12 characters, mix of upper/lower/numbers/symbols)
- Store the password in a password manager
- Without the password, encrypted keys cannot be recovered

⚠️ **Backup Strategy:**
1. Keep encrypted files safe (encrypted anyway)
2. Keep encryption password in secure password manager
3. Optionally: Keep one copy of .manifest file off-device for reference

⚠️ **Private Key Exposure:**
- Private keys should never be in unencrypted form
- Never export or print private keys
- Only use export functionality for addresses

## Troubleshooting

### "Invalid seed phrase"
- Ensure exactly 12 or 24 words
- Check spelling (use clipboard to paste)
- Verify seed is from Exodus (BIP39 compatible)

### "Encryption key not set"
- Run `--setup` first
- Or use `--export`/`--verify` with correct password

### "File not found"
- Use `--list` to see available key labels
- Ensure you're using the correct label

### Module Not Found Errors
```bash
pip install --upgrade -r scripts/exodus-requirements.txt
```

## Advanced Usage

### Custom Storage Location
```bash
python scripts/exodus-seed-manager.py --setup --storage /secure/path/wallets
```

### Programmatic Use

```python
from exodus_seed_manager import ExodusSeedManager

# Create manager
manager = ExodusSeedManager(storage_path="./wallets/exodus")

# Setup encryption
manager.setup_encryption(password="your_secure_password")

# Derive keys from seed
keys = manager.derive_keys_from_seed(seed_phrase, num_accounts=1)

# Save encrypted
manager.save_keys(keys, label="my_wallet")

# Later: Load and decrypt
manager.load_encryption_key(password="your_secure_password")
keys = manager.load_keys("my_wallet")
```

## Technical Details

### BIP32 Derivation
- Uses industry-standard hierarchical deterministic key generation
- Same seed produces identical keys every time
- Supports "hardened" derivation for security

### PBKDF2 Configuration
- **Algorithm**: SHA256
- **Iterations**: 480,000 (NIST recommended for 2024)
- **Key Length**: 32 bytes (256 bits)
- **Salt**: 16 random bytes

### Supported Platforms
- Linux/Unix
- macOS
- Windows

## References

- [BIP32 - Hierarchical Deterministic Wallets](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki)
- [BIP39 - Mnemonic Code for Generating Deterministic Keys](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki)
- [BIP44 - Multi-Account Hierarchy for Deterministic Wallets](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki)
- [Exodus Wallet Documentation](https://exodus.com/articles/)
