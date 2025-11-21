const hre = require("hardhat");

/**
 * Bridge ETH from Ethereum mainnet to Base
 * Using the official Base bridge (L1StandardBridge)
 */

async function main() {
    console.log("Bridging ETH from Ethereum Mainnet to Base...");
    console.log("");

    const [signer] = await hre.ethers.getSigners();
    const mainnetBalance = await hre.ethers.provider.getBalance(signer.address);

    console.log("From Address:", signer.address);
    console.log("Mainnet Balance:", hre.ethers.formatEther(mainnetBalance), "ETH");

    // Base L1StandardBridge on Ethereum mainnet
    const BASE_BRIDGE = "0x3154Cf16ccdb4C6d922629664174b904d80F2C35";

    // Amount to bridge (0.005 ETH - enough for deployment with buffer)
    const BRIDGE_AMOUNT = hre.ethers.parseEther("0.005");

    console.log("Bridge Amount:", hre.ethers.formatEther(BRIDGE_AMOUNT), "ETH");
    console.log("Base Bridge:", BASE_BRIDGE);
    console.log("");

    // Base bridge ABI (depositETH function)
    const bridgeABI = [
        "function depositETH(uint32 _minGasLimit, bytes calldata _extraData) external payable"
    ];

    const bridge = new hre.ethers.Contract(BASE_BRIDGE, bridgeABI, signer);

    console.log("Initiating bridge transaction...");
    console.log("Note: This will take 10-15 minutes to complete");
    console.log("");

    // Bridge with 200k gas limit on L2 (standard for ETH deposits)
    const tx = await bridge.depositETH(
        200000, // _minGasLimit on Base
        "0x",   // _extraData (empty)
        { value: BRIDGE_AMOUNT }
    );

    console.log("Transaction sent:", tx.hash);
    console.log("Waiting for confirmation on mainnet...");

    const receipt = await tx.wait();
    console.log("✅ Confirmed on mainnet in block:", receipt.blockNumber);
    console.log("");
    console.log("Bridge Status:");
    console.log("  Mainnet TX:", tx.hash);
    console.log("  Status: Relaying to Base (10-15 min)");
    console.log("  Destination:", signer.address);
    console.log("  Amount:", hre.ethers.formatEther(BRIDGE_AMOUNT), "ETH");
    console.log("");
    console.log("Track on Base bridge: https://bridge.base.org/transactions");
    console.log("");

    // Save bridge info
    const bridgeInfo = {
        timestamp: new Date().toISOString(),
        from_network: "ethereum",
        to_network: "base",
        from_address: signer.address,
        to_address: signer.address,
        amount_eth: hre.ethers.formatEther(BRIDGE_AMOUNT),
        mainnet_tx: tx.hash,
        bridge_contract: BASE_BRIDGE,
        status: "pending_relay",
        estimated_completion: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    };

    console.log("Bridge Info:");
    console.log(JSON.stringify(bridgeInfo, null, 2));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
