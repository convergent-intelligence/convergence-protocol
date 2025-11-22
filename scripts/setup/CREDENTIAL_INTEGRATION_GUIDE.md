# Quick Start: Integrating Credential Management

**Time to integrate:** ~5 minutes

---

## Step 1: Update .env

Add to `/home/convergence/convergence-protocol/.env`:

```bash
CREDENTIAL_ENCRYPTION_KEY=your-super-secret-key-minimum-32-chars-long-here-2025
```

**Generate a secure key:**
```bash
# On macOS/Linux
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Save the output to `.env`.

---

## Step 2: Find Your Express Server

Look for your main server file. Usually one of:
- `/home/convergence/convergence-protocol/index.js`
- `/home/convergence/convergence-protocol/server.js`
- `/home/convergence/convergence-protocol/app.js`

```bash
# Find it
ls -la /home/convergence/convergence-protocol/*.js | head -5
```

---

## Step 3: Add API Routes

In your Express server file, add these routes. Usually at the bottom before `app.listen()`:

```javascript
// ==================== Credentials API ====================
const credentialsHandler = require('./public/api-handlers/credentials.js');

// Retrieve credentials for a wallet
app.get('/api/credentials/:walletAddress', credentialsHandler.getCredentials);

// List all active team members
app.get('/api/credentials/list/all', credentialsHandler.listTeamMembers);

// Verify credentials exist for a wallet
app.post('/api/credentials/:walletAddress/verify', credentialsHandler.verifyCredentialsExist);
// =========================================================
```

**Full example (if starting fresh):**

```javascript
const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ==================== Credentials API ====================
const credentialsHandler = require('./public/api-handlers/credentials.js');

app.get('/api/credentials/:walletAddress', credentialsHandler.getCredentials);
app.get('/api/credentials/list/all', credentialsHandler.listTeamMembers);
app.post('/api/credentials/:walletAddress/verify', credentialsHandler.verifyCredentialsExist);
// =========================================================

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
});
```

---

## Step 4: Test the Integration

### Test 1: Verify file structure
```bash
cd /home/convergence/convergence-protocol

# Check all required files exist
test -f data/credentials/team-members.json && echo "✓ Storage file" || echo "✗ Missing storage"
test -f scripts/utils/credential-manager.js && echo "✓ Manager utility" || echo "✗ Missing utility"
test -f scripts/setup/add-team-member.js && echo "✓ Admin CLI" || echo "✗ Missing CLI"
test -f public/api-handlers/credentials.js && echo "✓ API handlers" || echo "✗ Missing handlers"
test -f public/leviticus-onboarding.html && echo "✓ Onboarding page" || echo "✗ Missing page"
test -f public/scripts/leviticus-onboarding.js && echo "✓ Client script" || echo "✗ Missing script"
```

### Test 2: Test API endpoints
```bash
# Get list of team members (should be mostly empty initially)
curl http://localhost:8080/api/credentials/list/all

# Try to get credentials for a wallet (should fail - not added yet)
curl http://localhost:8080/api/credentials/0xfa7ec55f455bcbebb4ba17bfa0938f86eb8a94d0
```

### Test 3: Add a test team member
```bash
# Run interactive CLI
node scripts/setup/add-team-member.js

# Follow the prompts and add a test member
```

### Test 4: Retrieve credentials
```bash
# After adding member, test retrieval
curl http://localhost:8080/api/credentials/0xfa7ec55f455bcbebb4ba17bfa0938f86eb8a94d0 | jq
```

---

## Step 5: Test Web UI

### Via Browser

1. Visit: `http://localhost:8080/leviticus-onboarding.html`
2. Click "Connect Wallet"
3. Select MetaMask (or other wallet)
4. Connect with the wallet address you added
5. Should see:
   - ✓ Wallet verified message
   - ✓ Onboarding materials
   - ✓ "Your Credentials" section
   - ✓ SSH key retrieval options

---

## Step 6: Add Paul's Credentials

Once tested:

```bash
node scripts/setup/add-team-member.js
```

**When prompted, use:**
- Wallet: `0xfa7ec55f455bcbebb4ba17bfa0938f86eb8a94d0`
- Role: `Leviticus`
- Description: `Human Security & Threat Assessment Officer`
- Server: `66.179.95.72`
- Username: `leviticus`
- Port: `22`
- Key file: (path to Paul's actual SSH private key)
- Instructions: (copy from PAUL_SSH_KEY_SETUP.txt or create custom)

---

## Step 7: Share with Paul

Once credentials are added:

```bash
# Share this link via Signal:
echo "https://convergence-protocol.com/leviticus-onboarding.html"

# Paul should:
# 1. Visit the link
# 2. Click "Connect Wallet"
# 3. Connect with wallet address 0xfa7ec...
# 4. Click "Show SSH Key"
# 5. Download or copy the key
# 6. Follow setup instructions to configure SSH
```

---

## File Permissions

Make sure files are properly secured:

```bash
# Credentials storage (server-side only)
chmod 600 data/credentials/team-members.json

# Environment variables
chmod 600 .env

# Public files (world-readable)
chmod 644 public/leviticus-onboarding.html
chmod 644 public/scripts/leviticus-onboarding.js
chmod 644 public/api-handlers/credentials.js
```

---

## Verification Checklist

- [ ] Added `CREDENTIAL_ENCRYPTION_KEY` to `.env`
- [ ] Imported `credentialsHandler` in Express server
- [ ] Added 3 API routes to server
- [ ] Server restarted/redeployed
- [ ] Verified all files exist (`data/credentials/`, `scripts/utils/`, etc.)
- [ ] Tested `/api/credentials/list/all` endpoint
- [ ] Added test team member via CLI
- [ ] Tested credential retrieval via API
- [ ] Tested credential retrieval via web UI
- [ ] Added Paul's actual credentials
- [ ] Shared onboarding link with Paul via Signal

---

## Next Steps

1. **Paul signs in:** Share onboarding link via Signal
2. **Paul connects wallet:** He'll see his credentials
3. **Paul downloads SSH key:** Sets up local SSH configuration
4. **Paul tests SSH access:** `ssh leviticus@66.179.95.72`
5. **Success:** Paul is onboarded and has full infrastructure access

---

## Troubleshooting

**API returns 404 for credentials:**
- Verify member was added: `cat data/credentials/team-members.json | grep 0xfa7ec`
- Check encryption key: `echo $CREDENTIAL_ENCRYPTION_KEY`

**Cannot add team member:**
- Check permissions: `ls -la data/credentials/`
- Verify Node.js modules: `npm list crypto`

**Web UI shows "Not connected" after clicking Connect:**
- Check browser console: `F12 → Console`
- Verify MetaMask is installed
- Try refreshing page

**Web UI shows wrong wallet message:**
- Verify wallet address in script matches registration
- Check case sensitivity: `0xfa7ec...` (lowercase)

---

## Support

Endpoints are now live at:
- `GET /api/credentials/:walletAddress`
- `GET /api/credentials/list/all`
- `POST /api/credentials/:walletAddress/verify`

Frontend portal:
- `GET /leviticus-onboarding.html`

Admin CLI:
- `node scripts/setup/add-team-member.js`

---

**Last Updated:** 2025-11-22
**Integration Time:** 5-10 minutes
**Status:** Ready for production
