import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, User, LogOut, Menu, X, Home, Zap, MessageCircle } from 'lucide-react';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navigationItems = [
    { icon: Home, label: 'Главная', path: '/' },
    { icon: Zap, label: 'Счетчики', path: '/meters' },
    { icon: MessageCircle, label: 'Обращения', path: '/complaints' },
    { icon: User, label: 'Профиль', path: '/profile' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Логотип и название */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">УК</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">УК Mini App</h1>
              <p className="text-xs text-gray-500">Система управления домом</p>
            </div>
          </div>

          {/* Навигация */}
          <div className="hidden md:flex items-center gap-1">
            {navigationItems.map((item, index) => (
              <button
                key={index}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                  isActive(item.path)
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </div>

          {/* Правая часть */}
          <div className="flex items-center gap-3">
            {/* Уведомления */}
            <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200">
              <Bell className="w-5 h-5" />
            </button>

            {/* Меню пользователя */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
              >
                {showMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              {/* Выпадающее меню */}
              {showMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                  {/* Информация о пользователе */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {user?.first_name} {user?.last_name}
                        </p>
                        <p className="text-xs text-gray-500">@{user?.username}</p>
                      </div>
                    </div>
                  </div>

                  {/* Навигация для мобильных устройств */}
                  <div className="md:hidden py-1">
                    {navigationItems.map((item, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          navigate(item.path);
                          setShowMenu(false);
                        }}
                        className={`w-full px-4 py-2 text-left flex items-center gap-3 transition-colors ${
                          isActive(item.path)
                            ? 'text-blue-600 bg-blue-50'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {/* Пункты меню */}
                  <div className="py-1 border-t border-gray-100">
                    <button
                      onClick={() => {
                        navigate('/profile');
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      Профиль
                    </button>
                    <button
                      onClick={() => {
                        handleLogout();
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Выйти
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Закрытие меню при клике вне его */}
      {showMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowMenu(false)}
        />
      )}
    </header>
  );
};

export default Header; 