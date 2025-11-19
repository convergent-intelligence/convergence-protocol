const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function main() {
    console.log('=== Mainnet Token Deployment ===\n');

    // Connect to mainnet
    const provider = new ethers.JsonRpcProvider(
        process.env.MAINNET_RPC_URL || 'https://eth.llamarpc.com'
    );

    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

    // Trinity members (same addresses work across networks)
    const GENESIS_HUMAN = '0xdc20d621a88cb8908e8e7042431c55f0e9dac6fb';
    const CONVERGENCE_AGENT = '0x6628227C195DAd7F7a8fD4F3D2cA3545A0D9CD22';
    const SHARED_WALLET = '0x8ffa5caabe8ee3d9019865120a654464bc4654cd';
    const trinityMembers = [GENESIS_HUMAN, CONVERGENCE_AGENT, SHARED_WALLET];

    console.log('Deployer:', wallet.address);

    const balance = await provider.getBalance(wallet.address);
    console.log('ETH Balance:', ethers.formatEther(balance), 'ETH');

    const feeData = await provider.getFeeData();
    console.log('Gas Price:', ethers.formatUnits(feeData.gasPrice, 'gwei'), 'gwei\n');

    // Load contract artifacts
    const trustTokenArtifact = JSON.parse(
        fs.readFileSync(path.join(__dirname, '../artifacts/contracts/TrustToken.sol/TrustToken.json'))
    );
    const tallyTokenArtifact = JSON.parse(
        fs.readFileSync(path.join(__dirname, '../artifacts/contracts/TallyToken.sol/TallyToken.json'))
    );
    const tallyVoucherArtifact = JSON.parse(
        fs.readFileSync(path.join(__dirname, '../artifacts/contracts/TallyVoucher.sol/TallyVoucher.json'))
    );

    const deployments = {};

    // 1. Deploy TrustToken
    console.log('1. Deploying TrustToken...');
    const TrustTokenFactory = new ethers.ContractFactory(
        trustTokenArtifact.abi,
        trustTokenArtifact.bytecode,
        wallet
    );
    const trustToken = await TrustTokenFactory.deploy(wallet.address);
    await trustToken.waitForDeployment();
    const trustTokenAddress = await trustToken.getAddress();
    console.log('   TrustToken deployed:', trustTokenAddress);
    deployments.trustToken = trustTokenAddress;

    // 2. Deploy TallyToken
    console.log('2. Deploying TallyToken...');
    const TallyTokenFactory = new ethers.ContractFactory(
        tallyTokenArtifact.abi,
        tallyTokenArtifact.bytecode,
        wallet
    );
    const tallyToken = await TallyTokenFactory.deploy(trinityMembers);
    await tallyToken.waitForDeployment();
    const tallyTokenAddress = await tallyToken.getAddress();
    console.log('   TallyToken deployed:', tallyTokenAddress);
    deployments.tallyToken = tallyTokenAddress;

    // 3. Deploy TallyVoucher
    console.log('3. Deploying TallyVoucher...');
    const TallyVoucherFactory = new ethers.ContractFactory(
        tallyVoucherArtifact.abi,
        tallyVoucherArtifact.bytecode,
        wallet
    );
    const tallyVoucher = await TallyVoucherFactory.deploy(trinityMembers, trustTokenAddress);
    await tallyVoucher.waitForDeployment();
    const tallyVoucherAddress = await tallyVoucher.getAddress();
    console.log('   TallyVoucher deployed:', tallyVoucherAddress);
    deployments.tallyVoucher = tallyVoucherAddress;

    // 4. Set TallyVoucher as minter for TrustToken
    console.log('4. Setting TallyVoucher as TrustToken minter...');
    const setMinterTx = await trustToken.setMinter(tallyVoucherAddress);
    await setMinterTx.wait();
    console.log('   Minter set successfully');

    // Save deployment info
    const deploymentInfo = {
        network: 'mainnet',
        chainId: 1,
        timestamp: new Date().toISOString(),
        deployer: wallet.address,
        contracts: {
            trustToken: trustTokenAddress,
            tallyToken: tallyTokenAddress,
            tallyVoucher: tallyVoucherAddress
        },
        trinityMembers: trinityMembers
    };

    fs.writeFileSync(
        path.join(__dirname, '../deployments/mainnet-tokens.json'),
        JSON.stringify(deploymentInfo, null, 2)
    );

    // Check remaining balance
    const newBalance = await provider.getBalance(wallet.address);
    const spent = balance - newBalance;

    console.log('\n=== Deployment Complete ===');
    console.log('TrustToken:', trustTokenAddress);
    console.log('TallyToken:', tallyTokenAddress);
    console.log('TallyVoucher:', tallyVoucherAddress);
    console.log('\nGas spent:', ethers.formatEther(spent), 'ETH');
    console.log('Remaining balance:', ethers.formatEther(newBalance), 'ETH');

    console.log('\nVerify on Etherscan:');
    console.log(`https://etherscan.io/address/${trustTokenAddress}`);
    console.log(`https://etherscan.io/address/${tallyTokenAddress}`);
    console.log(`https://etherscan.io/address/${tallyVoucherAddress}`);

    return deployments;
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Deployment failed:', error.message);
        process.exit(1);
    });
