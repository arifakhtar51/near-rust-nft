use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::{UnorderedMap};
use near_sdk::{env, near_bindgen, AccountId, BorshStorageKey, PanicOnDefault};

#[derive(BorshDeserialize, BorshSerialize)]
pub struct NFTMetadata {
    pub title: String,
    pub description: String,
    pub media: String,
}

#[derive(BorshDeserialize, BorshSerialize)]
pub struct NFT {
    pub owner_id: AccountId,
    pub metadata: NFTMetadata,
}

#[derive(BorshSerialize, BorshStorageKey)]
pub enum StorageKey {
    NFTs,
    OwnerToTokenIds,
}

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct NFTContract {
    pub owner_id: AccountId,
    pub nfts: UnorderedMap<String, NFT>,  // token_id -> NFT
    pub owner_to_token_ids: UnorderedMap<AccountId, Vec<String>>, // owner_id -> token_ids
}

#[near_bindgen]
impl NFTContract {
    #[init]
    pub fn new(owner_id: AccountId) -> Self {
        Self {
            owner_id,
            nfts: UnorderedMap::new(StorageKey::NFTs),
            owner_to_token_ids: UnorderedMap::new(StorageKey::OwnerToTokenIds),
        }
    }

    #[payable]
    pub fn nft_mint(&mut self, token_id: String, receiver_id: AccountId, title: String, description: String, media: String) {
        let deposit = env::attached_deposit();
        assert!(deposit >= 10000000000000000000000, "Requires at least 0.01 NEAR to mint"); // 0.01 NEAR
        
        let nft = NFT {
            owner_id: receiver_id.clone(),
            metadata: NFTMetadata {
                title,
                description,
                media,
            },
        };

        // Store the NFT
        self.nfts.insert(&token_id, &nft);

        // Update owner's token list
        let mut token_ids = self.owner_to_token_ids.get(&receiver_id).unwrap_or_else(|| Vec::new());
        token_ids.push(token_id);
        self.owner_to_token_ids.insert(&receiver_id, &token_ids);
    }

    pub fn nft_token(&self, token_id: String) -> Option<NFTView> {
        self.nfts.get(&token_id).map(|nft| NFTView {
            token_id,
            owner_id: nft.owner_id,
            metadata: NFTMetadataView {
                title: nft.metadata.title,
                description: nft.metadata.description,
                media: nft.metadata.media,
            },
        })
    }

    pub fn nft_tokens_for_owner(&self, account_id: AccountId) -> Vec<NFTView> {
        let token_ids = self.owner_to_token_ids.get(&account_id).unwrap_or_else(|| Vec::new());
        
        token_ids.iter().filter_map(|token_id| {
            self.nfts.get(token_id).map(|nft| NFTView {
                token_id: token_id.clone(),
                owner_id: nft.owner_id,
                metadata: NFTMetadataView {
                    title: nft.metadata.title,
                    description: nft.metadata.description,
                    media: nft.metadata.media,
                },
            })
        }).collect()
    }

    pub fn nft_total_supply(&self) -> u64 {
        self.nfts.len()
    }
}

// View structures for JSON serialization
#[derive(serde::Serialize)]
pub struct NFTMetadataView {
    pub title: String,
    pub description: String,
    pub media: String,
}

#[derive(serde::Serialize)]
pub struct NFTView {
    pub token_id: String,
    pub owner_id: AccountId,
    pub metadata: NFTMetadataView,
} 