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
  const [needsRegistration, setNeedsRegistration] = useState(false)

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Проверяем доступность Telegram Web App
        if (window.Telegram && window.Telegram.WebApp && typeof WebApp !== 'undefined') {
          const tgUser = WebApp.initDataUnsafe?.user
          if (tgUser) {
            console.log('Telegram user detected:', tgUser)
            
            // Пытаемся авторизовать пользователя
            try {
              const response = await api.post('/auth/telegram', {
                telegram_id: tgUser.id.toString(),
                first_name: tgUser.first_name,
                last_name: tgUser.last_name,
                username: tgUser.username
              })
              
              if (response.data.success) {
                setUser(response.data.user)
                localStorage.setItem('token', response.data.token)
                
                // Проверяем, нужна ли регистрация (нет адреса)
                if (!response.data.user.apartment || !response.data.user.building || !response.data.user.street) {
                  setNeedsRegistration(true)
                }
              }
            } catch (authError) {
              console.error('Auth error:', authError)
              
              // Показываем уведомление о работе в офлайн режиме
              if (authError.code === 'ERR_CERT_AUTHORITY_INVALID' || 
                  authError.code === 'ERR_NETWORK' || 
                  authError.message?.includes('certificate')) {
                console.log('Working in offline mode due to SSL/certificate issues')
              }
              
              // Если пользователь не найден, создаем нового
              if (authError.response?.status === 404) {
                setNeedsRegistration(true)
                // Создаем временного пользователя для регистрации
                const tempUser = {
                  telegram_id: tgUser.id.toString(),
                  first_name: tgUser.first_name,
                  last_name: tgUser.last_name,
                  username: tgUser.username
                }
                setUser(tempUser)
              } else {
                // Другие ошибки - используем тестового пользователя
                const testUser = {
                  id: 1,
                  telegram_id: '123456789',
                  first_name: 'Тестовый',
                  last_name: 'Пользователь',
                  username: 'test_user'
                }
                setUser(testUser)
                localStorage.setItem('testUser', JSON.stringify(testUser))
              }
            }
          } else {
            // Нет данных Telegram - используем тестового пользователя
            console.log('No Telegram user data, using test mode')
            const testUser = {
              id: 1,
              telegram_id: '123456789',
              first_name: 'Тестовый',
              last_name: 'Пользователь',
              username: 'test_user'
            }
            setUser(testUser)
            localStorage.setItem('testUser', JSON.stringify(testUser))
          }
        } else {
          // Telegram Web App недоступен - используем тестового пользователя
          console.log('Telegram Web App not available, using test mode')
          const testUser = {
            id: 1,
            telegram_id: '123456789',
            first_name: 'Тестовый',
            last_name: 'Пользователь',
            username: 'test_user'
          }
          setUser(testUser)
          localStorage.setItem('testUser', JSON.stringify(testUser))
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
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
    setNeedsRegistration(false)
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
        setNeedsRegistration(false)
        return { success: true }
      }
    } catch (error) {
      console.error('Profile update error:', error)
      return { success: false, error: error.response?.data?.message || 'Ошибка обновления профиля' }
    }
  }

  const completeRegistration = async (profileData) => {
    try {
      console.log('Starting registration with data:', profileData)
      
      // Если у пользователя есть ID, обновляем профиль
      if (user.id) {
        console.log('Updating existing user profile')
        return await updateProfile(profileData)
      } else {
        // Если это новый пользователь, создаем его
        console.log('Creating new user with telegram data:', user)
        const response = await api.post('/auth/telegram', {
          ...user,
          ...profileData
        })
        
        console.log('Registration response:', response.data)
        
        if (response.data.success) {
          setUser(response.data.user)
          setNeedsRegistration(false)
          localStorage.setItem('token', response.data.token)
          return { success: true }
        } else {
          return { success: false, error: response.data.error || 'Ошибка регистрации' }
        }
      }
    } catch (error) {
      console.error('Registration error:', error)
      
      // Детальная обработка ошибок
      if (error.response) {
        // Сервер ответил с ошибкой
        console.error('Server error:', error.response.status, error.response.data)
        return { 
          success: false, 
          error: error.response.data?.error || `Ошибка сервера: ${error.response.status}` 
        }
      } else if (error.request) {
        // Запрос был отправлен, но ответ не получен
        console.error('Network error:', error.request)
        return { 
          success: false, 
          error: 'Ошибка подключения к серверу. Проверьте интернет-соединение.' 
        }
      } else {
        // Ошибка при настройке запроса
        console.error('Request setup error:', error.message)
        return { 
          success: false, 
          error: 'Ошибка при отправке запроса' 
        }
      }
    }
  }

  const value = {
    user,
    loading,
    needsRegistration,
    login,
    logout,
    updateProfile,
    completeRegistration
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 