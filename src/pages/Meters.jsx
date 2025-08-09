import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Droplets, Flame, Gauge, Plus, TrendingUp, CheckCircle, Clock } from 'lucide-react';

const Meters = () => {
  const navigate = useNavigate();
  const [readings, setReadings] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedMeter, setSelectedMeter] = useState(null);
  const [newReading, setNewReading] = useState({
    value: '',
    notes: ''
  });

  useEffect(() => {
    // Проверяем авторизацию
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found, redirecting to login');
      navigate('/login');
      return;
    }

    loadReadings();
  }, [navigate]);

  const loadReadings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/meters/readings', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setReadings(data);
      } else if (response.status === 401) {
        console.log('Token expired, redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    } catch (error) {
      console.log('Офлайн режим: загружаем тестовые показания');
      // Тестовые данные для офлайн режима
      setReadings({
        electricity: [
          {
            id: 1,
            value: 1234.5,
            previous_value: 1200.0,
            consumption: 34.5,
            notes: 'Нормальное потребление',
            is_verified: true,
            created_at: '2025-08-09T10:00:00Z'
          }
        ],
        cold_water: [
          {
            id: 2,
            value: 456.7,
            previous_value: 450.0,
            consumption: 6.7,
            notes: 'Повышенное потребление',
            is_verified: false,
            created_at: '2025-08-09T09:30:00Z'
          }
        ],
        hot_water: [
          {
            id: 3,
            value: 234.1,
            previous_value: 230.0,
            consumption: 4.1,
            notes: '',
            is_verified: true,
            created_at: '2025-08-09T09:15:00Z'
          }
        ]
      });
    }
  };

  const handleSubmitReading = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/meters/readings/${selectedMeter}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newReading),
      });

      if (response.ok) {
        const data = await response.json();
        setReadings(prev => ({
          ...prev,
          [selectedMeter]: [data.reading, ...(prev[selectedMeter] || [])]
        }));
        setNewReading({ value: '', notes: '' });
        setShowForm(false);
        setSelectedMeter(null);
        alert('Показания успешно отправлены!');
      } else if (response.status === 401) {
        console.log('Token expired, redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    } catch (error) {
      console.log('Офлайн режим: показания сохранены локально');
      // Создаем локальное показание
      const localReading = {
        id: Date.now(),
        value: parseFloat(newReading.value),
        previous_value: readings[selectedMeter]?.[0]?.value || 0,
        consumption: parseFloat(newReading.value) - (readings[selectedMeter]?.[0]?.value || 0),
        notes: newReading.notes,
        is_verified: false,
        created_at: new Date().toISOString()
      };
      
      setReadings(prev => ({
        ...prev,
        [selectedMeter]: [localReading, ...(prev[selectedMeter] || [])]
      }));
      setNewReading({ value: '', notes: '' });
      setShowForm(false);
      setSelectedMeter(null);
      alert('Показания сохранены локально!');
    } finally {
      setIsLoading(false);
    }
  };

  const getMeterIcon = (type) => {
    switch (type) {
      case 'electricity':
        return <Zap className="w-6 h-6 text-yellow-500" />;
      case 'cold_water':
        return <Droplets className="w-6 h-6 text-blue-500" />;
      case 'hot_water':
        return <Droplets className="w-6 h-6 text-red-500" />;
      case 'gas':
        return <Flame className="w-6 h-6 text-orange-500" />;
      case 'heating':
        return <Flame className="w-6 h-6 text-red-600" />;
      default:
        return <Gauge className="w-6 h-6 text-gray-500" />;
    }
  };

  const getMeterName = (type) => {
    switch (type) {
      case 'electricity':
        return 'Электричество';
      case 'cold_water':
        return 'Холодная вода';
      case 'hot_water':
        return 'Горячая вода';
      case 'gas':
        return 'Газ';
      case 'heating':
        return 'Отопление';
      default:
        return type;
    }
  };

  const getMeterUnit = (type) => {
    switch (type) {
      case 'electricity':
        return 'кВт·ч';
      case 'cold_water':
      case 'hot_water':
        return 'м³';
      case 'gas':
        return 'м³';
      case 'heating':
        return 'Гкал';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Главный контент */}
      <div className="pt-16 pb-8 px-4">
        {/* Заголовок */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Показания счетчиков
          </h1>
          <p className="text-gray-600">
            Передавайте показания и отслеживайте потребление
          </p>
        </div>

        {/* Кнопка добавления */}
        <div className="max-w-4xl mx-auto mb-6">
          <button
            onClick={() => setShowForm(!showForm)}
            className="w-full py-4 px-6 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5" />
            {showForm ? 'Отменить' : 'Передать показания'}
          </button>
        </div>

        {/* Форма передачи показаний */}
        {showForm && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-blue-600 p-4">
                <div className="flex items-center gap-3">
                  <Gauge className="w-6 h-6 text-white" />
                  <h2 className="text-xl font-semibold text-white">Новые показания</h2>
                </div>
              </div>
              <form onSubmit={handleSubmitReading} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Тип счетчика
                    </label>
                    <select
                      value={selectedMeter || ''}
                      onChange={(e) => setSelectedMeter(e.target.value)}
                      className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Выберите счетчик</option>
                      <option value="electricity">Электричество</option>
                      <option value="cold_water">Холодная вода</option>
                      <option value="hot_water">Горячая вода</option>
                      <option value="gas">Газ</option>
                      <option value="heating">Отопление</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Показания
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newReading.value}
                      onChange={(e) => setNewReading(prev => ({ ...prev, value: e.target.value }))}
                      className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Введите показания"
                      required
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Примечания (необязательно)
                  </label>
                  <textarea
                    value={newReading.notes}
                    onChange={(e) => setNewReading(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full p-4 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                    placeholder="Дополнительная информация..."
                  />
                </div>

                <div className="mt-6">
                  <button
                    type="submit"
                    disabled={isLoading || !selectedMeter}
                    className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                      isLoading || !selectedMeter
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-green-500 to-blue-600 text-white hover:from-green-600 hover:to-blue-700 shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <TrendingUp className="w-5 h-5" />
                    )}
                    {isLoading ? 'Отправка...' : 'Отправить показания'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Список счетчиков */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4">
              <div className="flex items-center gap-3">
                <Gauge className="w-6 h-6 text-white" />
                <h2 className="text-xl font-semibold text-white">Мои счетчики</h2>
              </div>
            </div>
            <div className="p-6">
              {Object.keys(readings).length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(readings).map(([meterType, meterReadings]) => (
                    <div key={meterType} className="border border-gray-200 rounded-xl overflow-hidden">
                      {/* Заголовок счетчика */}
                      <div className="bg-gray-50 p-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getMeterIcon(meterType)}
                            <div>
                              <h3 className="font-semibold text-gray-800">{getMeterName(meterType)}</h3>
                              <p className="text-sm text-gray-600">Единица: {getMeterUnit(meterType)}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedMeter(meterType);
                              setShowForm(true);
                            }}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                          >
                            Добавить
                          </button>
                        </div>
                      </div>

                      {/* Показания */}
                      <div className="p-4">
                        {meterReadings.length > 0 ? (
                          <div className="space-y-3">
                            {meterReadings.slice(0, 3).map((reading) => (
                              <div key={reading.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-gray-800">
                                      {reading.value} {getMeterUnit(meterType)}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {new Date(reading.created_at).toLocaleDateString('ru-RU')}
                                    </div>
                                  </div>
                                  {reading.consumption && (
                                    <div className="text-center">
                                      <div className="text-sm font-medium text-green-600">
                                        +{reading.consumption.toFixed(1)} {getMeterUnit(meterType)}
                                      </div>
                                      <div className="text-xs text-gray-500">Потребление</div>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {reading.is_verified ? (
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                  ) : (
                                    <Clock className="w-5 h-5 text-yellow-500" />
                                  )}
                                  <span className="text-xs text-gray-500">
                                    {reading.is_verified ? 'Подтверждено' : 'Ожидает'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-gray-500">
                            Нет показаний
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Gauge className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">У вас пока нет счетчиков</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Meters; 