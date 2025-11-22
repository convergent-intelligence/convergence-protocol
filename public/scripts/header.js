let scrollTimeout;
let lastScrollTop = 0;
const header = document.getElementById('main-header') || document.querySelector('header');

document.addEventListener("DOMContentLoaded", async () => {
    const headerPlaceholder = document.getElementById('header-placeholder');
    if (headerPlaceholder) {
        try {
            const response = await fetch('/header.html');
            const headerHTML = await response.text();
            headerPlaceholder.innerHTML = headerHTML;

            // Initialize header features
            initializeHeaderFeatures();
            initializeWallet();
        } catch (error) {
            console.error('Error loading header:', error);
        }
    } else {
        // Header is already in the DOM
        initializeHeaderFeatures();
    }
});

// If header is already in DOM, initialize it on DOMContentLoaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeHeaderFeatures);
} else {
    initializeHeaderFeatures();
}

function initializeHeaderFeatures() {
    // Mobile menu toggle
    const navToggle = document.getElementById('nav-toggle');
    const mainNav = document.getElementById('main-nav');

    if (navToggle && mainNav) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            mainNav.classList.toggle('active');
        });

        // Close menu when a link is clicked
        mainNav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navToggle.classList.remove('active');
                mainNav.classList.remove('active');
            });
        });
    }

    // Wallet dropdown toggle
    const walletButton = document.getElementById('walletButton');
    const walletDropdown = document.getElementById('wallet-dropdown');
    const disconnectBtn = document.getElementById('disconnect-btn');

    if (walletButton && walletDropdown) {
        walletButton.addEventListener('click', (e) => {
            e.stopPropagation();
            // Only toggle if wallet is connected
            if (userAddress) {
                walletDropdown.classList.toggle('active');
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.wallet-status')) {
                walletDropdown.classList.remove('active');
            }
        });
    }

    // Disconnect button
    if (disconnectBtn) {
        disconnectBtn.addEventListener('click', disconnectWallet);
    }

    // Header scroll behavior - improved
    const mainHeader = document.getElementById('main-header') || document.querySelector('header');
    if (mainHeader) {
        let isHeaderVisible = true;
        let scrollDirection = 'down';

        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);

            const currentScroll = window.pageYOffset;

            // Determine scroll direction
            if (currentScroll < lastScrollTop) {
                scrollDirection = 'up';
            } else {
                scrollDirection = 'down';
            }

            // Show header when scrolling up
            if (scrollDirection === 'up' && !isHeaderVisible) {
                mainHeader.style.transform = 'translateY(0)';
                mainHeader.style.transition = 'transform 0.3s ease';
                isHeaderVisible = true;
            }
            // Hide header when scrolling down, but only after scrolling past 60px
            else if (scrollDirection === 'down' && currentScroll > 60 && isHeaderVisible) {
                mainHeader.style.transform = 'translateY(-100%)';
                mainHeader.style.transition = 'transform 0.3s ease';
                isHeaderVisible = false;
            }
            // Always show header at top of page
            else if (currentScroll <= 60 && !isHeaderVisible) {
                mainHeader.style.transform = 'translateY(0)';
                mainHeader.style.transition = 'transform 0.3s ease';
                isHeaderVisible = true;
            }

            lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
        });
    }
}

let provider = null;
let signer = null;
let userAddress = null;

// Network configuration
const NETWORKS = {
    MAINNET: { chainId: "0x1", name: "Ethereum Mainnet" },
    SEPOLIA: { chainId: "0xaa36a7", name: "Sepolia Testnet" }
};

// Set your target network here: 'MAINNET' or 'SEPOLIA'
const TARGET_NETWORK = 'MAINNET';  // Change to 'MAINNET' for production
const REQUIRED_CHAIN_ID = NETWORKS[TARGET_NETWORK].chainId;
const NETWORK_NAME = NETWORKS[TARGET_NETWORK].name;

let governanceContract = null;
let tallyTokenContract = null;
let trustTokenContract = null;

let governanceAbi = [];
let tallyTokenAbi = [];
let trustTokenAbi = [];

let governanceAddress = '';
let tallyTokenAddress = '';
let trustTokenAddress = '';

async function initializeWallet() {
    await loadContractABIs();
    
    const walletBtn = document.getElementById('walletButton');
    if(walletBtn) {
        walletBtn.onclick = connectWallet;
    }

    if (typeof window.ethereum !== 'undefined') {
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', () => window.location.reload());
        
        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                await connectWallet();
            }
        } catch (error) {
            console.error('Error checking for existing wallet connection:', error);
        }
    }
}

