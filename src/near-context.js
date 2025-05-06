import React, { createContext, useContext, useEffect, useState } from 'react';
import * as nearAPI from 'near-api-js';
import getConfig from './near-config';

const nearConfig = getConfig(process.env.NODE_ENV || 'development');

const NearContext = createContext();

export const useNear = () => useContext(NearContext);

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

        // Initialize wallet connection
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

  const mintNFT = async (tokenId, metadata, ownerAccountId, price) => {
    if (!walletConnection || !currentUser) {
      console.log("Wallet not initialized or user not signed in");
      throw new Error('Please sign in to mint NFTs');
    }

    if (!price) {
      throw new Error('Price is required for minting');
    }

    try {
      // Convert price to yoctoNEAR
      const priceInYocto = nearAPI.utils.format.parseNearAmount(price.toString());
      if (!priceInYocto) {
        throw new Error('Invalid price format');
      }

      const args = {
        token_id: tokenId,
        token_owner_id: ownerAccountId || currentUser.accountId,
        token_metadata: {
          title: metadata.title || "",
          description: metadata.description || "",
          media: metadata.media || "",
        },
        price: priceInYocto
      };

      console.log('Minting NFT with args:', args);

      return await walletConnection.account().functionCall({
        contractId: nearConfig.contractName,
        methodName: 'nft_mint',
        args,
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
      console.log("Wallet not initialized, returning empty array of NFTs");
      return [];
    }

    try {
      if (accountId) {
        // Get NFTs for specific account
        console.log(`Fetching NFTs for account: ${accountId}`);
        const nfts = await walletConnection.account().viewFunction({
          contractId: nearConfig.contractName,
          methodName: 'nft_tokens_for_owner',
          args: {
            account_id: accountId,
          },
        });

        console.log(`Found ${nfts.length} NFTs for user ${accountId}:`, nfts);

        // Format the NFTs to have consistent price format
        const formattedNFTs = nfts.map(nft => ({
          ...nft,
          price: nearAPI.utils.format.formatNearAmount(nft.price)
        }));
        
        return formattedNFTs;
      } else {
        // Get all NFTs from the contract
        console.log('Fetching all NFTs from the contract...');
        
        try {
          const allNFTs = await walletConnection.account().viewFunction({
            contractId: nearConfig.contractName,
            methodName: 'nft_tokens',
            args: {
              from_index: 0,
              limit: 100 // Reasonable limit to prevent timeouts
            },
          });
          
          console.log(`Found ${allNFTs.length} total NFTs in the contract:`, allNFTs);
          
          // Format the NFTs to have consistent price format
          const formattedNFTs = allNFTs.map(nft => ({
            ...nft,
            price: nearAPI.utils.format.formatNearAmount(nft.price)
          }));
          
          return formattedNFTs;
        } catch (error) {
          console.error('Error fetching all NFTs directly:', error);
          
          // Fallback to get_all_listed_nfts method
          const listedTokenIds = await walletConnection.account().viewFunction({
            contractId: nearConfig.contractName,
            methodName: 'get_all_listed_nfts',
            args: {},
          });
  
          console.log('Listed token IDs:', listedTokenIds);
  
          if (!listedTokenIds || listedTokenIds.length === 0) {
            console.log('No listed NFTs found');
            return [];
          }
  
          // For each token ID, fetch the full NFT data
          const listedNFTPromises = listedTokenIds.map(async (tokenId) => {
            try {
              const token = await walletConnection.account().viewFunction({
                contractId: nearConfig.contractName,
                methodName: 'nft_token',
                args: { token_id: tokenId },
              });
  
              if (token) {
                return {
                  ...token,
                  price: nearAPI.utils.format.formatNearAmount(token.price)
                };
              }
              return null;
            } catch (error) {
              console.error(`Error fetching data for token ${tokenId}:`, error);
              return null;
            }
          });
  
          const listedNFTs = await Promise.all(listedNFTPromises);
          const validNFTs = listedNFTs.filter(nft => nft !== null);
          
          console.log(`Retrieved ${validNFTs.length} valid NFTs:`, validNFTs);
          return validNFTs;
        }
      }
    } catch (error) {
      console.error('Error fetching NFTs:', error);
      // Silently return empty array instead of throwing error
      return [];
    }
  };

  const buyNFT = async (tokenId, price) => {
    if (!walletConnection || !currentUser) {
      console.log("Wallet not initialized or user not signed in");
      throw new Error('Please sign in to buy NFTs');
    }

    try {
      const priceInYocto = nearAPI.utils.format.parseNearAmount(price.toString());
      if (!priceInYocto) {
        throw new Error('Invalid price format');
      }
      
      return await walletConnection.account().functionCall({
        contractId: nearConfig.contractName,
        methodName: 'buy_nft',
        args: {
          token_id: tokenId,
        },
        gas: '300000000000000',
        attachedDeposit: priceInYocto,
      });
    } catch (error) {
      console.error('Error buying NFT:', error);
      throw error;
    }
  };

  const addToCart = async (tokenId) => {
    if (!walletConnection || !currentUser) {
      console.log("Wallet not initialized or user not signed in");
      throw new Error('Please sign in to add to cart');
    }

    try {
      return await walletConnection.account().functionCall({
        contractId: nearConfig.contractName,
        methodName: 'add_to_cart',
        args: {
          token_id: tokenId,
        },
        gas: '300000000000000',
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  };

  const removeFromCart = async (tokenId) => {
    if (!walletConnection || !currentUser) {
      console.log("Wallet not initialized or user not signed in");
      throw new Error('Please sign in to remove from cart');
    }

    try {
      return await walletConnection.account().functionCall({
        contractId: nearConfig.contractName,
        methodName: 'remove_from_cart',
        args: {
          token_id: tokenId,
        },
        gas: '300000000000000',
      });
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  };

  const getCart = async (accountId) => {
    if (!walletConnection) {
      console.log("Wallet not initialized, returning empty cart");
      return [];
    }

    try {
      return await walletConnection.account().viewFunction({
        contractId: nearConfig.contractName,
        methodName: 'get_cart',
        args: {
          account_id: accountId,
        },
      });
    } catch (error) {
      console.error('Error fetching cart:', error);
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
        buyNFT,
        addToCart,
        removeFromCart,
        getCart
      }}
    >
      {children}
    </NearContext.Provider>
  );
}; 