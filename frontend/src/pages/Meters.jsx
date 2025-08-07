import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import { 
  Zap, 
  Droplets, 
  Flame, 
  Thermometer, 
  Camera, 
  CheckCircle, 
  AlertCircle,
  Plus,
  History,
  FileText
} from 'lucide-react'

const Meters = () => {
  const { user } = useAuth()
  const [meterTypes, setMeterTypes] = useState([])
  const [readings, setReadings] = useState({})
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('electricity')
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    value: '',
    notes: '',
    photo: null
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadMeterTypes()
    loadReadings()
  }, [])

  const loadMeterTypes = async () => {
    try {
      const response = await api.get('/meter-types')
      setMeterTypes(response.data)
    } catch (error) {
      console.error('Error loading meter types:', error)
    }
  }

  const loadReadings = async () => {
    try {
      const response = await api.get('/meters/readings')
      setReadings(response.data)
      setLoading(false)
    } catch (error) {
      console.error('Error loading readings:', error)
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const data = {
        value: parseFloat(formData.value),
        notes: formData.notes
      }

      if (formData.photo) {
        data.photo = formData.photo
      }

      await api.post(`/meters/readings/${activeTab}`, data)
      
      // Обновляем показания
      await loadReadings()
      
      // Сбрасываем форму
      setFormData({ value: '', notes: '', photo: null })
      setShowForm(false)
      
      alert('Показания успешно сохранены!')
    } catch (error) {
      console.error('Error submitting reading:', error)
      alert('Ошибка при сохранении показаний')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePhotoCapture = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setFormData(prev => ({ ...prev, photo: e.target.result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const getMeterIcon = (type) => {
    switch (type) {
      case 'electricity': return <Zap className="w-6 h-6" />
      case 'cold_water': return <Droplets className="w-6 h-6" />
      case 'hot_water': return <Droplets className="w-6 h-6 text-red-500" />
      case 'gas': return <Flame className="w-6 h-6" />
      case 'heating': return <Thermometer className="w-6 h-6" />
      default: return <FileText className="w-6 h-6" />
    }
  }

  const getMeterName = (type) => {
    const meterType = meterTypes.find(mt => mt.code === type)
    return meterType ? meterType.name : type
  }

  const getMeterUnit = (type) => {
    const meterType = meterTypes.find(mt => mt.code === type)
    return meterType ? meterType.unit : ''
  }

  const getStatusIcon = (isVerified) => {
    return isVerified ? 
      <CheckCircle className="w-5 h-5 text-green-500" /> : 
      <AlertCircle className="w-5 h-5 text-yellow-500" />
  }

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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Показания счетчиков</h1>
          <p className="text-gray-600">Введите показания ваших счетчиков</p>
        </div>

        {/* Типы счетчиков */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-wrap gap-2 mb-4">
            {meterTypes.map((type) => (
              <button
                key={type.code}
                onClick={() => setActiveTab(type.code)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  activeTab === type.code
                    ? 'bg-primary-50 border-primary-500 text-primary-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {getMeterIcon(type.code)}
                <span>{type.name}</span>
              </button>
            ))}
          </div>

          {/* Форма ввода показаний */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {getMeterName(activeTab)}
              </h3>
              <button
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Добавить показания
              </button>
            </div>

            {showForm && (
              <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Показания ({getMeterUnit(activeTab)})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.value}
                      onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Введите показания"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Фотография счетчика
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoCapture}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Примечания
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows="3"
                    placeholder="Дополнительная информация..."
                  />
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                  >
                    {submitting ? 'Сохранение...' : 'Сохранить'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false)
                      setFormData({ value: '', notes: '', photo: null })
                    }}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Отмена
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* История показаний */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <History className="w-5 h-5" />
            История показаний
          </h3>

          {readings[activeTab] && readings[activeTab].length > 0 ? (
            <div className="space-y-4">
              {readings[activeTab].map((reading, index) => (
                <div key={reading.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(reading.is_verified)}
                      <span className="font-medium text-gray-900">
                        {reading.value} {getMeterUnit(activeTab)}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(reading.created_at).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                  
                  {reading.previous_value && (
                    <div className="text-sm text-gray-600 mb-2">
                      Предыдущее: {reading.previous_value} {getMeterUnit(activeTab)}
                      {reading.consumption && (
                        <span className="ml-2 text-green-600">
                          (+{reading.consumption} {getMeterUnit(activeTab)})
                        </span>
                      )}
                    </div>
                  )}
                  
                  {reading.notes && (
                    <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      {reading.notes}
                    </div>
                  )}
                  
                  {reading.photo_path && (
                    <div className="mt-2">
                      <img 
                        src={reading.photo_path} 
                        alt="Фото счетчика" 
                        className="w-32 h-24 object-cover rounded border"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Показания для этого счетчика пока не вводились</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Meters 