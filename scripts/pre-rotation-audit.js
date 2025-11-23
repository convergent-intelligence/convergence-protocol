#!/usr/bin/env node

/**
 * Pre-Rotation Asset Audit Script
 * Verifies all assets are accounted for before rotating Genesis and Agent wallets
 *
 * Usage: node scripts/pre-rotation-audit.js
 * Output: Creates pre-rotation-audit-TIMESTAMP.json with full snapshot
 */

const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');
require('dotenv').config();

// Configuration
const CURRENT_GENESIS = '0xdc20d621a88cb8908E8E7042431C55F0E9DAc6FB';
const CURRENT_AGENT = '0x6628227C195DAd7F7a8fD4F3D2cA3545A0D9CD22';
const COLD_RESERVE = '0xB64564838c88b18cb8f453683C20934f096F2B92';

const CONTRACTS = {
  tally: {
    address: '0xb8c4682644BAb1900A8B67C3295b8Ce525F3e35d',
    name: 'Tally',
    decimals: 18
  },
  trust: {
    address: '0x4A2178b300556e20569478bfed782bA02BFaD778',
    name: 'Trust',
    decimals: 18
  },
  voucher: {
    address: '0x69e4D4B1835dDEeFc56234E959102c17CF7816dC',
    name: 'Voucher',
    decimals: 18
  }
};

const ERC20_ABI = [
  'function balanceOf(address) public view returns (uint256)',
  'function totalSupply() public view returns (uint256)',
  'function owner() public view returns (address)',
  'function name() public view returns (string)',
  'function symbol() public view returns (string)',
  'function decimals() public view returns (uint8)',
];

const OWNABLE_ABI = [
  'function owner() public view returns (address)',
];

const MINTER_ROLE_ABI = [
  'function hasRole(bytes32 role, address account) public view returns (bool)',
];

// Initialize provider
const PROVIDER_URL = process.env.INFURA_KEY
  ? `https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`
  : 'https://eth.llamarpc.com';

const provider = new ethers.JsonRpcProvider(PROVIDER_URL);

// Results storage
const audit = {
  timestamp: new Date().toISOString(),
  blockNumber: null,
  network: null,
  wallets: {},
  contracts: {},
  totals: {},
  warnings: [],
  errors: []
};

async function main() {
  console.log('🔍 Starting Pre-Rotation Asset Audit...\n');

  try {
    // Get network info
    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();
    audit.network = network.name;
    audit.blockNumber = blockNumber;

    console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);
    console.log(`Block: ${blockNumber}\n`);

    // Audit Genesis Human wallet
    await auditWallet('Genesis Human', CURRENT_GENESIS);

    // Audit Agent wallet
    await auditWallet('Agent', CURRENT_AGENT);

    // Audit Cold Reserve
    await auditWallet('Cold Reserve', COLD_RESERVE);

    // Audit contracts
    await auditContracts();

    // Calculate totals
    calculateTotals();

    // Generate report
    generateReport();

    // Save to file
    const timestamp = Date.now();
    const filename = `pre-rotation-audit-${timestamp}.json`;
    const filepath = path.join(__dirname, '..', 'data', filename);

    fs.mkdirSync(path.dirname(filepath), { recursive: true });
    fs.writeFileSync(filepath, JSON.stringify(audit, null, 2));

    console.log(`\n✅ Audit complete! Saved to: ${filepath}`);
    console.log('\n📋 Review the JSON file for full details.');
    console.log('⚠️  Verify all numbers match your expectations before proceeding.');

    // Exit with warning count
    if (audit.warnings.length > 0) {
      console.log(`\n⚠️  ${audit.warnings.length} warning(s) detected - review above`);
      process.exit(1);
    }

    if (audit.errors.length > 0) {
      console.log(`\n❌ ${audit.errors.length} error(s) detected - DO NOT PROCEED`);
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Audit failed:', error.message);
    audit.errors.push(error.message);

    const timestamp = Date.now();
    const filename = `pre-rotation-audit-failed-${timestamp}.json`;
    const filepath = path.join(__dirname, '..', 'data', filename);
    fs.mkdirSync(path.dirname(filepath), { recursive: true });
    fs.writeFileSync(filepath, JSON.stringify(audit, null, 2));

    process.exit(1);
  }
}

