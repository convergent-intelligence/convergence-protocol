#!/usr/bin/env node

/**
 * TALLY Supply & Reserve Status
 *
 * View total TALLY supply, reserve backing, peg ratio, and network status
 * Shows reconciliation verification and top holders
 *
 * Usage:
 *   node scripts/tally-supply.js
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

  NETWORK: {
    name: 'base',
    chainId: 8453,
    rpc: 'https://mainnet.base.org'
  }
};

// ERC20 ABI
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function name() view returns (string)'
];

// Provider
const provider = new ethers.JsonRpcProvider(CONFIG.NETWORK.rpc);

// ==================== LEDGER FUNCTIONS ====================

function getLedgerPath() {
  return path.join(__dirname, 'reserve-ledger.json');
}

function loadLedger() {
  const ledgerPath = getLedgerPath();
  if (!fs.existsSync(ledgerPath)) {
    return { donations: [] };
  }

  try {
    const data = fs.readFileSync(ledgerPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { donations: [] };
  }
}

function getTopDonors(count = 3) {
  const ledger = loadLedger();

  // Group by donor and sum amounts
  const donorTotals = {};
  (ledger.donations || []).forEach(d => {
    const addr = d.donorAddress.toLowerCase();
    if (!donorTotals[addr]) {
      donorTotals[addr] = { address: d.donorAddress, usdt: 0, tally: 0 };
    }
    donorTotals[addr].usdt += parseFloat(d.usdtAmount);
    donorTotals[addr].tally += parseFloat(d.tallyAmount);
  });

  // Sort by USDT amount and get top N
  return Object.values(donorTotals)
    .sort((a, b) => b.usdt - a.usdt)
    .slice(0, count);
}

// ==================== TOKEN FUNCTIONS ====================

async function getTokenInfo(address, type = 'TALLY') {
  try {
    const contract = new ethers.Contract(address, ERC20_ABI, provider);
    const [totalSupply, decimals, symbol, name] = await Promise.all([
      contract.totalSupply(),
      contract.decimals(),
      contract.symbol(),
      contract.name()
    ]);

    return {
      address: address,
      name: name,
      symbol: symbol,
      totalSupply: ethers.formatUnits(totalSupply, decimals),
      rawSupply: totalSupply.toString(),
      decimals: decimals
    };
  } catch (error) {
    throw new Error(`Failed to get ${type} info: ${error.message}`);
  }
}

async function getReserveBalance() {
  try {
    const contract = new ethers.Contract(CONFIG.USDT_ADDRESS, ERC20_ABI, provider);
    const balance = await contract.balanceOf(CONFIG.RESERVE_VAULT);
    const decimals = await contract.decimals();

    return {
      raw: balance.toString(),
      formatted: ethers.formatUnits(balance, decimals),
      decimals: decimals
    };
  } catch (error) {
    throw new Error(`Failed to get reserve balance: ${error.message}`);
  }
}

// ==================== DISPLAY FUNCTIONS ====================

function displaySupplyStatus(tallyInfo, trustInfo, reserveUsdt) {
  const ledger = loadLedger();
  const donations = ledger.donations || [];

  // Calculate ledger totals
  const ledgerUSDT = donations.reduce((sum, d) => sum + parseFloat(d.usdtAmount), 0);
  const ledgerTALLY = donations.reduce((sum, d) => sum + parseFloat(d.tallyAmount), 0);

  // Calculate burn totals
  const burnTotals = donations.reduce((acc, d) => {
    if (d.burned) {
      acc.tallyBurned += parseFloat(d.tallyBurned);
      acc.trustEarned += parseFloat(d.trustEarned);
    }
    return acc;
  }, { tallyBurned: 0, trustEarned: 0 });

  const reserveUsdtFormatted = parseFloat(reserveUsdt.formatted);
  const tallySupply = parseFloat(tallyInfo.totalSupply);
  const trustSupply = parseFloat(trustInfo.totalSupply);

  // Peg ratio
  const pegRatio = tallySupply > 0 ? (reserveUsdtFormatted / tallySupply).toFixed(4) : 'N/A';
  const pegHealthy = Math.abs(parseFloat(pegRatio) - 1.0) < 0.001;

  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║   TALLY PROTOCOL - SUPPLY & RESERVE STATUS                    ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');

  // TALLY Token Section
  console.log('\n📊 TALLY TOKEN (Governance & Value)');
  console.log('───────────────────────────────────────────────────────────────');
  console.log(`  Address:                   ${CONFIG.TALLY_ADDRESS}`);
  console.log(`  Total Supply:              ${parseFloat(tallyInfo.totalSupply).toLocaleString()} TALLY`);
  console.log(`  Circulating:               ${parseFloat(tallyInfo.totalSupply).toLocaleString()} TALLY`);
  console.log(`  Decimals:                  18`);

  // TRUST Token Section
  console.log('\n💎 TRUST TOKEN (Earned from Burning)');
  console.log('───────────────────────────────────────────────────────────────');
  console.log(`  Address:                   ${CONFIG.TRUST_ADDRESS}`);
  console.log(`  Total Supply:              ${parseFloat(trustInfo.totalSupply).toFixed(6)} TRUST`);
  if (burnTotals.tallyBurned > 0) {
    console.log(`  Earned from Burns:         ${burnTotals.trustEarned.toFixed(6)} TRUST`);
    console.log(`  TALLY Burned:              ${burnTotals.tallyBurned.toFixed(6)} TALLY (@ 1.5x rate)`);
  }
  console.log(`  Decimals:                  18`);

  // Reserve Backing
  console.log('\n🏦 RESERVE BACKING');
  console.log('───────────────────────────────────────────────────────────────');
  console.log(`  USDT in Vault:             ${reserveUsdtFormatted.toLocaleString('en', {minimumFractionDigits: 2, maximumFractionDigits: 2})} USDT`);
  console.log(`  TALLY Minted:              ${tallySupply.toLocaleString()} TALLY`);
  console.log(`  Peg Ratio:                 ${pegRatio} (${pegHealthy ? '✓ HEALTHY' : '✗ WARNING'})`);

  // Verification
  console.log('\n✓ RECONCILIATION VERIFICATION');
  console.log('───────────────────────────────────────────────────────────────');

  const usdtMatch = Math.abs(ledgerUSDT - reserveUsdtFormatted) < 1;
  const tallyMatch = Math.abs(ledgerTALLY - tallySupply) < 1;
  const pegIntact = pegHealthy;

  console.log(`  Ledger USDT vs Reserve:    ${usdtMatch ? '✓ MATCH' : '✗ MISMATCH'}`);
  console.log(`    Ledger:   ${ledgerUSDT.toLocaleString('en', {minimumFractionDigits: 2, maximumFractionDigits: 2})} USDT`);
  console.log(`    Reserve:  ${reserveUsdtFormatted.toLocaleString('en', {minimumFractionDigits: 2, maximumFractionDigits: 2})} USDT`);

  console.log(`  Ledger TALLY vs Supply:    ${tallyMatch ? '✓ MATCH' : '✗ MISMATCH'}`);
  console.log(`    Ledger:   ${ledgerTALLY.toLocaleString()} TALLY`);
  console.log(`    Supply:   ${tallySupply.toLocaleString()} TALLY`);

  console.log(`  1:1 Peg Intact:            ${pegIntact ? '✓ YES' : '✗ NO'}`);

  if (usdtMatch && tallyMatch && pegIntact) {
    console.log(`\n  Overall Status:            ✓ HEALTHY - All systems verified`);
  } else {
    console.log(`\n  Overall Status:            ⚠️  ALERT - Manual verification needed`);
  }

  // Top Donors
  console.log('\n👥 TOP DONORS');
  console.log('───────────────────────────────────────────────────────────────');

  const topDonors = getTopDonors(5);
  if (topDonors.length === 0) {
    console.log('  No donations recorded yet');
  } else {
    topDonors.forEach((donor, index) => {
      const percentage = ((donor.tally / tallySupply) * 100).toFixed(1);
      console.log(`  ${index + 1}. ${donor.address.substring(0, 10)}...`);
      console.log(`     ${donor.usdt.toLocaleString('en', {minimumFractionDigits: 2, maximumFractionDigits: 2})} USDT → ${donor.tally.toLocaleString()} TALLY (${percentage}%)`);
    });
  }

  // Price Data
  console.log('\n💵 PRICE DATA');
  console.log('───────────────────────────────────────────────────────────────');
  console.log(`  USDT/USD:                  $1.00 (stablecoin)`);
  console.log(`  TALLY/USDT:                $${pegRatio} (pegged)`);
  console.log(`  TALLY/USD:                 $${pegRatio}`);

  const marketCap = tallySupply * parseFloat(pegRatio);
  console.log(`\n  Market Cap:                $${marketCap.toLocaleString('en', {minimumFractionDigits: 0, maximumFractionDigits: 2})} USD`);
  console.log(`  Circulating MC:            $${marketCap.toLocaleString('en', {minimumFractionDigits: 0, maximumFractionDigits: 2})} USD`);

  // Network Status
  console.log('\n🌐 NETWORK STATUS');
  console.log('───────────────────────────────────────────────────────────────');
  console.log(`  Chain:                     Base Mainnet (Chain ID 8453)`);
  console.log(`  RPC:                       https://mainnet.base.org`);

  try {
    console.log(`  Status:                    ✓ RESPONSIVE (real-time data)`);
  } catch (error) {
    console.log(`  Status:                    ✗ UNAVAILABLE`);
  }

  // Statistics
  console.log('\n📈 STATISTICS');
  console.log('───────────────────────────────────────────────────────────────');
  console.log(`  Total Donations:           ${donations.length}`);
  console.log(`  Unique Donors:             ${new Set(donations.map(d => d.donorAddress.toLowerCase())).size}`);
  console.log(`  Cumulative USDT:           ${ledgerUSDT.toLocaleString('en', {minimumFractionDigits: 2, maximumFractionDigits: 2})} USDT`);
  console.log(`  Cumulative TALLY:          ${ledgerTALLY.toLocaleString()} TALLY`);

  console.log('\n' + '═'.repeat(63) + '\n');
}

// ==================== MAIN ====================

async function main() {
  const args = process.argv.slice(2);

  if (args[0] === '--help' || args[0] === '-h') {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║   TALLY Supply & Reserve Status                              ║
║   View total supply, peg ratio, and reserve backing          ║
╚═══════════════════════════════════════════════════════════════╝

USAGE:
  node scripts/tally-supply.js

OUTPUT:
  - TALLY token total supply
  - TRUST token total supply
  - Reserve USDT holdings
  - 1:1 peg ratio verification
  - Reconciliation status
  - Top donors
  - Price data
  - Market cap
  - Network status

DATA SOURCES:
  - Token supply: Smart contracts on Base
  - Reserve balance: Contract balances
  - Donations: Local ledger (reserve-ledger.json)
  - Reconciliation: Ledger vs blockchain verification

NETWORK:
  Chain ID: 8453 (Base Mainnet)
  RPC: https://mainnet.base.org
    `);
    return;
  }

  try {
    console.log('\n⏳ Querying protocol status (Base mainnet)...\n');

    // Get all data in parallel
    const [tallyInfo, trustInfo, reserveBalance] = await Promise.all([
      getTokenInfo(CONFIG.TALLY_ADDRESS, 'TALLY'),
      getTokenInfo(CONFIG.TRUST_ADDRESS, 'TRUST'),
      getReserveBalance()
    ]);

    // Display results
    displaySupplyStatus(tallyInfo, trustInfo, reserveBalance);

  } catch (error) {
    console.error(`\n✗ Error: ${error.message}\n`);
    process.exit(1);
  }
}

main().catch(error => {
  console.error(`\n✗ Fatal error: ${error.message}\n`);
  process.exit(1);
});
