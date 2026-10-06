import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'
import './index.css';
import App from './App';
import "leaflet/dist/leaflet.css";
import './i18n/i18n';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from 'react-hot-toast';


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <App />
        {/* Poori website ke toast (booking ho gayi, galti, cancel…) yahin
            dikhte hain. Pehle ye laga hi nahi tha — har toast.success/error
            chup-chaap gayab ho jaata tha aur customer ko galti pata nahi chalti. */}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: { borderRadius: '12px', background: '#111827', color: '#fff', fontWeight: 600, fontSize: '14px' },
            error: { duration: 5000 },
          }}
        />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);