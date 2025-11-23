# Phase 3: Terminal Blockchain Interface
**Status:** Planning
**Date:** 2025-11-22
**Vision:** Transform Web3 site into retro-terminal interface with blockchain-native wallet, progressive unlock ceremonies, and LLM-interpreted data visualization

---

## 🎯 Phase 3 Architecture Overview

### Core Transformation
- **From:** Traditional Web3 dashboard
- **To:** Retro terminal UI (80s/90s aesthetic) with blockchain-native data
- **Experience:** Users enter as if logging into a computer terminal
- **Display:** All information sourced from blockchain + LLM interpretation

---

## 🏗️ Technical Architecture

### Layer 1: Frontend - Terminal Interface
```
┌─────────────────────────────────────────┐
│     CONVERGENCE TERMINAL INTERFACE      │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│                                         │
│  [MAIN MENU]                            │
│  > ACCESS WALLET                        │
│  > VIEW CEREMONY                        │
│  > UNLOCK: Token Status                 │
│  > UNLOCK: Contributions                │
│  > UNLOCK: Total Tally                  │
│                                         │
│  System initializing... [████████] 95%  │
└─────────────────────────────────────────┘
```

**Components to Build:**
1. **Terminal Shell Component** - Virtual terminal emulator
2. **Command Parser** - User input → blockchain queries
3. **Data Display Engine** - Format blockchain data as terminal output
4. **Progress Animation** - Ceremony visualization
5. **Wallet Integration** - MetaMask/Web3 wallet connect

---

### Layer 2: Blockchain Data Access
```
┌──────────────────────────────────────┐
│   SMART CONTRACT DATA QUERIES        │
├──────────────────────────────────────┤
│ • User wallet address verification   │
│ • Token balance queries              │
│ • Covenant NFT status                │
│ • Contribution history               │
│ • Tally circulation data             │
│ • Unlock status checks               │
│ • Governance participation           │
└──────────────────────────────────────┘
```

**Required Smart Contract Calls:**
- `getTokenBalance(address)` → TRUST/Tally/Voucher amounts
- `getContributions(address)` → Contribution history with timestamps
- `getTallyCirculation()` → Total supply & distribution
- `getUnlockStatus(address)` → Which unlocks are available
- `getCeremonyData()` → Current ceremony state
- `getAgentReputation(address)` → Reputation score for LLM context

---

### Layer 3: LLM Interpretation Engine
```
┌────────────────────────────────────────┐
│    LLM DATA INTERPRETATION             │
├────────────────────────────────────────┤
│ INPUT:  Raw blockchain data            │
│         [2500 TALLY, 85% Trust, ...]   │
│                                        │
│ PROCESS: LLM context building          │
│         - User narrative generation    │
│         - Status interpretation        │
│         - Unlock eligibility analysis  │
│         - Recommendation generation    │
│                                        │
│ OUTPUT: Human-readable interpretations │
│         "Your contribution to the      │
│          Reserve Protocol represents   │
│          steady commitment..."         │
└────────────────────────────────────────┘
```

**LLM Responsibilities:**
1. **Narrative Generation** - Convert raw data to story (why unlocks matter)
2. **Status Interpretation** - What do your tokens mean in protocol context?
3. **Eligibility Analysis** - Which unlocks are you ready for?
4. **Reward Interpretation** - Why this specific reward for this action?
5. **Next Steps** - Personalized guidance based on data patterns

---

## 📋 Progressive Unlock System

