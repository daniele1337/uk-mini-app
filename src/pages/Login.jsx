import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { 
  MessageCircle, 
  User, 
  Lock, 
  Eye, 
  EyeOff,
  Smartphone,
  Mail,
  Home,
  Building,
  MapPin
} from 'lucide-react'

const Login = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [showProfileForm, setShowProfileForm] = useState(false)
  const [telegramData, setTelegramData] = useState(null)
  const [profileData, setProfileData] = useState({
    apartment: '',
    building: '',
    street: '',
    phone: '',
    email: ''
  })

  useEffect(() => {
    // Проверяем, доступен ли Telegram Web App
    if (window.Telegram && window.Telegram.WebApp) {
      const tg = window.Telegram.WebApp
      tg.ready()
      
      if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        setTelegramData(tg.initDataUnsafe.user)
        handleTelegramAuth(tg.initDataUnsafe.user)
      }
    }
  }, [])

  const handleTelegramAuth = async (userData) => {
    setLoading(true)
    try {
      const response = await api.post('/auth/telegram', userData)
      
      if (response.data.success) {
        login(response.data.token, response.data.user)
        
        // Если у пользователя нет адреса, показываем форму профиля
        if (!response.data.user.apartment || !response.data.user.building || !response.data.user.street) {
          setShowProfileForm(true)
        } else {
          navigate('/')
        }
      }
    } catch (error) {
      console.error('Telegram auth error:', error)
      alert('Ошибка авторизации через Telegram')
    } finally {
      setLoading(false)
    }
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const response = await api.put('/users/profile', profileData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (response.data.success) {
        setShowProfileForm(false)
        navigate('/')
      }
    } catch (error) {
      console.error('Profile update error:', error)
      alert('Ошибка обновления профиля')
    } finally {
      setLoading(false)
    }
  }

  const handleManualLogin = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Симуляция входа для тестирования
      const mockUser = {
        id: 1,
        telegram_id: '123456789',
        first_name: 'Тестовый',
        last_name: 'Пользователь',
        username: 'test_user',
        apartment: '1',
        building: '1',
        street: 'Тестовая улица',
        phone: '+7 (999) 123-45-67',
        email: 'test@example.com',
        is_admin: false,
        is_active: true
      }

      const mockToken = 'mock_token_' + Date.now()
      login(mockToken, mockUser)
      navigate('/')
    } catch (error) {
      console.error('Login error:', error)
      alert('Ошибка входа')
    } finally {
      setLoading(false)
    }
  }

  if (showProfileForm) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-center mb-6">
              <User className="w-12 h-12 text-primary-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Завершите регистрацию</h2>
              <p className="text-gray-600">Укажите ваш адрес для завершения регистрации</p>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Home className="w-4 h-4 inline mr-2" />
                  Квартира
                </label>
                <input
                  type="text"
                  value={profileData.apartment}
                  onChange={(e) => setProfileData(prev => ({ ...prev, apartment: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Номер квартиры"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Building className="w-4 h-4 inline mr-2" />
                  Дом
                </label>
                <input
                  type="text"
                  value={profileData.building}
                  onChange={(e) => setProfileData(prev => ({ ...prev, building: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Номер дома"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Улица
                </label>
                <input
                  type="text"
                  value={profileData.street}
                  onChange={(e) => setProfileData(prev => ({ ...prev, street: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Название улицы"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Smartphone className="w-4 h-4 inline mr-2" />
                  Телефон
                </label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="+7 (999) 123-45-67"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="email@example.com"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors font-semibold"
              >
                {loading ? 'Сохранение...' : 'Сохранить и продолжить'}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-center mb-6">
            <MessageCircle className="w-12 h-12 text-primary-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">УК Mini App</h1>
            <p className="text-gray-600">Войдите в систему для доступа к функциям</p>
          </div>

          {telegramData ? (
            <div className="text-center">
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  Обнаружен Telegram Web App
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {telegramData.first_name} {telegramData.last_name}
                </p>
              </div>
              
              <button
                onClick={() => handleTelegramAuth(telegramData)}
                disabled={loading}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-semibold mb-4"
              >
                {loading ? 'Вход...' : 'Войти через Telegram'}
              </button>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Для использования приложения откройте его в Telegram
              </p>
              
              <button
                onClick={handleManualLogin}
                disabled={loading}
                className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors font-semibold"
              >
                {loading ? 'Вход...' : 'Тестовый вход'}
              </button>
              
              <p className="text-xs text-gray-500 mt-4">
                Тестовый режим для разработки
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Login 