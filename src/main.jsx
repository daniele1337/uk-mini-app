import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './contexts/AuthContext.jsx'

// Безопасная инициализация Telegram Web App
const initTelegramWebApp = () => {
  try {
    if (window.Telegram && window.Telegram.WebApp) {
      const tg = window.Telegram.WebApp;
      
      // Безопасно вызываем методы Telegram Web App
      if (typeof tg.ready === 'function') {
        tg.ready();
      }
      
      if (typeof tg.expand === 'function') {
        tg.expand();
      }
      
      // Устанавливаем цвета только если методы доступны
      if (typeof tg.setHeaderColor === 'function') {
        try {
          tg.setHeaderColor('#ffffff');
        } catch (e) {
          console.log('Could not set header color:', e);
        }
      }
      
      if (typeof tg.setBackgroundColor === 'function') {
        try {
          tg.setBackgroundColor('#ffffff');
        } catch (e) {
          console.log('Could not set background color:', e);
        }
      }
      
      console.log('Telegram Web App initialized successfully');
    } else {
      console.log('Telegram Web App not available');
    }
  } catch (error) {
    console.log('Error initializing Telegram Web App:', error);
  }
};

// Инициализируем Telegram Web App при загрузке
initTelegramWebApp();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
) 