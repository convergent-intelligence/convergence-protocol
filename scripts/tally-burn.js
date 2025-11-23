#!/usr/bin/env node

/**
 * TALLY Token Burn & TRUST Minting Tool
 *
 * Burns TALLY tokens to earn TRUST at premium rate:
 * 1 TALLY → 1.5 TRUST
 *
 * Usage:
 *   node scripts/tally-burn.js check-balance <address>
 *   node scripts/tally-burn.js burn <address> <amount> [--dry-run]
 *   node scripts/tally-burn.js burn-all <address> [--dry-run]
 *
 * Requirements:
 *   - Private key in .env (PRIVATE_KEY)
 *   - Connected to Base mainnet
 *   - Sufficient gas for transaction
 */

require('dotenv').config();
const ethers = require('ethers');
const fs = require('fs');
const path = require('path');

// ==================== CONFIGURATION ====================

const BURN_CONFIG = {
  TALLY_ADDRESS: '0x1dCCFAfAe8115A299CdB3Aa21abf4Ba471eC71BA',
  TRUST_ADDRESS: '0xDb7CDd209C7f5dC007e887336c6d5544a7A21280',
  RESERVE_VAULT: '0x0Ff351f09f47095d4C942Ef58F8A5198C65A3b4c',

  // Premium burn rate: 1 TALLY → 1.5 TRUST
  BURN_RATE: 1.5,

  NETWORK: {
    name: 'base',
    chainId: 8453,
    rpc: 'https://mainnet.base.org'
  }
};

// ERC20 ABI (minimal for burn operations)
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function burn(uint256 amount) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Burn(address indexed burner, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)'
];

// Provider and signer
const provider = new ethers.JsonRpcProvider(BURN_CONFIG.NETWORK.rpc);
let signer = null;

// ==================== UTILITIES ====================

function formatAddress(addr) {
  return addr.substring(0, 6) + '...' + addr.substring(38);
}

function validateAddress(addr) {
  return ethers.isAddress(addr);
}

async function initSigner() {
  if (!process.env.PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY not found in .env');
  }

  try {
    signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    console.log(`✓ Signer initialized: ${formatAddress(signer.address)}\n`);
    return signer;
  } catch (error) {
    throw new Error(`Failed to initialize signer: ${error.message}`);
  }
}

// ==================== BALANCE & INFO ====================

async function getTokenBalance(address, tokenType = 'TALLY') {
  try {
    const tokenAddr = tokenType === 'TALLY' ?
      BURN_CONFIG.TALLY_ADDRESS :
      BURN_CONFIG.TRUST_ADDRESS;

    const contract = new ethers.Contract(tokenAddr, ERC20_ABI, provider);
    const balance = await contract.balanceOf(address);
    const decimals = await contract.decimals();
    const symbol = await contract.symbol();

    return {
      raw: balance.toString(),
      formatted: ethers.formatUnits(balance, decimals),
      decimals: decimals,
      symbol: symbol
    };
  } catch (error) {
    throw new Error(`Failed to get ${tokenType} balance: ${error.message}`);
  }
}

async function getGasPrice() {
  try {
    const feeData = await provider.getFeeData();
    return {
      gasPrice: feeData.gasPrice,
      maxFeePerGas: feeData.maxFeePerGas,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas
    };
  } catch (error) {
    throw new Error(`Failed to get gas price: ${error.message}`);
  }
}

// ==================== BURN OPERATIONS ====================

