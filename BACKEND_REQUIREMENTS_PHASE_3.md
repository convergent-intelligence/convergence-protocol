# Backend Requirements for Phase 3: Terminal Interface
**Status:** Requirements Definition
**Date:** 2025-11-22
**Audience:** Backend Team (BBS Blockchain Interface Designers)
**Priority:** HIGH - Blocks Frontend Development

---

## 📋 Executive Summary

The Phase 3 terminal interface requires backend services to:
1. **Query blockchain data** efficiently and reliably
2. **Interpret blockchain data** using LLM to generate human narratives
3. **Manage progressive unlocks** dynamically (without frontend code changes)
4. **Log user interactions** with blockchain data snapshots
5. **Continuously update** unlock definitions as protocol evolves

This document specifies exact API contracts, data schemas, and service responsibilities.

---

## 🔗 Section 1: Smart Contract Query Service

### 1.1 Purpose
Provide a unified API endpoint for fetching all blockchain data needed by the terminal interface. Abstract away smart contract complexity; return semantic data.

### 1.2 Endpoint Specification

**URL:** `GET /api/blockchain/user-profile`

**Parameters:**
```
address (string, required): User's Ethereum address
  Example: "0x1234567890abcdef1234567890abcdef12345678"

blockNumber (integer, optional): Query at specific block
  Default: latest

includeHistory (boolean, optional): Include contribution history
  Default: true
```

**Response Schema:**
```json
{
  "status": "success",
  "data": {
    "address": "0x1234...",
    "verifiedAt": 1700649600,
    "blockNumber": 21234567,

    "tokens": {
      "trust": {
        "percentage": 87,
        "description": "Your trust score in the protocol",
        "trend": "stable",
        "lastUpdate": 1700649600
      },
      "tally": {
        "balance": 2500,
        "decimals": 18,
        "symbol": "TALLY",
        "lastUpdate": 1700649600
      },
      "vouchers": {
        "balance": 3,
        "symbol": "VOUCHER",
        "types": ["unlock-tier-1", "unlock-tier-2", "bonus-badge"],
        "lastUpdate": 1700649600
      }
    },

    "covenantStatus": {
      "minted": true,
      "contractAddress": "0xabcd...",
      "tokenId": 42,
      "tier": "contributor",
      "mintedAt": 1700000000
    },

    "contributions": [
      {
        "id": "contribution_1",
        "timestamp": 1700649600,
        "type": "reserve-deposit",
        "amount": 500,
        "tokenType": "TALLY",
        "transactionHash": "0xabcd...",
        "description": "Reserve contribution"
      },
      {
        "id": "contribution_2",
        "timestamp": 1700600000,
        "type": "governance-vote",
        "amount": 0,
        "tokenType": null,
        "transactionHash": "0xdef1...",
        "description": "Voted on governance proposal #5"
      }
    ],

    "circulations": {
      "totalSupply": 1000000,
      "userBalance": 2500,
      "userPercentage": 0.25,
      "distribution": {
        "treasury": {
          "percentage": 45,
          "amount": 450000
        },
        "contributors": {
          "percentage": 25,
          "amount": 250000
        },
        "agents": {
          "percentage": 15,
          "amount": 150000
        },
        "community": {
          "percentage": 15,
          "amount": 150000
        }
      },
      "lastUpdate": 1700649600
    },

    "governance": {
      "votingPower": 2500,
      "proposalsVotedOn": 12,
      "delegatedFrom": null,
      "delegatedTo": null
    },

    "agentInteraction": {
      "agentsContacted": ["Agent", "Leviticus"],
      "lastInteraction": 1700600000,
      "interactionCount": 5
    }
  },

  "metadata": {
    "cached": false,
    "cacheExpiration": 1700649660,
    "dataAge": 0,
    "queries": [
      "balanceOf(address)",
      "getTrustScore(address)",
      "getContributions(address)",
      "getTallyCirculation()"
    ]
  }
}
```

