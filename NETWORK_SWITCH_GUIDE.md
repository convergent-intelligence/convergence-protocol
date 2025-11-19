# Network Switch Guide

## Quick Reference: Switching from Sepolia to Mainnet

When you're ready to deploy to mainnet and switch your frontend, you need to change **TWO files** and **ONE variable** in each.

### Files to Update

1. **`/public/js/header.js`** (line ~28)
2. **`/public/governance.html`** (line ~702)

### The Change

Find this line in both files:
```javascript
const TARGET_NETWORK = 'SEPOLIA';  // Change to 'MAINNET' for production
```

Change it to:
```javascript
const TARGET_NETWORK = 'MAINNET';  // Change to 'MAINNET' for production
```

### Also Update Contract Address

In `/public/governance.html` (line ~706), update:
```javascript
const GOVERNANCE_ADDRESS = "0x049FE653a386c203feb75351A7840194B99Ac2d9";  // Update after mainnet deployment
```

Replace with your **actual mainnet contract address** after deployment.

### Verification

After making the changes:

1. **Test locally first**:
   - Open your browser dev console (F12)
   - Connect your wallet
   - Should prompt for "Ethereum Mainnet" instead of "Sepolia Testnet"

2. **Check network detection**:
   - If you're on wrong network, should auto-prompt to switch
   - Should display mainnet contract data

3. **Deploy to production**:
   - Only after local testing confirms it works
   - Clear any CDN caches

## What This Does

The updated code:
- Automatically detects if user is on the correct network
- Attempts to switch network automatically via MetaMask
- Shows user-friendly error messages with correct network name
- Works with both Sepolia (testing) and Mainnet (production)

## Rollback Procedure

If you need to go back to Sepolia:
1. Change `TARGET_NETWORK` back to `'SEPOLIA'`
2. Restore the Sepolia contract address
3. Redeploy frontend

## Current Status

**Network**: Sepolia Testnet
**Contract**: 0x049FE653a386c203feb75351A7840194B99Ac2d9

---

**Remember**: Test on Sepolia first, deploy to mainnet when ready, then flip the switch!
