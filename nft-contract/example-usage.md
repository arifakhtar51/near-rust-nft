# NFT Contract Examples

This document provides examples of how to interact with the NFT contract using NEAR CLI.

## Setup

Make sure you have NEAR CLI installed:
```bash
npm install -g near-cli
```

## Initializing the Contract

After deploying the contract to your account (e.g., `mynft.testnet`), initialize it:

```bash
near call mynft.testnet new_default_meta '{"owner_id": "mynft.testnet", "name": "My NFT Collection", "symbol": "MYNFT"}' --accountId mynft.testnet
```

## Minting an NFT

Mint a new NFT with metadata:

```bash
near call mynft.testnet nft_mint '{
  "token_id": "token-1",
  "receiver_id": "receiver.testnet",
  "token_metadata": {
    "title": "My First NFT",
    "description": "A beautiful NFT on NEAR",
    "media": "https://example.com/image.png",
    "media_hash": null,
    "copies": 1,
    "issued_at": null,
    "expires_at": null,
    "starts_at": null,
    "updated_at": null,
    "extra": null,
    "reference": null,
    "reference_hash": null
  }
}' --accountId mynft.testnet --deposit 0.1
```

## Querying NFT Information

### Get a Single NFT

```bash
near view mynft.testnet nft_token '{"token_id": "token-1"}'
```

### Get All NFTs Owned by an Account

```bash
near view mynft.testnet nft_tokens_for_owner '{
  "account_id": "receiver.testnet",
  "from_index": "0",
  "limit": 50
}'
```

### Get Contract Metadata

```bash
near view mynft.testnet nft_metadata
```

### Get Total Supply

```bash
near view mynft.testnet nft_total_supply
```

## Transferring an NFT

Only the owner of the NFT can transfer it:

```bash
near call mynft.testnet nft_transfer '{
  "receiver_id": "new-owner.testnet",
  "token_id": "token-1",
  "memo": "Transferring my NFT"
}' --accountId receiver.testnet --depositYocto 1
```

## Approving Another Account to Transfer the NFT

```bash
near call mynft.testnet nft_approve '{
  "token_id": "token-1",
  "account_id": "marketplace.testnet",
  "msg": null
}' --accountId receiver.testnet --deposit 0.01
```

After approval, the approved account can transfer the NFT using `nft_transfer_call` or `nft_transfer`. 