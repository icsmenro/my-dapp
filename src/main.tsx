import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AppKitProvider } from './config/wagmi';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppKitProvider>
      <App />
    </AppKitProvider>
  </React.StrictMode>,
);