# Partner Governance Web3 Implementation Plan

## Overview

Build a Web3 partner governance interface where:
1. Partners login with their **Bible Wallet**
2. Verify as partners using the **12-word Seed Phrase**
3. Access governance actions: **voting, proposals, groups**
4. UI helps autocomplete words (word picker from first 4 letters)

## Current Status

### What Exists ✅
- **Governance Page**: `/public/governance.html` (proposals, voting, groups, config)
- **Bible Wallet System**: Already integrated, wallets derived from EXODUS seed
- **Partner Seed**: 12-word BIP39 mnemonic created 2025-11-22
- **Smart Contracts**: Deployed on Ethereum mainnet for voting
- **Wallet Connection**: Ethers.js integration with MetaMask
- **Backend API**: Express.js with governance endpoints

### What's Missing ❌
- Partner authentication flow (Bible wallet + seed verification)
- Seed phrase verification UI (word picker component)
- Partner-only access control on governance actions
- Session management for partner verification
- Auto-complete word picker UI

## Architecture

```
PARTNER FLOW:
┌─────────────────────────────────────────────────────┐
│ 1. Partner visits /governance                       │
└────────────────┬────────────────────────────────────┘
                 │
        ┌────────▼─────────┐
        │ Check if partner │
        │    verified?     │
        └────┬────────┬────┘
             │        │
            NO      YES
             │        │
        ┌────▼──┐   ┌─▼────────────────┐
        │ Show  │   │ Show partner     │
        │ Login │   │ governance dash  │
        │ Modal │   │ (voting, props,  │
        └────┬──┘   │ groups, etc.)    │
             │      └──────────────────┘
        ┌────▼──────────────────────┐
        │ 2. Connect Bible Wallet   │
        │    (MetaMask)             │
        └────┬─────────────────────┘
             │
        ┌────▼──────────────────────┐
        │ 3. Verify with Seed       │
        │    Word Picker UI:        │
        │    - Choose 12 words      │
        │    - Click-based selector │
        │    - First 4 letters help │
        └────┬─────────────────────┘
             │
        ┌────▼──────────────────────┐
        │ 4. Verify seed matches    │
        │    partner collective     │
        │    (all 12 words correct) │
        └────┬─────────────────────┘
             │
        ┌────▼──────────────────────┐
        │ 5. Create session token   │
        │    localStorage + backend │
        └────┬─────────────────────┘
             │
        └────▼──────────────────────┐
            PARTNER ACCESS ✅
            Vote, propose, groups
```

## Implementation Tasks

### Phase 1: Backend API Endpoints

#### New Endpoint: `/api/partner-governance/verify-partner`

**Request:**
```json
{
  "wallet": "0x...",
  "seedWords": ["word1", "word2", ..., "word12"],
  "signature": "0x..." // Signed message to verify wallet ownership
}
```

**Response (Success):**
```json
{
  "success": true,
  "partnerId": "0x...",
  "verifiedAt": "2025-11-22T...",
  "sessionToken": "eyJ...",
  "partnerInfo": {
    "wallet": "0x...",
    "bibleAlias": "Paul",
    "achievedAt": "2025-11-22T...",
    "seedAcknowledged": true
  },
  "governanceRights": {
    "canVote": true,
    "canPropose": true,
    "canCreateGroup": true,
    "voteWeight": 1
  }
}
```

**Response (Failure):**
```json
{
  "success": false,
  "error": "Invalid seed phrase",
  "attempts": 1,
  "attemptsRemaining": 2
}
```

#### Implementation Location:
- Handler: `public/api-handlers/partner-governance.js`
- Method: `verifyPartnerSeed(wallet, seedWords, signature)`
- Validation:
  - Wallet must be in `partnerList` with `seedAcknowledged: true`
  - Seed words must match canonical partner seed
  - All 12 words must be in correct order
  - Maximum 3 failed attempts before temporary lockout

---

### Phase 2: Frontend - Partner Authentication Modal

