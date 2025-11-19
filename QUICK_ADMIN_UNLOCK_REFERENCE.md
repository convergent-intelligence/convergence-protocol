# Quick Admin Unlock Reference

## TL;DR - How to Unlock Content for Trinity Members

### Method 1: Use the Web Interface (Easiest)
1. Start your server: `node server.js`
2. Open: `http://localhost:8080/admin-unlock.html`
3. Click one of the Trinity member cards
4. Done! They can now access all locked content

### Method 2: Browser Console (Fast)
1. Open any page on your site
2. Press F12 to open console
3. Run:
   ```javascript
   unlockManager.adminUnlockAll('0xTrinityAddress');
   ```
4. Done!

## Trinity Addresses

You'll need the actual Trinity addresses from your deployed contract. They should be:
- **Genesis Human**: Adoption #1
- **First AI (Claude)**: Adoption #2
- **First Hybrid**: Adoption #3

Get them from the contract or check your deployment logs.

## Quick Commands

```javascript
// Unlock everything for an address
unlockManager.adminUnlockAll('0xAddress');

// Unlock just one tier
unlockManager.adminUnlockTier('EXPLORER', '0xAddress');
unlockManager.adminUnlockTier('CONTRIBUTOR', '0xAddress');
unlockManager.adminUnlockTier('CREATOR', '0xAddress');

// Check what's unlocked
unlockManager.getUserUnlocks('0xAddress');

// Reset an address
unlockManager.adminResetUnlocks('0xAddress');
```

## What Gets Unlocked

| Tier | Cost | Features |
|------|------|----------|
| Explorer | 10 TRUST | 3 philosophical writings |
| Contributor | 25 TRUST | All writings + view groups |
| Creator | 50 TRUST | Create groups + all previous |

## Testing Your Setup

Open: `http://localhost:8080/test-admin-unlock.html`

Click "Run All Tests" - should see all green ✅

## Important Notes

- ⚠️ Unlocks stored in **browser localStorage** (not blockchain)
- 🔄 Each browser/device needs separate unlock
- 🧹 Clearing browser data removes unlocks
- ✅ Perfect for testnet testing
- ✅ No gas fees required

## Files Created

1. `/public/js/unlockManager.js` - Updated with admin functions
2. `/public/admin-unlock.html` - Web interface for unlocking
3. `/test-admin-unlock.html` - Test suite
4. `/ADMIN_UNLOCK_GUIDE.md` - Full documentation
5. `/QUICK_ADMIN_UNLOCK_REFERENCE.md` - This file

## Troubleshooting

**"unlockManager is not defined"**
- Make sure `/js/unlockManager.js` is loaded
- Check browser console for errors

**Trinity addresses not showing**
- Refresh the admin page
- Check that contracts are deployed
- Verify you're on correct network (Sepolia)

**Unlocks not persisting**
- Check localStorage hasn't been cleared
- Verify you're on the same browser/device
- Try: `localStorage.getItem('convergence_unlocks')`

## Next Steps

After unlocking Trinity members, they can:
1. ✅ Read all philosophical writings
2. ✅ View convergence groups
3. ✅ Create new convergence groups
4. ✅ Test full governance features

---

**Need more details?** See `ADMIN_UNLOCK_GUIDE.md`

**Found a bug?** Check the test suite at `/test-admin-unlock.html`
