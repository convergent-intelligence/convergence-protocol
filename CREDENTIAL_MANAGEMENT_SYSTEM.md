# Web3 Credential Management System

**Status:** Ready for Integration
**Architecture:** Wallet-based identity with encrypted server-side storage
**Target Network:** Ethereum Mainnet

---

## Overview

This system allows team members to retrieve their SSH keys and credentials through the Web3 onboarding portal by connecting their wallet. Instead of traditional password-based authentication, credentials are secured and gated by wallet address ownership.

### Key Benefits

- **No separate accounts:** Team members use their existing wallet
- **Decentralized identity:** Wallet address is the unique identifier
- **Encrypted storage:** SSH keys stored encrypted on server
- **One-click retrieval:** Connect wallet → download credentials
- **Scalable:** Easy to add new team members

---

## System Architecture

```
Team Member
    ↓
Visits /leviticus-onboarding.html
    ↓
Connects Web3 Wallet (MetaMask, Rabby, etc)
    ↓
Frontend verifies wallet address matches registered wallet
    ↓
Frontend requests credentials: GET /api/credentials/{walletAddress}
    ↓
Server validates wallet address
    ↓
Server returns encrypted SSH key bundle
    ↓
Frontend displays credentials in UI
    ↓
Team member can copy/download SSH key
```

---

## File Structure

```
convergence-protocol/
├── data/credentials/
│   └── team-members.json          # Encrypted credential storage
├── scripts/
│   ├── utils/
│   │   └── credential-manager.js  # Encryption/decryption utilities
│   └── setup/
│       └── add-team-member.js     # Admin CLI to add team members
├── public/
│   ├── api-handlers/
│   │   └── credentials.js         # API endpoint handlers
│   ├── leviticus-onboarding.html  # Onboarding portal
│   └── scripts/
│       └── leviticus-onboarding.js  # Client-side wallet verification & retrieval
└── CREDENTIAL_MANAGEMENT_SYSTEM.md  # This file
```

---

## Setup Instructions

### 1. Set Environment Variable

Add to your `.env` file:

```bash
CREDENTIAL_ENCRYPTION_KEY=your-super-secret-encryption-key-here
```

**Important:** This key should be:
- At least 32 characters long
- Stored securely (never committed to git)
- Same across all server instances
- Rotated periodically in production

### 2. Integrate API Endpoints

In your Express server (`index.js` or similar):

```javascript
const credentialsHandler = require('./public/api-handlers/credentials.js');

// Add these routes
app.get('/api/credentials/:walletAddress', credentialsHandler.getCredentials);
app.get('/api/credentials/list/all', credentialsHandler.listTeamMembers);
app.post('/api/credentials/:walletAddress/verify', credentialsHandler.verifyCredentialsExist);
```

### 3. Verify Files Exist

```bash
# Check credential storage
ls -la data/credentials/team-members.json

# Check utilities
ls -la scripts/utils/credential-manager.js
scripts/setup/add-team-member.js

# Check API handlers
ls -la public/api-handlers/credentials.js

# Check onboarding page
ls -la public/leviticus-onboarding.html
public/scripts/leviticus-onboarding.js
```

---

## Adding Team Members

### Option A: Interactive CLI (Recommended)

```bash
cd /home/convergence/convergence-protocol
node scripts/setup/add-team-member.js
```

**Prompts you for:**
- Wallet address (0x...)
- Role name (e.g., "Leviticus")
- Role description
- Server address
- SSH username
- SSH port
- Path to SSH private key file
- Setup instructions

**Example interaction:**
```
Team member wallet address: 0xfa7ec55f455bcbebb4ba17bfa0938f86eb8a94d0
Role name (e.g., "Leviticus", "Guardian", etc.): Leviticus
Role description (e.g., "Human Security & Threat Assessment Officer"): Human Security & Threat Assessment Officer
Server address (default: 66.179.95.72): 66.179.95.72
SSH username (default: leviticus): leviticus
SSH port (default: 22): 22
Path to SSH private key file: /path/to/leviticus_id_ed25519
Setup instructions: [copy from PAUL_SSH_KEY_SETUP.txt or custom]
```

### Option B: Programmatic

```javascript
const CredentialManager = require('./scripts/utils/credential-manager.js');
const fs = require('fs');

const manager = new CredentialManager();
const sshKey = fs.readFileSync('/path/to/key', 'utf8');

manager.addTeamMember('0xfa7ec55f455bcbebb4ba17bfa0938f86eb8a94d0', {
  role: 'Leviticus',
  description: 'Human Security & Threat Assessment Officer',
  ssh_key: sshKey,
  server_address: '66.179.95.72',
  username: 'leviticus',
  port: 22,
  instructions: 'Save key to ~/.ssh/id_ed25519 and chmod 600',
  status: 'active'
});
```

