#!/bin/sh
set -euo

PORTAL_ADDRESS=$(jq -r '.address' /app/deployment_data/FuelMessagePortal.json)
echo "Launching fuel node with PORTAL_ADDRESS=$PORTAL_ADDRESS"

exec /root/fuel-core run \
    --ip 0.0.0.0 \
    --port 4000 \
    --db-type in-memory \
    --utxo-validation \
    --vm-backtrace \
    --enable-relayer \
    --relayer $ETH_NODE \
    --relayer-v2-listening-contracts $PORTAL_ADDRESS \
    --relayer-da-deploy-height 0 \
    --poa-interval-period 1sec \
    --debug \
    --min-gas-price 0