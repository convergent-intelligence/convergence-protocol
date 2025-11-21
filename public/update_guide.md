
# Website Update Manifest: Convergent Intelligence
**Target System:** convergent-intelligence.net
**Objective:** Implement new "Tri-Token" asset pack, branding, and UI theming.

## 1. Design System Overview
**Theme:** Deep Tech / Convergent Data / Dark Mode
**Palette:**
* **Background:** `#0f172a` (Dark Slate)
* **Primary (Stream/Tally):** `#00d2ff` (Cyan)
* **Secondary (Trust):** `#10b981` (Emerald)
* **Accent (Voucher):** `#fbbf24` (Gold)
* **Text:** `#ffffff` (White) / `#94a3b8` (Slate Grey)

---

## 2. Asset Payload (SVG Codes)

**Instruction:** Save the following code blocks as individual `.svg` files in the `/assets/images/` directory.

### 2.1 Branding Assets

**File:** `/assets/images/logo-icon.svg`
*(The standalone "Spark" icon for favicons or mobile headers)*
```xml
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)">
  <defs>
    <filter id="core-glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <linearGradient id="stream-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00d2ff" stop-opacity="0" />
      <stop offset="100%" stop-color="#00d2ff" />
    </linearGradient>
  </defs>
  <g fill="none" stroke="url(#stream-grad)" stroke-width="3" stroke-linecap="round">
    <path d="M10 10 Q 30 50, 50 50" />
    <path d="M10 90 Q 30 50, 50 50" />
    <path d="M90 50 Q 70 50, 50 50" />
  </g>
  <g fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity="0.6">
     <path d="M10 10 Q 30 50, 50 50" stroke-dasharray="60" stroke-dashoffset="60"><animate attributeName="stroke-dashoffset" to="0" dur="2s" repeatCount="indefinite" fill="freeze"/></path>
     <path d="M10 90 Q 30 50, 50 50" stroke-dasharray="60" stroke-dashoffset="60"><animate attributeName="stroke-dashoffset" to="0" dur="2s" begin="0.5s" repeatCount="indefinite" fill="freeze"/></path>
     <path d="M90 50 Q 70 50, 50 50" stroke-dasharray="40" stroke-dashoffset="40"><animate attributeName="stroke-dashoffset" to="0" dur="2s" begin="1s" repeatCount="indefinite" fill="freeze"/></path>
  </g>
  <circle cx="50" cy="50" r="8" fill="#ffffff" filter="url(#core-glow)">
    <animate attributeName="r" values="8;10;8" dur="3s" repeatCount="indefinite" />
    <animate attributeName="opacity" values="1;0.7;1" dur="3s" repeatCount="indefinite" />
  </circle>
</svg>

File: /assets/images/logo-full.svg
(The horizontal header logo with typography)
<svg width="300" height="60" viewBox="0 0 300 60" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)">
  <defs>
    <filter id="core-glow-small" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
      <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <g transform="translate(10, 5) scale(0.5)">
    <path d="M10 10 Q 30 50, 50 50" fill="none" stroke="#00d2ff" stroke-width="4" stroke-linecap="round" />
    <path d="M10 90 Q 30 50, 50 50" fill="none" stroke="#00d2ff" stroke-width="4" stroke-linecap="round" />
    <path d="M90 50 Q 70 50, 50 50" fill="none" stroke="#00d2ff" stroke-width="4" stroke-linecap="round" />
    <circle cx="50" cy="50" r="10" fill="#ffffff" filter="url(#core-glow-small)" />
  </g>
  <g font-family="'Roboto', 'Helvetica Neue', Helvetica, Arial, sans-serif" fill="white">
    <text x="70" y="38" font-weight="700" font-size="24" letter-spacing="1">CONVERGENT</text>
    <text x="225" y="38" font-weight="300" font-size="24" letter-spacing="1" fill="#00d2ff">INTELLIGENCE</text>
  </g>
</svg>

2.2 Token Economy Assets
File: /assets/images/token-tally.svg
(Represents Score/Data)
<svg width="200" height="200" viewBox="0 0 200 200" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)">
  <defs>
    <filter id="glow-tally" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
      <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <circle cx="100" cy="100" r="90" fill="#0f172a" stroke="#334155" stroke-width="2" />
  <g fill="#00d2ff" filter="url(#glow-tally)">
    <rect x="60" y="50" width="10" height="100" rx="2" opacity="0.8" />
    <rect x="80" y="50" width="10" height="100" rx="2" opacity="0.8" />
    <rect x="100" y="50" width="10" height="100" rx="2" opacity="0.8" />
    <rect x="120" y="50" width="10" height="100" rx="2" opacity="0.8" />
  </g>
  <line x1="40" y1="130" x2="150" y2="70" stroke="#ffffff" stroke-width="8" stroke-linecap="round" stroke-dasharray="150" stroke-dashoffset="150" filter="url(#glow-tally)">
    <animate attributeName="stroke-dashoffset" from="150" to="0" dur="1.5s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1" repeatCount="indefinite" />
  </line>
</svg>

File: /assets/images/token-trust.svg
(Represents Reputation/Validation)
<svg width="200" height="200" viewBox="0 0 200 200" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)">
  <defs>
    <linearGradient id="shield-grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#10b981" />
      <stop offset="100%" stop-color="#059669" />
    </linearGradient>
  </defs>
  <path d="M100 10 L180 55 V145 L100 190 L20 145 V55 Z" fill="#0f172a" stroke="#334155" stroke-width="2" />
  <path d="M100 40 C100 40, 160 50, 160 100 C160 140, 100 170, 100 170 C100 170, 40 140, 40 100 C40 50, 100 40, 100 40 Z" fill="none" stroke="url(#shield-grad)" stroke-width="6" />
  <circle cx="100" cy="100" r="15" fill="#10b981">
    <animate attributeName="r" values="15;25;15" dur="3s" repeatCount="indefinite" />
    <animate attributeName="opacity" values="1;0.4;1" dur="3s" repeatCount="indefinite" />
  </circle>
  <path d="M85 100 L95 110 L115 90" fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
</svg>

File: /assets/images/token-voucher.svg
(Represents Redemption/Key)
<svg width="200" height="200" viewBox="0 0 200 200" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)">
  <defs>
    <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>
    <clipPath id="card-clip"><path d="M40 60 H140 L160 80 V140 H40 V60 Z" /></clipPath>
  </defs>
  <circle cx="100" cy="100" r="90" fill="#0f172a" stroke="#334155" stroke-width="2" />
  <path d="M40 60 H140 L160 80 V140 H40 V60 Z" fill="none" stroke="url(#gold-grad)" stroke-width="4" />
  <g fill="#fbbf24" opacity="0.6">
    <rect x="55" y="75" width="6" height="50" /><rect x="65" y="75" width="2" height="50" />
    <rect x="71" y="75" width="10" height="50" /><rect x="85" y="75" width="4" height="50" />
    <rect x="95" y="75" width="8" height="50" /><rect x="110" y="75" width="3" height="50" />
    <rect x="120" y="75" width="10" height="50" />
  </g>
  <line x1="40" y1="70" x2="160" y2="70" stroke="#ffffff" stroke-width="2" opacity="0.8" clip-path="url(#card-clip)">
    <animate attributeName="y1" values="60;140;60" dur="2s" repeatCount="indefinite" />
    <animate attributeName="y2" values="60;140;60" dur="2s" repeatCount="indefinite" />
  </line>
</svg>

2.3 UI Elements
File: /assets/images/bg-hex-pattern.svg
(Seamless Hex-Grid Background)
<svg width="100%" height="100%" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)">
  <defs>
    <pattern id="hex-grid" width="40" height="68" patternUnits="userSpaceOnUse">
      <path d="M20 0 L40 11 V34 L20 45 L0 34 V11 Z" fill="none" stroke="#334155" stroke-width="1" opacity="0.2"/>
      <path d="M20 34 L40 45 V68 L20 79 L0 68 V45 Z" transform="translate(20, 34)" fill="none" stroke="#334155" stroke-width="1" opacity="0.2"/>
    </pattern>
    <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#0f172a" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#020617" stop-opacity="1"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="#0f172a"/>
  <rect width="100%" height="100%" fill="url(#hex-grid)"/>
  <rect width="100%" height="100%" fill="url(#vignette)"/>
</svg>

File: /assets/images/banner-convergence.svg
(Hero Banner for Dashboard)
<svg width="1200" height="300" viewBox="0 0 1200 300" preserveAspectRatio="xMidYMid slice" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)">
  <defs>
    <linearGradient id="flow-grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0f172a" stop-opacity="0" />
      <stop offset="50%" stop-color="#00d2ff" stop-opacity="0.6" />
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="#0f172a"/>
  <path d="M-100 50 C 200 50, 400 150, 600 150" fill="none" stroke="url(#flow-grad)" stroke-width="2" opacity="0.5" />
  <path d="M-100 250 C 200 250, 400 150, 600 150" fill="none" stroke="url(#flow-grad)" stroke-width="2" opacity="0.5" />
  <path d="M1300 50 C 1000 50, 800 150, 600 150" fill="none" stroke="url(#flow-grad)" stroke-width="2" opacity="0.5" />
  <path d="M1300 250 C 1000 250, 800 150, 600 150" fill="none" stroke="url(#flow-grad)" stroke-width="2" opacity="0.5" />
  <circle cx="600" cy="150" r="5" fill="#00d2ff">
    <animate attributeName="r" values="5;10;5" dur="3s" repeatCount="indefinite"/>
    <animate attributeName="opacity" values="1;0.5;1" dur="3s" repeatCount="indefinite"/>
  </circle>
  <circle cx="0" cy="0" r="3" fill="white">
    <animateMotion path="M-100 50 C 200 50, 400 150, 600 150" dur="4s" repeatCount="indefinite" />
    <animate attributeName="opacity" values="0;1;0" dur="4s" repeatCount="indefinite"/>
  </circle>
</svg>

File: /assets/images/divider-pulse.svg
(Section Break)
<svg width="100%" height="100" viewBox="0 0 1200 100" preserveAspectRatio="none" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)">
  <path d="M0 50 L400 50 L420 20 L440 80 L460 50 L1200 50" fill="none" stroke="#10b981" stroke-width="2" opacity="0.4" vector-effect="non-scaling-stroke" />
  <path d="M0 50 L400 50 L420 20 L440 80 L460 50 L1200 50" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round" stroke-dasharray="1200" stroke-dashoffset="1200">
    <animate attributeName="stroke-dashoffset" from="1200" to="-1200" dur="3s" repeatCount="indefinite" />
  </path>
</svg>

3. Implementation Instructions
Step A: Update Global CSS
Modify your main stylesheet (e.g., styles.css) to set the global background and variables.
:root {
    --bg-dark: #0f172a;
    --brand-cyan: #00d2ff;
    --brand-green: #10b981;
    --brand-gold: #fbbf24;
}

body {
    background-color: var(--bg-dark);
    /* Applies the SVG hex pattern as the global background */
    background-image: url('/assets/images/bg-hex-pattern.svg');
    background-repeat: repeat;
    background-attachment: fixed; /* Optional: Parallax effect */
    color: white;
    font-family: 'Roboto', sans-serif;
}

Step B: Update Header (HTML)
Replace current text header with the full SVG logo.
<header>
    <a href="/" class="brand-logo">
        <img src="assets/images/logo-full.svg" alt="Convergent Intelligence" class="responsive-img">
    </a>
</header>

Step C: Dashboard Token Display (HTML)
Structure for the dashboard token wallet.
<div class="token-container">
    <div class="token-card">
        <img src="assets/images/token-tally.svg" alt="Tally Token">
        <h3>Tally</h3>
        <p class="balance">1,024</p>
    </div>

    <div class="token-card">
        <img src="assets/images/token-trust.svg" alt="Trust Token">
        <h3>Trust Score</h3>
        <p class="balance">98%</p>
    </div>

    <div class="token-card">
        <img src="assets/images/token-voucher.svg" alt="Voucher Token">
        <h3>Vouchers</h3>
        <p class="balance">3</p>
    </div>
</div>



