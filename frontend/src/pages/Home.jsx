import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Zap, MessageSquare, Calendar, TrendingUp, AlertCircle } from 'lucide-react'
import api from '../services/api'

const Home = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [stats, setStats] = useState({
    metersCount: 0,
    complaintsCount: 0,
    lastReading: null,
    activeComplaints: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/users/stats')
        setStats(response.data)
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const quickActions = [
    {
      title: 'Передать показания',
      description: 'Фото или ручной ввод',
      icon: Zap,
      color: 'bg-blue-500',
      path: '/meters'
    },
    {
      title: 'Создать обращение',
      description: 'Жалоба или вопрос',
      icon: MessageSquare,
      color: 'bg-green-500',
      path: '/complaints'
    },
    {
      title: 'Мой профиль',
      description: 'Личные данные',
      icon: Calendar,
      color: 'bg-purple-500',
      path: '/profile'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6">
      {/* Приветствие */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Добро пожаловать, {user?.first_name}!
        </h1>
        <p className="text-gray-600">
          Управляющая компания всегда на связи
        </p>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Zap className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Счетчиков</p>
              <p className="text-xl font-bold text-gray-900">{stats.metersCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <MessageSquare className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Обращений</p>
              <p className="text-xl font-bold text-gray-900">{stats.complaintsCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Быстрые действия */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Быстрые действия</h2>
        <div className="space-y-3">
          {quickActions.map((action, index) => {
            const Icon = action.icon
            return (
              <button
                key={index}
                onClick={() => navigate(action.path)}
                className="w-full bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow text-left"
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-lg ${action.color}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{action.title}</h3>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Последние показания */}
      {stats.lastReading && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Последние показания</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Электричество</span>
              <span className="font-semibold">{stats.lastReading.electricity} кВт⋅ч</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Вода</span>
              <span className="font-semibold">{stats.lastReading.water} м³</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Газ</span>
              <span className="font-semibold">{stats.lastReading.gas} м³</span>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {new Date(stats.lastReading.date).toLocaleDateString('ru-RU')}
            </div>
          </div>
        </div>
      )}

      {/* Активные обращения */}
      {stats.activeComplaints > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="font-semibold text-yellow-800">
                У вас {stats.activeComplaints} активных обращений
              </p>
              <button
                onClick={() => navigate('/complaints')}
                className="text-sm text-yellow-700 underline"
              >
                Посмотреть статус
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Home 