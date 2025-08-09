import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import { 
  MessageSquare, 
  Plus, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  FileText,
  Filter,
  Calendar
} from 'lucide-react'

const Complaints = () => {
  const { user } = useAuth()
  const [complaints, setComplaints] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium'
  })
  const [submitting, setSubmitting] = useState(false)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadComplaints()
    loadCategories()
  }, [])

  const loadComplaints = async () => {
    try {
      const response = await api.get('/complaints')
      setComplaints(response.data.complaints || [])
      setLoading(false)
    } catch (error) {
      console.error('Error loading complaints:', error)
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const response = await api.get('/complaint-categories')
      setCategories(response.data)
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      await api.post('/complaints', formData)
      
      // Обновляем список обращений
      await loadComplaints()
      
      // Сбрасываем форму
      setFormData({
        title: '',
        description: '',
        category: '',
        priority: 'medium'
      })
      setShowForm(false)
      
      alert('Обращение успешно создано!')
    } catch (error) {
      console.error('Error creating complaint:', error)
      alert('Ошибка при создании обращения')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'new': return <Clock className="w-5 h-5 text-blue-500" />
      case 'in_progress': return <AlertCircle className="w-5 h-5 text-yellow-500" />
      case 'resolved': return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'rejected': return <XCircle className="w-5 h-5 text-red-500" />
      default: return <FileText className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'new': return 'Новое'
      case 'in_progress': return 'В работе'
      case 'resolved': return 'Решено'
      case 'rejected': return 'Отклонено'
      case 'closed': return 'Закрыто'
      default: return status
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'urgent': return 'Срочно'
      case 'high': return 'Высокий'
      case 'medium': return 'Средний'
      case 'low': return 'Низкий'
      default: return priority
    }
  }

  const filteredComplaints = complaints.filter(complaint => {
    if (filter === 'all') return true
    return complaint.status === filter
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Заголовок */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Мои обращения</h1>
              <p className="text-gray-600">Создавайте обращения и отслеживайте их статус</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Новое обращение
            </button>
          </div>
        </div>

        {/* Форма создания обращения */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Создать обращение</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Тема обращения *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Кратко опишите проблему"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Описание *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows="4"
                  placeholder="Подробно опишите проблему..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Категория *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  >
                    <option value="">Выберите категорию</option>
                    {categories.map((category) => (
                      <option key={category.code} value={category.code}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Приоритет
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="low">Низкий</option>
                    <option value="medium">Средний</option>
                    <option value="high">Высокий</option>
                    <option value="urgent">Срочно</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Создание...' : 'Создать обращение'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setFormData({
                      title: '',
                      description: '',
                      category: '',
                      priority: 'medium'
                    })
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Фильтры */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                filter === 'all'
                  ? 'bg-primary-50 border-primary-500 text-primary-700 border'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 border'
              }`}
            >
              <FileText className="w-4 h-4" />
              Все
            </button>
            <button
              onClick={() => setFilter('new')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                filter === 'new'
                  ? 'bg-primary-50 border-primary-500 text-primary-700 border'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 border'
              }`}
            >
              <Clock className="w-4 h-4" />
              Новые
            </button>
            <button
              onClick={() => setFilter('in_progress')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                filter === 'in_progress'
                  ? 'bg-primary-50 border-primary-500 text-primary-700 border'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 border'
              }`}
            >
              <AlertCircle className="w-4 h-4" />
              В работе
            </button>
            <button
              onClick={() => setFilter('resolved')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                filter === 'resolved'
                  ? 'bg-primary-50 border-primary-500 text-primary-700 border'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 border'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              Решенные
            </button>
          </div>
        </div>

        {/* Список обращений */}
        <div className="space-y-4">
          {filteredComplaints.length > 0 ? (
            filteredComplaints.map((complaint) => (
              <div key={complaint.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(complaint.status)}
                    <div>
                      <h3 className="font-semibold text-gray-900">{complaint.title}</h3>
                      <p className="text-sm text-gray-500">
                        #{complaint.id} • {new Date(complaint.created_at).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(complaint.priority)}`}>
                      {getPriorityText(complaint.priority)}
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      complaint.status === 'new' ? 'bg-blue-100 text-blue-800' :
                      complaint.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                      complaint.status === 'resolved' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {getStatusText(complaint.status)}
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-gray-700">{complaint.description}</p>
                </div>

                {complaint.response && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Ответ управляющей компании:</h4>
                    <p className="text-gray-700">{complaint.response}</p>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Категория: {complaint.category}</span>
                  <span>Обновлено: {new Date(complaint.updated_at).toLocaleDateString('ru-RU')}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filter === 'all' ? 'У вас пока нет обращений' : 'Обращения не найдены'}
              </h3>
              <p className="text-gray-500 mb-4">
                {filter === 'all' 
                  ? 'Создайте первое обращение, если у вас есть вопросы или проблемы'
                  : 'Попробуйте изменить фильтр или создать новое обращение'
                }
              </p>
              {filter === 'all' && (
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  Создать обращение
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Complaints 