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
  const { user, needsRegistration, completeRegistration } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [profileData, setProfileData] = useState({
    apartment: '',
    building: '',
    street: '',
    phone: '',
    email: ''
  })

  useEffect(() => {
    // Если пользователь уже зарегистрирован, перенаправляем на главную
    if (user && !needsRegistration) {
      navigate('/')
    }
  }, [user, needsRegistration, navigate])

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await completeRegistration(profileData)
      
      if (result.success) {
        navigate('/')
      } else {
        setError(result.error || 'Ошибка регистрации')
      }
    } catch (error) {
      console.error('Registration error:', error)
      setError('Ошибка подключения к серверу. Проверьте интернет-соединение.')
    } finally {
      setLoading(false)
    }
  }

  const handleManualLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

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
      localStorage.setItem('token', mockToken)
      localStorage.setItem('testUser', JSON.stringify(mockUser))
      
      // Перезагружаем страницу для применения изменений
      window.location.reload()
    } catch (error) {
      console.error('Login error:', error)
      setError('Ошибка входа')
    } finally {
      setLoading(false)
    }
  }

  // Если нужна регистрация, показываем форму профиля
  if (needsRegistration) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-center mb-6">
              <User className="w-12 h-12 text-primary-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Завершите регистрацию</h2>
              <p className="text-gray-600">Укажите ваш адрес для завершения регистрации</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

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

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

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
        </div>
      </div>
    </div>
  )
}

export default Login 