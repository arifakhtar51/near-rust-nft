use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::{LazyOption, UnorderedSet};
use near_sdk::{
    env, near_bindgen, AccountId, BorshStorageKey, PanicOnDefault, PromiseOrValue,
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
    TokensPerOwner { account_hash: Vec<u8> },
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
    pub fn new_default_meta() -> Self {
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
                ValidAccountId::try_from(env::current_account_id()).unwrap(),
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
        let owner_id: AccountId = token_owner_id.into();

        assert!(
            self.token.owner_by_id.insert(&token_id, &owner_id).is_none(),
            "Token already exists"
        );

        self.token
            .token_metadata_by_id
            .as_mut()
            .unwrap()
            .insert(&token_id, &token_metadata);

        // Add to owner's token set
        if let Some(tokens_per_owner) = &mut self.token.tokens_per_owner {
            let mut tokens_set = tokens_per_owner.get(&owner_id).unwrap_or_else(|| {
                let prefix = StorageKey::TokensPerOwner {
                    account_hash: env::sha256(owner_id.as_bytes()),
                };
                UnorderedSet::new(prefix)
            });
            tokens_set.insert(&token_id);
            tokens_per_owner.insert(&owner_id, &tokens_set);
        }

        Token {
            token_id,
            owner_id,
            metadata: Some(token_metadata),
            approved_account_ids: Default::default(),
        }
    }
}

// Implement the core NFT standard
#[near_bindgen]
impl NonFungibleTokenCore for Contract {
    #[payable]
    fn nft_transfer(
        &mut self,
        receiver_id: ValidAccountId,
        token_id: TokenId,
        approval_id: Option<u64>,
        memo: Option<String>,
    ) {
        self.token
            .nft_transfer(receiver_id, token_id, approval_id, memo)
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
        self.token
            .nft_transfer_call(receiver_id, token_id, approval_id, memo, msg)
    }

    fn nft_token(self, token_id: TokenId) -> Option<Token> {
        self.token.nft_token(token_id)
    }

    fn mint(
        &mut self,
        token_id: TokenId,
        token_owner_id: ValidAccountId,
        token_metadata: Option<TokenMetadata>,
    ) -> Token {
        self.nft_mint(token_id, token_owner_id, token_metadata.unwrap())
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

    fn nft_tokens_for_owner(
        &self,
        account_id: ValidAccountId,
        from_index: Option<U128>,
        limit: Option<u64>,
    ) -> Vec<Token> {
        self.token
            .nft_tokens_for_owner(account_id, from_index, limit)
    }
} 