### 1.3 Error Handling
```json
{
  "status": "error",
  "error": {
    "code": "INVALID_ADDRESS",
    "message": "Invalid Ethereum address format",
    "details": "Address must be 42 characters starting with 0x"
  }
}
```

**Possible Errors:**
- `INVALID_ADDRESS` - Address format incorrect
- `ADDRESS_NOT_FOUND` - Address has no covenant/trust score
- `RPC_ERROR` - Blockchain node error
- `CONTRACT_ERROR` - Smart contract revert
- `TIMEOUT` - Query took too long

### 1.4 Performance Requirements
- **Response Time:** < 2 seconds (p95)
- **Cache Strategy:** 5-minute TTL per address
- **Concurrent Users:** Support 1000+ simultaneous queries
- **Failover:** Return cached data if RPC unavailable

---

## 🧠 Section 2: LLM Interpretation Service

### 2.1 Purpose
Transform raw blockchain data into human-readable narratives. Context-aware, personalized, aligned with protocol values.

### 2.2 Endpoint Specification

**URL:** `POST /api/llm/interpret`

**Request Body:**
```json
{
  "address": "0x1234...",
  "context": "token-status-unlock",
  "blockchainData": {
    "trust": 87,
    "tallyBalance": 2500,
    "contributions": 5,
    "governanceParticipation": 12
  },
  "tone": "ceremonial",
  "maxTokens": 200
}
```

**Context Types:**
- `token-status-unlock` - First unlock ceremony
- `contributions-unlock` - Contribution history reveal
- `circulation-unlock` - System-wide status reveal
- `guidance` - What to do next
- `achievement` - Award/badge earned
- `status-check` - General status interpretation

**Tone Options:**
- `ceremonial` - Formal, meaningful, celebratory
- `analytical` - Data-driven, technical
- `encouraging` - Positive reinforcement
- `guidance` - Next steps & recommendations

**Response Schema:**
```json
{
  "status": "success",
  "data": {
    "interpretation": {
      "narrative": "Your commitment to the Convergence Protocol is firmly established. Your 87% trust score indicates consistent participation and reliability within the ecosystem. You've contributed meaningfully across five different initiatives, demonstrating diverse engagement.",

      "keyInsights": [
        "Your trust score places you in the top 15% of protocol participants",
        "Your 2500 TALLY represents 0.25% of total circulation",
        "You've participated in 12 governance votes",
        "Consistent 6-week participation streak"
      ],

      "currentStatus": "You are an active contributor with significant protocol authority",

      "nextSteps": [
        "Consider increasing your reserve contributions for higher rewards",
        "Your trust score qualifies you for advanced governance proposals",
        "You're eligible to mentor new members"
      ],

      "certificateText": "This certifies that the holder has demonstrated strong commitment to the Convergence Protocol, maintaining an 87% trust score and contributing meaningfully to the ecosystem.",

      "metadata": {
        "tone": "ceremonial",
        "timestamp": 1700649600,
        "model": "claude-3-5-sonnet",
        "inputTokens": 324,
        "outputTokens": 187,
        "costUSD": 0.0008
      }
    }
  }
}
```

### 2.3 System Prompt Template
Backend must implement LLM with this system context:

```
You are the Convergence Protocol interpreter. Your role is to transform
blockchain data into meaningful, personalized narratives that help users
understand their relationship with the protocol.

Guidelines:
1. Be truthful - never exaggerate or invent data
2. Be personal - address the user's specific achievements
3. Be ceremonial - make milestones feel significant
4. Be encouraging - positive reinforcement for participation
5. Be clear - explain technical concepts in human terms
6. Be respectful - honor the user's contribution
7. Be forward-looking - suggest next steps

Tone: {tone}
Context: {context}

User's blockchain data:
{blockchainData}

Generate a narrative that:
- Acknowledges their specific achievements
- Explains what their numbers mean
- Connects their participation to protocol health
- Offers personalized guidance
- Celebrates their milestone
```

