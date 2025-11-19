# Admin Unlock System Guide

## Overview

The Admin Unlock System allows authorized administrators to manually unlock content tiers for specific addresses **without requiring TRUST token burns**. This is essential for:

- **Testing unlock functionality** before full deployment
- **Trinity members** who cannot earn the 100 TRUST from adoption
- **Special cases** where manual intervention is needed
- **Demo purposes** to showcase locked content

## How It Works

### Storage Mechanism
- Unlocks are stored in browser `localStorage` under key: `convergence_unlocks`
- Data structure: `{ "0xaddress": ["feature1", "feature2", ...] }`
- **Client-side only** - no blockchain storage (by design for testnet)

### Admin Functions

Three admin functions are available in `unlockManager.js`:

#### 1. `adminUnlockTier(tierName, targetAddress)`
Unlocks a specific tier for an address.

```javascript
// Unlock Explorer tier
unlockManager.adminUnlockTier('EXPLORER', '0x1234...');

// Unlock Contributor tier
unlockManager.adminUnlockTier('CONTRIBUTOR', '0x1234...');

// Unlock Creator tier
unlockManager.adminUnlockTier('CREATOR', '0x1234...');
```

**Parameters:**
- `tierName`: 'EXPLORER', 'CONTRIBUTOR', or 'CREATOR'
- `targetAddress`: Ethereum address to unlock for

**Returns:**
```javascript
{
  success: true,
  tier: "Explorer",
  unlocks: ["writings_preview"],
  adminOverride: true
}
```

#### 2. `adminUnlockAll(targetAddress)`
Unlocks all three tiers for an address at once.

```javascript
unlockManager.adminUnlockAll('0x1234...');
```

**Returns:**
```javascript
{
  success: true,
  unlockedTiers: 3,
  address: "0x1234..."
}
```

#### 3. `adminResetUnlocks(targetAddress)`
Removes all unlocks for an address (resets to locked state).

```javascript
unlockManager.adminResetUnlocks('0x1234...');
```

**Returns:**
```javascript
{
  success: true,
  address: "0x1234...",
  reset: true
}
```

## Using the Admin Interface

### Accessing the Admin Page
Navigate to: **`/admin-unlock.html`**

Example: `http://localhost:8080/admin-unlock.html`

### Features

#### 1. Quick Trinity Unlock
- Pre-configured buttons for Trinity members
- Automatically loads addresses from deployed contract
- One-click unlock all tiers

#### 2. Manual Unlock by Address
- Enter any Ethereum address
- Choose specific tier or unlock all
- Reset unlocks if needed

#### 3. Status Dashboard
- View total stored unlocks
- See current localStorage data
- Export unlock data to console

### Step-by-Step Usage

**To unlock for Trinity members:**
1. Open `/admin-unlock.html`
2. Click one of the Trinity member cards
3. Confirm unlock in result message
4. Trinity member can now access all content

**To unlock for any address:**
1. Copy the target Ethereum address
2. Paste into "Target Address" field
3. Click desired tier button (or "Unlock ALL Tiers")
4. Check success message

**To reset an address:**
1. Enter address in "Target Address" field
2. Click "Reset All Unlocks" button
3. Confirm the action
4. Address is now back to locked state

## Browser Console Usage

You can also use admin functions directly in the browser console (F12):

```javascript
// Check what's available
console.log(unlockManager);

// Unlock Explorer tier
unlockManager.adminUnlockTier('EXPLORER', '0xYourAddress');

// Unlock all tiers
unlockManager.adminUnlockAll('0xYourAddress');

// View all unlock data
console.log(unlockManager.unlocks);

// Check specific address unlocks
unlockManager.getUserUnlocks('0xYourAddress');

// Check if address has specific feature
unlockManager.hasUnlocked('0xYourAddress', 'writings_full');

// Get unlock summary
unlockManager.getUnlockSummary('0xYourAddress');
```

## Tier Structure Reference

### Explorer Tier
- **Cost:** 10 TRUST (when using normal unlock)
- **Unlocks:** `writings_preview`
- **Description:** Access to 3 philosophical writings

### Contributor Tier
- **Cost:** 25 TRUST
- **Unlocks:** `writings_full`, `groups_view`
- **Description:** All writings + view convergence groups

### Creator Tier
- **Cost:** 50 TRUST
- **Unlocks:** `group_creation`
- **Description:** Create convergence groups + amplified voting

## Testing Workflow

### Recommended Testing Sequence

