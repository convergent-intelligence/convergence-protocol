// ============================================
// DONATION PORTAL MODULE
// Multi-chain donation addresses with QR codes
// ============================================

const DonationPortal = (() => {
    const donationAddresses = {
        bitcoin: {
            address: 'bc1qg9gvc63lj7ssdenjnem6kycpxde5u7fheypgpm',
            network: 'Bitcoin Mainnet',
            icon: '₿',
            link: 'bitcoin:bc1qg9gvc63lj7ssdenjnem6kycpxde5u7fheypgpm?label=Convergence%20Protocol'
        },
        ethereum: {
            address: '0x1234567890123456789012345678901234567890',
            network: 'Ethereum Mainnet',
            icon: 'Ξ',
            link: 'ethereum:0x1234567890123456789012345678901234567890'
        },
        tron: {
            address: 'TN3W4H6rK833nnLEmCqbYXC3PvLpLfEQGP',
            network: 'Tron Mainnet',
            icon: '🔗',
            link: 'https://tronscan.org/#/address/TN3W4H6rK833nnLEmCqbYXC3PvLpLfEQGP'
        },
        solana: {
            address: '4zMMUHXUomBCFEuXUtzjAQXLCxZ6ohsKPmPPgFqF9Sj8',
            network: 'Solana Mainnet',
            icon: '◎',
            link: 'https://solscan.io/account/4zMMUHXUomBCFEuXUtzjAQXLCxZ6ohsKPmPPgFqF9Sj8'
        },
        cosmos: {
            address: 'cosmos1x2vc3rwf0r4ww0rfnwu9lrcw39s6kr0k0h99z8',
            network: 'Cosmos Hub',
            icon: '⚛',
            link: 'https://www.mintscan.io/cosmos/account/cosmos1x2vc3rwf0r4ww0rfnwu9lrcw39s6kr0k0h99z8'
        },
        dogecoin: {
            address: 'DTqKbfBz7YZ8wvB9XnF3m6fJwYvJvFk7yZ',
            network: 'Dogecoin Mainnet',
            icon: '🐕',
            link: 'dogecoin:DTqKbfBz7YZ8wvB9XnF3m6fJwYvJvFk7yZ?label=Convergence%20Protocol'
        }
    };

    let currentNetwork = 'bitcoin';
    let qrCodeInstance = null;

    // Initialize
    function init() {
        console.log('💰 Donation portal initializing...');
        setupNetworkButtons();
        setupDonationInputs();
        setDefaultNetwork();
    }

    // Setup network buttons
    function setupNetworkButtons() {
        const networkBtns = document.querySelectorAll('.network-btn');

        networkBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const network = btn.getAttribute('data-network');
                selectNetwork(network);
            });
        });
    }

    // Select network
    function selectNetwork(network) {
        if (!donationAddresses[network]) return;

        currentNetwork = network;
        const data = donationAddresses[network];

        // Update button states
        document.querySelectorAll('.network-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-network="${network}"]`).classList.add('active');

        // Update donation display
        updateDonationDisplay(data);

        console.log(`📍 Selected network: ${network}`);
    }

    // Update donation display
    function updateDonationDisplay(data) {
        // Update header
        document.getElementById('donationNetworkName').textContent = `${data.network} Donation Address`;

        // Update address
        const addressInput = document.getElementById('donationAddress');
        if (addressInput) {
            addressInput.value = data.address;
        }

        // Update link
        const linkInput = document.getElementById('donationLink');
        if (linkInput) {
            linkInput.value = data.link;
        }

        // Generate and display QR code
        generateQRCode(data.address, data.network);

        // Reset donation estimator
        resetDonationEstimator();
    }

    // Generate QR code
    function generateQRCode(address, networkName) {
        const qrContainer = document.getElementById('qrCode');
        if (!qrContainer) return;

        // Clear previous QR code
        qrContainer.innerHTML = '';

        // Create new QR code
        try {
            qrCodeInstance = new QRCode(qrContainer, {
                text: address,
                width: 200,
                height: 200,
                colorDark: '#1f2937',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.H
            });

            console.log(`✅ QR code generated for ${networkName}`);
        } catch (error) {
            console.error('QR code generation error:', error);
            qrContainer.innerHTML = '<p style="padding: 2rem; color: red;">QR Code generation failed</p>';
        }
    }

    // Setup donation inputs
    function setupDonationInputs() {
        const donationAmount = document.getElementById('donationAmount');
        if (donationAmount) {
            donationAmount.addEventListener('input', updateDonationEstimate);
        }

        const donationCurrency = document.getElementById('donationCurrency');
        if (donationCurrency) {
            donationCurrency.addEventListener('change', updateDonationEstimate);
        }
    }

    // Update donation estimate
    function updateDonationEstimate() {
        const amount = parseFloat(document.getElementById('donationAmount').value) || 0;
        const currency = document.getElementById('donationCurrency').value;
        const tallyPrice = Dashboard.state.realTimeData.tallyPrice;

        if (amount <= 0 || tallyPrice === 0) {
            resetDonationEstimate();
            return;
        }

        // Calculate TALLY received (0% fee)
        const donationUSD = currency === 'USD' ? amount : getNetworkPrice(currentNetwork) * amount;
        const tallyReceived = donationUSD / tallyPrice;
        const fee = 0;

        // Update UI
        document.getElementById('donationFee').textContent = `$${(fee).toFixed(2)} (0%)`;
        document.getElementById('donationTallyReceive').textContent = `${formatNumber(tallyReceived)} TALLY`;
        document.getElementById('donationPriceAtDonation').textContent = `$${tallyPrice.toFixed(6)}/TALLY`;
    }

    // Reset donation estimate
    function resetDonationEstimate() {
        document.getElementById('donationFee').textContent = '$0.00 (0%)';
        document.getElementById('donationTallyReceive').textContent = '0 TALLY';
        document.getElementById('donationPriceAtDonation').textContent = '$0.00/TALLY';
    }

    // Reset all donation inputs
    function resetDonationEstimator() {
        document.getElementById('donationAmount').value = '';
        resetDonationEstimate();
    }

    // Get network price
    function getNetworkPrice(network) {
        const prices = {
            bitcoin: 45000,
            ethereum: 1750,
            tron: 0.125,
            solana: 175,
            cosmos: 8.5,
            dogecoin: 0.12
        };
        return prices[network] || 1;
    }

    // Set default network on load
    function setDefaultNetwork() {
        selectNetwork('bitcoin');
    }

    // Get donation data
    function getDonationData() {
        return {
            network: currentNetwork,
            address: donationAddresses[currentNetwork].address,
            amount: parseFloat(document.getElementById('donationAmount').value) || 0,
            tally: parseFloat(document.getElementById('donationTallyReceive').textContent) || 0
        };
    }

    // Format helpers
    function formatNumber(value) {
        return value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }

    return {
        init,
        selectNetwork,
        getDonationData,
        getAddresses: () => donationAddresses
    };
})();

// Initialize when document is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => DonationPortal.init());
} else {
    DonationPortal.init();
}

console.log('✅ donation-portal.js loaded');
