import React, { useState, useRef, useEffect } from 'react'
import { Bot, Send, X, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react'
import gigaChatService from '../services/gigachat'

const AIChat = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('checking')
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Проверка подключения к GigaChat при открытии чата
  useEffect(() => {
    if (isOpen && connectionStatus === 'checking') {
      checkConnection()
    }
  }, [isOpen])

  const checkConnection = async () => {
    try {
      setConnectionStatus('checking')
      const isAvailable = await gigaChatService.checkAvailability()
      setIsConnected(isAvailable)
      setConnectionStatus(isAvailable ? 'connected' : 'error')
      
      if (isAvailable && messages.length === 0) {
        // Добавляем приветственное сообщение
        const welcomeMessage = {
          id: Date.now(),
          text: 'Здравствуйте! Я опытный сотрудник ЖКХ с многолетним стажем. Могу проконсультировать вас по всем вопросам жилищно-коммунального хозяйства: управление МКД, коммунальные услуги, ремонт, собрания собственников, жилищное законодательство и многое другое. Задавайте ваши вопросы!',
          sender: 'ai',
          timestamp: new Date()
        }
        setMessages([welcomeMessage])
      }
    } catch (error) {
      console.error('Ошибка проверки подключения:', error)
      setIsConnected(false)
      setConnectionStatus('error')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !isConnected) return

    const userMessage = {
      id: Date.now(),
      text: newMessage,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setNewMessage('')
    setIsTyping(true)

    try {
      // Получаем историю диалога для контекста
      const conversationHistory = messages.filter(msg => msg.sender !== 'ai' || !msg.text.includes('Здравствуйте! Я опытный сотрудник ЖКХ'))
      
      // Отправляем сообщение в GigaChat
      const aiResponse = await gigaChatService.sendMessage(newMessage, conversationHistory)
      
      const aiMessage = {
        id: Date.now() + 1,
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('Ошибка получения ответа:', error)
      
      const errorMessage = {
        id: Date.now() + 1,
        text: 'Извините, произошла ошибка при обработке вашего запроса. Попробуйте еще раз или обратитесь к специалисту.',
        sender: 'ai',
        timestamp: new Date(),
        isError: true
      }
      
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'checking':
        return <RefreshCw className="w-4 h-4 text-yellow-500 animate-spin" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'ИИ подключен'
      case 'error':
        return 'Ошибка подключения'
      case 'checking':
        return 'Проверка подключения...'
      default:
        return 'Неизвестный статус'
    }
  }

  return (
    <>
      {/* Кнопка чата */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-full shadow-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 z-50"
        title="Опытный сотрудник ЖКХ"
      >
        <Bot className="w-6 h-6" />
      </button>

      {/* Окно чата */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 w-96 h-[500px] bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          {/* Заголовок */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bot className="w-6 h-6" />
              <div>
                <h3 className="font-semibold">Опытный сотрудник ЖКХ</h3>
                <div className="flex items-center space-x-2 text-sm">
                  {getStatusIcon()}
                  <span className="text-purple-100">{getStatusText()}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {connectionStatus === 'error' && (
                <button
                  onClick={checkConnection}
                  className="text-purple-100 hover:text-white p-1"
                  title="Переподключиться"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-purple-100 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Сообщения */}
          <div className="h-80 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Bot className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Опытный сотрудник ЖКХ готов помочь</p>
                <p className="text-sm">Задайте ваш вопрос</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-3 py-2 rounded-lg ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                        : message.isError
                        ? 'bg-red-50 text-red-800 border border-red-200'
                        : 'bg-gradient-to-r from-purple-50 to-blue-50 text-gray-900 border border-purple-200'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            )}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 text-gray-900 px-3 py-2 rounded-lg border border-purple-200">
                  <div className="flex items-center space-x-2">
                    <Bot className="w-4 h-4 text-purple-600" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Форма отправки */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={isConnected ? "Задайте ваш вопрос..." : "Подключение к специалисту..."}
                disabled={!isConnected || isTyping}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || !isConnected || isTyping}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}

export default AIChat
