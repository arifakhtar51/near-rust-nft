import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, Link } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNear } from './near-context';
import Navbar from './components/Navbar';
import './App.css';

// Pinata configuration
const PINATA_API_KEY = '8a642b5d4d4029fbbc41';
const PINATA_API_SECRET = '5912c7d4b8c51f3c97c9b0d16b304e6522b35406f31c502e4be4dd2cf9342a34';

function Home({ currentUser, getNFTs, buyNFT, addToCart }) {
  const { signIn } = useNear();
  const [nfts, setNfts] = useState([]);
  const [userNfts, setUserNfts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUserNftsLoading, setIsUserNftsLoading] = useState(false);
  const [isWalletInitialized, setIsWalletInitialized] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState('marketplace');
  const location = useLocation();

  useEffect(() => {
    console.log("Home component mounted or refreshTrigger updated");
    const initializeWallet = async () => {
      try {
        // Check if wallet is initialized
        const wallet = window.walletConnection;
        if (wallet) {
          console.log("Wallet is initialized:", wallet.getAccountId());
          setIsWalletInitialized(true);
          await loadAllNFTs();
        } else {
          console.log("Wallet is not initialized");
          setIsWalletInitialized(false);
          await loadMarketplaceNFTs();
        }
      } catch (error) {
        console.error('Error initializing wallet:', error);
        setIsWalletInitialized(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeWallet();
  }, [refreshTrigger]);

  // Check if user was redirected from mint page or my-nfts page
  useEffect(() => {
    if (location.state) {
      if (location.state.fromMint) {
        console.log("Detected redirect from mint page, refreshing NFTs...");
        handleRefresh();
      }
      
      if (location.state.activeTab) {
        console.log(`Setting active tab to ${location.state.activeTab} from navigation`);
        setActiveTab(location.state.activeTab);
      }
    }
  }, [location]);

  // When user signs in/out, refresh the NFTs accordingly
  useEffect(() => {
    if (currentUser) {
      loadUserNFTs();
    } else {
      setUserNfts([]);
    }
  }, [currentUser, refreshTrigger]);

  const loadAllNFTs = async () => {
    await Promise.all([
      loadMarketplaceNFTs(),
      currentUser ? loadUserNFTs() : Promise.resolve()
    ]);
  };

  const loadMarketplaceNFTs = async () => {
    setIsLoading(true);
    try {
      console.log("Fetching NFTs for marketplace...");
      const listedNFTs = await getNFTs(); // Passing null to get all listed NFTs
      console.log("Fetched NFTs:", listedNFTs);
      
      if (listedNFTs && listedNFTs.length > 0) {
        console.log(`Successfully loaded ${listedNFTs.length} NFTs`);
        // Log first NFT for debugging
        if (listedNFTs[0]) {
          console.log("First NFT details:", {
            id: listedNFTs[0].token_id,
            owner: listedNFTs[0].owner_id,
            metadata: listedNFTs[0].metadata,
            price: listedNFTs[0].price
          });
        }
      } else {
        console.log("No NFTs were returned from the contract");
      }
      
      setNfts(listedNFTs || []);
    } catch (error) {
      console.error('Error loading marketplace NFTs:', error);
      // Don't show any error toast - wallet initialization errors should be silent to users
      setNfts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserNFTs = async () => {
    if (!currentUser) return;
    
    setIsUserNftsLoading(true);
    try {
      console.log(`Loading NFTs for user: ${currentUser.accountId}`);
      const userOwnedNFTs = await getNFTs(currentUser.accountId);
      console.log(`Found ${userOwnedNFTs.length} NFTs owned by current user:`, userOwnedNFTs);
      setUserNfts(userOwnedNFTs || []);
    } catch (error) {
      console.error('Error loading user NFTs:', error);
      toast.error('Failed to load your NFTs: ' + error.message);
    } finally {
      setIsUserNftsLoading(false);
    }
  };

  const handleRefresh = () => {
    console.log("Manual refresh triggered");
    setRefreshTrigger(prev => prev + 1);
  };

  const handleBuy = async (tokenId, price) => {
    if (!currentUser) {
      toast.error('Please sign in to buy NFTs');
      return;
    }
    try {
      await buyNFT(tokenId, price);
      toast.success('NFT purchased successfully!');
      // Refresh the NFT list
      handleRefresh();
    } catch (error) {
      console.error('Error buying NFT:', error);
      toast.error('Failed to buy NFT: ' + error.message);
    }
  };

  const handleAddToCart = async (tokenId) => {
    if (!currentUser) {
      toast.error('Please sign in to add to cart');
      return;
    }
    try {
      await addToCart(tokenId);
      toast.success('Added to cart!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart: ' + error.message);
    }
  };

  const renderNFTCard = (nft, isUserNFT = false) => {
    // Add debug console log for NFT price
    console.log(`Rendering NFT card for ${nft.token_id}:`, {
      hasPrice: !!nft.price,
      priceValue: nft.price,
      owner: nft.owner_id,
      isUserNFT
    });
    
    return (
      <div key={nft.token_id} className="col-md-4 mb-4">
        <div className="card h-100 shadow-sm">
          {nft.metadata && nft.metadata.media ? (
            <img 
              src={nft.metadata.media} 
              className="card-img-top" 
              alt={nft.metadata?.title || "NFT"}
              style={{ height: '200px', objectFit: 'cover' }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://via.placeholder.com/200x200?text=Image+Not+Available';
                console.log(`Failed to load image for NFT: ${nft.token_id}`);
              }}
            />
          ) : (
            <div className="card-img-top bg-light d-flex align-items-center justify-content-center" style={{ height: '200px' }}>
              <span className="text-muted">No Image Available</span>
            </div>
          )}
          <div className="card-body">
            <h5 className="card-title">{nft.metadata?.title || "Untitled NFT"}</h5>
            <p className="card-text small text-truncate">{nft.metadata?.description || "No description"}</p>
            <p className="card-text">
              <small className="text-muted">Owner: {nft.owner_id || "Unknown"}</small>
            </p>
            {isUserNFT && (
              <div className="mb-2">
                <span className="badge bg-info me-2">Your NFT</span>
              </div>
            )}
            {nft.price ? (
              <div className="d-flex align-items-center mb-3">
                <span className="badge bg-success me-2">For Sale</span>
                <span className="fw-bold text-success">{nft.price} NEAR</span>
              </div>
            ) : (
              <div>
                <p className="text-muted small">Price not set</p>
                {isUserNFT && (
                  <div className="small alert alert-warning">
                    Your NFT appears to have no price set despite being minted with a price. Please refresh or try minting again.
                  </div>
                )}
              </div>
            )}
            {!isUserNFT && (
              <div className="d-flex justify-content-between mt-auto">
                <button 
                  className="btn btn-primary"
                  onClick={() => handleBuy(nft.token_id, nft.price)}
                  disabled={!currentUser || !nft.price || nft.owner_id === currentUser.accountId}
                >
                  {!currentUser ? 'Sign in to Buy' : 
                   (nft.owner_id === currentUser.accountId ? 'You own this' : 'Buy Now')}
                </button>
                <button 
                  className="btn btn-outline-primary"
                  onClick={() => handleAddToCart(nft.token_id)}
                  disabled={!currentUser || nft.owner_id === currentUser.accountId}
                >
                  <i className="bi bi-cart-plus"></i>
                </button>
              </div>
            )}
          </div>
          <div className="card-footer text-muted small">
            Token ID: {nft.token_id}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading && !userNfts.length) {
    return (
      <div className="text-center p-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading NFTs...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>NFT Marketplace</h2>
        <div>
          {currentUser && (
            <Link to="/mint" className="btn btn-success me-2">
              <i className="bi bi-plus-circle"></i> Mint New NFT
            </Link>
          )}
          <button onClick={handleRefresh} className="btn btn-outline-primary">
            <i className="bi bi-arrow-repeat"></i> Refresh
          </button>
        </div>
      </div>
      
      {!isWalletInitialized && (
        <div className="alert alert-info">
          <strong>Connect your wallet</strong> to buy NFTs or add them to your cart.
          <button className="btn btn-primary ms-3" onClick={signIn}>Connect Wallet</button>
        </div>
      )}

      {currentUser && (
        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'marketplace' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('marketplace');
                // Update URL state without changing the URL
                window.history.replaceState({}, '', '/');
              }}
            >
              Marketplace
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'mynfts' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('mynfts');
                // Update URL state without changing the URL
                window.history.replaceState({activeTab: 'mynfts'}, '', '/');
              }}
            >
              My NFTs {userNfts.length > 0 && <span className="badge bg-primary ms-1">{userNfts.length}</span>}
            </button>
          </li>
        </ul>
      )}

      {activeTab === 'marketplace' ? (
        <>
          {nfts.length === 0 ? (
            <div className="text-center p-4">
              <div className="alert alert-light">
                No NFTs available in the marketplace.
                {currentUser && (
                  <div className="mt-2">
                    <Link to="/mint" className="btn btn-primary">Mint your first NFT</Link>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="row">
              {nfts.map(nft => renderNFTCard(nft))}
            </div>
          )}
        </>
      ) : (
        <>
          {isUserNftsLoading ? (
            <div className="text-center p-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading your NFTs...</p>
            </div>
          ) : (
            <>
              {userNfts.length === 0 ? (
                <div className="text-center p-5 bg-light rounded">
                  <h4>You don't have any NFTs yet</h4>
                  <p className="text-muted">Mint your own NFT or buy one from the marketplace!</p>
                  <div className="mt-3">
                    <Link to="/mint" className="btn btn-primary me-2">Mint New NFT</Link>
                  </div>
                </div>
              ) : (
                <div className="row">
                  {userNfts.map(nft => renderNFTCard(nft, true))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

function Cart({ currentUser, getCart, removeFromCart, buyNFT }) {
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadCart();
    }
  }, [currentUser]);

  const loadCart = async () => {
    setIsLoading(true);
    try {
      const items = await getCart(currentUser.accountId);
      setCartItems(items || []);
    } catch (error) {
      console.error('Error loading cart:', error);
      toast.error('Failed to load cart: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (tokenId) => {
    try {
      await removeFromCart(tokenId);
      toast.success('Removed from cart!');
      loadCart();
    } catch (error) {
      toast.error('Failed to remove from cart: ' + error.message);
    }
  };

  const handleBuy = async (tokenId, price) => {
    try {
      await buyNFT(tokenId, price);
      toast.success('NFT purchased successfully!');
      loadCart();
    } catch (error) {
      toast.error('Failed to buy NFT: ' + error.message);
    }
  };

  if (!currentUser) {
    return <Navigate to="/" />;
  }

  if (isLoading) {
    return (
      <div className="text-center p-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h2 className="mb-4">Your Cart</h2>
      {cartItems.length === 0 ? (
        <div className="text-center p-4">
          <p>Your cart is empty</p>
        </div>
      ) : (
        <div className="row">
          {cartItems.map((item) => (
            <div key={item.token_id} className="col-md-4 mb-4">
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="card-title">Token ID: {item.token_id}</h5>
                  <p className="card-text">
                    <strong>Price:</strong> {item.price} NEAR
                  </p>
                  <div className="d-flex justify-content-between">
                    <button 
                      className="btn btn-primary"
                      onClick={() => handleBuy(item.token_id, item.price)}
                    >
                      Buy Now
                    </button>
                    <button 
                      className="btn btn-outline-danger"
                      onClick={() => handleRemove(item.token_id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MintNFT({ currentUser, mintNFT }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [mintingInProgress, setMintingInProgress] = useState(false);
  const navigate = useNavigate();

  const uploadToPinata = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const metadata = JSON.stringify({
        name: file.name,
        keyvalues: {
          type: 'nft-image'
        }
      });
      formData.append('pinataMetadata', metadata);

      const options = JSON.stringify({
        cidVersion: 0
      });
      formData.append('pinataOptions', options);

      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'pinata_api_key': PINATA_API_KEY,
          'pinata_secret_api_key': PINATA_API_SECRET,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Pinata API Error:', errorData);
        throw new Error(errorData.error?.message || 'Failed to upload to Pinata');
      }

      const data = await response.json();
      console.log('Pinata upload response:', data);
      
      if (!data.IpfsHash) {
        throw new Error('No IPFS hash received from Pinata');
      }

      return `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`;
    } catch (error) {
      console.error('Error uploading to Pinata:', error);
      throw new Error(`Failed to upload to Pinata: ${error.message}`);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const fileUrl = URL.createObjectURL(file);
      setPreviewUrl(fileUrl);
    }
  };

  const handleMintNFT = async (e) => {
    e.preventDefault();
    
    if (!title || !selectedFile || !price) {
      toast.error('Title, Image, and Price are required');
      return;
    }

    setMintingInProgress(true);
    try {
      toast.info('Uploading image to IPFS...');
      const mediaUrl = await uploadToPinata(selectedFile);
      toast.success('Image uploaded successfully!');

    const tokenId = `token-${Date.now()}`;
    const metadata = {
      title,
      description,
      media: mediaUrl,
    };

      await mintNFT(tokenId, metadata, null, price);
      toast.success('NFT minted successfully! Redirecting to marketplace...');
      
      // Reset form
      setTitle('');
      setDescription('');
      setPrice('');
      setSelectedFile(null);
      setPreviewUrl('');
      
      // Redirect to home page after short delay to allow user to see success message
      setTimeout(() => {
        navigate('/', { state: { fromMint: true } });
      }, 2000);
      
    } catch (error) {
      console.error('Error minting NFT:', error);
        toast.error('Failed to mint NFT: ' + (error.message || 'Unknown error'));
    } finally {
      setMintingInProgress(false);
    }
  };

  if (!currentUser) {
    return <Navigate to="/" />;
  }

  return (
        <div className="container">
      <div className="row justify-content-center">
        <div className="col-md-8">
              <div className="card">
                <div className="card-header bg-primary text-white">
                  <h3 className="m-0">Mint a New NFT</h3>
                </div>
                <div className="card-body">
                  <form onSubmit={handleMintNFT}>
                    <div className="mb-3">
                      <label htmlFor="title" className="form-label">Title *</label>
                      <input
                        type="text"
                        className="form-control"
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="description" className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        id="description"
                        rows="3"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      ></textarea>
                    </div>
                    <div className="mb-3">
                  <label htmlFor="price" className="form-label">Price (NEAR) *</label>
                      <input
                    type="number"
                        className="form-control"
                    id="price"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    min="0"
                    step="0.1"
                        required
                      />
                    </div>
                    <div className="mb-3">
                  <label htmlFor="image" className="form-label">Image *</label>
                      <input
                    type="file"
                        className="form-control"
                    id="image"
                    accept="image/*"
                    onChange={handleFileChange}
                    required
                  />
                  {previewUrl && (
                    <div className="mt-2">
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        className="img-thumbnail" 
                        style={{ maxHeight: '200px' }}
                      />
                    </div>
                  )}
                    </div>
                    <div className="d-grid">
                      <button 
                        type="submit"
                        className="btn btn-primary"
                        disabled={mintingInProgress}
                      >
                        {mintingInProgress ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Minting...
                          </>
                        ) : 'Mint NFT'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
      </div>
    </div>
  );
}

function App() {
  const { 
    currentUser, 
    getNFTs, 
    buyNFT, 
    addToCart, 
    removeFromCart, 
    getCart, 
    mintNFT,
    signIn,
    signOut
  } = useNear();

  return (
    <div className="App">
      <Navbar currentUser={currentUser} signIn={signIn} signOut={signOut} />
      <ToastContainer position="top-right" autoClose={5000} />
      <Routes>
        <Route path="/" element={<Home currentUser={currentUser} getNFTs={getNFTs} buyNFT={buyNFT} addToCart={addToCart} />} />
        <Route path="/cart" element={<Cart currentUser={currentUser} getCart={getCart} removeFromCart={removeFromCart} buyNFT={buyNFT} />} />
        <Route path="/mint" element={<MintNFT currentUser={currentUser} mintNFT={mintNFT} />} />
        {/* Redirect old paths to home */}
        <Route path="/my-nfts" element={<Navigate to="/" replace state={{ activeTab: 'mynfts' }} />} />
        <Route path="/dashboard" element={<Navigate to="/" replace state={{ activeTab: 'mynfts' }} />} />
      </Routes>
    </div>
  );
}

export default App; 