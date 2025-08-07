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
    const savedUser = localStorage.getItem('testUser')
    return savedUser ? JSON.parse(savedUser) : null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Проверяем доступность Telegram Web App
        if (window.Telegram && window.Telegram.WebApp && typeof WebApp !== 'undefined') {
          const tgUser = WebApp.initDataUnsafe?.user
          if (tgUser) {
            // Проверяем/создаем пользователя в базе
            const response = await api.post('/auth/telegram', {
              telegram_id: tgUser.id,
              first_name: tgUser.first_name,
              last_name: tgUser.last_name,
              username: tgUser.username
            })
            
            if (response.data.success) {
              setUser(response.data.user)
            }
          }
        } else {
          // Для тестирования в браузере - создаем тестового пользователя
          console.log('Telegram Web App not available, using test mode')
          const testUser = {
            id: 1,
            telegram_id: '123456789',
            first_name: 'Тестовый',
            last_name: 'Пользователь',
            username: 'test_user'
          }
          setUser(testUser)
          // Сохраняем в localStorage для стабильности
          localStorage.setItem('testUser', JSON.stringify(testUser))
        }
      } catch (error) {
        console.error('Auth error:', error)
        // В случае ошибки также создаем тестового пользователя
        const testUser = {
          id: 1,
          telegram_id: '123456789',
          first_name: 'Тестовый',
          last_name: 'Пользователь',
          username: 'test_user'
        }
        setUser(testUser)
        localStorage.setItem('testUser', JSON.stringify(testUser))
      } finally {
        setLoading(false)
      }
    }

    // Проверяем, есть ли сохраненный тестовый пользователь
    const savedUser = localStorage.getItem('testUser')
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
      const response = await api.post('/auth/login', userData)
      if (response.data.success) {
        setUser(response.data.user)
        return { success: true }
      }
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Ошибка входа' }
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('testUser')
    localStorage.removeItem('token')
    try {
      if (window.Telegram && window.Telegram.WebApp && typeof WebApp !== 'undefined') {
        WebApp.close()
      }
    } catch (error) {
      console.log('Telegram Web App not available for logout')
    }
  }

  const updateProfile = async (profileData) => {
    try {
      const response = await api.put(`/users/${user.id}`, profileData)
      if (response.data.success) {
        setUser(response.data.user)
        return { success: true }
      }
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Ошибка обновления' }
    }
  }

  const value = {
    user,
    loading,
    login,
    logout,
    updateProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 