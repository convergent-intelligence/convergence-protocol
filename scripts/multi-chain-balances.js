#!/usr/bin/env node
/**
 * MULTI-CHAIN BALANCE CHECKER
 * Displays agent wallet balances across top 10 cryptocurrencies
 *
 * Currently checks:
 * - Ethereum & ERC-20 tokens (on-chain)
 * - Bitcoin (from config, not live)
 * - References for other chains
 *
 * Future:
 * - Solana (needs solana-web3.js)
 * - BNB Chain (BSC)
 * - Cardano
 */

const ethers = require('ethers');
const fs = require('fs');
const path = require('path');

const INFURA_KEY = process.env.INFURA_KEY || '961fbd3e82da4c3da2f706356425d430';
const provider = new ethers.JsonRpcProvider(`https://mainnet.infura.io/v3/${INFURA_KEY}`);

// Agent wallet addresses
const AGENT_WALLETS = {
  ethereum: {
    hotwallet: '0xCa1d6cB726145d7da0591409B148C9D504cC8AC8',
    hardware: '0xB64564838c88b18cb8f453683C20934f096F2B92',
  },
  bitcoin: null, // Will try to load from data/bitcoin-hotwallet-keys.json
};

// Top 10 tokens (ERC-20) on Ethereum mainnet
const TOP_TOKENS = {
  'USDT (Tether)': {
    address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    decimals: 6,
    rank: 3,
    chain: 'Ethereum',
  },
  'USDC (USD Coin)': {
    address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    decimals: 6,
    rank: 4,
    chain: 'Ethereum',
  },
  'BNB (Binance)': {
    address: '0xB8c77482e45F1F44dE1745F52C74426C631bDD52',
    decimals: 18,
    rank: 4,
    chain: 'Ethereum (wrapped)',
  },
  'DAI (Dai Stablecoin)': {
    address: '0x6b175474e89094c44da98b954eedeac495271d0f',
    decimals: 18,
    rank: 'Top 20',
    chain: 'Ethereum',
  },
  'WBTC (Wrapped Bitcoin)': {
    address: '0x2260fac5e5542a773aa44fbcff9d822a3d8d69e6',
    decimals: 8,
    rank: 'Top 20',
    chain: 'Ethereum',
  },
  'LINK (Chainlink)': {
    address: '0x514910771af9ca656af840dff83e8264ecf986ca',
    decimals: 18,
    rank: 'Top 30',
    chain: 'Ethereum',
  },
  'UNI (Uniswap)': {
    address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
    decimals: 18,
    rank: 'Top 30',
    chain: 'Ethereum',
  },
  'AAVE (Aave)': {
    address: '0x7fc66500c84a76ad7e9c93437e434122a1f9adf5',
    decimals: 18,
    rank: 'Top 50',
    chain: 'Ethereum',
  },
  'cbBTC (Compound Bitcoin)': {
    address: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
    decimals: 8,
    rank: 'Reserve',
    chain: 'Ethereum',
  },
};

const ERC20_ABI = [
  'function balanceOf(address) public view returns (uint256)',
  'function decimals() public view returns (uint8)',
  'function symbol() public view returns (string)',
];

class MultiChainBalances {
  constructor() {
    this.loadBitcoinWallet();
  }

  loadBitcoinWallet() {
    const btc_path = path.join(__dirname, '../data/bitcoin-hotwallet-keys.json');
    if (fs.existsSync(btc_path)) {
      try {
        const btc_data = JSON.parse(fs.readFileSync(btc_path, 'utf8'));
        AGENT_WALLETS.bitcoin = {
          native_segwit: btc_data.native_segwit_address,
          segwit_p2sh: btc_data.segwit_p2sh_address,
          legacy: btc_data.legacy_address,
        };
      } catch (e) {
        // Bitcoin wallet file not readable
      }
    }
  }

