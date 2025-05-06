const { connect, keyStores } = require('near-api-js');
const path = require('path');
const homedir = require('os').homedir();

const CREDENTIALS_DIR = '.near-credentials';
const CONTRACT_ID = 'nft-final.kumkum.testnet';
const NETWORK_ID = 'testnet'; 

async function initializeContract() {
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
    
    // Initialize the contract
    console.log('Initializing contract...');
    try {
      const result = await account.functionCall({
        contractId: CONTRACT_ID,
        methodName: 'new',
        args: { owner_id: CONTRACT_ID },
        gas: '300000000000000', // 300 TGas
      });
      console.log('Contract initialized successfully!');
      console.log('Result:', result);
    } catch (initError) {
      // If initialization fails because the contract is already initialized, it's okay
      if (initError.toString().includes("The contract has already been initialized")) {
        console.log('Contract already initialized, skipping initialization.');
      } else {
        throw initError;
      }
    }
  } catch (error) {
    console.error('Error initializing contract:', error);
  }
}

initializeContract(); 