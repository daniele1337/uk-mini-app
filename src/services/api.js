import axios from 'axios';

// Создаем экземпляр axios с базовой конфигурацией
const api = axios.create({
  baseURL: '/api', // Используем относительный путь для проксирования через Nginx
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Добавляем перехватчик для добавления токена авторизации
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Добавляем перехватчик для обработки ошибок
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    
    // Если ошибка 401 (Unauthorized), перенаправляем на страницу входа
    if (error.response?.status === 401) {
      console.log('User not authorized, redirecting to login');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject(new Error('Unauthorized'));
    }
    
    // Если сервер недоступен, возвращаем ошибку для fallback
    if (error.code === 'ERR_NETWORK' || error.response?.status >= 500) {
      console.log('Server unavailable, using offline mode');
    }
    
    return Promise.reject(error);
  }
);

export default api; 