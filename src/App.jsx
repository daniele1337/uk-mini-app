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
  const { user, loading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)

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
        {user && <Header />}
        <main className="pb-20">
          <Routes>
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
            <Route path="/" element={user ? <Home /> : <Navigate to="/login" replace />} />
            <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" replace />} />
            <Route path="/meters" element={user ? <Meters /> : <Navigate to="/login" replace />} />
            <Route path="/complaints" element={user ? <Complaints /> : <Navigate to="/login" replace />} />
            <Route path="/admin" element={user && isAdmin ? <AdminPanel /> : <Navigate to="/" replace />} />
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