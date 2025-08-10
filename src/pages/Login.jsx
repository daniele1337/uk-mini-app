import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MessageCircle, Shield, Zap, Users, Home, QrCode, Smartphone } from 'lucide-react';

const Login = () => {
  const { loginWithTelegram, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);

  useEffect(() => {
    // Проверяем, есть ли данные от Telegram Web App
    if (window.Telegram && window.Telegram.WebApp) {
      const tg = window.Telegram.WebApp;
      if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        handleTelegramAuth(tg.initDataUnsafe.user);
      }
    } else {
      // Если не в Telegram Web App, создаем QR-код для авторизации
      generateQRCode();
    }
  }, []);

  const generateQRCode = async () => {
    try {
      // Генерируем уникальный session ID
      const newSessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      setSessionId(newSessionId);

      // Создаем сессию на сервере
      const response = await fetch('/api/auth/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session_id: newSessionId }),
      });

      if (response.ok) {
        // Создаем URL для QR-кода
        const qrUrl = `https://t.me/jkhtestbot1337_bot?start=qr_${newSessionId}`;
        setQrCode(qrUrl);

        // Начинаем проверку авторизации
        startAuthCheck(newSessionId);
      } else {
        setError('Ошибка создания сессии');
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      setError('Ошибка создания QR-кода');
    }
  };

  const startAuthCheck = (sessionId) => {
    setIsCheckingAuth(true);
    
    const checkInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/auth/check-session/${sessionId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user) {
            clearInterval(checkInterval);
            setIsCheckingAuth(false);
            handleTelegramAuth(data.user);
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      }
    }, 2000); // Проверяем каждые 2 секунды

    // Останавливаем проверку через 5 минут
    setTimeout(() => {
      clearInterval(checkInterval);
      setIsCheckingAuth(false);
    }, 300000);
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

  const handleOpenTelegram = () => {
    // Открываем Telegram с ботом
    window.open('https://t.me/jkhtestbot1337_bot?start=login', '_blank');
  };

  const handleOpenMiniApp = () => {
    // Открываем мини-апп напрямую
    window.open('https://t.me/jkhtestbot1337_bot/app', '_blank');
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
            <QrCode className="w-12 h-12 text-white mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-white mb-2">
              Добро пожаловать!
            </h2>
            <p className="text-blue-100">
              Авторизация через QR-код
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
                <span className="text-sm">Быстрый вход через QR-код</span>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <Users className="w-5 h-5 text-purple-500" />
                <span className="text-sm">Управление домом</span>
              </div>
            </div>

            {/* QR-код */}
            <div className="mb-6 text-center">
              <div className="bg-gray-50 rounded-lg p-6 border-2 border-dashed border-gray-200">
                {qrCode ? (
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCode)}`}
                          alt="QR Code"
                          className="w-32 h-32"
                        />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-2">
                        Отсканируйте QR-код в Telegram
                      </p>
                      {isCheckingAuth && (
                        <div className="flex items-center justify-center gap-2 text-blue-600">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span className="text-sm">Ожидание авторизации...</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Альтернативные способы */}
            <div className="mb-6">
              <div className="text-center mb-3">
                <p className="text-sm text-gray-500">или используйте альтернативные способы</p>
              </div>
              <div className="space-y-3">
                <button
                  onClick={handleOpenMiniApp}
                  disabled={isLoading}
                  className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-3 border ${
                    isLoading
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
                  </svg>
                  Открыть мини-апп
                </button>

                <button
                  onClick={handleOpenTelegram}
                  disabled={isLoading}
                  className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-3 border ${
                    isLoading
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <Smartphone className="w-5 h-5" />
                  Открыть бота в Telegram
                </button>
              </div>
            </div>

            {/* Информация */}
            <div className="text-center mb-4">
              <p className="text-sm text-gray-600">
                🔐 Отсканируйте QR-код в Telegram для автоматической авторизации
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