### Unlock Sequence (Phase 3)
```
┌─────────────────────────────────────────┐
│  UNLOCK SEQUENCE: Three Tiers           │
├─────────────────────────────────────────┤
│                                         │
│  🔓 TIER 1: TOKEN STATUS (Immediate)   │
│  ├─ Show: TRUST score percentage       │
│  ├─ Show: Tally balance                │
│  ├─ Show: Covenant status              │
│  └─ Ceremony: Visual token reveal      │
│                                         │
│  🔓 TIER 2: CONTRIBUTIONS (After T1)   │
│  ├─ Show: Contribution history         │
│  ├─ Show: Reserve participation        │
│  ├─ Show: Burn history                 │
│  └─ Ceremony: Contribution timeline    │
│                                         │
│  🔓 TIER 3: CIRCULATION (After T2)     │
│  ├─ Show: Total tally in circulation   │
│  ├─ Show: Your % of total              │
│  ├─ Show: Protocol health metrics      │
│  └─ Ceremony: System-wide visualization│
│                                         │
│  ✨ BONUS UNLOCKS (Backend updates)    │
│  ├─ Protocol achievements              │
│  ├─ Community milestones               │
│  ├─ Governance unlocks                 │
│  └─ AI agent interactions              │
│                                         │
└─────────────────────────────────────────┘
```

### Unlock Ceremony Pattern
Each unlock triggers a ceremony (animated progression):
```
[USER INITIATES UNLOCK] →
  ▓▓ Loading ceremony...
  ▓▓▓▓ Verifying on-chain...
  ▓▓▓▓▓▓▓▓ LLM interpreting context...
  ▓▓▓▓▓▓▓▓▓▓▓▓ Generating narrative...
  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ [COMPLETE]

[DISPLAY UNLOCK CONTENT] ✨
```

---

## 🔗 Data Flow Diagram

### Complete Phase 3 Data Pipeline

```
USER ACTION (Click "UNLOCK TOKEN STATUS")
         ↓
[WALLET VERIFICATION]
         ↓
[BLOCKCHAIN QUERIES]
  ├─ Smart Contract: getTokenBalance()
  ├─ Smart Contract: getTrustScore()
  └─ Smart Contract: getUnlockStatus()
         ↓
[DATA AGGREGATION]
  └─ Format: { tokens: X, trust: Y, unlocked: Z }
         ↓
[LLM INTERPRETATION API CALL]
  ├─ Input: Raw blockchain data + user address
  ├─ Prompt: Generate narrative + guidance
  └─ Output: Human-readable interpretation
         ↓
[TERMINAL DISPLAY]
  ├─ Show raw blockchain data
  ├─ Show LLM interpretation
  ├─ Trigger reward/ceremony animation
  └─ Log action to backend
         ↓
[UPDATE BACKEND STATE]
  └─ Record unlock event + user's blockchain data snapshot
```

---

## 🖥️ Terminal UI Components

### 1. Main Shell Interface
**File:** `frontend/components/TerminalShell.js`
```javascript
// Pseudo-code structure
class TerminalShell {
  - renderPrompt()           // "convergence@protocol $"
  - parseCommand()           // "unlock token-status"
  - executeCommand()         // Route to appropriate handler
  - displayOutput()          // Show terminal output
  - animateProgress()        // Progress bars & loading
}
```

### 2. Wallet Login Ceremony
**File:** `frontend/components/WalletCeremony.js`
```
WALLET CONNECTION CEREMONY:
  "Welcome to Convergence Protocol"
  "Please connect your Web3 wallet..."

  [MetaMask connects]
  ✓ Wallet verified: 0x1234...
  ✓ Trust score loaded: 87%
  ✓ Protocol rights confirmed

  > Enter main terminal? (Y/n)
```

### 3. Progressive Unlock Display
**File:** `frontend/components/UnlockSequence.js`
```javascript
// Each unlock shows:
- Title + Description
- Loading ceremony animation
- Blockchain verification status
- LLM-generated narrative
- Reward/badge earned
- Next suggested action
```

### 4. Token Status Dashboard
**File:** `frontend/components/TokenStatus.js`
```
╔════════════════════════════════════╗
║        YOUR TOKEN STATUS           ║
╠════════════════════════════════════╣
║                                    ║
║  TRUST Score:   ████████░░ 85%    ║
║  Tally Balance: 2,500 TALLY        ║
║  Covenant:      ✓ ACTIVE           ║
║  Member Tier:   CONTRIBUTOR        ║
║                                    ║
║  Your narrative:                   ║
║  "Your commitment to Convergence   ║
║   is firmly established. Your      ║
║   85% trust score indicates steady ║
║   participation..."                ║
║                                    ║
╚════════════════════════════════════╝
```