async function loadContractABIs() {
    try {
        const [govResponse, tallyResponse, trustResponse] = await Promise.all([
            fetch('/contracts/ConvergenceGovernance.json').catch(() => null),
            fetch('/contracts/TallyToken.json').catch(() => null),
            fetch('/contracts/TrustToken.json').catch(() => null)
        ]);

        if (govResponse && govResponse.ok) {
            const data = await govResponse.json();
            governanceAbi = data.abi;
            governanceAddress = data.address;
        }

        if (tallyResponse && tallyResponse.ok) {
            const data = await tallyResponse.json();
            tallyTokenAbi = data.abi;
            tallyTokenAddress = data.address;
        }
        
        if (trustResponse && trustResponse.ok) {
            const data = await trustResponse.json();
            trustTokenAbi = data.abi;
            trustTokenAddress = data.address;
        }
        console.log('All ABIs loaded');
    } catch (error) {
        console.error('Error loading contract ABIs:', error);
    }
}

const TRINITY_MEMBERS = [
    '0xdc20d621a88cb8908E8E7042431C55F0E9DAc6FB', // Genesis Human
    '0x6628227C195DAd7F7a8fD4F3D2cA3545A0D9CD22', // Agent
    '0x8Ffa5CAaBE8ee3d9019865120a654464BC4654cd'  // MetaMask #2
].map(a => a.toLowerCase());

async function connectWallet() {
    const walletBtn = document.getElementById('walletButton');
    if (!walletBtn) return;

    try {
        if (typeof window.ethereum === 'undefined') {
            showToast('MetaMask not installed. Please install it to continue.', 'error');
            return;
        }

        // Set loading state
        walletBtn.classList.add('loading');
        walletBtn.disabled = true;
        showToast('Connecting to wallet...', 'info');

        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        userAddress = accounts[0];
        console.log('[Wallet] Connected account:', userAddress);

        // Check if the user is a Trinity Member and redirect
        if (TRINITY_MEMBERS.includes(userAddress.toLowerCase())) {
            showToast('Welcome, Trinity Member!', 'success');
            // Check if already on the dashboard to prevent a redirect loop
            if (window.location.pathname !== '/dashboard.html') {
                setTimeout(() => {
                    window.location.href = '/dashboard.html';
                }, 1500);
                return;
            }
        }

        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (chainId !== REQUIRED_CHAIN_ID) {
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: REQUIRED_CHAIN_ID }],
                });
            } catch (switchError) {
                showToast(`Please switch to ${NETWORK_NAME} in your wallet`, 'warning');
                walletBtn.classList.remove('loading');
                walletBtn.disabled = false;
                return;
            }
        }

        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();

        governanceContract = new ethers.Contract(governanceAddress, governanceAbi, signer);
        tallyTokenContract = new ethers.Contract(tallyTokenAddress, tallyTokenAbi, signer);
        trustTokenContract = new ethers.Contract(trustTokenAddress, trustTokenAbi, signer);

        updateUI();
        showToast(`Wallet connected: ${userAddress.substring(0, 6)}...${userAddress.substring(38)}`, 'success');

        // Dispatch a custom event to notify other scripts that the wallet is connected
        document.dispatchEvent(new CustomEvent('walletConnected', { detail: { address: userAddress } }));

    } catch (error) {
        console.error('[Wallet] Error connecting wallet:', error);
        if (error.code === 4001) {
            showToast('Connection rejected. Please try again.', 'error');
        } else {
            showToast('Failed to connect wallet. Please try again.', 'error');
        }
    } finally {
        const btn = document.getElementById('walletButton');
        if (btn) {
            btn.classList.remove('loading');
            btn.disabled = false;
        }
    }
}

function disconnectWallet() {
    const walletDropdown = document.getElementById('wallet-dropdown');
    userAddress = null;
    provider = null;
    signer = null;
    governanceContract = null;
    tallyTokenContract = null;
    trustTokenContract = null;

    console.log('[Wallet] Disconnected');
    updateUI();

    if (walletDropdown) {
        walletDropdown.classList.remove('active');
    }

    showToast('Wallet disconnected', 'info');
    document.dispatchEvent(new CustomEvent('walletDisconnected'));
}

function handleAccountsChanged(accounts) {
    console.log('[Wallet] Accounts changed:', accounts);

    if (accounts.length === 0) {
        // User switched off all accounts in MetaMask
        userAddress = null;
        provider = null;
        signer = null;
        governanceContract = null;
        tallyTokenContract = null;
        trustTokenContract = null;
        updateUI();
        showToast('Wallet disconnected', 'warning');
        document.dispatchEvent(new CustomEvent('walletDisconnected'));
    } else if (accounts[0] !== userAddress) {
        // User switched to a different account
        console.log('[Wallet] Account switched from', userAddress, 'to', accounts[0]);
        userAddress = accounts[0];
        showToast(`Switched to: ${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`, 'info');
        updateUI();
        document.dispatchEvent(new CustomEvent('walletSwitched', { detail: { address: userAddress } }));
    }
}

