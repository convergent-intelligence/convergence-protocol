# Client Integration Guide - EIP-191 Signature Authentication

All sensitive endpoints now require EIP-191 signature verification to prove wallet ownership.

---

## Quick Start

### 1. Get Credentials (Team Members)

**Before (Vulnerable):**
```bash
GET /api/credentials/0x123...abc
```

**After (Secure):**
```javascript
import { ethers } from 'ethers';

// Setup
const wallet = ethers.Wallet.fromMnemonic(mnemonic);
const message = "I authorize credential access to Convergence Protocol";
const signature = await wallet.signMessage(message);

// Request
const response = await fetch('/api/credentials/0x123...abc', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message, signature })
});

const credentials = await response.json();
// Returns: { success: true, authenticated: true, credentials: {...} }
```

---

### 2. Download Bible Wallet Private Key

**Before (Vulnerable):**
```bash
POST /api/bible-wallets/0x456.../download-key
```

**After (Secure):**
```javascript
const message = "I request my private key from Convergence Protocol";
const signature = await wallet.signMessage(message);

const response = await fetch('/api/bible-wallets/0x456.../download-key', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message, signature })
});

const keyData = await response.json();
// Returns: { guestWallet, privateKey, authenticated: true, ... }
```

---

### 3. Create API Key

**Before (Vulnerable):**
```bash
POST /api/keys/create
{
  "walletAddress": "0x789...",
  "agentName": "Gemini",
  "description": "My Gemini Key"
}
```

**After (Secure):**
```javascript
const message = "I authorize API key creation for Gemini agent";
const signature = await wallet.signMessage(message);

const response = await fetch('/api/keys/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    walletAddress: '0x789...',
    agentName: 'Gemini',
    description: 'My Gemini Key',
    message,
    signature
  })
});

const result = await response.json();
// Returns: { success: true, authenticated: true, data: { apiKey, ... } }
```

---

### 4. Revoke API Key

**Before (Vulnerable):**
```bash
POST /api/keys/0x789.../revoke
{
  "keyId": "key-123"
}
```

**After (Secure):**
```javascript
const message = "I revoke my API key for security purposes";
const signature = await wallet.signMessage(message);

const response = await fetch('/api/keys/0x789.../revoke', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    keyId: 'key-123',
    message,
    signature
  })
});

const result = await response.json();
```

---

### 5. Update Bible Wallet Status

**Before (Vulnerable):**
```bash
POST /api/bible-wallets/0x456.../update-status
{
  "trustBurned": 100,
  "tallyAccumulated": 50
}
```

**After (Secure):**
```javascript
const message = "I update my status after ceremony participation";
const signature = await wallet.signMessage(message);

const response = await fetch('/api/bible-wallets/0x456.../update-status', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    trustBurned: 100,
    tallyAccumulated: 50,
    message,
    signature
  })
});

const result = await response.json();
```

---

## Helper Function (JavaScript/TypeScript)

Create a reusable helper function:

```javascript
import { ethers } from 'ethers';

async function signAndRequest(wallet, endpoint, method = 'POST', data = {}) {
  // Create a meaningful message
  const messageBase = data.messageBase || `I authorize this action on Convergence Protocol`;
  const timestamp = Math.floor(Date.now() / 1000);
  const message = `${messageBase}\nTimestamp: ${timestamp}`;

  // Sign the message
  const signature = await wallet.signMessage(message);

  // Make request
  const response = await fetch(endpoint, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...data,
      message,
      signature
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

// Usage
const wallet = ethers.Wallet.fromMnemonic(mnemonic);
const result = await signAndRequest(wallet, '/api/credentials/0x123...', 'POST', {
  messageBase: 'I authorize credential access'
});
```

---

## Error Handling

All endpoints now return authentication-specific errors:

```javascript
// Missing signature
{
  "error": "Signature verification required. Provide message and signature in request body.",
  "code": "MISSING_SIGNATURE"
}
```

```javascript
// Invalid signature
{
  "error": "Invalid signature - signature does not match wallet",
  "code": "INVALID_SIGNATURE"
}
```

```javascript
// Invalid wallet address
{
  "error": "Invalid wallet address format",
  "code": "INVALID_WALLET"
}
```

