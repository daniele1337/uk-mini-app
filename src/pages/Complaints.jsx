import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Plus, Clock, CheckCircle, AlertCircle, Send } from 'lucide-react';

const Complaints = () => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [newComplaint, setNewComplaint] = useState({
    title: '',
    description: '',
    category: 'general',
    priority: 'medium'
  });
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Проверяем авторизацию
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found, redirecting to login');
      navigate('/login');
      return;
    }

    loadComplaints();
  }, [navigate]);

  const loadComplaints = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/complaints', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setComplaints(data.complaints || []);
      } else if (response.status === 401) {
        console.log('Token expired, redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    } catch (error) {
      console.log('Офлайн режим: загружаем тестовые обращения');
      // Тестовые данные для офлайн режима
      setComplaints([
        {
          id: 1,
          title: 'Протекает кран на кухне',
          description: 'В кухонном кране постоянно капает вода',
          category: 'plumbing',
          priority: 'high',
          status: 'in_progress',
          created_at: '2025-08-09T10:00:00Z',
          updated_at: '2025-08-09T14:30:00Z'
        },
        {
          id: 2,
          title: 'Не работает лифт',
          description: 'Лифт в подъезде не реагирует на кнопки',
          category: 'elevator',
          priority: 'high',
          status: 'new',
          created_at: '2025-08-09T09:15:00Z',
          updated_at: '2025-08-09T09:15:00Z'
        },
        {
          id: 3,
          title: 'Грязно в подъезде',
          description: 'Подъезд требует уборки',
          category: 'cleaning',
          priority: 'medium',
          status: 'completed',
          created_at: '2025-08-08T16:20:00Z',
          updated_at: '2025-08-09T08:45:00Z'
        }
      ]);
    }
  };

  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/complaints', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newComplaint),
      });

      if (response.ok) {
        const data = await response.json();
        setComplaints(prev => [data.complaint, ...prev]);
        setNewComplaint({ title: '', description: '', category: 'general', priority: 'medium' });
        setShowForm(false);
        alert('Обращение успешно отправлено!');
      } else if (response.status === 401) {
        console.log('Token expired, redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    } catch (error) {
      console.log('Офлайн режим: обращение сохранено локально');
      // Создаем локальное обращение
      const localComplaint = {
        id: Date.now(),
        ...newComplaint,
        status: 'new',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setComplaints(prev => [localComplaint, ...prev]);
      setNewComplaint({ title: '', description: '', category: 'general', priority: 'medium' });
      setShowForm(false);
      alert('Обращение сохранено локально!');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'new':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'in_progress':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'new':
        return 'Новое';
      case 'in_progress':
        return 'В работе';
      case 'completed':
        return 'Завершено';
      default:
        return 'Неизвестно';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'high':
        return 'Высокий';
      case 'medium':
        return 'Средний';
      case 'low':
        return 'Низкий';
      default:
        return 'Неизвестно';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Главный контент */}
      <div className="pt-16 pb-8 px-4">
        {/* Заголовок */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Обращения
          </h1>
          <p className="text-gray-600">
            Отправляйте жалобы и отслеживайте их статус
          </p>
        </div>

        {/* Кнопка добавления */}
        <div className="max-w-4xl mx-auto mb-6">
          <button
            onClick={() => setShowForm(!showForm)}
            className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5" />
            {showForm ? 'Отменить' : 'Создать обращение'}
          </button>
        </div>

        {/* Форма создания обращения */}
        {showForm && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-blue-600 p-4">
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-6 h-6 text-white" />
                  <h2 className="text-xl font-semibold text-white">Новое обращение</h2>
                </div>
              </div>
              <form onSubmit={handleSubmitComplaint} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Заголовок
                    </label>
                    <input
                      type="text"
                      value={newComplaint.title}
                      onChange={(e) => setNewComplaint(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Краткое описание проблемы"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Категория
                    </label>
                    <select
                      value={newComplaint.category}
                      onChange={(e) => setNewComplaint(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="general">Общие вопросы</option>
                      <option value="plumbing">Сантехника</option>
                      <option value="electricity">Электрика</option>
                      <option value="heating">Отопление</option>
                      <option value="elevator">Лифт</option>
                      <option value="cleaning">Уборка</option>
                      <option value="repair">Ремонт</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Приоритет
                    </label>
                    <select
                      value={newComplaint.priority}
                      onChange={(e) => setNewComplaint(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="low">Низкий</option>
                      <option value="medium">Средний</option>
                      <option value="high">Высокий</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Подробное описание
                  </label>
                  <textarea
                    value={newComplaint.description}
                    onChange={(e) => setNewComplaint(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full p-4 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="4"
                    placeholder="Опишите проблему подробно..."
                    required
                  />
                </div>

                <div className="mt-6">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                      isLoading
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-green-500 to-blue-600 text-white hover:from-green-600 hover:to-blue-700 shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                    {isLoading ? 'Отправка...' : 'Отправить обращение'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Список обращений */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-4">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-6 h-6 text-white" />
                <h2 className="text-xl font-semibold text-white">Мои обращения</h2>
              </div>
            </div>
            <div className="p-6">
              {complaints.length > 0 ? (
                <div className="space-y-4">
                  {complaints.map((complaint) => (
                    <div key={complaint.id} className="p-4 bg-gray-50 rounded-lg border-l-4 border-purple-500">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-medium text-gray-800 text-lg">{complaint.title}</h3>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(complaint.status)}
                          <span className="text-sm text-gray-600">{getStatusText(complaint.status)}</span>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3">{complaint.description}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className={`px-2 py-1 rounded-full ${getPriorityColor(complaint.priority)}`}>
                          {getPriorityText(complaint.priority)} приоритет
                        </span>
                        <span>Создано: {new Date(complaint.created_at).toLocaleDateString('ru-RU')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">У вас пока нет обращений</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Complaints; 