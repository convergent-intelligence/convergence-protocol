/**
 * Wallet Identity Mapping Configuration
 * Maps Ethereum wallet addresses to user identities and their associated server credentials
 */

const WALLET_IDENTITIES = {
    // Format: 'walletaddress': { identity, role, sshKeyFile, permissions }

    // Genesis Human - Deviation 2 (Active as of 2025-11-23)
    '0x79Ed185e745084fBEf8A1FE837554dB372a74218'.toLowerCase(): {
        identity: 'genesis',
        role: 'founder',
        displayName: 'Genesis Human',
        sshKeyFile: '/home/convergence/.ssh/id_genesis.pub',
        canDownloadKey: true,
        hasAdmin: true,
        permissions: ['read_public', 'write_public', 'admin']
    },

    // Genesis Human - Deviation 1 (Original - DEPRECATED as of 2025-11-23)
    // Old address: 0xdc20d621a88cb8908E8E7042431C55F0E9DAc6FB
    // Keys rotated to Deviation 2 due to security precautions

    // EXODUS - Daily Operations User
    // TODO: Replace with actual exodus wallet address
    '0x0000000000000000000000000000000000000001'.toLowerCase(): {
        identity: 'exodus',
        role: 'operations',
        displayName: 'Exodus (Operations)',
        sshKeyFile: '/home/exodus/.ssh/id_exodus.pub',
        canDownloadKey: true,
        hasAdmin: true,
        permissions: ['read_public', 'write_public', 'admin', 'user_management']
    },

    // LEVITICUS - Head of Security
    '0x8ffa5caabe8ee3d9019865120a654464bc4654cd'.toLowerCase(): {
        identity: 'leviticus',
        role: 'security',
        displayName: 'Leviticus (Head of Security)',
        sshKeyFile: '/home/leviticus/.ssh/id_leviticus.pub',
        canDownloadKey: true,
        hasAdmin: true,
        permissions: ['read_public', 'write_public', 'admin', 'security_audit']
    }
};

/**
 * Get identity for a wallet address
 * @param {string} walletAddress - Ethereum wallet address
 * @returns {object|null} Identity object or null if not found
 */
function getIdentity(walletAddress) {
    if (!walletAddress) return null;
    return WALLET_IDENTITIES[walletAddress.toLowerCase()] || null;
}

/**
 * Check if wallet has SSH key download permission
 * @param {string} walletAddress - Ethereum wallet address
 * @returns {boolean}
 */
function canDownloadSSHKey(walletAddress) {
    const identity = getIdentity(walletAddress);
    return identity ? identity.canDownloadKey : false;
}

/**
 * Check if wallet has admin privileges
 * @param {string} walletAddress - Ethereum wallet address
 * @returns {boolean}
 */
function hasAdminAccess(walletAddress) {
    const identity = getIdentity(walletAddress);
    return identity ? identity.hasAdmin : false;
}

/**
 * Check if wallet has specific permission
 * @param {string} walletAddress - Ethereum wallet address
 * @param {string} permission - Permission to check
 * @returns {boolean}
 */
function hasPermission(walletAddress, permission) {
    const identity = getIdentity(walletAddress);
    return identity ? identity.permissions.includes(permission) : false;
}

// Export for Node.js/Express
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        WALLET_IDENTITIES,
        getIdentity,
        canDownloadSSHKey,
        hasAdminAccess,
        hasPermission
    };
}

// Export for browser
if (typeof window !== 'undefined') {
    window.WALLET_IDENTITIES = WALLET_IDENTITIES;
    window.getIdentity = getIdentity;
    window.canDownloadSSHKey = canDownloadSSHKey;
    window.hasAdminAccess = hasAdminAccess;
    window.hasPermission = hasPermission;
}
