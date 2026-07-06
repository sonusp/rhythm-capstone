import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.jsx'
import PartnerDashboard from './components/PartnerDashboard.jsx'

// Register PWA service worker
registerSW({ immediate: true })

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

const params = new URLSearchParams(window.location.search);
const partnerToken = params.get('partner');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {partnerToken ? <PartnerDashboard token={partnerToken} /> : <App />}
    </GoogleOAuthProvider>
  </StrictMode>,
)
