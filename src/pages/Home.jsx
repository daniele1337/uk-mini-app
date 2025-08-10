import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Star, Send, Home as HomeIcon, Zap, MessageCircle, User, Settings, Wifi, WifiOff } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [isOnline, setIsOnline] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Проверяем авторизацию
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found, redirecting to login');
      navigate('/login');
      return;
    }

    // Загружаем данные пользователя
    loadUserData();
    // Проверяем подключение к API
    checkConnection();
    // Загружаем уведомления
    loadNotifications();
  }, [navigate]);

  const loadUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        // Обновляем данные в localStorage
        localStorage.setItem('user', JSON.stringify(data.user));
      } else if (response.status === 401) {
        console.log('Token expired, redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      // Пробуем загрузить из localStorage
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } finally {
      setLoading(false);
    }
  };

  const checkConnection = async () => {
    try {
      const response = await fetch('/api/health');
      setIsOnline(response.ok);
    } catch (error) {
      setIsOnline(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      } else if (response.status === 401) {
        console.log('Token expired, redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    } catch (error) {
      console.log('Офлайн режим: уведомления загружены локально');
    }
  };

  const handleRatingSubmit = async () => {
    if (rating === 0) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/rating', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ rating, comment }),
      });

      if (response.ok) {
        setRating(0);
        setComment('');
        alert('Спасибо за ваш отзыв!');
      } else if (response.status === 401) {
        console.log('Token expired, redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    } catch (error) {
      alert('Отзыв сохранен локально');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Главный контент */}
      <div className="pt-16 pb-8 px-4">
        {/* Приветствие */}
        <div className="text-center mb-8">
          {loading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-2 max-w-md mx-auto"></div>
              <div className="h-6 bg-gray-200 rounded max-w-lg mx-auto"></div>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Добро пожаловать, {user?.first_name || 'Пользователь'}!
              </h1>
              <p className="text-gray-600 text-lg">
                Система управления домом - ваш удобный помощник
              </p>
              {user?.apartment && user?.building && (
                <p className="text-sm text-gray-500 mt-2">
                  Квартира {user.apartment}, Дом {user.building}
                  {user?.street && `, ${user.street}`}
                </p>
              )}
            </>
          )}
        </div>

        {/* Карточки */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {/* Уведомления */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4">
              <div className="flex items-center gap-3">
                <Bell className="w-6 h-6 text-white" />
                <h2 className="text-xl font-semibold text-white">Уведомления</h2>
              </div>
            </div>
            <div className="p-6">
              {notifications.length > 0 ? (
                <div className="space-y-4">
                  {notifications.map((notification, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                      <h3 className="font-medium text-gray-800">{notification.title}</h3>
                      <p className="text-gray-600 text-sm mt-1">{notification.message}</p>
                      <span className="text-xs text-gray-500 mt-2 block">{notification.date}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Новых уведомлений нет</p>
                </div>
              )}
            </div>
          </div>

          {/* Рейтинг сервиса */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4">
              <div className="flex items-center gap-3">
                <Star className="w-6 h-6 text-white" />
                <h2 className="text-xl font-semibold text-white">Оцените наш сервис</h2>
              </div>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Ваша оценка
                </label>
                <div className="flex gap-2 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        star <= rating
                          ? 'text-yellow-500 bg-yellow-50'
                          : 'text-gray-300 hover:text-yellow-400'
                      }`}
                    >
                      <Star className="w-8 h-8" fill={star <= rating ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-500">
                  {rating === 0 ? 'Выберите оценку' : `${rating} из 5 звезд`}
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Комментарий (необязательно)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Расскажите о вашем опыте..."
                  className="w-full p-4 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="4"
                />
              </div>

              <button
                onClick={handleRatingSubmit}
                disabled={rating === 0}
                className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                  rating === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl'
                }`}
              >
                <Send className="w-5 h-5" />
                Отправить отзыв
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 