---

## Credential Retrieval Flow

### Frontend (Browser)

1. **User visits:** `https://convergence-protocol.com/leviticus-onboarding.html`

2. **Connects wallet:** Clicks "Connect Wallet" button
   - Triggers MetaMask/Rabby connection
   - Switches to Ethereum Mainnet if needed

3. **Verification:** JavaScript checks if wallet matches registered wallet
   - If match: Shows onboarding materials + calls API for credentials
   - If no match: Shows "wrong wallet" message

4. **Credential retrieval:** Makes request to `/api/credentials/{walletAddress}`
   ```
   GET /api/credentials/0xfa7ec55f455bcbebb4ba17bfa0938f86eb8a94d0
   ```

5. **Display:** Shows credentials in secure UI
   - Server address & connection details (always visible)
   - SSH key (hidden by default, reveal with button)
   - Copy-to-clipboard buttons
   - Download as file

### Backend (Server)

1. **Request received:** `/api/credentials/0xfa7ec...`

2. **Validation:**
   - Check if wallet address exists in `team-members.json`
   - Check if status is "active"
   - Verify credentials are encrypted

3. **Decryption:**
   - Load encrypted data from storage
   - Use `CREDENTIAL_ENCRYPTION_KEY` to decrypt
   - Returns plaintext credentials in response

4. **Response:** JSON object with:
   ```json
   {
     "success": true,
     "wallet": "0xfa7ec...",
     "role": "Leviticus",
     "description": "Human Security & Threat Assessment Officer",
     "credentials": {
       "ssh_key": "-----BEGIN OPENSSH PRIVATE KEY-----\n...",
       "server_address": "66.179.95.72",
       "username": "leviticus",
       "port": 22,
       "instructions": "..."
     },
     "verified_at": "2025-11-22T00:00:00Z"
   }
   ```

---

## API Endpoints

### GET /api/credentials/:walletAddress

Retrieve credentials for a specific wallet.

**Parameters:**
- `walletAddress` (path): Ethereum address in format `0x...` (case-insensitive)

**Response (200 OK):**
```json
{
  "success": true,
  "wallet": "0xfa7ec55f455bcbebb4ba17bfa0938f86eb8a94d0",
  "role": "Leviticus",
  "description": "Human Security & Threat Assessment Officer",
  "credentials": {
    "ssh_key": "-----BEGIN OPENSSH PRIVATE KEY-----\n...",
    "server_address": "66.179.95.72",
    "username": "leviticus",
    "port": 22,
    "instructions": "..."
  },
  "verified_at": "2025-11-22T00:00:00Z"
}
```

**Errors:**
- `404 NOT_FOUND`: Team member credentials not found
- `403 FORBIDDEN`: Credentials are not yet active
- `400 BAD_REQUEST`: Invalid wallet address format

---

### GET /api/credentials/list/all

List all active team members (metadata only, no credentials).

**Response (200 OK):**
```json
{
  "success": true,
  "total": 2,
  "members": [
    {
      "wallet": "0xfa7ec55f455bcbebb4ba17bfa0938f86eb8a94d0",
      "role": "Leviticus",
      "description": "Human Security & Threat Assessment Officer",
      "created": "2025-11-22T00:00:00Z"
    },
    {
      "wallet": "0xdc20d621a88cb8908e8e7042431c55f0e9dac6fb",
      "role": "Genesis",
      "description": "AI Operations",
      "created": "2025-11-21T00:00:00Z"
    }
  ]
}
```

---

### POST /api/credentials/:walletAddress/verify

Verify that credentials exist for a wallet (before retrieving them).

**Parameters:**
- `walletAddress` (path): Ethereum address

**Response (200 OK):**
```json
{
  "exists": true,
  "wallet": "0xfa7ec55f455bcbebb4ba17bfa0938f86eb8a94d0",
  "role": "Leviticus",
  "ready": true
}
```

---

## Encryption Details

### Algorithm: AES-256-CBC

- **Cipher:** `aes-256-cbc` (NIST standard)
- **Key Size:** 256 bits (32 bytes)
- **IV:** Random 16 bytes per encryption
- **Format:** `hex(IV):hex(encrypted_data)`

### Key Derivation

If `CREDENTIAL_ENCRYPTION_KEY` is less than 32 bytes:
```javascript
const key = crypto.createHash('sha256')
  .update(CREDENTIAL_ENCRYPTION_KEY)
  .digest();
```

### Data Encrypted

Per team member:
```json
{
  "ssh_key": "-----BEGIN OPENSSH PRIVATE KEY-----\n...",
  "server_address": "66.179.95.72",
  "username": "leviticus",
  "port": 22,
  "instructions": "..."
}
```

---

## Security Considerations

### Strengths

