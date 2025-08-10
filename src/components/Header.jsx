import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, User, LogOut, Menu, X, Home, Zap, MessageCircle, Settings } from 'lucide-react';

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
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-lg">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Логотип и название */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">УК</span>
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                УК Mini App
              </h1>
              <p className="text-xs text-gray-500 font-medium">Система управления домом</p>
            </div>
          </div>

          {/* Навигация для десктопа */}
          <div className="hidden md:flex items-center gap-1">
            {navigationItems.map((item, index) => (
              <button
                key={index}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 font-medium ${
                  isActive(item.path)
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="text-sm">{item.label}</span>
              </button>
            ))}
          </div>

          {/* Правая часть */}
          <div className="flex items-center gap-3">
            {/* Уведомления */}
            <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-xl transition-all duration-300 relative group">
              <Bell className="w-5 h-5" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>

            {/* Меню пользователя */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className={`flex items-center gap-2 p-2 rounded-xl transition-all duration-300 ${
                  showMenu
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50'
                }`}
              >
                {showMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              {/* Выпадающее меню */}
              {showMenu && (
                <div className="absolute right-0 top-full mt-3 w-64 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 py-3 z-50">
                  {/* Информация о пользователе */}
                  <div className="px-4 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 rounded-full flex items-center justify-center shadow-lg">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">
                          {user?.first_name} {user?.last_name}
                        </p>
                        <p className="text-sm text-gray-500 font-medium">@{user?.username}</p>
                      </div>
                    </div>
                  </div>

                  {/* Навигация для мобильных устройств */}
                  <div className="md:hidden py-2">
                    {navigationItems.map((item, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          navigate(item.path);
                          setShowMenu(false);
                        }}
                        className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-all duration-300 ${
                          isActive(item.path)
                            ? 'text-blue-600 bg-gradient-to-r from-blue-50 to-purple-50 border-r-2 border-blue-500'
                            : 'text-gray-700 hover:text-blue-600 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50'
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Пункты меню */}
                  <div className="py-2 border-t border-gray-100">
                    {user?.is_admin && (
                      <button
                        onClick={() => {
                          navigate('/admin');
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-3 text-left text-purple-600 hover:text-purple-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 flex items-center gap-3 transition-all duration-300 font-medium"
                      >
                        <Settings className="w-5 h-5" />
                        Админ-панель
                      </button>
                    )}
                    <button
                      onClick={() => {
                        navigate('/profile');
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left text-gray-700 hover:text-blue-600 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 flex items-center gap-3 transition-all duration-300 font-medium"
                    >
                      <User className="w-5 h-5" />
                      Профиль
                    </button>
                    <button
                      onClick={() => {
                        handleLogout();
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left text-red-600 hover:text-red-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 flex items-center gap-3 transition-all duration-300 font-medium"
                    >
                      <LogOut className="w-5 h-5" />
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