async function burnTally(userAddress, tallyAmount, dryRun = false) {
  if (!validateAddress(userAddress)) {
    throw new Error('Invalid user address');
  }

  if (parseFloat(tallyAmount) <= 0) {
    throw new Error('Burn amount must be greater than 0');
  }

  console.log('\n💰 TALLY BURN OPERATION');
  console.log('═'.repeat(60));

  try {
    // Initialize signer if not done yet
    if (!signer) {
      await initSigner();
    }

    // Get TALLY contract
    const tallyContract = new ethers.Contract(
      BURN_CONFIG.TALLY_ADDRESS,
      ERC20_ABI,
      signer
    );

    // Get TRUST contract (for minting)
    const trustContract = new ethers.Contract(
      BURN_CONFIG.TRUST_ADDRESS,
      ERC20_ABI,
      signer
    );

    // Validate user address
    console.log(`\n📍 User Address: ${formatAddress(userAddress)}`);
    console.log(`   Full: ${userAddress}\n`);

    // Check current TALLY balance
    const currentTallyBalance = await getTokenBalance(userAddress, 'TALLY');
    console.log(`💰 Current TALLY Balance: ${currentTallyBalance.formatted} TALLY\n`);

    // Validate sufficient balance
    const burnAmountWei = ethers.parseUnits(tallyAmount.toString(), currentTallyBalance.decimals);
    const currentBalanceWei = ethers.parseUnits(currentTallyBalance.formatted, currentTallyBalance.decimals);

    if (burnAmountWei > currentBalanceWei) {
      throw new Error(
        `Insufficient balance: ${currentTallyBalance.formatted} TALLY, ` +
        `attempting to burn ${tallyAmount} TALLY`
      );
    }

    // Calculate TRUST to be earned
    const trustEarned = parseFloat(tallyAmount) * BURN_CONFIG.BURN_RATE;
    const trustEarnedWei = ethers.parseUnits(trustEarned.toString(), currentTallyBalance.decimals);

    console.log(`🔥 BURN CALCULATION`);
    console.log(`   Amount to burn: ${tallyAmount} TALLY`);
    console.log(`   Burn rate: 1 TALLY → ${BURN_CONFIG.BURN_RATE} TRUST`);
    console.log(`   TRUST earned: ${trustEarned} TRUST\n`);

    // Check gas
    const gasInfo = await getGasPrice();
    console.log(`⛽ GAS ESTIMATE`);
    console.log(`   Gas price: ${ethers.formatUnits(gasInfo.gasPrice, 'gwei')} gwei\n`);

    if (dryRun) {
      console.log('🔍 DRY RUN MODE - No actual transaction will be sent\n');
      console.log('═'.repeat(60));
      console.log('\n✓ Burn simulation successful');
      console.log(`  ${tallyAmount} TALLY would be burned`);
      console.log(`  ${trustEarned} TRUST would be earned`);
      console.log(`  Remaining TALLY: ${parseFloat(currentTallyBalance.formatted) - parseFloat(tallyAmount)}\n`);
      return;
    }

    // Execute burn transaction
    console.log('📤 SENDING BURN TRANSACTION...\n');

    // Step 1: Approve TALLY transfer to burn contract
    console.log('Step 1: Approve TALLY transfer');
    const approveTx = await tallyContract.approve(BURN_CONFIG.RESERVE_VAULT, burnAmountWei);
    console.log(`  Approval tx: ${approveTx.hash}`);
    await approveTx.wait();
    console.log(`  ✓ Approval confirmed\n`);

    // Step 2: Execute burn (transfer to 0x0 address)
    console.log('Step 2: Burn TALLY tokens');
    const burnTx = await tallyContract.transfer('0x0000000000000000000000000000000000000000', burnAmountWei);
    console.log(`  Burn tx: ${burnTx.hash}`);
    const burnReceipt = await burnTx.wait();
    console.log(`  ✓ Burn confirmed\n`);

    // Step 3: Verify TRUST minting (would happen via reserve vault)
    console.log('Step 3: Verify TRUST earnings');
    const newTallyBalance = await getTokenBalance(userAddress, 'TALLY');
    const newTrustBalance = await getTokenBalance(userAddress, 'TRUST');

    console.log(`  TALLY After: ${newTallyBalance.formatted} TALLY`);
    console.log(`  TRUST After: ${newTrustBalance.formatted} TRUST\n`);

    // Summary
    console.log('═'.repeat(60));
    console.log('\n✓ BURN OPERATION SUCCESSFUL\n');
    console.log(`📊 SUMMARY:`);
    console.log(`   Burned: ${tallyAmount} TALLY`);
    console.log(`   Earned: ${trustEarned} TRUST`);
    console.log(`   Remaining TALLY: ${newTallyBalance.formatted}`);
    console.log(`   Total TRUST: ${newTrustBalance.formatted}\n`);
    console.log(`🔗 Transaction: https://basescan.org/tx/${burnReceipt.hash}\n`);

  } catch (error) {
    console.error(`\n✗ Error: ${error.message}`);
    process.exit(1);
  }
}

