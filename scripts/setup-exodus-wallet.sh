#!/bin/bash
# Setup script for Exodus Seed Wallet Manager

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "=================================================="
echo "Exodus Seed Wallet Manager - Setup"
echo "=================================================="

# Check Python installation
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed"
    exit 1
fi

echo ""
echo "1. Installing dependencies..."
pip3 install -q -r "$SCRIPT_DIR/exodus-requirements.txt"
echo "   ✓ Dependencies installed"

echo ""
echo "2. Creating wallet storage directory..."
mkdir -p "$PROJECT_ROOT/wallets/exodus"
chmod 700 "$PROJECT_ROOT/wallets/exodus"
echo "   ✓ Directory created: $PROJECT_ROOT/wallets/exodus"

echo ""
echo "3. Setting script permissions..."
chmod +x "$SCRIPT_DIR/exodus-seed-manager.py"
echo "   ✓ Script is executable"

echo ""
echo "=================================================="
echo "Setup complete!"
echo "=================================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Generate seed phrase in Exodus wallet app"
echo ""
echo "2. Run interactive setup:"
echo "   python3 $SCRIPT_DIR/exodus-seed-manager.py --setup"
echo ""
echo "3. Follow the prompts to:"
echo "   - Set encryption password"
echo "   - Input your seed phrase"
echo "   - Derive and save keys"
echo ""
echo "For more details, see: $SCRIPT_DIR/EXODUS_SEED_MANAGER.md"
echo ""
