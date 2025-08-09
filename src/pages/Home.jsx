import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Users, FileText, AlertTriangle, TrendingUp } from 'lucide-react'
import NotificationCenter from '../components/NotificationCenter'
import RatingSystem from '../components/RatingSystem'
import SupportChat from '../components/SupportChat'

const Home = () => {
  const { user, isAdmin } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && user.token) {
      fetchStats()
    } else {
      setLoading(false)
    }
  }, [user])

  const fetchStats = async () => {
    try {
      const response = await fetch('https://24autoflow.ru/api/users/stats', {
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        console.log('Stats not available for this user')
      }
    } catch (error) {
      console.log('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Добро пожаловать, {user?.first_name || 'Пользователь'}!
          </h1>
          <p className="mt-2 text-gray-600">
            Система управления домом - ваш удобный помощник
          </p>
        </div>

        {isAdmin && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Пользователей</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_users}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Показаний</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_readings}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Обращений</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_complaints}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Активных</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.active_users}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <NotificationCenter />
          <RatingSystem />
        </div>
        
        <div className="mt-8">
          <SupportChat />
        </div>
      </div>
    </div>
  )
}

export default Home 