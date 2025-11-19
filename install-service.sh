#!/bin/bash

# Install Convergence Protocol as a system service
# This ensures the server starts automatically on boot

echo "🤝 Installing Convergence Protocol service..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run with sudo: sudo bash install-service.sh"
    exit 1
fi

# Copy service file to systemd
echo "📋 Copying service file..."
cp convergence.service /etc/systemd/system/convergence.service

# Reload systemd
echo "🔄 Reloading systemd..."
systemctl daemon-reload

# Enable service to start on boot
echo "🚀 Enabling service to start on boot..."
systemctl enable convergence.service

# Start the service
echo "▶️  Starting service..."
systemctl start convergence.service

# Show status
echo ""
echo "✅ Service installed successfully!"
echo ""
echo "Service status:"
systemctl status convergence.service --no-pager

echo ""
echo "Useful commands:"
echo "  sudo systemctl status convergence   - Check status"
echo "  sudo systemctl restart convergence  - Restart service"
echo "  sudo systemctl stop convergence     - Stop service"
echo "  sudo systemctl start convergence    - Start service"
echo "  sudo journalctl -u convergence -f   - View logs"
