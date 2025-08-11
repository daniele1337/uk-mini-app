import React, { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header'
import Home from './pages/Home'
import Profile from './pages/Profile'
import Meters from './pages/Meters'
import Complaints from './pages/Complaints'
import AdminPanel from './pages/AdminPanel'
import Login from './pages/Login'
import { useAuth } from './contexts/AuthContext'
import './App.css'

function AppContent() {
  const { user, isLoading, isAuthenticated, isAdmin } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {isAuthenticated && <Header />}
      <main className="pb-20">
        <Routes>
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" replace />} />
          <Route path="/" element={isAuthenticated ? <Home /> : <Navigate to="/login" replace />} />
          <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" replace />} />
          <Route path="/meters" element={isAuthenticated ? <Meters /> : <Navigate to="/login" replace />} />
          <Route path="/complaints" element={isAuthenticated ? <Complaints /> : <Navigate to="/login" replace />} />
          <Route path="/admin" element={isAuthenticated && isAdmin ? <AdminPanel /> : <Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

function App() {
  return <AppContent />
}

export default App 