#!/bin/bash
set -e

RUSTFLAGS='-C link-arg=-s' cargo build --target wasm32-unknown-unknown --release
mkdir -p ./res
cp target/wasm32-unknown-unknown/release/nft_contract.wasm ./res/

echo "Build completed successfully!"
echo "The compiled WASM is available at: ./res/nft_contract.wasm" 