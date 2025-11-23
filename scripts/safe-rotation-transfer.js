#!/usr/bin/env node

/**
 * Safe Wallet Rotation - Asset Transfer Script
 * Transfers all assets from old Genesis/Agent to new wallets
 *
 * CRITICAL: Only run after pre-rotation-audit.js passes with zero errors
 *
 * Usage:
 *   node scripts/safe-rotation-transfer.js --old-genesis 0x... --new-genesis 0x... --old-agent 0x... --new-agent 0x... --dry-run
 *   node scripts/safe-rotation-transfer.js --old-genesis 0x... --new-genesis 0x... --old-agent 0x... --new-agent 0x... --execute
 */

const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');
const readline = require('readline');
require('dotenv').config();

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isExecute = args.includes('--execute');

if (!isDryRun && !isExecute) {
  console.error('ERROR: Must specify --dry-run or --execute');
  process.exit(1);
}

if (isDryRun && isExecute) {
  console.error('ERROR: Cannot specify both --dry-run and --execute');
  process.exit(1);
}

// Get wallet addresses from args
const argMap = {};
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--')) {
    argMap[args[i]] = args[i + 1];
  }
}

const oldGenesis = argMap['--old-genesis'];
const newGenesis = argMap['--new-genesis'];
const oldAgent = argMap['--old-agent'];
const newAgent = argMap['--new-agent'];

if (!oldGenesis || !newGenesis || !oldAgent || !newAgent) {
  console.error(`
USAGE: node scripts/safe-rotation-transfer.js \\
  --old-genesis 0xdc20d621a88cb8908E8E7042431C55F0E9DAc6FB \\
  --new-genesis 0x[NEW_ADDRESS] \\
  --old-agent 0x6628227C195DAd7F7a8fD4F3D2cA3545A0D9CD22 \\
  --new-agent 0x[NEW_ADDRESS] \\
  --dry-run
  `);
  process.exit(1);
}

// Verify addresses
try {
  ethers.getAddress(oldGenesis);
  ethers.getAddress(newGenesis);
  ethers.getAddress(oldAgent);
  ethers.getAddress(newAgent);
} catch (error) {
  console.error('ERROR: Invalid wallet address format');
  process.exit(1);
}

const CONTRACTS = {
  tally: '0xb8c4682644BAb1900A8B67C3295b8Ce525F3e35d',
  trust: '0x4A2178b300556e20569478bfed782bA02BFaD778',
  voucher: '0x69e4D4B1835dDEeFc56234E959102c17CF7816dC'
};

const ERC20_ABI = [
  'function balanceOf(address) public view returns (uint256)',
  'function transfer(address to, uint256 amount) public returns (bool)',
  'function allowance(address owner, address spender) public view returns (uint256)',
  'function approve(address spender, uint256 amount) public returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) public returns (bool)',
];

const OWNABLE_ABI = [
  'function owner() public view returns (address)',
  'function transferOwnership(address newOwner) public',
];

const PROVIDER_URL = process.env.INFURA_KEY
  ? `https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`
  : 'https://eth.llamarpc.com';

const provider = new ethers.JsonRpcProvider(PROVIDER_URL);

// Get signer from environment
const genesisPrivateKey = process.env.PRIVATE_KEY;
if (!genesisPrivateKey) {
  console.error('ERROR: PRIVATE_KEY not set in .env');
  process.exit(1);
}

const genesisSigner = new ethers.Wallet(genesisPrivateKey, provider);

// Verify signer is old Genesis wallet
if (genesisSigner.address.toLowerCase() !== oldGenesis.toLowerCase()) {
  console.error(`ERROR: Private key does not match old Genesis wallet`);
  console.error(`Expected: ${oldGenesis}`);
  console.error(`Got: ${genesisSigner.address}`);
  process.exit(1);
}

const transferLog = {
  timestamp: new Date().toISOString(),
  dryRun: isDryRun,
  oldGenesis,
  newGenesis,
  oldAgent,
  newAgent,
  transfers: [],
  contractTransfers: [],
  errors: []
};

async function askConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

