use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::UnorderedMap;
use near_sdk::json_types::U128;
use near_sdk::serde::{Deserialize, Serialize};
use near_sdk::{env, near_bindgen, AccountId, PanicOnDefault, Promise};

// Simple metadata structure
#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone, Debug)]
#[serde(crate = "near_sdk::serde")]
pub struct TokenMetadata {
    pub title: Option<String>,
    pub description: Option<String>,
    pub media: Option<String>,
}

// NFT token structure
#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone, Debug)]
#[serde(crate = "near_sdk::serde")]
pub struct Token {
    pub token_id: String,
    pub owner_id: AccountId,
    pub metadata: TokenMetadata,
    pub price: U128,
}

// Cart item structure
#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone, Debug)]
#[serde(crate = "near_sdk::serde")]
pub struct CartItem {
    pub token_id: String,
    pub price: U128,
}

// Main contract structure
#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct Contract {
    pub owner_id: AccountId,
    pub tokens_by_id: UnorderedMap<String, Token>,
    pub tokens_by_owner: UnorderedMap<AccountId, Vec<String>>,
    pub carts: UnorderedMap<AccountId, Vec<CartItem>>,
}

#[near_bindgen]
impl Contract {
    // Initialize the contract
    #[init]
    pub fn new(owner_id: AccountId) -> Self {
        assert!(!env::state_exists(), "Already initialized");
        Self {
            owner_id,
            tokens_by_id: UnorderedMap::new(b"t"),
            tokens_by_owner: UnorderedMap::new(b"o"),
            carts: UnorderedMap::new(b"c"),
        }
    }

    // Mint a new NFT
    #[payable]
    pub fn nft_mint(
        &mut self,
        token_id: String,
        token_owner_id: AccountId,
        token_metadata: TokenMetadata,
        price: U128,
    ) -> Token {
        // Ensure the token ID doesn't already exist
        assert!(
            self.tokens_by_id.get(&token_id).is_none(),
            "Token with ID already exists"
        );

        env::log(format!("Minting token {} with price {}", token_id, price.0).as_bytes());

        // Create the token
        let token = Token {
            token_id: token_id.clone(),
            owner_id: token_owner_id.clone(),
            metadata: token_metadata,
            price,
        };

        // Store the token
        self.tokens_by_id.insert(&token_id, &token);

        // Add to owner's tokens
        let mut tokens = self.tokens_by_owner.get(&token_owner_id).unwrap_or_else(Vec::new);
        tokens.push(token_id.clone());
        self.tokens_by_owner.insert(&token_owner_id, &tokens);

        env::log(format!("Minted NFT with ID: {}", token_id).as_bytes());
        token
    }

    // Buy an NFT
    #[payable]
    pub fn buy_nft(&mut self, token_id: String) {
        let token = self.tokens_by_id.get(&token_id).expect("Token not found");
        let buyer_id = env::predecessor_account_id();
        let seller_id = token.owner_id.clone();
        
        // Ensure buyer is not the owner
        assert!(buyer_id != seller_id, "Cannot buy your own NFT");
        
        // Ensure attached deposit is sufficient
        let price = token.price.0;
        assert!(
            env::attached_deposit() >= price,
            "Attached deposit is less than the NFT price"
        );

        // Update owner in tokens_by_id
        let mut updated_token = token.clone();
        updated_token.owner_id = buyer_id.clone();
        self.tokens_by_id.insert(&token_id, &updated_token);
        
        // Update tokens_by_owner for seller
        if let Some(mut seller_tokens) = self.tokens_by_owner.get(&seller_id) {
            seller_tokens.retain(|id| id != &token_id);
            self.tokens_by_owner.insert(&seller_id, &seller_tokens);
        }
        
        // Update tokens_by_owner for buyer
        let mut buyer_tokens = self.tokens_by_owner.get(&buyer_id).unwrap_or_else(Vec::new);
        buyer_tokens.push(token_id.clone());
        self.tokens_by_owner.insert(&buyer_id, &buyer_tokens);
        
        // Transfer funds to seller
        Promise::new(seller_id.clone()).transfer(price);
        
        env::log(format!("NFT {} transferred from {} to {}", token_id, seller_id, buyer_id).as_bytes());
    }
    
    // Add to cart functionality
    pub fn add_to_cart(&mut self, token_id: String) {
        let account_id = env::predecessor_account_id();
        let token = self.tokens_by_id.get(&token_id).expect("Token not found");
        
        let mut cart = self.carts.get(&account_id).unwrap_or_else(Vec::new);
        
        // Check if the item is already in the cart
        if !cart.iter().any(|item| item.token_id == token_id) {
            cart.push(CartItem {
                token_id: token_id.clone(),
                price: token.price,
            });
            self.carts.insert(&account_id, &cart);
            env::log(format!("Added NFT {} to cart", token_id).as_bytes());
        }
    }
    
    // Remove from cart functionality
    pub fn remove_from_cart(&mut self, token_id: String) {
        let account_id = env::predecessor_account_id();
        if let Some(mut cart) = self.carts.get(&account_id) {
            cart.retain(|item| item.token_id != token_id);
            self.carts.insert(&account_id, &cart);
            env::log(format!("Removed NFT {} from cart", token_id).as_bytes());
        }
    }
    
    // Get cart contents
    pub fn get_cart(&self, account_id: AccountId) -> Vec<CartItem> {
        self.carts.get(&account_id).unwrap_or_else(Vec::new)
    }
    
    // Get a specific token
    pub fn nft_token(&self, token_id: String) -> Option<Token> {
        self.tokens_by_id.get(&token_id)
    }
    
    // Get all tokens
    pub fn nft_tokens(&self, from_index: Option<u64>, limit: Option<u64>) -> Vec<Token> {
        let start = from_index.unwrap_or(0) as usize;
        let end = limit.map(|limit| start + limit as usize);
        
        self.tokens_by_id
            .iter()
            .skip(start)
            .take(end.unwrap_or(usize::MAX) - start)
            .map(|(_, token)| token)
            .collect()
    }
    
    // Get tokens for a specific owner
    pub fn nft_tokens_for_owner(&self, account_id: AccountId) -> Vec<Token> {
        if let Some(token_ids) = self.tokens_by_owner.get(&account_id) {
            token_ids
                .iter()
                .filter_map(|token_id| self.tokens_by_id.get(token_id))
                .collect()
        } else {
            vec![]
        }
    }
    
    // Get all listed NFTs
    pub fn get_all_listed_nfts(&self) -> Vec<String> {
        self.tokens_by_id.keys().collect()
    }
    
    // Get the price of an NFT
    pub fn get_nft_price(&self, token_id: String) -> Option<U128> {
        self.tokens_by_id.get(&token_id).map(|token| token.price)
    }
    
    // Get NFT listing details
    pub fn get_nft_listing(&self, token_id: String) -> Option<(AccountId, String, U128)> {
        self.tokens_by_id.get(&token_id).map(|token| {
            let title = token.metadata.title.unwrap_or_else(|| "Untitled".to_string());
            (token.owner_id, title, token.price)
        })
    }
} 