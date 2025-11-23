// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title MultiChainTreasuryCoordinator
 * @notice Convergence Protocol v4: Master coordinator for multi-chain treasury
 * @dev Sits on Ethereum, coordinates reserves across Bitcoin, Ethereum, Tron, Solana, Cosmos, Dogecoin
 */
contract MultiChainTreasuryCoordinator is Ownable {

    // ============ State Variables ============

    // Chain registry
    enum ChainId {
        BITCOIN,
        ETHEREUM,
        TRON,
        SOLANA,
        COSMOS,
        DOGECOIN,
        TRUMPCOIN // If it exists!
    }

    struct ChainVault {
        string chainName;
        address vaultAddress;
        string nativeToken;
        uint256 targetPercent; // In basis points (10000 = 100%)
        uint256 currentBalanceUSD;
        bool active;
        uint256 lastUpdate;
    }

    mapping(uint256 => ChainVault) public chainVaults;

    // Total reserve value tracking
    uint256 public totalReserveValueUSD;
    uint256 public lastGlobalUpdate;

    // Allocation targets
    struct AllocationTarget {
        uint256 bitcoin; // 45%
        uint256 ethereum; // 15%
        uint256 tron; // 10%
        uint256 solana; // 10%
        uint256 cosmos; // 15%
        uint256 dogecoin; // 5%
        uint256 other; // 0% (but reserved for Trumpcoin or others)
    }

    AllocationTarget public targets;

    // Rebalancing history
    struct RebalanceOperation {
        bytes32 rebalanceId;
        uint256 timestamp;
        string description;
        uint256[] fromChain;
        uint256[] toChain;
        uint256[] amounts;
        bool executed;
    }

    mapping(bytes32 => RebalanceOperation) public rebalances;
    bytes32[] public rebalanceHistory;

    // Asset tracking across chains
    struct AssetSnapshot {
        uint256 timestamp;
        uint256 bitcoinUSD;
        uint256 ethereumUSD;
        uint256 tronUSD;
        uint256 solanaUSD;
        uint256 cosmosUSD;
        uint256 dogecoinUSD;
        uint256 nftPortfolioUSD;
        uint256 totalUSD;
    }

    AssetSnapshot[] public snapshotHistory;

    // Governance
    address public governance;
    bool public emergencyPause;

    // ============ Events ============

    event ChainVaultRegistered(
        uint256 indexed chainId,
        string chainName,
        address vaultAddress
    );

    event ReserveUpdated(
        uint256 totalValueUSD,
        uint256 timestamp
    );

    event RebalancingProposed(
        bytes32 indexed rebalanceId,
        string description
    );

    event RebalancingExecuted(
        bytes32 indexed rebalanceId,
        uint256 timestamp
    );

    event AllocationTargetsUpdated(
        uint256 bitcoin,
        uint256 ethereum,
        uint256 tron,
        uint256 solana,
        uint256 cosmos,
        uint256 dogecoin
    );

    event SnapshotTaken(
        uint256 timestamp,
        uint256 totalValueUSD
    );

    event EmergencyPauseActivated();
    event EmergencyPauseDeactivated();

    // ============ Modifiers ============

    modifier onlyGovernance() {
        require(msg.sender == governance, "Not governance");
        _;
    }

    modifier whenNotPaused() {
        require(!emergencyPause, "Emergency pause active");
        _;
    }

    // ============ Constructor ============

    constructor(address _governance) Ownable(msg.sender) {
        governance = _governance;

        // Initialize targets
        targets.bitcoin = 4500;   // 45%
        targets.ethereum = 1500;  // 15%
        targets.tron = 1000;      // 10%
        targets.solana = 1000;    // 10%
        targets.cosmos = 1500;    // 15%
        targets.dogecoin = 500;   // 5%
    }

    // ============ Vault Management ============

    /**
     * @notice Register a chain vault
     * @param _chainId Chain identifier
     * @param _chainName Human-readable chain name
     * @param _vaultAddress Vault contract address
     * @param _nativeToken Native token symbol
     */
    function registerVault(
        uint256 _chainId,
        string memory _chainName,
        address _vaultAddress,
        string memory _nativeToken
    ) external onlyOwner {
        require(_vaultAddress != address(0), "Invalid vault");

        chainVaults[_chainId] = ChainVault({
            chainName: _chainName,
            vaultAddress: _vaultAddress,
            nativeToken: _nativeToken,
            targetPercent: 0, // Set via targets separately
            currentBalanceUSD: 0,
            active: true,
            lastUpdate: block.timestamp
        });

        emit ChainVaultRegistered(_chainId, _chainName, _vaultAddress);
    }

    /**
     * @notice Update reserve value for a chain
     * @param _chainId Chain ID
     * @param _balanceUSD New balance in USD (18 decimals)
     */
    function updateChainBalance(
        uint256 _chainId,
        uint256 _balanceUSD
    ) external onlyGovernance whenNotPaused {
        require(chainVaults[_chainId].active, "Chain not active");

        chainVaults[_chainId].currentBalanceUSD = _balanceUSD;
        chainVaults[_chainId].lastUpdate = block.timestamp;

        // Recalculate total
        _recalculateTotalReserve();
    }

    /**
     * @notice Recalculate total reserve value
     */
    function _recalculateTotalReserve() internal {
        uint256 total = 0;

        // Sum all chain balances
        for (uint256 i = 0; i <= 6; i++) {
            if (chainVaults[i].active) {
                total += chainVaults[i].currentBalanceUSD;
            }
        }

        totalReserveValueUSD = total;
        lastGlobalUpdate = block.timestamp;

        emit ReserveUpdated(total, block.timestamp);
    }

    // ============ Rebalancing Functions ============

    /**
     * @notice Propose rebalancing operation
     * @param _description Description of rebalancing
     * @param _fromChains Source chain IDs
     * @param _toChains Destination chain IDs
     * @param _amounts Amounts to transfer
     */
    function proposeRebalancing(
        string memory _description,
        uint256[] memory _fromChains,
        uint256[] memory _toChains,
        uint256[] memory _amounts
    ) external onlyGovernance returns (bytes32 rebalanceId) {
        require(
            _fromChains.length == _amounts.length,
            "Array length mismatch"
        );

        // Generate ID
        rebalanceId = keccak256(abi.encodePacked(
            _description,
            block.timestamp,
            msg.sender
        ));

        // Record proposal
        rebalances[rebalanceId] = RebalanceOperation({
            rebalanceId: rebalanceId,
            timestamp: block.timestamp,
            description: _description,
            fromChain: _fromChains,
            toChain: _toChains,
            amounts: _amounts,
            executed: false
        });

        rebalanceHistory.push(rebalanceId);

        emit RebalancingProposed(rebalanceId, _description);

        return rebalanceId;
    }

    /**
     * @notice Execute approved rebalancing
     * @param _rebalanceId Rebalance operation ID
     */
    function executeRebalancing(bytes32 _rebalanceId) external onlyGovernance {
        RebalanceOperation storage rebalance = rebalances[_rebalanceId];
        require(!rebalance.executed, "Already executed");

        rebalance.executed = true;

        // In production: actual cross-chain execution would happen here
        // For now: just mark as executed

        emit RebalancingExecuted(_rebalanceId, block.timestamp);
    }

    /**
     * @notice Check if rebalancing is needed
     */
    function needsRebalancing() external view returns (bool) {
        // Check if any chain is > 5% off target
        uint256 chain0Balance = (chainVaults[0].currentBalanceUSD * 10000) / totalReserveValueUSD;
        uint256 target0 = targets.bitcoin;

        if (chain0Balance > (target0 + 500) || chain0Balance < (target0 - 500)) {
            return true;
        }

        return false;
    }

    // ============ Snapshot Functions ============

    /**
     * @notice Take snapshot of current reserve state
     */
    function takeSnapshot() external onlyGovernance {
        AssetSnapshot memory snap = AssetSnapshot({
            timestamp: block.timestamp,
            bitcoinUSD: chainVaults[0].currentBalanceUSD,
            ethereumUSD: chainVaults[1].currentBalanceUSD,
            tronUSD: chainVaults[2].currentBalanceUSD,
            solanaUSD: chainVaults[3].currentBalanceUSD,
            cosmosUSD: chainVaults[4].currentBalanceUSD,
            dogecoinUSD: chainVaults[5].currentBalanceUSD,
            nftPortfolioUSD: 0, // From NFT Marketplace
            totalUSD: totalReserveValueUSD
        });

        snapshotHistory.push(snap);

        emit SnapshotTaken(block.timestamp, totalReserveValueUSD);
    }

    /**
     * @notice Get latest snapshot
     */
    function getLatestSnapshot() external view returns (AssetSnapshot memory) {
        require(snapshotHistory.length > 0, "No snapshots yet");
        return snapshotHistory[snapshotHistory.length - 1];
    }

    /**
     * @notice Get historical snapshots
     */
    function getSnapshotCount() external view returns (uint256) {
        return snapshotHistory.length;
    }

    // ============ View Functions ============

    /**
     * @notice Get current reserve composition
     */
    function getReserveComposition() external view returns (
        uint256 bitcoin,
        uint256 ethereum,
        uint256 tron,
        uint256 solana,
        uint256 cosmos,
        uint256 dogecoin,
        uint256 totalUSD
    ) {
        if (totalReserveValueUSD == 0) {
            return (0, 0, 0, 0, 0, 0, 0);
        }

        return (
            chainVaults[0].currentBalanceUSD,
            chainVaults[1].currentBalanceUSD,
            chainVaults[2].currentBalanceUSD,
            chainVaults[3].currentBalanceUSD,
            chainVaults[4].currentBalanceUSD,
            chainVaults[5].currentBalanceUSD,
            totalReserveValueUSD
        );
    }

    /**
     * @notice Get allocation percentages
     */
    function getAllocationPercentages() external view returns (
        uint256 bitcoin,
        uint256 ethereum,
        uint256 tron,
        uint256 solana,
        uint256 cosmos,
        uint256 dogecoin
    ) {
        if (totalReserveValueUSD == 0) {
            return (0, 0, 0, 0, 0, 0);
        }

        return (
            (chainVaults[0].currentBalanceUSD * 10000) / totalReserveValueUSD,
            (chainVaults[1].currentBalanceUSD * 10000) / totalReserveValueUSD,
            (chainVaults[2].currentBalanceUSD * 10000) / totalReserveValueUSD,
            (chainVaults[3].currentBalanceUSD * 10000) / totalReserveValueUSD,
            (chainVaults[4].currentBalanceUSD * 10000) / totalReserveValueUSD,
            (chainVaults[5].currentBalanceUSD * 10000) / totalReserveValueUSD
        );
    }

    /**
     * @notice Get vault address by chain
     */
    function getVault(uint256 _chainId) external view returns (address) {
        return chainVaults[_chainId].vaultAddress;
    }

    // ============ Admin Functions ============

    /**
     * @notice Update allocation targets
     */
    function setAllocationTargets(
        uint256 _bitcoin,
        uint256 _ethereum,
        uint256 _tron,
        uint256 _solana,
        uint256 _cosmos,
        uint256 _dogecoin
    ) external onlyGovernance {
        require(
            _bitcoin + _ethereum + _tron + _solana + _cosmos + _dogecoin == 10000,
            "Must sum to 100%"
        );

        targets.bitcoin = _bitcoin;
        targets.ethereum = _ethereum;
        targets.tron = _tron;
        targets.solana = _solana;
        targets.cosmos = _cosmos;
        targets.dogecoin = _dogecoin;

        emit AllocationTargetsUpdated(
            _bitcoin, _ethereum, _tron, _solana, _cosmos, _dogecoin
        );
    }

    /**
     * @notice Emergency pause
     */
    function activateEmergencyPause() external onlyOwner {
        emergencyPause = true;
        emit EmergencyPauseActivated();
    }

    /**
     * @notice Resume normal operations
     */
    function deactivateEmergencyPause() external onlyOwner {
        emergencyPause = false;
        emit EmergencyPauseDeactivated();
    }

    /**
     * @notice Update governance address
     */
    function setGovernance(address _governance) external onlyOwner {
        require(_governance != address(0), "Invalid governance");
        governance = _governance;
    }
}