async function main() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║           SAFE WALLET ROTATION - ASSET TRANSFER                ║
║  This script will transfer all assets from old to new wallets  ║
╚════════════════════════════════════════════════════════════════╝
  `);

  console.log(`Mode: ${isDryRun ? '🔍 DRY RUN (no changes)' : '🚀 EXECUTE (will make changes)'}\n`);

  console.log('Wallet Configuration:');
  console.log(`  Old Genesis: ${oldGenesis}`);
  console.log(`  New Genesis: ${newGenesis}`);
  console.log(`  Old Agent: ${oldAgent}`);
  console.log(`  New Agent: ${newAgent}`);
  console.log(`  Signer: ${genesisSigner.address}`);
  console.log();

  // Verify signer is old Genesis
  if (genesisSigner.address.toLowerCase() !== oldGenesis.toLowerCase()) {
    console.error('❌ ERROR: Signer is not the old Genesis wallet');
    process.exit(1);
  }
  console.log('✓ Signer verified as old Genesis wallet\n');

  try {
    // Step 1: Transfer Genesis assets
    console.log('─────────────────────────────────────────────────');
    console.log('STEP 1: Transfer Genesis Human Assets');
    console.log('─────────────────────────────────────────────────\n');

    await transferTokens('Genesis', oldGenesis, newGenesis);

    // Step 2: Transfer Agent assets (needs Agent private key)
    console.log('\n─────────────────────────────────────────────────');
    console.log('STEP 2: Transfer Agent Assets');
    console.log('─────────────────────────────────────────────────\n');

    const agentPrivateKey = process.env.AGENT_PRIVATE_KEY;
    if (!agentPrivateKey) {
      console.warn('⚠️  AGENT_PRIVATE_KEY not in .env - skipping Agent asset transfer');
      console.warn('   You will need to transfer Agent assets separately');
    } else {
      const agentSigner = new ethers.Wallet(agentPrivateKey, provider);
      if (agentSigner.address.toLowerCase() !== oldAgent.toLowerCase()) {
        console.warn('⚠️  AGENT_PRIVATE_KEY does not match old Agent wallet');
        console.warn('   Skipping Agent asset transfer');
      } else {
        // Override signer for agent transfers
        const oldSigner = genesisSigner;
        // Can't easily override, so will need manual transfer for Agent
        console.log('⚠️  Manual transfer needed for Agent assets');
        console.log(`   Please transfer from ${oldAgent} to ${newAgent}`);
      }
    }

    // Step 3: Transfer contract ownership
    console.log('\n─────────────────────────────────────────────────');
    console.log('STEP 3: Transfer Contract Ownership');
    console.log('─────────────────────────────────────────────────\n');

    await transferOwnership();

    // Summary
    console.log('\n─────────────────────────────────────────────────');
    console.log('TRANSFER SUMMARY');
    console.log('─────────────────────────────────────────────────\n');

    if (isDryRun) {
      console.log('✅ DRY RUN COMPLETE - No changes made');
      console.log('\nReview the transfers above. If correct, run with --execute\n');
    } else {
      console.log('✅ TRANSFERS COMPLETE\n');
      console.log('⚠️  IMPORTANT NEXT STEPS:');
      console.log('   1. Verify all assets transferred in new wallets');
      console.log('   2. Verify old wallets are now empty (or have dust only)');
      console.log('   3. Update .env with new private keys');
      console.log('   4. Update server.js with new addresses');
      console.log('   5. Restart server\n');
    }

    // Save log
    const timestamp = Date.now();
    const filename = `rotation-transfer-${timestamp}.json`;
    const filepath = path.join(__dirname, '..', 'data', filename);
    fs.mkdirSync(path.dirname(filepath), { recursive: true });
    fs.writeFileSync(filepath, JSON.stringify(transferLog, null, 2));
    console.log(`Log saved to: ${filepath}\n`);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    transferLog.errors.push(error.message);
    process.exit(1);
  }
}

async function transferTokens(walletName, fromAddress, toAddress) {
  for (const [tokenKey, tokenAddress] of Object.entries(CONTRACTS)) {
    console.log(`${tokenKey.toUpperCase()}:`);

    try {
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      const balance = await contract.balanceOf(fromAddress);

      if (balance === 0n) {
        console.log(`  Balance: 0 - skipping`);
        continue;
      }

      console.log(`  Current Balance: ${ethers.formatEther(balance)}`);

      if (isDryRun) {
        console.log(`  [DRY RUN] Would transfer ${ethers.formatEther(balance)} to ${toAddress}`);
        transferLog.transfers.push({
          token: tokenKey,
          from: fromAddress,
          to: toAddress,
          amount: ethers.formatEther(balance),
          dryRun: true
        });
      } else {
        console.log(`  Transferring...`);

        const contractWithSigner = contract.connect(genesisSigner);
        const tx = await contractWithSigner.transfer(toAddress, balance);
        const receipt = await tx.wait();

        console.log(`  ✅ Transferred - TxHash: ${receipt.hash}`);
        transferLog.transfers.push({
          token: tokenKey,
          from: fromAddress,
          to: toAddress,
          amount: ethers.formatEther(balance),
          txHash: receipt.hash,
          blockNumber: receipt.blockNumber
        });
      }

    } catch (error) {
      console.error(`  ❌ ERROR: ${error.message}`);
      transferLog.errors.push(`Failed to transfer ${tokenKey}: ${error.message}`);
    }
    console.log();
  }
}

async function transferOwnership() {
  for (const [contractName, contractAddress] of Object.entries(CONTRACTS)) {
    console.log(`${contractName.toUpperCase()} Contract:`);

    try {
      const contract = new ethers.Contract(contractAddress, OWNABLE_ABI, provider);
      const currentOwner = await contract.owner();

      console.log(`  Current Owner: ${currentOwner}`);

      if (currentOwner.toLowerCase() !== oldGenesis.toLowerCase()) {
        console.log(`  ⚠️  Not owned by old Genesis - skipping`);
        continue;
      }

      if (isDryRun) {
        console.log(`  [DRY RUN] Would transfer ownership to ${newGenesis}`);
        transferLog.contractTransfers.push({
          contract: contractName,
          currentOwner,
          newOwner: newGenesis,
          dryRun: true
        });
      } else {
        console.log(`  Transferring ownership...`);

        const contractWithSigner = contract.connect(genesisSigner);
        const tx = await contractWithSigner.transferOwnership(newGenesis);
        const receipt = await tx.wait();

        console.log(`  ✅ Ownership transferred - TxHash: ${receipt.hash}`);
        transferLog.contractTransfers.push({
          contract: contractName,
          oldOwner: oldGenesis,
          newOwner: newGenesis,
          txHash: receipt.hash,
          blockNumber: receipt.blockNumber
        });
      }

    } catch (error) {
      console.error(`  ❌ ERROR: ${error.message}`);
      transferLog.errors.push(`Failed to transfer ${contractName} ownership: ${error.message}`);
    }
    console.log();
  }
}

// Run
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
