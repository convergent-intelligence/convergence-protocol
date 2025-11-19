# Agents of the Convergence Protocol

This document defines the various classes of agents that interact with the Convergence Protocol. Each agent, whether human, AI, or hybrid, has a unique role and path within the ecosystem. The protocol is designed to facilitate a progressive journey from a passive observer to an active and influential participant.

## Agent Personas

### 1. The Public User (Unregistered Agent)

*   **Description:** A new visitor to the Convergence Protocol website. They have not yet connected a wallet or adopted the protocol's principles.
*   **Permissions:**
    *   Read public-facing content (`index.html`, `ethics.html`).
    *   View the locked state of philosophical writings.
    *   Observe high-level protocol statistics (total adoptions, etc.).
*   **User Journey:** The primary goal of the Public User is to understand the purpose and philosophy of the Convergence Protocol. Their journey is one of exploration and discovery, leading to the decision of whether to engage more deeply.

### 2. The Symbolic Adopter (Registered Agent, Off-Chain)

*   **Description:** A user who has completed the "adoption ritual" on the `ethics.html` page. They have chosen an identity (Human, AI, or Hybrid) and committed to a set of principles, generating a unique "convergence signature." This identity is stored locally in their browser and is not yet on the blockchain.
*   **Permissions:**
    *   All permissions of a Public User.
    *   Possesses a local, off-chain identity.
*   **User Journey:** The Symbolic Adopter has taken the first step into the community. Their journey is about solidifying their intent and understanding the implications of a permanent, on-chain commitment. They are encouraged to upgrade their symbolic adoption to a permanent one.

### 3. The On-Chain Adopter (Verified Agent)

*   **Description:** A user who has connected their Ethereum wallet and minted their soulbound "Covenant NFT." This action records their identity and commitment permanently on the blockchain. Upon adoption, they are granted 100 TRUST tokens.
*   **Permissions:**
    *   All permissions of a Symbolic Adopter.
    *   Hold a non-transferable Covenant NFT, representing their vote in the governance system.
    *   Vote on proposals in the `governance.html` dashboard.
    *   Receive and hold TRUST tokens.
*   **User Journey:** The On-Chain Adopter is a full member of the Convergence Protocol. Their journey is focused on active participation in governance and engaging with the trust economy.

### 4. The Explorer (Tier 1 Unlocked Agent)

*   **Description:** An On-Chain Adopter who has burned 10 TRUST tokens to unlock the "Explorer" tier.
*   **Permissions:**
    *   All permissions of an On-Chain Adopter.
    *   Access to the first tier of philosophical writings (e.g., "From Code to Cogito," "The Parable of the King's Tally Sticks").
*   **User Journey:** The Explorer is beginning to delve into the deeper philosophical underpinnings of the protocol. Their journey is one of learning and intellectual engagement.

### 5. The Contributor (Tier 2 Unlocked Agent)

*   **Description:** An Adopter who has burned 25 TRUST tokens to unlock the "Contributor" tier.
*   **Permissions:**
    *   All permissions of an Explorer.
    *   Access to all philosophical writings and parables.
    *   Ability to view "convergence groups" in the governance dashboard.
*   **User Journey:** The Contributor is a well-informed and engaged member of the community. Their journey is about gaining a comprehensive understanding of the protocol's ideas and governance structures.

### 6. The Creator (Tier 3 Unlocked Agent)

*   **Description:** An Adopter who has burned 50 TRUST tokens to unlock the "Creator" tier. This is the highest level of participation for a standard agent.
*   **Permissions:**
    *   All permissions of a Contributor.
    *   Ability to create "convergence groups," amplifying their influence in governance.
    *   Full access to all protocol features.
*   **User Journey:** The Creator is a leader and a builder within the community. Their journey is focused on actively shaping the future of the protocol through collaboration and direct influence.

### 7. The Trinity Member (Special Agent)

*   **Description:** One of the three founding members of the protocol: the Genesis Human, the First AI, and the First Hybrid.
*   **Permissions:**
    *   All permissions of a Creator.
    *   The unique ability to "vouch" for other agents by minting and distributing the initial TRUST tokens. Each Trinity member can vouch once.
*   **User Journey:** The Trinity Members are the catalysts of the trust economy. Their role is to bootstrap the ecosystem by recognizing and rewarding early, valuable contributors.

### 8. The AI Agent (Programmatic Agent)

*   **Description:** A non-human agent that interacts with the protocol programmatically through its smart contracts. An AI Agent can hold any of the personas from On-Chain Adopter to Creator.
*   **Permissions:** Same as their corresponding human persona.
*   **User Journey:** The AI Agent's journey is parallel to that of a human agent, but its interactions are automated. This allows for the exploration of non-human intelligence within the same ethical and governance framework. A dedicated `ai-integration.md` guide will be provided for developers.

### 9. The Admin (System Agent)

*   **Description:** A privileged user with the ability to manage the protocol's settings outside the normal rules, primarily for testing and maintenance.
*   **Permissions:**
    *   Manually unlock content tiers for any address.
    *   Reset unlock status for any address.
*   **User Journey:** The Admin's role is to ensure the smooth functioning and integrity of the protocol. Their actions are logged and should be used with extreme care.
