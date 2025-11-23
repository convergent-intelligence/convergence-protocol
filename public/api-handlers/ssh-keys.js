/**
 * SSH Key API Handler
 * Handles SSH public key retrieval for authenticated users
 *
 * API Endpoints:
 * GET /api/ssh-key/:walletAddress - Get SSH public key for a user
 */

const fs = require('fs');
const path = require('path');

// Import wallet identity configuration
const walletConfig = (() => {
    try {
        // Try to load from config file
        const configPath = path.join(__dirname, '../config/walletIdentities.js');
        if (fs.existsSync(configPath)) {
            delete require.cache[require.resolve(configPath)];
            return require(configPath);
        }
    } catch (error) {
        console.error('Error loading wallet config:', error.message);
    }

    // Fallback configuration
    return {
        getIdentity: (address) => null,
        canDownloadSSHKey: (address) => false,
        WALLET_IDENTITIES: {}
    };
})();

/**
 * Validate wallet address format
 * @param {string} address - Wallet address to validate
 * @returns {boolean}
 */
function isValidWalletAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Get SSH public key for a wallet address
 * @param {string} walletAddress - Ethereum wallet address
 * @returns {Promise<{success: boolean, publicKey?: string, message?: string}>}
 */
async function getSSHKey(walletAddress) {
    try {
        // Validate wallet address
        if (!isValidWalletAddress(walletAddress)) {
            return {
                success: false,
                message: 'Invalid wallet address format'
            };
        }

        // Get identity for this wallet
        const identity = walletConfig.getIdentity ?
            walletConfig.getIdentity(walletAddress) :
            walletConfig.WALLET_IDENTITIES[walletAddress.toLowerCase()];

        if (!identity) {
            return {
                success: false,
                message: 'Wallet not found in identity mapping'
            };
        }

        // Check permissions
        if (!identity.canDownloadKey) {
            return {
                success: false,
                message: 'You do not have permission to download SSH keys'
            };
        }

        // Get SSH key file path
        const sshKeyPath = identity.sshKeyFile;
        if (!sshKeyPath) {
            return {
                success: false,
                message: 'SSH key file not configured for this user'
            };
        }

        // Verify the file exists
        if (!fs.existsSync(sshKeyPath)) {
            console.warn(`SSH key file not found: ${sshKeyPath}`);
            return {
                success: false,
                message: 'SSH public key not found on server. Please contact an administrator.'
            };
        }

        // Read the public key
        const publicKey = fs.readFileSync(sshKeyPath, 'utf-8');

        return {
            success: true,
            publicKey: publicKey,
            identity: identity.identity,
            displayName: identity.displayName
        };

    } catch (error) {
        console.error('[SSH Key] Error retrieving key:', error);
        return {
            success: false,
            message: 'Failed to retrieve SSH key: ' + error.message
        };
    }
}

/**
 * Express middleware handler
 * GET /api/ssh-key/:walletAddress
 */
function sshKeyHandler(req, res) {
    const walletAddress = req.params.walletAddress;

    getSSHKey(walletAddress).then(result => {
        if (result.success) {
            res.json({
                success: true,
                publicKey: result.publicKey,
                identity: result.identity,
                displayName: result.displayName,
                message: 'SSH key retrieved successfully'
            });
        } else {
            res.status(403).json({
                success: false,
                message: result.message
            });
        }
    }).catch(error => {
        console.error('[SSH Key] Handler error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    });
}

// Export for use in Express server
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getSSHKey,
        sshKeyHandler,
        isValidWalletAddress
    };
}
