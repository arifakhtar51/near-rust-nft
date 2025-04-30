# NEAR NFT Minter Frontend

A modern React frontend for interacting with the NEAR NFT Smart Contract.

## Features

- Connect with NEAR wallet
- Mint new NFTs with metadata (title, description, media URL)
- View your NFT collection
- Modern, responsive UI built with Bootstrap

## Prerequisites

- Node.js (v14 or later)
- NPM or Yarn
- A deployed NFT contract on NEAR testnet

## Setup

1. Install dependencies:
   ```
   npm install
   ```
   or
   ```
   yarn
   ```

2. Update the contract name in `src/near-config.js` to match your deployed contract:
   ```js
   const CONTRACT_NAME = process.env.CONTRACT_NAME || "mynft.testnet"; // change to your contract name
   ```

3. Start the development server:
   ```
   npm start
   ```
   or
   ```
   yarn start
   ```

## Building for Production

```
npm run build
```
or
```
yarn build
```

This creates a production-ready build in the `build` folder.

## Connecting to Different Networks

The app is configured to connect to NEAR testnet by default. To connect to mainnet, set the environment variable:

```
NODE_ENV=production npm start
```

## Usage

1. Click "Sign In with NEAR" to connect your NEAR wallet
2. Fill out the NFT minting form
3. Click "Mint NFT" to create a new NFT
4. View your NFTs in the gallery on the right

## License

This project is licensed under the MIT License. 