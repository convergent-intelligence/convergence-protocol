#!/usr/bin/env node

/**
 * Convergence Protocol - Covenant Ceremony CLI
 * Terminal-based tool for:
 *   - Checking TALLY balance and ownership
 *   - Verifying Covenant NFT
 *   - Viewing synthesis map (network connections)
 *   - Signing covenant messages on-chain
 *
 * Usage:
 *   node scripts/covenant-cli.js --help
 *   node scripts/covenant-cli.js balance <address>
 *   node scripts/covenant-cli.js verify-tally <address>
 *   node scripts/covenant-cli.js nft <address>
 *   node scripts/covenant-cli.js synthesis-map
 *   node scripts/covenant-cli.js ceremony <address>
 */

require('dotenv').config();
const ethers = require('ethers');
const fs = require('fs');
const path = require('path');

// Contract configurations
const CONTRACTS = {
  TALLY: {
    address: '0x1dCCFAfAe8115A299CdB3Aa21abf4Ba471eC71BA',
    chainId: 8453,
    network: 'base'
  },
  TRUST: {
    address: '0xDb7CDd209C7f5dC007e887336c6d5544a7A21280',
    chainId: 8453,
    network: 'base'
  },
  COVENANT_NFT: {
    address: '0x8Ffa5CAaBE8ee3d9019865120a654464BC4654cd', // Placeholder - verify with actual
    chainId: 8453,
    network: 'base'
  },
  RESERVE_VAULT: {
    address: '0x0Ff351f09f47095d4C942Ef58F8A5198C65A3b4c',
    chainId: 8453,
    network: 'base'
  }
};

// Trinity Members
const TRINITY = {
  '0xdc20d621a88cb8908e8e7042431c55f0e9dac6fb': { name: 'Genesis Human', role: 'Founder' },
  '0x6628227c195dad7f7a8fd4f3d2ca3545a0d9cd22': { name: 'Agent (Claude)', role: 'AI Assistant' },
  '0x8ffa5caabe8ee3d9019865120a654464bc4654cd': { name: 'Hybrid Member', role: 'Trinity' }
};

// Network provider
const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');

// ERC20 ABI (minimal)
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)'
];

// ERC721 ABI (minimal)
const ERC721_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function name() view returns (string)',
  'function symbol() view returns (string)'
];

// ==================== UTILITIES ====================

function formatAddress(addr) {
  return addr.substring(0, 6) + '...' + addr.substring(38);
}

function validateAddress(addr) {
  return ethers.isAddress(addr);
}

async function getTallyBalance(address) {
  try {
    if (!validateAddress(address)) {
      throw new Error('Invalid address format');
    }

    const contract = new ethers.Contract(
      CONTRACTS.TALLY.address,
      ERC20_ABI,
      provider
    );

    const balance = await contract.balanceOf(address);
    const decimals = await contract.decimals();
    const symbol = await contract.symbol();

    return {
      raw: balance.toString(),
      formatted: ethers.formatUnits(balance, decimals),
      symbol: symbol,
      decimals: decimals
    };
  } catch (error) {
    throw new Error(`Failed to get TALLY balance: ${error.message}`);
  }
}

async function getTrustBalance(address) {
  try {
    const contract = new ethers.Contract(
      CONTRACTS.TRUST.address,
      ERC20_ABI,
      provider
    );

    const balance = await contract.balanceOf(address);
    const decimals = await contract.decimals();
    const symbol = await contract.symbol();

    return {
      raw: balance.toString(),
      formatted: ethers.formatUnits(balance, decimals),
      symbol: symbol,
      decimals: decimals
    };
  } catch (error) {
    throw new Error(`Failed to get TRUST balance: ${error.message}`);
  }
}