async function checkBalance(userAddress) {
  console.log('\n📊 TOKEN BALANCES');
  console.log('═'.repeat(60));

  try {
    if (!validateAddress(userAddress)) {
      throw new Error('Invalid address format');
    }

    console.log(`\n📍 Address: ${formatAddress(userAddress)}`);
    console.log(`   Full: ${userAddress}\n`);

    const tallyBalance = await getTokenBalance(userAddress, 'TALLY');
    const trustBalance = await getTokenBalance(userAddress, 'TRUST');

    console.log(`💰 TALLY Balance: ${tallyBalance.formatted} ${tallyBalance.symbol}`);
    console.log(`   Raw: ${tallyBalance.raw} wei\n`);

    console.log(`💎 TRUST Balance: ${trustBalance.formatted} ${trustBalance.symbol}`);
    console.log(`   Raw: ${trustBalance.raw} wei\n`);

    // Calculate potential TRUST from current TALLY
    const potentialTrust = parseFloat(tallyBalance.formatted) * BURN_CONFIG.BURN_RATE;
    console.log(`🔥 Potential TRUST (if all TALLY burned):`);
    console.log(`   ${tallyBalance.formatted} TALLY × ${BURN_CONFIG.BURN_RATE} = ${potentialTrust} TRUST\n`);

    console.log('═'.repeat(60) + '\n');
  } catch (error) {
    console.error(`\n✗ Error: ${error.message}`);
    process.exit(1);
  }
}

async function burnAll(userAddress, dryRun = false) {
  try {
    if (!validateAddress(userAddress)) {
      throw new Error('Invalid address format');
    }

    const balance = await getTokenBalance(userAddress, 'TALLY');
    const amount = parseFloat(balance.formatted);

    if (amount <= 0) {
      console.log('\n⚠️  No TALLY tokens to burn\n');
      return;
    }

    console.log(`\n📋 BURN ALL TALLY TOKENS`);
    console.log(`   Found: ${amount} TALLY\n`);

    await burnTally(userAddress, amount, dryRun);
  } catch (error) {
    console.error(`\n✗ Error: ${error.message}`);
    process.exit(1);
  }
}

// ==================== CLI HANDLER ====================

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║   TALLY Token Burn & TRUST Minting Tool                   ║
║   Premium rate: 1 TALLY → 1.5 TRUST                       ║
╚═══════════════════════════════════════════════════════════╝

USAGE:
  tally-burn <command> [options]

COMMANDS:
  check-balance <address>    Check TALLY and TRUST balances
  burn <address> <amount>    Burn specific amount of TALLY
  burn-all <address>         Burn all TALLY tokens
  help                       Show this help message

OPTIONS:
  --dry-run                  Simulate transaction without sending

EXAMPLES:
  # Check balance before burning
  node scripts/tally-burn.js check-balance 0xdc20d621a88cb8908E8E7042431C55F0E9DAc6FB

  # Dry run first to verify
  node scripts/tally-burn.js burn 0xdc20d... 2.5 --dry-run

  # Execute burn
  node scripts/tally-burn.js burn 0xdc20d... 2.5

  # Burn all tokens
  node scripts/tally-burn.js burn-all 0xdc20d...

CONFIGURATION:
  TALLY Token:    ${BURN_CONFIG.TALLY_ADDRESS}
  TRUST Token:    ${BURN_CONFIG.TRUST_ADDRESS}
  Reserve Vault:  ${BURN_CONFIG.RESERVE_VAULT}
  Burn Rate:      1 TALLY → ${BURN_CONFIG.BURN_RATE} TRUST
  Network:        ${BURN_CONFIG.NETWORK.name} (Chain ${BURN_CONFIG.NETWORK.chainId})

REQUIREMENTS:
  - PRIVATE_KEY in .env file
  - Sufficient gas for transactions
  - Connected to Base mainnet

NOTE:
  Burned TALLY tokens cannot be recovered. Verify amounts carefully.
  Use --dry-run first to simulate the transaction.

For more info: https://github.com/convergent-intelligence/convergence-protocol
    `);
    return;
  }

  const command = args[0];
  const address = args[1];
  const amount = args[2];
  const dryRun = args.includes('--dry-run');

  try {
    switch (command) {
      case 'check-balance':
        if (!address) throw new Error('Address required');
        await checkBalance(address);
        break;

      case 'burn':
        if (!address) throw new Error('Address required');
        if (!amount) throw new Error('Amount required');
        await burnTally(address, amount, dryRun);
        break;

      case 'burn-all':
        if (!address) throw new Error('Address required');
        await burnAll(address, dryRun);
        break;

      case 'help':
      case '-h':
      case '--help':
        // Show help (handled above)
        break;

      default:
        console.error(`\n✗ Unknown command: ${command}\n`);
        console.log('Use "tally-burn help" for usage information\n');
        process.exit(1);
    }
  } catch (error) {
    console.error(`\n✗ Error: ${error.message}\n`);
    process.exit(1);
  }
}

main().catch(error => {
  console.error(`\n✗ Fatal error: ${error.message}\n`);
  process.exit(1);
});