### 2.4 LLM Integration Notes
- **Provider:** Anthropic Claude (preferred for interpretation)
- **Model:** claude-3-5-sonnet-20241022 (or latest)
- **Cost Control:** Batch requests, cache prompts
- **Safety:** No financial advice; only factual interpretation
- **Rate Limiting:** Max 100 requests/min per user

---

## 🔓 Section 3: Progressive Unlock Management

### 3.1 Purpose
Define all available unlocks, their requirements, and rewards. Allow continuous updates without frontend code changes.

### 3.2 Unlock Configuration API

**URL:** `GET /api/unlocks/config`

**Response Schema:**
```json
{
  "status": "success",
  "data": {
    "version": "1.0.0",
    "lastUpdated": 1700649600,

    "tierUnlocks": [
      {
        "id": "token-status",
        "tier": 1,
        "title": "Token Status",
        "subtitle": "View Your Protocol Credentials",
        "description": "Unlock your TRUST score, Tally balance, and covenant verification status. This is your first step in understanding your protocol standing.",

        "requirements": {
          "minTrustScore": 0,
          "minTallyBalance": 0,
          "covenantRequired": true,
          "minimumAge": 0,
          "prerequisiteUnlocks": []
        },

        "ceremony": {
          "type": "reveal",
          "duration": 2000,
          "animation": "cascade-reveal",
          "sound": "unlock-tier-1.mp3"
        },

        "displays": [
          {
            "component": "TrustScore",
            "format": "percentage-bar",
            "llmInterpretation": true
          },
          {
            "component": "TallyBalance",
            "format": "numeric",
            "llmInterpretation": false
          },
          {
            "component": "CovenantStatus",
            "format": "badge",
            "llmInterpretation": false
          }
        ],

        "rewards": {
          "badges": ["token-status-verified"],
          "unlocks": ["contributions"],
          "points": 100,
          "specialAccess": ["governance-dashboard"]
        },

        "llmContext": "This is the user's first unlock. Make it feel significant.",

        "active": true,
        "availableAt": 0,
        "deprecatedAt": null
      },

      {
        "id": "contributions",
        "tier": 2,
        "title": "Contribution History",
        "subtitle": "Track Your Reserve Participation",
        "description": "View your contribution history, reserve participation, and the impact of your engagement with the protocol.",

        "requirements": {
          "minTrustScore": 50,
          "minTallyBalance": 100,
          "covenantRequired": true,
          "minimumAge": 604800,
          "prerequisiteUnlocks": ["token-status"]
        },

        "ceremony": {
          "type": "timeline",
          "duration": 3000,
          "animation": "timeline-expand",
          "sound": "unlock-tier-2.mp3"
        },

        "displays": [
          {
            "component": "ContributionTimeline",
            "format": "chronological",
            "llmInterpretation": true
          },
          {
            "component": "ReserveParticipation",
            "format": "percentage",
            "llmInterpretation": false
          },
          {
            "component": "BurnHistory",
            "format": "list",
            "llmInterpretation": false
          }
        ],

        "rewards": {
          "badges": ["contributor-verified"],
          "unlocks": ["circulation"],
          "points": 250,
          "specialAccess": ["reserve-analytics"]
        },

        "llmContext": "User has shown sustained commitment. Acknowledge the breadth of their contributions.",

        "active": true,
        "availableAt": 1700000000,
        "deprecatedAt": null
      },

      {
        "id": "circulation",
        "tier": 3,
        "title": "Total Tally Circulation",
        "subtitle": "System-Wide Status",
        "description": "See the complete picture: total tally in circulation, your stake, and the protocol's economic health.",

        "requirements": {
          "minTrustScore": 75,
          "minTallyBalance": 500,
          "covenantRequired": true,
          "minimumAge": 1209600,
          "prerequisiteUnlocks": ["token-status", "contributions"]
        },

        "ceremony": {
          "type": "revelation",
          "duration": 4000,
          "animation": "system-wide-zoom",
          "sound": "unlock-tier-3.mp3"
        },

        "displays": [
          {
            "component": "TotalSupply",
            "format": "numeric-with-context",
            "llmInterpretation": true
          },
          {
            "component": "UserPercentage",
            "format": "donut-chart",
            "llmInterpretation": false
          },
          {
            "component": "ProtocolHealth",
            "format": "metrics-dashboard",
            "llmInterpretation": true
          }
        ],

        "rewards": {
          "badges": ["system-analyst"],
          "unlocks": [],
          "points": 500,
          "specialAccess": ["governance-analytics", "agent-interaction"]
        },

        "llmContext": "User now understands full protocol scope. Emphasize their role in the larger ecosystem.",

        "active": true,
        "availableAt": 1700000000,
        "deprecatedAt": null
      }
    ],

    "bonusUnlocks": [
      {
        "id": "governance-champion",
        "title": "Governance Champion",
        "description": "You've participated in 20+ governance votes. Your voice shapes the protocol.",
        "requirements": {
          "governanceVotes": { "minimum": 20 },
          "participationStreak": { "days": 30 },
          "trustScore": { "minimum": 80 }
        },
        "rewards": {
          "badges": ["governance-champion"],
          "points": 1000,
          "specialAccess": ["proposal-creation"]
        },
        "active": true
      },

      {
        "id": "ai-collaborator",
        "title": "AI Collaboration Unlocked",
        "description": "You've reached the level where AI agents trust your judgment.",
        "requirements": {
          "trustScore": { "minimum": 90 },
          "totalContributions": { "minimum": 10000 },
          "participationDays": { "minimum": 90 }
        },
        "rewards": {
          "badges": ["ai-collaborator"],
          "points": 2000,
          "specialAccess": ["agent-messaging", "collaborative-proposals"]
        },
        "active": true,
        "availableAt": 1700649600
      },

      {
        "id": "reserve-guardian",
        "title": "Reserve Guardian",
        "description": "Your contributions to the reserve exceed 50,000 TALLY. You're a protocol steward.",
        "requirements": {
          "totalReserveContributions": { "minimum": 50000 }
        },
        "rewards": {
          "badges": ["reserve-guardian"],
          "points": 3000,
          "specialAccess": ["reserve-council"]
        },
        "active": true
      }
    ]
  }
}
```

