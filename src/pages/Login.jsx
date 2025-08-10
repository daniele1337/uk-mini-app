import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MessageCircle, Shield, Zap, Users, Home } from 'lucide-react';

const Login = () => {
  const { loginWithTelegram, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Проверяем, есть ли данные от Telegram Web App
    if (window.Telegram && window.Telegram.WebApp) {
      const tg = window.Telegram.WebApp;
      if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        handleTelegramAuth(tg.initDataUnsafe.user);
      }
    } else {
      // Если не в Telegram Web App, загружаем Telegram Login Widget
      loadTelegramWidget();
    }
  }, []);

  const loadTelegramWidget = () => {
    console.log('Loading Telegram Login Widget...');
    
    // Проверяем, не загружен ли уже виджет
    if (document.querySelector('script[src*="telegram-widget.js"]')) {
      console.log('Telegram widget script already loaded');
      return;
    }

    // Загружаем Telegram Login Widget
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', 'jkhtestbot1337_bot');
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-auth-url', window.location.origin);
    script.setAttribute('data-request-access', 'write');
    script.setAttribute('data-lang', 'ru');
    script.setAttribute('data-radius', '8');
    script.async = true;
    
    // Обработчик успешной авторизации
    window.onTelegramAuth = (user) => {
      console.log('Telegram auth success:', user);
      handleTelegramAuth(user);
    };

    // Обработчик ошибок загрузки
    script.onerror = () => {
      console.error('Failed to load Telegram widget script');
      showFallbackButton();
    };

    // Обработчик успешной загрузки
    script.onload = () => {
      console.log('Telegram widget script loaded successfully');
    };

    document.head.appendChild(script);
    
    // Проверяем загрузку виджета через 3 секунды
    setTimeout(() => {
      const widget = document.querySelector('[data-telegram-login]');
      if (!widget) {
        console.log('Telegram widget not found, showing fallback');
        showFallbackButton();
      }
    }, 3000);
  };

  const showFallbackButton = () => {
    const widgetContainer = document.getElementById('telegram-login-widget');
    if (widgetContainer) {
      widgetContainer.innerHTML = `
        <button 
          onclick="window.open('https://t.me/jkhtestbot1337_bot?start=login', '_blank')"
          class="w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
          </svg>
          Войти через Telegram
        </button>
      `;
    }
  };

  const handleTelegramAuth = async (userData) => {
    setIsLoading(true);
    setError('');

    try {
      await loginWithTelegram(userData);
    } catch (error) {
      setError('Ошибка авторизации. Попробуйте еще раз.');
      console.error('Auth error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthenticated) {
    return null; // Перенаправление обрабатывается в App.jsx
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Логотип и заголовок */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Home className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            УК Mini App
          </h1>
          <p className="text-gray-600">
            Система управления домом
          </p>
        </div>

        {/* Основная карточка */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Заголовок карточки */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-center">
            <MessageCircle className="w-12 h-12 text-white mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-white mb-2">
              Добро пожаловать!
            </h2>
            <p className="text-blue-100">
              Войдите через Telegram для доступа к системе
            </p>
          </div>

          {/* Содержимое карточки */}
          <div className="p-6">
            {/* Преимущества */}
            <div className="mb-6 space-y-3">
              <div className="flex items-center gap-3 text-gray-700">
                <Shield className="w-5 h-5 text-green-500" />
                <span className="text-sm">Безопасная авторизация</span>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <Zap className="w-5 h-5 text-blue-500" />
                <span className="text-sm">Быстрый доступ</span>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <Users className="w-5 h-5 text-purple-500" />
                <span className="text-sm">Управление домом</span>
              </div>
            </div>

            {/* Telegram Login Widget */}
            <div className="mb-6 text-center">
              <div id="telegram-login-widget" className="flex justify-center">
                {/* Telegram Login Widget будет загружен сюда */}
              </div>
            </div>

            {/* Информация о том, что нужно использовать Telegram */}
            <div className="text-center mb-4">
              <p className="text-sm text-gray-600">
                🔐 Авторизация через Telegram обеспечивает безопасность
              </p>
            </div>

            {/* Ошибка */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Информация */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                Авторизуясь, вы соглашаетесь с условиями использования
              </p>
            </div>
          </div>
        </div>

        {/* Дополнительная информация */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Нужна помощь? Обратитесь к администратору
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login; 