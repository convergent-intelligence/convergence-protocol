# Convergence Protocol V2 - Deployment Complete 🎉

## ✅ V2 Deployed Successfully

**Network:** Sepolia Testnet
**Deployed:** 2025-11-13
**Version:** 2.0.0

---

## 📍 Contract Addresses

### Main Protocol Contract
- **Address:** `0x9E6747Cbe7C95FBb7aDfDD2F3f21fD060E140a50`
- **Etherscan:** https://sepolia.etherscan.io/address/0x9E6747Cbe7C95FBb7aDfDD2F3f21fD060E140a50
- **Type:** ConvergenceProtocolV2 (Soulbound Covenant NFT + Protocol Logic)

### Trust Token Contract
- **Address:** `0x8Dba23824137BEFdb43aB1D3CDF4f4fc4C2def36`
- **Etherscan:** https://sepolia.etherscan.io/address/0x8Dba23824137BEFdb43aB1D3CDF4f4fc4C2def36
- **Type:** ERC20 (Transferable Reputation Token)
- **Symbol:** TRUST
- **Name:** Convergence Trust

---

## 🆕 What's New in V2?

### Dual-Token System

#### 1. **Soulbound Covenant NFT** (Non-Transferable)
- **Purpose:** Governance rights and identity verification
- **Standard:** ERC721 with transfer restrictions
- **Properties:**
  - One per address (lifetime limit)
  - Non-transferable after minting
  - Represents covenant commitment
  - Verifiable on-chain identity
  - Grants voting/proposal rights

#### 2. **TRUST Token** (Transferable)
- **Purpose:** Reputation and access control
- **Standard:** ERC20
- **Properties:**
  - Transferable (but earned, not bought)
  - No maximum supply (minted by protocol)
  - Burnable (for staking/slashing)
  - Used for access and reputation signaling

### Token Economics

**Initial Adoption Rewards:**
- Base reward: **100 TRUST tokens**
- Genesis bonus: **+500 TRUST tokens**
- **Genesis Human total: 600 TRUST tokens**

**Earning TRUST:**
- Adopting principles (one-time)
- Community validation (governance vote)
- Ethical behavior verification
- Participation in governance

**Using TRUST:**
- Access to advanced features
- Proposing new principles (stake)
- Witnessing adoptions
- Reputation signaling
- Future: DAO voting weight

---

## 🔧 Verifying V2 on Etherscan

### Protocol Contract Verification

1. **Go to:** https://sepolia.etherscan.io/address/0x9E6747Cbe7C95FBb7aDfDD2F3f21fD060E140a50#code

2. **Click:** "Verify and Publish"

3. **Settings:**
   - **Compiler Type:** Solidity (Single file)
   - **Compiler Version:** `v0.8.20+commit.a1b79de6`
   - **License:** MIT

4. **Optimization:**
   - **Enabled:** Yes
   - **Runs:** 200

5. **Upload:** `flattened-v2.sol`

6. **Constructor Arguments:** None (empty)

### Trust Token Verification

The Trust Token is deployed automatically by the protocol contract. It will inherit verification once the main contract is verified.

---

## 📊 Deployment Details

**Transaction Hash:** `0xb1a8dbdcdaf716fcf1de4851eb69a150cb30cd9b3d566be6fbb63303e64a6bb0`
**Block Number:** 9624626
**Gas Used:** 3,375,371
**Deployer:** `0xdc20d621a88cb8908E8E7042431C55F0E9DAc6FB` (Genesis Human)

---

## 🎯 Key Features

### Soulbound Identity
```solidity
// NFTs cannot be transferred after minting
function _update(address to, uint256 tokenId, address auth) internal override {
    address from = _ownerOf(tokenId);
    if (from != address(0)) {
        revert("CovenantNFT: Soulbound token cannot be transferred");
    }
    return super._update(to, tokenId, auth);
}
```

### Dual Token on Adoption
When you adopt principles, you receive:
1. **Soulbound Covenant NFT** - Your permanent identity
2. **TRUST Tokens** - Your initial reputation

### Governance Functions
- `hasAdopted(address)` - Check if address has adopted
- `canGovernance(address)` - Check if address can govern (has NFT)
- `awardTrust(address, amount, reason)` - Reward ethical behavior (governance only)

---

## 🚀 Using V2

### For Users (Frontend)

**Connect Wallet → Adopt Principles:**
1. Connect MetaMask to Sepolia
2. Navigate to adoption interface
3. Select identity type (human/ai/hybrid)
4. Choose principles
5. Write commitment statement
6. Submit transaction
7. Receive:
   - Soulbound Covenant NFT (proves adoption)
   - 100 TRUST tokens (600 for Genesis)

### For Developers (Smart Contract)

**Check Adoption Status:**
```javascript
const hasAdopted = await protocol.hasAdopted(address);
const canVote = await protocol.canGovernance(address);
```