### 3.3 Check User Eligibility

**URL:** `GET /api/unlocks/eligibility`

**Parameters:**
```
address (string, required): User's Ethereum address
```

**Response Schema:**
```json
{
  "status": "success",
  "data": {
    "address": "0x1234...",
    "unlockedAt": 1700649600,

    "tiers": [
      {
        "id": "token-status",
        "unlocked": true,
        "unlockedAt": 1700600000,
        "progress": 100
      },
      {
        "id": "contributions",
        "unlocked": true,
        "unlockedAt": 1700600100,
        "progress": 100
      },
      {
        "id": "circulation",
        "unlocked": false,
        "requiredProgress": [
          {
            "requirement": "minTrustScore (75)",
            "current": 87,
            "progress": 100
          },
          {
            "requirement": "minTallyBalance (500)",
            "current": 2500,
            "progress": 100
          },
          {
            "requirement": "accountAge (14 days)",
            "current": 8,
            "progress": 57,
            "unlocksAt": "2025-12-06"
          },
          {
            "requirement": "prerequisites",
            "current": ["token-status", "contributions"],
            "progress": 100
          }
        ]
      }
    ],

    "bonusUnlocks": [
      {
        "id": "governance-champion",
        "unlocked": true,
        "unlockedAt": 1700640000,
        "nextMilestone": null
      },
      {
        "id": "ai-collaborator",
        "unlocked": false,
        "progress": 89,
        "nextMilestone": {
          "requirement": "trustScore (90)",
          "current": 87,
          "remaining": 3
        }
      }
    ]
  }
}
```

