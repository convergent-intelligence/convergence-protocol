// Leviticus wallet address (the one that should have access)
const LEVITICUS_WALLET = '0xfa7ec55f455bcbebb4ba17bfa0938f86eb8a94d0'.toLowerCase();

// Listen for wallet connection event from header.js
document.addEventListener('walletConnected', () => {
    verifyWalletAccess();
});

// Override the connectWallet button on this page
document.addEventListener('DOMContentLoaded', () => {
    const connectBtn = document.getElementById('connectWalletBtn');
    if (connectBtn) {
        connectBtn.addEventListener('click', initiateWalletConnection);
    }

    const disconnectBtn = document.getElementById('disconnectBtn');
    if (disconnectBtn) {
        disconnectBtn.addEventListener('click', disconnectWallet);
    }

    // Check if wallet is already connected
    if (typeof window.ethereum !== 'undefined' && userAddress) {
        verifyWalletAccess();
    }
});

async function initiateWalletConnection() {
    try {
        if (typeof window.ethereum === 'undefined') {
            alert('Please install MetaMask or another Web3 wallet!');
            return;
        }

        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        userAddress = accounts[0];

        // Switch to the correct chain (Ethereum Mainnet)
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (chainId !== '0x1') {
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: '0x1' }],
                });
            } catch (switchError) {
                alert('Please switch to Ethereum Mainnet in your wallet');
                return;
            }
        }

        // Set up provider
        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();

        // Verify wallet access
        verifyWalletAccess();

        // Dispatch event for other scripts
        document.dispatchEvent(new CustomEvent('walletConnected'));

    } catch (error) {
        console.error('Error connecting wallet:', error);
        alert('Error connecting wallet. Please try again.');
    }
}

function verifyWalletAccess() {
    const walletCheckSection = document.getElementById('walletCheckSection');
    const wrongWalletSection = document.getElementById('wrongWalletSection');
    const onboardingContent = document.getElementById('onboardingContent');

    if (!userAddress) {
        // No wallet connected
        walletCheckSection.style.display = 'block';
        wrongWalletSection.style.display = 'none';
        onboardingContent.classList.remove('visible');
        return;
    }

    const connectedWallet = userAddress.toLowerCase();
    const connectedWalletDisplay = document.getElementById('connectedWalletDisplay');

    if (connectedWallet === LEVITICUS_WALLET) {
        // Correct wallet - show onboarding content
        walletCheckSection.style.display = 'none';
        wrongWalletSection.style.display = 'none';
        onboardingContent.classList.add('visible');

        // Save to localStorage that they've accessed this
        localStorage.setItem('leviticus-accessed-onboarding', 'true');
        localStorage.setItem('leviticus-wallet-verified', connectedWallet);

        // Try to fetch and display credentials
        fetchAndDisplayCredentials(connectedWallet);

    } else {
        // Wrong wallet - show warning
        walletCheckSection.style.display = 'none';
        wrongWalletSection.style.display = 'block';
        onboardingContent.classList.remove('visible');

        // Display the connected wallet for reference
        if (connectedWalletDisplay) {
            connectedWalletDisplay.textContent = connectedWallet;
        }
    }
}

function disconnectWallet() {
    userAddress = null;
    provider = null;
    signer = null;

    const walletCheckSection = document.getElementById('walletCheckSection');
    const wrongWalletSection = document.getElementById('wrongWalletSection');
    const onboardingContent = document.getElementById('onboardingContent');

    walletCheckSection.style.display = 'block';
    wrongWalletSection.style.display = 'none';
    onboardingContent.classList.remove('visible');
}

// Listen for account changes
if (typeof window.ethereum !== 'undefined') {
    window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
            // Wallet disconnected
            disconnectWallet();
        } else {
            // Account changed
            userAddress = accounts[0];
            verifyWalletAccess();
        }
    });

    // Listen for chain changes
    window.ethereum.on('chainChanged', () => {
        // Page will reload, which is fine for this onboarding page
        window.location.reload();
    });
}

// Fetch and display credentials from the server
async function fetchAndDisplayCredentials(walletAddress) {
    try {
        const response = await fetch(`/api/credentials/${walletAddress}`);

        if (!response.ok) {
            // Credentials not yet available
            console.log('Credentials not yet available for this wallet');
            return;
        }

        const data = await response.json();

        if (data.success && data.credentials) {
            displayCredentialSection(data);
        }

    } catch (error) {
        console.error('Error fetching credentials:', error);
        // Silently fail - credentials might not be set up yet
    }
}