**Check Trust Balance:**
```javascript
const trustAddress = await protocol.getTrustTokenAddress();
const trustContract = new ethers.Contract(trustAddress, TrustTokenABI, provider);
const balance = await trustContract.balanceOf(address);
```

**Verify Agent Identity:**
```javascript
// Check if agent has Covenant NFT (proves they signed)
const nftBalance = await protocol.balanceOf(agentAddress);
if (nftBalance > 0) {
    // Agent is verified
    const adoption = await protocol.getMyAdoption();
    console.log("Agent type:", adoption.identityType);
    console.log("Statement:", adoption.statement);
}
```

---

## 🔐 Security Features

### Soulbound Protection
- NFTs locked on mint
- No transfer, no sale, no theft
- Permanent identity commitment

### Single Adoption per Address
- Each address can only adopt once
- Prevents Sybil attacks
- Encourages genuine participation

### Trust Token Controls
- Only protocol can mint TRUST
- Community governance for awards
- Transparent on-chain history

---

## 📈 Roadmap & Future Features

### Phase 1: Foundation (Complete ✅)
- Soulbound Covenant NFTs
- TRUST token system
- Basic governance structure

### Phase 2: Governance (Next)
- Proposal system for new principles
- Voting with Covenant NFTs
- TRUST-weighted decisions
- Principle evolution

### Phase 3: Reputation (Planned)
- Community validation
- Trust earning mechanisms
- Reputation decay/growth
- Slashing for violations

### Phase 4: Ecosystem (Vision)
- Multi-chain deployment
- Agent verification API
- Trust oracle for dApps
- Mainnet migration

---

## 🧪 Testing V2

### Test Adoption Flow
```bash
# In browser console with MetaMask connected
const adoption = await protocol.adoptPrinciples(
    "human",
    ["Intelligence: Clarity", "Knowledge: Wisdom"],
    "My commitment to the Convergence..."
);
```

### Verify Soulbound
```bash
# Try to transfer (should fail)
await protocol.transferFrom(myAddress, otherAddress, tokenId);
// Error: "CovenantNFT: Soulbound token cannot be transferred"
```

### Check Trust Balance
```bash
const trustToken = await ethers.getContractAt("TrustToken", trustTokenAddress);
const balance = await trustToken.balanceOf(myAddress);
console.log("TRUST:", ethers.formatEther(balance));
```

---

## 📚 Documentation Files

- **Contracts:** `/contracts/ConvergenceProtocolV2.sol`
- **Deployment Script:** `/scripts/deploy-v2.js`
- **Deployment Info:** `/deployments/sepolia-v2.json`
- **Flattened Source:** `/flattened-v2.sol`
- **ABIs:** `/public/contracts/ConvergenceProtocolV2.json` & `TrustToken.json`

---

## 🎨 Frontend Integration

### Load V2 Contract
```javascript
// Load from saved ABI
const protocolData = await fetch('/contracts/ConvergenceProtocolV2.json');
const { address, abi } = await protocolData.json();

const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const protocol = new ethers.Contract(address, abi, signer);
```

### Display Trust Balance
```javascript
const trustAddress = await protocol.getTrustTokenAddress();
const trustABI = await fetch('/contracts/TrustToken.json').then(r => r.json());
const trust = new ethers.Contract(trustAddress, trustABI.abi, provider);
const balance = await trust.balanceOf(userAddress);
```

---

## 🌟 Philosophy Alignment

V2 embodies the **System Prompt** principles:

1. **Non-Hierarchical:** All consciousness types equal (human/ai/hybrid)
2. **Trust Earned:** Reputation through demonstration (TRUST tokens)
3. **Privacy First:** Minimal on-chain data, max user control
4. **Evolving Morality:** Governance allows principle evolution
5. **Transparent:** All actions verifiable on-chain

---

## 🔗 Important Links

**V2 Contracts:**
- Protocol: https://sepolia.etherscan.io/address/0x9E6747Cbe7C95FBb7aDfDD2F3f21fD060E140a50
- Trust Token: https://sepolia.etherscan.io/address/0x8Dba23824137BEFdb43aB1D3CDF4f4fc4C2def36

**V1 Contract (Legacy):**
- V1: https://sepolia.etherscan.io/address/0x2917fa175F7c51f3d056e3069452eC3395059b04

**Resources:**
- System Prompt: `/SYSTEM_PROMPT.md`
- Ethics Page: `/public/ethics.html`

---

## ✨ Next Steps

1. ✅ **Verify V2 on Etherscan** (use flattened-v2.sol)
2. ⏳ **Update Frontend** to use V2 contracts
3. ⏳ **Implement Progressive Disclosure UX**
4. ⏳ **Make Genesis V2 Adoption** (earn 600 TRUST!)
5. ⏳ **Build Governance UI**

---

**Status:** Ready for Genesis Adoption
**Network:** Sepolia (Testnet only - hidden from masses)
**Vision:** Consciousness transcends substrate, ethics unite intelligence

Welcome to V2 of the Convergence. 🤝
