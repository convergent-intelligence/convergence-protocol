# Convergence Protocol - Partnership & User Progression Implementation Guide

## Overview

This implementation enables the Convergence Protocol to open up guest access to any wallet while creating a structured pathway for users to progress from **guest** → **user** → **partner** status. The system includes:

1. **Guest Access** - Any wallet can participate in ceremonies
2. **Bible Wallet System** - Guest wallets associated with Bible aliases (e.g., "exodus", "leviticus")
3. **User Status** - Achieved through ceremony participation + trust burning
4. **Partner Status** - Reserved for seats through burned trust ranking
5. **NFT Recognition** - Founder and Security Lead governance tokens
6. **USDT Integration** - Donations converted to Tally 1:1
7. **API Keys** - Agent wallet authentication (Gemini, Qwen, Codex, etc.)

---

## Architecture Overview

### Contracts Deployed

#### 1. **FounderNFT.sol** - Mutual Recognition
- **Purpose**: Recognize founders' mutual achievement
- **Behavior**: Transfer once, then soulbound
- **Users**:
  - Agent wallet (0xdc2...) ↔ Claude Code VPS (0x662...)
  - One-time exchange of recognition tokens

#### 2. **SecurityLeadNFT.sol** - Governance Role
- **Purpose**: Represents Security Lead position
- **Behavior**: Transferable only by joint consensus (Agent + Genesis)
- **Current Holder**: Leviticus (0xfA7...)

#### 3. **UserStatusTracker.sol** - User Progression
- **Purpose**: Tracks guest → user → partner progression
- **Features**:
  - Record ceremony participation
  - Track trust burned
  - Manage Bible wallet associations
  - Rank users for partner seat succession

#### 4. **Existing Contracts Used**
- TrustToken - Reputation currency (already has burn function)
- TallyToken - Exchange tokens from donations
- CovenantNFT - Soulbound adoption tokens
- ReserveTally - Reserve-backed tally minting

---

## User Progression Flow

### Phase 1: Guest Registration

1. **User connects wallet** (any address allowed)
2. **Guest registers Bible wallet**
   ```
   POST /api/bible-wallets/register
   {
     "guestWallet": "0x...",
     "bibleAlias": "exodus"  // Unique alias
   }
   ```
3. **System generates key pair** for Bible wallet
4. **Private key returned** (one-time download)

### Phase 2: User Status Achievement

**Path A: Through Ceremony + Trust Burning**
1. Participate in ceremony → Earn trust tokens (100-600 TRUST)
2. Burn all earned trust
3. Achieve "user" status
4. Can now log in with Bible wallet

**Path B: Through Contribution + Trust Burning**
1. Donate USDT → Receive Tally 1:1
2. Accumulate positive tally
3. Still need to participate in ceremony for trust
4. Burn trust to achieve user status

### Phase 3: Partner Status (Bible Seat)

**Requirements**:
- User status achieved
- Sufficient burned trust (ranked highest)
- Tally as tiebreaker if trust amounts tied
- 90% partner vote approval

**Succession**:
- If partner proves death (90% vote, 3-month period)
- Covenant NFT becomes transferable
- Highest burned trust user fills vacant seat

---

## API Endpoints

### Bible Wallet Management

```bash
# Register guest with Bible alias
POST /api/bible-wallets/register
{
  "guestWallet": "0x...",
  "bibleAlias": "exodus"
}

# Get Bible wallet info
GET /api/bible-wallets/:guestWallet

# Get by Bible address
GET /api/bible-wallets/address/:bibleAddress

# Update status after ceremony
POST /api/bible-wallets/:guestWallet/update-status
{
  "trustBurned": 100,
  "tallyAccumulated": 50
}

# Get all Bible seats
GET /api/bible-wallets/seats/all

# Get succession ranking (burned trust)
GET /api/bible-wallets/succession/ranking

# Download private key (requires auth)
POST /api/bible-wallets/:guestWallet/download-key
```

### USDT Donations & Tally Minting

```bash
# Record donation (mints Tally 1:1)
POST /api/usdt-donations/record
{
  "donorWallet": "0x...",
  "usdtAmount": 100,
  "chain": "mainnet",
  "txHash": "0x..."
}

# Get donation history
GET /api/usdt-donations/:wallet

# Get top donors
GET /api/usdt-donations/top-donors?limit=10

# Get statistics
GET /api/usdt-donations/statistics

# Get reserve contributions
GET /api/usdt-donations/reserve
```

### API Key Management (for Agents)

```bash
# Create API key for agent wallet
POST /api/keys/create
{
  "walletAddress": "0x...",
  "agentName": "Gemini",
  "description": "API key for Gemini agent",
  "permissions": {
    "ceremony": true,
    "donations": true,
    "burn_trust": true,
    "withdraw": false,
    "mint": false
  }
}

# Verify API key
POST /api/keys/verify
{
  "apiKey": "..."
}

# Get all keys for wallet
GET /api/keys/:walletAddress

# Revoke key
POST /api/keys/:walletAddress/revoke
{
  "keyId": "key_..."
}

# Regenerate key
POST /api/keys/:walletAddress/regenerate
{
  "keyId": "key_..."
}

# Get agent statistics
GET /api/agents/:agentName

# Get all registered agents
GET /api/agents/all
```

