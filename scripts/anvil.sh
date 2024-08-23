#!/bin/sh

MNEMONIC="${MNEMONIC:-test test test test test test test test test test test junk}"
BLOCK_TIME="${BLOCK_TIME:-12}"

anvil --host "0.0.0.0" --mnemonic "$MNEMONIC" --accounts 20 \
    --slots-in-an-epoch 1 \
    --block-time $BLOCK_TIME \
    --mixed-mining