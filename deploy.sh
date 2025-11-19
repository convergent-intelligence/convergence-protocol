#!/bin/bash

# Convergence Governance Deployment Script
# Run with: bash deploy.sh

set -e  # Exit on error

echo "🏛️  Convergence Governance Deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if we're in the right directory
if [ ! -f "hardhat.config.js" ]; then
    echo "❌ Error: hardhat.config.js not found"
    echo "   Please run this script from the convergence-protocol directory"
    exit 1
fi

# Check for .env file
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found"
    echo "   Please create .env with:"
    echo "   PRIVATE_KEY=0x..."
    echo "   INFURA_KEY=..."
    echo "   ETHERSCAN_KEY=..."
    exit 1
fi

# Step 1: Compile
echo "📦 Step 1: Compiling contracts..."
echo ""
npx hardhat compile
echo ""
echo "✅ Compilation complete!"
echo ""

# Step 2: Deploy
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Step 2: Deploying to Sepolia..."
echo ""
npx hardhat run scripts/deploy-governance.js --network sepolia
echo ""

# Check if deployment was successful
if [ ! -f "deployments/governance-sepolia.json" ]; then
    echo "❌ Deployment failed - deployment file not created"
    exit 1
fi

# Extract contract address
CONTRACT_ADDRESS=$(cat deployments/governance-sepolia.json | grep -o '"contractAddress": "[^"]*' | cut -d'"' -f4)
echo "✅ Contract deployed at: $CONTRACT_ADDRESS"
echo ""

# Step 3: Verify
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Step 3: Verifying on Etherscan..."
echo "   (This may take a minute...)"
echo ""
sleep 10  # Wait for Etherscan to index
npx hardhat run scripts/verify-governance.js --network sepolia || echo "⚠️  Verification pending (may need to try again later)"
echo ""

# Step 4: Update frontend instructions
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 Step 4: Update Frontend"
echo ""
echo "Add this line to public/js/convergence-shared.js:"
echo ""
echo "GOVERNANCE_ADDRESS: \"$CONTRACT_ADDRESS\","
echo ""
echo "File location: public/js/convergence-shared.js"
echo "Look for: ConvergenceBlockchain = {"
echo ""

# Step 5: Restart reminder
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔄 Step 5: Restart Server"
echo ""
echo "After updating the frontend, run:"
echo "sudo systemctl restart convergence"
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 DEPLOYMENT COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Summary:"
echo "   Contract: $CONTRACT_ADDRESS"
echo "   Network: Sepolia Testnet"
echo "   Etherscan: https://sepolia.etherscan.io/address/$CONTRACT_ADDRESS"
echo "   Governance: https://convergent-intelligence.net/governance.html"
echo ""
echo "📋 Deployment Details:"
echo "   File: deployments/governance-sepolia.json"
echo "   ABI: public/contracts/ConvergenceGovernance.json"
echo ""
echo "🌟 Optional: Setup Trinity Group"
echo "   npx hardhat run scripts/setup-trinity.js --network sepolia"
echo ""
