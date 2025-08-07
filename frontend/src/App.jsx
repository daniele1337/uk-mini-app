import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { WebApp } from '@twa-dev/sdk'
import Header from './components/Header'
import Home from './pages/Home'
import Profile from './pages/Profile'
import Meters from './pages/Meters'
import Complaints from './pages/Complaints'
import AdminPanel from './pages/AdminPanel'
import Login from './pages/Login'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import './App.css'

function AppContent() {
  const { user, loading, needsRegistration } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [showOfflineNotice, setShowOfflineNotice] = useState(false)

  useEffect(() => {
    // Инициализация Telegram Web App (если доступен)
    try {
      if (window.Telegram && window.Telegram.WebApp && typeof WebApp !== 'undefined') {
        WebApp.ready()
        WebApp.expand()
      }
    } catch (error) {
      console.log('Telegram Web App not available:', error.message)
    }
    
    // Проверка на админа (в реальном приложении - через API)
    if (user && user.telegram_id === '123456789') {
      setIsAdmin(true)
    }
    
    // Глобальная функция для показа офлайн уведомления
    window.showOfflineNotice = (message) => {
      setShowOfflineNotice(true)
      setTimeout(() => setShowOfflineNotice(false), 5000) // Скрыть через 5 секунд
    }
    
    // Проверяем, есть ли SSL ошибки в URL
    if (window.location.protocol === 'https:' && window.location.hostname !== 'localhost') {
      setShowOfflineNotice(true)
    }
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {showOfflineNotice && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white px-4 py-2 text-center">
            <div className="flex items-center justify-center">
              <span className="mr-2">⚠️</span>
              <span>Работаем в офлайн режиме. Данные сохраняются локально.</span>
              <button 
                onClick={() => setShowOfflineNotice(false)}
                className="ml-4 text-white hover:text-gray-200"
              >
                ✕
              </button>
            </div>
          </div>
        )}
        
        {user && !needsRegistration && <Header />}
        <main className="pb-20">
          <Routes>
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
            <Route path="/" element={
              user ? (
                needsRegistration ? <Navigate to="/register" replace /> : <Home />
              ) : (
                <Navigate to="/login" replace />
              )
            } />
            <Route path="/register" element={
              user && needsRegistration ? <Login /> : <Navigate to="/" replace />
            } />
            <Route path="/profile" element={
              user && !needsRegistration ? <Profile /> : <Navigate to="/login" replace />
            } />
            <Route path="/meters" element={
              user && !needsRegistration ? <Meters /> : <Navigate to="/login" replace />
            } />
            <Route path="/complaints" element={
              user && !needsRegistration ? <Complaints /> : <Navigate to="/login" replace />
            } />
            <Route path="/admin" element={
              user && !needsRegistration && isAdmin ? <AdminPanel /> : <Navigate to="/" replace />
            } />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App 