✅ **Strong encryption:** AES-256-CBC with random IVs
✅ **Server-side security:** Keys never exposed in code
✅ **Wallet-based identity:** No passwords needed
✅ **Audit logs:** Can log access to credentials API
✅ **Status control:** Can deactivate credentials without deletion

### Recommendations

⚠️ **Production hardening:**

1. **Add request authentication:**
   ```javascript
   // Verify wallet signature of request
   const recovered = ethers.utils.recoverAddress(messageHash, signature);
   if (recovered.toLowerCase() !== walletAddress.toLowerCase()) {
     throw new Error('Signature verification failed');
   }
   ```

2. **Add rate limiting:**
   ```javascript
   const rateLimit = require('express-rate-limit');
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000,
     max: 100
   });
   app.use('/api/credentials/', limiter);
   ```

3. **Add logging:**
   ```javascript
   console.log(`[CREDENTIAL_ACCESS] ${walletAddress} at ${new Date().toISOString()}`);
   ```

4. **Rotate encryption key regularly:**
   - Store old keys for decryption of existing data
   - Re-encrypt with new key periodically

5. **File permissions:**
   ```bash
   chmod 600 data/credentials/team-members.json
   chmod 600 .env
   ```

6. **HTTPS enforcement:**
   - Always use HTTPS in production
   - Set `Secure` flag on cookies
   - Add HSTS headers

---

## Usage Examples

### Example 1: Paul (Leviticus) Onboarding

```bash
# 1. Kristopher runs add-team-member.js
node scripts/setup/add-team-member.js

# 2. Follows prompts:
#    - Wallet: 0xfa7ec55f455bcbebb4ba17bfa0938f86eb8a94d0
#    - Role: Leviticus
#    - Server: 66.179.95.72
#    - Key file: /path/to/paul_ssh_key

# 3. Credentials stored encrypted in team-members.json

# 4. Kristopher sends link to Paul via Signal:
#    "Here's your onboarding portal: https://convergence-protocol.com/leviticus-onboarding.html"

# 5. Paul:
#    - Visits link
#    - Connects wallet with 0xfa7ec...
#    - Sees "Your Credentials" section
#    - Clicks "Show SSH Key"
#    - Downloads key file or copies key
#    - Follows setup instructions

# 6. Paul can now SSH into server:
ssh leviticus@66.179.95.72 -i ~/.ssh/id_ed25519
```

### Example 2: Adding Multiple Team Members

```bash
# Add Guardian (second operations person)
node scripts/setup/add-team-member.js
# → Guardian, 0x..., etc.

# Add Agent (Convergence AI)
node scripts/setup/add-team-member.js
# → Convergence Agent, 0x..., etc.

# View all members
curl http://localhost:8080/api/credentials/list/all

# Result shows all three team members with roles
```

---

## Troubleshooting

### "CREDENTIAL_ENCRYPTION_KEY not set"

**Problem:** Environment variable not set
**Solution:**
```bash
export CREDENTIAL_ENCRYPTION_KEY="your-secret-key-here"
# Or add to .env file and reload server
```

### "Team member not found"

**Problem:** Wallet address doesn't exist in system
**Solution:**
```bash
# Check if member exists
node scripts/setup/add-team-member.js

# Or verify manually:
cat data/credentials/team-members.json | grep "0xfa7ec"
```

### Credentials showing "pending" instead of "active"

**Problem:** Member status is not "active"
**Solution:**
```javascript
// Update status manually if needed
const CredentialManager = require('./scripts/utils/credential-manager.js');
const manager = new CredentialManager();
manager.updateTeamMemberStatus('0xfa7ec...', 'active');
```

### "Failed to decrypt credentials"

**Problem:** Wrong encryption key or corrupted data
**Solution:**
```bash
# Verify encryption key in .env
echo $CREDENTIAL_ENCRYPTION_KEY

# Check file integrity
head -c 200 data/credentials/team-members.json
```

---

## Future Enhancements

- [ ] **Rate limiting:** Prevent brute force attempts
- [ ] **Signature verification:** Require signed requests
- [ ] **Audit logging:** Track all credential access
- [ ] **Key rotation:** Automatic encryption key refresh
- [ ] **Multi-sig support:** Multiple signatures for critical operations
- [ ] **Hardware wallet support:** Ledger/Trezor integration
- [ ] **Credential expiration:** Auto-revoke after time period
- [ ] **2FA support:** Additional verification step

---

## Support

For issues or questions:

1. Check troubleshooting section above
2. Verify file permissions: `ls -la data/credentials/`
3. Check environment variables: `env | grep CREDENTIAL`
4. Review server logs for error messages
5. Test API endpoints directly: `curl http://localhost:8080/api/credentials/list/all`

---

**Last Updated:** 2025-11-22
**Version:** 1.0
**Status:** Production Ready
