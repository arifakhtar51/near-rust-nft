#!/bin/bash
set -e

if [ -z "$1" ]; then
  echo "Please provide the account ID where the contract will be deployed"
  echo "Usage: ./deploy.sh <accountId>"
  exit 1
fi

ACCOUNT_ID=$1
WASM_FILE="./res/nft_contract.wasm"

# Check if the WASM file exists
if [ ! -f "$WASM_FILE" ]; then
  echo "WASM file not found. Building contract..."
  ./build.sh
fi

echo "Deploying contract to $ACCOUNT_ID"
near deploy --wasmFile $WASM_FILE --accountId $ACCOUNT_ID

echo "Contract deployed successfully!"
echo ""
echo "To initialize the contract, run:"
echo "near call $ACCOUNT_ID new_default_meta '{\"owner_id\": \"$ACCOUNT_ID\", \"name\": \"My NFT Collection\", \"symbol\": \"MYNFT\"}' --accountId $ACCOUNT_ID" 