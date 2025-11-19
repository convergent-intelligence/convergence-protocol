# Contract Verification Guide

## Contract Details
- **Address:** `0x2917fa175F7c51f3d056e3069452eC3395059b04`
- **Network:** Sepolia Testnet
- **Compiler:** Solidity v0.8.20
- **Optimization:** Enabled (200 runs)
- **License:** MIT

## Manual Verification on Etherscan

### Step 1: Go to Etherscan Verification Page
Visit: https://sepolia.etherscan.io/address/0x2917fa175F7c51f3d056e3069452eC3395059b04#code

Click "Verify and Publish" button.

### Step 2: Fill in Contract Details

**Compiler Type:** Solidity (Single file)

**Compiler Version:** v0.8.20+commit.a1b79de6

**Open Source License Type:** MIT License (MIT)

### Step 3: Optimization Settings

**Optimization:** Yes

**Runs:** 200

### Step 4: Upload Contract Code

You have two options:

#### Option A: Upload Flattened File
The flattened contract is located at: `flattened.sol`

Simply upload this file to Etherscan.

#### Option B: Copy/Paste Flattened Code
Open `flattened.sol` and copy the entire contents, then paste into the verification form.

### Step 5: Constructor Arguments (ABI-encoded)

This contract has no constructor arguments (it only uses `Ownable(GENESIS_HUMAN)` which is a constant).

**Constructor Arguments:** Leave empty or use: (none required)

### Step 6: Submit for Verification

Click "Verify and Publish" and wait for Etherscan to process.

## Verification Status

Once verified, the contract will show:
- ✅ Green checkmark on Etherscan
- Source code visible to all users
- Read/Write contract interface available
- Events and transactions decoded automatically

## Troubleshooting

If verification fails:

1. **Check compiler version exactly matches:** v0.8.20+commit.a1b79de6
2. **Ensure optimization is set to:** Yes, 200 runs
3. **Verify license type:** MIT
4. **Make sure using flattened file:** Not the original with imports

## After Verification

Once verified, you can:
- Read contract state directly on Etherscan
- Write to contract using Etherscan's interface
- Share verified source code with the community
- Build trust with transparent, auditable code
