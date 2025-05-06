import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { NearProvider } from './near-context';

// Polyfills for Node.js core modules
import { Buffer } from 'buffer';
window.Buffer = Buffer;

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <NearProvider>
        <App />
      </NearProvider>
    </BrowserRouter>
  </React.StrictMode>
); 