async function updateUI() {
    const walletBtn = document.getElementById('walletButton');
    const walletDetails = document.getElementById('wallet-details');
    const walletAddressEl = document.getElementById('wallet-address');
    const nftStatusEl = document.getElementById('nft-status');
    const tallyBalanceEl = document.getElementById('tally-balance');
    const trustBalanceEl = document.getElementById('trust-balance');
    const nftIndicator = document.getElementById('nft-indicator');
    const statusIndicator = document.getElementById('status-indicator');
    const dropdownAddress = document.getElementById('dropdown-address');

    // Check if required elements exist
    if (!walletBtn || !walletDetails) {
        console.error('[Wallet] UI elements not found');
        return;
    }

    if (userAddress) {
        // Update wallet button
        const shortAddress = userAddress.substring(0, 6) + '...' + userAddress.substring(38);
        walletBtn.textContent = shortAddress;

        // Update status indicator
        if (statusIndicator) {
            statusIndicator.classList.add('connected');
            statusIndicator.title = 'Wallet connected';
        }

        // Update dropdown
        if (dropdownAddress) {
            dropdownAddress.textContent = shortAddress;
            dropdownAddress.title = userAddress;
        }

        // Update wallet details section
        walletDetails.style.display = 'block';
        if (walletAddressEl) walletAddressEl.textContent = userAddress;

        // Fetch NFT status
        let hasNFT = false;
        if (governanceContract && nftStatusEl) {
            try {
                const nftId = await governanceContract.tokenOf(userAddress);
                hasNFT = nftId.toString() !== '0';
                nftStatusEl.textContent = hasNFT ? `Yes (ID: ${nftId.toString()})` : 'No';
                console.log('[Wallet] NFT Status:', hasNFT ? `Holder of #${nftId.toString()}` : 'No NFT');
            } catch (error) {
                console.error('[Wallet] Error fetching NFT status:', error);
                nftStatusEl.textContent = 'Error';
            }
        }

        // Update NFT indicator badge
        if (nftIndicator) {
            if (hasNFT) {
                nftIndicator.innerHTML = '<div class="nft-badge" title="Genesis NFT Holder">✓</div>';
            } else {
                nftIndicator.innerHTML = '<div class="nft-badge hidden"></div>';
            }
        }

        // Fetch and display Tally balance
        if (tallyTokenContract && tallyBalanceEl) {
            try {
                const tallyBalance = await tallyTokenContract.balanceOf(userAddress);
                const tallyFormatted = ethers.utils.formatEther(tallyBalance);
                tallyBalanceEl.textContent = parseFloat(tallyFormatted).toFixed(2);

                // Update header token display
                const tallyHeaderEl = document.querySelector('[data-token="tally"]');
                if (tallyHeaderEl) {
                    tallyHeaderEl.textContent = shortenBalance(tallyFormatted);
                    tallyHeaderEl.classList.remove('loading');
                }
                console.log('[Wallet] TALLY Balance:', tallyFormatted);
            } catch (error) {
                console.error('[Wallet] Error fetching Tally balance:', error);
                tallyBalanceEl.textContent = 'Error';
            }
        }

        // Fetch and display Trust balance
        if (trustTokenContract && trustBalanceEl) {
            try {
                const trustBalance = await trustTokenContract.balanceOf(userAddress);
                const trustFormatted = ethers.utils.formatEther(trustBalance);
                trustBalanceEl.textContent = parseFloat(trustFormatted).toFixed(2);

                // Update header token display
                const trustHeaderEl = document.querySelector('[data-token="trust"]');
                if (trustHeaderEl) {
                    trustHeaderEl.textContent = shortenBalance(trustFormatted);
                    trustHeaderEl.classList.remove('loading');
                }
                console.log('[Wallet] TRUST Balance:', trustFormatted);
            } catch (error) {
                console.error('[Wallet] Error fetching Trust balance:', error);
                trustBalanceEl.textContent = 'Error';
            }
        }

    } else {
        // Wallet disconnected state
        walletBtn.textContent = 'Connect Wallet';
        walletDetails.style.display = 'none';

        // Update status indicator
        if (statusIndicator) {
            statusIndicator.classList.remove('connected');
            statusIndicator.title = 'Wallet disconnected';
        }

        // Clear token balances
        document.querySelectorAll('.token-balance').forEach(el => {
            el.textContent = '-';
            el.classList.add('loading');
        });

        // Clear NFT indicator
        if (nftIndicator) {
            nftIndicator.innerHTML = '';
        }

        // Reset dropdown
        if (dropdownAddress) {
            dropdownAddress.textContent = 'Not connected';
        }
    }
}

function shortenBalance(balance) {
    const num = parseFloat(balance);
    if (num === 0) return '0';
    if (num < 0.01) return '<0.01';
    if (num < 1) return num.toFixed(3);
    if (num < 1000) return num.toFixed(1);
    if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
    return (num / 1000000).toFixed(1) + 'M';
}

function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `connection-toast ${type}`;

    // Map type to emoji
    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };

    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <span>${message}</span>
    `;

    toastContainer.appendChild(toast);

    // Auto-remove after 4 seconds
    setTimeout(() => {
        toast.classList.add('closing');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 4000);

    console.log(`[Toast] ${type.toUpperCase()}: ${message}`);
}
