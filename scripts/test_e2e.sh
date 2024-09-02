#!/bin/sh

trap 'docker compose -f ./docker/docker-compose.yml down' EXIT

docker compose -f docker/docker-compose.yml up -d --build

echo "Waiting for ETH chain to be up"
curl --silent --retry 12 --retry-all-errors \
    -H "Content-type: application/json" \
    --data '{"jsonrpc":"2.0","method":"web3_clientVersion","params":[],"id":1}' \
    http://127.0.0.1:8545/ > /dev/null
    

pnpm jest --config ./test/jest-e2e.json