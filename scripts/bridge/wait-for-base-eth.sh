#!/bin/bash

echo "Monitoring Base network for ETH arrival..."
echo "Bridge ETA: ~10-15 minutes from 22:46 UTC"
echo ""

for i in {1..30}; do
    echo "Check $i/30 - $(date +'%H:%M:%S UTC')"
    BALANCE=$(npx hardhat run scripts/check-balance.js --network base 2>&1 | grep "Balance:" | awk '{print $2}')
    echo "Current balance: $BALANCE ETH"

    # Check if balance is greater than 0.001
    if (( $(echo "$BALANCE > 0.001" | bc -l 2>/dev/null || echo 0) )); then
        echo ""
        echo "✅ ETH ARRIVED! Balance: $BALANCE ETH"
        echo "Ready to deploy remaining contracts!"
        exit 0
    fi

    if [ $i -lt 30 ]; then
        echo "Waiting 30 seconds..."
        echo ""
        sleep 30
    fi
done

echo "Bridge may need more time. Check manually."
