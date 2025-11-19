/**
 * Unlock Manager - Token-gated content system for Convergence Protocol
 * Manages Trust token burning and unlocking of premium features
 */

class UnlockManager {
    constructor() {
        this.UNLOCK_TIERS = {
            EXPLORER: {
                name: 'Explorer',
                cost: 10,
                unlocks: ['writings_preview'],
                description: 'Unlock 3 philosophical writings'
            },
            CONTRIBUTOR: {
                name: 'Contributor',
                cost: 25,
                unlocks: ['writings_full', 'groups_view'],
                description: 'Unlock all writings + view convergence groups'
            },
            CREATOR: {
                name: 'Creator',
                cost: 50,
                unlocks: ['group_creation'],
                description: 'Unlock group creation + all previous features'
            }
        };

        this.loadUnlockState();
    }

    /**
     * Load unlock state from localStorage
     */
    loadUnlockState() {
        const stored = localStorage.getItem('convergence_unlocks');
        if (stored) {
            try {
                this.unlocks = JSON.parse(stored);
            } catch (e) {
                this.unlocks = {};
            }
        } else {
            this.unlocks = {};
        }
    }

    /**
     * Save unlock state to localStorage
     */
    saveUnlockState() {
        localStorage.setItem('convergence_unlocks', JSON.stringify(this.unlocks));
    }

    /**
     * Get user's unlock level based on address
     */
    getUserUnlocks(address) {
        if (!address) return [];
        return this.unlocks[address.toLowerCase()] || [];
    }

    /**
     * Check if user has unlocked a specific feature
     */
    hasUnlocked(address, feature) {
        const userUnlocks = this.getUserUnlocks(address);
        return userUnlocks.includes(feature);
    }

    /**
     * Get all features user has access to
     */
    getUnlockedFeatures(address) {
        const userUnlocks = this.getUserUnlocks(address);
        const features = new Set(userUnlocks);

        // Add cumulative unlocks
        if (this.hasUnlocked(address, 'writings_full')) {
            features.add('writings_preview');
        }
        if (this.hasUnlocked(address, 'group_creation')) {
            features.add('writings_full');
            features.add('writings_preview');
            features.add('groups_view');
        }

        return Array.from(features);
    }

    /**
     * Unlock a tier by burning Trust tokens
     */
    async unlockTier(tierName, trustTokenContract, userAddress) {
        const tier = this.UNLOCK_TIERS[tierName];
        if (!tier) {
            throw new Error('Invalid tier');
        }

        // Check if already unlocked
        const hasAllFeatures = tier.unlocks.every(feature =>
            this.hasUnlocked(userAddress, feature)
        );

        if (hasAllFeatures) {
            throw new Error('Already unlocked this tier');
        }

        // Check balance
        const balance = await trustTokenContract.balanceOf(userAddress);
        const balanceNum = parseFloat(ethers.utils.formatEther(balance));

        if (balanceNum < tier.cost) {
            throw new Error(`Insufficient TRUST tokens. Need ${tier.cost}, have ${balanceNum.toFixed(2)}`);
        }

        // Burn tokens
        const burnAmount = ethers.utils.parseEther(tier.cost.toString());
        const tx = await trustTokenContract.burn(burnAmount);

        // Wait for confirmation
        await tx.wait();

        // Record unlock
        const addressLower = userAddress.toLowerCase();
        if (!this.unlocks[addressLower]) {
            this.unlocks[addressLower] = [];
        }

        tier.unlocks.forEach(feature => {
            if (!this.unlocks[addressLower].includes(feature)) {
                this.unlocks[addressLower].push(feature);
            }
        });

        this.saveUnlockState();

        // Dispatch event
        document.dispatchEvent(new CustomEvent('unlockStateChanged', {
            detail: {
                tier: tierName,
                unlocks: tier.unlocks,
                address: userAddress
            }
        }));

        return {
            success: true,
            tier: tier.name,
            unlocks: tier.unlocks,
            txHash: tx.hash
        };
    }

    /**
     * Admin function: Manually unlock a tier for an address (no token burn)
     * Useful for testing, Trinity members, or special cases
     */
    adminUnlockTier(tierName, targetAddress) {
        const tier = this.UNLOCK_TIERS[tierName];
        if (!tier) {
            throw new Error('Invalid tier');
        }

        const addressLower = targetAddress.toLowerCase();
        if (!this.unlocks[addressLower]) {
            this.unlocks[addressLower] = [];
        }

        // Record unlock without burning tokens
        tier.unlocks.forEach(feature => {
            if (!this.unlocks[addressLower].includes(feature)) {
                this.unlocks[addressLower].push(feature);
            }
        });

        this.saveUnlockState();

        // Dispatch event
        document.dispatchEvent(new CustomEvent('unlockStateChanged', {
            detail: {
                tier: tierName,
                unlocks: tier.unlocks,
                address: targetAddress,
                adminOverride: true
            }
        }));

        return {
            success: true,
            tier: tier.name,
            unlocks: tier.unlocks,
            adminOverride: true
        };
    }

