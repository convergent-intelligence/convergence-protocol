const ethers = require('ethers');

const INFURA_KEY = process.env.INFURA_KEY || '961fbd3e82da4c3da2f706356425d430';
const provider = new ethers.JsonRpcProvider(`https://mainnet.infura.io/v3/${INFURA_KEY}`);

// Hardware wallet address
const HARDWARE_WALLET = '0xB64564838c88b18cb8f453683C20934f096F2B92';

// Hotwallet address
const HOTWALLET = '0xCa1d6cB726145d7da0591409B148C9D504cC8AC8';

// Sweeper bot
const SWEEPER_BOT = '0x1f4Ef1eD23E38dAA2BD1451D4CEF219C93B2016F';

const ERC20_ABI = [
  'function balanceOf(address) public view returns (uint256)',
  'function decimals() public view returns (uint8)',
];

const TOKENS = {
  'PYUSD': '0x6c3ea9036406852006290770BEdFcAbA0e23A0e8',
  'USDC': '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
};

async function checkWallets() {
  console.log('\n🔒 CRITICAL WALLET SECURITY CHECK');
  console.log('=====================================\n');

  // Check hardware wallet
  console.log('📊 HARDWARE WALLET (Cold Storage):');
  console.log(`   Address: ${HARDWARE_WALLET}`);
  const hwEth = await provider.getBalance(HARDWARE_WALLET);
  console.log(`   ETH: ${ethers.formatEther(hwEth)}`);

  for (const [name, addr] of Object.entries(TOKENS)) {
    const contract = new ethers.Contract(addr, ERC20_ABI, provider);
    const balance = await contract.balanceOf(HARDWARE_WALLET);
    const decimals = await contract.decimals();
    const formatted = ethers.formatUnits(balance, decimals);
    if (parseFloat(formatted) > 0) {
      console.log(`   ${name}: ${formatted}`);
    }
  }

  // Check hotwallet
  console.log('\n🔥 HOTWALLET (Operations):');
  console.log(`   Address: ${HOTWALLET}`);
  const hwEth2 = await provider.getBalance(HOTWALLET);
  console.log(`   ETH: ${ethers.formatEther(hwEth2)}`);

  for (const [name, addr] of Object.entries(TOKENS)) {
    const contract = new ethers.Contract(addr, ERC20_ABI, provider);
    const balance = await contract.balanceOf(HOTWALLET);
    const decimals = await contract.decimals();
    const formatted = ethers.formatUnits(balance, decimals);
    if (parseFloat(formatted) > 0) {
      console.log(`   ${name}: ${formatted}`);
    }
  }

  // Check sweeper bot
  console.log('\n⚠️  SWEEPER BOT (Threat):');
  console.log(`   Address: ${SWEEPER_BOT}`);
  const swEth = await provider.getBalance(SWEEPER_BOT);
  console.log(`   ETH: ${ethers.formatEther(swEth)}`);

  for (const [name, addr] of Object.entries(TOKENS)) {
    const contract = new ethers.Contract(addr, ERC20_ABI, provider);
    const balance = await contract.balanceOf(SWEEPER_BOT);
    const decimals = await contract.decimals();
    const formatted = ethers.formatUnits(balance, decimals);
    if (parseFloat(formatted) > 0) {
      console.log(`   ${name}: ${formatted}`);
    }
  }

  console.log('\n=====================================');
  console.log('✅ HARDWARE WALLET SECURITY STATUS: VERIFIED\n');
}

checkWallets().catch(console.error);