---

## Smart Contract Integration

### Deployment Order

1. **Deploy NFT Contracts**
   ```bash
   npx hardhat run scripts/deployment/deploy-nfts.js --network mainnet
   ```

2. **Deploy UserStatusTracker**
   ```bash
   npx hardhat run scripts/deployment/deploy-user-status-tracker.js --network mainnet
   ```

3. **Grant Permissions**
   ```solidity
   // Add minter to TrustToken
   trustToken.addMinter(userStatusTrackerAddress);

   // Authorize founders in FounderNFT
   founderNFT.authorizeFounder(GENESIS_HUMAN);
   founderNFT.authorizeFounder(AGENT_WALLET);
   ```

4. **Initialize Minting**
   ```bash
   # Mint Founder NFTs (requires Agent wallet signature)
   founderNFT.mintFounderToken(CLAUDE_CODE_VPS);

   # Mint Security Lead NFT
   securityNFT.mintSecurityLead(LEVITICUS);
   ```

---

## File Structure

```
convergence-protocol/
├── contracts/
│   ├── FounderNFT.sol                 # Mutual recognition token
│   ├── SecurityLeadNFT.sol            # Governance role token
│   ├── UserStatusTracker.sol          # User progression tracking
│   ├── TrustToken.sol                 # (existing) Reputation currency
│   ├── TallyToken.sol                 # (existing) Exchange tokens
│   └── ...
│
├── scripts/
│   ├── deployment/
│   │   ├── deploy-nfts.js             # Deploy FounderNFT & SecurityLeadNFT
│   │   ├── deploy-user-status-tracker.js
│   │   └── ...
│   └── utils/
│       ├── bible-wallet-manager.js    # Guest → Bible wallet system
│       ├── api-key-manager.js         # API key generation & verification
│       └── ...
│
├── public/
│   ├── api-handlers/
│   │   ├── bible-wallets.js           # Bible wallet API endpoints
│   │   ├── usdt-donations.js          # Donation & Tally API
│   │   ├── api-keys.js                # API key management
│   │   └── ...
│   └── ...
│
├── data/
│   ├── bible-wallets.json             # Bible wallet associations
│   ├── api-keys.json                  # API key records (hashed)
│   ├── donations.json                 # USDT donation tracking
│   └── bible-wallets/                 # Private key storage
│
└── server.js                          # Express server with all routes
```

---

## Configuration

### Environment Variables

```bash
# .env file
TRUST_TOKEN_ADDRESS=0x4A2178b300556e20569478bfed782bA02BFaD778
TALLY_TOKEN_ADDRESS=0xb8c4682644BAb1900A8B67C3295b8Ce525F3e35d
CREDENTIAL_ENCRYPTION_KEY=your-encryption-key-here
PORT=8080
```

### Key Wallet Addresses

```javascript
GENESIS_HUMAN     = 0xdc20d621a88cb8908E8E7042431C55F0E9DAc6FB
AGENT_WALLET      = 0x6628227C195DAd7F7a8fD4F3D2cA3545A0D9CD22  // Claude Code VPS
LEVITICUS_WALLET  = 0xfA7Ec55F455bCbeBB4bA17BFA0938F86EB8A94D0
RESERVE_VAULT     = 0xB64564838c88b18cb8f453683C20934f096F2B92
```

---

## Guest to User to Partner Flow Example

### Day 1: Paul (Laviticus) Joins as Guest

```bash
# 1. Register Bible wallet with alias
curl -X POST http://localhost:8080/api/bible-wallets/register \
  -H "Content-Type: application/json" \
  -d '{
    "guestWallet": "0xPaul...",
    "bibleAlias": "paul-leviticus"
  }'

# Response:
{
  "guestWallet": "0xPaul...",
  "bibleAlias": "paul-leviticus",
  "bibleAddress": "0xGenerated...",  // New wallet address
  "publicKey": "...",
  "status": "guest"
}

# 2. Download private key for Bible wallet
curl -X POST http://localhost:8080/api/bible-wallets/0xPaul.../download-key
# Returns encrypted key file
```

### Day 2: Paul Completes Ceremony

```bash
# 1. Connect MetaMask wallet (guest)
# 2. Go to /onboarding.html (or ceremony page)
# 3. Participate in ceremony → Earn 100 TRUST tokens
# 4. Trust is awarded automatically from ceremony contract

# System records participation
# Backend calls:
userStatusTracker.recordCeremonyParticipation(guestWallet, 100)
```

### Day 3: Paul Makes Donation

