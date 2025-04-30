const CONTRACT_NAME = "arifakhtar.testnet";

function getConfig(env) {
  // Always use testnet configuration since our contract is on testnet
  return {
    networkId: "testnet",
    nodeUrl: "https://rpc.testnet.near.org",
    contractName: "arifakhtar.testnet",
    walletUrl: "https://testnet.mynearwallet.com",
    helperUrl: "https://helper.testnet.near.org",
    explorerUrl: "https://explorer.testnet.near.org",
  };
}

export default getConfig; 