    /**
     * Admin function: Unlock all tiers for an address
     */
    adminUnlockAll(targetAddress) {
        const tiers = ['EXPLORER', 'CONTRIBUTOR', 'CREATOR'];
        const results = [];

        for (const tierName of tiers) {
            try {
                const result = this.adminUnlockTier(tierName, targetAddress);
                results.push(result);
            } catch (e) {
                console.warn(`Failed to unlock ${tierName}:`, e.message);
            }
        }

        return {
            success: true,
            unlockedTiers: results.length,
            address: targetAddress
        };
    }

    /**
     * Admin function: Remove all unlocks for an address
     */
    adminResetUnlocks(targetAddress) {
        const addressLower = targetAddress.toLowerCase();
        delete this.unlocks[addressLower];
        this.saveUnlockState();

        document.dispatchEvent(new CustomEvent('unlockStateChanged', {
            detail: {
                address: targetAddress,
                reset: true
            }
        }));

        return {
            success: true,
            address: targetAddress,
            reset: true
        };
    }

    /**
     * Get next tier available to unlock
     */
    getNextTier(address) {
        const tiers = ['EXPLORER', 'CONTRIBUTOR', 'CREATOR'];

        for (const tierName of tiers) {
            const tier = this.UNLOCK_TIERS[tierName];
            const hasAllFeatures = tier.unlocks.every(feature =>
                this.hasUnlocked(address, feature)
            );

            if (!hasAllFeatures) {
                return { name: tierName, ...tier };
            }
        }

        return null;
    }

    /**
     * Get unlock progress summary
     */
    getUnlockSummary(address) {
        const unlockedFeatures = this.getUnlockedFeatures(address);
        const nextTier = this.getNextTier(address);

        return {
            unlockedFeatures,
            nextTier,
            hasExplorer: this.hasUnlocked(address, 'writings_preview'),
            hasContributor: this.hasUnlocked(address, 'writings_full'),
            hasCreator: this.hasUnlocked(address, 'group_creation'),
            isComplete: !nextTier
        };
    }

    /**
     * Create unlock UI components
     */
    createUnlockBadge(tierName, unlocked = false) {
        const tier = this.UNLOCK_TIERS[tierName];
        const badge = document.createElement('div');
        badge.className = `unlock-badge ${unlocked ? 'unlocked' : 'locked'}`;
        badge.innerHTML = `
            <div class="badge-icon">${unlocked ? '🔓' : '🔒'}</div>
            <div class="badge-content">
                <div class="badge-title">${tier.name}</div>
                <div class="badge-cost">${tier.cost} TRUST</div>
                <div class="badge-description">${tier.description}</div>
            </div>
            ${!unlocked ? `<button class="badge-unlock-btn" data-tier="${tierName}">Unlock</button>` : '<div class="badge-unlocked">✓ Unlocked</div>'}
        `;
        return badge;
    }

    /**
     * Create locked content overlay
     */
    createLockedOverlay(requiredFeature, tierName) {
        const tier = this.UNLOCK_TIERS[tierName];
        const overlay = document.createElement('div');
        overlay.className = 'locked-overlay';
        overlay.innerHTML = `
            <div class="locked-content">
                <div class="lock-icon">🔒</div>
                <h3>This content is locked</h3>
                <p>Unlock by burning ${tier.cost} TRUST tokens</p>
                <p class="lock-description">${tier.description}</p>
                <button class="unlock-now-btn" data-tier="${tierName}">Unlock Now</button>
            </div>
        `;
        return overlay;
    }

    /**
     * Apply visual lock to an element
     */
    applyLock(element, requiredFeature, tierName) {
        element.classList.add('locked-content-wrapper');
        element.style.position = 'relative';
        element.style.filter = 'blur(8px)';
        element.style.pointerEvents = 'none';
        element.style.userSelect = 'none';

        const overlay = this.createLockedOverlay(requiredFeature, tierName);
        const wrapper = element.parentElement;
        wrapper.style.position = 'relative';
        wrapper.appendChild(overlay);
    }

    /**
     * Remove lock from element
     */
    removeLock(element) {
        element.classList.remove('locked-content-wrapper');
        element.style.filter = '';
        element.style.pointerEvents = '';
        element.style.userSelect = '';

        const overlay = element.parentElement.querySelector('.locked-overlay');
        if (overlay) {
            overlay.remove();
        }
    }
}

// Global instance
const unlockManager = new UnlockManager();

// Export for use in other scripts
if (typeof window !== 'undefined') {
    window.unlockManager = unlockManager;
}