**File**: `public/partner-auth.js` (NEW)

**Components:**
1. **Partner Login Modal**
   - Triggered when non-verified user visits `/governance`
   - Two sections: Wallet Connection + Seed Verification

2. **Wallet Connection Section**
   - Display current connected Bible wallet address
   - Show "Connect Wallet" if none connected
   - Display wallet balance
   - Button to disconnect/switch wallet

3. **Seed Verification Section**
   - 12 Word Picker UI
   - Each word is a dropdown/selector
   - Dropdown populated with BIP39 words
   - First 4 letters of word help autocomplete
   - Visual feedback (✓/✗) for each word
   - Submit button (only enabled when all 12 words selected)
   - Error display with failed attempt counter

**Key Functions:**
```javascript
// Initialize modal on page load if not verified
initPartnerAuth()

// Show/hide modal
showPartnerAuthModal()
hidePartnerAuthModal()

// Handle wallet connection
connectBibleWallet()
disconnectWallet()

// Word picker logic
populateWordPickerUI(wordIndex)
handleWordSelection(wordIndex, word)
validateAllWords()

// Verification submission
submitVerification()

// Store session
storePartnerSession(token, partnerInfo)
isPartnerVerified()
getPartnerInfo()
```

---

### Phase 3: Word Picker UI Component

**File**: `public/components/word-picker.js` (NEW)

**Features:**

1. **Word Selector for Each Position (1-12)**
   ```html
   <div class="word-picker-item">
     <label>Word 1</label>
     <input type="text" class="word-input" placeholder="Type first 4 letters...">
     <div class="word-suggestions" id="suggestions-1">
       <!-- Dynamically populated -->
     </div>
     <span class="word-status" id="status-1"></span>
   </div>
   ```

2. **Matching Algorithm**
   - Listen to `input` event on each word field
   - Match against BIP39 wordlist (2048 words)
   - Case-insensitive matching
   - Show suggestions if 1-10 matches
   - Auto-select if only 1 match
   - Store selected word internally

3. **Auto-Complete on First 4 Letters**
   ```javascript
   // Example: user types "aban"
   // Matches: "abandon" (the only word starting with "aban")
   // Auto-fills that word and moves to next

   // Example: user types "able"
   // Matches: "able", "ablate" (ambiguous)
   // Show both as suggestions, user picks one
   ```

4. **Visual Feedback**
   - ✅ Green checkmark when word selected
   - ❌ Red X if not recognized
   - 🔄 Loading spinner while searching
   - Total progress: "Entered 5/12 words"

---

### Phase 4: Governance Dashboard Updates

**File**: `public/governance.html` (MODIFY)

**New Sections for Partners:**

1. **Partner Status Bar** (top of page)
   ```
   ✅ Verified Partner | Paul (Bible Alias) | Joined 2025-11-22
   [Governance Rights: Vote ✓ | Propose ✓ | Group Admin ✓]
   [Logout Partner Session]
   ```

