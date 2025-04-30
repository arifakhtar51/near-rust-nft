# NEAR Rust NFT Project

This project is a Non-Fungible Token (NFT) implementation on the NEAR blockchain using Rust for smart contracts and React for the frontend.

## Project Structure

- `contract/` - Rust smart contract code
- `nft-frontend/` - React frontend application

## Prerequisites

- Node.js (v14 or later)
- Rust and Cargo
- NEAR CLI
- NEAR Wallet account

## Setup

1. Install dependencies:
```bash
# Install frontend dependencies
cd nft-frontend
npm install

# Install Rust dependencies
cd ../contract
cargo build
```

2. Configure NEAR:
```bash
# Login to NEAR
near login
```

3. Deploy the contract:
```bash
# Deploy to testnet
near deploy --accountId YOUR_ACCOUNT_ID --wasmFile target/wasm32-unknown-unknown/release/your_contract.wasm
```

## Development

- Frontend: `cd nft-frontend && npm start`
- Contract: `cd contract && cargo build`

## License

MIT 