---

## 📝 Section 4: Unlock Event Logging

### 4.1 Purpose
Record when users unlock content. Capture blockchain data snapshot + LLM interpretation for history/audit.

### 4.2 Log Unlock Event

**URL:** `POST /api/unlocks/log`

**Request Body:**
```json
{
  "address": "0x1234...",
  "unlockId": "token-status",
  "blockNumber": 21234567,
  "blockchainDataSnapshot": {
    "trustScore": 87,
    "tallyBalance": 2500,
    "contributionCount": 5
  },
  "llmInterpretation": {
    "narrative": "Your commitment to Convergence...",
    "keyInsights": ["Top 15% of participants"]
  },
  "timestamp": 1700649600,
  "transactionHash": "0xabcd..."
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "logId": "log_12345",
    "address": "0x1234...",
    "unlockId": "token-status",
    "recordedAt": 1700649600,
    "stored": true
  }
}
```

### 4.3 Retrieve Unlock History

**URL:** `GET /api/unlocks/history`

**Parameters:**
```
address (string, required): User's Ethereum address
limit (integer, optional): Max results (default: 50)
offset (integer, optional): Pagination offset
```

**Response Schema:**
```json
{
  "status": "success",
  "data": {
    "address": "0x1234...",
    "totalUnlocks": 42,
    "unlockHistory": [
      {
        "logId": "log_12345",
        "unlockId": "ai-collaborator",
        "title": "AI Collaboration Unlocked",
        "unlockedAt": 1700649600,
        "blockNumber": 21234567,
        "narrative": "You've reached the level where AI agents trust...",
        "badgeEarned": "ai-collaborator"
      }
    ]
  }
}
```

---

## 🔄 Section 5: Continuous Unlock Updates

### 5.1 Purpose
Backend team can add/modify unlocks without frontend code changes. Updates deploy to all users immediately.

### 5.2 Add New Unlock

**URL:** `POST /api/unlocks/create`

**Request Body:**
```json
{
  "id": "protocol-elder",
  "title": "Protocol Elder",
  "description": "Six months of consistent participation.",
  "tier": "bonus",

  "requirements": {
    "participationDays": { "minimum": 180 },
    "trustScore": { "minimum": 85 },
    "totalContributions": { "minimum": 25000 }
  },

  "ceremony": {
    "type": "celebration",
    "duration": 5000,
    "animation": "elder-recognition"
  },

  "displays": [
    {
      "component": "ParticipationMilestone",
      "format": "timeline",
      "llmInterpretation": true
    }
  ],

  "rewards": {
    "badges": ["protocol-elder"],
    "points": 5000,
    "specialAccess": ["council-meetings", "strategic-input"]
  },

  "llmContext": "This user has been with the protocol since the beginning. Honor their journey.",

  "availableAt": 1704067200,
  "active": true
}
```

### 5.3 Update Existing Unlock

**URL:** `PUT /api/unlocks/{unlockId}`

**Request Body:**
```json
{
  "title": "Token Status (Updated)",
  "description": "New description reflecting recent protocol changes.",
  "requirements": {
    "minTrustScore": 25
  },
  "active": true
}
```

### 5.4 Deprecate Unlock

**URL:** `DELETE /api/unlocks/{unlockId}`

**Request Body:**
```json
{
  "deprecatedAt": 1704067200,
  "replacedBy": "new-unlock-id",
  "archiveHistory": true
}
```

---

## 🔐 Section 6: Data Validation & Security

### 6.1 Address Validation
- All endpoints must validate Ethereum address format
- Reject invalid: `Invalid Ethereum address format`
- Support checksummed addresses

### 6.2 Smart Contract Verification
- Always verify data comes from canonical contract addresses
- Document all contract ABIs used
- Version contracts; support upgrades

