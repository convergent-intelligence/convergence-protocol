// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title NFTMarketplace
 * @notice Convergence Protocol v4: Community NFT Donation & AI Evaluation Platform
 * @dev Handles donated NFTs, agent evaluations, spam burning, and marketplace operations
 */
contract NFTMarketplace is Ownable, ReentrancyGuard, IERC721Receiver {
    using SafeERC20 for IERC20;

    // ============ State Variables ============

    // TRUST and TALLY tokens
    IERC20 public trustToken;
    IERC20 public tallyToken;

    // AI Agent address (Claude or other LLM-based agent)
    address public aiAgent;

    // Governance contract
    address public governance;

    // Donation tracking
    struct NFTDonation {
        bytes32 donationId;
        address donor;
        address nftContract;
        uint256 tokenId;
        string chain; // "ethereum", "tron", "solana", "cosmos"
        bool isSpam;
        uint256 timestamp;
        uint256 trustReward;
        bool burned;
        string evaluation; // IPFS hash of agent evaluation
        bool accepted;
    }

    mapping(bytes32 => NFTDonation) public donations;
    bytes32[] public donationIds;

    // Agent evaluations
    struct AgentEvaluation {
        bytes32 evaluationId;
        bytes32 donationId;
        uint256 rarityScore; // 0-1000
        uint256 estimatedValue; // USD value (18 decimals)
        uint256 agentOffer; // 80% of estimated value
        uint256 confidence; // 0-100
        string reasoning; // IPFS hash
        bool recommended;
        uint256 timestamp;
    }

    mapping(bytes32 => AgentEvaluation) public evaluations;

    // Marketplace listings
    struct NFTListing {
        bytes32 listingId;
        bytes32 donationId;
        address nftContract;
        uint256 tokenId;
        uint256 askPrice; // TALLY price
        bool active;
        uint256 timestamp;
    }

    mapping(bytes32 => NFTListing) public listings;

    // Offers on NFTs
    struct NFTOffer {
        bytes32 offerId;
        bytes32 donationId;
        address bidder;
        uint256 offerPrice; // TALLY
        bool accepted;
        uint256 timestamp;
    }

    mapping(bytes32 => NFTOffer) public offers;

    // Spam NFT rewards
    uint256 public spamTrustReward = 1 * 10**18; // 1 TRUST per spam NFT
    mapping(string => uint256) public spamRewardByType; // Different rewards for different scams

    // NFT custody
    mapping(address => mapping(uint256 => address)) public nftCustodyOf; // contract -> tokenId -> owner

    // Fee structure
    uint256 public agentSuccessFee = 250; // 2.5%
    uint256 public marketplaceFeePercent = 100; // 1%

    // Governance voting on major acquisitions
    bool public requiresGovernanceVote;

    // ============ Events ============

    event NFTDonated(
        bytes32 indexed donationId,
        address indexed donor,
        address indexed nftContract,
        uint256 tokenId,
        string chain,
        bool isSpam
    );

    event SpamNFTBurned(
        bytes32 indexed donationId,
        address indexed nftContract,
        uint256 tokenId,
        uint256 trustAwarded
    );

    event EvaluationCompleted(
        bytes32 indexed evaluationId,
        bytes32 indexed donationId,
        uint256 estimatedValue,
        uint256 agentOffer,
        bool recommended
    );

    event NFTAcquired(
        bytes32 indexed donationId,
        address indexed nftContract,
        uint256 tokenId,
        uint256 acquiredPrice
    );

    event NFTListed(
        bytes32 indexed listingId,
        address indexed nftContract,
        uint256 tokenId,
        uint256 askPrice
    );

    event NFTSold(
        bytes32 indexed listingId,
        address indexed buyer,
        uint256 salePrice
    );

    event OfferMade(
        bytes32 indexed offerId,
        address indexed bidder,
        uint256 offerPrice
    );

    event OfferAccepted(
        bytes32 indexed offerId,
        uint256 finalPrice
    );

    // ============ Modifiers ============

    modifier onlyAgent() {
        require(msg.sender == aiAgent, "Not AI agent");
        _;
    }

    modifier onlyGovernance() {
        require(msg.sender == governance, "Not governance");
        _;
    }

    // ============ Constructor ============

    constructor(
        address _trust,
        address _tally,
        address _agent,
        address _governance
    ) Ownable(msg.sender) {
        trustToken = IERC20(_trust);
        tallyToken = IERC20(_tally);
        aiAgent = _agent;
        governance = _governance;
        requiresGovernanceVote = true;
    }

    // ============ Donation Functions ============

    /**
     * @notice Donate an NFT to the protocol
     * @param _nftContract NFT contract address
     * @param _tokenId Token ID
     * @param _chain Blockchain name
     * @param _isSpam Is this spam/worthless NFT?
     */
    function donateNFT(
        address _nftContract,
        uint256 _tokenId,
        string memory _chain,
        bool _isSpam
    ) external nonReentrant returns (bytes32 donationId) {
        require(_nftContract != address(0), "Invalid NFT contract");
        require(bytes(_chain).length > 0, "Invalid chain");

        // Transfer NFT to this contract
        IERC721(_nftContract).safeTransferFrom(msg.sender, address(this), _tokenId);

        // Generate donation ID
        donationId = keccak256(abi.encodePacked(
            msg.sender,
            _nftContract,
            _tokenId,
            block.timestamp
        ));

        // Record donation
        donations[donationId] = NFTDonation({
            donationId: donationId,
            donor: msg.sender,
            nftContract: _nftContract,
            tokenId: _tokenId,
            chain: _chain,
            isSpam: _isSpam,
            timestamp: block.timestamp,
            trustReward: 0,
            burned: false,
            evaluation: "",
            accepted: false
        });

        donationIds.push(donationId);
        nftCustodyOf[_nftContract][_tokenId] = msg.sender;

        emit NFTDonated(donationId, msg.sender, _nftContract, _tokenId, _chain, _isSpam);

        return donationId;
    }

    // ============ Spam NFT Burning ============

    /**
     * @notice Burn spam NFT and reward donor with TRUST
     * @param _donationId Donation ID
     * @param _spamType Type of spam for reward calculation
     */
    function burnSpamNFT(
        bytes32 _donationId,
        string memory _spamType
    ) external onlyGovernance nonReentrant {
        NFTDonation storage donation = donations[_donationId];
        require(!donation.burned, "Already burned");
        require(donation.isSpam, "Not marked as spam");

        // Calculate reward
        uint256 reward = spamRewardByType[_spamType] > 0 ?
            spamRewardByType[_spamType] :
            spamTrustReward;

        // Mark as burned
        donation.burned = true;
        donation.trustReward = reward;

        // Award TRUST to donor
        require(
            trustToken.transfer(donation.donor, reward),
            "TRUST transfer failed"
        );

        emit SpamNFTBurned(
            _donationId,
            donation.nftContract,
            donation.tokenId,
            reward
        );
    }

    // ============ Agent Evaluation ============

    /**
     * @notice AI Agent submits evaluation for donated NFT
     * @param _donationId Donation ID
     * @param _rarityScore Rarity 0-1000
     * @param _estimatedValue USD value (18 decimals)
     * @param _confidence Confidence 0-100
     * @param _reasoning IPFS hash of reasoning
     * @param _recommended Should protocol acquire this NFT?
     */
    function submitEvaluation(
        bytes32 _donationId,
        uint256 _rarityScore,
        uint256 _estimatedValue,
        uint256 _confidence,
        string memory _reasoning,
        bool _recommended
    ) external onlyAgent returns (bytes32 evaluationId) {
        NFTDonation storage donation = donations[_donationId];
        require(!donation.burned, "NFT already burned");
        require(!donation.isSpam, "Don't evaluate spam");

        require(_rarityScore <= 1000, "Invalid rarity");
        require(_estimatedValue > 0, "Invalid value");
        require(_confidence <= 100, "Invalid confidence");

        // Generate evaluation ID
        evaluationId = keccak256(abi.encodePacked(
            _donationId,
            block.timestamp,
            msg.sender
        ));

        // Calculate agent offer (80% of estimated)
        uint256 agentOffer = (_estimatedValue * 80) / 100;

        // Record evaluation
        evaluations[evaluationId] = AgentEvaluation({
            evaluationId: evaluationId,
            donationId: _donationId,
            rarityScore: _rarityScore,
            estimatedValue: _estimatedValue,
            agentOffer: agentOffer,
            confidence: _confidence,
            reasoning: _reasoning,
            recommended: _recommended,
            timestamp: block.timestamp
        });

        // Store evaluation reference in donation
        donation.evaluation = _reasoning;

        emit EvaluationCompleted(
            evaluationId,
            _donationId,
            _estimatedValue,
            agentOffer,
            _recommended
        );

        return evaluationId;
    }

    /**
     * @notice Make offer for NFT (by agent on behalf of treasury)
     * @param _donationId Donation ID
     * @param _offerPrice TALLY price
     */
    function makeOffer(
        bytes32 _donationId,
        uint256 _offerPrice
    ) external onlyAgent nonReentrant {
        NFTDonation storage donation = donations[_donationId];
        require(!donation.burned, "NFT already burned");
        require(_offerPrice > 0, "Invalid offer");

        // Create offer
        bytes32 offerId = keccak256(abi.encodePacked(
            _donationId,
            _offerPrice,
            block.timestamp
        ));

        offers[offerId] = NFTOffer({
            offerId: offerId,
            donationId: _donationId,
            bidder: aiAgent,
            offerPrice: _offerPrice,
            accepted: false,
            timestamp: block.timestamp
        });

        emit OfferMade(offerId, aiAgent, _offerPrice);
    }

    /**
     * @notice Accept agent offer for NFT
     * @param _offerId Offer ID
     */
    function acceptOffer(bytes32 _offerId) external nonReentrant {
        NFTOffer storage offer = offers[_offerId];
        NFTDonation storage donation = donations[offer.donationId];

        require(!offer.accepted, "Already accepted");
        require(!donation.burned, "NFT burned");

        // Require governance vote if configured
        if (requiresGovernanceVote && offer.offerPrice > 50000 * 10**18) {
            revert("Requires governance vote for large acquisitions");
        }

        // Mark accepted
        offer.accepted = true;
        donation.accepted = true;

        // Transfer TALLY to donor
        require(
            tallyToken.transferFrom(address(this), donation.donor, offer.offerPrice),
            "TALLY transfer failed"
        );

        emit OfferAccepted(_offerId, offer.offerPrice);
        emit NFTAcquired(
            offer.donationId,
            donation.nftContract,
            donation.tokenId,
            offer.offerPrice
        );
    }

    // ============ Marketplace Functions ============

    /**
     * @notice List accepted NFT for sale
     * @param _donationId Donation ID
     * @param _askPrice Ask price in TALLY
     */
    function listNFT(
        bytes32 _donationId,
        uint256 _askPrice
    ) external onlyGovernance nonReentrant returns (bytes32 listingId) {
        NFTDonation storage donation = donations[_donationId];
        require(donation.accepted, "NFT not acquired");
        require(_askPrice > 0, "Invalid price");

        // Generate listing ID
        listingId = keccak256(abi.encodePacked(
            _donationId,
            _askPrice,
            block.timestamp
        ));

        // Create listing
        listings[listingId] = NFTListing({
            listingId: listingId,
            donationId: _donationId,
            nftContract: donation.nftContract,
            tokenId: donation.tokenId,
            askPrice: _askPrice,
            active: true,
            timestamp: block.timestamp
        });

        emit NFTListed(listingId, donation.nftContract, donation.tokenId, _askPrice);

        return listingId;
    }

    /**
     * @notice Buy NFT from listing
     * @param _listingId Listing ID
     */
    function buyNFT(bytes32 _listingId) external nonReentrant {
        NFTListing storage listing = listings[_listingId];
        require(listing.active, "Listing not active");

        // Transfer TALLY from buyer to contract (treasury)
        require(
            tallyToken.transferFrom(msg.sender, address(this), listing.askPrice),
            "TALLY transfer failed"
        );

        // Calculate fees
        uint256 marketplaceFee = (listing.askPrice * marketplaceFeePercent) / 10000;
        uint256 treasuryReceives = listing.askPrice - marketplaceFee;

        // Transfer NFT to buyer
        IERC721(listing.nftContract).safeTransferFrom(
            address(this),
            msg.sender,
            listing.tokenId
        );

        // Deactivate listing
        listing.active = false;

        emit NFTSold(_listingId, msg.sender, listing.askPrice);
    }

    /**
     * @notice Make offer on listed NFT
     * @param _listingId Listing ID
     * @param _offerPrice Offer price in TALLY
     */
    function makeBidOffer(
        bytes32 _listingId,
        uint256 _offerPrice
    ) external nonReentrant {
        NFTListing storage listing = listings[_listingId];
        require(listing.active, "Listing not active");
        require(_offerPrice > 0, "Invalid offer");
        require(_offerPrice <= tallyToken.balanceOf(msg.sender), "Insufficient TALLY");

        // Create bid offer
        bytes32 offerId = keccak256(abi.encodePacked(
            _listingId,
            msg.sender,
            _offerPrice,
            block.timestamp
        ));

        offers[offerId] = NFTOffer({
            offerId: offerId,
            donationId: listing.donationId,
            bidder: msg.sender,
            offerPrice: _offerPrice,
            accepted: false,
            timestamp: block.timestamp
        });

        emit OfferMade(offerId, msg.sender, _offerPrice);
    }

    // ============ View Functions ============

    /**
     * @notice Get donation details
     */
    function getDonation(bytes32 _donationId) external view returns (
        address donor,
        address nftContract,
        uint256 tokenId,
        string memory chain,
        bool isSpam,
        bool burned,
        bool accepted
    ) {
        NFTDonation storage donation = donations[_donationId];
        return (
            donation.donor,
            donation.nftContract,
            donation.tokenId,
            donation.chain,
            donation.isSpam,
            donation.burned,
            donation.accepted
        );
    }

    /**
     * @notice Get evaluation details
     */
    function getEvaluation(bytes32 _evaluationId) external view returns (
        uint256 rarityScore,
        uint256 estimatedValue,
        uint256 agentOffer,
        uint256 confidence,
        bool recommended
    ) {
        AgentEvaluation storage eval = evaluations[_evaluationId];
        return (
            eval.rarityScore,
            eval.estimatedValue,
            eval.agentOffer,
            eval.confidence,
            eval.recommended
        );
    }

    /**
     * @notice Get total donations
     */
    function getTotalDonations() external view returns (uint256) {
        return donationIds.length;
    }

    /**
     * @notice Get donation status summary
     */
    function getMarketplaceStats() external view returns (
        uint256 totalDonations,
        uint256 spamBurned,
        uint256 nftsAcquired,
        uint256 activeListings
    ) {
        uint256 burned = 0;
        uint256 acquired = 0;

        for (uint256 i = 0; i < donationIds.length; i++) {
            if (donations[donationIds[i]].burned) burned++;
            if (donations[donationIds[i]].accepted) acquired++;
        }

        return (
            donationIds.length,
            burned,
            acquired,
            0 // Would need to track active listings separately
        );
    }

    // ============ Admin Functions ============

    /**
     * @notice Update AI agent address
     */
    function setAIAgent(address _agent) external onlyOwner {
        require(_agent != address(0), "Invalid agent");
        aiAgent = _agent;
    }

    /**
     * @notice Update governance address
     */
    function setGovernance(address _governance) external onlyOwner {
        require(_governance != address(0), "Invalid governance");
        governance = _governance;
    }

    /**
     * @notice Update spam NFT reward
     */
    function setSpamReward(string memory _spamType, uint256 _reward) external onlyOwner {
        spamRewardByType[_spamType] = _reward;
    }

    /**
     * @notice Toggle governance vote requirement
     */
    function setRequiresGovernanceVote(bool _requires) external onlyOwner {
        requiresGovernanceVote = _requires;
    }

    // ============ ERC721 Receiver ============

    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }
}
