#!/usr/bin/env python3
"""
Telegram Bot для ЖКХ Mini App
Поддерживает QR-авторизацию и уведомления
"""

import os
import json
import requests
import logging
from datetime import datetime
from flask import Flask, request, jsonify
import threading
import time

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Конфигурация
BOT_TOKEN = "8172377647:AAE6MS5TBL-tZKBWs1A3WPECef48cl_SgnU"
WEBHOOK_URL = "https://24autoflow.ru/webhook/telegram"
API_BASE_URL = "https://24autoflow.ru/api"

class TelegramBot:
    def __init__(self):
        self.token = BOT_TOKEN
        self.api_url = f"https://api.telegram.org/bot{self.token}"
        self.webhook_url = WEBHOOK_URL
        self.api_base_url = API_BASE_URL
        
    def set_webhook(self):
        """Установка webhook для получения обновлений"""
        try:
            url = f"{self.api_url}/setWebhook"
            data = {
                'url': self.webhook_url,
                'allowed_updates': ['message', 'callback_query']
            }
            response = requests.post(url, json=data)
            
            if response.status_code == 200:
                result = response.json()
                if result.get('ok'):
                    logger.info("✅ Webhook установлен успешно")
                    return True
                else:
                    logger.error(f"❌ Ошибка установки webhook: {result}")
                    return False
            else:
                logger.error(f"❌ HTTP ошибка при установке webhook: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Ошибка установки webhook: {e}")
            return False
    
    def delete_webhook(self):
        """Удаление webhook"""
        try:
            url = f"{self.api_url}/deleteWebhook"
            response = requests.post(url)
            if response.status_code == 200:
                logger.info("✅ Webhook удален")
                return True
            return False
        except Exception as e:
            logger.error(f"❌ Ошибка удаления webhook: {e}")
            return False
    
    def get_me(self):
        """Получение информации о боте"""
        try:
            url = f"{self.api_url}/getMe"
            response = requests.get(url)
            if response.status_code == 200:
                result = response.json()
                if result.get('ok'):
                    bot_info = result['result']
                    logger.info(f"🤖 Бот: {bot_info['first_name']} (@{bot_info['username']})")
                    return bot_info
            return None
        except Exception as e:
            logger.error(f"❌ Ошибка получения информации о боте: {e}")
            return None
    
    def send_message(self, chat_id, text, parse_mode='HTML', reply_markup=None):
        """Отправка сообщения"""
        try:
            url = f"{self.api_url}/sendMessage"
            data = {
                'chat_id': chat_id,
                'text': text,
                'parse_mode': parse_mode
            }
            
            if reply_markup:
                data['reply_markup'] = reply_markup
            
            response = requests.post(url, json=data)
            if response.status_code == 200:
                result = response.json()
                if result.get('ok'):
                    logger.info(f"✅ Сообщение отправлено в чат {chat_id}")
                    return result['result']
                else:
                    logger.error(f"❌ Ошибка отправки сообщения: {result}")
                    return None
            else:
                logger.error(f"❌ HTTP ошибка при отправке сообщения: {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"❌ Ошибка отправки сообщения: {e}")
            return None
    
    def send_qr_auth_data(self, session_id, user):
        """Отправка данных QR-авторизации на сервер"""
        try:
            url = f"{self.api_base_url}/auth/qr-login"
            data = {
                'session_id': session_id,
                'telegram_id': user.get('id'),
                'first_name': user.get('first_name', ''),
                'last_name': user.get('last_name', ''),
                'username': user.get('username', '')
            }
            
            logger.info(f"📤 Отправляем данные QR-авторизации: {data}")
            
            response = requests.post(url, json=data, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success'):
                    logger.info(f"✅ QR-авторизация успешна для пользователя {user.get('first_name')}")
                    return True
                else:
                    logger.error(f"❌ Ошибка QR-авторизации: {result}")
                    return False
            else:
                logger.error(f"❌ HTTP ошибка QR-авторизации: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Ошибка отправки данных QR-авторизации: {e}")
            return False
    
    def handle_start_command(self, message):
        """Обработка команды /start"""
        try:
            text = message.get('text', '')
            user = message.get('from', {})
            chat_id = message.get('chat', {}).get('id')
            
            logger.info(f"📱 Получена команда start: {text} от пользователя {user.get('first_name')}")
            
            if text.startswith('/start qr_'):
                # QR-авторизация
                session_id = text.replace('/start qr_', '')
                logger.info(f"🔐 QR-авторизация для сессии: {session_id}")
                
                # Отправляем данные на сервер
                success = self.send_qr_auth_data(session_id, user)
                
                if success:
                    response_text = (
                        "✅ <b>Авторизация успешна!</b>\n\n"
                        "Вы успешно авторизовались в системе управления домом.\n"
                        "Теперь можете закрыть это окно и вернуться в браузер.\n\n"
                        "🚀 <i>Добро пожаловать в систему!</i>"
                    )
                else:
                    response_text = (
                        "❌ <b>Ошибка авторизации</b>\n\n"
                        "Не удалось авторизоваться в системе.\n"
                        "Попробуйте еще раз или обратитесь к администратору.\n\n"
                        "🔄 <i>Попробуйте отсканировать QR-код снова</i>"
                    )
                
                self.send_message(chat_id, response_text)
                
            else:
                # Обычная команда start
                response_text = (
                    "🏠 <b>Добро пожаловать в систему управления домом!</b>\n\n"
                    "Этот бот поможет вам:\n"
                    "• Получать уведомления о важных событиях\n"
                    "• Быстро авторизоваться в веб-приложении\n"
                    "• Оставаться в курсе новостей дома\n\n"
                    "📱 <i>Для авторизации в веб-приложении отсканируйте QR-код</i>\n\n"
                    "🔗 <a href='https://24autoflow.ru'>Открыть веб-приложение</a>"
                )
                
                # Кнопка для открытия веб-приложения
                reply_markup = {
                    'inline_keyboard': [[
                        {
                            'text': '🌐 Открыть веб-приложение',
                            'url': 'https://24autoflow.ru'
                        }
                    ]]
                }
                
                self.send_message(chat_id, response_text, reply_markup=reply_markup)
                
        except Exception as e:
            logger.error(f"❌ Ошибка обработки команды start: {e}")
    
    def handle_message(self, message):
        """Обработка входящих сообщений"""
        try:
            text = message.get('text', '')
            
            if text.startswith('/start'):
                self.handle_start_command(message)
            elif text.startswith('/help'):
                self.handle_help_command(message)
            else:
                # Обработка обычных сообщений
                chat_id = message.get('chat', {}).get('id')
                response_text = (
                    "🤖 <b>Система управления домом</b>\n\n"
                    "Доступные команды:\n"
                    "/start - Запустить бота\n"
                    "/help - Получить помощь\n\n"
                    "📱 <i>Для авторизации в веб-приложении отсканируйте QR-код</i>"
                )
                self.send_message(chat_id, response_text)
                
        except Exception as e:
            logger.error(f"❌ Ошибка обработки сообщения: {e}")
    
    def handle_help_command(self, message):
        """Обработка команды /help"""
        try:
            chat_id = message.get('chat', {}).get('id')
            response_text = (
                "❓ <b>Справка по использованию бота</b>\n\n"
                "🔐 <b>QR-авторизация:</b>\n"
                "1. Откройте веб-приложение в браузере\n"
                "2. Отсканируйте QR-код в Telegram\n"
                "3. Автоматически войдите в систему\n\n"
                "📱 <b>Уведомления:</b>\n"
                "Бот будет отправлять вам важные уведомления:\n"
                "• Новости дома\n"
                "• Плановые работы\n"
                "• Обновления системы\n\n"
                "🔗 <b>Полезные ссылки:</b>\n"
                "• <a href='https://24autoflow.ru'>Веб-приложение</a>\n\n"
                "📞 <b>Поддержка:</b>\n"
                "При возникновении проблем обратитесь к администратору.\n\n"
                "🚀 <i>Удачного использования!</i>"
            )
            
            self.send_message(chat_id, response_text)
            
        except Exception as e:
            logger.error(f"❌ Ошибка обработки команды help: {e}")
    
    def process_update(self, update):
        """Обработка обновления от Telegram"""
        try:
            if 'message' in update:
                self.handle_message(update['message'])
            elif 'callback_query' in update:
                # Обработка callback query (кнопки)
                callback_query = update['callback_query']
                chat_id = callback_query['message']['chat']['id']
                
                # Отвечаем на callback query
                callback_id = callback_query['id']
                url = f"{self.api_url}/answerCallbackQuery"
                requests.post(url, json={'callback_query_id': callback_id})
                
                # Обрабатываем данные кнопки
                data = callback_query.get('data', '')
                if data == 'open_webapp':
                    response_text = "🔗 Откройте веб-приложение: https://24autoflow.ru"
                    self.send_message(chat_id, response_text)
                    
        except Exception as e:
            logger.error(f"❌ Ошибка обработки обновления: {e}")

# Создаем экземпляр бота
bot = TelegramBot()

# Flask приложение для webhook
app = Flask(__name__)

@app.route('/webhook/telegram', methods=['POST'])
def telegram_webhook():
    """Webhook endpoint для получения обновлений от Telegram"""
    try:
        update = request.json
        logger.info(f"📨 Получено обновление: {update}")
        
        # Обрабатываем обновление в отдельном потоке
        threading.Thread(target=bot.process_update, args=(update,)).start()
        
        return jsonify({'ok': True})
        
    except Exception as e:
        logger.error(f"❌ Ошибка webhook: {e}")
        return jsonify({'ok': False, 'error': str(e)}), 500

@app.route('/webhook/telegram', methods=['GET'])
def telegram_webhook_info():
    """Информация о webhook"""
    return jsonify({
        'webhook_url': bot.webhook_url,
        'bot_info': bot.get_me(),
        'status': 'active'
    })

def setup_bot():
    """Настройка бота"""
    try:
        logger.info("🚀 Настройка Telegram бота...")
        
        # Получаем информацию о боте
        bot_info = bot.get_me()
        if not bot_info:
            logger.error("❌ Не удалось получить информацию о боте")
            return False
        
        # Устанавливаем webhook
        if bot.set_webhook():
            logger.info("✅ Бот настроен и готов к работе!")
            return True
        else:
            logger.error("❌ Не удалось настроить webhook")
            return False
            
    except Exception as e:
        logger.error(f"❌ Ошибка настройки бота: {e}")
        return False

def run_bot():
    """Запуск бота"""
    try:
        logger.info("🤖 Запуск Telegram бота...")
        
        if setup_bot():
            logger.info("✅ Бот запущен и слушает обновления")
            logger.info(f"🌐 Webhook URL: {bot.webhook_url}")
            logger.info("📱 Бот готов к работе!")
            
            # Запускаем Flask приложение
            app.run(host='0.0.0.0', port=5001, debug=False)
        else:
            logger.error("❌ Не удалось запустить бота")
            
    except Exception as e:
        logger.error(f"❌ Ошибка запуска бота: {e}")

if __name__ == "__main__":
    run_bot()
