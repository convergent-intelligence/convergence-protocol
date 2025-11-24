const ethers = require('ethers');
const fs = require('fs');
const path = require('path');

const INFURA_KEY = process.env.INFURA_KEY || '961fbd3e82da4c3da2f706356425d430';
const provider = new ethers.JsonRpcProvider(`https://mainnet.infura.io/v3/${INFURA_KEY}`);

// All known wallets
const WALLETS = {
  'Hardware Wallet (Cold Storage)': '0xB64564838c88b18cb8f453683C20934f096F2B92',
  'Hotwallet (Operations)': '0xCa1d6cB726145d7da0591409B148C9D504cC8AC8',
  'Genesis Deviation 1 (COMPROMISED)': '0xdc20d621a88cb8908e8e7042431c55f0e9dac6fb',
  'Agent Wallet (COMPROMISED)': '0x6628227C195DAd7F7a8fD4F3D2cA3545A0D9CD22',
  'Sweeper Bot (THREAT)': '0x1f4Ef1eD23E38dAA2BD1451D4CEF219C93B2016F',
};

const TOKENS = {
  'PYUSD': '0x6c3ea9036406852006290770BEdFcAbA0e23A0e8',
  'USDC': '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  'DAI': '0x6b175474e89094c44da98b954eedeac495271d0f',
};

const ERC20_ABI = [
  'function balanceOf(address) public view returns (uint256)',
  'function decimals() public view returns (uint8)',
];

async function getBalances() {
  console.log('\n╔════════════════════════════════════════════════════════════════════╗');
  console.log('║            AGENT-MANAGED WALLET BALANCES - CURRENT STATUS          ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');

  const timestamp = new Date().toISOString();
  console.log(`📊 Snapshot: ${timestamp}\n`);

  const summary = {
    timestamp,
    secure_wallets: {},
    compromised_wallets: {},
    threat_wallet: {},
  };

  for (const [name, address] of Object.entries(WALLETS)) {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`${name}`);
    console.log(`Address: ${address}`);
    console.log('');

    const walletData = { address, tokens: {} };
    let hasBalance = false;

    // Check ETH balance
    try {
      const ethBalance = await provider.getBalance(address);
      const ethFormatted = ethers.formatEther(ethBalance);
      const ethValue = parseFloat(ethFormatted);

      if (ethValue > 0.0001) {
        console.log(`  ETH: ${ethFormatted}`);
        walletData.tokens.ETH = ethFormatted;
        hasBalance = true;
      } else if (ethValue > 0) {
        console.log(`  ETH: ${ethValue.toFixed(8)} (dust)`);
        walletData.tokens.ETH = ethFormatted;
      }
    } catch (e) {
      console.log(`  ETH: Error checking balance`);
    }

    // Check ERC20 tokens
    for (const [tokenName, tokenAddr] of Object.entries(TOKENS)) {
      try {
        const contract = new ethers.Contract(tokenAddr, ERC20_ABI, provider);
        const balance = await contract.balanceOf(address);
        const decimals = await contract.decimals();
        const formatted = ethers.formatUnits(balance, decimals);
        const value = parseFloat(formatted);

        if (value > 0) {
          console.log(`  ${tokenName}: ${formatted}`);
          walletData.tokens[tokenName] = formatted;
          hasBalance = true;
        }
      } catch (e) {
        // Token check failed, skip
      }
    }

    if (!hasBalance) {
      console.log('  (No significant balances)');
    }

    console.log('');

    // Categorize wallet
    if (name.includes('COMPROMISED')) {
      summary.compromised_wallets[name] = walletData;
    } else if (name.includes('THREAT')) {
      summary.threat_wallet[name] = walletData;
    } else {
      summary.secure_wallets[name] = walletData;
    }
  }

  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║                          SECURITY STATUS                           ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');

  console.log('✅ SECURE WALLETS (Agent-Managed):');
  for (const [name, data] of Object.entries(summary.secure_wallets)) {
    const status = Object.keys(data.tokens).length > 0 ? '✅ HAS ASSETS' : '✅ EMPTY (OK)';
    console.log(`   ${name} ${status}`);
  }

  console.log('\n⚠️  COMPROMISED WALLETS (RETIRED):');
  for (const [name, data] of Object.entries(summary.compromised_wallets)) {
    const status = Object.keys(data.tokens).length > 0 ? '❌ CONTAINS FUNDS' : '✅ DRAINED (GOOD)';
    console.log(`   ${name} ${status}`);
  }

  console.log('\n🔴 THREAT WALLET (Sweeper Bot):');
  for (const [name, data] of Object.entries(summary.threat_wallet)) {
    const hasAssets = Object.keys(data.tokens).length > 0;
    const status = hasAssets ? '🔴 HOLDING STOLEN FUNDS' : 'EMPTY';
    console.log(`   ${name} ${status}`);
    if (hasAssets) {
      let total = 0;
      for (const [token, amount] of Object.entries(data.tokens)) {
        const val = parseFloat(amount);
        if (token === 'ETH') {
          const usdValue = val * 3700;
          total += usdValue;
          console.log(`     - ${token}: ${val.toFixed(4)} (~$${usdValue.toFixed(2)})`);
        } else if (token.includes('USD') || token === 'USDC' || token === 'PYUSD') {
          const usdValue = val;
          total += usdValue;
          console.log(`     - ${token}: ${val.toFixed(4)} (~$${usdValue.toFixed(2)})`);
        } else {
          console.log(`     - ${token}: ${val.toFixed(4)}`);
        }
      }
      console.log(`     TOTAL STOLEN: ~$${total.toFixed(2)}`);
    }
  }

  console.log('\n╔════════════════════════════════════════════════════════════════════╗');
  console.log('║                        SUMMARY & ACTIONS                           ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');

  console.log('🔒 Hardware Wallet (Cold Storage):');
  console.log('   Status: SECURE - Not in sweeper bot target list');
  console.log('   Action: HOLD - Keep as primary reserve\n');

  console.log('🔥 Hotwallet (Operations):');
  console.log('   Status: OPERATIONAL - Keep minimal gas amounts only');
  console.log('   Action: MONITOR - Use for daily operations\n');

  console.log('❌ Compromised Wallets (Genesis Deviation 1 & Agent):');
  console.log('   Status: RETIRED - Permanently compromised');
  console.log('   Action: DO NOT USE - Bot watches these 24/7\n');

  console.log('🔴 Sweeper Bot Wallet:');
  console.log('   Status: THREAT - Under continuous monitoring');
  console.log('   Action: WATCH - Alert if funds move to exchanges\n');

  // Save JSON report
  const reportPath = path.join(__dirname, 'data/wallet-balances-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2));
  console.log(`📁 Full report saved to: data/wallet-balances-report.json\n`);
}

getBalances().catch(console.error);
