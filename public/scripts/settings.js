/**
 * Settings Page - Client-side Logic
 * Handles account information, SSH key management, and onboarding
 */

let userIdentity = null;

// Wait for wallet to be initialized
document.addEventListener('walletConnected', initializeSettings);
document.addEventListener('walletDisconnected', showAuthRequired);

// Also check on page load if wallet is already connected
document.addEventListener('DOMContentLoaded', () => {
    // Give wallet.js time to initialize
    setTimeout(() => {
        if (typeof userAddress !== 'undefined' && userAddress) {
            initializeSettings();
        }
    }, 100);
});

/**
 * Initialize settings page with user data
 */
async function initializeSettings() {
    console.log('[Settings] Initializing with user address:', userAddress);

    if (!userAddress) {
        showAuthRequired();
        return;
    }

    hideAuthRequired();

    // Get user identity from wallet mapping
    if (typeof getIdentity === 'function') {
        userIdentity = getIdentity(userAddress);
    }

    if (!userIdentity) {
        showErrorMessage('Your wallet is not configured for Convergence settings access.', 'ssh');
        return;
    }

    console.log('[Settings] User identity:', userIdentity);

    // Update UI with user information
    updateAccountInfo();
    setupTabNavigation();
    setupSSHKeyDownload();
    setupOnboardingButtons();

    // Setup event listeners
    document.getElementById('downloadSSHBtn')?.addEventListener('click', downloadSSHKey);
    document.getElementById('startOnboardingBtn')?.addEventListener('click', () => {
        window.location.href = '/onboarding.html';
    });
    document.getElementById('printGuideBtn')?.addEventListener('click', printSetupGuide);
}

/**
 * Show authentication required message
 */
function showAuthRequired() {
    const authRequired = document.getElementById('authRequired');
    const settingsSection = document.getElementById('settingsSection');

    if (authRequired) {
        authRequired.classList.add('active');
    }
    if (settingsSection) {
        settingsSection.classList.remove('active');
    }

    // Set up connect wallet button
    const connectBtn = document.getElementById('connectWalletBtn');
    if (connectBtn && typeof connectWallet !== 'undefined') {
        connectBtn.onclick = connectWallet;
    }
}

/**
 * Hide authentication required message
 */
function hideAuthRequired() {
    const authRequired = document.getElementById('authRequired');
    const settingsSection = document.getElementById('settingsSection');

    if (authRequired) {
        authRequired.classList.remove('active');
    }
    if (settingsSection) {
        settingsSection.classList.add('active');
    }
}

/**
 * Update account information display
 */
function updateAccountInfo() {
    if (!userIdentity) return;

    // Wallet address
    const walletDisplay = document.getElementById('walletAddressDisplay');
    if (walletDisplay) {
        walletDisplay.textContent = userAddress;
    }

    // Identity
    const identityDisplay = document.getElementById('identityDisplay');
    if (identityDisplay) {
        identityDisplay.textContent = userIdentity.displayName || userIdentity.identity;
    }

    // Role
    const roleDisplay = document.getElementById('roleDisplay');
    if (roleDisplay) {
        const roleText = userIdentity.role.charAt(0).toUpperCase() + userIdentity.role.slice(1);
        roleDisplay.textContent = roleText;
    }

    // Permissions
    const permissionsDisplay = document.getElementById('permissionsDisplay');
    if (permissionsDisplay && userIdentity.permissions) {
        let html = '';
        userIdentity.permissions.forEach(perm => {
            const formatted = perm.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            html += `<span class="permission-badge">${formatted}</span>`;
        });
        permissionsDisplay.innerHTML = html;
    }

    // Admin status
    const adminIndicator = document.getElementById('adminStatusIndicator');
    const adminText = document.getElementById('adminStatusText');
    if (adminIndicator && adminText) {
        if (userIdentity.hasAdmin) {
            adminIndicator.classList.add('active');
            adminIndicator.classList.remove('inactive');
            adminText.textContent = 'Yes - Admin access enabled';
        } else {
            adminIndicator.classList.add('inactive');
            adminIndicator.classList.remove('active');
            adminText.textContent = 'No - Standard user access';
        }
    }
}

/**
 * Set up tab navigation
 */
function setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;

            // Remove active from all
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Add active to clicked
            button.classList.add('active');
            document.querySelector(`.tab-content[data-content="${tabName}"]`)?.classList.add('active');
        });
    });
}

/**
 * Set up SSH key download
 */
function setupSSHKeyDownload() {
    const downloadBtn = document.getElementById('downloadSSHBtn');
    if (downloadBtn && typeof userAddress !== 'undefined') {
        downloadBtn.disabled = false;
    }
}

/**
 * Download SSH key
 */
async function downloadSSHKey() {
    if (!userIdentity || !userIdentity.canDownloadKey) {
        showErrorMessage('You do not have permission to download SSH keys.', 'ssh');
        return;
    }

    try {
        const downloadBtn = document.getElementById('downloadSSHBtn');
        const originalText = downloadBtn.textContent;
        downloadBtn.textContent = 'Downloading...';
        downloadBtn.disabled = true;

        // Fetch SSH public key from server
        const response = await fetch(`/api/ssh-key/${userAddress.toLowerCase()}`);

        if (!response.ok) {
            throw new Error(`Server error: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Failed to retrieve SSH key');
        }

        // Create and download file
        const element = document.createElement('a');
        const file = new Blob([data.publicKey], {type: 'text/plain'});
        element.href = URL.createObjectURL(file);
        element.download = `convergence-ssh-${userIdentity.identity}-key.pub`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);

        showSuccessMessage('SSH public key downloaded successfully!', 'ssh');
        downloadBtn.textContent = originalText;
        downloadBtn.disabled = false;

    } catch (error) {
        console.error('SSH key download error:', error);
        showErrorMessage(`Failed to download SSH key: ${error.message}`, 'ssh');
        const downloadBtn = document.getElementById('downloadSSHBtn');
        downloadBtn.textContent = 'Download SSH Public Key';
        downloadBtn.disabled = false;
    }
}

/**
 * Set up onboarding buttons
 */
function setupOnboardingButtons() {
    const startBtn = document.getElementById('startOnboardingBtn');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            window.location.href = '/onboarding.html';
        });
    }
}

/**
 * Print setup guide
 */
function printSetupGuide() {
    window.print();
}

/**
 * Copy text to clipboard
 */
function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const text = element.textContent;
    navigator.clipboard.writeText(text).then(() => {
        showSuccessMessage('Copied to clipboard!', 'account');
    }).catch(err => {
        showErrorMessage('Failed to copy to clipboard', 'account');
    });
}

/**
 * Show success message
 */
function showSuccessMessage(message, tab = 'ssh') {
    const messageElement = document.getElementById('sshSuccess');
    if (messageElement) {
        messageElement.textContent = message;
        messageElement.classList.add('show');

        // Auto-hide after 4 seconds
        setTimeout(() => {
            messageElement.classList.remove('show');
        }, 4000);
    }
}

/**
 * Show error message
 */
function showErrorMessage(message, tab = 'ssh') {
    const messageElement = document.getElementById('sshError');
    if (messageElement) {
        messageElement.textContent = message;
        messageElement.classList.add('show');

        // Auto-hide after 6 seconds
        setTimeout(() => {
            messageElement.classList.remove('show');
        }, 6000);
    }
}
