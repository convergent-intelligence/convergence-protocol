document.addEventListener('walletConnected', () => {
    // Check if the user is new by looking for a flag in local storage
    const isNewUser = !localStorage.getItem('hasVisitedConvergence');

    if (isNewUser) {
        // If they are new, show the onboarding modal
        showOnboardingModal();
        // Set the flag in local storage so they don't see the modal again
        localStorage.setItem('hasVisitedConvergence', 'true');
    }
});

function showOnboardingModal() {
    // Create the modal structure
    const modal = document.createElement('div');
    modal.id = 'onboarding-modal';
    modal.className = 'modal-overlay';

    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Welcome to the Convergence Protocol</h2>
                <button id="close-modal" class="close-button">&times;</button>
            </div>
            <div class="modal-body">
                <p>Your gateway to a new trust economy.</p>
                
                <div class="modal-section">
                    <h3>What is Convergence?</h3>
                    <p>Convergence is a decentralized protocol that allows communities to build and manage trust-based economies. It's powered by two key tokens:</p>
                    <ul>
                        <li><strong>Tally Tokens:</strong> Used for governance and staking.</li>
                        <li><strong>Trust Tokens:</strong> Represent reputation and are earned through positive contributions.</li>
                    </ul>
                </div>

                <div class="modal-section">
                    <h3>Getting Started</h3>
                    <ol>
                        <li><strong>Explore the dashboard:</strong> See your token balances and on-chain activity.</li>
                        <li><strong>Read the docs:</strong> Dive deeper into the protocol's mechanics in our <a href="/docs/trust-economy.md" target="_blank">documentation</a>.</li>
                        <li><strong>Join the community:</strong> Connect with us on Discord and follow our development on GitHub.</li>
                    </ol>
                </div>
            </div>
            <div class="modal-footer">
                <button id="explore-btn" class="modal-button">Start Exploring</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Add event listeners for the close and explore buttons
    document.getElementById('close-modal').onclick = () => modal.remove();
    document.getElementById('explore-btn').onclick = () => modal.remove();
    
    // Close the modal if the user clicks outside of the content area
    modal.onclick = (event) => {
        if (event.target === modal) {
            modal.remove();
        }
    };
}