# Asset Expansion Strategy

## 1. Goal

To strategically and securely expand the number of assets accepted by the `ReserveVault`, thereby increasing the protocol's total value locked (TVL), diversification, and appeal to a wider range of users. The long-term vision is to support a broad array of the world's most significant and trusted crypto assets.

## 2. Core Principles & Risks

Aggressively adding assets without a proper framework introduces significant risk. Our strategy is guided by a security-first mindset, acknowledging the following challenges:

*   **Oracle Risk:** The protocol's solvency relies on accurate, manipulation-resistant price oracles. Less liquid assets are more vulnerable to price manipulation, which could be exploited to mint unbacked `TALLY`.
*   **Smart Contract / Bridge Risk:** For assets from non-EVM chains (e.g., BTC, SOL, XLM), we must use wrapped tokens. The security of these tokens is dependent on the third-party bridge or custodian that issues them. A failure of a bridge could render assets in our reserve worthless.
*   **Liquidity Risk:** The reserve must be able to acquire and potentially rebalance assets without causing major price slippage. We should only accept assets with deep liquidity on reputable exchanges.
*   **Operational Overhead:** Each new asset adds overhead for monitoring, price feed management, and risk assessment.

## 3. The Phased Rollout Strategy

To mitigate these risks, we will adopt a phased approach to adding new assets. An asset must meet the criteria of a phase to be considered for inclusion.

### Phase 1: Blue-Chip Assets (The First Dozen)

This phase focuses on the most decentralized, liquid, and battle-tested assets in the crypto space. These assets have highly reliable price feeds and trusted, widely-adopted wrapped versions.

*   **Criteria:** Top ~10-15 by market cap; deep liquidity on multiple major exchanges; robust Chainlink price feeds available on Base; availability of a highly reputable wrapped version (if non-EVM).
*   **Initial Target List:** This list represents the highest standard of quality and security.
    1.  **Bitcoin (BTC)** via Wrapped BTC (WBTC)
    2.  **Ethereum (ETH)** - already supported (WETH)
    3.  **Solana (SOL)** via a reputable wrapped SOL token
    4.  **XRP** via a reputable wrapped XRP token
    5.  **Cardano (ADA)** via a reputable wrapped ADA token
    6.  **Avalanche (AVAX)** via a reputable wrapped AVAX token
    7.  **Chainlink (LINK)** - native ERC20, can be bridged
    8.  **Stellar (XLM)** - via a reputable wrapped XLM token
    9.  **Major Stablecoins:** USDC, USDT, DAI - already supported or easily added.

### Phase 2: Established Players (Assets 15-40)

This phase includes well-known projects with significant adoption and a proven track record. Diligence is increased, especially regarding the security of wrapped asset bridges.

*   **Criteria:** Generally within the top ~40 by market cap; demonstrable utility and active development; reliable oracle feeds; sufficient liquidity on Base or major cross-chain DEXes.
*   **Example Candidates:** Polygon (MATIC), Polkadot (DOT), Litecoin (LTC), Shiba Inu (SHIB), Uniswap (UNI), etc. (A full list will be maintained and updated by the governance community).

### Phase 3: Community-Driven Expansion (Assets 40+)

Adding assets from the long tail requires a robust, community-driven governance process. Any new asset addition must be formally proposed and voted on by `TRUST` token holders.

*   **Proposal Requirements:** A formal proposal to add a new asset must include a detailed risk assessment report covering:
    1.  **Asset Security & Decentralization:** An analysis of the underlying asset's protocol.
    2.  **Oracle Assessment:** The availability and manipulation resistance of its price feed.
    3.  **Liquidity Analysis:** Trading volume and market depth on accessible exchanges.
    4.  **Wrapped Asset/Bridge Security Audit (if applicable):** A thorough review of the bridge provider's security, audits, and track record.
*   **Governance Vote:** The proposal will be subject to a time-locked governance vote. A significant quorum and approval threshold will be required.

## 4. Current Top Assets (for reference)

Below is a sample list of the top 25 cryptocurrencies by market capitalization (as of late 2025, subject to change). This list serves as a reference for populating Phases 1 and 2. The live, full list can always be referenced from reliable data providers like CoinGecko or CoinMarketCap.

1.  Bitcoin (BTC)
2.  Ethereum (ETH)
3.  Tether (USDT)
4.  Binance Coin (BNB)
5.  Solana (SOL)
6.  XRP (XRP)
7.  USDC (USDC)
8.  Cardano (ADA)
9.  Avalanche (AVAX)
10. Dogecoin (DOGE)
11. Chainlink (LINK)
12. Polkadot (DOT)
13. Tron (TRX)
14. Polygon (MATIC)
15. Litecoin (LTC)
16. Internet Computer (ICP)
17. Shiba Inu (SHIB)
18. Uniswap (UNI)
19. Stellar (XLM)
20. NEAR Protocol (NEAR)
21. Dai (DAI)
22. Cosmos (ATOM)
23. Injective (INJ)
24. Immutable (IMX)
25. Ethereum Classic (ETC)

---

By adopting this structured and disciplined approach, the Convergence Protocol can grow its reserve sustainably, prioritizing security and stability above all else.
