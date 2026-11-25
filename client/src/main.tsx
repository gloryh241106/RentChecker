import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { App } from './App.js';
import './index.css';
import { createBrowserStorage } from './storage/browser-storage.js';

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <BrowserRouter>
        <App storage={createBrowserStorage()} />
      </BrowserRouter>
    </StrictMode>,
  );
}
