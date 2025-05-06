# PowerShell script to deploy NEAR NFT contract

# Set error action preference to stop on error
$ErrorActionPreference = "Stop"

# Check if account ID is provided
if (-not $args[0]) {
    Write-Host "Please provide the account ID where the contract will be deployed"
    Write-Host "Usage: .\deploy.ps1 <accountId>"
    exit 1
}

$ACCOUNT_ID = $args[0]
$WASM_FILE = "./res/nft_contract.wasm"

# Check if the WASM file exists
if (-not (Test-Path -Path $WASM_FILE)) {
    Write-Host "WASM file not found. Building contract..."
    .\build.ps1
}

Write-Host "Deploying contract to $ACCOUNT_ID"
near deploy --wasmFile $WASM_FILE --accountId $ACCOUNT_ID

Write-Host "Contract deployed successfully!"
Write-Host ""
Write-Host "To initialize the contract, run:"
Write-Host "near call $ACCOUNT_ID new_default_meta '{`"owner_id`": `"$ACCOUNT_ID`", `"name`": `"My NFT Collection`", `"symbol`": `"MYNFT`"}' --accountId $ACCOUNT_ID" 