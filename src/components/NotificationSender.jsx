import React, { useState, useEffect } from 'react'
import { Send, Users, Building, Filter, MessageSquare, Bot, TestTube } from 'lucide-react'
import api from '../services/api'

const NotificationSender = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [buildings, setBuildings] = useState([])
  const [users, setUsers] = useState([])
  const [telegramStats, setTelegramStats] = useState(null)
  const [testingBot, setTestingBot] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    target: 'all', // all, building, specific
    building_id: '',
    user_ids: [],
    notification_type: 'info' // info, warning, success, error
  })

  useEffect(() => {
    if (isOpen) {
      loadBuildings()
      loadUsers()
      loadTelegramStats()
    }
  }, [isOpen])

  const loadBuildings = async () => {
    try {
      const response = await api.get('/admin/buildings')
      setBuildings(response.data.buildings || [])
    } catch (error) {
      console.error('Error loading buildings:', error)
    }
  }

  const loadUsers = async () => {
    try {
      const response = await api.get('/admin/users')
      setUsers(response.data.users || [])
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const loadTelegramStats = async () => {
    try {
      const response = await api.get('/admin/telegram/stats')
      setTelegramStats(response.data.stats)
    } catch (error) {
      console.error('Error loading Telegram stats:', error)
    }
  }

  const testTelegramBot = async () => {
    setTestingBot(true)
    try {
      const response = await api.post('/admin/telegram/test')
      if (response.data.success) {
        alert('✅ Бот работает корректно! Тестовое сообщение отправлено.')
      } else {
        alert(`❌ Ошибка: ${response.data.error}`)
      }
    } catch (error) {
      console.error('Error testing bot:', error)
      alert('❌ Ошибка при тестировании бота')
    } finally {
      setTestingBot(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.title || !formData.message) return

    setLoading(true)
    try {
      const response = await api.post('/admin/notifications', formData)
      
      if (response.data.success) {
        const { telegram_sent, telegram_failed, total_users } = response.data
        alert(`✅ Уведомление отправлено!\n\n📊 Статистика:\n• Успешно: ${telegram_sent}\n• Ошибок: ${telegram_failed}\n• Всего пользователей: ${total_users}`)
        setFormData({
          title: '',
          message: '',
          target: 'all',
          building_id: '',
          user_ids: [],
          notification_type: 'info'
        })
        setIsOpen(false)
      }
    } catch (error) {
      console.error('Error sending notification:', error)
      alert('❌ Ошибка при отправке уведомления')
    } finally {
      setLoading(false)
    }
  }

  const getTargetUsersCount = () => {
    switch (formData.target) {
      case 'all':
        return users.length
      case 'building':
        return users.filter(u => u.building === formData.building_id).length
      case 'specific':
        return formData.user_ids.length
      default:
        return 0
    }
  }

  return (
    <>
      {/* Кнопка открытия */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Send className="w-4 h-4" />
        Рассылка уведомлений
      </button>

      {/* Модальное окно */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Рассылка уведомлений через Telegram
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Статистика Telegram */}
            {telegramStats && (
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Bot className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Статистика Telegram</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Пользователей с Telegram:</span>
                    <span className="ml-2 font-medium">{telegramStats.users_with_telegram} из {telegramStats.total_users}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Покрытие:</span>
                    <span className="ml-2 font-medium">{telegramStats.telegram_coverage_percent}%</span>
                  </div>
                </div>
                <button
                  onClick={testTelegramBot}
                  disabled={testingBot}
                  className="mt-2 flex items-center gap-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  <TestTube className="w-4 h-4" />
                  {testingBot ? 'Тестирование...' : 'Тестировать бота'}
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Тип уведомления */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Тип уведомления
                </label>
                <select
                  value={formData.notification_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, notification_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="info">ℹ️ Информация</option>
                  <option value="warning">⚠️ Предупреждение</option>
                  <option value="success">✅ Успех</option>
                  <option value="error">❌ Ошибка</option>
                </select>
              </div>

              {/* Заголовок */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Заголовок *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Введите заголовок уведомления"
                  required
                />
              </div>

              {/* Сообщение */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Сообщение *
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows="4"
                  placeholder="Введите текст уведомления"
                  required
                />
              </div>

              {/* Целевая аудитория */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Целевая аудитория
                </label>
                <select
                  value={formData.target}
                  onChange={(e) => setFormData(prev => ({ ...prev, target: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="all">Все пользователи</option>
                  <option value="building">По дому</option>
                  <option value="specific">Выбранные пользователи</option>
                </select>
              </div>

              {/* Выбор дома */}
              {formData.target === 'building' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Выберите дом
                  </label>
                  <select
                    value={formData.building_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, building_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Выберите дом</option>
                    {buildings.map((building) => (
                      <option key={building.id} value={building.id}>
                        {building.street}, д. {building.number}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Выбор пользователей */}
              {formData.target === 'specific' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Выберите пользователей
                  </label>
                  <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2">
                    {users.map((user) => (
                      <label key={user.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                        <input
                          type="checkbox"
                          checked={formData.user_ids.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(prev => ({
                                ...prev,
                                user_ids: [...prev.user_ids, user.id]
                              }))
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                user_ids: prev.user_ids.filter(id => id !== user.id)
                              }))
                            }
                          }}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm">
                          {user.first_name} {user.last_name} - {user.street}, д. {user.building}, кв. {user.apartment}
                          {user.telegram_id && <span className="text-green-600 ml-2">✓ Telegram</span>}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Счетчик получателей */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    Уведомление будет отправлено: <strong>{getTargetUsersCount()}</strong> пользователям через Telegram
                  </span>
                </div>
              </div>

              {/* Кнопки */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading || !formData.title || !formData.message}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Отправка...' : 'Отправить через Telegram'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default NotificationSender
