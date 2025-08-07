// Мок API для тестирования без backend
const mockApi = {
  // Локальное хранилище для обращений
  _complaints: (() => {
    const saved = localStorage.getItem('mockComplaints')
    if (saved) {
      return JSON.parse(saved)
    }
    return [
      {
        id: 1,
        title: 'Протечка в ванной',
        description: 'Обнаружена протечка под раковиной',
        category: 'Сантехника',
        status: 'new',
        created_at: '2024-08-04T21:30:00'
      },
      {
        id: 2,
        title: 'Не работает лифт',
        description: 'Лифт не реагирует на кнопки',
        category: 'Лифт',
        status: 'in_progress',
        created_at: '2024-08-04T20:15:00'
      }
    ]
  })(),

  // Локальное хранилище для показаний счетчиков
  _meterReadings: (() => {
    const saved = localStorage.getItem('mockMeterReadings')
    if (saved) {
      return JSON.parse(saved)
    }
    return [
      {
        id: 1,
        electricity: 1234.5,
        water: 567.8,
        gas: 89.1,
        date: '2024-08-04T21:30:00'
      },
      {
        id: 2,
        electricity: 1230.2,
        water: 565.1,
        gas: 88.5,
        date: '2024-07-04T21:30:00'
      }
    ]
  })(),

  get: async (url) => {
    console.log('Mock API GET:', url)
    
    // Имитируем задержку сети
    await new Promise(resolve => setTimeout(resolve, 100))
    
    if (url === '/api/users/stats' || url === '/users/stats') {
      const lastReading = mockApi._meterReadings.length > 0 
        ? mockApi._meterReadings[mockApi._meterReadings.length - 1] 
        : null
      
      return {
        data: {
          metersCount: mockApi._meterReadings.length,
          complaintsCount: mockApi._complaints.length,
          activeComplaints: mockApi._complaints.filter(c => c.status === 'new' || c.status === 'in_progress').length,
          lastReading: lastReading
        }
      }
    }
    
    if (url === '/api/health' || url === '/health') {
      return {
        data: {
          status: 'ok',
          message: 'Mock server is running'
        }
      }
    }
    
    if (url === '/api/complaints' || url === '/complaints') {
      return {
        data: {
          complaints: mockApi._complaints
        }
      }
    }
    
    if (url === '/api/meters/history' || url === '/meters/history') {
      return {
        data: {
          readings: mockApi._meterReadings
        }
      }
    }
    
    if (url === '/api/admin/stats' || url === '/admin/stats') {
      return {
        data: {
          totalUsers: 150,
          totalComplaints: mockApi._complaints.length,
          activeComplaints: mockApi._complaints.filter(c => c.status === 'new' || c.status === 'in_progress').length,
          totalReadings: mockApi._meterReadings.length
        }
      }
    }
    
    if (url === '/api/admin/complaints' || url === '/admin/complaints') {
      // Преобразуем обращения для админ панели
      const adminComplaints = mockApi._complaints.map(complaint => ({
        ...complaint,
        user_name: 'Тестовый Пользователь',
        address: 'ул. Тестовая, д. 1, кв. 1'
      }))
      
      return {
        data: {
          complaints: adminComplaints
        }
      }
    }
    
    if (url === '/api/admin/users' || url === '/admin/users') {
      return {
        data: {
          users: [
            {
              id: 1,
              first_name: 'Иван',
              last_name: 'Иванов',
              username: 'ivan_ivanov',
              address: 'ул. Ленина, д. 1, кв. 5',
              readings_count: 15,
              complaints_count: 3
            },
            {
              id: 2,
              first_name: 'Петр',
              last_name: 'Петров',
              username: 'petr_petrov',
              address: 'ул. Пушкина, д. 10, кв. 12',
              readings_count: 8,
              complaints_count: 1
            }
          ]
        }
      }
    }
    
    throw new Error('Not found')
  },
  
  post: async (url, data) => {
    console.log('Mock API POST:', url, data)
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    if (url === '/api/auth/telegram' || url === '/auth/telegram') {
      // Создаем пользователя с данными регистрации
      const user = {
        id: Math.floor(Math.random() * 1000) + 1,
        telegram_id: data.telegram_id,
        first_name: data.first_name,
        last_name: data.last_name,
        username: data.username,
        apartment: data.apartment || null,
        building: data.building || null,
        street: data.street || null,
        phone: data.phone || null,
        email: data.email || null,
        is_admin: false,
        is_active: true
      }
      
      // Сохраняем в localStorage для имитации базы данных
      const users = JSON.parse(localStorage.getItem('mockUsers') || '[]')
      const existingUserIndex = users.findIndex(u => u.telegram_id === data.telegram_id)
      
      if (existingUserIndex >= 0) {
        // Обновляем существующего пользователя
        users[existingUserIndex] = { ...users[existingUserIndex], ...user }
      } else {
        // Добавляем нового пользователя
        users.push(user)
      }
      
      localStorage.setItem('mockUsers', JSON.stringify(users))
      
      return {
        data: {
          success: true,
          user: user,
          token: 'mock-token-' + Date.now()
        }
      }
    }
    
    if (url === '/api/meters/submit' || url === '/meters/submit') {
      // Добавляем новые показания в локальное хранилище
      const newReading = {
        id: mockApi._meterReadings.length + 1,
        electricity: data.readings.electricity,
        water: data.readings.water,
        gas: data.readings.gas,
        date: new Date().toISOString()
      }
      mockApi._meterReadings.push(newReading)
      
      // Сохраняем в localStorage
      localStorage.setItem('mockMeterReadings', JSON.stringify(mockApi._meterReadings))
      
      return {
        data: {
          success: true,
          message: 'Показания успешно сохранены',
          reading: newReading
        }
      }
    }
    
    if (url === '/api/complaints' || url === '/complaints') {
      // Добавляем новое обращение в локальное хранилище
      const newComplaint = {
        id: mockApi._complaints.length + 1,
        title: data.title,
        description: data.description,
        category: data.category,
        status: 'new',
        created_at: new Date().toISOString()
      }
      mockApi._complaints.push(newComplaint)
      
      // Сохраняем в localStorage
      localStorage.setItem('mockComplaints', JSON.stringify(mockApi._complaints))
      
      return {
        data: {
          success: true,
          message: 'Обращение создано',
          complaint: newComplaint
        }
      }
    }
    
    if (url === '/api/admin/notifications' || url === '/admin/notifications') {
      return {
        data: {
          success: true,
          message: 'Уведомление отправлено'
        }
      }
    }
    
    throw new Error('Not found')
  },
  
  put: async (url, data) => {
    console.log('Mock API PUT:', url, data)
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    if (url.includes('/api/users/') || url.includes('/users/')) {
      // Обновляем пользователя в localStorage
      const users = JSON.parse(localStorage.getItem('mockUsers') || '[]')
      const userId = parseInt(url.split('/').pop())
      const userIndex = users.findIndex(u => u.id === userId)
      
      if (userIndex >= 0) {
        // Обновляем существующего пользователя
        users[userIndex] = { ...users[userIndex], ...data }
        localStorage.setItem('mockUsers', JSON.stringify(users))
        
        return {
          data: {
            success: true,
            user: users[userIndex]
          }
        }
      } else {
        // Создаем нового пользователя если не найден
        const newUser = {
          id: userId,
          telegram_id: '123456789',
          first_name: 'Тестовый',
          last_name: 'Пользователь',
          username: 'test_user',
          ...data
        }
        users.push(newUser)
        localStorage.setItem('mockUsers', JSON.stringify(users))
        
        return {
          data: {
            success: true,
            user: newUser
          }
        }
      }
    }
    
    if (url.includes('/api/admin/complaints/')) {
      // Извлекаем ID обращения из URL
      const complaintId = parseInt(url.split('/').pop())
      const complaint = mockApi._complaints.find(c => c.id === complaintId)
      
      if (complaint) {
        complaint.status = data.status
        
        // Сохраняем изменения в localStorage
        localStorage.setItem('mockComplaints', JSON.stringify(mockApi._complaints))
        
        return {
          data: {
            success: true,
            message: 'Статус обращения обновлен',
            complaint: complaint
          }
        }
      }
      
      return {
        data: {
          success: false,
          message: 'Обращение не найдено'
        }
      }
    }
    
    throw new Error('Not found')
  }
}

export default mockApi 