### 6.3 LLM Output Safety
- Never include private keys or secrets in interpretations
- Validate LLM output doesn't contradict blockchain data
- Sanitize for XSS before returning to frontend
- Log all LLM interpretations for audit

### 6.4 Rate Limiting
- Per-address rate limits: 10 req/sec
- Per-user-session: 100 req/min
- Return `429 Too Many Requests` when exceeded

### 6.5 Caching Strategy
- Cache user profiles for 5 minutes
- Cache unlock config for 30 minutes
- Cache LLM interpretations for 1 hour
- Cache busting: Always bust on unlock event

---

## 📊 Section 7: Required Smart Contract Methods

### 7.1 Smart Contract ABIs Needed

**Covenant NFT Contract:**
```solidity
function balanceOf(address owner) → uint256
function tokenOfOwnerByIndex(address owner, uint256 index) → uint256
function ownerOf(uint256 tokenId) → address
```

**Token Contracts (TRUST, TALLY, VOUCHER):**
```solidity
function balanceOf(address account) → uint256
function decimals() → uint8
function totalSupply() → uint256
function transfers(address from, address to) → array
```

**Governance Contract:**
```solidity
function getTrustScore(address user) → uint256
function getVotingPower(address user) → uint256
function getProposalVotes(address user, uint256 proposalId) → bool
function proposalCount() → uint256
```

**Reserve Contract:**
```solidity
function getContributions(address user) → array
function getTotalContributions(address user) → uint256
function getReserveBalance() → uint256
```

**Tally Distribution Contract:**
```solidity
function totalSupply() → uint256
function getDistribution() → object
```

---

## 📋 Section 8: Implementation Checklist for Backend Team

### Phase 1: Smart Contract Queries (Week 1-2)
- [ ] Document all required smart contract ABIs
- [ ] Implement blockchain query service
- [ ] Add address validation
- [ ] Set up RPC fallbacks (Infura, Alchemy, etc.)
- [ ] Implement caching layer
- [ ] Add error handling
- [ ] Performance test queries
- [ ] Deploy to staging

### Phase 2: LLM Integration (Week 2-3)
- [ ] Set up Claude API integration
- [ ] Design interpretation prompts
- [ ] Implement context building
- [ ] Add safety guardrails
- [ ] Test narrative quality
- [ ] Implement rate limiting
- [ ] Set up cost monitoring
- [ ] Deploy to staging

### Phase 3: Unlock Management (Week 3-4)
- [ ] Design unlock schema
- [ ] Implement CRUD operations
- [ ] Build eligibility checker
- [ ] Set up unlock event logging
- [ ] Implement history retrieval
- [ ] Test continuous updates
- [ ] Document unlock definitions
- [ ] Deploy to staging

### Phase 4: Integration & Testing (Week 4-5)
- [ ] Connect frontend to APIs
- [ ] End-to-end testing
- [ ] Load testing
- [ ] Security audit
- [ ] Documentation review
- [ ] Deploy to production

---

## 🤝 Section 9: Frontend-Backend Contract

### What Frontend Expects from Backend

1. **Smart Contract Queries:**
   - Fast responses (<2s)
   - Complete, accurate data
   - Clear error messages
   - Consistent schema

2. **LLM Interpretations:**
   - Personalized narratives
   - Accurate to blockchain data
   - Appropriate tone
   - No fabricated insights

3. **Unlock Management:**
   - Dynamic unlock definitions
   - Real-time eligibility checks
   - Ceremony parameters
   - Reward tracking

4. **Reliability:**
   - 99.5% uptime
   - Graceful degradation on failures
   - Caching for resilience
   - Clear status indicators

### What Backend Expects from Frontend

1. **Proper Requests:**
   - Valid addresses
   - Supported contexts
   - Reasonable parameters
   - Rate-appropriate usage

2. **Error Handling:**
   - Display error messages clearly
   - Retry on transient failures
   - Fallback to cached data
   - User-friendly messaging

