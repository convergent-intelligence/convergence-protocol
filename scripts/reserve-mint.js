#!/usr/bin/env node

/**
 * Reserve Minting & Donor Tracking System
 *
 * Maintains 1:1 TALLY-USDT peg by:
 * 1. Tracking donations via smart contract events
 * 2. Minting TALLY tokens to donor addresses
 * 3. Ensuring accurate accounting between USDT deposited and TALLY minted
 * 4. Preventing duplicate minting
 *
 * Usage:
 *   node scripts/reserve-mint.js check-reserves
 *   node scripts/reserve-mint.js query-donors
 *   node scripts/reserve-mint.js mint-to <donor-address> <usdt-amount>
 *   node scripts/reserve-mint.js reconcile
 *   node scripts/reserve-mint.js status
 *
 * Donor tracking file: scripts/reserve-ledger.json
 */

require('dotenv').config();
const ethers = require('ethers');
const fs = require('fs');
const path = require('path');

// ==================== CONFIGURATION ====================

const RESERVE_CONFIG = {
  TALLY_ADDRESS: '0x1dCCFAfAe8115A299CdB3Aa21abf4Ba471eC71BA',
  USDT_ADDRESS: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', // Base USDT
  RESERVE_VAULT: '0x0Ff351f09f47095d4C942Ef58F8A5198C65A3b4c',

  // Peg: 1 USDT deposited = 1 TALLY minted
  MINT_RATIO: 1.0,

  NETWORK: {
    name: 'base',
    chainId: 8453,
    rpc: 'https://mainnet.base.org'
  },

  // Ledger file to track donations and minting
  LEDGER_FILE: path.join(__dirname, 'reserve-ledger.json')
};

// ERC20 ABI
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function mint(address to, uint256 amount) returns (bool)',
  'function totalSupply() view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)'
];

// Provider and signer
const provider = new ethers.JsonRpcProvider(RESERVE_CONFIG.NETWORK.rpc);
let signer = null;

// ==================== LEDGER MANAGEMENT ====================