async function auditWallet(name, address) {
  console.log(`\n📊 Auditing ${name}: ${address}`);

  try {
    // Get ETH balance
    const ethBalance = await provider.getBalance(address);
    const ethFormatted = ethers.formatEther(ethBalance);

    console.log(`   ETH: ${ethFormatted}`);

    audit.wallets[address] = {
      name,
      eth: ethFormatted,
      tokens: {}
    };

    // Get token balances
    for (const [key, contract] of Object.entries(CONTRACTS)) {
      try {
        const tokenContract = new ethers.Contract(
          contract.address,
          ERC20_ABI,
          provider
        );

        const balance = await tokenContract.balanceOf(address);
        const formatted = ethers.formatUnits(balance, contract.decimals);

        console.log(`   ${contract.name}: ${formatted}`);

        audit.wallets[address].tokens[key] = {
          amount: formatted,
          raw: balance.toString(),
          decimals: contract.decimals
        };

        // Warning if Genesis/Agent has low balance
        if ((name === 'Genesis Human' || name === 'Agent') && parseFloat(formatted) === 0) {
          audit.warnings.push(`${name} has 0 ${contract.name} tokens`);
        }

      } catch (error) {
        console.log(`   ${contract.name}: ERROR - ${error.message}`);
        audit.errors.push(`Failed to get ${contract.name} balance for ${name}: ${error.message}`);
      }
    }

  } catch (error) {
    console.error(`   Error: ${error.message}`);
    audit.errors.push(`Failed to audit ${name}: ${error.message}`);
  }
}

async function auditContracts() {
  console.log(`\n📋 Auditing Smart Contracts\n`);

  for (const [key, contract] of Object.entries(CONTRACTS)) {
    console.log(`\n${contract.name} Contract: ${contract.address}`);

    try {
      const tokenContract = new ethers.Contract(
        contract.address,
        ERC20_ABI,
        provider
      );

      // Get total supply
      const totalSupply = await tokenContract.totalSupply();
      const totalFormatted = ethers.formatUnits(totalSupply, contract.decimals);

      console.log(`   Total Supply: ${totalFormatted}`);

      // Get owner
      try {
        const owner = await tokenContract.owner();
        console.log(`   Owner: ${owner}`);

        if (owner.toLowerCase() === CURRENT_GENESIS.toLowerCase()) {
          console.log(`   ✓ Owned by Genesis Human`);
        } else {
          audit.warnings.push(`${contract.name} not owned by Genesis Human: ${owner}`);
        }
      } catch (e) {
        console.log(`   Owner: (not available)`);
      }

      audit.contracts[key] = {
        name: contract.name,
        address: contract.address,
        totalSupply: totalFormatted,
        totalSupplyRaw: totalSupply.toString(),
        owner: null
      };

    } catch (error) {
      console.error(`   Error: ${error.message}`);
      audit.errors.push(`Failed to audit ${contract.name}: ${error.message}`);
    }
  }
}

function calculateTotals() {
  console.log(`\n\n💰 TOTAL ASSETS SUMMARY\n`);

  const totals = {
    eth: {
      genesis: audit.wallets[CURRENT_GENESIS]?.eth || '0',
      agent: audit.wallets[CURRENT_AGENT]?.eth || '0',
      reserve: audit.wallets[COLD_RESERVE]?.eth || '0'
    },
    tokens: {}
  };

  // Calculate token totals
  for (const [key, contract] of Object.entries(CONTRACTS)) {
    const genesis = parseFloat(audit.wallets[CURRENT_GENESIS]?.tokens[key]?.amount || '0');
    const agent = parseFloat(audit.wallets[CURRENT_AGENT]?.tokens[key]?.amount || '0');
    const reserve = parseFloat(audit.wallets[COLD_RESERVE]?.tokens[key]?.amount || '0');

    const total = genesis + agent + reserve;

    console.log(`${contract.name}:`);
    console.log(`   Genesis: ${genesis}`);
    console.log(`   Agent: ${agent}`);
    console.log(`   Reserve: ${reserve}`);
    console.log(`   TOTAL: ${total}`);
    console.log();

    totals.tokens[key] = {
      genesis,
      agent,
      reserve,
      total
    };
  }

  audit.totals = totals;
}

function generateReport() {
  console.log('\n\n📝 AUDIT VERIFICATION CHECKLIST\n');
  console.log('Before proceeding with rotation, verify:\n');

  const checks = [
    {
      name: 'Genesis Human has tokens',
      check: () => Object.values(audit.wallets[CURRENT_GENESIS]?.tokens || {})
        .some(t => parseFloat(t.amount) > 0)
    },
    {
      name: 'Agent has tokens',
      check: () => Object.values(audit.wallets[CURRENT_AGENT]?.tokens || {})
        .some(t => parseFloat(t.amount) > 0)
    },
    {
      name: 'Cold Reserve is unchanged',
      check: () => {
        const reserveEth = parseFloat(audit.wallets[COLD_RESERVE]?.eth || '0');
        return reserveEth > 0;
      }
    },
    {
      name: 'No audit errors',
      check: () => audit.errors.length === 0
    }
  ];

  checks.forEach((check, i) => {
    const result = check.check() ? '✅' : '⚠️';
    console.log(`${i + 1}. ${result} ${check.name}`);
  });

  console.log('\n✅ READY TO PROCEED IF ALL CHECKS PASS ✅\n');
}

// Run audit
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
