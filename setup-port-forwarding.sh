#!/bin/bash

# Setup script for Convergence Protocol port forwarding
# This script configures port 80 to forward to port 8080

echo "🤝 Setting up Convergence Protocol port forwarding..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run with sudo: sudo bash setup-port-forwarding.sh"
    exit 1
fi

# Install iptables-persistent if not already installed
echo "📦 Installing iptables-persistent..."
apt-get update -qq
DEBIAN_FRONTEND=noninteractive apt-get install -y iptables-persistent

# Clear any existing rules for port 80 -> 8080
echo "🧹 Clearing existing port forwarding rules..."
iptables -t nat -D PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 8080 2>/dev/null || true

# Add port forwarding rule
echo "🔀 Adding port forwarding rule (80 -> 8080)..."
iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 8080

# Save iptables rules
echo "💾 Saving iptables rules..."
netfilter-persistent save

echo "✅ Port forwarding configured successfully!"
echo "Port 80 will now redirect to port 8080"
echo ""
echo "Testing configuration..."
iptables -t nat -L PREROUTING -n -v | grep 8080

echo ""
echo "✅ Setup complete! Your domains should now work without port numbers."