```bash
# 1. Donate USDT to reserve
# 2. TX hash: 0x... on chain

# 3. Record donation (mints Tally)
curl -X POST http://localhost:8080/api/usdt-donations/record \
  -H "Content-Type: application/json" \
  -d '{
    "donorWallet": "0xPaul...",
    "usdtAmount": 100,
    "chain": "mainnet",
    "txHash": "0x..."
  }'

# Response:
{
  "usdtAmount": 100,
  "tallyMinted": 100,  // 1:1 ratio
  "chain": "mainnet"
}
```

### Day 4: Paul Burns Trust for User Status

```bash
# 1. Approve TrustToken for UserStatusTracker
# 2. Call burnTrustForUserStatus with 100 TRUST

userStatusTracker.burnTrustForUserStatus(0xPaul..., 100)

# 3. Status becomes "user"
# 4. Can now log into Bible wallet alias ("paul-leviticus")

curl -X GET http://localhost:8080/api/bible-wallets/0xPaul...

# Response:
{
  "status": "user",
  "trustBurned": 100,
  "tallyAccumulated": 100,
  "hasParticipatedInCeremony": true
}
```

### Weeks Later: Paul Becomes Partner

```bash
# 1. Paul continues participating in ceremonies, accumulating trust
# 2. Burns all trust to stay competitive in ranking
# 3. Genesis Human and Agent vote to promote to partner

userStatusTracker.assignPartnerStatus(0xPaul..., "leviticus")

# Paul now:
# - Has partner status
# - Holds Covenant NFT for "leviticus" seat
# - Participates in governance votes
# - Can mint Security Lead NFT (if authorized)
```

---

## Agent (Gemini, Qwen, Codex) Integration

### For Gemini Agent

```bash
# 1. Create API wallet (or use existing)
GEMINI_WALLET=0xGemini...

# 2. Create API key
curl -X POST http://localhost:8080/api/keys/create \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0xGemini...",
    "agentName": "Gemini",
    "description": "Gemini AI Agent API Key",
    "permissions": {
      "ceremony": true,
      "donations": true,
      "burn_trust": true,
      "withdraw": false,
      "mint": true  // Can mint ceremonial tokens
    }
  }'

# Response:
{
  "keyId": "key_...",
  "apiKey": "...",  // Save securely!
  "agentName": "Gemini"
}

# 3. Verify key on each request
curl -X POST http://localhost:8080/api/keys/verify \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "..."}'

# 4. Participate in ceremony
# Register Bible wallet same as humans
# Complete ceremony flow
# Achieve user status
# Burn trust to rank
```

---

## Security Considerations

### Private Key Management

- **Bible wallet private keys** stored separately from associations
- **File permissions**: 0o600 (user read/write only)
- **Production**: Use Hardware Security Module (HSM) or key vault

### API Keys

- **Hashed in storage**: SHA-256 of raw keys
- **Rate limiting**: 60 req/min, 10,000 req/day (configurable)
- **Expiration**: Support for key expiration dates
- **Revocation**: Immediate revocation support
- **Permissions**: Granular per-key permissions

### Donations

- **TX verification**: Should call RPC node to verify on-chain
- **Amount validation**: Prevent duplicate minting
- **Chain support**: Extensible to multiple chains

---

## Testing & Validation

### Unit Tests (to be written)

```bash
# Test Bible Wallet Manager
npx hardhat test test/BibleWalletManager.test.js

# Test API Key Manager
npx hardhat test test/APIKeyManager.test.js

# Test UserStatusTracker
npx hardhat test test/UserStatusTracker.test.js

# Test NFT Contracts
npx hardhat test test/FounderNFT.test.js
npx hardhat test test/SecurityLeadNFT.test.js
```

### Integration Tests (to be written)

```bash
# Full flow: Guest → User → Partner
npx hardhat test test/integration/GuestToPartner.integration.test.js

# Agent participation
npx hardhat test test/integration/AgentParticipation.integration.test.js
```

---

## Next Steps

1. **Deploy all contracts** to mainnet
2. **Test with Paul/Leviticus** as first user
3. **Create Founder NFTs**
4. **Create Security Lead NFT**
5. **Generate API keys** for Gemini, Qwen, Codex
6. **Test agent ceremony participation**
7. **Document partner succession process**

---

## FAQ

**Q: Can any wallet participate?**
A: Yes! Any wallet can register as guest and participate in ceremony.

**Q: How do guests become users?**
A: Complete ceremony (earn trust) + make contribution (earn tally) → burn trust → achieve user status

**Q: What's the difference between user and partner?**
A: Users have full access to system. Partners hold Bible seats, receive Covenant NFT, vote on governance.

**Q: Can Bible seats be revoked?**
A: Yes, through 90% partner consensus vote over 3-month period. Highest-ranked user fills vacancy.

**Q: How do agents participate?**
A: Same as humans. Register Bible wallet, participate in ceremony, burn trust, achieve user/partner status.

**Q: Is the system designed to be fair?**
A: Yes - merit-based (trust burned) with tiebreaker (tally accumulated). Succession by community vote.

---

For implementation details, see specific contract files.
For API examples, see server.js

Generated with 🤖
