# Exodus Seed Wallet Manager - Enhanced Features

## Overview
The enhanced Exodus Seed Wallet Manager now includes a **menu-driven interface** with easy access to all functions, plus powerful **key rotation** capabilities for managing active derivations of managed keys.

## Quick Start

### Run the Menu Interface (Recommended)
```bash
python3 exodus-seed-manager.py --menu
# Or simply:
python3 exodus-seed-manager.py
```

### Legacy Command-Line Mode
```bash
python3 exodus-seed-manager.py --setup          # Initial setup
python3 exodus-seed-manager.py --list           # List all keys
python3 exodus-seed-manager.py --export LABEL   # Export public keys
python3 exodus-seed-manager.py --verify LABEL   # Verify seed phrase
```

---

## Menu-Driven Interface

The menu provides easy access to all functions with clear prompts:

### Main Menu Options

```
[1]  Initial Setup (Configure encryption & import/generate seed)
[2]  List All Saved Key Sets
[3]  View Active Keys
[4]  Export Public Keys Summary (Safe to share)
[5]  Export Private Key (Use with caution!)
[6]  Verify Seed Phrase
[7]  Rotate Key Set (Create new rotation)
[8]  View Rotation History
[9]  Activate/Deactivate Key Set
[0]  Exit
```

### Option 1: Initial Setup
- Configure encryption with a secure password
- Import an existing seed phrase or generate a new one
- Derive keys for multiple networks (Bitcoin, Ethereum, Litecoin, Dogecoin, BCH)
- Specify number of accounts per network
- Secure encrypted storage with checksums

### Option 2: List All Saved Key Sets
- View all stored key sets with status indicators
- See creation dates, networks, and account counts
- Shows ACTIVE/INACTIVE status for each key set

### Option 3: View Active Keys
- See only currently active key sets
- Useful for quick access to production keys
- Filter out rotated/archived keys

### Option 4: Export Public Keys Summary
- Export only public keys/addresses (no private keys exposed)
- Safe to share with team members
- Perfect for verification and auditing

### Option 5: Export Private Key
- Export individual private key for a specific network and account
- Includes multiple security warnings
- Confirmation prompts to prevent accidental exposure

### Option 6: Verify Seed Phrase
- Verify that a seed phrase matches saved keys
- Ensures you have the correct seed for recovery
- Cryptographic hash verification

### Option 7: Rotate Key Set ⭐ NEW
- Rotate to a new key set derived from the same seed
- Old key set automatically marked INACTIVE
- New key set automatically marked ACTIVE
- Rotation reason is recorded for auditing
- Perfect for security compliance and key rotation policies

**Usage:**
```
Select key set to rotate
Enter rotation reason (e.g., "Quarterly security rotation", "Compliance requirement")
New rotated key set is created and activated
```

### Option 8: View Rotation History
- View complete rotation history for any key set
- See timestamps, rotation targets, and reasons
- Track compliance with key rotation policies
- Useful for audit trails

**History includes:**
- When rotations occurred
- Which new key set was created
- Reason for rotation
- Complete chain of rotations

### Option 9: Activate/Deactivate Key Set
- Toggle key set active/inactive status
- Manage which keys are currently in use
- Deactivate keys without deleting them
- Reactivate archived keys if needed

---

## New Features: Key Rotation

### Key State Management
Each key set now has an associated state file (`.state`) that tracks:

```json
{
  "label": "exodus_20251123_002502",
  "active": true,
  "activated_at": "2025-11-23T00:25:02.123456+00:00",
  "rotated_from": "exodus_20251120_120000",
  "rotation_history": [
    {
      "rotated_at": "2025-11-23T00:25:02.123456+00:00",
      "rotated_to": "exodus_20251123_002502",
      "reason": "Quarterly security rotation"
    }
  ],
  "last_rotated": "2025-11-23T00:25:02.123456+00:00"
}
```

### Rotation Workflow

1. **Create a rotation**
   ```
   Menu Option 7 → Select key set → Enter reason → New rotated set created
   ```

2. **Old key set marked INACTIVE**
   - Can still be accessed for historical purposes
   - Won't show up in "View Active Keys"
   - Fully archived in the system

3. **New key set marked ACTIVE**
   - Immediately ready for use
   - Shows up in "View Active Keys"
   - Same seed, new derivation reference

4. **Rotation history preserved**
   - View complete chain of rotations
   - Track reasons and timestamps
   - Perfect for compliance audits

### Use Cases

#### Security Compliance
```
Reason: "Quarterly security rotation per compliance policy"
- Rotate keys every 3 months
- Maintain audit trail
- Meet security standards
```

