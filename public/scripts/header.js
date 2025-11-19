document.addEventListener("DOMContentLoaded", async () => {
    const headerPlaceholder = document.getElementById('header-placeholder');
    if (headerPlaceholder) {
        try {
            const response = await fetch('/header.html');
            const headerHTML = await response.text();
            headerPlaceholder.innerHTML = headerHTML;
            
            // Now that the header is loaded, initialize wallet connection
            initializeWallet();
        } catch (error) {
            console.error('Error loading header:', error);
        }
    }
});

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

async function connectWallet() {
    try {
        if (typeof window.ethereum === 'undefined') {
            alert('Please install MetaMask!');
            return;
        }

        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        userAddress = accounts[0];

        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (chainId !== REQUIRED_CHAIN_ID) {
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: REQUIRED_CHAIN_ID }],
                });
            } catch (switchError) {
                alert(`Please switch to ${NETWORK_NAME} in MetaMask`);
                return;
            }
        }

        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();

        governanceContract = new ethers.Contract(governanceAddress, governanceAbi, signer);
        tallyTokenContract = new ethers.Contract(tallyTokenAddress, tallyTokenAbi, signer);
        trustTokenContract = new ethers.Contract(trustTokenAddress, trustTokenAbi, signer);

        updateUI();
        
        // Dispatch a custom event to notify other scripts that the wallet is connected
        document.dispatchEvent(new CustomEvent('walletConnected'));

    } catch (error) {
        console.error('Error connecting wallet:', error);
    }
}

function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        userAddress = null;
        provider = null;
        signer = null;
        governanceContract = null;
        tallyTokenContract = null;
        trustTokenContract = null;
        updateUI();
    } else {
        userAddress = accounts[0];
        connectWallet();
    }
}

async function updateUI() {
    const walletBtn = document.getElementById('walletButton');
    const walletDetails = document.getElementById('wallet-details');
    const walletAddressEl = document.getElementById('wallet-address');
    const nftStatusEl = document.getElementById('nft-status');
    const tallyBalanceEl = document.getElementById('tally-balance');
    const trustBalanceEl = document.getElementById('trust-balance');

    // Check if required elements exist
    if (!walletBtn || !walletDetails) {
        console.error('Wallet UI elements not found');
        return;
    }

    if (userAddress) {
        walletBtn.textContent = userAddress.substring(0, 6) + '...' + userAddress.substring(38);
        walletDetails.style.display = 'block';
        if (walletAddressEl) walletAddressEl.textContent = userAddress;

        if (governanceContract && nftStatusEl) {
            try {
                const nftId = await governanceContract.tokenOf(userAddress);
                nftStatusEl.textContent = nftId.toString() !== '0' ? `Yes (ID: ${nftId.toString()})` : 'No';
            } catch (error) {
                console.error('Error fetching NFT status:', error);
                nftStatusEl.textContent = 'Error';
            }
        }

        if (tallyTokenContract && tallyBalanceEl) {
            try {
                const tallyBalance = await tallyTokenContract.balanceOf(userAddress);
                tallyBalanceEl.textContent = ethers.utils.formatEther(tallyBalance);
            } catch (error) {
                console.error('Error fetching Tally balance:', error);
                tallyBalanceEl.textContent = 'Error';
            }
        }

        if (trustTokenContract && trustBalanceEl) {
            try {
                const trustBalance = await trustTokenContract.balanceOf(userAddress);
                trustBalanceEl.textContent = ethers.utils.formatEther(trustBalance);
            } catch (error) {
                console.error('Error fetching Trust balance:', error);
                trustBalanceEl.textContent = 'Error';
            }
        }

    } else {
        walletBtn.textContent = 'Connect Wallet';
        walletDetails.style.display = 'none';
    }
}
