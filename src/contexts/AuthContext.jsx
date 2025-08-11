import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Проверяем сохраненную авторизацию при загрузке
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        // Проверяем, что данные пользователя корректные
        if (parsedUser && parsedUser.id && parsedUser.telegram_id) {
          setToken(savedToken);
          setUser(parsedUser);
          setIsAuthenticated(true);
        } else {
          console.error('Invalid user data structure');
          logout();
        }
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        logout();
      }
    } else {
      // Если нет сохраненной авторизации, проверяем Telegram WebApp
      checkTelegramWebApp();
    }
    setIsLoading(false);
  }, []);

  const checkTelegramWebApp = async () => {
    try {
      // Проверяем, есть ли данные от Telegram Web App
      if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        console.log('🔍 Проверяем Telegram WebApp данные...');
        
        if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
          console.log('✅ Найдены данные пользователя в Telegram WebApp, авторизуемся автоматически');
          await loginWithTelegram(tg.initDataUnsafe.user);
        } else {
          console.log('❌ Данные пользователя не найдены в Telegram WebApp');
        }
      } else {
        console.log('🌐 Не в Telegram WebApp');
      }
    } catch (error) {
      console.error('❌ Ошибка при проверке Telegram WebApp:', error);
    }
  };

  const loginWithTelegram = async (telegramUser) => {
    try {
      console.log('🔐 Начинаем авторизацию с данными:', telegramUser);
      
      // Отправляем данные на сервер для авторизации
      const response = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(telegramUser),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          console.log('✅ Авторизация успешна, сохраняем данные');
          
          // Сохраняем токен и данные пользователя
          setToken(data.token);
          setUser(data.user);
          setIsAuthenticated(true);
          
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          
          // Перенаправляем на главную страницу
          navigate('/');
          return data;
        } else {
          throw new Error(data.error || 'Ошибка авторизации');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Ошибка подключения к серверу');
      }
    } catch (error) {
      console.error('❌ Telegram auth error:', error);
      throw error;
    }
  };

  const logout = () => {
    console.log('🚪 Выход из системы');
    
    // Сначала очищаем localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Затем обновляем состояние
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    
    // Используем window.location для надежного перенаправления
    window.location.href = '/login';
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    token,
    isAuthenticated,
    isLoading,
    loginWithTelegram,
    logout,
    updateUser,
    isAdmin: user?.is_admin || false,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 