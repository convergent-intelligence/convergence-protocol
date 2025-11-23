// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title UserStatusTracker
 * @dev Tracks user progression from guest -> user -> partner
 *
 * Users achieve "user" status by:
 * 1. Participating in ceremony (earning trust)
 * 2. Making a contribution (earning tally)
 * 3. Burning all earned trust
 *
 * After becoming a user, they can:
 * - Accumulate more trust and tally
 * - Compete for partner seats via trust burning ranking
 */
contract UserStatusTracker is Ownable {

    // Token references
    IERC20 public trustToken;
    IERC20 public tallyToken;

    // User status levels
    enum UserStatus {
        GUEST,
        USER,
        PARTNER
    }

    // User progression info
    struct UserInfo {
        address wallet;
        address bibleWallet;
        string bibleAlias;
        UserStatus status;
        uint256 trustBurned;
        uint256 tallyAccumulated;
        uint256 ceremonyParticipations;
        uint256 firstCeremonyDate;
        uint256 userStatusAchievedDate;
        uint256 partnerAssignedDate;
        string bibleSeat; // e.g., "exodus", "leviticus"
        bool hasSignedCovenant;
    }

    // Status tracking
    mapping(address => UserInfo) public users;
    address[] public userAddresses;

    // Events
    event GuestRegistered(address indexed guest, string bibleAlias, address bibleWallet);
    event CeremonyParticipated(address indexed user, uint256 trustEarned);
    event TrustBurned(address indexed user, uint256 trustAmount);
    event UserStatusAchieved(address indexed wallet, address bibleWallet, string bibleAlias);
    event PartnerStatusAchieved(address indexed wallet, string bibleAlias, string seatName);
    event CovenantSigned(address indexed user);

    constructor(address _trustToken, address _tallyToken) Ownable(msg.sender) {
        trustToken = IERC20(_trustToken);
        tallyToken = IERC20(_tallyToken);
    }

    /**
     * @dev Register a guest with Bible wallet alias
     */
    function registerGuest(
        address guestWallet,
        address bibleWallet,
        string memory bibleAlias
    ) external onlyOwner {
        require(guestWallet != address(0) && bibleWallet != address(0), "Invalid addresses");
        require(bytes(bibleAlias).length > 0, "Invalid alias");
        require(users[guestWallet].wallet == address(0), "Guest already registered");

        users[guestWallet] = UserInfo({
            wallet: guestWallet,
            bibleWallet: bibleWallet,
            bibleAlias: bibleAlias,
            status: UserStatus.GUEST,
            trustBurned: 0,
            tallyAccumulated: 0,
            ceremonyParticipations: 0,
            firstCeremonyDate: 0,
            userStatusAchievedDate: 0,
            partnerAssignedDate: 0,
            bibleSeat: "",
            hasSignedCovenant: false
        });

        userAddresses.push(guestWallet);

        emit GuestRegistered(guestWallet, bibleAlias, bibleWallet);
    }

    /**
     * @dev Record ceremony participation (earns trust)
     * Called by ceremony contract when user adopts principles
     */
    function recordCeremonyParticipation(address user, uint256 trustEarned) external onlyOwner {
        require(users[user].wallet != address(0), "User not registered");

        UserInfo storage userInfo = users[user];
        userInfo.ceremonyParticipations++;

        if (userInfo.firstCeremonyDate == 0) {
            userInfo.firstCeremonyDate = block.timestamp;
        }

        emit CeremonyParticipated(user, trustEarned);
    }

    /**
     * @dev Record contribution (earns tally)
     * Called when user makes USDT donation
     */
    function recordContribution(address user, uint256 tallyAmount) external onlyOwner {
        require(users[user].wallet != address(0), "User not registered");
        users[user].tallyAccumulated += tallyAmount;
    }

    /**
     * @dev User burns trust to achieve user status
     *
     * To achieve user status:
     * - Must have participated in ceremony OR
     * - Must have earned tally from contribution
     *
     * Must burn all earned trust
     */
    function burnTrustForUserStatus(
        address user,
        uint256 trustAmount
    ) external {
        require(users[user].wallet != address(0), "User not registered");

        UserInfo storage userInfo = users[user];
        require(userInfo.status == UserStatus.GUEST, "Already achieved user or partner status");
        require(
            userInfo.ceremonyParticipations > 0 || userInfo.tallyAccumulated > 0,
            "Must participate in ceremony or contribute first"
        );

        // User must approve this contract to burn trust
        require(
            trustToken.allowance(user, address(this)) >= trustAmount,
            "Insufficient allowance"
        );

        // Burn the trust
        bool success = trustToken.transferFrom(user, address(0xdead), trustAmount);
        require(success, "Trust burn failed");

        userInfo.trustBurned += trustAmount;
        userInfo.status = UserStatus.USER;
        userInfo.userStatusAchievedDate = block.timestamp;

        emit TrustBurned(user, trustAmount);
        emit UserStatusAchieved(userInfo.wallet, userInfo.bibleWallet, userInfo.bibleAlias);
    }

    /**
     * @dev Assign partner status and Bible seat (by governance vote)
     */
    function assignPartnerStatus(
        address user,
        string memory seatName
    ) external onlyOwner {
        require(users[user].wallet != address(0), "User not registered");

        UserInfo storage userInfo = users[user];
        require(userInfo.status == UserStatus.USER, "Must be user status first");

        userInfo.status = UserStatus.PARTNER;
        userInfo.bibleSeat = seatName;
        userInfo.partnerAssignedDate = block.timestamp;

        emit PartnerStatusAchieved(user, userInfo.bibleAlias, seatName);
    }

    /**
     * @dev Record covenant signing
     */
    function recordCovenantSigned(address user) external onlyOwner {
        require(users[user].wallet != address(0), "User not registered");
        users[user].hasSignedCovenant = true;
        emit CovenantSigned(user);
    }

    /**
     * @dev Get user status info
     */
    function getUserStatus(address user) external view returns (UserInfo memory) {
        require(users[user].wallet != address(0), "User not registered");
        return users[user];
    }

    /**
     * @dev Get user by Bible wallet
     */
    function getUserByBibleWallet(address bibleWallet) external view returns (UserInfo memory) {
        for (uint i = 0; i < userAddresses.length; i++) {
            if (users[userAddresses[i]].bibleWallet == bibleWallet) {
                return users[userAddresses[i]];
            }
        }
        revert("Bible wallet not found");
    }

    /**
     * @dev Get ranking of users by trust burned
     * Used for partner seat succession
     */
    function getRankingByTrustBurned() external view returns (UserInfo[] memory) {
        UserInfo[] memory ranked = new UserInfo[](userAddresses.length);

        // Copy users
        for (uint i = 0; i < userAddresses.length; i++) {
            ranked[i] = users[userAddresses[i]];
        }

        // Simple bubble sort by trustBurned (descending)
        for (uint i = 0; i < ranked.length; i++) {
            for (uint j = i + 1; j < ranked.length; j++) {
                if (ranked[j].trustBurned > ranked[i].trustBurned ||
                    (ranked[j].trustBurned == ranked[i].trustBurned &&
                     ranked[j].tallyAccumulated > ranked[i].tallyAccumulated)) {
                    // Swap
                    UserInfo memory temp = ranked[i];
                    ranked[i] = ranked[j];
                    ranked[j] = temp;
                }
            }
        }

        return ranked;
    }

    /**
     * @dev Get all users
     */
    function getAllUsers() external view returns (UserInfo[] memory) {
        UserInfo[] memory allUsers = new UserInfo[](userAddresses.length);

        for (uint i = 0; i < userAddresses.length; i++) {
            allUsers[i] = users[userAddresses[i]];
        }

        return allUsers;
    }

    /**
     * @dev Get user count
     */
    function getUserCount() external view returns (uint256) {
        return userAddresses.length;
    }

    /**
     * @dev Get users by status
     */
    function getUsersByStatus(UserStatus status) external view returns (UserInfo[] memory) {
        uint256 count = 0;

        // Count users with this status
        for (uint i = 0; i < userAddresses.length; i++) {
            if (users[userAddresses[i]].status == status) {
                count++;
            }
        }

        // Build array
        UserInfo[] memory result = new UserInfo[](count);
        uint256 index = 0;

        for (uint i = 0; i < userAddresses.length; i++) {
            if (users[userAddresses[i]].status == status) {
                result[index] = users[userAddresses[i]];
                index++;
            }
        }

        return result;
    }

    /**
     * @dev Update token references
     */
    function setTokens(address _trustToken, address _tallyToken) external onlyOwner {
        require(_trustToken != address(0) && _tallyToken != address(0), "Invalid addresses");
        trustToken = IERC20(_trustToken);
        tallyToken = IERC20(_tallyToken);
    }
}
