// GigaChat API сервис через наш бэкенд
class GigaChatService {
  constructor() {
    this.apiUrl = '/api/gigachat' // Используем наш бэкенд API
  }



  // Отправка сообщения через наш бэкенд
  async sendMessage(message, conversationHistory = []) {
    try {
      const response = await fetch(`${this.apiUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          conversation_history: conversationHistory
        })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        return data.response
      } else {
        throw new Error(data.error || 'Unknown error')
      }
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error)
      throw error
    }
  }

  // Проверка доступности API
  async checkAvailability() {
    try {
      const response = await fetch(`${this.apiUrl}/status`)
      if (response.ok) {
        const data = await response.json()
        return data.status === 'connected'
      }
      return false
    } catch (error) {
      console.error('Ошибка проверки доступности:', error)
      return false
    }
  }
}

export default new GigaChatService()
