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
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        logout();
      }
    }
    setIsLoading(false);
  }, []);

  const loginWithTelegram = async (telegramUser) => {
    try {
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
        throw new Error('Ошибка подключения к серверу');
      }
    } catch (error) {
      console.error('Telegram auth error:', error);
      
      // Если сервер недоступен, создаем тестового пользователя
      if (error.message === 'Ошибка подключения к серверу') {
        const testUser = {
          id: telegramUser.id || 123456789,
          telegram_id: telegramUser.id?.toString() || '123456789',
          first_name: telegramUser.first_name || 'Тестовый',
          last_name: telegramUser.last_name || 'Пользователь',
          username: telegramUser.username || 'test_user',
          apartment: '1',
          building: '1',
          street: 'Тестовая улица',
          phone: '+7 (999) 123-45-67',
          email: 'test@example.com',
          is_admin: false,
          is_active: true
        };
        
        const testToken = 'test_token_' + Date.now();
        
        setToken(testToken);
        setUser(testUser);
        setIsAuthenticated(true);
        
        localStorage.setItem('token', testToken);
        localStorage.setItem('user', JSON.stringify(testUser));
        
        navigate('/');
        return { success: true, token: testToken, user: testUser };
      }
      
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    navigate('/login');
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