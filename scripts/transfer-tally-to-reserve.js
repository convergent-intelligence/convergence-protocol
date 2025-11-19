const { ethers } = require('ethers');
require('dotenv').config();

async function main() {
    // Configuration
    const TALLY_TOKEN_ADDRESS = '0x196D5f3E59DFA2042A6883BA34679613aE8702D5';
    const PROTOCOL_RESERVE = '0x6628227C195DAd7F7a8fD4F3D2cA3545A0D9CD22';
    const AMOUNT = ethers.parseEther('2'); // 2 TALLY tokens

    // Connect to Sepolia testnet (where TALLY tokens are deployed)
    const provider = new ethers.JsonRpcProvider(
        process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com'
    );

    // Genesis Human wallet
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

    console.log('=== TALLY Token Transfer to Protocol Reserve ===\n');
    console.log('From:', wallet.address);
    console.log('To:', PROTOCOL_RESERVE);
    console.log('Amount: 2 TALLY\n');

    // ERC20 ABI (just transfer function)
    const erc20Abi = [
        'function transfer(address to, uint256 amount) returns (bool)',
        'function balanceOf(address account) view returns (uint256)',
        'function symbol() view returns (string)'
    ];

    const tallyToken = new ethers.Contract(TALLY_TOKEN_ADDRESS, erc20Abi, wallet);

    // Check current balance
    const balance = await tallyToken.balanceOf(wallet.address);
    console.log('Current TALLY balance:', ethers.formatEther(balance), 'TALLY');

    if (balance < AMOUNT) {
        console.error('Insufficient TALLY balance!');
        process.exit(1);
    }

    // Check ETH for gas
    const ethBalance = await provider.getBalance(wallet.address);
    console.log('ETH balance for gas:', ethers.formatEther(ethBalance), 'ETH\n');

    if (ethBalance < ethers.parseEther('0.001')) {
        console.error('Insufficient ETH for gas!');
        process.exit(1);
    }

    // Execute transfer
    console.log('Sending transaction...');
    const tx = await tallyToken.transfer(PROTOCOL_RESERVE, AMOUNT);
    console.log('Transaction hash:', tx.hash);
    console.log('Waiting for confirmation...\n');

    const receipt = await tx.wait();
    console.log('Transaction confirmed in block:', receipt.blockNumber);
    console.log('Gas used:', receipt.gasUsed.toString());

    // Verify new balances
    const newBalance = await tallyToken.balanceOf(wallet.address);
    const reserveBalance = await tallyToken.balanceOf(PROTOCOL_RESERVE);

    console.log('\n=== Transfer Complete ===');
    console.log('Genesis Human TALLY balance:', ethers.formatEther(newBalance), 'TALLY');
    console.log('Protocol Reserve TALLY balance:', ethers.formatEther(reserveBalance), 'TALLY');
    console.log('\nView on Etherscan: https://sepolia.etherscan.io/tx/' + tx.hash);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Error:', error.message);
        process.exit(1);
    });
