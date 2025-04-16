import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// ✅ Add this import
import { registerSW } from 'virtual:pwa-register';
registerSW(); // Optional: pass options like `{ immediate: true }

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
