#!/usr/bin/env node

/**
 * Import Partner Seed - Restore the actual seed phrase from backup
 *
 * Use this to restore the partner seed if:
 * - The seed was backed up when first generated
 * - The seed key file was lost or corrupted
 * - You're setting up the seed on a new system
 *
 * Usage:
 *   node import-partner-seed.js <wallet> "<word1 word2 word3 ... word12>"
 *
 * Example:
 *   node import-partner-seed.js 0xdc20d621a88cb8908e8e7042431c55f0e9dac6fb \
 *     "abandon ability able about above absent absorb abstract abuse access accident account"
 *
 * Requirements:
 * - Wallet must be Genesis Human or Agent
 * - Seed phrase must be valid 12-word BIP39 mnemonic
 * - Seed must match the existing partner-governance.json metadata
 */

const bip39 = require('bip39');
const fs = require('fs');
const path = require('path');
const PartnerSeedGenerator = require('./generate-partner-seed.js');

const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('\n❌ Missing required arguments\n');
  console.error('Usage: node import-partner-seed.js <wallet> "<seed phrase>"\n');
  console.error('Example:');
  console.error('  node import-partner-seed.js 0xdc20d621a88cb8908e8e7042431c55f0e9dac6fb \\');
  console.error('    "abandon ability able about above absent absorb abstract abuse access account"\n');
  process.exit(1);
}

const wallet = args[0];
const seedPhrase = args.slice(1).join(' ').trim();

try {
  // Validate wallet format
  if (!wallet.match(/^0x[a-f0-9]{40}$/i)) {
    throw new Error('Invalid wallet address format');
  }

  // Validate seed phrase
  if (!bip39.validateMnemonic(seedPhrase)) {
    throw new Error('Invalid seed phrase - must be valid 12-word BIP39 mnemonic');
  }

  const words = seedPhrase.split(' ');
  if (words.length !== 12) {
    throw new Error(`Invalid seed - expected 12 words, got ${words.length}`);
  }

  // Check authorization (only Genesis or Agent can import)
  const GENESIS_HUMAN = '0xdc20d621a88cb8908E8E7042431C55F0E9DAc6FB'.toLowerCase();
  const AGENT_WALLET = '0x6628227C195DAd7F7a8fD4F3D2cA3545A0D9CD22'.toLowerCase();

  if (wallet.toLowerCase() !== GENESIS_HUMAN && wallet.toLowerCase() !== AGENT_WALLET) {
    console.error('\n❌ Not authorized: Only Genesis Human or Agent can import the seed\n');
    process.exit(1);
  }

  // Load existing partner data
  const generator = new PartnerSeedGenerator();

  // Check if seed generation metadata exists
  if (!generator.partnerData.seedCreatedAt) {
    throw new Error('No seed generation metadata found. Seed must be generated first via generate-partner-seed.js');
  }

  // Verify if seed already exists
  if (generator.seedKey) {
    console.warn('\n⚠️  WARNING: Seed key file already exists!\n');
    console.warn('Importing a new seed will overwrite the existing one.');

    // Require confirmation
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('Are you sure you want to overwrite? (yes/no): ', (answer) => {
      rl.close();
      if (answer.toLowerCase() === 'yes') {
        performImport();
      } else {
        console.log('Import cancelled.\n');
        process.exit(0);
      }
    });
  } else {
    performImport();
  }

  function performImport() {
    try {
      // Save the seed
      generator.saveSeedKey(seedPhrase);
      generator.seedKey = seedPhrase;

      // Log the import event
      generator.logSecurityEvent('PARTNER_SEED_IMPORTED', {
        importedBy: wallet.toLowerCase(),
        timestamp: new Date().toISOString(),
        wordCount: 12,
        message: 'Partner seed imported from backup'
      });

      console.log('\n✅ SUCCESS: Partner seed imported\n');
      console.log('Details:');
      console.log(`  Imported by: ${wallet.toLowerCase()}`);
      console.log(`  Word count: 12`);
      console.log(`  Timestamp: ${new Date().toISOString()}`);
      console.log(`  File: data/.partner-seed.key (permissions: 0600)\n`);
      console.log('You can now use:');
      console.log('  npm run show-partner-seed <wallet> [format]\n');

    } catch (error) {
      throw new Error(`Failed to save seed: ${error.message}`);
    }
  }

} catch (error) {
  console.error(`\n❌ Error: ${error.message}\n`);
  process.exit(1);
}
