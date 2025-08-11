import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  MessageSquare, 
  Download, 
  Filter, 
  Search, 
  Reply, 
  CheckCircle,
  Clock, 
  AlertCircle,
  FileText,
  Users,
  Building
} from 'lucide-react';
import api from '../services/api';

const AdminPanel = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, resolved
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    resolved: 0
  });

  useEffect(() => {
    if (user?.is_admin) {
      loadComplaints();
      loadStats();
    }
  }, [user]);

  const loadComplaints = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/complaints');
      setComplaints(response.data.complaints || []);
    } catch (error) {
      console.error('Error loading complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      setStats(response.data.stats || { total: 0, pending: 0, resolved: 0 });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleReply = async (complaintId) => {
    if (!replyText.trim()) return;

    try {
      setReplying(true);
      await api.post(`/admin/complaints/${complaintId}/reply`, {
        reply: replyText
      });
      
      setReplyText('');
      setSelectedComplaint(null);
      loadComplaints();
      loadStats();
    } catch (error) {
      console.error('Error sending reply:', error);
    } finally {
      setReplying(false);
    }
  };

  const handleStatusChange = async (complaintId, status) => {
    try {
      await api.put(`/admin/complaints/${complaintId}/status`, {
        status: status
      });
      loadComplaints();
      loadStats();
    } catch (error) {
      console.error('Error changing status:', error);
    }
  };

  const exportData = async (type) => {
    try {
      const response = await api.get(`/admin/export/${type}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_export_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const filteredComplaints = complaints.filter(complaint => {
    const matchesFilter = filter === 'all' || complaint.status === filter;
    const matchesSearch = complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         complaint.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         complaint.user_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (!user?.is_admin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Доступ запрещен</h2>
          <p className="text-gray-600">У вас нет прав администратора</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
        {/* Заголовок */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Панель администратора</h1>
              <p className="text-gray-600">Управление обращениями и данными</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                Администратор: {user.first_name} {user.last_name}
              </span>
        </div>
          </div>
        </div>
                </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Всего обращений</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              </div>
            </div>
            
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ожидают ответа</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
              </div>
            </div>
            
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Решено</p>
                <p className="text-2xl font-bold text-gray-900">{stats.resolved}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Экспорт данных */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Экспорт данных</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button 
                onClick={() => exportData('complaints')}
                className="flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                <FileText className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium">Обращения</span>
                  </button>
              
                  <button 
                onClick={() => exportData('users')}
                className="flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                <Users className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium">Пользователи</span>
                  </button>
              
                  <button 
                onClick={() => exportData('meters')}
                className="flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                <Building className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium">Показания счетчиков</span>
                  </button>
            </div>
          </div>
        </div>

        {/* Фильтры и поиск */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Поиск по обращениям..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'all' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Все
                </button>
                <button
                  onClick={() => setFilter('pending')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'pending' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Ожидают
                </button>
                <button
                  onClick={() => setFilter('resolved')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'resolved' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Решено
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Список обращений */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Обращения</h3>
          </div>
          
          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Загрузка обращений...</p>
            </div>
          ) : filteredComplaints.length === 0 ? (
            <div className="p-6 text-center">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Обращения не найдены</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredComplaints.map((complaint) => (
                <div key={complaint.id} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-medium text-gray-900">{complaint.title}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          complaint.status === 'pending' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {complaint.status === 'pending' ? 'Ожидает' : 'Решено'}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-2">{complaint.description}</p>
                      <div className="text-sm text-gray-500">
                        <span>От: {complaint.user_name}</span>
                        <span className="mx-2">•</span>
                        <span>{new Date(complaint.created_at).toLocaleDateString()}</span>
                    </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {complaint.status === 'pending' && (
                        <button
                          onClick={() => handleStatusChange(complaint.id, 'resolved')}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                        >
                          Решить
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedComplaint(selectedComplaint === complaint.id ? null : complaint.id)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                      >
                        Ответить
                      </button>
                    </div>
            </div>
            
                  {/* Форма ответа */}
                  {selectedComplaint === complaint.id && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Введите ответ..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        rows="3"
                      />
                      <div className="flex justify-end gap-2 mt-3">
                        <button
                          onClick={() => {
                            setSelectedComplaint(null);
                            setReplyText('');
                          }}
                          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                        >
                          Отмена
                        </button>
                        <button
                          onClick={() => handleReply(complaint.id)}
                          disabled={replying || !replyText.trim()}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {replying ? 'Отправка...' : 'Отправить'}
                        </button>
            </div>
          </div>
        )}

                  {/* Существующие ответы */}
                  {complaint.replies && complaint.replies.length > 0 && (
                    <div className="mt-4">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Ответы:</h5>
                      {complaint.replies.map((reply, index) => (
                        <div key={index} className="bg-blue-50 p-3 rounded-lg mb-2">
                          <p className="text-sm text-gray-800">{reply.reply}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(reply.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
          </div>
        )}
                </div>
              ))}
          </div>
        )}
          </div>
      </div>
    </div>
  );
};

export default AdminPanel; 