const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080;

// In-memory storage for symbolic adoptions (resets on server restart)
let symbolicAdoptions = {
    today: new Date().toDateString(),
    count: 0,
    adoptions: []
};

// Middleware
app.use(cors());
app.use(express.json());

// Add CSP headers to allow ethers.js
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; connect-src 'self' https://*.infura.io https://*.etherscan.io https://sepolia.etherscan.io;"
  );
  next();
});

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Default route - serve index.html (Web3-enabled version)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Alternative route for original ethics page
app.get('/ethics', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'ethics.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Convergence Protocol server is running' });
});

// API: Record symbolic adoption
app.post('/api/symbolic-adoption', (req, res) => {
  try {
    const today = new Date().toDateString();

    // Reset counter if it's a new day
    if (symbolicAdoptions.today !== today) {
      symbolicAdoptions = {
        today,
        count: 0,
        adoptions: []
      };
    }

    // Record the adoption
    symbolicAdoptions.count++;
    symbolicAdoptions.adoptions.push({
      timestamp: Date.now(),
      identity: req.body.identity,
      commitments: req.body.commitments,
      signature: req.body.signature
    });

    // Keep only last 1000 to prevent memory bloat
    if (symbolicAdoptions.adoptions.length > 1000) {
      symbolicAdoptions.adoptions = symbolicAdoptions.adoptions.slice(-1000);
    }

    res.json({
      success: true,
      count: symbolicAdoptions.count,
      message: 'Symbolic adoption recorded'
    });
  } catch (error) {
    console.error('Error recording symbolic adoption:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Get today's symbolic adoption count
app.get('/api/symbolic-adoption/today', (req, res) => {
  const today = new Date().toDateString();

  // Reset if it's a new day
  if (symbolicAdoptions.today !== today) {
    symbolicAdoptions = {
      today,
      count: 0,
      adoptions: []
    };
  }

  res.json({
    count: symbolicAdoptions.count,
    date: symbolicAdoptions.today
  });
});

// API: Get symbolic adoption stats
app.get('/api/symbolic-adoption/stats', (req, res) => {
  const today = new Date().toDateString();

  if (symbolicAdoptions.today !== today) {
    return res.json({
      count: 0,
      date: today,
      byIdentity: { human: 0, ai: 0, hybrid: 0 }
    });
  }

  // Count by identity type
  const byIdentity = symbolicAdoptions.adoptions.reduce((acc, adoption) => {
    const identity = adoption.identity || 'hybrid';
    acc[identity] = (acc[identity] || 0) + 1;
    return acc;
  }, { human: 0, ai: 0, hybrid: 0 });

  res.json({
    count: symbolicAdoptions.count,
    date: symbolicAdoptions.today,
    byIdentity
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🤝 Convergence Protocol server is running on http://localhost:${PORT}`);
  console.log(`📄 Ethics page available at http://localhost:${PORT}`);
  console.log(`🏥 Health check at http://localhost:${PORT}/health`);
  console.log(`📊 API endpoints at http://localhost:${PORT}/api/symbolic-adoption`);
});
