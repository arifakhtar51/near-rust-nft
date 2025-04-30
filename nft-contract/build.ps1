# PowerShell script to build NEAR NFT contract

# Set error action preference to stop on error
$ErrorActionPreference = "Stop"

Write-Host "Building the NEAR NFT contract..."

# Build the contract
rustup target add wasm32-unknown-unknown
$env:RUSTFLAGS = '-C link-arg=-s'
cargo build --target wasm32-unknown-unknown --release

# Create output directory if it doesn't exist
if (-not (Test-Path -Path "./res")) {
    New-Item -ItemType Directory -Path "./res" | Out-Null
}

# Copy the WASM file to the output directory
Copy-Item -Path "target/wasm32-unknown-unknown/release/nft_contract.wasm" -Destination "./res/" -Force

Write-Host "Build completed successfully!"
Write-Host "The compiled WASM is available at: ./res/nft_contract.wasm" 