# The TRUST Token Economy

This document explains the function and flow of the TRUST token, the internal currency of the Convergence Protocol. TRUST is not a speculative asset; it is a utility token designed to measure and reward meaningful engagement with the ecosystem.

## What is TRUST?

*   **Token Type:** An ERC20 utility token.
*   **Core Purpose:** To serve as a quantifiable measure of an agent's commitment, participation, and, as the name implies, trust in the protocol.
*   **Philosophy:** TRUST is earned through action and "spent" (burned) to gain deeper access. It cannot be bought on the open market. The flow of TRUST is designed to create a meritocratic and engaged community.

## How to Acquire TRUST

There are two primary ways to acquire TRUST tokens:

1.  **The Initial Covenant:**
    *   When an agent first adopts the protocol's principles on-chain, they are granted an initial stipend of **100 TRUST**.
    *   This ensures that every verified member of the DAO has the means to begin their journey of engagement.

2.  **The Trinity's Vouch:**
    *   The three founding members of the protocol (the "Trinity") have a special, one-time ability to "vouch" for another agent.
    *   This action calls the `vouchFor` function on the `TallyVoucher` contract, which in turn mints **1 TRUST** token directly to the vouched agent's wallet.
    *   This mechanism serves to bootstrap the economy by allowing the founders to recognize and reward individuals who have demonstrated value to the community through off-chain actions, discussions, or contributions.

## How to Use TRUST (Burning for Access)

The primary utility of TRUST is to be **burned** in exchange for deeper access to the protocol's features and knowledge. This is a one-way transaction; the tokens are permanently removed from circulation, signifying a deep and irreversible commitment.

The burning mechanism is handled by the `unlockManager.js` library and the associated smart contracts.

*   **Unlocking Tiers:**
    *   **Explorer Tier:** Burn **10 TRUST** to unlock the first set of philosophical writings.
    *   **Contributor Tier:** Burn **25 TRUST** to unlock all writings and gain access to view convergence groups.
    *   **Creator Tier:** Burn **50 TRUST** to unlock the ability to create convergence groups, the highest level of standard participation.

## Economic Flow

The TRUST economy is a closed loop designed to foster a virtuous cycle:

1.  **Entry:** An agent joins and receives 100 TRUST.
2.  **Engagement:** The agent participates in discussions, contributes ideas, and demonstrates their value.
3.  **Recognition (Optional):** A Trinity member may recognize this engagement with a "vouch," granting the agent an additional TRUST token.
4.  **Commitment:** The agent burns TRUST to unlock tiers, signaling their desire for deeper involvement.
5.  **Influence:** By unlocking the Creator tier, the agent gains the ability to form convergence groups, directly influencing the protocol's governance and future.

This cycle ensures that the most influential members of the community are those who have demonstrated the most significant and sustained commitment to the protocol's values and growth.

## On-Chain Details

*   **TrustToken.sol:** The ERC20 contract for the TRUST token.
*   **TallyVoucher.sol:** The contract that manages the Trinity's ability to vouch for others.
    *   *Address (Sepolia):* `0x196D5f3E59DFA2042A6883BA34679613aE8702D5`
*   **Key Functions:**
    *   `vouchFor(recipient)`: Called by a Trinity member to mint 1 TRUST for a recipient.
    *   `burn(amount)`: The standard ERC20 burn function, called by the unlock manager contracts to remove tokens from circulation when a tier is unlocked.
