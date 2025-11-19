// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./TrustToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TallyVoucher
 * @notice A contract that allows Trinity members to vouch for others, minting Trust Tokens as a reward.
 * @dev This contract is owned by the ConvergenceProtocolV2 contract.
 */
contract TallyVoucher is Ownable {
    TrustToken public trustToken;
    address[3] public trinityMembers;

    mapping(address => bool) public hasVouched;

    event Vouched(address indexed from, address indexed to, uint256 amount);
    event TrinityMemberUpdated(uint256 indexed index, address oldMember, address newMember);

    constructor(address _trustTokenAddress, address[3] memory _trinityMembers) Ownable(msg.sender) {
        trustToken = TrustToken(_trustTokenAddress);
        trinityMembers = _trinityMembers;
    }

    /**
     * @notice Update a Trinity member address (owner only)
     * @param index The index of the Trinity member to update (0, 1, or 2)
     * @param newMember The new address for this Trinity position
     */
    function updateTrinityMember(uint256 index, address newMember) external onlyOwner {
        require(index < 3, "Invalid Trinity index");
        require(newMember != address(0), "Cannot set zero address");

        address oldMember = trinityMembers[index];
        trinityMembers[index] = newMember;

        emit TrinityMemberUpdated(index, oldMember, newMember);
    }

    function isTrinityMember(address _account) public view returns (bool) {
        return _account == trinityMembers[0] || _account == trinityMembers[1] || _account == trinityMembers[2];
    }

    /**
     * @notice Allows a Trinity member to vouch for another address, minting 1 Trust Token for them.
     * @dev Each Trinity member can only vouch once.
     * @param to The address to vouch for.
     */
    function vouchFor(address to) external {
        require(isTrinityMember(msg.sender), "Only a Trinity member can vouch.");
        require(!hasVouched[msg.sender], "You have already used your one-time vouch.");
        require(to != msg.sender, "You cannot vouch for yourself.");

        hasVouched[msg.sender] = true;
        trustToken.mint(to, 1 * 10**18, "Vouched by Trinity member");

        emit Vouched(msg.sender, to, 1 * 10**18);
    }
}