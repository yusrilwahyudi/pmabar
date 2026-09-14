import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { LMSProvider } from './context/LMSContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LMSProvider>
      <App />
    </LMSProvider>
  </React.StrictMode>,
)
