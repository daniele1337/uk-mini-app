import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { User, MapPin, Phone, Mail, Edit, Save, X } from 'lucide-react'
import api from '../services/api'

const Profile = () => {
  const { user, updateProfile } = useAuth()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [formData, setFormData] = useState({
    apartment: '',
    building: '',
    street: '',
    phone: '',
    email: ''
  })

  useEffect(() => {
    if (user) {
      setFormData({
        apartment: user.apartment || '',
        building: user.building || '',
        street: user.street || '',
        phone: user.phone || '',
        email: user.email || ''
      })
    }
  }, [user])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    setLoading(true)
    setMessage('')
    
    try {
      const result = await updateProfile(formData)
      if (result.success) {
        setMessage('Профиль успешно обновлен!')
        setEditing(false)
      } else {
        setMessage(result.error)
      }
    } catch (error) {
      setMessage('Ошибка обновления профиля')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      apartment: user.apartment || '',
      building: user.building || '',
      street: user.street || '',
      phone: user.phone || '',
      email: user.email || ''
    })
    setEditing(false)
    setMessage('')
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Мой профиль
          </h1>
          <button
            onClick={() => setEditing(!editing)}
            className="flex items-center space-x-2 px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
          >
            {editing ? <X className="w-5 h-5" /> : <Edit className="w-5 h-5" />}
            <span>{editing ? 'Отмена' : 'Изменить'}</span>
          </button>
        </div>
        <p className="text-gray-600">
          Ваши личные данные и адрес
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('успешно') 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message}
        </div>
      )}

      <div className="bg-white rounded-xl p-6 shadow-sm">
        {/* Основная информация */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-primary-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {user.first_name} {user.last_name}
            </h2>
            <p className="text-gray-600">@{user.username}</p>
          </div>
        </div>

        {/* Адрес */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <MapPin className="w-5 h-5" />
            <span>Адрес</span>
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Улица
              </label>
              {editing ? (
                <input
                  type="text"
                  value={formData.street}
                  onChange={(e) => handleInputChange('street', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900">{user.street || 'Не указано'}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Дом
              </label>
              {editing ? (
                <input
                  type="text"
                  value={formData.building}
                  onChange={(e) => handleInputChange('building', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900">{user.building || 'Не указано'}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Квартира
              </label>
              {editing ? (
                <input
                  type="text"
                  value={formData.apartment}
                  onChange={(e) => handleInputChange('apartment', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900">{user.apartment || 'Не указано'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Контакты */}
        <div className="space-y-4 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Phone className="w-5 h-5" />
            <span>Контакты</span>
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Телефон
              </label>
              {editing ? (
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900">{user.phone || 'Не указано'}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              {editing ? (
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900">{user.email || 'Не указано'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Кнопки действий */}
        {editing && (
          <div className="flex space-x-3 mt-6">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-300 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Сохранение...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Сохранить</span>
                </>
              )}
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Отмена
            </button>
          </div>
        )}
      </div>

      {/* Статистика */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Статистика</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary-600">12</p>
            <p className="text-sm text-gray-600">Передано показаний</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">5</p>
            <p className="text-sm text-gray-600">Создано обращений</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile 