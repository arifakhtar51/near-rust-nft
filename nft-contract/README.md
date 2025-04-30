# NEAR NFT Smart Contract

A minimal NFT smart contract implementation for the NEAR Protocol following the NEP-171 standard.

## Features

- NFT minting (restricted to contract owner)
- Basic metadata support (title, description, media URL)
- Full compliance with NEAR NFT standards

## Prerequisites

- Rust toolchain with `wasm32-unknown-unknown` target
- NEAR CLI
- NEAR account with sufficient funds

## Building the Contract

1. Install Rust and add the WASM target:
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   rustup target add wasm32-unknown-unknown
   ```

2. Build the contract:
   ```bash
   cd nft-contract
   cargo build --target wasm32-unknown-unknown --release
   ```

3. The compiled WASM will be in `target/wasm32-unknown-unknown/release/nft_contract.wasm`

## Deploying the Contract

1. Create a NEAR account or use an existing one:
   ```bash
   near login
   ```

2. Deploy the contract to your account:
   ```bash
   near deploy --wasmFile target/wasm32-unknown-unknown/release/nft_contract.wasm --accountId YOUR_ACCOUNT_ID
   ```

3. Initialize the contract:
   ```bash
   near call YOUR_ACCOUNT_ID new_default_meta '{"owner_id": "YOUR_ACCOUNT_ID", "name": "My NFT Collection", "symbol": "MYNFT"}' --accountId YOUR_ACCOUNT_ID
   ```

## Minting NFTs

To mint a new NFT (only the contract owner can do this):

```bash
near call YOUR_ACCOUNT_ID nft_mint '{"token_id": "1", "receiver_id": "RECEIVER_ACCOUNT_ID", "token_metadata": {"title": "My First NFT", "description": "This is my first NFT on NEAR!", "media": "https://example.com/nft-image.png"}}' --accountId YOUR_ACCOUNT_ID --deposit 0.1
```

## Viewing NFTs

To view an NFT:

```bash
near view YOUR_ACCOUNT_ID nft_token '{"token_id": "1"}'
```

To view all NFTs for an owner:

```bash
near view YOUR_ACCOUNT_ID nft_tokens_for_owner '{"account_id": "OWNER_ACCOUNT_ID", "from_index": "0", "limit": 50}'
```

## License

This project is licensed under the MIT License. 