#### Emergency Rotation
```
Reason: "Key exposure incident - emergency rotation"
- Quickly disable compromised keys
- Mark as inactive immediately
- Create new active set
```

#### Key Lifecycle Management
```
Reason: "Production migration - staging to production"
- Manage key promotion through environments
- Track environment transitions
- Maintain state across deployments
```

#### Compliance & Auditing
```
Reason: "Scheduled rotation - per SOC 2 requirements"
- Automatic compliance tracking
- Verifiable history
- Timestamp evidence
```

---

## File Structure

```
wallets/exodus/
├── exodus_20251123_120000.encrypted      # Encrypted key data
├── exodus_20251123_120000.manifest       # Key metadata (unencrypted)
├── exodus_20251123_120000.state          # Key state (active/inactive)
├── exodus_20251123_120000_summary.json   # Public keys only (safe to share)
│
├── exodus_20251123_120000_rotated_002502.encrypted
├── exodus_20251123_120000_rotated_002502.manifest
├── exodus_20251123_120000_rotated_002502.state
├── exodus_20251123_120000_rotated_002502_summary.json
│
└── .salt                                  # Encryption salt (for password derivation)
```

---

## Security Features

✓ **PBKDF2-SHA256 Encryption** - Industry-standard key derivation
✓ **Fernet Encryption** - Authenticated encryption with timestamps
✓ **File Permissions** - All sensitive files chmod 0o600
✓ **Password-Protected** - Minimum 12 characters required
✓ **Rotation History** - Cryptographic evidence trail
✓ **Public/Private Separation** - Safe exports without key exposure
✓ **BIP39/BIP44 Compliance** - Standard key derivation paths

---

## Supported Networks

- Bitcoin (BIP44: m/44'/0'/0'/0)
- Ethereum (BIP44: m/44'/60'/0'/0)
- Litecoin (BIP44: m/44'/2'/0'/0)
- Dogecoin (BIP44: m/44'/3'/0'/0)
- Bitcoin Cash (BIP44: m/44'/145'/0'/0)

---

## Code Examples

### Get All Active Keys
```python
from exodus_seed_manager import ExodusSeedManager

manager = ExodusSeedManager()
manager.load_encryption_key(password)

active_keys = manager.get_active_keys()
for key_info in active_keys:
    print(f"Key: {key_info['label']}")
    print(f"Networks: {', '.join(key_info['networks'])}")
    print(f"Status: {key_info['state']['activated_at']}")
```

### Rotate a Key Set
```python
new_label = manager.rotate_key_set(
    old_label='exodus_20251123_120000',
    reason='Quarterly security rotation per policy'
)
print(f"New active key: {new_label}")
```

### View Rotation History
```python
history = manager.get_rotation_history('exodus_20251123_120000')
for entry in history:
    print(f"Rotated at: {entry['rotated_at']}")
    print(f"Rotated to: {entry['rotated_to']}")
    print(f"Reason: {entry['reason']}")
```

### Deactivate Keys
```python
manager.set_key_active('exodus_20251123_120000', active=False)
# Key is now marked inactive but still accessible
```

---

## Tips & Best Practices

1. **Regular Backups**
   - Encrypt the `wallets/exodus/` directory
   - Store in secure backup location
   - Include `.state` files for complete history

2. **Rotation Policy**
   - Establish a key rotation schedule
   - Document reasons for each rotation
   - Maintain audit trail for compliance

3. **Password Security**
   - Use a strong, unique password (12+ characters)
   - Store password in secure manager
   - Never commit password to version control

4. **Seed Phrase Security**
   - Store seed phrase separately from encrypted keys
   - Use Verify option to confirm seed before operations
   - Never expose seed phrase in logs

5. **Audit & Compliance**
   - Use View Rotation History for compliance reports
   - Export public summaries for secure sharing
   - Track all rotations with clear reasons

---

## Troubleshooting

### "Failed to load encryption key"
- Verify password is correct
- Check that `.salt` file exists in storage directory
- Re-run Setup to create new encryption

### "No saved keys found"
- Check storage directory path
- Ensure `.manifest` files exist
- Run Setup to create initial keys

### "Invalid choice"
- Enter numbers between 0-9 from main menu
- Ensure selection matches list size
- Try again with valid option

### Rotation failed
- Ensure old key set exists
- Verify encryption password is correct
- Check disk space in storage directory

---

## Menu Navigation Tips

- Press `0` to exit and return to menu
- Press `Enter` after each operation to continue
- Use `Ctrl+C` to cancel current operation
- Password prompts are hidden for security
- All warnings are clear - read carefully!

---

## Support

For issues or feature requests, refer to the main exodus documentation or contact your security team.

**Last Updated:** 2025-11-23
**Version:** 2.0 (Menu-Driven with Key Rotation)
