#!/usr/bin/env node
/**
 * BITCOIN WALLET GENERATOR
 * Derives Bitcoin wallet from existing BIP44 seed phrase
 *
 * Usage:
 *   node scripts/generate-bitcoin-wallet.js
 *
 * Requirements:
 *   - bitcoinjs-lib: npm install bitcoinjs-lib bip32 bip39
 *   - data/hotwallet-keys.json with mnemonic phrase
 */

const fs = require('fs');
const path = require('path');

// Check if bitcoin libs are available
let bitcoin, bip32, bip39;
try {
  bitcoin = require('bitcoinjs-lib');
  bip32 = require('bip32');
  bip39 = require('bip39');
} catch (e) {
  console.error('❌ Bitcoin libraries not installed');
  console.error('Run: npm install bitcoinjs-lib bip32 bip39');
  process.exit(1);
}

class BitcoinWalletGenerator {
  constructor() {
    this.hotwallet_path = path.join(__dirname, '../data/hotwallet-keys.json');
    this.bitcoin_wallet_path = path.join(__dirname, '../data/bitcoin-hotwallet-keys.json');
    this.network = bitcoin.networks.bitcoin; // mainnet
  }

  loadHotwalletMnemonic() {
    try {
      const hotwallet = JSON.parse(fs.readFileSync(this.hotwallet_path, 'utf8'));
      return hotwallet.mnemonic;
    } catch (e) {
      console.error('❌ Error loading hotwallet mnemonic');
      console.error(`   File: ${this.hotwallet_path}`);
      throw e;
    }
  }

  generateBitcoinWallet(mnemonic) {
    console.log('\n🔑 Generating Bitcoin Wallet from BIP44 seed phrase...\n');

    // Validate mnemonic
    if (!bip39.validateMnemonic(mnemonic)) {
      throw new Error('Invalid BIP39 mnemonic phrase');
    }
    console.log('✅ Mnemonic validated');

    // Generate seed from mnemonic
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    console.log('✅ Seed generated from mnemonic');

    // Create root key from seed
    const root = bip32.fromSeed(seed, this.network);
    console.log('✅ Root key derived');

    // BIP44 path for Bitcoin: m/44'/0'/0'/0/0
    // This derives the first address in the first external chain
    const path_prefix = "m/44'/0'/0'"; // Account path
    const external_chain = root.derivePath(path_prefix).derive(0); // External chain
    const first_address_key = external_chain.derive(0); // First address

    console.log('✅ BIP44 derivation path: m/44\'/0\'/0\'/0/0');

    // Generate different address formats
    const p2pkh = bitcoin.payments.p2pkh({ pubkey: first_address_key.publicKey, network: this.network });
    const p2sh = bitcoin.payments.p2sh({ redeem: bitcoin.payments.p2wpkh({ pubkey: first_address_key.publicKey, network: this.network }), network: this.network });
    const p2wpkh = bitcoin.payments.p2wpkh({ pubkey: first_address_key.publicKey, network: this.network });

    const wallet_data = {
      generated: new Date().toISOString(),
      network: 'bitcoin mainnet',
      mnemonic_path: 'm/44\'/0\'/0\'/0/0',
      mnemonic: mnemonic,

      // Legacy address (P2PKH) - starts with 1
      legacy_address: p2pkh.address,
      legacy_type: 'P2PKH (Legacy)',

      // Segwit P2SH address - starts with 3
      segwit_p2sh_address: p2sh.address,
      segwit_p2sh_type: 'P2SH-P2WPKH (Segwit)',

      // Native Segwit address - starts with bc1
      native_segwit_address: p2wpkh.address,
      native_segwit_type: 'P2WPKH (Native Segwit)',

      // Keys (CRITICAL - KEEP SECURE)
      private_key_hex: first_address_key.privateKey.toString('hex'),
      private_key_wif: first_address_key.toWIF(),
      public_key_hex: first_address_key.publicKey.toString('hex'),

      // Extended keys for wallets that support them
      xprv: first_address_key.toBase58(),
      xpub: first_address_key.neutered().toBase58(),

      // Warnings
      warning_1: 'CRITICAL: This file contains PRIVATE KEYS for Bitcoin',
      warning_2: 'KEEP SECURE - Anyone with this key can spend all Bitcoin',
      warning_3: 'NEVER commit to git',
      warning_4: 'Back up recovery seed separately',
      warning_5: 'Do NOT share private_key_hex, private_key_wif, or mnemonic',

      // Recommended address format
      recommended_format: 'native_segwit_address (bc1... format - lowest fees, newest standard)',
    };

    return wallet_data;
  }

