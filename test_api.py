#!/usr/bin/env python3
"""
Тестовый скрипт для проверки API
"""

import requests
import json

# Базовый URL
BASE_URL = "http://localhost:8000"

def test_health():
    """Тест проверки здоровья сервера"""
    print("=== Тест /api/health ===")
    try:
        response = requests.get(f"{BASE_URL}/api/health")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_database():
    """Тест подключения к базе данных"""
    print("\n=== Тест /api/test ===")
    try:
        response = requests.get(f"{BASE_URL}/api/test")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_telegram_auth():
    """Тест авторизации через Telegram"""
    print("\n=== Тест /api/auth/telegram ===")
    try:
        # Тестовые данные Telegram
        test_data = {
            "id": 123456789,
            "first_name": "Тестовый",
            "last_name": "Пользователь",
            "username": "test_user",
            "photo_url": None,
            "auth_date": 1234567890,
            "hash": "test_hash"
        }
        
        response = requests.post(f"{BASE_URL}/api/auth/telegram", json=test_data)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            return response.json().get('token')
        return None
    except Exception as e:
        print(f"Error: {e}")
        return None

def test_complaints_with_token(token):
    """Тест работы с обращениями"""
    print(f"\n=== Тест /api/complaints с токеном ===")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Тест получения обращений
    print("GET /api/complaints")
    try:
        response = requests.get(f"{BASE_URL}/api/complaints", headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Тест создания обращения
    print("\nPOST /api/complaints")
    try:
        complaint_data = {
            "title": "Тестовое обращение",
            "description": "Это тестовое обращение для проверки API",
            "category": "general",
            "priority": "medium"
        }
        
        response = requests.post(f"{BASE_URL}/api/complaints", 
                               headers=headers, 
                               json=complaint_data)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Error: {e}")

def main():
    print("🚀 Начинаем тестирование API...")
    
    # Тест 1: Проверка здоровья сервера
    if not test_health():
        print("❌ Сервер недоступен")
        return
    
    # Тест 2: Проверка базы данных
    if not test_database():
        print("❌ Проблемы с базой данных")
        return
    
    # Тест 3: Авторизация
    token = test_telegram_auth()
    if not token:
        print("❌ Проблемы с авторизацией")
        return
    
    # Тест 4: Работа с обращениями
    test_complaints_with_token(token)
    
    print("\n✅ Тестирование завершено")

if __name__ == "__main__":
    main()
