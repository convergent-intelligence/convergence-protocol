#!/usr/bin/env node

/**
 * Environment Validation Script
 * Verifies all secrets in .env are correctly formatted before rotation
 *
 * Usage: node scripts/validate-env.js
 * Exit code 0 = All valid, Exit code 1 = Issues found
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log(`
╔════════════════════════════════════════════════════════════════╗
║          ENVIRONMENT VALIDATION - PRE-ROTATION CHECK           ║
╚════════════════════════════════════════════════════════════════╝
`);

const validations = [];

// Helper functions
function isValidEthereumAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

function isValidPrivateKey(key) {
  return /^0x[a-fA-F0-9]{64}$/.test(key);
}

function isValidHash256(hash) {
  return /^[a-fA-F0-9]{64}$/.test(hash);
}

function isValidHash32(hash) {
  return /^[a-fA-F0-9]{32}$/.test(hash);
}

function addValidation(name, isValid, details) {
  validations.push({
    name,
    isValid,
    details,
    status: isValid ? '✅' : '❌'
  });
}

// ============================================================================
// VALIDATION CHECKS
// ============================================================================

console.log('📋 Validating Configuration...\n');

// Genesis Address
console.log('🔐 Genesis Human Wallet:');
const genesisAddr = process.env.ADDRESS;
if (!genesisAddr) {
  addValidation('Genesis Address', false, 'Not set in .env');
  console.log(`   ❌ ADDRESS: Not set`);
} else if (!isValidEthereumAddress(genesisAddr)) {
  addValidation('Genesis Address', false, `Invalid format: ${genesisAddr}`);
  console.log(`   ❌ ADDRESS: Invalid format`);
  console.log(`      Expected: 0x followed by 40 hex chars`);
  console.log(`      Got: ${genesisAddr}`);
} else {
  addValidation('Genesis Address', true, genesisAddr);
  console.log(`   ✅ ADDRESS: ${genesisAddr}`);
}

// Genesis Private Key
const genesisPK = process.env.PRIVATE_KEY;
if (!genesisPK) {
  addValidation('Genesis Private Key', false, 'Not set in .env');
  console.log(`   ❌ PRIVATE_KEY: Not set`);
} else if (!isValidPrivateKey(genesisPK)) {
  addValidation('Genesis Private Key', false, `Invalid format: ${genesisPK.substring(0, 10)}...`);
  console.log(`   ❌ PRIVATE_KEY: Invalid format`);
  console.log(`      Expected: 0x followed by 64 hex chars`);
  console.log(`      Got length: ${genesisPK.length}`);
} else {
  // Verify it's NOT the old exposed key
  if (genesisPK.toLowerCase() === '0xe678cb3bb7be02a75156e4611b2a4f186bc17d257fb526aa1b8b811096542202'.toLowerCase()) {
    addValidation('Genesis Private Key', false, 'Still using OLD exposed key!');
    console.log(`   ❌ PRIVATE_KEY: This is the OLD exposed key - MUST rotate!`);
  } else {
    addValidation('Genesis Private Key', true, genesisPK.substring(0, 10) + '...');
    console.log(`   ✅ PRIVATE_KEY: Valid format (0x${genesisPK.substring(2, 10)}...)`);
  }
}

// Agent Address
console.log('\n🤖 Agent Wallet:');
const agentAddr = process.env.AGENT_ADDRESS;
if (!agentAddr) {
  addValidation('Agent Address', false, 'Not set in .env');
  console.log(`   ❌ AGENT_ADDRESS: Not set`);
} else if (!isValidEthereumAddress(agentAddr)) {
  addValidation('Agent Address', false, `Invalid format: ${agentAddr}`);
  console.log(`   ❌ AGENT_ADDRESS: Invalid format`);
} else {
  addValidation('Agent Address', true, agentAddr);
  console.log(`   ✅ AGENT_ADDRESS: ${agentAddr}`);
}

// Agent Private Key
const agentPK = process.env.AGENT_PRIVATE_KEY;
if (!agentPK) {
  addValidation('Agent Private Key', false, 'Not set in .env');
  console.log(`   ❌ AGENT_PRIVATE_KEY: Not set`);
} else if (!isValidPrivateKey(agentPK)) {
  addValidation('Agent Private Key', false, `Invalid format`);
  console.log(`   ❌ AGENT_PRIVATE_KEY: Invalid format`);
} else {
  if (agentPK.toLowerCase() === '0x48d0bc17740d9a92abab4a94bfa9492407bf1ee1b8d1cda18697655b8329bfe8'.toLowerCase()) {
    addValidation('Agent Private Key', false, 'Still using OLD exposed key!');
    console.log(`   ❌ AGENT_PRIVATE_KEY: This is the OLD exposed key - MUST rotate!`);
  } else {
    addValidation('Agent Private Key', true, agentPK.substring(0, 10) + '...');
    console.log(`   ✅ AGENT_PRIVATE_KEY: Valid format`);
  }
}

// Infura Key
console.log('\n🌐 External Services:');
const infuraKey = process.env.INFURA_KEY;
if (!infuraKey) {
  addValidation('Infura Key', false, 'Not set in .env');
  console.log(`   ❌ INFURA_KEY: Not set`);
} else if (!isValidHash32(infuraKey) && infuraKey.length !== 32) {
  addValidation('Infura Key', false, `Invalid length: ${infuraKey.length} (expected 32)`);
  console.log(`   ❌ INFURA_KEY: Invalid length (got ${infuraKey.length}, expected 32)`);
} else {
  if (infuraKey === '961fbd3e82da4c3da2f706356425d430') {
    addValidation('Infura Key', false, 'Still using OLD exposed key!');
    console.log(`   ❌ INFURA_KEY: This is the OLD exposed key - MUST rotate!`);
  } else {
    addValidation('Infura Key', true, infuraKey.substring(0, 8) + '...');
    console.log(`   ✅ INFURA_KEY: Valid format (${infuraKey.substring(0, 8)}...)`);
  }
}

// Etherscan Key
const etherscanKey = process.env.ETHERSCAN_KEY;
if (!etherscanKey) {
  addValidation('Etherscan Key', false, 'Not set in .env');
  console.log(`   ❌ ETHERSCAN_KEY: Not set`);
} else if (etherscanKey.length < 30 || etherscanKey.length > 40) {
  addValidation('Etherscan Key', false, `Invalid length: ${etherscanKey.length}`);
  console.log(`   ❌ ETHERSCAN_KEY: Invalid length (got ${etherscanKey.length})`);
} else {
  if (etherscanKey === '4JHTT9IG6H5IHSJ54S2JIT58AAZC2XMF5D') {
    addValidation('Etherscan Key', false, 'Still using OLD exposed key!');
    console.log(`   ❌ ETHERSCAN_KEY: This is the OLD exposed key - MUST rotate!`);
  } else {
    addValidation('Etherscan Key', true, etherscanKey.substring(0, 8) + '...');
    console.log(`   ✅ ETHERSCAN_KEY: Valid format (${etherscanKey.substring(0, 8)}...)`);
  }
}

// Encryption Key
console.log('\n🔒 Encryption:');
const encryptionKey = process.env.CREDENTIAL_ENCRYPTION_KEY;
if (!encryptionKey) {
  addValidation('Encryption Key', false, 'Not set in .env');
  console.log(`   ❌ CREDENTIAL_ENCRYPTION_KEY: Not set`);
} else if (encryptionKey.length < 32) {
  addValidation('Encryption Key', false, `Too short: ${encryptionKey.length} chars`);
  console.log(`   ⚠️  CREDENTIAL_ENCRYPTION_KEY: Should be 64+ hex chars, got ${encryptionKey.length}`);
} else {
  if (encryptionKey === 'convergence-trinity-secure-encryption-key-2025-11-22-genesis') {
    addValidation('Encryption Key', false, 'Still using DEFAULT key!');
    console.log(`   ❌ CREDENTIAL_ENCRYPTION_KEY: Using default key - MUST change!`);
  } else {
    addValidation('Encryption Key', true, encryptionKey.substring(0, 16) + '...');
    console.log(`   ✅ CREDENTIAL_ENCRYPTION_KEY: Custom key set (${encryptionKey.length} chars)`);
  }
}

// ============================================================================
// SUMMARY
// ============================================================================

console.log('\n═══════════════════════════════════════════════════════════════\n');

const allValid = validations.every(v => v.isValid);
const validCount = validations.filter(v => v.isValid).length;
const invalidCount = validations.filter(v => !v.isValid).length;

console.log(`📊 VALIDATION SUMMARY: ${validCount}/${validations.length} items valid\n`);

validations.forEach(v => {
  console.log(`${v.status} ${v.name}`);
  if (!v.isValid && v.details) {
    console.log(`   └─ ${v.details}\n`);
  }
});

console.log('\n═══════════════════════════════════════════════════════════════\n');

if (allValid) {
  console.log('✅ ALL VALIDATIONS PASSED - Ready to proceed with rotation!\n');
  process.exit(0);
} else {
  console.log(`❌ ${invalidCount} VALIDATION(S) FAILED\n`);
  console.log('⚠️  IMPORTANT CHECKS:');
  console.log('   [ ] Are you using NEW wallets (not the old exposed ones)?');
  console.log('   [ ] Did you generate NEW API keys?');
  console.log('   [ ] Did you update the encryption key?');
  console.log('   [ ] Did you test transactions in Exodus?');
  console.log('\nFix all issues above before proceeding!\n');
  process.exit(1);
}