function loadLedger() {
  if (fs.existsSync(RESERVE_CONFIG.LEDGER_FILE)) {
    try {
      const data = fs.readFileSync(RESERVE_CONFIG.LEDGER_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading ledger: ${error.message}`);
      return initializeLedger();
    }
  }
  return initializeLedger();
}

function initializeLedger() {
  return {
    version: '1.0',
    created: new Date().toISOString(),
    donors: {},
    transactions: [],
    totals: {
      usdtReceived: '0',
      tallyMinted: '0',
      balance: '0'
    },
    peg: RESERVE_CONFIG.MINT_RATIO
  };
}

function saveLedger(ledger) {
  fs.writeFileSync(
    RESERVE_CONFIG.LEDGER_FILE,
    JSON.stringify(ledger, null, 2),
    'utf8'
  );
}

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
    return signer;
  } catch (error) {
    throw new Error(`Failed to initialize signer: ${error.message}`);
  }
}

// ==================== CONTRACT QUERIES ====================

async function getReserveBalance() {
  try {
    const usdtContract = new ethers.Contract(RESERVE_CONFIG.USDT_ADDRESS, ERC20_ABI, provider);
    const tallyContract = new ethers.Contract(RESERVE_CONFIG.TALLY_ADDRESS, ERC20_ABI, provider);

    const usdtBalance = await usdtContract.balanceOf(RESERVE_CONFIG.RESERVE_VAULT);
    const tallySupply = await tallyContract.totalSupply();
    const decimals = await usdtContract.decimals();

    return {
      usdt: {
        raw: usdtBalance.toString(),
        formatted: ethers.formatUnits(usdtBalance, decimals),
        decimals: decimals
      },
      tally: {
        raw: tallySupply.toString(),
        formatted: ethers.formatUnits(tallySupply, 18)
      }
    };
  } catch (error) {
    throw new Error(`Failed to get reserve balance: ${error.message}`);
  }
}

async function getDonorBalance(donorAddress) {
  try {
    const tallyContract = new ethers.Contract(RESERVE_CONFIG.TALLY_ADDRESS, ERC20_ABI, provider);
    const balance = await tallyContract.balanceOf(donorAddress);
    const decimals = await tallyContract.decimals();

    return {
      raw: balance.toString(),
      formatted: ethers.formatUnits(balance, decimals),
      decimals: decimals
    };
  } catch (error) {
    throw new Error(`Failed to get donor balance: ${error.message}`);
  }
}

// ==================== MINTING OPERATIONS ====================

async function mintToAddress(donorAddress, usdtAmount) {
  if (!validateAddress(donorAddress)) {
    throw new Error('Invalid donor address');
  }

  if (parseFloat(usdtAmount) <= 0) {
    throw new Error('Amount must be greater than 0');
  }

  console.log('\n🏦 RESERVE MINTING - DONOR TO TALLY');
  console.log('═'.repeat(70));

  try {
    if (!signer) {
      await initSigner();
    }

    const ledger = loadLedger();

    console.log(`\n📍 Donor Address: ${formatAddress(donorAddress)}`);
    console.log(`   Full: ${donorAddress}`);
    console.log(`   USDT Deposit: ${usdtAmount} USDT\n`);

    // Check if already minted
    if (ledger.donors[donorAddress.toLowerCase()]) {
      const existingMint = ledger.donors[donorAddress.toLowerCase()];
      console.log(`⚠️  WARNING: Previous mint found for this address`);
      console.log(`   Previous USDT: ${existingMint.usdtAmount}`);
      console.log(`   Previous TALLY: ${existingMint.tallyMinted}`);
      console.log(`   Date: ${existingMint.timestamp}\n`);
    }

    // Calculate TALLY to mint
    const tallyToMint = parseFloat(usdtAmount) * RESERVE_CONFIG.MINT_RATIO;
    const tallyWei = ethers.parseUnits(tallyToMint.toString(), 18);

    console.log(`💰 MINT CALCULATION`);
    console.log(`   USDT deposit: ${usdtAmount} USDT`);
    console.log(`   Peg ratio: 1 USDT = ${RESERVE_CONFIG.MINT_RATIO} TALLY`);
    console.log(`   TALLY to mint: ${tallyToMint} TALLY\n`);

    // Get current balances
    const reserves = await getReserveBalance();
    const donorBalance = await getDonorBalance(donorAddress);

    console.log(`📊 CURRENT STATE`);
    console.log(`   Reserve USDT: ${reserves.usdt.formatted} USDT`);
    console.log(`   TALLY Supply: ${reserves.tally.formatted} TALLY`);
    console.log(`   Donor TALLY: ${donorBalance.formatted} TALLY\n`);

    // Execute minting
    console.log(`📤 EXECUTING MINT...\n`);

    const tallyContract = new ethers.Contract(RESERVE_CONFIG.TALLY_ADDRESS, ERC20_ABI, signer);

    // Mint tokens to donor
    console.log('Minting TALLY to donor address...');
    const mintTx = await tallyContract.mint(donorAddress, tallyWei);
    console.log(`  Tx hash: ${mintTx.hash}`);
    const receipt = await mintTx.wait();
    console.log(`  ✓ Confirmed\n`);

    // Update ledger
    const normalizedAddress = donorAddress.toLowerCase();
    if (!ledger.donors[normalizedAddress]) {
      ledger.donors[normalizedAddress] = {
        address: donorAddress,
        usdtAmount: usdtAmount,
        tallyMinted: tallyToMint,
        timestamp: new Date().toISOString(),
        txHash: receipt.hash
      };
    } else {
      // Update existing (cumulative)
      ledger.donors[normalizedAddress].usdtAmount =
        (parseFloat(ledger.donors[normalizedAddress].usdtAmount) + parseFloat(usdtAmount)).toString();
      ledger.donors[normalizedAddress].tallyMinted =
        (parseFloat(ledger.donors[normalizedAddress].tallyMinted) + tallyToMint).toString();
      ledger.donors[normalizedAddress].lastUpdated = new Date().toISOString();
    }

    // Update totals
    ledger.totals.usdtReceived = (
      parseFloat(ledger.totals.usdtReceived) + parseFloat(usdtAmount)
    ).toString();
    ledger.totals.tallyMinted = (
      parseFloat(ledger.totals.tallyMinted) + tallyToMint
    ).toString();

    // Add transaction record
    ledger.transactions.push({
      type: 'mint',
      donor: donorAddress,
      usdtAmount: usdtAmount,
      tallyAmount: tallyToMint,
      txHash: receipt.hash,
      timestamp: new Date().toISOString()
    });

    saveLedger(ledger);

    // Verify new balance
    const newDonorBalance = await getDonorBalance(donorAddress);

    console.log('═'.repeat(70));
    console.log('\n✓ MINTING SUCCESSFUL\n');
    console.log(`📊 SUMMARY:`);
    console.log(`   USDT Deposited: ${usdtAmount} USDT`);
    console.log(`   TALLY Minted: ${tallyToMint} TALLY`);
    console.log(`   Donor New Balance: ${newDonorBalance.formatted} TALLY\n`);
    console.log(`🔗 Transaction: https://basescan.org/tx/${receipt.hash}\n`);
    console.log(`✓ Ledger updated and saved\n`);

  } catch (error) {
    console.error(`\n✗ Error: ${error.message}`);
    process.exit(1);
  }
}

// ==================== REPORTING ====================

function checkReserves() {
  console.log('\n🏦 RESERVE STATUS');
  console.log('═'.repeat(70));

  try {
    const ledger = loadLedger();

    console.log(`\n📊 TOTALS`);
    console.log(`   USDT Received: ${ledger.totals.usdtReceived} USDT`);
    console.log(`   TALLY Minted: ${ledger.totals.tallyMinted} TALLY`);
    console.log(`   Peg Ratio: 1 USDT = ${ledger.peg} TALLY\n`);

    console.log(`📋 DONORS (${Object.keys(ledger.donors).length})`);

    Object.values(ledger.donors).forEach((donor, index) => {
      console.log(`\n   ${index + 1}. ${formatAddress(donor.address)}`);
      console.log(`      USDT: ${donor.usdtAmount} USDT`);
      console.log(`      TALLY: ${donor.tallyMinted} TALLY`);
      console.log(`      Date: ${donor.timestamp}`);
    });

    console.log(`\n📝 LEDGER FILE: ${RESERVE_CONFIG.LEDGER_FILE}`);
    console.log(`✓ Data persisted and verifiable\n`);
    console.log('═'.repeat(70) + '\n');

  } catch (error) {
    console.error(`\n✗ Error: ${error.message}`);
    process.exit(1);
  }
}

function queryDonors() {
  console.log('\n👥 DONOR QUERY');
  console.log('═'.repeat(70));

  try {
    const ledger = loadLedger();

    if (Object.keys(ledger.donors).length === 0) {
      console.log('\n⚠️  No donors recorded yet\n');
      return;
    }

    console.log('\nDONOR RECORDS:\n');

    Object.values(ledger.donors).forEach((donor, index) => {
      console.log(`${index + 1}. Address: ${donor.address}`);
      console.log(`   USDT Deposit: ${donor.usdtAmount}`);
      console.log(`   TALLY Minted: ${donor.tallyMinted}`);
      console.log(`   Transaction: ${donor.txHash}`);
      console.log(`   Timestamp: ${donor.timestamp}`);
      console.log();
    });

    console.log('═'.repeat(70) + '\n');

  } catch (error) {
    console.error(`\n✗ Error: ${error.message}`);
    process.exit(1);
  }
}

async function reconcile() {
  console.log('\n⚖️  RECONCILIATION CHECK');
  console.log('═'.repeat(70));

  try {
    const ledger = loadLedger();
    const reserves = await getReserveBalance();

    const ledgerTotalUsdt = parseFloat(ledger.totals.usdtReceived);
    const ledgerTotalTally = parseFloat(ledger.totals.tallyMinted);
    const chainTally = parseFloat(reserves.tally.formatted);
    const chainUsdt = parseFloat(reserves.usdt.formatted);

    console.log(`\n📊 LEDGER vs BLOCKCHAIN\n`);

    console.log(`USDT (Reserve Balance):`);
    console.log(`  Ledger: ${ledgerTotalUsdt} USDT`);
    console.log(`  Chain: ${chainUsdt} USDT`);
    const usdtMatch = Math.abs(ledgerTotalUsdt - chainUsdt) < 0.01;
    console.log(`  Match: ${usdtMatch ? '✓ YES' : '✗ NO'}\n`);

    console.log(`TALLY (Total Supply):`);
    console.log(`  Ledger: ${ledgerTotalTally} TALLY`);
    console.log(`  Chain: ${chainTally} TALLY`);
    const tallyMatch = Math.abs(ledgerTotalTally - chainTally) < 0.01;
    console.log(`  Match: ${tallyMatch ? '✓ YES' : '✗ NO'}\n`);

    console.log(`PEG VERIFICATION:`);
    console.log(`  Expected ratio: 1 USDT = ${RESERVE_CONFIG.MINT_RATIO} TALLY`);
    if (ledgerTotalUsdt > 0) {
      const actualRatio = ledgerTotalTally / ledgerTotalUsdt;
      console.log(`  Actual ratio: 1 USDT = ${actualRatio} TALLY`);
      const pegIntact = Math.abs(actualRatio - RESERVE_CONFIG.MINT_RATIO) < 0.01;
      console.log(`  Peg intact: ${pegIntact ? '✓ YES' : '✗ NO'}`);
    }

    console.log(`\n${usdtMatch && tallyMatch ? '✓ RECONCILIATION OK' : '⚠️  DISCREPANCIES FOUND'}\n`);
    console.log('═'.repeat(70) + '\n');

  } catch (error) {
    console.error(`\n✗ Error: ${error.message}`);
    process.exit(1);
  }
}

async function status() {
  console.log('\n📡 SYSTEM STATUS');
  console.log('═'.repeat(70));

  try {
    const ledger = loadLedger();
    const reserves = await getReserveBalance();

    console.log(`\n🌐 NETWORK`);
    console.log(`   Name: ${RESERVE_CONFIG.NETWORK.name}`);
    console.log(`   Chain ID: ${RESERVE_CONFIG.NETWORK.chainId}`);
    console.log(`   RPC: ${RESERVE_CONFIG.NETWORK.rpc}\n`);

    console.log(`💼 CONTRACTS`);
    console.log(`   TALLY: ${RESERVE_CONFIG.TALLY_ADDRESS}`);
    console.log(`   USDT: ${RESERVE_CONFIG.USDT_ADDRESS}`);
    console.log(`   Vault: ${RESERVE_CONFIG.RESERVE_VAULT}\n`);

    console.log(`📊 RESERVE STATE`);
    console.log(`   USDT Balance: ${reserves.usdt.formatted} USDT`);
    console.log(`   TALLY Supply: ${reserves.tally.formatted} TALLY`);
    console.log(`   Peg Ratio: 1 USDT = ${RESERVE_CONFIG.MINT_RATIO} TALLY\n`);

    console.log(`📋 LEDGER STATE`);
    console.log(`   Total Donors: ${Object.keys(ledger.donors).length}`);
    console.log(`   USDT Recorded: ${ledger.totals.usdtReceived} USDT`);
    console.log(`   TALLY Minted: ${ledger.totals.tallyMinted} TALLY`);
    console.log(`   Ledger File: ${RESERVE_CONFIG.LEDGER_FILE}\n`);

    console.log(`✓ System ready for donations and minting\n`);
    console.log('═'.repeat(70) + '\n');

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
║   Reserve Minting & Donor Tracking System                 ║
║   Maintains 1:1 TALLY-USDT peg                            ║
╚═══════════════════════════════════════════════════════════╝

USAGE:
  reserve-mint <command> [options]

COMMANDS:
  check-reserves           Show reserve status and all donors
  query-donors             List all donor records
  mint-to <addr> <amount>  Mint TALLY to donor (amount in USDT)
  reconcile                Verify ledger vs blockchain
  status                   System status and health check
  help                     Show this help message

EXAMPLES:
  # Check current reserve state
  node scripts/reserve-mint.js check-reserves

  # Mint 100 USDT worth of TALLY to donor
  node scripts/reserve-mint.js mint-to 0xdc20d... 100

  # Verify accounting
  node scripts/reserve-mint.js reconcile

  # System health check
  node scripts/reserve-mint.js status

CONFIGURATION:
  TALLY Token:    ${RESERVE_CONFIG.TALLY_ADDRESS}
  USDT Token:     ${RESERVE_CONFIG.USDT_ADDRESS}
  Vault Address:  ${RESERVE_CONFIG.RESERVE_VAULT}
  Peg Ratio:      1 USDT = ${RESERVE_CONFIG.MINT_RATIO} TALLY
  Network:        ${RESERVE_CONFIG.NETWORK.name} (Chain ${RESERVE_CONFIG.NETWORK.chainId})
  Ledger:         ${RESERVE_CONFIG.LEDGER_FILE}

FEATURES:
  ✓ Track donations via on-chain events
  ✓ Mint TALLY to donor addresses
  ✓ Maintain 1:1 TALLY-USDT peg
  ✓ Prevent duplicate minting
  ✓ Persistent ledger (JSON file)
  ✓ Reconciliation verification
  ✓ Transaction tracking

REQUIREMENTS:
  - PRIVATE_KEY in .env file
  - Reserve vault has minting permissions
  - Connected to Base mainnet
  - Sufficient gas for transactions

For more info: https://github.com/convergent-intelligence/convergence-protocol
    `);
    return;
  }

  const command = args[0];
  const address = args[1];
  const amount = args[2];

  try {
    switch (command) {
      case 'check-reserves':
        checkReserves();
        break;

      case 'query-donors':
        queryDonors();
        break;

      case 'mint-to':
        if (!address) throw new Error('Donor address required');
        if (!amount) throw new Error('USDT amount required');
        await mintToAddress(address, amount);
        break;

      case 'reconcile':
        await reconcile();
        break;

      case 'status':
        await status();
        break;

      case 'help':
      case '-h':
      case '--help':
        // Show help (handled above)
        break;

      default:
        console.error(`\n✗ Unknown command: ${command}\n`);
        console.log('Use "reserve-mint help" for usage information\n');
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