Handle these errors in your client:

```javascript
try {
  const result = await signAndRequest(wallet, endpoint, 'POST', data);
} catch (error) {
  if (error.message.includes('MISSING_SIGNATURE')) {
    // Handle: need to sign message
  } else if (error.message.includes('INVALID_SIGNATURE')) {
    // Handle: signature doesn't match
  } else {
    // Handle other errors
  }
}
```

---

## Browser/MetaMask Integration

For browser-based clients using MetaMask:

```javascript
import { ethers } from 'ethers';

// Get MetaMask provider
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const address = await signer.getAddress();

// Sign and request
const message = "I authorize credential access";
const signature = await signer.signMessage(message);

const response = await fetch(`/api/credentials/${address}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message, signature })
});

const data = await response.json();
```

---

## Signature Security Best Practices

1. **Use Unique Messages:** Include timestamp or nonce to prevent replay attacks
2. **Display to Users:** Always show users what they're signing
3. **Verify Wallet:** Ensure signature is from the wallet requesting the action
4. **Handle Expiry:** Consider signature expiration (e.g., 5 minutes)
5. **Log Attempts:** Keep security logs of all signature operations

---

## Testing Endpoints

### Using curl with Hardhat

If you're running a local node with Hardhat:

```bash
# 1. Get a private key from Hardhat
export PK="0x..."

# 2. Use ethers CLI to sign a message
npx ethers --signMessage "I authorize credential access" --privateKey $PK

# 3. Use the signature in curl
curl -X POST http://localhost:8080/api/credentials/0x123... \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I authorize credential access",
    "signature": "0x..."
  }'
```

### Using Node.js directly

```javascript
import { ethers } from 'ethers';

const wallet = ethers.Wallet.fromMnemonic(process.env.MNEMONIC);
console.log('Wallet:', wallet.address);

const message = "I authorize credential access";
const signature = await wallet.signMessage(message);
console.log('Signature:', signature);

// Use in request
```

---

## Public Endpoints (No Signature Required)

These endpoints remain public and don't require signatures:

- `GET /api/credentials/list/all` - List all team members
- `GET /api/bible-wallets/seats/all` - List all Bible seats
- `GET /api/bible-wallets/succession/ranking` - Get succession ranking
- `GET /api/agents/all` - List all agents
- `GET /api/partner-governance/status` - Get partnership status
- `GET /api/partner-governance/partners` - Get partners list

Example:
```bash
curl http://localhost:8080/api/credentials/list/all
```

---

## Troubleshooting

### Signature Verification Failing

**Problem:** "Invalid signature - signature does not match wallet"

**Causes:**
1. Wrong wallet signing the message (check signer address)
2. Message modified after signing
3. Wrong signature format

**Solution:**
```javascript
// Verify before sending
const recoveredAddress = ethers.verifyMessage(message, signature);
console.log('Expected:', expectedWallet.toLowerCase());
console.log('Recovered:', recoveredAddress.toLowerCase());
// Should match!
```

### Endpoint Not Found

**Problem:** 404 on `/api/credentials/`

**Reason:** Endpoint changed from GET to POST

**Solution:**
```javascript
// OLD (doesn't work)
GET /api/credentials/0x123...

// NEW (required)
POST /api/credentials/0x123...
Body: { message, signature }
```

### Missing Signature Fields

**Problem:** "Missing required fields"

**Solution:** Ensure body includes:
```javascript
{
  message: "Your message",
  signature: "0x..." // 132 characters (0x + 130 hex chars)
  // ... other required fields
}
```

---

## Migration Checklist

If you're updating existing client code:

- [ ] Import ethers.js in your client
- [ ] Change GET requests to POST for secured endpoints
- [ ] Add message and signature to request body
- [ ] Update error handlers for auth-specific errors
- [ ] Test with MetaMask/Hardhat
- [ ] Update API documentation
- [ ] Test all error paths
- [ ] Verify backward compatibility if needed
- [ ] Update client version
- [ ] Deploy and monitor

---

## Support

For integration issues:
1. Check error `code` field for specific issue
2. Verify message and signature format
3. Ensure wallet is correct
4. Check console logs for `[SECURITY]` messages
5. Review audit logs at `/data/audit-logs/`

