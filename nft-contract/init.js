const { connect, keyStores, KeyPair } = require('near-api-js');
const fs = require('fs');
const path = require('path');
const homedir = require('os').homedir();

const CREDENTIALS_DIR = '.near-credentials';
const CONTRACT_ID = 'ariftest1.testnet';
const NETWORK_ID = 'testnet'; 

// Configure connection to NEAR
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

    // Call contract initialization function
    const result = await account.functionCall({
      contractId: CONTRACT_ID,
      methodName: 'new',
      args: { owner_id: CONTRACT_ID },
      gas: '300000000000000', // 300 TGas
    });

    console.log('Successfully initialized contract!');
    console.log('Transaction ID:', result.transaction.hash);
  } catch (error) {
    console.error('Error initializing contract:', error);
  }
}

initializeContract(); 