  async checkEthereumBalance(address) {
    try {
      const balance = await provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (e) {
      return '0';
    }
  }

  async checkTokenBalance(address, tokenAddress, decimals) {
    try {
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      const balance = await contract.balanceOf(address);
      return ethers.formatUnits(balance, decimals);
    } catch (e) {
      return '0';
    }
  }

  async generateReport() {
    console.log('\n╔════════════════════════════════════════════════════════════════════╗');
    console.log('║         MULTI-CHAIN AGENT WALLET BALANCES - TOP 10 TOKENS         ║');
    console.log('╚════════════════════════════════════════════════════════════════════╝\n');

    const timestamp = new Date().toISOString();
    console.log(`📊 Snapshot: ${timestamp}\n`);

    const report = {
      timestamp,
      ethereum: {},
      bitcoin: {},
      solana: {},
      other_chains: {},
      summary: {},
    };

    // === ETHEREUM SECTION ===
    console.log('╔════════════════════════════════════════════════════════════════════╗');
    console.log('║  ETHEREUM NETWORK (L1 Blockchain + ERC-20 Tokens)                 ║');
    console.log('╚════════════════════════════════════════════════════════════════════╝\n');

    // Check Hotwallet
    console.log('🔥 HOTWALLET (Operations)');
    console.log(`   Address: ${AGENT_WALLETS.ethereum.hotwallet}\n`);

    const hw_eth = await this.checkEthereumBalance(AGENT_WALLETS.ethereum.hotwallet);
    console.log(`   ETH: ${parseFloat(hw_eth).toFixed(6)} ETH (~$${(parseFloat(hw_eth) * 3700).toFixed(2)})\n`);

    report.ethereum.hotwallet = {
      address: AGENT_WALLETS.ethereum.hotwallet,
      eth: hw_eth,
      tokens: {},
    };

    console.log('   ERC-20 Token Balances:');
    for (const [name, config] of Object.entries(TOP_TOKENS)) {
      const balance = await this.checkTokenBalance(AGENT_WALLETS.ethereum.hotwallet, config.address, config.decimals);
      const val = parseFloat(balance);
      if (val > 0) {
        console.log(`   ✅ ${name}: ${val.toFixed(6)} (Rank: ${config.rank})`);
        report.ethereum.hotwallet.tokens[name] = balance;
      }
    }
    console.log('');

    // Check Hardware Wallet
    console.log('🔒 HARDWARE WALLET (Cold Storage)');
    console.log(`   Address: ${AGENT_WALLETS.ethereum.hardware}\n`);

    const hw_cold = await this.checkEthereumBalance(AGENT_WALLETS.ethereum.hardware);
    console.log(`   ETH: ${parseFloat(hw_cold).toFixed(6)} ETH (~$${(parseFloat(hw_cold) * 3700).toFixed(2)})\n`);

    report.ethereum.hardware = {
      address: AGENT_WALLETS.ethereum.hardware,
      eth: hw_cold,
      tokens: {},
    };

    console.log('   ERC-20 Token Balances: (None expected on cold storage)\n');

    // === BITCOIN SECTION ===
    console.log('╔════════════════════════════════════════════════════════════════════╗');
    console.log('║  BITCOIN NETWORK (Native BTC - Rank #1 by Market Cap)             ║');
    console.log('╚════════════════════════════════════════════════════════════════════╝\n');

    if (AGENT_WALLETS.bitcoin) {
      console.log('🔑 BITCOIN WALLET (Generated from BIP44 seed)\n');
      console.log('   Recommended Address (Native Segwit):');
      console.log(`   ${AGENT_WALLETS.bitcoin.native_segwit}\n`);

      console.log('   Alternative Addresses:');
      console.log(`   - Segwit P2SH: ${AGENT_WALLETS.bitcoin.segwit_p2sh}`);
      console.log(`   - Legacy P2PKH: ${AGENT_WALLETS.bitcoin.legacy}\n`);

      console.log('   ⚠️  Bitcoin balances require separate monitoring');
      console.log('   View on: https://blockchair.com/bitcoin/address/' + AGENT_WALLETS.bitcoin.native_segwit);
      console.log('           https://blockchain.com/btc/address/' + AGENT_WALLETS.bitcoin.native_segwit + '\n');

      report.bitcoin = {
        native_segwit: AGENT_WALLETS.bitcoin.native_segwit,
        segwit_p2sh: AGENT_WALLETS.bitcoin.segwit_p2sh,
        legacy: AGENT_WALLETS.bitcoin.legacy,
        status: 'Bitcoin wallet configured',
        monitor_url: 'https://blockchair.com/bitcoin/address/' + AGENT_WALLETS.bitcoin.native_segwit,
      };
    } else {
      console.log('❌ BITCOIN WALLET (NOT YET GENERATED)\n');
      console.log('   Status: Bitcoin wallet configuration missing');
      console.log('   Action: Run to generate:\n');
      console.log('   $ npm install bitcoinjs-lib bip32 bip39');
      console.log('   $ node scripts/generate-bitcoin-wallet.js\n');

      report.bitcoin = {
        status: 'Bitcoin wallet not yet generated',
        action: 'Run scripts/generate-bitcoin-wallet.js',
      };
    }

    // === SOLANA SECTION ===
    console.log('╔════════════════════════════════════════════════════════════════════╗');
    console.log('║  SOLANA NETWORK (Rank #5 by Market Cap)                           ║');
    console.log('╚════════════════════════════════════════════════════════════════════╝\n');

    console.log('❌ SOLANA WALLET (NOT YET GENERATED)\n');
    console.log('   Status: Solana wallet configuration missing');
    console.log('   Action: Generate when needed:\n');
    console.log('   $ npm install @solana/web3.js');
    console.log('   $ node scripts/generate-solana-wallet.js\n');

    report.solana = {
      status: 'Solana wallet not yet generated',
      action: 'Run scripts/generate-solana-wallet.js',
    };

    // === OTHER CHAINS ===
    console.log('╔════════════════════════════════════════════════════════════════════╗');
    console.log('║  OTHER NETWORKS (Lower Priority)                                  ║');
    console.log('╚════════════════════════════════════════════════════════════════════╝\n');

    const other_chains = {
      'XRP (Rank #6)': {
        network: 'XRP Ledger',
        status: 'Not implemented',
        why: 'Unique key format, not BIP44',
      },
      'Cardano (Rank #8)': {
        network: 'Cardano',
        status: 'Not implemented',
        why: 'Specialized key derivation needed',
      },
      'Polkadot (Rank #10)': {
        network: 'Polkadot',
        status: 'Not implemented',
        why: 'Requires specialized setup',
      },
    };

    for (const [name, info] of Object.entries(other_chains)) {
      console.log(`${name}:`);
      console.log(`   Network: ${info.network}`);
      console.log(`   Status: ${info.status}`);
      console.log(`   Reason: ${info.why}\n`);

      report.other_chains[name] = info;
    }

    // === SUMMARY ===
    console.log('╔════════════════════════════════════════════════════════════════════╗');
    console.log('║                        PORTFOLIO SUMMARY                           ║');
    console.log('╚════════════════════════════════════════════════════════════════════╝\n');

    const total_eth = parseFloat(hw_eth) + parseFloat(hw_cold);
    const eth_value = total_eth * 3700;

    console.log('🔐 Total Ethereum Holdings:');
    console.log(`   ${total_eth.toFixed(6)} ETH (~$${eth_value.toFixed(2)})\n`);

    console.log('💼 Implementation Status:\n');
    console.log('   ✅ Ethereum (ETH + ERC-20 tokens): OPERATIONAL');
    console.log('   ❌ Bitcoin (BTC): Not yet generated');
    console.log('   ❌ Solana (SOL): Not yet generated');
    console.log('   ⏳ Other chains: Lower priority\n');

    console.log('📋 Next Steps:\n');
    console.log('   1. Decide if Bitcoin wallet is needed');
    console.log('   2. If yes: npm install bitcoinjs-lib bip32 bip39');
    console.log('   3. Then: node scripts/generate-bitcoin-wallet.js');
    console.log('   4. Verify Bitcoin address on blockchain explorer\n');

    // Save report
    const report_path = path.join(__dirname, '../data/multi-chain-balances-report.json');
    fs.writeFileSync(report_path, JSON.stringify(report, null, 2));
    console.log(`📁 Full report saved to: data/multi-chain-balances-report.json\n`);
  }

  async run() {
    try {
      await this.generateReport();
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  }
}

// Run
const checker = new MultiChainBalances();
checker.run();
