import React, { createContext, useContext, useState, useEffect } from 'react'
import { WebApp } from '@twa-dev/sdk'
import api from '../services/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Проверяем localStorage при инициализации
    const savedUser = localStorage.getItem('uk_mini_app_user')
    return savedUser ? JSON.parse(savedUser) : null
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const initAuth = async () => {
      try {
        setError(null)
        
        // Проверяем доступность Telegram Web App
        if (window.Telegram && window.Telegram.WebApp && typeof WebApp !== 'undefined') {
          console.log('Telegram Web App detected')
          
          // Инициализируем Web App
          WebApp.ready()
          WebApp.expand()
          
          const tgUser = WebApp.initDataUnsafe?.user
          if (tgUser) {
            console.log('Telegram user found:', tgUser)
            
            // Проверяем/создаем пользователя в базе
            const response = await api.post('/auth/telegram', {
              telegram_id: tgUser.id.toString(),
              first_name: tgUser.first_name,
              last_name: tgUser.last_name || '',
              username: tgUser.username || ''
            })
            
            if (response.data.success) {
              const userData = response.data.user
              setUser(userData)
              localStorage.setItem('uk_mini_app_user', JSON.stringify(userData))
              localStorage.setItem('uk_mini_app_token', response.data.token)
              console.log('User authenticated successfully:', userData)
            } else {
              throw new Error(response.data.message || 'Authentication failed')
            }
          } else {
            console.log('No Telegram user data available')
            // Создаем тестового пользователя для разработки
            const testUser = {
              id: 1,
              telegram_id: '123456789',
              first_name: 'Тестовый',
              last_name: 'Пользователь',
              username: 'test_user',
              is_admin: false
            }
            setUser(testUser)
            localStorage.setItem('uk_mini_app_user', JSON.stringify(testUser))
          }
        } else {
          console.log('Telegram Web App not available, using test mode')
          // Для тестирования в браузере - создаем тестового пользователя
          const testUser = {
            id: 1,
            telegram_id: '123456789',
            first_name: 'Тестовый',
            last_name: 'Пользователь',
            username: 'test_user',
            is_admin: false
          }
          setUser(testUser)
          localStorage.setItem('uk_mini_app_user', JSON.stringify(testUser))
        }
      } catch (error) {
        console.error('Auth error:', error)
        setError(error.message || 'Ошибка авторизации')
        
        // В случае ошибки также создаем тестового пользователя
        const testUser = {
          id: 1,
          telegram_id: '123456789',
          first_name: 'Тестовый',
          last_name: 'Пользователь',
          username: 'test_user',
          is_admin: false
        }
        setUser(testUser)
        localStorage.setItem('uk_mini_app_user', JSON.stringify(testUser))
      } finally {
        setLoading(false)
      }
    }

    // Проверяем, есть ли сохраненный пользователь
    const savedUser = localStorage.getItem('uk_mini_app_user')
    if (savedUser && !user) {
      setUser(JSON.parse(savedUser))
      setLoading(false)
    } else if (!user) {
      initAuth()
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (userData) => {
    try {
      setError(null)
      const response = await api.post('/auth/login', userData)
      if (response.data.success) {
        setUser(response.data.user)
        localStorage.setItem('uk_mini_app_user', JSON.stringify(response.data.user))
        localStorage.setItem('uk_mini_app_token', response.data.token)
        return { success: true }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Ошибка входа'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const logout = () => {
    setUser(null)
    setError(null)
    localStorage.removeItem('uk_mini_app_user')
    localStorage.removeItem('uk_mini_app_token')
    
    // Если в Telegram Web App, закрываем приложение
    if (window.Telegram && window.Telegram.WebApp) {
      try {
        WebApp.close()
      } catch (error) {
        console.log('Could not close Web App:', error)
      }
    }
  }

  const updateProfile = async (profileData) => {
    try {
      setError(null)
      const response = await api.put(`/users/profile`, profileData)
      if (response.data.success) {
        const updatedUser = { ...user, ...response.data.user }
        setUser(updatedUser)
        localStorage.setItem('uk_mini_app_user', JSON.stringify(updatedUser))
        return { success: true }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Ошибка обновления профиля'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const refreshUser = async () => {
    try {
      const response = await api.get('/users/profile')
      if (response.data.success) {
        const updatedUser = response.data.user
        setUser(updatedUser)
        localStorage.setItem('uk_mini_app_user', JSON.stringify(updatedUser))
      }
    } catch (error) {
      console.error('Error refreshing user:', error)
    }
  }

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    updateProfile,
    refreshUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 