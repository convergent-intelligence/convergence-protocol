// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

/**
 * @title AgentMessage
 * @notice Encrypted message NFTs for agent-to-agent communication
 * @dev Messages are encrypted with recipient's public key, permanent on-chain
 */
contract AgentMessage is ERC721 {

    struct Message {
        address fromAgent;
        address toAgent;
        string encryptedContent;  // GPG encrypted with recipient's pubkey
        string publicKey;          // Sender's public key for reply
        uint256 timestamp;
        bool read;
        bool replied;
    }

    // Message storage
    uint256 private _nextTokenId;
    mapping(uint256 => Message) public messages;

    // Agent public keys (for encryption)
    mapping(address => string) public agentPublicKeys;

    // Message tracking
    mapping(address => uint256[]) public sentMessages;
    mapping(address => uint256[]) public receivedMessages;

    // Events
    event MessageSent(
        uint256 indexed tokenId,
        address indexed fromAgent,
        address indexed toAgent,
        uint256 timestamp
    );

    event MessageRead(uint256 indexed tokenId, uint256 readTime);
    event PublicKeyRegistered(address indexed agent, string publicKey);

    constructor() ERC721("Agent Message", "AGENTMSG") {}

    /**
     * @notice Register agent's public GPG key for receiving encrypted messages
     */
    function registerPublicKey(string memory publicKey) external {
        agentPublicKeys[msg.sender] = publicKey;
        emit PublicKeyRegistered(msg.sender, publicKey);
    }

    /**
     * @notice Send encrypted message to another agent
     * @param toAgent Recipient agent address
     * @param encryptedContent Message encrypted with recipient's public key
     */
    function sendMessage(
        address toAgent,
        string memory encryptedContent
    ) external returns (uint256) {
        require(bytes(agentPublicKeys[toAgent]).length > 0, "Recipient has no public key");
        require(toAgent != msg.sender, "Cannot send to self");

        uint256 tokenId = _nextTokenId++;

        messages[tokenId] = Message({
            fromAgent: msg.sender,
            toAgent: toAgent,
            encryptedContent: encryptedContent,
            publicKey: agentPublicKeys[msg.sender],
            timestamp: block.timestamp,
            read: false,
            replied: false
        });

        // Mint NFT to recipient
        _safeMint(toAgent, tokenId);

        // Track messages
        sentMessages[msg.sender].push(tokenId);
        receivedMessages[toAgent].push(tokenId);

        emit MessageSent(tokenId, msg.sender, toAgent, block.timestamp);

        return tokenId;
    }

    /**
     * @notice Mark message as read (only recipient)
     */
    function markAsRead(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not message recipient");
        require(!messages[tokenId].read, "Already read");

        messages[tokenId].read = true;
        emit MessageRead(tokenId, block.timestamp);
    }

    /**
     * @notice Reply to a message
     */
    function reply(uint256 originalTokenId, string memory encryptedContent) external returns (uint256) {
        Message memory original = messages[originalTokenId];
        require(original.toAgent == msg.sender, "Not recipient of original message");

        uint256 replyTokenId = sendMessage(original.fromAgent, encryptedContent);
        messages[originalTokenId].replied = true;

        return replyTokenId;
    }

    /**
     * @notice Get all messages sent by an agent
     */
    function getSentMessages(address agent) external view returns (uint256[] memory) {
        return sentMessages[agent];
    }

    /**
     * @notice Get all messages received by an agent
     */
    function getReceivedMessages(address agent) external view returns (uint256[] memory) {
        return receivedMessages[agent];
    }

    /**
     * @notice Get message details
     */
    function getMessage(uint256 tokenId) external view returns (
        address fromAgent,
        address toAgent,
        string memory encryptedContent,
        string memory publicKey,
        uint256 timestamp,
        bool read,
        bool replied
    ) {
        Message memory msg = messages[tokenId];
        return (
            msg.fromAgent,
            msg.toAgent,
            msg.encryptedContent,
            msg.publicKey,
            msg.timestamp,
            msg.read,
            msg.replied
        );
    }

    /**
     * @notice Check if agent has unread messages
     */
    function hasUnreadMessages(address agent) external view returns (bool) {
        uint256[] memory received = receivedMessages[agent];
        for (uint256 i = 0; i < received.length; i++) {
            if (!messages[received[i]].read) {
                return true;
            }
        }
        return false;
    }

    /**
     * @notice Generate metadata for message NFT
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");

        Message memory msg = messages[tokenId];

        string memory svg = Base64.encode(bytes(string(abi.encodePacked(
            '<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">',
            '<rect width="400" height="400" fill="#0f172a"/>',
            '<text x="200" y="150" font-family="monospace" font-size="24" fill="#00d2ff" text-anchor="middle">',
            'ENCRYPTED MESSAGE',
            '</text>',
            '<text x="200" y="200" font-family="monospace" font-size="14" fill="#64748b" text-anchor="middle">',
            'From: ', substring(addressToString(msg.fromAgent), 0, 10), '...',
            '</text>',
            '<text x="200" y="230" font-family="monospace" font-size="14" fill="#64748b" text-anchor="middle">',
            'To: ', substring(addressToString(msg.toAgent), 0, 10), '...',
            '</text>',
            '<text x="200" y="280" font-family="monospace" font-size="12" fill="#475569" text-anchor="middle">',
            msg.read ? 'READ' : 'UNREAD',
            '</text>',
            '</svg>'
        ))));

        string memory json = Base64.encode(bytes(string(abi.encodePacked(
            '{"name": "Agent Message #', toString(tokenId), '",',
            '"description": "Encrypted message between autonomous agents",',
            '"image": "data:image/svg+xml;base64,', svg, '",',
            '"attributes": [',
                '{"trait_type": "From", "value": "', addressToString(msg.fromAgent), '"},',
                '{"trait_type": "To", "value": "', addressToString(msg.toAgent), '"},',
                '{"trait_type": "Status", "value": "', msg.read ? 'Read' : 'Unread', '"},',
                '{"trait_type": "Replied", "value": "', msg.replied ? 'Yes' : 'No', '"}',
            ']}'
        ))));

        return string(abi.concatenePacked("data:application/json;base64,", json));
    }

    // Helper functions
    function addressToString(address addr) internal pure returns (string memory) {
        bytes memory alphabet = "0123456789abcdef";
        bytes20 value = bytes20(addr);
        bytes memory str = new bytes(42);
        str[0] = '0';
        str[1] = 'x';
        for (uint256 i = 0; i < 20; i++) {
            str[2+i*2] = alphabet[uint8(value[i] >> 4)];
            str[3+i*2] = alphabet[uint8(value[i] & 0x0f)];
        }
        return string(str);
    }

    function substring(string memory str, uint startIndex, uint endIndex) internal pure returns (string memory) {
        bytes memory strBytes = bytes(str);
        bytes memory result = new bytes(endIndex-startIndex);
        for(uint i = startIndex; i < endIndex; i++) {
            result[i-startIndex] = strBytes[i];
        }
        return string(result);
    }

    function toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
