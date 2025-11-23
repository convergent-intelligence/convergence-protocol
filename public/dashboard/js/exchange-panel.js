// ============================================
// EXCHANGE PANEL MODULE
// Zero-fee TALLY exchange functionality
// ============================================

const ExchangePanel = (() => {
    let exchangeState = {
        buyAmount: 0,
        sellAmount: 0,
        selectedStablecoin: 'USDC',
        slippage: 0.5,
        liquidity: 1000000
    };

    // Initialize
    function init() {
        console.log('🔄 Exchange panel initializing...');
        setupEventListeners();
        updateExchangeRates();
    }

    // Setup event listeners
    function setupEventListeners() {
        // Buy side
        const buyAmountInput = document.getElementById('buyAmount');
        if (buyAmountInput) {
            buyAmountInput.addEventListener('input', handleBuyAmountChange);
        }

        // Sell side
        const sellAmountInput = document.getElementById('sellAmount');
        if (sellAmountInput) {
            sellAmountInput.addEventListener('input', handleSellAmountChange);
        }

        // Stablecoin selectors
        const buyStablecoin = document.getElementById('buyStablecoin');
        if (buyStablecoin) {
            buyStablecoin.addEventListener('change', updateExchangeRates);
        }

        const sellStablecoin = document.getElementById('sellStablecoin');
        if (sellStablecoin) {
            sellStablecoin.addEventListener('change', updateExchangeRates);
        }

        // Exchange buttons
        const buyBtn = document.querySelector('.buy-btn');
        if (buyBtn) {
            buyBtn.addEventListener('click', handleBuyTally);
        }

        const sellBtn = document.querySelector('.sell-btn');
        if (sellBtn) {
            sellBtn.addEventListener('click', handleSellTally);
        }

        // Max buttons
        document.querySelectorAll('.max-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const inputId = e.target.previousElementSibling.id;
                if (inputId === 'buyAmount') {
                    document.getElementById('buyAmount').value = '10000'; // Demo max
                    handleBuyAmountChange();
                } else if (inputId === 'sellAmount') {
                    document.getElementById('sellAmount').value = '5000000'; // Demo max
                    handleSellAmountChange();
                }
            });
        });
    }

    // Handle buy amount change
    function handleBuyAmountChange() {
        const buyAmount = parseFloat(document.getElementById('buyAmount').value) || 0;
        const tallyPrice = Dashboard.state.realTimeData.tallyPrice;

        if (tallyPrice === 0) return;

        const tallyReceive = buyAmount / tallyPrice;
        const fee = buyAmount * 0; // 0% fee
        const youSave = buyAmount * 0.01; // Typical CEX fee is ~1%

        document.getElementById('buyReceive').value = formatNumber(tallyReceive);
        document.getElementById('buySavings').textContent = `$${formatCurrency(youSave)}`;

        exchangeState.buyAmount = buyAmount;
    }

    // Handle sell amount change
    function handleSellAmountChange() {
        const sellAmount = parseFloat(document.getElementById('sellAmount').value) || 0;
        const tallyPrice = Dashboard.state.realTimeData.tallyPrice;

        if (tallyPrice === 0) return;

        const receiveAmount = sellAmount * tallyPrice;
        const fee = receiveAmount * 0; // 0% fee
        const youSave = receiveAmount * 0.01; // Typical CEX fee is ~1%

        document.getElementById('sellReceive').value = formatCurrency(receiveAmount);
        document.getElementById('sellSavings').textContent = `$${formatCurrency(youSave)}`;

        exchangeState.sellAmount = sellAmount;
    }

    // Update exchange rates
    async function updateExchangeRates() {
        const tallyPrice = Dashboard.state.realTimeData.tallyPrice;

        if (tallyPrice > 0) {
            document.getElementById('exchangePrice').textContent = `$${tallyPrice.toFixed(6)}`;
            document.getElementById('sellExchangePrice').textContent = `$${tallyPrice.toFixed(6)}`;

            // Update slippage calculation
            calculateSlippage();
        }

        // Update exchange stats
        updateExchangeStats();
    }

    // Calculate slippage impact
    function calculateSlippage() {
        const impact = Math.min((exchangeState.buyAmount + exchangeState.sellAmount) / 100000 * 0.1, 2);
        exchangeState.slippage = Math.max(0, impact);

        const slippageEl = document.getElementById('slippagePercent');
        if (slippageEl) {
            slippageEl.textContent = `${exchangeState.slippage.toFixed(2)}%`;
            slippageEl.className = exchangeState.slippage < 0.5 ? 'good' : exchangeState.slippage < 1 ? 'warning' : 'bad';
        }
    }

    // Update exchange statistics
    async function updateExchangeStats() {
        try {
            // 24h volume (demo)
            const volume24h = 5000000 + Math.random() * 1000000;
            document.getElementById('exchangeVolume').textContent = `$${formatCurrency(volume24h)}`;

            // Buy/sell ratio (demo)
            const ratio = Math.round(50 + Math.random() * 10);
            document.getElementById('buySellRatio').textContent = `${ratio}/${100 - ratio}`;

            // Liquidity
            document.getElementById('liquidity').textContent = `$${formatCurrency(exchangeState.liquidity)}`;

        } catch (error) {
            console.error('Error updating exchange stats:', error);
        }
    }

    // Handle buy TALLY
    async function handleBuyTally() {
        if (!Dashboard.state.connected) {
            alert('Please connect your wallet first');
            return;
        }

        const amount = parseFloat(document.getElementById('buyAmount').value);
        if (amount <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        try {
            // Convert amount to wei
            const stablecoinAddress = getStablecoinAddress(document.getElementById('buyStablecoin').value);
            const amountWei = ethers.parseUnits(amount.toString(), 18);

            console.log(`💰 Buying TALLY with ${amount} ${document.getElementById('buyStablecoin').value}...`);

            if (Dashboard.state.contracts.tallyExchange) {
                // Call buyTally on smart contract
                const tx = await Dashboard.state.contracts.tallyExchange.buyTally(
                    stablecoinAddress,
                    amountWei
                );

                console.log(`📝 Transaction sent: ${tx.hash}`);

                // Wait for confirmation
                const receipt = await tx.wait();
                console.log(`✅ Transaction confirmed: ${receipt.blockNumber}`);

                // Update UI
                document.getElementById('buyAmount').value = '';
                document.getElementById('buyReceive').value = '';

                alert(`✅ Successfully purchased TALLY!\nTransaction: ${receipt.transactionHash}`);

            } else {
                // Demo mode
                alert(`✅ Demo: Would buy ${(amount / Dashboard.state.realTimeData.tallyPrice).toFixed(0)} TALLY`);
                document.getElementById('buyAmount').value = '';
                document.getElementById('buyReceive').value = '';
            }

        } catch (error) {
            console.error('❌ Buy error:', error);
            alert(`Error: ${error.message}`);
        }
    }

    // Handle sell TALLY
    async function handleSellTally() {
        if (!Dashboard.state.connected) {
            alert('Please connect your wallet first');
            return;
        }

        const amount = parseFloat(document.getElementById('sellAmount').value);
        if (amount <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        try {
            const stablecoinAddress = getStablecoinAddress(document.getElementById('sellStablecoin').value);
            const amountWei = ethers.parseUnits(amount.toString(), 18);

            console.log(`🔄 Selling ${amount} TALLY...`);

            if (Dashboard.state.contracts.tallyExchange) {
                // Call sellTally on smart contract
                const tx = await Dashboard.state.contracts.tallyExchange.sellTally(
                    amountWei,
                    stablecoinAddress
                );

                console.log(`📝 Transaction sent: ${tx.hash}`);
                const receipt = await tx.wait();
                console.log(`✅ Transaction confirmed`);

                // Update UI
                document.getElementById('sellAmount').value = '';
                document.getElementById('sellReceive').value = '';

                alert(`✅ Successfully sold TALLY!\nReceived: $${formatCurrency(amount * Dashboard.state.realTimeData.tallyPrice)}`);

            } else {
                // Demo mode
                alert(`✅ Demo: Would sell ${amount} TALLY for $${formatCurrency(amount * Dashboard.state.realTimeData.tallyPrice)}`);
                document.getElementById('sellAmount').value = '';
                document.getElementById('sellReceive').value = '';
            }

        } catch (error) {
            console.error('❌ Sell error:', error);
            alert(`Error: ${error.message}`);
        }
    }

    // Get stablecoin address
    function getStablecoinAddress(symbol) {
        const addresses = {
            'USDC': process.env.REACT_APP_USDC_ADDRESS || '0x...',
            'USDT': process.env.REACT_APP_USDT_ADDRESS || '0x...',
            'BUSD': process.env.REACT_APP_BUSD_ADDRESS || '0x...'
        };
        return addresses[symbol];
    }

    // Format helper (import from dashboard.js)
    function formatCurrency(value) {
        return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function formatNumber(value) {
        return value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }

    return {
        init,
        getExchangeState: () => exchangeState,
        updateExchangeRates
    };
})();

// Initialize when document is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ExchangePanel.init());
} else {
    ExchangePanel.init();
}

console.log('✅ exchange-panel.js loaded');
