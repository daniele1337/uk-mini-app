import axios from 'axios'
import mockApi from './mockApi'

// Определяем базовый URL в зависимости от окружения
const getBaseURL = () => {
  // В продакшене используем реальный сервер
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'http://217.199.252.227/api' // Используем HTTP вместо HTTPS
  }
  // В разработке используем localhost
  return 'http://localhost:8000/api'
}

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 15000, // Увеличиваем таймаут
  headers: {
    'Content-Type': 'application/json',
  },
})

// Перехватчик для добавления токена
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Перехватчик для обработки ошибок и fallback на мок
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Если ошибка 401 или ошибка сети, используем мок API
    if (error.response?.status === 401 || error.code === 'ERR_NETWORK' || error.code === 'ERR_CONNECTION_REFUSED') {
      console.log('Server error or network error, using mock API')
      try {
        // Извлекаем путь из URL или используем относительный путь
        let path
        try {
          const url = new URL(error.config.url)
          path = url.pathname
        } catch (urlError) {
          // Если URL невалидный, используем относительный путь
          path = error.config.url.startsWith('/') ? error.config.url : `/${error.config.url}`
        }
        
        console.log('Mock API path:', path)
        
        const mockResponse = await mockApi[error.config.method.toLowerCase()](
          path,
          error.config.data ? JSON.parse(error.config.data) : undefined
        )
        return mockResponse
      } catch (mockError) {
        console.error('Mock API error:', mockError)
        return Promise.reject(error)
      }
    }
    
    return Promise.reject(error)
  }
)

export default api 