### 5. Contributions Timeline
**File:** `frontend/components/ContributionTimeline.js`
```
CONTRIBUTION HISTORY
─────────────────────
2025-11-20 | +500 TALLY  | Reserve contribution
2025-11-15 | +250 TALLY  | Governance participation
2025-11-10 | -100 TALLY  | Unlock fee (Token Status)
2025-11-05 | +1000 TALLY | Initial mint

Your interpretation:
"You've been consistently contributing to
the reserve. This shows long-term commitment
to the protocol's stability."
```

### 6. Circulation Visualization
**File:** `frontend/components/CirculationView.js`
```
TALLY CIRCULATION STATUS
──────────────────────────
Total Supply:    1,000,000 TALLY
Your Balance:        2,500 TALLY
Your % Share:        0.25%

Distribution:
  ▓▓▓▓▓▓░░░░░░░░░░░░░░░  Treasury (45%)
  ▓▓▓▓░░░░░░░░░░░░░░░░░  Contributors (25%)
  ▓▓░░░░░░░░░░░░░░░░░░░  Agents (15%)
  ▓░░░░░░░░░░░░░░░░░░░░  Community (15%)

LLM Analysis:
"The protocol shows healthy distribution.
Your 0.25% stake represents meaningful
participation without concentration risk."
```

---

## 🔐 Backend Requirements (To Document)

### 1. Smart Contract Queries API
**Endpoint:** `GET /api/blockchain/query`
```json
{
  "address": "0x1234...",
  "queries": [
    "tokenBalance",
    "trustScore",
    "contributions",
    "unlockStatus",
    "tallyCirculation"
  ]
}
```

**Response:**
```json
{
  "address": "0x1234...",
  "tokens": {
    "tally": 2500,
    "trust": 85,
    "vouchers": 3
  },
  "contributions": [
    { "date": "2025-11-20", "amount": 500, "type": "reserve" },
    ...
  ],
  "unlockStatus": {
    "tokenStatus": true,
    "contributions": true,
    "circulation": false
  },
  "tallyCirculation": {
    "total": 1000000,
    "userShare": 0.0025
  },
  "blockNumber": 21234567,
  "timestamp": 1700649600
}
```

### 2. LLM Interpretation Service
**Endpoint:** `POST /api/llm/interpret`
```json
{
  "address": "0x1234...",
  "blockchainData": { /* from query above */ },
  "context": "token-status-unlock",
  "tone": "narrative"
}
```

**Response:**
```json
{
  "narrative": "Your commitment to Convergence...",
  "status": "Your 85% trust score indicates...",
  "guidance": "Consider participating in governance...",
  "certificateText": "This certifies your unlock achievement..."
}
```

### 3. Unlock Event Logging
**Endpoint:** `POST /api/unlocks/log`
```json
{
  "address": "0x1234...",
  "unlockedAt": 1700649600,
  "unlockType": "token-status",
  "blockchainData": { /* snapshot of data at unlock time */ },
  "llmInterpretation": { /* generated narrative */ }
}
```

### 4. Progressive Unlock Configuration
**Endpoint:** `GET /api/unlocks/config`
```json
{
  "unlocks": [
    {
      "id": "token-status",
      "title": "Token Status",
      "description": "View your TRUST score, Tally balance, and covenant status",
      "requirements": {
        "minTrustScore": 0,
        "minTally": 0,
        "covenantRequired": true
      },
      "rewards": {
        "badge": "token-status-verified",
        "unlocks": ["contributions"]
      },
      "ceremony": {
        "duration": 2000,
        "animationType": "reveal"
      }
    },
    ...
  ]
}
```