1. **Test Explorer Tier:**
   ```javascript
   unlockManager.adminUnlockTier('EXPLORER', 'YOUR_TEST_ADDRESS');
   ```
   - Navigate to `/writings.html`
   - Verify 3 writings are unlocked
   - Verify others remain locked

2. **Test Contributor Tier:**
   ```javascript
   unlockManager.adminUnlockTier('CONTRIBUTOR', 'YOUR_TEST_ADDRESS');
   ```
   - Verify all writings are unlocked
   - Navigate to `/governance.html`
   - Verify you can view groups

3. **Test Creator Tier:**
   ```javascript
   unlockManager.adminUnlockTier('CREATOR', 'YOUR_TEST_ADDRESS');
   ```
   - Navigate to `/governance.html`
   - Verify "Create Group" button is enabled
   - Test group creation functionality

4. **Test Reset:**
   ```javascript
   unlockManager.adminResetUnlocks('YOUR_TEST_ADDRESS');
   ```
   - Refresh pages
   - Verify all content is locked again

### Trinity Testing

Since Trinity members cannot earn additional TRUST tokens:

```javascript
// Get Trinity addresses from contract first
const genesis = 'GENESIS_ADDRESS';
const claude = 'CLAUDE_ADDRESS';
const hybrid = 'HYBRID_ADDRESS';

// Unlock all for testing
unlockManager.adminUnlockAll(genesis);
unlockManager.adminUnlockAll(claude);
unlockManager.adminUnlockAll(hybrid);
```

Or use the admin interface Quick Trinity Unlock buttons.

## Important Notes

### ⚠️ Client-Side Only
- Unlocks are stored in **browser localStorage**
- **Not stored on blockchain** (by design for testnet)
- Each browser/device is independent
- Clearing browser data removes unlocks

### 🔒 No Authentication
- Admin functions are available in console to anyone
- This is acceptable for **testnet/testing**
- For production, implement proper authentication

### 🔄 Event System
Admin unlocks dispatch the same `unlockStateChanged` event as normal unlocks:

```javascript
document.addEventListener('unlockStateChanged', (e) => {
  console.log('Unlock changed:', e.detail);
  // e.detail.adminOverride === true for admin unlocks
});
```

### 💾 Data Persistence
View raw localStorage data:
```javascript
localStorage.getItem('convergence_unlocks');
```

Clear all unlock data:
```javascript
localStorage.removeItem('convergence_unlocks');
```

Export unlock data:
```javascript
JSON.stringify(unlockManager.unlocks, null, 2);
```

## Troubleshooting

### Unlocks Not Showing
1. Check console for errors (F12)
2. Verify `unlockManager` is loaded
3. Check localStorage data exists
4. Try refreshing the page

### Trinity Addresses Not Loading
1. Ensure contracts are deployed
2. Check `header.js` is loaded
3. Verify network connection (Sepolia)
4. Check console for contract errors

### Admin Interface Not Working
1. Verify `/js/unlockManager.js` is loaded
2. Check browser console for errors
3. Ensure you're on correct URL
4. Try hard refresh (Ctrl+Shift+R)

## Security Considerations

### Testnet Acceptable
- Anyone can use admin functions in console
- No real value at risk
- Good for testing and demos

### Production Recommendations
If implementing on mainnet:
1. **Server-side authentication** for admin actions
2. **On-chain unlock tracking** instead of localStorage
3. **Multi-sig approval** for manual unlocks
4. **Audit trail** of admin actions
5. **Role-based access control** (RBAC)

## Future Enhancements

Potential improvements for production:

1. **NFT-Based Unlocks**
   - Mint special "unlock NFTs"
   - Transferable unlock rights
   - On-chain verification

2. **Signature-Based Auth**
   - Admin must sign unlock requests
   - Verify signature on-chain
   - Prevents unauthorized unlocks

3. **Time-Limited Unlocks**
   - Temporary access grants
   - Auto-expire after duration
   - Good for trials/demos

4. **Unlock Marketplace**
   - Users can trade unlock rights
   - Secondary market for access
   - Revenue share model

## Summary

The Admin Unlock System provides a flexible, easy-to-use way to manually grant access to locked content without requiring TRUST token burns. It's perfect for testing, special cases, and the Trinity members who cannot earn additional TRUST through the normal adoption flow.

**Key Points:**
- ✅ No blockchain transaction required
- ✅ Instant unlock (no waiting)
- ✅ Fully reversible (reset function)
- ✅ Web UI and console access
- ✅ Event-driven updates
- ⚠️ Client-side storage only
- ⚠️ No authentication (testnet only)

---

**Created:** 2025-11-18
**Version:** 1.0
**For:** Convergence Protocol Testnet
