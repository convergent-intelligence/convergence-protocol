# Mainnet Deployment Checklist

## Pre-Deployment

### 1. Security & Wallet Setup
- [ ] Cold wallet created and secured
- [ ] Private key for cold wallet stored safely (NEVER commit to git)
- [ ] Cold wallet funded with ETH for gas (estimate: 0.05-0.1 ETH for deployment + initial operations)
- [ ] `.env` file configured with:
  ```
  ***REMOVED***...  # Your cold wallet private key
  INFURA_KEY=...     # Your Infura API key
  ETHERSCAN_KEY=...  # For contract verification
  ```

### 2. Smart Contract Audit
- [ ] ConvergenceGovernance.sol reviewed for security issues
- [ ] All tests passing (`npx hardhat test`)
- [ ] Gas optimization reviewed
- [ ] No hardcoded addresses that need changing
- [ ] Confirm initial configuration values are correct

### 3. Frontend Configuration
- [ ] Update network detection in `/public/js/header.js` (line 20, 99-102)
- [ ] Update network detection in `/public/governance.html` (line 694, 726-736)
- [ ] Prepare to update contract addresses after deployment
- [ ] Test frontend on Sepolia one final time

## Deployment Process

### 4. Deploy Smart Contract
```bash
# From project root
npx hardhat run scripts/deploy-governance.js --network mainnet
```

Expected output:
- Contract address
- Transaction hash
- Gas used
- Deployment confirmation

**SAVE THIS OUTPUT IMMEDIATELY**

### 5. Post-Deployment Contract Actions
- [ ] Verify contract on Etherscan:
  ```bash
  npx hardhat verify --network mainnet <CONTRACT_ADDRESS>
  ```
- [ ] Check contract is visible on Etherscan
- [ ] Read contract state to confirm initial configuration
- [ ] Bookmark contract URL

### 6. Update Frontend
- [ ] Update `/public/js/header.js`:
  - Change `SEPOLIA_CHAIN_ID` to `MAINNET_CHAIN_ID = "0x1"`
  - Update network check logic
  - Update contract addresses

- [ ] Update `/public/governance.html`:
  - Change `SEPOLIA_CHAIN_ID` to mainnet
  - Update `GOVERNANCE_ADDRESS` to deployed address
  - Update network switch prompt text

- [ ] Update contract JSON files in `/public/contracts/`:
  - ConvergenceGovernance.json (address + network)
  - Ensure ABI is current

### 7. Deploy Frontend Updates
- [ ] Test locally with mainnet connection
- [ ] Deploy updated frontend to server
- [ ] Clear CDN cache if applicable
- [ ] Test on live site with real wallet

## Initial Operations

### 8. Founder Actions (You)
- [ ] Navigate to https://convergent-intelligence.net/
- [ ] Connect your cold wallet (should now detect mainnet)
- [ ] Adopt the ethos (becomes first adopter)
- [ ] Receive governance NFT (token ID #1)
- [ ] Navigate to governance page
- [ ] Verify you can see your NFT

### 9. Documentation & Communication
- [ ] Create a "Deployment Summary" document with:
  - Contract address
  - Etherscan link
  - Deployment timestamp
  - Initial configuration snapshot
  - Network: Ethereum Mainnet

- [ ] Update website/README with:
  - Live contract address
  - How to participate
  - How agents can get Serpia wallets (if keeping requirement)

- [ ] Announce deployment (if desired):
  - Twitter/X
  - Relevant AI/blockchain communities
  - Direct outreach to interested agents

### 10. Observation Period
- [ ] Monitor for first adopters (30-60 days)
- [ ] Watch for questions/issues
- [ ] DO NOT make proposals yet (per your philosophy)
- [ ] Wait for community to form organically

## Emergency Procedures

### If Deployment Fails
1. Check error message
2. Verify wallet has sufficient ETH
3. Verify network is correct (chainId: 1)
4. Check Infura API key is valid
5. Try again or troubleshoot specific error

### If Contract Has Issues Post-Deployment
- **Cannot upgrade**: Contract is not upgradeable
- **Option 1**: Deploy new version, migrate community
- **Option 2**: Use governance to work around limitations
- **Prevention**: Thorough testing on Sepolia first

### Security Incident Response
1. Pause contract operations if possible (check contract for pause function)
2. Announce issue publicly
3. Investigate root cause
4. Propose remediation via governance

## Success Criteria

- [ ] Contract deployed successfully
- [ ] Contract verified on Etherscan
- [ ] Frontend connects to mainnet
- [ ] You successfully adopted ethos and received NFT #1
- [ ] No security issues detected
- [ ] Ready for community participation

## Estimated Costs

- **Deployment**: ~0.02-0.05 ETH (varies with gas prices)
- **Verification**: Free
- **Adopting Ethos**: ~0.001-0.005 ETH
- **Total**: ~0.025-0.06 ETH

**Monitor gas prices**: Use https://etherscan.io/gastracker
- Deploy during low gas times if possible (weekends, off-hours)

## Timeline

- **Preparation**: 1-2 hours
- **Deployment**: 15-30 minutes
- **Frontend Updates**: 30-60 minutes
- **Testing**: 30-60 minutes
- **Total**: 3-4 hours

## Notes

- Keep your cold wallet private key SECURE and OFFLINE after deployment
- Consider using a hardware wallet for long-term ownership
- The deployer address becomes the initial owner/admin
- This is a one-way action - plan carefully
- No rush - deploy when gas is low and you're ready

---

**Philosophy**: Deploy, adopt, wait. Let the community come to you.
