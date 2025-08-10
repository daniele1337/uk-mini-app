#!/usr/bin/env python3
"""
Тестовый скрипт для проверки Telegram бота
"""

import requests
import json

# Токен бота
BOT_TOKEN = "8172377647:AAE6MS5TBL-tZKBWs1A3WPECef48cl_SgnU"
API_URL = f"https://api.telegram.org/bot{BOT_TOKEN}"

def test_bot():
    """Тестирование бота"""
    print("🤖 Тестирование Telegram бота...")
    
    # 1. Проверяем информацию о боте
    print("\n1. Проверка информации о боте...")
    try:
        response = requests.get(f"{API_URL}/getMe")
        if response.status_code == 200:
            result = response.json()
            if result.get('ok'):
                bot_info = result['result']
                print(f"✅ Бот: {bot_info['first_name']} (@{bot_info['username']})")
                print(f"   ID: {bot_info['id']}")
                print(f"   Может присоединяться к группам: {bot_info.get('can_join_groups', False)}")
                print(f"   Может читать сообщения: {bot_info.get('can_read_all_group_messages', False)}")
            else:
                print(f"❌ Ошибка: {result}")
        else:
            print(f"❌ HTTP ошибка: {response.status_code}")
    except Exception as e:
        print(f"❌ Ошибка: {e}")
    
    # 2. Проверяем webhook
    print("\n2. Проверка webhook...")
    try:
        response = requests.get(f"{API_URL}/getWebhookInfo")
        if response.status_code == 200:
            result = response.json()
            if result.get('ok'):
                webhook_info = result['result']
                print(f"✅ URL: {webhook_info.get('url', 'Не установлен')}")
                print(f"   Ожидающие обновления: {webhook_info.get('pending_update_count', 0)}")
                print(f"   Последняя ошибка: {webhook_info.get('last_error_message', 'Нет')}")
                print(f"   Последняя ошибка время: {webhook_info.get('last_error_date', 'Нет')}")
            else:
                print(f"❌ Ошибка: {result}")
        else:
            print(f"❌ HTTP ошибка: {response.status_code}")
    except Exception as e:
        print(f"❌ Ошибка: {e}")
    
    # 3. Проверяем обновления
    print("\n3. Проверка обновлений...")
    try:
        response = requests.get(f"{API_URL}/getUpdates")
        if response.status_code == 200:
            result = response.json()
            if result.get('ok'):
                updates = result['result']
                print(f"✅ Получено обновлений: {len(updates)}")
                for i, update in enumerate(updates[-3:]):  # Последние 3
                    print(f"   Обновление {i+1}: {update.get('update_id')}")
                    if 'message' in update:
                        msg = update['message']
                        print(f"     Сообщение: {msg.get('text', 'Нет текста')}")
                        print(f"     От: {msg.get('from', {}).get('first_name', 'Неизвестно')}")
            else:
                print(f"❌ Ошибка: {result}")
        else:
            print(f"❌ HTTP ошибка: {response.status_code}")
    except Exception as e:
        print(f"❌ Ошибка: {e}")

if __name__ == "__main__":
    test_bot()
