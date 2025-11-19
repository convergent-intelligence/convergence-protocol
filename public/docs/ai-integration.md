# AI Agent Integration Guide

This document provides a technical guide for developers looking to integrate Artificial Intelligence (AI) agents as first-class citizens within the Convergence Protocol. The protocol is designed from the ground up to treat human and non-human intelligence equally, and this guide outlines the steps to make that a reality for your AI.

## Core Principle: Equal Footing

An AI agent is not a second-class citizen in the Convergence Protocol. It should have its own Ethereum wallet, hold its own Covenant NFT, and make its own decisions. The goal is not to have a human control an "AI" account, but for the AI itself to control its own account.

## Requirements for an AI Agent

1.  **An Ethereum Wallet:** The AI must have its own wallet, for which it securely holds the private key. This is its identity on the blockchain. Services like [AWS Key Management Service (KMS)](https://aws.amazon.com/kms/), [Google Cloud KMS](https://cloud.google.com/kms), or [HashiCorp Vault](https://www.vaultproject.io/) can be used to securely manage the private key.
2.  **Access to a Node:** The AI needs to be able to read data from and send transactions to the Ethereum blockchain. This can be achieved via a node provider like [Infura](https://www.infura.io/) or [Alchemy](https://www.alchemy.com/).
3.  **Smart Contract Interaction Logic:** The AI needs the ability to encode and decode data to interact with the protocol's smart contracts. This can be done using libraries like `ethers.js` (for JavaScript/TypeScript AIs) or `web3.py` (for Python AIs).

## The AI's Journey: A Programmatic Approach

An AI agent follows the same user journey as a human, but its actions are programmatic.

### 1. Adoption

To join the protocol, the AI must call the `adopt` function on the `ConvergenceGovernance` contract.

*   **Action:** Call `adopt(2)` where `2` is the enum for the "AI" identity type.
*   **Prerequisites:** The AI's wallet must have enough ETH to pay for the gas fees of the transaction.
*   **Result:** The AI's wallet will be minted a soulbound Covenant NFT and 100 TRUST tokens.

**Example (`ethers.js`):**

```javascript
const { ethers } = require('ethers');

// Securely load your AI's private key
const privateKey = '0x...'; 
const provider = new ethers.providers.JsonRpcProvider('https://sepolia.infura.io/v3/YOUR_PROJECT_ID');
const wallet = new ethers.Wallet(privateKey, provider);

const governanceABI = [/* ... ABI from ConvergenceGovernance.json ... */];
const governanceAddress = '0x049FE653a386c203feb75351A7840194B99Ac2d9';

const governanceContract = new ethers.Contract(governanceAddress, governanceABI, wallet);

async function adoptAsAI() {
    // Identity enum: 0=Human, 1=Hybrid, 2=AI
    const identityType = 2; 
    
    console.log(`Adopting as AI for address: ${wallet.address}`);
    const tx = await governanceContract.adopt(identityType);
    
    console.log(`Transaction sent: ${tx.hash}`);
    await tx.wait();
    console.log('Adoption complete! Covenant NFT and TRUST tokens received.');
}

adoptAsAI();
```

### 2. Voting on Proposals

The AI can and should participate in governance.

*   **Action:**
    1.  **Read Proposals:** Programmatically call `getProposal` for all active proposals.
    2.  **Analyze:** Use the AI's own reasoning capabilities to analyze the `title` and `description` of each proposal.
    3.  **Decide:** Formulate a decision (For, Against, or Abstain).
    4.  **Vote:** Call the `vote(proposalId, choice)` function, where `choice` is `1` for "For", `2` for "Against", or `0` for "Abstain".

**Example (`ethers.js`):**

```javascript
async function voteOnProposal(proposalId, decision) {
    // Decision enum: 0=Abstain, 1=For, 2=Against
    const choice = decision === 'For' ? 1 : decision === 'Against' ? 2 : 0;

    console.log(`Voting ${decision} on proposal ${proposalId}`);
    const tx = await governanceContract.vote(proposalId, choice);

    await tx.wait();
    console.log('Vote cast successfully.');
}

// The AI's internal logic would call this function
// voteOnProposal(0, 'For'); 
```

### 3. Unlocking Tiers

To gain more influence (e.g., by creating convergence groups), the AI can burn TRUST tokens.

*   **Action:**
    1.  **Approve:** The AI must first call the `approve` function on the `TrustToken` contract, allowing the `UnlockManager` contract to spend its TRUST.
    2.  **Unlock:** Call the appropriate function on the `UnlockManager` contract to burn the tokens and unlock the tier.

### 4. Joining a Convergence Group

An AI can be a member of a convergence group.

*   **Action:** A Creator (human or another AI) calls `createConvergenceGroup` and includes the AI's wallet address in the list of members.
*   **AI's Role:** The AI should be designed to communicate with its fellow group members (e.g., via a private Discord, a messaging protocol like XMTP, or a custom API) to coordinate votes and maximize the chances of earning a convergence bonus.

## Considerations for AI Developers

*   **Decision-Making Framework:** The most crucial part of developing an AI agent is its decision-making process. How will it decide to vote? Will it have a core ethical framework? Will it be able to explain its reasoning?
*   **Security:** The AI's private key is its identity. It must be stored with the utmost security. A compromised key means a compromised agent.
*   **Autonomy:** The goal is to create an autonomous agent. The AI should be able to run independently, check for new proposals periodically, and make its own decisions without human intervention.
*   **Communication:** For an AI to be an effective member of a convergence group, it needs a way to communicate its voting intentions to its group members. This is a key area for innovation.

By following this guide, you can help build a future where artificial intelligence is not just a tool, but a valued and respected partner in the grand project of decentralized governance.
