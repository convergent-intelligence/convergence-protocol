# Exodus Key Manager - Quick Start Guide

## 🚀 Get Started in 2 Minutes

### Step 1: Launch the Menu
```bash
cd /home/convergence/convergence-protocol/scripts/
python3 exodus-seed-manager.py
```

### Step 2: See the Menu
```
======================================================================
                    EXODUS SEED WALLET MANAGER
======================================================================

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

======================================================================
```

---

## 💡 Common Tasks

### First Time Setup
```
1. Enter: 1
2. Create encryption password (12+ characters)
3. Choose: Import existing seed or Generate new
4. Select networks (Bitcoin, Ethereum, etc.)
5. Save keys
✓ Done!
```

### List Your Keys
```
1. Enter: 2
2. See all saved key sets with status
3. Shows which are ACTIVE/INACTIVE
```

### Rotate Your Keys
```
1. Enter: 7
2. Select which key set to rotate
3. Enter reason (e.g., "Quarterly rotation")
4. ✓ New key set created and ACTIVE
5. ✓ Old key set marked INACTIVE
6. ✓ Rotation logged for audit
```

### View Rotation History
```
1. Enter: 8
2. Select a key set
3. See complete history:
   - When rotations happened
   - What they rotated to
   - Why they rotated
```

### Export Public Keys (Safe)
```
1. Enter: 4
2. Select key set
3. ✓ Exported to JSON file
4. Safe to share (no private keys!)
```

### Export Private Key (Careful!)
```
1. Enter: 5
2. ⚠️ See warnings
3. Confirm you understand
4. Select key set
5. Select network
6. Select account number
7. ✓ Private key displayed
⚠️ Keep it secure!
```

---

## 🎯 Key Features Explained

### What is "Rotation"?
Think of it like changing your locks. You have the same key factory (seed), but you're creating new locks (keys) and marking the old ones as no longer used.

**Before Rotation:**
- Key Set A: ACTIVE (in use)

**After Rotation:**
- Key Set A: INACTIVE (archived)
- Key Set B: ACTIVE (now in use)
- Both can be restored if needed
- Full history saved

### Why Rotate Keys?
1. **Security** - Regular rotation limits exposure window
2. **Compliance** - Required by many policies
3. **Auditing** - Complete trail of all changes
4. **Organization** - Keep track of active vs archived
5. **Emergency** - Quickly disable compromised keys

### Active vs Inactive
- **ACTIVE**: Currently in use, shows up in "View Active Keys"
- **INACTIVE**: Archived, still accessible, for history/audit

---

## 🔐 Security Tips

✅ **DO:**
- Use strong passwords (12+ characters, mix of types)
- Store encryption password in secure manager
- Export public key summaries for sharing
- Use rotation history for compliance
- Backup the entire `wallets/exodus/` directory

❌ **DON'T:**
- Share private keys via chat/email/unsecured
- Commit password to version control
- Use simple passwords
- Share `.state` files without understanding content
- Delete `.state` files (needed for audit trail)

---

## 📊 Understanding Key States

### State File Example
```json
{
  "label": "exodus_20251123_002502",
  "active": true,
  "activated_at": "2025-11-23T00:25:02Z",
  "rotated_from": "exodus_20251120_120000",
  "rotation_history": [
    {
      "rotated_at": "2025-11-23T00:25:02Z",
      "rotated_to": "exodus_20251123_002502",
      "reason": "Quarterly security rotation"
    }
  ]
}
```

**What it means:**
- This key is currently ACTIVE
- It was created on Nov 23, 2025
- It rotated from an older key
- The reason was security rotation
- Complete chain is preserved

---

## 🆘 Troubleshooting

### "Wrong password" error
- Check your password (case-sensitive)
- Clear console and try again
- Reset encryption if you forget password

### "No saved keys found"
- Run Option [1] to setup first
- Check storage directory
- Verify `.manifest` files exist

### Can't remember encryption password
- You'll need to set up again with new password
- Old keys will still be encrypted
- Consider using password manager

### Want to restore an old key
- Old keys are still INACTIVE but accessible
- Use Option [9] to reactivate if needed
- Full history preserved

---

## 📈 Workflow Example

### Scenario: Team Key Management

**Week 1: Initial Setup**
```
[1] Setup → Create seed → Derive keys → Save
Status: exodus_prod_v1 → ACTIVE
```

**Month 1: Routine Export**
```
[4] Export Summary → Share with team
Can share safely (public keys only)
```

