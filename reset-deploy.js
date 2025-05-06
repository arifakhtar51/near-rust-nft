const { connect, keyStores, KeyPair, utils } = require('near-api-js');
const fs = require('fs');
const path = require('path');
const homedir = require('os').homedir();

const CREDENTIALS_DIR = '.near-credentials';
const CONTRACT_ID = 'kumkum.testnet';
const NETWORK_ID = 'testnet'; 

// Configure connection to NEAR
async function resetAndDeployContract() {
  const credentialsPath = path.join(homedir, CREDENTIALS_DIR);
  const keyStore = new keyStores.UnencryptedFileSystemKeyStore(credentialsPath);

  const config = {
    keyStore,
    networkId: NETWORK_ID,
    nodeUrl: `https://rpc.${NETWORK_ID}.near.org`,
  };

  try {
    // Connect to NEAR
    const near = await connect(config);
    const account = await near.account(CONTRACT_ID);
    
    console.log(`Connected to account ${CONTRACT_ID}`);
    
    // Read WASM file
    const wasmPath = path.resolve(__dirname, './res/nft_contract.wasm');
    const wasmBytes = fs.readFileSync(wasmPath);
    console.log(`Read WASM file from ${wasmPath}, size: ${wasmBytes.length} bytes`);
    
    // Delete state and deploy
    console.log('Deploying contract (this will reset any existing state)...');
    await account.deployContract(wasmBytes);
    console.log('Contract deployed successfully');
    
    // Initialize the contract
    console.log('Initializing contract...');
    try {
      await account.functionCall({
        contractId: CONTRACT_ID,
        methodName: 'new',
        args: { owner_id: CONTRACT_ID },
        gas: '300000000000000', // 300 TGas
      });
      console.log('Contract initialized successfully!');
    } catch (initError) {
      // If initialization fails because the contract is already initialized, it's okay
      if (initError.toString().includes("The contract has already been initialized")) {
        console.log('Contract already initialized, skipping initialization.');
      } else {
        throw initError;
      }
    }
  } catch (error) {
    console.error('Error resetting/deploying contract:', error);
  }
}

resetAndDeployContract(); 