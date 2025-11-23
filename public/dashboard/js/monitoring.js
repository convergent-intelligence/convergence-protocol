// ============================================
// MONITORING MODULE
// Slippage monitoring, burn services, alerts
// ============================================

const Monitoring = (() => {
    let slippageThreshold = 1.0;
    let monitoringActive = true;
    let burnHistory = [];

    // Initialize
    function init() {
        console.log('🔍 Monitoring module initializing...');
        setupBurnServices();
        setupSlippageMonitoring();
        startHealthChecks();
    }

    // ============================================
    // BURN SERVICES
    // ============================================

    function setupBurnServices() {
        // Governance Vote
        setupBurnService('burnGov', 'governance', 1, 'Governance Vote');

        // Premium NFT Evaluation
        setupBurnService('burnPremium', 'premium_eval', 5, 'Premium NFT Eval');

        // Accelerated Yield
        setupBurnService('burnAccel', 'accelerated_yield', 2, 'Accelerated Yield');

        // Create Proposal
        setupBurnService('burnProposal', 'proposal', 10, 'Create Proposal');
    }

    function setupBurnService(inputId, serviceType, rewardRate, serviceName) {
        const input = document.getElementById(inputId);
        if (!input) return;

        const rewardId = inputId.replace('burn', '') + 'Reward';
        const btnSelector = `button:has(+ .burn-service-btn)`;

        // Input change listener
        input.addEventListener('input', (e) => {
            const amount = parseFloat(e.target.value) || 0;
            const reward = amount * rewardRate;
            const rewardEl = document.getElementById(rewardId);
            if (rewardEl) {
                rewardEl.textContent = Math.floor(reward).toLocaleString();
            }
        });

        // Find button within card and add listener
        const card = input.closest('.burn-service-card');
        if (card) {
            const btn = card.querySelector('.burn-service-btn');
            if (btn) {
                btn.addEventListener('click', () => handleBurnService(serviceType, rewardRate, serviceName));
            }
        }
    }

    async function handleBurnService(serviceType, rewardRate, serviceName) {
        if (!Dashboard.state.connected) {
            alert('Please connect your wallet first');
            return;
        }

        const inputId = {
            'governance': 'burnGov',
            'premium_eval': 'burnPremium',
            'accelerated_yield': 'burnAccel',
            'proposal': 'burnProposal'
        }[serviceType];

        const amount = parseFloat(document.getElementById(inputId).value);

        if (amount <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        try {
            const amountWei = ethers.parseUnits(amount.toString(), 18);
            const trustEarned = amount * rewardRate;

            console.log(`🔥 Burning ${amount} TALLY for ${serviceName}...`);

            if (Dashboard.state.contracts.tallyExchange) {
                // Call burnTallyForService
                const tx = await Dashboard.state.contracts.tallyExchange.burnTallyForService(
                    amountWei,
                    serviceType
                );

                console.log(`📝 Transaction sent: ${tx.hash}`);
                const receipt = await tx.wait();

                // Record in history
                recordBurnHistory({
                    date: new Date().toLocaleString(),
                    service: serviceName,
                    tallyBurned: amount,
                    trustEarned: trustEarned,
                    status: 'confirmed',
                    hash: receipt.transactionHash
                });

                // Update UI
                document.getElementById(inputId).value = '';
                updateBurnHistory();

                alert(`✅ Burned ${amount} TALLY!\n🏆 Earned ${Math.floor(trustEarned)} TRUST`);

            } else {
                // Demo mode
                recordBurnHistory({
                    date: new Date().toLocaleString(),
                    service: serviceName,
                    tallyBurned: amount,
                    trustEarned: trustEarned,
                    status: 'demo',
                    hash: '0x...'
                });

                alert(`✅ Demo: Burned ${amount} TALLY\n🏆 Earned ${Math.floor(trustEarned)} TRUST`);
                document.getElementById(inputId).value = '';
                updateBurnHistory();
            }

        } catch (error) {
            console.error('❌ Burn error:', error);
            alert(`Error: ${error.message}`);
        }
    }

    function recordBurnHistory(entry) {
        burnHistory.unshift(entry);
        if (burnHistory.length > 50) {
            burnHistory.pop();
        }
    }

    function updateBurnHistory() {
        const tbody = document.getElementById('burnHistoryBody');
        if (!tbody) return;

        if (burnHistory.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="no-data">No burns yet. Start burning to earn TRUST!</td></tr>';
            return;
        }

        tbody.innerHTML = burnHistory.map(entry => `
            <tr>
                <td>${entry.date}</td>
                <td>${entry.service}</td>
                <td>${entry.tallyBurned.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                <td>${Math.floor(entry.trustEarned).toLocaleString()}</td>
                <td>
                    <span class="status-badge ${entry.status}">
                        ${entry.status === 'confirmed' ? '✅ Confirmed' : entry.status === 'demo' ? '📊 Demo' : '⏳ Pending'}
                    </span>
                </td>
            </tr>
        `).join('');
    }

    // ============================================
    // SLIPPAGE MONITORING
    // ============================================

    function setupSlippageMonitoring() {
        const thresholdInput = document.getElementById('opThreshold');
        if (thresholdInput) {
            thresholdInput.addEventListener('change', (e) => {
                slippageThreshold = parseFloat(e.target.value) || 1.0;
                console.log(`🎯 Slippage threshold set to ${slippageThreshold}%`);
            });
        }

        // Threshold set button
        const setBtn = document.querySelector('.operator-card:nth-child(3) button');
        if (setBtn) {
            setBtn.addEventListener('click', () => {
                const newThreshold = parseFloat(document.getElementById('opThreshold').value) || 1.0;
                slippageThreshold = newThreshold;
                alert(`✅ Slippage threshold updated to ${newThreshold}%`);
            });
        }
    }

    function startHealthChecks() {
        setInterval(checkSlippageHealth, 10000); // Check every 10 seconds
        setInterval(checkReserveHealth, 30000);   // Check every 30 seconds
    }

    function checkSlippageHealth() {
        const currentSlippage = Dashboard.state.realTimeData.slippage || 0;
        const opSlippageEl = document.getElementById('opCurrentSlippage');
        const statusEl = document.getElementById('opSlippageStatus');

        if (opSlippageEl) {
            opSlippageEl.textContent = `${currentSlippage.toFixed(2)}%`;
        }

        // Update status
        if (currentSlippage >= slippageThreshold) {
            if (statusEl) {
                statusEl.textContent = '● ALERT - THRESHOLD EXCEEDED';
                statusEl.className = 'status-critical';
            }
            triggerSlippageAlert(currentSlippage);
        } else if (currentSlippage > slippageThreshold * 0.7) {
            if (statusEl) {
                statusEl.textContent = '● WARNING - APPROACHING THRESHOLD';
                statusEl.className = 'status-warning';
            }
        } else {
            if (statusEl) {
                statusEl.textContent = '● HEALTHY';
                statusEl.className = 'status-good';
            }
        }
    }

    function checkReserveHealth() {
        const health = ReserveTracker.getHealth();

        // Log health status
        if (health.status === 'critical') {
            console.error('🚨 CRITICAL RESERVE STATUS:', health);
            triggerHealthAlert(health);
        } else if (health.status === 'warning') {
            console.warn('⚠️ WARNING RESERVE STATUS:', health);
        }
    }

    function triggerSlippageAlert(slippage) {
        console.warn(`🚨 SLIPPAGE ALERT: ${slippage.toFixed(2)}% (threshold: ${slippageThreshold}%)`);

        // Visual alert
        const el = document.getElementById('lastSlippage');
        if (el) {
            el.style.color = '#ef4444';
            el.textContent = `${slippage.toFixed(2)}% ⚠️`;
        }

        // WebSocket notification
        if (Dashboard.state.wsConnection) {
            Dashboard.state.wsConnection.send(JSON.stringify({
                type: 'alert_acknowledge',
                alert_type: 'slippage',
                slippage: slippage,
                timestamp: Date.now()
            }));
        }
    }

    function triggerHealthAlert(health) {
        console.error('🚨 HEALTH ALERT:', health);

        // Update status display
        const statusEl = document.getElementById('healthStatus');
        if (statusEl && health.status === 'critical') {
            statusEl.style.animation = 'pulse 1s infinite';
        }
    }

    // ============================================
    // UTILITIES
    // ============================================

    function getMonitoringStatus() {
        return {
            active: monitoringActive,
            slippageThreshold,
            currentSlippage: Dashboard.state.realTimeData.slippage,
            reserveHealth: ReserveTracker.getHealth()
        };
    }

    function toggleMonitoring(enable) {
        monitoringActive = enable;
        console.log(`Monitoring ${enable ? 'enabled' : 'disabled'}`);
    }

    return {
        init,
        getMonitoringStatus,
        toggleMonitoring,
        recordBurnHistory,
        updateBurnHistory
    };
})();

// Initialize when document is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Monitoring.init());
} else {
    Monitoring.init();
}

console.log('✅ monitoring.js loaded');