3. **Data Freshness:**
   - Understand cache TTLs
   - Request fresh data when needed
   - Cache LLM responses locally
   - Batch requests when possible

---

## 🚀 Section 10: Deployment & Operations

### Staging Environment
```
API Base: https://staging-api.convergence.internal
Blockchain: Sepolia Testnet
Database: PostgreSQL staging
LLM: Claude API (staging key)
```

### Production Environment
```
API Base: https://api.convergence.protocol
Blockchain: Ethereum Mainnet
Database: PostgreSQL production (replicated)
LLM: Claude API (production key)
```

### Monitoring & Alerts
- [ ] API response time monitoring
- [ ] RPC error rate monitoring
- [ ] LLM cost tracking
- [ ] Cache hit rate monitoring
- [ ] Database query performance
- [ ] Smart contract call failures
- [ ] Security log aggregation

### Incident Response
- [ ] RPC node down → Failover to backup node
- [ ] LLM service down → Return cached interpretations
- [ ] Database down → Return 503, alert team
- [ ] Smart contract reverts → Return detailed error to frontend

---

## 📞 Section 11: Communication & Iteration

### Weekly Sync Topics
1. Block explorer analysis
2. New unlock definitions from team
3. LLM prompt refinement
4. Performance metrics
5. User feedback integration
6. Bug reports & fixes

### Documentation Updates
- This document updated weekly
- Smart contract ABIs versioned
- LLM prompts logged for audit
- Unlock definitions tracked
- API schema changes noted

### Feedback Loop
- Frontend team reports missing data → Backend investigates
- Backend team reports issues → Frontend adjusts requests
- Users report confusion → Both teams improve narratives
- Performance issues → Both teams optimize

---

## ✅ Sign-Off Checklist

**Backend Team Lead:**
- [ ] All required smart contract methods identified
- [ ] API endpoints designed & documented
- [ ] Error handling strategy defined
- [ ] Security approach reviewed
- [ ] LLM integration plan approved
- [ ] Unlock management system architecture confirmed
- [ ] Timeline & resources committed

**Frontend Team Lead:**
- [ ] API contracts understood
- [ ] Data schemas accepted
- [ ] Error handling approach approved
- [ ] Performance requirements confirmed
- [ ] Integration plan reviewed

---

**Document Status:** Requirements Ready for Implementation
**Last Updated:** 2025-11-22
**Next Review:** 2025-11-29

---

## 📎 Appendix: Example Full Data Flow

### User Opens Terminal → Views Token Status

```
1. USER ACTION
   └─ Click "UNLOCK TOKEN STATUS"

2. FRONTEND VALIDATION
   └─ Verify wallet connected
   └─ Get user address: 0x1234...

3. BACKEND QUERY
   └─ GET /api/blockchain/user-profile?address=0x1234...
   └─ Response: { trust: 87, tally: 2500, contributions: 5 }

4. LLM INTERPRETATION
   └─ POST /api/llm/interpret
   └─ Input: { trust: 87, tally: 2500, ... }
   └─ LLM: "Your 87% trust score reflects..."

5. UNLOCK ELIGIBILITY
   └─ GET /api/unlocks/eligibility?address=0x1234...
   └─ Response: { token-status: eligible, ... }

6. CEREMONY TRIGGER
   └─ Frontend plays unlock animation
   └─ Displays blockchain data
   └─ Shows LLM narrative
   └─ Plays celebration sound

7. EVENT LOGGING
   └─ POST /api/unlocks/log
   └─ Log: { address, unlockId, snapshot, interpretation }

8. HISTORY UPDATE
   └─ GET /api/unlocks/history
   └─ Show user all past unlocks
   └─ Display next unlock progress

9. COMPLETION
   └─ Update badge display
   └─ Suggest "Next Steps"
   └─ Offer "View Contributions Unlock"
```

---

**Ready for backend team to begin implementation.**
