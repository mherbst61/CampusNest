// src/main.jsx
import 'leaflet/dist/leaflet.css';
import './index.css';

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './context/AuthProvider.jsx';

// Fix Leaflet default marker icons under Vite
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Dev helpers (optional)
import { auth } from './lib/firebase.js';
if (import.meta.env.DEV) {
  window.auth = auth;
}

import { signOutUser } from './services/authService.js';
if (import.meta.env.DEV) {
  window.signOutUser = signOutUser;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
