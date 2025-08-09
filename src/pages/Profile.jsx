import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, MapPin, Phone, Mail, Building, Home as HomeIcon, Settings, LogOut, Edit, Save, X } from 'lucide-react';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editedUser, setEditedUser] = useState({});

  useEffect(() => {
    // Проверяем авторизацию
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found, redirecting to login');
      navigate('/login');
      return;
    }

    loadUserProfile();
  }, [navigate]);

  const loadUserProfile = async () => {
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
        setEditedUser(data.user);
      } else if (response.status === 401) {
        console.log('Token expired, redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    } catch (error) {
      console.log('Офлайн режим: загружаем тестовый профиль');
      // Тестовые данные для офлайн режима
      const testUser = {
        id: 1,
        telegram_id: '123456789',
        first_name: 'Тестовый',
        last_name: 'Пользователь',
        username: 'test_user',
        apartment: '15',
        building: '3',
        street: 'Ленина',
        phone: '+7 (999) 123-45-67',
        email: 'test@example.com',
        is_admin: false,
        is_active: true,
        created_at: '2025-08-09T10:00:00Z'
      };
      setUser(testUser);
      setEditedUser(testUser);
    }
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedUser),
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setEditedUser(data.user);
        setIsEditing(false);
        alert('Профиль успешно обновлен!');
      } else if (response.status === 401) {
        console.log('Token expired, redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    } catch (error) {
      console.log('Офлайн режим: профиль сохранен локально');
      setUser(editedUser);
      setIsEditing(false);
      alert('Профиль сохранен локально!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Главный контент */}
      <div className="pt-16 pb-8 px-4">
        {/* Заголовок */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Мой профиль
          </h1>
          <p className="text-gray-600">
            Управляйте своими данными и настройками
          </p>
        </div>

        {/* Основная информация */}
        <div className="max-w-4xl mx-auto mb-6">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {user.first_name} {user.last_name}
                    </h2>
                    <p className="text-purple-100">@{user.username}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleSaveProfile}
                        disabled={isLoading}
                        className={`p-2 rounded-lg transition-all duration-200 ${
                          isLoading
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-white bg-opacity-20 hover:bg-opacity-30 text-white'
                        }`}
                      >
                        {isLoading ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        ) : (
                          <Save className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setEditedUser(user);
                        }}
                        className="p-2 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 text-white transition-all duration-200"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-2 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 text-white transition-all duration-200"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Детали профиля */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Личная информация */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-purple-500" />
                    Личная информация
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Имя
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedUser.first_name || ''}
                        onChange={(e) => setEditedUser(prev => ({ ...prev, first_name: e.target.value }))}
                        className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-lg text-gray-800">
                        {user.first_name}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Фамилия
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedUser.last_name || ''}
                        onChange={(e) => setEditedUser(prev => ({ ...prev, last_name: e.target.value }))}
                        className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-lg text-gray-800">
                        {user.last_name || 'Не указано'}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Телефон
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={editedUser.phone || ''}
                        onChange={(e) => setEditedUser(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="+7 (999) 123-45-67"
                      />
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-lg text-gray-800 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        {user.phone || 'Не указано'}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={editedUser.email || ''}
                        onChange={(e) => setEditedUser(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="user@example.com"
                      />
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-lg text-gray-800 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        {user.email || 'Не указано'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Адресная информация */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-500" />
                    Адресная информация
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Улица
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedUser.street || ''}
                        onChange={(e) => setEditedUser(prev => ({ ...prev, street: e.target.value }))}
                        className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-lg text-gray-800 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        {user.street || 'Не указано'}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Дом
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedUser.building || ''}
                          onChange={(e) => setEditedUser(prev => ({ ...prev, building: e.target.value }))}
                          className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <div className="p-3 bg-gray-50 rounded-lg text-gray-800 flex items-center gap-2">
                          <Building className="w-4 h-4 text-gray-500" />
                          {user.building || 'Не указано'}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Квартира
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedUser.apartment || ''}
                          onChange={(e) => setEditedUser(prev => ({ ...prev, apartment: e.target.value }))}
                          className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <div className="p-3 bg-gray-50 rounded-lg text-gray-800 flex items-center gap-2">
                          <HomeIcon className="w-4 h-4 text-gray-500" />
                          {user.apartment || 'Не указано'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Дополнительная информация */}
        <div className="max-w-4xl mx-auto mb-6">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-blue-600 p-4">
              <div className="flex items-center gap-3">
                <Settings className="w-6 h-6 text-white" />
                <h2 className="text-xl font-semibold text-white">Дополнительная информация</h2>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-800">ID</div>
                  <div className="text-sm text-gray-600">{user.id}</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-800">Telegram ID</div>
                  <div className="text-sm text-gray-600">{user.telegram_id}</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-800">Статус</div>
                  <div className="text-sm text-gray-600">
                    {user.is_active ? 'Активен' : 'Неактивен'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Кнопка выхода */}
        <div className="max-w-4xl mx-auto">
          <button
            onClick={handleLogout}
            className="w-full py-4 px-6 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl font-semibold hover:from-red-600 hover:to-pink-700 transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
          >
            <LogOut className="w-5 h-5" />
            Выйти из аккаунта
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile; 