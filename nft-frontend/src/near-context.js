import React, { createContext, useContext, useEffect, useState } from 'react';
import * as nearAPI from 'near-api-js';
import getConfig from './near-config';

const nearConfig = getConfig(process.env.NODE_ENV || 'development');

export const NearContext = createContext(null);

export const NearProvider = ({ children }) => {
  const [nearConnection, setNearConnection] = useState(null);
  const [walletConnection, setWalletConnection] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initNEAR = async () => {
      try {
        // Initialize connection to the NEAR network
        const near = await nearAPI.connect({
          deps: {
            keyStore: new nearAPI.keyStores.BrowserLocalStorageKeyStore(),
          },
          ...nearConfig,
        });

        // Initialize wallet connection with appKeyPrefix
        const wallet = new nearAPI.WalletConnection(near, nearConfig.contractName);

        // Get account details if signed in
        let user = null;
        if (wallet.isSignedIn()) {
          const accountId = wallet.getAccountId();
          const account = await near.account(accountId);
          user = {
            accountId,
            account,
            balance: await account.getAccountBalance(),
          };
        }

        setNearConnection(near);
        setWalletConnection(wallet);
        setCurrentUser(user);
      } catch (error) {
        console.error('Error initializing NEAR:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initNEAR();
  }, []);

  const signIn = () => {
    if (walletConnection) {
      walletConnection.requestSignIn(
        nearConfig.contractName,
        'NEAR NFT App'
      );
    }
  };

  const signOut = () => {
    if (walletConnection) {
      walletConnection.signOut();
      setCurrentUser(null);
    }
  };

  const mintNFT = async (tokenId, metadata, ownerAccountId) => {
    if (!walletConnection || !currentUser) {
      throw new Error('Please sign in to mint NFTs');
    }

    try {
      // Allow minting NFTs for any account
      return await walletConnection.account().functionCall({
        contractId: nearConfig.contractName,
        methodName: 'nft_mint',
        args: {
          token_id: tokenId,
          token_owner_id: ownerAccountId || currentUser.accountId,
          token_metadata: {
            title: metadata.title || "",
            description: metadata.description || "",
            media: metadata.media || "",
            media_hash: null,
            copies: 1,
            issued_at: null,
            expires_at: null,
            starts_at: null,
            updated_at: null,
            extra: null,
            reference: null,
            reference_hash: null
          }
        },
        gas: '300000000000000', // 300 TGas
        attachedDeposit: nearAPI.utils.format.parseNearAmount('0.1'), // 0.1 NEAR
      });
    } catch (error) {
      console.error('Error minting NFT:', error);
      throw error;
    }
  };

  const getNFTs = async (accountId) => {
    if (!walletConnection) {
      throw new Error('Wallet not initialized');
    }

    try {
      // Try to get the NFTs from the contract
      try {
        return await walletConnection.account().viewFunction({
          contractId: nearConfig.contractName,
          methodName: 'nft_tokens_for_owner',
          args: {
            account_id: accountId || currentUser?.accountId,
          },
        });
      } catch (error) {
        console.error('Error fetching NFTs from contract:', error);
        
        // If we get a deserialization error, return mock NFTs data for development
        if (error.toString().includes('Deserialization')) {
          console.log('Using mock NFT data due to contract deserialization error');
          return []; // Return empty array as a fallback
        }
        
        throw error;
      }
    } catch (error) {
      console.error('Error fetching NFTs:', error);
      // Don't throw here, just return empty array
      return [];
    }
  };

  return (
    <NearContext.Provider
      value={{
        nearConnection,
        walletConnection,
        currentUser,
        isLoading,
        signIn,
        signOut,
        mintNFT,
        getNFTs,
      }}
    >
      {children}
    </NearContext.Provider>
  );
};

export const useNear = () => useContext(NearContext); 