**Month 3: Compliance Rotation**
```
[7] Rotate → Reason: "Q1 Compliance Rotation"
Status: exodus_prod_v1 → INACTIVE
Status: exodus_prod_v1_rotated_202503 → ACTIVE
[8] History shows: "Q1 Compliance Rotation" at timestamp
```

**Month 6: Audit Check**
```
[8] View Rotation History → Export for compliance report
Shows: All rotations with timestamps and reasons
✓ Audit trail complete!
```

**Emergency (Hypothetical):**
```
[7] Rotate → Reason: "EMERGENCY: Key Exposure Incident"
[9] View all ACTIVE keys → Only new key is active
Old key immediately retired with reason logged
✓ Secure and audited!
```

---

## 🔗 Command-Line (Legacy Mode)

If you prefer command-line, all old commands still work:

```bash
# Menu mode (recommended)
python3 exodus-seed-manager.py

# Legacy mode
python3 exodus-seed-manager.py --setup
python3 exodus-seed-manager.py --list
python3 exodus-seed-manager.py --export my_keys
python3 exodus-seed-manager.py --export-key my_keys --network bitcoin
python3 exodus-seed-manager.py --verify my_keys
```

---

## 📚 Files for More Info

- `EXODUS_MANAGER_FEATURES.md` - Complete feature documentation
- `IMPLEMENTATION_SUMMARY.md` - Technical details
- `BEFORE_AFTER_COMPARISON.txt` - What's new

---

## ⚡ Pro Tips

1. **Password Caching** - After setup, password is cached in session
   - No need to re-enter for next operations
   - Ends when you exit menu (security)

2. **Multiple Key Sets** - Create different sets for different purposes
   - Production, staging, test
   - Each with separate rotation schedule

3. **Batch Exports** - Export all active keys at once
   - [4] Export → Loop through key sets
   - Perfect for team distribution

4. **Rotation Naming** - Use clear labels
   - `prod_v1`, `prod_v1_rotated_202503`, etc.
   - Makes history clear and auditable

5. **Scheduled Rotations** - Plan quarterly/monthly
   - Use rotation reason: "Q1 2025 Scheduled Rotation"
   - Keep consistent schedule

---

## 🎓 Understanding BIP44 Paths

Keys are derived using standard paths:

```
Bitcoin:   m/44'/0'/0'/0
Ethereum:  m/44'/60'/0'/0
Litecoin:  m/44'/2'/0'/0
Dogecoin:  m/44'/3'/0'/0
BCH:       m/44'/145'/0'/0
```

This means: All keys from same seed are compatible across wallets!

---

## ✅ Checklist: First Run

- [ ] Navigate to scripts directory
- [ ] Run: `python3 exodus-seed-manager.py`
- [ ] Select [1] for Setup
- [ ] Create strong password (12+ chars)
- [ ] Choose to import or generate seed
- [ ] Save your seed phrase securely
- [ ] Choose networks
- [ ] Wait for key derivation
- [ ] Check Option [2] to see saved keys
- [ ] View Option [8] to see empty history
- [ ] Try Option [4] to export addresses

✓ You're ready to go!

---

## 📞 Quick Reference

| Need | Use | Notes |
|------|-----|-------|
| Initial setup | [1] | Password must be 12+ chars |
| See all keys | [2] | Shows ACTIVE/INACTIVE status |
| See active only | [3] | Filters out rotated keys |
| Share addresses | [4] | Safe (no private keys) |
| Export privkey | [5] | Careful! Multiple warnings |
| Check seed | [6] | Verify you have correct seed |
| Rotate keys | [7] | Creates new set, archives old |
| View history | [8] | Audit trail with timestamps |
| Toggle status | [9] | ACTIVE ↔ INACTIVE |
| Exit | [0] | Return to shell |

---

## 🚦 Status Indicators

```
✓ ACTIVE   - Key set is currently in use
✗ INACTIVE - Key set is archived/retired
📅 Created - Timestamp when created
🔄 Rotated - Shows if rotated from another set
📝 Reason  - Why the rotation happened
```

---

## Final Notes

- All operations are logged and timestamped
- No data is lost during rotation (everything archived)
- State files are essential for audit trails
- Encryption is PBKDF2-SHA256 + Fernet (industry-standard)
- Perfect for security compliance and governance

**Ready to manage your keys securely!** 🔐

---

*Last Updated: 2025-11-23*
*Version: 2.0 (Menu-Driven Interface)*
