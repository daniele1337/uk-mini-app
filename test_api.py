#!/usr/bin/env python3
import requests
import json

# URL сервера
BASE_URL = "https://24autoflow.ru"

def test_create_session():
    """Тест создания сессии"""
    print("🔍 Тестируем создание сессии...")
    
    url = f"{BASE_URL}/api/auth/create-session"
    data = {"session_id": "test_session_123"}
    
    try:
        response = requests.post(url, json=data, timeout=10)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ Создание сессии работает!")
            return True
        else:
            print("❌ Ошибка создания сессии")
            return False
            
    except Exception as e:
        print(f"❌ Ошибка подключения: {e}")
        return False

def test_check_session():
    """Тест проверки сессии"""
    print("\n🔍 Тестируем проверку сессии...")
    
    url = f"{BASE_URL}/api/auth/check-session/test_session_123"
    
    try:
        response = requests.get(url, timeout=10)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ Проверка сессии работает!")
            return True
        else:
            print("❌ Ошибка проверки сессии")
            return False
            
    except Exception as e:
        print(f"❌ Ошибка подключения: {e}")
        return False

def test_health_check():
    """Тест проверки здоровья сервера"""
    print("\n🔍 Тестируем health check...")
    
    url = f"{BASE_URL}/api/health"
    
    try:
        response = requests.get(url, timeout=10)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ Сервер работает!")
            return True
        else:
            print("❌ Сервер не отвечает")
            return False
            
    except Exception as e:
        print(f"❌ Ошибка подключения: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Тестируем API endpoints...")
    print("=" * 50)
    
    # Тестируем health check
    health_ok = test_health_check()
    
    if health_ok:
        # Тестируем создание сессии
        create_ok = test_create_session()
        
        if create_ok:
            # Тестируем проверку сессии
            check_ok = test_check_session()
        else:
            check_ok = False
    else:
        create_ok = False
        check_ok = False
    
    print("\n" + "=" * 50)
    print("📊 РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ:")
    print(f"Health Check: {'✅' if health_ok else '❌'}")
    print(f"Create Session: {'✅' if create_ok else '❌'}")
    print(f"Check Session: {'✅' if check_ok else '❌'}")
    
    if not health_ok:
        print("\n🚨 ПРОБЛЕМА: Сервер не отвечает!")
        print("Возможные причины:")
        print("- Сервер не запущен")
        print("- Проблемы с сетью")
        print("- Неправильный URL")
    
    elif not create_ok:
        print("\n🚨 ПРОБЛЕМА: Endpoint создания сессии не работает!")
        print("Возможные причины:")
        print("- Endpoint не добавлен в app.py")
        print("- Сервер не перезапущен после изменений")
        print("- Ошибка в коде endpoint")
    
    elif not check_ok:
        print("\n🚨 ПРОБЛЕМА: Endpoint проверки сессии не работает!")
        print("Возможные причины:")
        print("- Endpoint не добавлен в app.py")
        print("- Сервер не перезапущен после изменений")
        print("- Ошибка в коде endpoint")
    
    else:
        print("\n🎉 ВСЕ ТЕСТЫ ПРОШЛИ УСПЕШНО!")
        print("API endpoints работают корректно")
