import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Add global scrollbar styles for Firefox and other browsers
const globalStyles = `
  * {
    scrollbar-width: thin;
    scrollbar-color: rgba(66,133,244,0.6) rgba(255,255,255,0.1);
  }
  
  *::-webkit-scrollbar {
    width: 8px;
  }
  
  *::-webkit-scrollbar-track {
    background: rgba(255,255,255,0.1);
    border-radius: 4px;
  }
  
  *::-webkit-scrollbar-thumb {
    background: linear-gradient(45deg, rgba(66,133,244,0.6) 0%, rgba(52,168,83,0.6) 100%);
    border-radius: 4px;
  }
  
  *::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(45deg, rgba(66,133,244,0.8) 0%, rgba(52,168,83,0.8) 100%);
  }
  
  *::-webkit-scrollbar-corner {
    background: transparent;
  }
`;

// Inject global styles
const styleSheet = document.createElement('style');
styleSheet.textContent = globalStyles;
document.head.appendChild(styleSheet);

createRoot(document.getElementById('root')!).render(<App />);
