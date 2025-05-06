import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

function Navbar({ currentUser, signIn, signOut }) {
  const location = useLocation();
  const navigate = useNavigate();
  
  const handleMyNFTsClick = (e) => {
    e.preventDefault();
    navigate('/', { state: { activeTab: 'mynfts' } });
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary mb-4">
      <div className="container">
        <Link className="navbar-brand" to="/">NEAR NFT Marketplace</Link>
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link 
                className={`nav-link ${location.pathname === '/' && !location.state?.activeTab ? 'active' : ''}`} 
                to="/"
              >
                Home
              </Link>
            </li>
            {currentUser && (
              <>
                <li className="nav-item">
                  <a 
                    className={`nav-link ${location.pathname === '/' && location.state?.activeTab === 'mynfts' ? 'active' : ''}`} 
                    href="/"
                    onClick={handleMyNFTsClick}
                  >
                    <i className="bi bi-collection"></i> My NFTs
                  </a>
                </li>
                <li className="nav-item">
                  <Link 
                    className={`nav-link ${location.pathname === '/mint' ? 'active' : ''}`} 
                    to="/mint"
                  >
                    <i className="bi bi-plus-circle"></i> Mint NFT
                  </Link>
                </li>
                <li className="nav-item">
                  <Link 
                    className={`nav-link ${location.pathname === '/cart' ? 'active' : ''}`} 
                    to="/cart"
                  >
                    <i className="bi bi-cart"></i> Cart
                  </Link>
                </li>
              </>
            )}
          </ul>
          <div className="d-flex align-items-center">
            {currentUser ? (
              <div className="d-flex align-items-center">
                <span className="text-light me-3">
                  <i className="bi bi-person-circle me-1"></i>
                  {currentUser.accountId}
                </span>
                <button className="btn btn-outline-light" onClick={signOut}>
                  Sign Out
                </button>
              </div>
            ) : (
              <button className="btn btn-outline-light" onClick={signIn}>
                <i className="bi bi-wallet me-1"></i> Sign In with NEAR
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar; 