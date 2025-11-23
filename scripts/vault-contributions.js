#!/usr/bin/env node

/**
 * Vault Contributions Tracker
 *
 * View all your contributions to the Convergence Protocol reserve
 * Shows USDT donated, TALLY minted, current balances, and burn potential
 *
 * Usage:
 *   node scripts/vault-contributions.js <wallet_address>
 *   node scripts/vault-contributions.js 0xdc20d621a88cb8908E8E7042431C55F0E9DAc6FB
 */

require('dotenv').config();
const ethers = require('ethers');
const fs = require('fs');
const path = require('path');

// ==================== CONFIGURATION ====================

const CONFIG = {
  TALLY_ADDRESS: '0x1dCCFAfAe8115A299CdB3Aa21abf4Ba471eC71BA',
  TRUST_ADDRESS: '0xDb7CDd209C7f5dC007e887336c6d5544a7A21280',
  RESERVE_VAULT: '0x0Ff351f09f47095d4C942Ef58F8A5198C65A3b4c',
  USDT_ADDRESS: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',

  BURN_RATE: 1.5,  // Premium rate

  NETWORK: {
    name: 'base',
    chainId: 8453,
    rpc: 'https://mainnet.base.org'
  }
};

// ERC20 ABI (minimal)
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)'
];

// Provider
const provider = new ethers.JsonRpcProvider(CONFIG.NETWORK.rpc);

// ==================== UTILITIES ====================

function formatAddress(addr) {
  return addr.substring(0, 6) + '...' + addr.substring(38);
}

function validateAddress(addr) {
  return ethers.isAddress(addr);
}

// ==================== LEDGER FUNCTIONS ====================

function getLedgerPath() {
  return path.join(__dirname, 'reserve-ledger.json');
}

function loadLedger() {
  const ledgerPath = getLedgerPath();
  if (!fs.existsSync(ledgerPath)) {
    return { donors: [] };
  }

  try {
    const data = fs.readFileSync(ledgerPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading ledger:', error.message);
    return { donors: [] };
  }
}

function getUserContributions(walletAddress) {
  const ledger = loadLedger();
  const normalizedAddress = walletAddress.toLowerCase();

  return ledger.donations.filter(d => d.donorAddress.toLowerCase() === normalizedAddress) || [];
}

// ==================== BALANCE FUNCTIONS ====================

async function getTokenBalance(address, tokenType = 'TALLY') {
  try {
    const tokenAddr = tokenType === 'TALLY' ? CONFIG.TALLY_ADDRESS :
                      tokenType === 'TRUST' ? CONFIG.TRUST_ADDRESS :
                      CONFIG.USDT_ADDRESS;

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

// ==================== DISPLAY FUNCTIONS ====================

function displayContributions(walletAddress, contributions, tallyBalance, trustBalance) {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║           YOUR VAULT CONTRIBUTIONS                           ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');

  console.log(`\n📍 Wallet: ${formatAddress(walletAddress)}`);
  console.log(`   Full: ${walletAddress}\n`);

  // Summary
  if (contributions.length === 0) {
    console.log('No contributions found in ledger.\n');
    return;
  }

  const totalDonated = contributions.reduce((sum, c) => sum + parseFloat(c.usdtAmount), 0);
  const totalMinted = contributions.reduce((sum, c) => sum + parseFloat(c.tallyAmount), 0);

  console.log('📊 CONTRIBUTION SUMMARY');
  console.log('───────────────────────────────────────────────────────────────');
  console.log(`  Total USDT Donated:        ${totalDonated.toFixed(2)} USDT`);
  console.log(`  Total TALLY Minted:        ${totalMinted.toFixed(6)} TALLY`);
  console.log(`  Number of Donations:       ${contributions.length}`);

  // Individual donations
  console.log('\n💰 INDIVIDUAL DONATIONS');
  console.log('───────────────────────────────────────────────────────────────');

  contributions.forEach((contribution, index) => {
    const date = new Date(contribution.timestamp).toLocaleString();
    console.log(`  #${index + 1}: ${contribution.usdtAmount} USDT → ${contribution.tallyAmount} TALLY`);
    console.log(`      Date: ${date}`);
    if (contribution.txHash) {
      console.log(`      TX: ${contribution.txHash}`);
    }
  });

  // Current balances
  console.log('\n💎 CURRENT BALANCES');
  console.log('───────────────────────────────────────────────────────────────');
  console.log(`  TALLY:                     ${tallyBalance.formatted} TALLY`);
  console.log(`  TRUST:                     ${trustBalance.formatted} TRUST`);

  const portfolioValue = parseFloat(tallyBalance.formatted) + parseFloat(trustBalance.formatted);
  console.log(`  Portfolio Value (USD):     $${portfolioValue.toFixed(2)} USD`);

  // Burn potential
  console.log('\n🔥 BURN CONVERSION POTENTIAL');
  console.log('───────────────────────────────────────────────────────────────');

  const tallyAmount = parseFloat(tallyBalance.formatted);
  const potentialTrust = tallyAmount * CONFIG.BURN_RATE;

  console.log(`  Current TALLY:             ${tallyAmount.toFixed(6)} TALLY`);
  console.log(`  Conversion Rate:           1 TALLY → ${CONFIG.BURN_RATE} TRUST`);
  console.log(`  Potential TRUST:           ${potentialTrust.toFixed(6)} TRUST`);
  console.log(`  Total Value After Burn:    $${(potentialTrust + parseFloat(trustBalance.formatted)).toFixed(2)} USD`);

  console.log('\n' + '═'.repeat(63) + '\n');
}

// ==================== MAIN ====================

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║   Vault Contributions Tracker                                 ║
║   View your reserve contributions and current balances        ║
╚═══════════════════════════════════════════════════════════════╝

USAGE:
  vault-contributions <wallet_address>

EXAMPLES:
  node scripts/vault-contributions.js 0xdc20d621a88cb8908E8E7042431C55F0E9DAc6FB
  node scripts/vault-contributions.js 0x8Ffa5CAaBE8ee3d9019865120a654464BC4654cd

OUTPUT:
  - Shows all USDT donations you've made
  - Shows TALLY minted for each donation
  - Shows current TALLY and TRUST balances
  - Shows potential TRUST from burning current TALLY
  - Shows your portfolio value in USD

DATA SOURCES:
  - Donation ledger: scripts/reserve-ledger.json
  - Balance queries: Base mainnet (real-time)

NETWORK:
  Chain ID: 8453 (Base Mainnet)
  RPC: https://mainnet.base.org
    `);
    return;
  }

  const walletAddress = args[0];

  if (!validateAddress(walletAddress)) {
    console.error('\n✗ Invalid wallet address format\n');
    process.exit(1);
  }

  try {
    console.log('\n⏳ Loading your contribution history...\n');

    // Get contributions from ledger
    const contributions = getUserContributions(walletAddress);

    // Get current balances from blockchain
    const tallyBalance = await getTokenBalance(walletAddress, 'TALLY');
    const trustBalance = await getTokenBalance(walletAddress, 'TRUST');

    // Display
    displayContributions(walletAddress, contributions, tallyBalance, trustBalance);

  } catch (error) {
    console.error(`\n✗ Error: ${error.message}\n`);
    process.exit(1);
  }
}

main().catch(error => {
  console.error(`\n✗ Fatal error: ${error.message}\n`);
  process.exit(1);
});