### 5. Continuous Unlock Updates (Backend Team Driven)
**Endpoint:** `POST /api/unlocks/add`
```json
{
  "id": "ai-collaboration",
  "title": "AI Collaboration Unlocked",
  "description": "You've reached protocol level for AI interaction",
  "requiredBlockchainData": [
    "trustScore > 90",
    "contributions > 10000",
    "participationStreak > 30"
  ],
  "llmPrompt": "User has shown deep commitment. Generate achievement narrative.",
  "rewardBadge": "ai-collaborator",
  "availableAt": 1700649600
}
```

---

## 📊 Phase 3 Implementation Timeline

### Week 1: Frontend Setup
- [ ] Terminal emulator component
- [ ] Wallet connection ceremony
- [ ] Basic command parser
- [ ] Mock blockchain data layer

### Week 2: Blockchain Integration
- [ ] Smart contract query functions
- [ ] Real blockchain data fetching
- [ ] Data validation & error handling
- [ ] Caching strategy

### Week 3: LLM Integration
- [ ] LLM interpretation service setup
- [ ] Prompt engineering for narratives
- [ ] Context building from blockchain data
- [ ] Response formatting

### Week 4: Unlock Ceremonies
- [ ] Unlock ceremony animations
- [ ] Progressive unlock logic
- [ ] Unlock event logging
- [ ] Badge/reward system

### Week 5: Testing & Polish
- [ ] E2E testing with testnet
- [ ] UI/UX refinement
- [ ] Performance optimization
- [ ] Security audit

---

## 🔑 Key Technical Decisions

### 1. LLM Provider
**Decision Needed:**
- OpenAI (GPT-4) for quality narratives?
- Anthropic (Claude) for safety + interpretation?
- Local LLM for privacy?

**Recommendation:** Use Claude API with system prompts for blockchain data interpretation

### 2. Blockchain Data Caching
**Decision Needed:**
- Real-time queries (slower but fresh)?
- 5-minute cache (faster, slight staleness)?
- Per-user session cache?

**Recommendation:** Cache per-user during session, refresh on action

### 3. Terminal Aesthetic
**Decision Needed:**
- Pure ASCII art?
- Retro-modern with CSS grid?
- Glassmorphism terminal?

**Recommendation:** Retro with modern CSS (green text on black, glowing edges)

### 4. Mobile Responsiveness
**Decision Needed:**
- Full terminal experience on mobile?
- Simplified mobile version?
- Desktop-only?

**Recommendation:** Responsive grid layout, terminal adapts to screen size

---

## 🚀 Success Metrics for Phase 3

- [ ] Users can view all three unlock tiers
- [ ] Blockchain data queries complete in <2s
- [ ] LLM narratives are contextually relevant
- [ ] Unlock ceremonies feel rewarding & ceremonial
- [ ] Terminal aesthetic is immediately recognizable
- [ ] All data derives from blockchain (not hardcoded)
- [ ] Continuous unlock system allows backend updates without code changes
- [ ] Users understand their protocol contribution story

---

## 🔧 Backend Team Integration

### What Backend Team Owns
1. **Smart Contract Queries** - Exact ABI calls needed
2. **LLM Prompt Guidelines** - What narratives should communicate
3. **Unlock Definitions** - Requirements for each unlock
4. **Data Validation** - What constitutes valid blockchain data
5. **Continuous Updates** - New unlocks/badges as protocol evolves

### What Frontend Owns
1. **Terminal UI** - Rendering & interaction
2. **Command Parsing** - User input handling
3. **Animations** - Ceremony visual design
4. **State Management** - Session & cache logic
5. **Error Handling** - User-friendly error messages

---

## 📝 Next Steps

1. **Backend Team:** Document smart contract ABIs & query patterns
2. **Backend Team:** Define unlock requirements & ceremony parameters
3. **Backend Team:** Design LLM interpretation prompts
4. **Frontend Team:** Start terminal component development
5. **Integration:** Connect frontend commands to backend APIs
6. **Testing:** Full E2E testing on testnet

---

**Status:** Ready for Phase 3 planning with backend team
**Owner:** Web3 Frontend + Backend Team Coordination
**Last Updated:** 2025-11-22