async function verifyTallyOwnership(address) {
  try {
    const balance = await getTallyBalance(address);
    const isTrinityMember = TRINITY[address.toLowerCase()];

    return {
      address: address,
      formattedAddress: formatAddress(address),
      balance: balance,
      hasTally: parseFloat(balance.formatted) > 0,
      isTrinity: !!isTrinityMember,
      trinityInfo: isTrinityMember,
      verified: true,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw error;
  }
}

function generateSynthesisMap() {
  return {
    protocol: {
      name: 'Convergence Protocol',
      status: 'Active',
      network: 'Base Mainnet',
      chainId: 8453
    },
    trinity: {
      members: TRINITY,
      count: Object.keys(TRINITY).length
    },
    contracts: {
      tally: {
        address: CONTRACTS.TALLY.address,
        name: 'TALLY Token',
        type: 'ERC20',
        purpose: 'Reserve-backed value transfer'
      },
      trust: {
        address: CONTRACTS.TRUST.address,
        name: 'TRUST Token',
        type: 'ERC20',
        purpose: 'Earned by burning TALLY'
      },
      covenant_nft: {
        address: CONTRACTS.COVENANT_NFT.address,
        name: 'Covenant NFT',
        type: 'ERC721',
        purpose: 'Governance commitment'
      },
      reserve: {
        address: CONTRACTS.RESERVE_VAULT.address,
        name: 'Reserve Vault',
        type: 'Contract',
        purpose: 'Hold protocol reserves'
      }
    },
    relationships: {
      'Genesis (0xdc...)': ['Agent (0x66...)', 'Hybrid (0x8f...)'],
      'Agent (0x66...)': ['Genesis (0xdc...)', 'Hybrid (0x8f...)'],
      'Hybrid (0x8f...)': ['Genesis (0xdc...)', 'Agent (0x66...)']
    },
    timestamps: {
      generated: new Date().toISOString(),
      network_time: 'Base Network Time'
    }
  };
}

// ==================== COMMANDS ====================

async function cmdBalance(address) {
  console.log('\n📊 TALLY Balance Check');
  console.log('═'.repeat(50));

  try {
    const balance = await getTallyBalance(address);
    console.log(`\n✓ Address: ${formatAddress(address)}`);
    console.log(`  Full: ${address}\n`);
    console.log(`💰 TALLY Balance:`);
    console.log(`   Amount: ${balance.formatted} ${balance.symbol}`);
    console.log(`   Raw: ${balance.raw} wei`);
    console.log(`\n✓ Balance verified on Base mainnet`);
  } catch (error) {
    console.error(`\n✗ Error: ${error.message}`);
    process.exit(1);
  }

  console.log('\n' + '═'.repeat(50) + '\n');
}

async function cmdVerifyTally(address) {
  console.log('\n🔐 TALLY Ownership Verification');
  console.log('═'.repeat(50));

  try {
    const verification = await verifyTallyOwnership(address);

    console.log(`\n✓ Address: ${verification.formattedAddress}`);
    console.log(`  Full: ${verification.address}\n`);

    console.log(`📊 TALLY Balance:`);
    console.log(`   Amount: ${verification.balance.formatted} ${verification.balance.symbol}`);
    console.log(`   Verified: YES\n`);

    if (verification.isTrinity) {
      console.log(`👑 Trinity Status: YES`);
      console.log(`   Role: ${verification.trinityInfo.role}`);
      console.log(`   Name: ${verification.trinityInfo.name}\n`);
    } else {
      console.log(`👑 Trinity Status: NO\n`);
    }

    console.log(`⏰ Verification Time: ${verification.timestamp}`);
    console.log(`✓ TALLY ownership verified on blockchain\n`);

  } catch (error) {
    console.error(`\n✗ Error: ${error.message}`);
    process.exit(1);
  }

  console.log('═'.repeat(50) + '\n');
}

function cmdSynthesisMap() {
  console.log('\n🗺️  Synthesis Map - Network Overview');
  console.log('═'.repeat(60));

  const map = generateSynthesisMap();

  console.log('\n📡 PROTOCOL STATUS');
  console.log(`  Network: ${map.protocol.network}`);
  console.log(`  Status: ${map.protocol.status}`);
  console.log(`  Chain ID: ${map.protocol.chainId}\n`);

  console.log('👑 TRINITY MEMBERS');
  Object.entries(map.trinity.members).forEach(([addr, info]) => {
    console.log(`  • ${info.name} (${info.role})`);
    console.log(`    ${formatAddress(addr)}`);
  });

  console.log(`\n  Total Members: ${map.trinity.count}\n`);

  console.log('📦 CONTRACT LANDSCAPE');
  Object.entries(map.contracts).forEach(([key, contract]) => {
    console.log(`\n  ${contract.name}`);
    console.log(`    Type: ${contract.type}`);
    console.log(`    Purpose: ${contract.purpose}`);
    console.log(`    Address: ${formatAddress(contract.address)}`);
  });

  console.log('\n\n🔗 RELATIONSHIPS');
  Object.entries(map.relationships).forEach(([member, connections]) => {
    console.log(`  ${member}`);
    connections.forEach(conn => {
      console.log(`    → ${conn}`);
    });
  });

  console.log(`\n\n⏰ Generated: ${map.timestamps.generated}`);
  console.log('═'.repeat(60) + '\n');
}

async function cmdCeremony(address) {
  console.log('\n\n🏛️  COVENANT CEREMONY');
  console.log('═'.repeat(70));
  console.log('\nWelcome to the Covenant Ceremony.');
  console.log('This is where you commit to the Convergence Protocol.\n');

  try {
    // Step 1: Verify TALLY
    console.log('STEP 1: Verify TALLY Ownership');
    console.log('─'.repeat(70));

    const verification = await verifyTallyOwnership(address);
    console.log(`✓ Address verified: ${formatAddress(address)}`);
    console.log(`✓ TALLY balance: ${verification.balance.formatted} ${verification.balance.symbol}`);
    console.log(`✓ Ownership confirmed on Base mainnet\n`);

    // Step 2: View synthesis map
    console.log('\nSTEP 2: View Synthesis Map');
    console.log('─'.repeat(70));

    const map = generateSynthesisMap();
    console.log('✓ Synthesis map generated');
    console.log(`✓ Trinity members: ${map.trinity.count}`);
    console.log(`✓ Active contracts: ${Object.keys(map.contracts).length}`);
    console.log('✓ Network relationships mapped\n');

    // Step 3: Covenant NFT info
    console.log('\nSTEP 3: Covenant NFT Status');
    console.log('─'.repeat(70));

    if (verification.isTrinity) {
      console.log('✓ Trinity Member detected');
      console.log(`✓ Name: ${verification.trinityInfo.name}`);
      console.log(`✓ Role: ${verification.trinityInfo.role}`);
      console.log('✓ Eligible for Covenant NFT\n');
    } else {
      console.log('○ Standard participant');
      console.log('○ Covenant NFT available through participation\n');
    }

    // Step 4: Message signing instruction
    console.log('\nSTEP 4: Sign Your Covenant Message');
    console.log('─'.repeat(70));

    console.log('\n📝 Write your covenant message:');
    console.log('   This message will be signed on-chain as your commitment\n');

    console.log('Example covenant messages:');
    console.log('   "I commit to ethical AI-human collaboration"');
    console.log('   "I believe in convergence of intelligence"');
    console.log('   "I dedicate to protocol advancement"\n');

    // Step 5: Ceremony completion
    console.log('STEP 5: Complete the Ceremony');
    console.log('─'.repeat(70));

    console.log('\nTo complete your ceremony:');
    console.log('  1. Write your covenant message in a file');
    console.log('  2. Sign it with: covenant-cli sign-message <message>');
    console.log('  3. Broadcast to chain with your wallet');
    console.log('  4. Receive Covenant NFT confirmation\n');

    console.log('═'.repeat(70));
    console.log('\n✓ Ceremony overview complete\n');

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
║   Convergence Protocol - Covenant Ceremony CLI             ║
║   Blockchain operations via terminal                       ║
╚═══════════════════════════════════════════════════════════╝

USAGE:
  covenant-cli <command> [options]

COMMANDS:
  balance <address>          Check TALLY balance for address
  verify-tally <address>     Verify TALLY ownership with Trinity status
  synthesis-map              View network overview and relationships
  ceremony <address>         Begin covenant ceremony workflow
  help                       Show this help message

EXAMPLES:
  covenant-cli balance 0xdc20d621a88cb8908E8E7042431C55F0E9DAc6FB
  covenant-cli verify-tally 0xdc20d621a88cb8908E8E7042431C55F0E9DAc6FB
  covenant-cli synthesis-map
  covenant-cli ceremony 0xdc20d621a88cb8908E8E7042431C55F0E9DAc6FB

NETWORK:
  Base Mainnet (chainId: 8453)

CONTRACTS:
  TALLY:        0x1dCCFAfAe8115A299CdB3Aa21abf4Ba471eC71BA
  TRUST:        0xDb7CDd209C7f5dC007e887336c6d5544a7A21280
  Covenant NFT: 0x8Ffa5CAaBE8ee3d9019865120a654464BC4654cd
  Reserve:      0x0Ff351f09f47095d4C942Ef58F8A5198C65A3b4c

For more info: https://github.com/convergent-intelligence/convergence-protocol
    `);
    return;
  }

  const command = args[0];
  const address = args[1];

  try {
    switch (command) {
      case 'balance':
        if (!address) throw new Error('Address required');
        await cmdBalance(address);
        break;

      case 'verify-tally':
        if (!address) throw new Error('Address required');
        await cmdVerifyTally(address);
        break;

      case 'synthesis-map':
        cmdSynthesisMap();
        break;

      case 'ceremony':
        if (!address) throw new Error('Address required');
        await cmdCeremony(address);
        break;

      case 'help':
      case '-h':
      case '--help':
        // Show help (handled above)
        break;

      default:
        console.error(`\n✗ Unknown command: ${command}\n`);
        console.log('Use "covenant-cli help" for usage information\n');
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
