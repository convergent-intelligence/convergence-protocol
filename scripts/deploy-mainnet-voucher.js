const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function main() {
    console.log('=== Deploying TallyVoucher to Mainnet ===\n');

    // Connect to mainnet
    const provider = new ethers.JsonRpcProvider(
        process.env.MAINNET_RPC_URL || 'https://eth.llamarpc.com'
    );

    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

    // Already deployed
    const TRUST_TOKEN_ADDRESS = '0x4A2178b300556e20569478bfed782bA02BFaD778';
    const TALLY_TOKEN_ADDRESS = '0xb8c4682644BAb1900A8B67C3295b8Ce525F3e35d';

    // Trinity members as fixed array
    const trinityMembers = [
        '0xdc20d621a88cb8908e8e7042431c55f0e9dac6fb',
        '0x6628227C195DAd7F7a8fD4F3D2cA3545A0D9CD22',
        '0x8ffa5caabe8ee3d9019865120a654464bc4654cd'
    ];

    console.log('Deployer:', wallet.address);

    const balance = await provider.getBalance(wallet.address);
    console.log('ETH Balance:', ethers.formatEther(balance), 'ETH');

    const feeData = await provider.getFeeData();
    console.log('Gas Price:', ethers.formatUnits(feeData.gasPrice, 'gwei'), 'gwei\n');

    console.log('Already deployed:');
    console.log('  TrustToken:', TRUST_TOKEN_ADDRESS);
    console.log('  TallyToken:', TALLY_TOKEN_ADDRESS, '\n');

    // Load TallyVoucher artifact
    const tallyVoucherArtifact = JSON.parse(
        fs.readFileSync(path.join(__dirname, '../artifacts/contracts/TallyVoucher.sol/TallyVoucher.json'))
    );

    // Deploy TallyVoucher - constructor is (address _trustTokenAddress, address[3] memory _trinityMembers)
    console.log('Deploying TallyVoucher...');
    const TallyVoucherFactory = new ethers.ContractFactory(
        tallyVoucherArtifact.abi,
        tallyVoucherArtifact.bytecode,
        wallet
    );

    const tallyVoucher = await TallyVoucherFactory.deploy(TRUST_TOKEN_ADDRESS, trinityMembers, {
        gasLimit: 2000000
    });
    await tallyVoucher.waitForDeployment();
    const tallyVoucherAddress = await tallyVoucher.getAddress();
    console.log('TallyVoucher deployed:', tallyVoucherAddress);

    // Set TallyVoucher as minter for TrustToken
    console.log('\nSetting TallyVoucher as TrustToken minter...');
    const trustTokenArtifact = JSON.parse(
        fs.readFileSync(path.join(__dirname, '../artifacts/contracts/TrustToken.sol/TrustToken.json'))
    );
    const trustToken = new ethers.Contract(TRUST_TOKEN_ADDRESS, trustTokenArtifact.abi, wallet);
    const setMinterTx = await trustToken.setMinter(tallyVoucherAddress);
    await setMinterTx.wait();
    console.log('Minter set successfully');

    // Save deployment info
    const deploymentInfo = {
        network: 'mainnet',
        chainId: 1,
        timestamp: new Date().toISOString(),
        deployer: wallet.address,
        contracts: {
            trustToken: TRUST_TOKEN_ADDRESS,
            tallyToken: TALLY_TOKEN_ADDRESS,
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

    console.log('\n=== Deployment Complete ===');
    console.log('TrustToken:', TRUST_TOKEN_ADDRESS);
    console.log('TallyToken:', TALLY_TOKEN_ADDRESS);
    console.log('TallyVoucher:', tallyVoucherAddress);
    console.log('\nRemaining balance:', ethers.formatEther(newBalance), 'ETH');

    console.log('\nVerify on Etherscan:');
    console.log(`https://etherscan.io/address/${TRUST_TOKEN_ADDRESS}`);
    console.log(`https://etherscan.io/address/${TALLY_TOKEN_ADDRESS}`);
    console.log(`https://etherscan.io/address/${tallyVoucherAddress}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Deployment failed:', error.message);
        process.exit(1);
    });