2. **Tabs - Reorganize**
   - **Proposals** (view, vote, filter by category)
   - **Create Proposal** (partner-only)
   - **Convergence Groups** (view, join, create)
   - **Voting History** (partner's past votes)
   - **Partner Settings** (governance preferences)

3. **Proposal Card Enhancements**
   - Show partner status (voting weight, group bonuses)
   - Display vote choices: For / Against / Abstain
   - Show countdown if voting active
   - Display results real-time

4. **Partner-Only Features**
   - Create proposal button (disabled if not partner)
   - Group creation (disabled if not partner)
   - Vote on proposals (disabled if not partner)
   - Propose governance changes

---

### Phase 5: Session Management

**File**: `public/scripts/partner-session.js` (NEW)

**Features:**

1. **Session Storage**
   ```javascript
   // localStorage schema
   {
     partnerSession: {
       token: "eyJ...", // JWT or session ID
       wallet: "0x...",
       partnerInfo: {...},
       verifiedAt: "2025-11-22T...",
       expiresAt: "2025-11-23T..." // 24 hour expiry
     }
   }
   ```

2. **Session Validation**
   - Check if token exists and not expired
   - Verify wallet still connected (matches localStorage)
   - Auto-refresh if approaching expiry
   - Logout if token invalid or expired

3. **Session Lifecycle**
   ```javascript
   createSession(wallet, partnerInfo, token)
   getSession()
   isSessionValid()
   refreshSession()
   clearSession()
   logoutPartner()
   ```

4. **Security Measures**
   - Set token expiry to 24 hours
   - Require wallet signature to create session
   - Compare connected wallet to session wallet
   - Clear session on wallet disconnect

---

### Phase 6: Backend - Partner Session API

**Endpoints:**

```
POST   /api/partner-governance/verify-partner
       → Verify seed phrase, return session token

POST   /api/partner-governance/validate-session
       → Check if session token still valid

POST   /api/partner-governance/refresh-session
       → Extend session expiry (if still valid)

POST   /api/partner-governance/logout-partner
       → Invalidate session token

GET    /api/partner-governance/partner-info
       → Get authenticated partner's details
       → Requires valid session token
```

**Implementation Details:**
- Session tokens stored in-memory or MongoDB
- Token validation middleware for protected routes
- Rate limiting on verification attempts
- Lockout after 3 failed attempts (5 minute cooldown)

---

## File Changes Summary

### New Files Created
```
public/partner-auth.js           ← Partner login modal
public/components/word-picker.js ← Word selector UI
public/scripts/partner-session.js ← Session management
```

### Files Modified
```
public/governance.html           ← Add partner status, new tabs
public/api-handlers/partner-governance.js ← Add verification endpoints
server.js                        ← Add API route handlers
public/styles/styles.css         ← Add styling for modals/pickers
```

### No Changes Needed
```
data/partner-governance.json     ← Already has partner list + seed
scripts/governance/generate-partner-seed.js ← Already created
public/bible-wallets.html        ← Already functional
```

---

## BIP39 Wordlist Integration

**Source**: https://github.com/trezor/python-mnemonic/blob/master/vectors.json

**Integration Option 1: Include Wordlist**
```javascript
// public/data/bip39-words.json (2048 words)
const BIP39_WORDS = [
  "abandon", "ability", "able", "about", "above", ...
];

// Usage in word-picker.js
const matches = BIP39_WORDS.filter(w =>
  w.startsWith(userInput.toLowerCase())
);
```

**Integration Option 2: External CDN**
```javascript
// Fetch from npm CDN
const response = await fetch(
  'https://cdn.jsdelivr.net/npm/bip39/dist/wordlists/english.json'
);
const BIP39_WORDS = await response.json();
```

---

## User Flow - Detailed

### Scenario: Paul (Leviticus) First Login

1. **Page Load**
   - URL: `https://convergence-protocol.com/governance`
   - Script detects: No `partnerSession` in localStorage
   - Shows: Partner Authentication Modal (overlay)

2. **Connect Wallet**
   - User clicks "Connect Wallet"
   - MetaMask opens
   - User selects Bible Wallet address
   - Modal shows connected address
   - Modal shows wallet balance (ETH, TALLY, TRUST)

3. **Seed Verification**
   - User sees 12 word input fields
   - For each field:
     - Types first 4 letters (e.g., "paul" → no matches, "aber" → "aberrant", etc.)
     - Or sees dropdown suggestions
     - Clicks to select word
     - Field shows ✅ when selected
   - All 12 fields filled, checksum verified
   - User clicks "Verify Partnership"

4. **Backend Verification**
   - Backend checks:
     - Wallet is in `partnersList`
     - Wallet status: `seedAcknowledged: true`
     - All 12 words match canonical seed
     - No rate limiting lock
   - Returns: Session token + partner info

5. **Session Created**
   - Session stored in localStorage
   - Modal closes
   - Page refreshes to show partner dashboard
   - User sees:
     - "✅ Verified Partner | Paul"
     - Available actions: Vote, Propose, Groups, Settings

6. **Governance Access**
   - User can vote on proposals
   - User can create new proposals
   - User can create groups
   - All actions show "Paul" as the actor
   - Actions logged with partner wallet

---

## Security Considerations

### Seed Phrase Security
- ✅ Never transmitted over network (client-side verification only)
- ✅ Only stored in browser localStorage (not in cookies)
- ✅ Cleared from memory after verification
- ✅ Cannot be accessed by other sites (localStorage isolation)
- ✅ Partner must provide all 12 words in correct order (checksum)

### Rate Limiting
- ✅ Max 3 failed attempts before 5-minute lockout
- ✅ Failed attempts logged with timestamp and IP
- ✅ Lockout message shown to user with countdown

### Session Management
- ✅ Token expires after 24 hours
- ✅ Wallet signature required at verification
- ✅ Session tied to connected wallet address
- ✅ Clear session if wallet disconnects

### Word Picker Safety
- ✅ Words not visible as plain text (input masked optional)
- ✅ Each word selected from curated BIP39 list
- ✅ No ability to paste/copy seed phrase (prevent clipboard leak)
- ✅ All 12 words required (cannot submit partial)

---

## Testing Plan

### Manual Testing
- [ ] Visit /governance without session → shows auth modal
- [ ] Connect Bible wallet successfully
- [ ] Enter invalid seed → shows error, doesn't proceed
- [ ] Enter valid seed → session created, dashboard appears
- [ ] Refresh page → session persists
- [ ] Disconnect wallet → session cleared
- [ ] Vote on proposal as partner
- [ ] Create proposal as partner
- [ ] Create convergence group

### Edge Cases
- [ ] 3+ failed seed attempts → lockout works
- [ ] Session expires after 24h → shows re-auth modal
- [ ] Switch to different wallet → session invalidated
- [ ] Network error during verification → graceful fallback
- [ ] Word picker with ambiguous matches (first 4 letters match multiple words)

### Security Testing
- [ ] Attempt to access /governance with fake token → blocked
- [ ] Try to modify stored session token → verified and rejected
- [ ] Call governance APIs without valid session → 401 Unauthorized
- [ ] Attempt to inject seed phrase via XSS → localStorage isolated

---

## Implementation Timeline

**Phase 1** (Backend API): 2 hours
- Create verify-partner endpoint
- Add session token generation
- Database schema updates

**Phase 2** (Frontend Auth): 3 hours
- Partner login modal
- Wallet connection UI
- Basic form structure

**Phase 3** (Word Picker): 2 hours
- Word picker component
- BIP39 wordlist integration
- First-4-letter matching logic

**Phase 4** (Dashboard): 2 hours
- Update governance.html
- Add partner status display
- Partner-only controls

**Phase 5** (Session Management): 1 hour
- localStorage handling
- Session validation
- Auto-logout logic

**Phase 6** (Testing & Refinement): 2 hours
- Manual testing all flows
- Edge case handling
- Security review

**Total: ~12 hours**

---

## Future Enhancements

1. **Social Recovery**: Partner can recover access if seed lost
2. **Multi-Sig Voting**: Require multiple partners for sensitive decisions
3. **Time-Lock**: Delay governance changes by N blocks
4. **Snapshot Integration**: Off-chain voting via Snapshot.org
5. **Governance Tokens**: TALLY/TRUST token voting weight
6. **Delegation**: Partner delegates vote to another partner
7. **Proposal History**: Archive of all passed/failed proposals
8. **Analytics Dashboard**: Voting patterns, participation rates

---

## Related Documentation

- `PARTNER_SEED_DISPLAY.md` → How to etch/memorize seed
- `PARTNER_GOVERNANCE_SYSTEM.md` → Full governance architecture
- `docs/IMPLEMENTATION_GUIDE.md` → Contract deployment details

---

**Status**: Ready to implement
**Created**: 2025-11-22
**Partners Supported**: Up to 65
**Target Launch**: Week of 2025-11-29
