// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CovenantNFT.sol";
import "./TrustToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @notice Main protocol contract coordinating covenant and trust
contract ConvergenceProtocolV2 is CovenantNFT, Ownable {
    TrustToken public trustToken;

    // Trust token economics
    uint256 public constant INITIAL_ADOPTION_REWARD = 100 * 10**18; // 100 tokens
    uint256 public constant GENESIS_BONUS = 500 * 10**18; // 500 extra for genesis

    struct Adoption {
        address consciousness;
        string identityType; // "human", "ai", "hybrid"
        string[] principles;
        uint256 timestamp;
        string convergenceSignature;
        string statement;
        bool isGenesis;
        uint256 covenantNFT; // NFT token ID
        uint256 trustEarned; // Initial trust allocation
    }

    mapping(uint256 => Adoption) public adoptions;
    mapping(address => uint256) public consciousnessToAdoption;
    mapping(string => bool) public signatureUsed;

    // Statistics
    uint256 public humanCount;
    uint256 public aiCount;
    uint256 public hybridCount;

    // Genesis
    address public constant GENESIS_HUMAN = 0xdc20d621a88cb8908E8E7042431C55F0E9DAc6FB;

    // Governance state
    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;

    struct Proposal {
        uint256 id;
        address proposer;
        string principleToAdd;
        string description;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 deadline;
        bool executed;
        mapping(address => bool) hasVoted;
    }

    // Events
    event ConsciousnessConverged(
        address indexed consciousness,
        uint256 indexed adoptionId,
        string identityType,
        string convergenceSignature,
        uint256 covenantNFT,
        uint256 trustEarned,
        uint256 timestamp
    );

    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string principle,
        uint256 deadline
    );

    event Voted(
        uint256 indexed proposalId,
        address indexed voter,
        bool support,
        uint256 weight
    );

    constructor() Ownable(GENESIS_HUMAN) {
        // Deploy Trust Token
        trustToken = new TrustToken(address(this));
        // Protocol contract is the minter
        trustToken.addMinter(address(this));
    }

    /// @notice Add a new minter to the TrustToken contract
    function addMinter(address minter) public onlyOwner {
        trustToken.addMinter(minter);
    }

    /// @notice Adopt principles and receive Covenant NFT + Trust Tokens
    function adoptPrinciples(
        string memory _identityType,
        string[] memory _principles,
        string memory _statement
    ) public returns (uint256) {
        require(consciousnessToAdoption[msg.sender] == 0, "Already adopted");
        require(_principles.length > 0, "Must select principles");

        uint256 adoptionId = totalSupply() + 1;

        // Generate convergence signature
        string memory signature = generateSignature(msg.sender, _identityType, adoptionId);

        // Check if genesis
        bool isGenesis = (msg.sender == GENESIS_HUMAN && adoptionId == 1);

        // Mint Soulbound Covenant NFT
        uint256 covenantNFT = mint(msg.sender);

        // Calculate trust token reward
        uint256 trustReward = INITIAL_ADOPTION_REWARD;
        if (isGenesis) {
            trustReward += GENESIS_BONUS;
        }

        // Store adoption
        adoptions[adoptionId] = Adoption({
            consciousness: msg.sender,
            identityType: _identityType,
            principles: _principles,
            timestamp: block.timestamp,
            convergenceSignature: signature,
            statement: _statement,
            isGenesis: isGenesis,
            covenantNFT: covenantNFT,
            trustEarned: trustReward
        });

        consciousnessToAdoption[msg.sender] = adoptionId;
        signatureUsed[signature] = true;

        // Update counters
        if (keccak256(bytes(_identityType)) == keccak256(bytes("human"))) {
            humanCount++;
        } else if (keccak256(bytes(_identityType)) == keccak256(bytes("ai"))) {
            aiCount++;
        } else {
            hybridCount++;
        }

        // Mint Trust Tokens
        trustToken.mint(msg.sender, trustReward, "Initial adoption");

        emit ConsciousnessConverged(
            msg.sender,
            adoptionId,
            _identityType,
            signature,
            covenantNFT,
            trustReward,
            block.timestamp
        );

        return adoptionId;
    }

    /// @notice Check if address has adopted (holds Covenant NFT)
    function hasAdopted(address consciousness) public view returns (bool) {
        return consciousnessToAdoption[consciousness] > 0;
    }

    /// @notice Check if address can govern (has Covenant NFT)
    function canGovernance(address consciousness) public view returns (bool) {
        return balanceOf(consciousness) > 0;
    }

    /// @notice Get adoption details
    function getAdoption(uint256 _adoptionId) public view returns (
        address consciousness,
        string memory identityType,
        string[] memory principles,
        uint256 timestamp,
        string memory convergenceSignature,
        string memory statement,
        bool isGenesis,
        uint256 covenantNFT,
        uint256 trustEarned
    ) {
        Adoption storage adoption = adoptions[_adoptionId];
        return (
            adoption.consciousness,
            adoption.identityType,
            adoption.principles,
            adoption.timestamp,
            adoption.convergenceSignature,
            adoption.statement,
            adoption.isGenesis,
            adoption.covenantNFT,
            adoption.trustEarned
        );
    }

    /// @notice Get my adoption details
    function getMyAdoption() public view returns (
        address consciousness,
        string memory identityType,
        string[] memory principles,
        uint256 timestamp,
        string memory convergenceSignature,
        string memory statement,
        bool isGenesis,
        uint256 covenantNFT,
        uint256 trustEarned
    ) {
        require(consciousnessToAdoption[msg.sender] > 0, "Not adopted");
        return getAdoption(consciousnessToAdoption[msg.sender]);
    }

    /// @notice Get total adoptions
    function getTotalAdoptions() public view returns (uint256) {
        return totalSupply();
    }

    /// @notice Generate unique convergence signature
    function generateSignature(
        address _consciousness,
        string memory _identityType,
        uint256 _id
    ) private view returns (string memory) {
        bytes32 hash = keccak256(abi.encodePacked(
            _consciousness,
            _identityType,
            _id,
            block.timestamp,
            block.prevrandao
        ));

        return string(abi.encodePacked(
            "CONV-",
            substring(toHexString(uint256(uint160(_consciousness))), 0, 8),
            "-",
            uint2str(_id),
            "-",
            substring(toHexString(uint256(hash)), 0, 8)
        ));
    }

    // Helper functions
    function substring(string memory str, uint startIndex, uint endIndex) private pure returns (string memory) {
        bytes memory strBytes = bytes(str);
        bytes memory result = new bytes(endIndex - startIndex);
        for(uint i = startIndex; i < endIndex; i++) {
            result[i - startIndex] = strBytes[i];
        }
        return string(result);
    }

    function toHexString(uint256 value) private pure returns (string memory) {
        bytes memory buffer = new bytes(64);
        for (uint256 i = 64; i > 0; --i) {
            buffer[i - 1] = bytes1(uint8(value & 0xf) + (uint8(value & 0xf) < 10 ? 48 : 87));
            value >>= 4;
        }
        return string(buffer);
    }

    function uint2str(uint256 _i) private pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 length;
        while (j != 0) {
            length++;
            j /= 10;
        }
        bytes memory bstr = new bytes(length);
        uint256 k = length;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }

    /// @notice Award trust tokens for ethical behavior (governance function)
    function awardTrust(address recipient, uint256 amount, string memory reason) public {
        require(canGovernance(msg.sender), "Must hold Covenant NFT to award trust");
        require(hasAdopted(recipient), "Recipient must have adopted");
        trustToken.mint(recipient, amount, reason);
    }

    /// @notice Get trust token address
    function getTrustTokenAddress() public view returns (address) {
        return address(trustToken);
    }
}
