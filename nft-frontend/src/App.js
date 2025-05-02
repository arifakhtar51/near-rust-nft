import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNear } from './near-context';
import './App.css';

function App() {
  const { isLoading, currentUser, signIn, signOut, mintNFT, getNFTs } = useNear();
  const [nfts, setNfts] = useState([]);
  const [isLoadingNFTs, setIsLoadingNFTs] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [ownerAccountId, setOwnerAccountId] = useState('');
  const [mintingInProgress, setMintingInProgress] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadNFTs();
    }
  }, [currentUser]);

  const loadNFTs = async () => {
    if (!currentUser) return;
    
    setIsLoadingNFTs(true);
    try {
      const userNfts = await getNFTs();
      setNfts(userNfts || []);
    } catch (error) {
      console.error('Error loading NFTs:', error);
      
      // Show a more specific error message for deserialization issues
      if (error.message.includes('contract needs to be initialized')) {
        toast.error('The NFT contract needs initialization. Please try again later or contact support.');
      } else {
        toast.error('Failed to load NFTs: ' + error.message);
      }
    } finally {
      setIsLoadingNFTs(false);
    }
  };

  const handleMintNFT = async (e) => {
    e.preventDefault();
    
    if (!title || !mediaUrl) {
      toast.error('Title and Media URL are required');
      return;
    }

    const tokenId = `token-${Date.now()}`;
    const metadata = {
      title,
      description,
      media: mediaUrl,
    };

    setMintingInProgress(true);
    try {
      await mintNFT(tokenId, metadata, ownerAccountId);
      toast.success('NFT minted successfully!');
      setTitle('');
      setDescription('');
      setMediaUrl('');
      setOwnerAccountId('');
      // Reload NFTs after minting
      await loadNFTs();
    } catch (error) {
      console.error('Error minting NFT:', error);
      
      // Show a more specific error message for deserialization issues
      if (error.message && error.message.includes('not properly initialized')) {
        toast.error('The NFT contract needs initialization. Please try again later or contact support.');
      } else {
        toast.error('Failed to mint NFT: ' + (error.message || 'Unknown error'));
      }
    } finally {
      setMintingInProgress(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <ToastContainer position="top-right" autoClose={5000} />
      
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary mb-4">
        <div className="container">
          <a className="navbar-brand" href="#">NEAR NFT Minter</a>
          <div className="ms-auto">
            {currentUser ? (
              <div className="d-flex align-items-center">
                <span className="text-light me-3">
                  Hello, {currentUser.accountId}
                </span>
                <button className="btn btn-outline-light" onClick={signOut}>
                  Sign Out
                </button>
              </div>
            ) : (
              <button className="btn btn-outline-light" onClick={signIn}>
                Sign In with NEAR
              </button>
            )}
          </div>
        </div>
      </nav>

      <div className="container">
        {!currentUser ? (
          <div className="card p-5 text-center">
            <h2>Welcome to NEAR NFT Minter</h2>
            <p className="lead">
              Connect your NEAR wallet to start minting NFTs
            </p>
            <div>
              <button className="btn btn-primary btn-lg" onClick={signIn}>
                Sign In with NEAR
              </button>
            </div>
          </div>
        ) : (
          <div className="row">
            <div className="col-lg-6 mb-4">
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
                      <label htmlFor="mediaUrl" className="form-label">Media URL *</label>
                      <input
                        type="url"
                        className="form-control"
                        id="mediaUrl"
                        value={mediaUrl}
                        onChange={(e) => setMediaUrl(e.target.value)}
                        placeholder="https://example.com/image.png"
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="ownerAccountId" className="form-label">Owner Account ID</label>
                      <input
                        type="text"
                        className="form-control"
                        id="ownerAccountId"
                        value={ownerAccountId}
                        onChange={(e) => setOwnerAccountId(e.target.value)}
                        placeholder="e.g., alice.testnet (leave empty to mint for yourself)"
                      />
                      <small className="form-text text-muted">
                        Leave empty to mint for yourself, or specify another account to mint for them
                      </small>
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

            <div className="col-lg-6">
              <div className="card">
                <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                  <h3 className="m-0">Your NFTs</h3>
                  <button 
                    className="btn btn-sm btn-outline-light" 
                    onClick={loadNFTs}
                    disabled={isLoadingNFTs}
                  >
                    <i className="bi bi-arrow-clockwise"></i> Refresh
                  </button>
                </div>
                <div className="card-body">
                  {isLoadingNFTs ? (
                    <div className="text-center p-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : nfts.length === 0 ? (
                    <div className="text-center p-4">
                      <p>You don't have any NFTs yet. Mint your first NFT!</p>
                      <div className="alert alert-warning mt-3" role="alert">
                        <strong>Note:</strong> If you encounter deserialization errors, the contract might need initialization. 
                        This is a development environment issue.
                      </div>
                    </div>
                  ) : (
                    <div className="nft-grid">
                      {nfts.map((nft) => (
                        <div key={nft.token_id} className="card nft-card">
                          <img 
                            src={nft.metadata.media} 
                            className="card-img-top nft-image" 
                            alt={nft.metadata.title}
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/300x300?text=Image+Not+Found';
                            }}
                          />
                          <div className="card-body">
                            <h5 className="card-title">{nft.metadata.title}</h5>
                            {nft.metadata.description && (
                              <p className="card-text">{nft.metadata.description}</p>
                            )}
                            <p className="card-text text-muted">Token ID: {nft.token_id}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App; 