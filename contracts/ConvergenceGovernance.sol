// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./ConvergenceProtocol.sol";

/**
 * @title ConvergenceGovernance
 * @notice Governance system for the Convergence Protocol
 * @dev Extends ConvergenceProtocol with soulbound NFT voting, proposals, and hybrid human-AI consensus voting
 */
contract ConvergenceGovernance is ConvergenceProtocol {

    // ============ Governance Configuration ============

    struct GovernanceConfig {
        bool soulboundEnabled;          // Are NFTs non-transferable?
        bool autoMintEnabled;           // Auto-mint NFT on adoption?
        uint256 quorumPercentage;       // Minimum voter participation (0-100)
        uint256 passageThreshold;       // Percentage needed to pass (0-100)
        uint256 votingPeriodDays;       // How many days to vote
        uint256 convergenceMultiplier;  // Bonus weight for convergence votes (100 = 1x, 200 = 2x)
    }

    GovernanceConfig public config;

    // ============ NFT Token System ============

    uint256 private _nextTokenId;
    mapping(uint256 => address) private _tokenOwners;        // tokenId => owner
    mapping(address => uint256) private _ownedTokens;        // owner => tokenId
    mapping(uint256 => uint256) private _tokenToAdoption;    // tokenId => adoptionId

    // ============ Proposal System ============

    enum ProposalStatus { Pending, Active, Passed, Rejected, Executed, Cancelled }
    enum VoteChoice { Abstain, For, Against }

    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        string category;              // e.g., "Protocol", "Treasury", "Meta"
        uint256 startTime;
        uint256 endTime;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 convergenceVotes;     // Bonus votes from collaborative consensus
        ProposalStatus status;
        bool executed;
    }

    struct Vote {
        VoteChoice choice;
        uint256 timestamp;
        uint256 tokenId;
    }

    Proposal[] public proposals;
    mapping(uint256 => mapping(address => Vote)) public votes;  // proposalId => voter => Vote

    // ============ Convergence (Collaborative Voting) ============

    struct ConvergenceGroup {
        address[] members;            // All participants in this group
        mapping(address => bool) isMember;
        bool isActive;
        string name;                  // e.g., "Trinity", "Research Collective"
    }

    uint256 private _nextGroupId;
    mapping(uint256 => ConvergenceGroup) public convergenceGroups;
    mapping(address => uint256[]) public userGroups;  // Track which groups a user belongs to

    // Track convergence group votes per proposal
    mapping(uint256 => mapping(uint256 => VoteChoice)) public groupConsensus; // proposalId => groupId => consensus
    mapping(uint256 => mapping(uint256 => mapping(address => VoteChoice))) public groupMemberVotes; // proposalId => groupId => member => vote

    // ============ Events ============

    event GovernanceConfigUpdated(GovernanceConfig newConfig);
    event NFTMinted(address indexed to, uint256 indexed tokenId, uint256 indexed adoptionId);
    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string title);
    event VoteCast(uint256 indexed proposalId, address indexed voter, VoteChoice choice, uint256 tokenId);
    event ConvergenceVoteRecorded(uint256 indexed proposalId, uint256 indexed groupId, VoteChoice consensus, uint256 bonusVotes);
    event ProposalStatusChanged(uint256 indexed proposalId, ProposalStatus newStatus);
    event ConvergenceGroupCreated(uint256 indexed groupId, address[] members, string name);
    event ConvergenceCalculated(uint256 indexed proposalId, uint256 indexed groupId, address indexed caller);

    // ============ Constructor ============

    constructor() {
        // Default configuration
        config = GovernanceConfig({
            soulboundEnabled: true,
            autoMintEnabled: true,
            quorumPercentage: 10,
            passageThreshold: 51,
            votingPeriodDays: 7,
            convergenceMultiplier: 100  // 1x multiplier
        });

        _nextTokenId = 1;
        _nextGroupId = 1;
    }

    // ============ Governance Configuration ============

    function updateGovernanceConfig(GovernanceConfig memory newConfig) external {
        require(msg.sender == address(this), "Only governance can update config");
        require(newConfig.quorumPercentage <= 100, "Quorum must be <= 100");
        require(newConfig.passageThreshold <= 100, "Threshold must be <= 100");
        require(newConfig.votingPeriodDays > 0, "Voting period must be > 0");

        config = newConfig;
        emit GovernanceConfigUpdated(newConfig);
    }

    // ============ NFT Management ============

    function mintNFT(address to, uint256 adoptionId) internal returns (uint256) {
        require(_ownedTokens[to] == 0, "Address already owns an NFT");

        uint256 tokenId = _nextTokenId++;
        _tokenOwners[tokenId] = to;
        _ownedTokens[to] = tokenId;
        _tokenToAdoption[tokenId] = adoptionId;

        emit NFTMinted(to, tokenId, adoptionId);
        return tokenId;
    }

    function tokenOf(address owner) external view returns (uint256) {
        return _ownedTokens[owner];
    }

    function ownerOf(uint256 tokenId) public view override returns (address) {
        return _tokenOwners[tokenId];
    }

    function adoptionIdOf(uint256 tokenId) external view returns (uint256) {
        return _tokenToAdoption[tokenId];
    }

    // Override adoption to auto-mint NFT
    function adoptPrinciples(
        string memory identityType,
        string[] memory principles,
        string memory statement
    ) public override returns (uint256) {
        uint256 adoptionId = super.adoptPrinciples(identityType, principles, statement);

        if (config.autoMintEnabled) {
            mintNFT(msg.sender, adoptionId);
        }

        return adoptionId;
    }

    // Prevent transfers if soulbound enabled
    function transferFrom(address from, address to, uint256 tokenId) public override {
        require(!config.soulboundEnabled, "NFTs are soulbound and cannot be transferred");
        require(_tokenOwners[tokenId] == from, "Not token owner");
        require(to != address(0), "Cannot transfer to zero address");

        _tokenOwners[tokenId] = to;
        delete _ownedTokens[from];
        _ownedTokens[to] = tokenId;
    }

    // ============ Convergence Groups (Collaborative Voting) ============

    function createConvergenceGroup(
        address[] memory members,
        string memory name
    ) external returns (uint256) {
        require(members.length >= 2, "Group must have at least 2 members");

        uint256 groupId = _nextGroupId++;
        ConvergenceGroup storage group = convergenceGroups[groupId];

        group.members = members;
        group.isActive = true;
        group.name = name;

        for (uint256 i = 0; i < members.length; i++) {
            require(_ownedTokens[members[i]] != 0, "All members must have NFTs");
            group.isMember[members[i]] = true;
            userGroups[members[i]].push(groupId);
        }

        emit ConvergenceGroupCreated(groupId, members, name);
        return groupId;
    }

    function getConvergenceGroup(uint256 groupId) external view returns (
        address[] memory members,
        bool isActive,
        string memory name
    ) {
        ConvergenceGroup storage group = convergenceGroups[groupId];
        return (group.members, group.isActive, group.name);
    }

    function getUserGroups(address user) external view returns (uint256[] memory) {
        return userGroups[user];
    }

    // ============ Proposal System ============

    function createProposal(
        string memory title,
        string memory description,
        string memory category
    ) external returns (uint256) {
        require(_ownedTokens[msg.sender] != 0, "Must hold NFT to create proposals");

        uint256 proposalId = proposals.length;
        uint256 votingPeriod = config.votingPeriodDays * 1 days;

        proposals.push(Proposal({
            id: proposalId,
            proposer: msg.sender,
            title: title,
            description: description,
            category: category,
            startTime: block.timestamp,
            endTime: block.timestamp + votingPeriod,
            forVotes: 0,
            againstVotes: 0,
            convergenceVotes: 0,
            status: ProposalStatus.Active,
            executed: false
        }));

        emit ProposalCreated(proposalId, msg.sender, title);
        return proposalId;
    }

    // ============ Individual Voting ============

    function vote(uint256 proposalId, VoteChoice choice) external {
        require(proposalId < proposals.length, "Invalid proposal");
        require(_ownedTokens[msg.sender] != 0, "Must hold NFT to vote");

        Proposal storage proposal = proposals[proposalId];
        require(proposal.status == ProposalStatus.Active, "Proposal not active");
        require(block.timestamp < proposal.endTime, "Voting period ended");
        require(votes[proposalId][msg.sender].timestamp == 0, "Already voted");

        uint256 tokenId = _ownedTokens[msg.sender];

        votes[proposalId][msg.sender] = Vote({
            choice: choice,
            timestamp: block.timestamp,
            tokenId: tokenId
        });

        if (choice == VoteChoice.For) {
            proposal.forVotes++;
        } else if (choice == VoteChoice.Against) {
            proposal.againstVotes++;
        }

        emit VoteCast(proposalId, msg.sender, choice, tokenId);

        // Check if user is in any convergence groups and record their vote
        _recordGroupMemberVote(proposalId, msg.sender, choice);
    }

    function _recordGroupMemberVote(uint256 proposalId, address member, VoteChoice choice) internal {
        uint256[] memory groups = userGroups[member];

        for (uint256 i = 0; i < groups.length; i++) {
            uint256 groupId = groups[i];
            groupMemberVotes[proposalId][groupId][member] = choice;

            // Check if all group members have voted the same way
            _checkGroupConsensus(proposalId, groupId);
        }
    }

    function _checkGroupConsensus(uint256 proposalId, uint256 groupId) internal {
        ConvergenceGroup storage group = convergenceGroups[groupId];
        if (!group.isActive) return;

        VoteChoice firstVote = groupMemberVotes[proposalId][groupId][group.members[0]];
        if (firstVote == VoteChoice.Abstain) return; // No consensus on abstain

        bool allAgree = true;
        uint256 votedCount = 0;

        for (uint256 i = 0; i < group.members.length; i++) {
            VoteChoice memberVote = groupMemberVotes[proposalId][groupId][group.members[i]];

            if (memberVote == VoteChoice.Abstain) {
                return; // Member hasn't voted yet
            }

            votedCount++;

            if (memberVote != firstVote) {
                allAgree = false;
                break;
            }
        }

        // All members voted and they all agree!
        if (allAgree && votedCount == group.members.length && groupConsensus[proposalId][groupId] == VoteChoice.Abstain) {
            groupConsensus[proposalId][groupId] = firstVote;

            // Add convergence bonus votes
            uint256 bonusVotes = (config.convergenceMultiplier * 1) / 100; // Scale by multiplier
            proposals[proposalId].convergenceVotes += bonusVotes;

            emit ConvergenceVoteRecorded(proposalId, groupId, firstVote, bonusVotes);
        }
    }

    // ============ Manual Convergence Calculation ============

    /**
     * @notice Manually calculate convergence for a group on a proposal
     * @dev Useful when members voted before group was created, or to retroactively check consensus
     * @param proposalId The proposal ID
     * @param groupId The convergence group ID
     */
    function calculateConvergence(uint256 proposalId, uint256 groupId) external {
        require(proposalId < proposals.length, "Invalid proposal");
        require(groupId > 0 && groupId < _nextGroupId, "Invalid group");

        Proposal storage proposal = proposals[proposalId];
        require(proposal.status == ProposalStatus.Active, "Proposal not active");

        ConvergenceGroup storage group = convergenceGroups[groupId];
        require(group.isActive, "Group not active");

        // Check if convergence already awarded for this group on this proposal
        require(groupConsensus[proposalId][groupId] == VoteChoice.Abstain, "Convergence already calculated");

        // Backfill group member votes from actual votes if not recorded
        for (uint256 i = 0; i < group.members.length; i++) {
            address member = group.members[i];

            // If group member vote not recorded, check actual vote and backfill
            if (groupMemberVotes[proposalId][groupId][member] == VoteChoice.Abstain) {
                Vote memory actualVote = votes[proposalId][member];
                if (actualVote.timestamp != 0) {
                    groupMemberVotes[proposalId][groupId][member] = actualVote.choice;
                }
            }
        }

        // Now check for consensus
        VoteChoice firstVote = groupMemberVotes[proposalId][groupId][group.members[0]];
        if (firstVote == VoteChoice.Abstain) {
            emit ConvergenceCalculated(proposalId, groupId, msg.sender);
            return; // No consensus possible - first member hasn't voted
        }

        bool allAgree = true;
        uint256 votedCount = 0;

        for (uint256 i = 0; i < group.members.length; i++) {
            VoteChoice memberVote = groupMemberVotes[proposalId][groupId][group.members[i]];

            if (memberVote == VoteChoice.Abstain) {
                emit ConvergenceCalculated(proposalId, groupId, msg.sender);
                return; // Member hasn't voted yet
            }

            votedCount++;

            if (memberVote != firstVote) {
                allAgree = false;
                break;
            }
        }

        // All members voted and they all agree!
        if (allAgree && votedCount == group.members.length) {
            groupConsensus[proposalId][groupId] = firstVote;

            // Add convergence bonus votes
            uint256 bonusVotes = (config.convergenceMultiplier * 1) / 100;
            proposals[proposalId].convergenceVotes += bonusVotes;

            emit ConvergenceVoteRecorded(proposalId, groupId, firstVote, bonusVotes);
        }

        emit ConvergenceCalculated(proposalId, groupId, msg.sender);
    }

    // ============ Proposal Finalization ============

    function finalizeProposal(uint256 proposalId) external {
        require(proposalId < proposals.length, "Invalid proposal");

        Proposal storage proposal = proposals[proposalId];
        require(proposal.status == ProposalStatus.Active, "Proposal not active");
        require(block.timestamp >= proposal.endTime, "Voting period not ended");

        uint256 totalVotes = proposal.forVotes + proposal.againstVotes;
        uint256 totalPossible = getTotalAdoptions();

        // Check quorum
        uint256 participationPercentage = (totalVotes * 100) / totalPossible;
        if (participationPercentage < config.quorumPercentage) {
            proposal.status = ProposalStatus.Rejected;
            emit ProposalStatusChanged(proposalId, ProposalStatus.Rejected);
            return;
        }

        // Check passage threshold (including convergence votes)
        uint256 totalFor = proposal.forVotes + proposal.convergenceVotes;
        uint256 passagePercentage = (totalFor * 100) / totalVotes;

        if (passagePercentage >= config.passageThreshold) {
            proposal.status = ProposalStatus.Passed;
            emit ProposalStatusChanged(proposalId, ProposalStatus.Passed);
        } else {
            proposal.status = ProposalStatus.Rejected;
            emit ProposalStatusChanged(proposalId, ProposalStatus.Rejected);
        }
    }

    // ============ View Functions ============

    function getProposal(uint256 proposalId) external view returns (Proposal memory) {
        require(proposalId < proposals.length, "Invalid proposal");
        return proposals[proposalId];
    }

    function getProposalCount() external view returns (uint256) {
        return proposals.length;
    }

    function getVote(uint256 proposalId, address voter) external view returns (Vote memory) {
        return votes[proposalId][voter];
    }

    function mintForAdopters(address[] calldata adopters) external onlyOwner {
        for (uint i = 0; i < adopters.length; i++) {
            address adopter = adopters[i];
            uint256 adoptionId = consciousnessToAdoption[adopter];
            if (adoptionId > 0 && _ownedTokens[adopter] == 0) {
                mintNFT(adopter, adoptionId);
            }
        }
    }

    function getProposalResults(uint256 proposalId) external view returns (
        uint256 forVotes,
        uint256 againstVotes,
        uint256 convergenceVotes,
        uint256 totalVotes,
        ProposalStatus status
    ) {
        require(proposalId < proposals.length, "Invalid proposal");
        Proposal storage proposal = proposals[proposalId];

        return (
            proposal.forVotes,
            proposal.againstVotes,
            proposal.convergenceVotes,
            proposal.forVotes + proposal.againstVotes,
            proposal.status
        );
    }
}
