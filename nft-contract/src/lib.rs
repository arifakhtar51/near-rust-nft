use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::LazyOption;
use near_sdk::{
    env, near_bindgen, BorshStorageKey, PanicOnDefault, PromiseOrValue,
};
use near_sdk::json_types::{ValidAccountId, U128};
use near_contract_standards::non_fungible_token::core::NonFungibleTokenCore;
use near_contract_standards::non_fungible_token::metadata::{
    NFTContractMetadata, TokenMetadata,
};
use near_contract_standards::non_fungible_token::{NonFungibleToken, Token, TokenId};
use near_contract_standards::non_fungible_token::enumeration::NonFungibleTokenEnumeration;

#[derive(BorshSerialize, BorshStorageKey)]
pub enum StorageKey {
    NonFungibleToken,
    Metadata,
    TokenMetadata,
    Enumeration,
    Approval,
}

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct Contract {
    token: NonFungibleToken,
    metadata: LazyOption<NFTContractMetadata>,
}

#[near_bindgen]
impl Contract {
    #[init]
    pub fn new(owner_id: ValidAccountId) -> Self {
        assert!(!env::state_exists(), "Already initialized");
        
        let metadata = NFTContractMetadata {
            spec: "nft-1.0.0".to_string(),
            name: "Simple NFT".to_string(),
            symbol: "SNFT".to_string(),
            icon: None,
            base_uri: None,
            reference: None,
            reference_hash: None,
        };

        Self {
            token: NonFungibleToken::new(
                StorageKey::NonFungibleToken,
                owner_id,
                Some(StorageKey::TokenMetadata),
                Some(StorageKey::Enumeration),
                Some(StorageKey::Approval),
            ),
            metadata: LazyOption::new(
                StorageKey::Metadata,
                Some(&metadata),
            ),
        }
    }

    #[payable]
    pub fn nft_mint(
        &mut self,
        token_id: TokenId,
        token_owner_id: ValidAccountId,
        token_metadata: TokenMetadata,
    ) -> Token {
        self.token.mint(token_id, token_owner_id, Some(token_metadata))
    }
}

// Implement the core NFT standard
#[near_bindgen]
impl NonFungibleTokenCore for Contract {
    #[payable]
    fn nft_transfer(&mut self, receiver_id: ValidAccountId, token_id: TokenId, approval_id: Option<u64>, memo: Option<String>) {
        self.token.nft_transfer(receiver_id, token_id, approval_id, memo)
    }

    #[payable]
    fn nft_transfer_call(
        &mut self,
        receiver_id: ValidAccountId,
        token_id: TokenId,
        approval_id: Option<u64>,
        memo: Option<String>,
        msg: String,
    ) -> PromiseOrValue<bool> {
        self.token.nft_transfer_call(receiver_id, token_id, approval_id, memo, msg)
    }

    fn nft_token(self, token_id: TokenId) -> Option<Token> {
        self.token.nft_token(token_id)
    }

    fn mint(&mut self, token_id: TokenId, token_owner_id: ValidAccountId, token_metadata: Option<TokenMetadata>) -> Token {
        self.token.mint(token_id, token_owner_id, token_metadata)
    }
}

// Implement the enumeration standard
#[near_bindgen]
impl NonFungibleTokenEnumeration for Contract {
    fn nft_total_supply(self) -> U128 {
        self.token.nft_total_supply()
    }

    fn nft_tokens(&self, from_index: Option<U128>, limit: Option<u64>) -> Vec<Token> {
        self.token.nft_tokens(from_index, limit)
    }

    fn nft_supply_for_owner(self, account_id: ValidAccountId) -> U128 {
        self.token.nft_supply_for_owner(account_id)
    }

    fn nft_tokens_for_owner(&self, account_id: ValidAccountId, from_index: Option<U128>, limit: Option<u64>) -> Vec<Token> {
        self.token.nft_tokens_for_owner(account_id, from_index, limit)
    }
} 