  saveWalletSecurely(wallet_data) {
    console.log('\n💾 Saving Bitcoin wallet...\n');

    // Write with secure permissions
    const json_string = JSON.stringify(wallet_data, null, 2);
    fs.writeFileSync(this.bitcoin_wallet_path, json_string, { mode: 0o600 });

    // Verify permissions
    const stats = fs.statSync(this.bitcoin_wallet_path);
    const perms = (stats.mode & parseInt('777', 8)).toString(8);

    if (perms === '600') {
      console.log('✅ File saved with secure permissions (0600)');
    } else {
      console.warn(`⚠️  Warning: File permissions are ${perms}, expected 600`);
    }

    console.log(`✅ Saved to: ${this.bitcoin_wallet_path}\n`);
  }

  displayAddresses(wallet_data) {
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║               BITCOIN WALLET ADDRESSES GENERATED               ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    console.log('🔐 RECOMMENDED ADDRESS (Use this one):');
    console.log(`   Format: ${wallet_data.native_segwit_type}`);
    console.log(`   Address: ${wallet_data.native_segwit_address}`);
    console.log('   Why: Lowest fees, newest standard, widely supported\n');

    console.log('📊 ALTERNATIVE ADDRESSES:\n');

    console.log('Legacy Address (P2PKH):');
    console.log(`   Format: ${wallet_data.legacy_type}`);
    console.log(`   Address: ${wallet_data.legacy_address}`);
    console.log('   Use: Maximum compatibility with old wallets\n');

    console.log('Segwit Address (P2SH):');
    console.log(`   Format: ${wallet_data.segwit_p2sh_type}`);
    console.log(`   Address: ${wallet_data.segwit_p2sh_address}`);
    console.log('   Use: Good compatibility, lower fees than legacy\n');

    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║                      KEY INFORMATION                           ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    console.log('🔑 Private Key Formats:\n');
    console.log('Hex Format (32 bytes):');
    console.log(`   ${wallet_data.private_key_hex}`);
    console.log('   Use: With APIs and signing libraries\n');

    console.log('WIF Format (Wallet Import Format):');
    console.log(`   ${wallet_data.private_key_wif}`);
    console.log('   Use: Importing into wallets\n');

    console.log('📖 Extended Keys:\n');
    console.log('XPRV (Extended Private Key):');
    console.log(`   ${wallet_data.xprv.substring(0, 50)}...`);
    console.log('   Use: Master key for derivation\n');

    console.log('XPUB (Extended Public Key):');
    console.log(`   ${wallet_data.xpub}`);
    console.log('   Use: Sharing with wallets for monitoring (does NOT expose private key)\n');

    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║                     NEXT STEPS                                 ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    console.log('1. VERIFY ADDRESS:');
    console.log('   Check that this matches your hardware wallet (if using one)');
    console.log('   Or import into Bitcoin wallet to verify funds\n');

    console.log('2. TEST TRANSFER:');
    console.log('   Send small amount (0.001 BTC) to verify it works');
    console.log('   Do NOT send large amount until verified\n');

    console.log('3. BACKUP SEED:');
    console.log('   Back up the original mnemonic phrase separately');
    console.log('   Store in secure, non-digital location (physical backup)\n');

    console.log('4. MONITOR:');
    console.log('   Use Etherscan or Bitcoin Block Explorer');
    console.log(`   Monitor: ${wallet_data.native_segwit_address}\n`);

    console.log('5. SET UP ALERTS:');
    console.log('   Configure transaction alerts on blockchain explorer');
    console.log('   Large transfers should trigger alerts\n');

    console.log('⚠️  SECURITY REMINDERS:\n');
    console.log('   🔒 Never share private keys with anyone');
    console.log('   🔒 Use hardware wallet for large amounts if possible');
    console.log('   🔒 Private key stored in: data/bitcoin-hotwallet-keys.json');
    console.log('   🔒 This file is .gitignored (NOT committed to git)');
    console.log('   🔒 File has 0600 permissions (owner-only access)\n');
  }

  run() {
    try {
      console.log('\n╔════════════════════════════════════════════════════════════════╗');
      console.log('║          BITCOIN WALLET GENERATOR FROM BIP44 SEED              ║');
      console.log('╚════════════════════════════════════════════════════════════════╝');

      // Load existing hotwallet mnemonic
      const mnemonic = this.loadHotwalletMnemonic();
      console.log('✅ Loaded mnemonic from data/hotwallet-keys.json');

      // Generate Bitcoin wallet
      const wallet_data = this.generateBitcoinWallet(mnemonic);

      // Save securely
      this.saveWalletSecurely(wallet_data);

      // Display results
      this.displayAddresses(wallet_data);

      console.log('✅ Bitcoin wallet generation COMPLETE\n');

    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  }
}

// Run
const generator = new BitcoinWalletGenerator();
generator.run();