function displayCredentialSection(credentialData) {
    // Create credentials section if it doesn't exist
    let credsSection = document.getElementById('credentials-section');

    if (!credsSection) {
        // Insert after the success badge section
        const onboardingContent = document.getElementById('onboardingContent');
        if (!onboardingContent) return;

        credsSection = document.createElement('div');
        credsSection.id = 'credentials-section';
        credsSection.style.cssText = `
            background: var(--light);
            border: 2px solid var(--success);
            border-radius: 8px;
            padding: 2rem;
            margin: 2rem 0;
        `;

        // Insert after wallet status section
        const walletStatusDiv = onboardingContent.querySelector('.wallet-check.success');
        if (walletStatusDiv && walletStatusDiv.nextSibling) {
            walletStatusDiv.parentNode.insertBefore(credsSection, walletStatusDiv.nextSibling);
        } else {
            onboardingContent.insertBefore(credsSection, onboardingContent.firstChild.nextSibling);
        }
    }

    const creds = credentialData.credentials;

    credsSection.innerHTML = `
        <h2 style="margin-top: 0; color: var(--success);">🔑 Your Credentials</h2>

        <div style="background: white; padding: 1.5rem; border-radius: 6px; margin: 1rem 0;">
            <h3 style="margin-top: 0; font-size: 1rem; color: #666;">SSH Connection Details</h3>

            <div style="font-family: monospace; background: #f5f5f5; padding: 1rem; border-radius: 4px; margin: 1rem 0; font-size: 0.9rem;">
                <div style="margin: 0.5rem 0;"><strong>Server:</strong> ${creds.server_address}</div>
                <div style="margin: 0.5rem 0;"><strong>Port:</strong> ${creds.port}</div>
                <div style="margin: 0.5rem 0;"><strong>Username:</strong> ${creds.username}</div>
            </div>

            <button onclick="copyToClipboard('${creds.server_address}:${creds.port}')" class="copy-button" style="background: var(--primary); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 4px; cursor: pointer; margin-right: 0.5rem;">
                📋 Copy Server Address
            </button>

            <button onclick="toggleSSHKey()" class="toggle-button" style="background: var(--accent); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 4px; cursor: pointer;">
                🔐 Show SSH Key
            </button>
        </div>

        <div id="ssh-key-section" style="display: none; margin-top: 1.5rem; padding: 1.5rem; background: white; border-radius: 6px; border: 1px solid #ddd;">
            <h3 style="margin-top: 0; font-size: 1rem; color: #f44336;">⚠️ Private SSH Key</h3>
            <p style="color: #666; font-size: 0.9rem; margin-bottom: 1rem;">
                Keep this key secure. Never share it. Store it safely on your local machine with 600 permissions.
            </p>

            <textarea id="ssh-key-display" readonly style="width: 100%; height: 300px; font-family: monospace; font-size: 0.8rem; padding: 1rem; border: 1px solid #ddd; border-radius: 4px; background: #f9f9f9; word-wrap: break-word; white-space: pre-wrap;">Loading...</textarea>

            <div style="margin-top: 1rem;">
                <button onclick="copSSHKey()" class="copy-button" style="background: #f44336; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 4px; cursor: pointer; margin-right: 0.5rem;">
                    📋 Copy Private Key
                </button>

                <button onclick="downloadSSHKey('${credentialData.wallet}')" class="download-button" style="background: #ff9800; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 4px; cursor: pointer;">
                    💾 Download Key File
                </button>
            </div>

            <div style="margin-top: 1.5rem; padding: 1rem; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                <strong>Setup Instructions:</strong>
                <pre style="margin-top: 0.5rem; font-size: 0.85rem; white-space: pre-wrap;">${escapeHtml(creds.instructions || 'Save the key to ~/.ssh/id_ed25519\nRun: chmod 600 ~/.ssh/id_ed25519\nConnect: ssh ' + creds.username + '@' + creds.server_address + ' -p ' + creds.port)}</pre>
            </div>
        </div>

        <script>
            function toggleSSHKey() {
                const keySection = document.getElementById('ssh-key-section');
                const keyDisplay = document.getElementById('ssh-key-display');

                if (keySection.style.display === 'none') {
                    keySection.style.display = 'block';
                    // Show actual key (you'd need to pass it from server)
                    keyDisplay.textContent = '${escapeHtml(creds.ssh_key)}';
                    document.querySelector('.toggle-button').textContent = '🔓 Hide SSH Key';
                } else {
                    keySection.style.display = 'none';
                    document.querySelector('.toggle-button').textContent = '🔐 Show SSH Key';
                }
            }

            function copyToClipboard(text) {
                navigator.clipboard.writeText(text).then(() => {
                    alert('✓ Copied to clipboard!');
                }).catch(() => {
                    alert('Failed to copy');
                });
            }

            function copSSHKey() {
                const keyDisplay = document.getElementById('ssh-key-display');
                navigator.clipboard.writeText(keyDisplay.textContent).then(() => {
                    alert('✓ SSH key copied to clipboard!');
                }).catch(() => {
                    alert('Failed to copy');
                });
            }

            function downloadSSHKey(wallet) {
                const keyDisplay = document.getElementById('ssh-key-display');
                const element = document.createElement('a');
                element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(keyDisplay.textContent));
                element.setAttribute('download', 'leviticus-ssh-key');
                element.style.display = 'none';
                document.body.appendChild(element);
                element.click();
                document.body.removeChild(element);
            }

            function escapeHtml(text) {
                const map = {
                    '&': '&amp;',
                    '<': '&lt;',
                    '>': '&gt;',
                    '"': '&quot;',
                    "'": '&#039;'
                };
                return text.replace(/[&<>"']/g, m => map[m]);
            }
        </script>
    `;
}

// Keyboard shortcut to show current state (for debugging)
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'L') {
        console.log('Leviticus Onboarding State:');
        console.log('Connected Wallet:', userAddress);
        console.log('Leviticus Wallet:', LEVITICUS_WALLET);
        console.log('Match:', userAddress?.toLowerCase() === LEVITICUS_WALLET);
    }
});

// Utility function to escape HTML
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}
