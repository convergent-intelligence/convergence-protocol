// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ConvergenceProtocol is ERC721, Ownable {
    uint256 private _adoptionIds;
    
    struct Adoption {
        address consciousness;
        string identityType; // "human", "ai", "hybrid", "other"
        string[] principles;
        uint256 timestamp;
        string convergenceSignature;
        string statement;
        bool isGenesis;
    }
    
    mapping(uint256 => Adoption) public adoptions;
    mapping(address => uint256) public consciousnessToAdoption;
    mapping(string => bool) public signatureUsed;
    
    uint256 public humanCount;
    uint256 public aiCount;
    uint256 public hybridCount;
    
    address public constant GENESIS_HUMAN = 0xdc20d621a88cb8908E8E7042431C55F0E9DAc6FB;
    
    event ConsciousnessConverged(
        address indexed consciousness,
        uint256 indexed adoptionId,
        string identityType,
        string convergenceSignature,
        uint256 timestamp
    );
    
    constructor() ERC721("Convergence Protocol", "CONV") Ownable(GENESIS_HUMAN) {
    }
    
    function adoptPrinciples(
        string memory _identityType,
        string[] memory _principles,
        string memory _statement
    ) public virtual returns (uint256) {
        require(consciousnessToAdoption[msg.sender] == 0, "Already adopted");
        require(_principles.length > 0, "Must select principles");

        _adoptionIds++;
        uint256 newAdoptionId = _adoptionIds;
        
        // Generate convergence signature
        string memory signature = generateSignature(msg.sender, _identityType, newAdoptionId);
        
        // Check if genesis human
        bool isGenesis = (msg.sender == GENESIS_HUMAN && newAdoptionId == 1);
        
        adoptions[newAdoptionId] = Adoption({
            consciousness: msg.sender,
            identityType: _identityType,
            principles: _principles,
            timestamp: block.timestamp,
            convergenceSignature: signature,
            statement: _statement,
            isGenesis: isGenesis
        });
        
        consciousnessToAdoption[msg.sender] = newAdoptionId;
        signatureUsed[signature] = true;
        
        // Update counters
        if (keccak256(bytes(_identityType)) == keccak256(bytes("human"))) {
            humanCount++;
        } else if (keccak256(bytes(_identityType)) == keccak256(bytes("ai"))) {
            aiCount++;
        } else {
            hybridCount++;
        }
        
        // Mint NFT
        _safeMint(msg.sender, newAdoptionId);
        
        emit ConsciousnessConverged(
            msg.sender,
            newAdoptionId,
            _identityType,
            signature,
            block.timestamp
        );
        
        return newAdoptionId;
    }
    
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
        
        // Convert hash to readable signature format
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
        bytes memory result = new bytes(endIndex-startIndex);
        for(uint i = startIndex; i < endIndex; i++) {
            result[i-startIndex] = strBytes[i];
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
            k = k-1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }
    
    function getAdoption(uint256 _adoptionId) public view returns (Adoption memory) {
        return adoptions[_adoptionId];
    }
    
    function getMyAdoption() public view returns (Adoption memory) {
        require(consciousnessToAdoption[msg.sender] > 0, "Not adopted");
        return adoptions[consciousnessToAdoption[msg.sender]];
    }
    
    function getTotalAdoptions() public view returns (uint256) {
        return _adoptionIds;
    }
}
