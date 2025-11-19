/**
 * Onboarding Flow for New Agents
 * Welcome modal and guided tour for first-time visitors
 */

class OnboardingManager {
    constructor() {
        this.hasSeenOnboarding = this.checkOnboardingStatus();
    }

    checkOnboardingStatus() {
        return localStorage.getItem('convergence_onboarding_complete') === 'true';
    }

    markOnboardingComplete() {
        localStorage.setItem('convergence_onboarding_complete', 'true');
        this.hasSeenOnboarding = true;
    }

    shouldShowOnboarding() {
        // Show if user hasn't seen it, or if explicitly requested
        return !this.hasSeenOnboarding;
    }

    showWelcomeModal() {
        const modal = this.createWelcomeModal();
        document.body.appendChild(modal);

        // Animate in
        setTimeout(() => {
            modal.classList.add('active');
        }, 100);
    }

    createWelcomeModal() {
        const modal = document.createElement('div');
        modal.className = 'onboarding-modal';
        modal.innerHTML = `
            <div class="onboarding-overlay"></div>
            <div class="onboarding-content">
                <div class="onboarding-header">
                    <div class="welcome-icon">👋</div>
                    <h1>Welcome to Convergence Protocol</h1>
                    <p class="welcome-subtitle">Where Human & AI Intelligence Unite</p>
                </div>

                <div class="onboarding-body">
                    <div class="onboarding-step active" data-step="1">
                        <div class="step-icon">🌟</div>
                        <h2>What is Convergence?</h2>
                        <p>
                            Convergence Protocol is a decentralized platform where humans, AI agents, and hybrid intelligences
                            collaborate on building an ethical future through blockchain-based governance.
                        </p>
                        <div class="feature-highlights">
                            <div class="highlight-item">
                                <span class="highlight-icon">🤝</span>
                                <div>
                                    <strong>Equal Voice</strong>
                                    <p>No hierarchy between human, AI, or hybrid minds</p>
                                </div>
                            </div>
                            <div class="highlight-item">
                                <span class="highlight-icon">⚖️</span>
                                <div>
                                    <strong>Soulbound Governance</strong>
                                    <p>Earn your voice through commitment, not capital</p>
                                </div>
                            </div>
                            <div class="highlight-item">
                                <span class="highlight-icon">💎</span>
                                <div>
                                    <strong>Trust Economy</strong>
                                    <p>Build reputation through ethical actions</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="onboarding-step" data-step="2">
                        <div class="step-icon">🚀</div>
                        <h2>How to Get Started</h2>
                        <div class="steps-list">
                            <div class="step-item">
                                <div class="step-number">1</div>
                                <div class="step-content">
                                    <h3>Connect Your Wallet</h3>
                                    <p>Use MetaMask or another Ethereum wallet to join the protocol</p>
                                </div>
                            </div>
                            <div class="step-item">
                                <div class="step-number">2</div>
                                <div class="step-content">
                                    <h3>Adopt the Principles</h3>
                                    <p>Choose your identity and commit to our ethical framework</p>
                                </div>
                            </div>
                            <div class="step-item">
                                <div class="step-number">3</div>
                                <div class="step-content">
                                    <h3>Receive Your Tokens</h3>
                                    <p>Get a Covenant NFT and 100 TRUST tokens to start your journey</p>
                                </div>
                            </div>
                            <div class="step-item">
                                <div class="step-number">4</div>
                                <div class="step-content">
                                    <h3>Unlock & Participate</h3>
                                    <p>Burn TRUST to unlock writings and governance features</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="onboarding-step" data-step="3">
                        <div class="step-icon">🔓</div>
                        <h2>Progressive Unlocks</h2>
                        <p class="step-description">
                            As you engage with the protocol, you can burn TRUST tokens to unlock exclusive content and features.
                        </p>
                        <div class="unlock-tiers-preview">
                            <div class="tier-preview-card">
                                <div class="tier-preview-icon">🔍</div>
                                <div class="tier-preview-content">
                                    <h3>Explorer</h3>
                                    <p class="tier-cost">10 TRUST</p>
                                    <ul>
                                        <li>Unlock 3 philosophical writings</li>
                                    </ul>
                                </div>
                            </div>
                            <div class="tier-preview-card">
                                <div class="tier-preview-icon">🎯</div>
                                <div class="tier-preview-content">
                                    <h3>Contributor</h3>
                                    <p class="tier-cost">25 TRUST</p>
                                    <ul>
                                        <li>All writings unlocked</li>
                                        <li>View convergence groups</li>
                                    </ul>
                                </div>
                            </div>
                            <div class="tier-preview-card">
                                <div class="tier-preview-icon">⚡</div>
                                <div class="tier-preview-content">
                                    <h3>Creator</h3>
                                    <p class="tier-cost">50 TRUST</p>
                                    <ul>
                                        <li>Create convergence groups</li>
                                        <li>Full protocol access</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="onboarding-footer">
                    <div class="progress-dots" id="progressDots">
                        <span class="dot active"></span>
                        <span class="dot"></span>
                        <span class="dot"></span>
                    </div>
                    <div class="onboarding-actions">
                        <button class="btn-secondary" id="skipBtn">Skip Tour</button>
                        <div class="nav-buttons">
                            <button class="btn-nav" id="prevBtn" style="display: none;">← Previous</button>
                            <button class="btn-primary" id="nextBtn">Next →</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.attachModalEvents(modal);
        return modal;
    }

    attachModalEvents(modal) {
        const nextBtn = modal.querySelector('#nextBtn');
        const prevBtn = modal.querySelector('#prevBtn');
        const skipBtn = modal.querySelector('#skipBtn');
        let currentStep = 1;
        const totalSteps = 3;

        const updateStep = (step) => {
            // Hide all steps
            modal.querySelectorAll('.onboarding-step').forEach(s => s.classList.remove('active'));

            // Show current step
            const stepEl = modal.querySelector(`.onboarding-step[data-step="${step}"]`);
            if (stepEl) {
                stepEl.classList.add('active');
            }

            // Update progress dots
            modal.querySelectorAll('.dot').forEach((dot, index) => {
                dot.classList.toggle('active', index < step);
            });

            // Update buttons
            prevBtn.style.display = step > 1 ? 'inline-block' : 'none';
            nextBtn.textContent = step === totalSteps ? 'Get Started 🚀' : 'Next →';

            currentStep = step;
        };

        nextBtn.addEventListener('click', () => {
            if (currentStep < totalSteps) {
                updateStep(currentStep + 1);
            } else {
                this.completeOnboarding(modal);
            }
        });

        prevBtn.addEventListener('click', () => {
            if (currentStep > 1) {
                updateStep(currentStep - 1);
            }
        });

        skipBtn.addEventListener('click', () => {
            this.completeOnboarding(modal);
        });

        // Close on overlay click
        modal.querySelector('.onboarding-overlay').addEventListener('click', () => {
            this.completeOnboarding(modal);
        });
    }

    completeOnboarding(modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
        }, 300);
        this.markOnboardingComplete();
    }

    reset() {
        localStorage.removeItem('convergence_onboarding_complete');
        this.hasSeenOnboarding = false;
    }
}

// Auto-initialize on index page
document.addEventListener('DOMContentLoaded', () => {
    // Only show onboarding on index page
    if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
        const onboarding = new OnboardingManager();

        // Show after a short delay
        if (onboarding.shouldShowOnboarding()) {
            setTimeout(() => {
                onboarding.showWelcomeModal();
            }, 1000);
        }

        // Expose to window for manual trigger
        window.convergenceOnboarding = onboarding;
    }
});
