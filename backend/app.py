from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
import os
from PIL import Image
import pytesseract
import cv2
import numpy as np
import pandas as pd
from io import BytesIO
import base64

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///uk_mini_app.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

CORS(app)
db = SQLAlchemy(app)

# Модели базы данных
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    telegram_id = db.Column(db.String(50), unique=True, nullable=False)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100))
    username = db.Column(db.String(100))
    apartment = db.Column(db.String(20))
    building = db.Column(db.String(20))
    street = db.Column(db.String(100))
    phone = db.Column(db.String(20))
    email = db.Column(db.String(100))
    is_admin = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    # Убираем проблемные отношения
    # meter_readings = db.relationship('MeterReading', backref='user', lazy=True)
    # complaints = db.relationship('Complaint', backref='user', lazy=True)

class MeterReading(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    meter_type = db.Column(db.String(20), nullable=False)  # electricity, cold_water, hot_water, gas, heating
    value = db.Column(db.Float, nullable=False)
    previous_value = db.Column(db.Float)
    consumption = db.Column(db.Float)  # Разница между текущим и предыдущим показанием
    photo_path = db.Column(db.String(200))
    notes = db.Column(db.Text)
    is_verified = db.Column(db.Boolean, default=False)
    verified_by_name = db.Column(db.String(100))  # Имя администратора, который подтвердил
    verified_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class Complaint(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50), nullable=False)  # plumbing, electricity, cleaning, noise, other
    priority = db.Column(db.String(20), default='medium')  # low, medium, high, urgent
    status = db.Column(db.String(20), default='new')  # new, in_progress, resolved, rejected, closed
    assigned_to_name = db.Column(db.String(100))  # Имя назначенного администратора
    response = db.Column(db.Text)
    resolution_notes = db.Column(db.Text)
    estimated_completion = db.Column(db.DateTime)
    actual_completion = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    message = db.Column(db.Text, nullable=False)
    title = db.Column(db.String(200))
    target = db.Column(db.String(20), default='all')  # all, active, inactive, specific
    target_users = db.Column(db.Text)  # JSON array of user IDs
    notification_type = db.Column(db.String(20), default='info')  # info, warning, success, error
    sent_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    read_by = db.Column(db.Text)  # JSON array of user IDs who read it

class MeterType(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    code = db.Column(db.String(20), unique=True, nullable=False)
    unit = db.Column(db.String(10), nullable=False)  # кВт·ч, м³, Гкал
    description = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

class ComplaintCategory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    code = db.Column(db.String(20), unique=True, nullable=False)
    description = db.Column(db.Text)
    sla_hours = db.Column(db.Integer, default=24)  # Service Level Agreement в часах
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

# Создание таблиц
with app.app_context():
    db.create_all()
    
    # Инициализация базовых данных
    if not MeterType.query.first():
        meter_types = [
            MeterType(name='Электричество', code='electricity', unit='кВт·ч', description='Показания электросчетчика'),
            MeterType(name='Холодная вода', code='cold_water', unit='м³', description='Показания счетчика холодной воды'),
            MeterType(name='Горячая вода', code='hot_water', unit='м³', description='Показания счетчика горячей воды'),
            MeterType(name='Газ', code='gas', unit='м³', description='Показания газового счетчика'),
            MeterType(name='Отопление', code='heating', unit='Гкал', description='Показания счетчика отопления')
        ]
        db.session.add_all(meter_types)
        
    if not ComplaintCategory.query.first():
        categories = [
            ComplaintCategory(name='Сантехника', code='plumbing', description='Проблемы с водоснабжением, канализацией', sla_hours=4),
            ComplaintCategory(name='Электричество', code='electricity', description='Проблемы с электроснабжением', sla_hours=2),
            ComplaintCategory(name='Уборка', code='cleaning', description='Проблемы с уборкой помещений', sla_hours=24),
            ComplaintCategory(name='Шум', code='noise', description='Жалобы на шум', sla_hours=48),
            ComplaintCategory(name='Другое', code='other', description='Прочие обращения', sla_hours=72)
        ]
        db.session.add_all(categories)
    
    # Создание тестового админа
    if not User.query.filter_by(telegram_id='123456789').first():
        admin_user = User(
            telegram_id='123456789',
            first_name='Администратор',
            last_name='УК',
            username='admin_uk',
            apartment='1',
            building='1',
            street='Тестовая улица',
            phone='+7 (999) 123-45-67',
            email='admin@uk.ru',
            is_admin=True,
            is_active=True
        )
        db.session.add(admin_user)
        
    db.session.commit()

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'message': 'Server is running'})

# Функции для работы с JWT
def generate_token(user_id):
    payload = {
        'user_id': user_id,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=30)
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')

def verify_token(token):
    try:
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload['user_id']
    except:
        return None

# OCR функция
def process_meter_image(image_file):
    try:
        # Читаем изображение
        image = Image.open(image_file)
        
        # Конвертируем в numpy array
        img_array = np.array(image)
        
        # Конвертируем в grayscale
        gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        
        # Применяем фильтры для улучшения качества
        # Увеличиваем контраст
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        gray = clahe.apply(gray)
        
        # Убираем шум
        denoised = cv2.fastNlMeansDenoising(gray)
        
        # Бинаризация
        _, binary = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        # OCR
        text = pytesseract.image_to_string(binary, config='--psm 7 -c tessedit_char_whitelist=0123456789.')
        
        # Извлекаем числа
        import re
        numbers = re.findall(r'\d+\.?\d*', text)
        
        if numbers:
            value = float(numbers[0])
            confidence = 0.8  # Примерная уверенность
            return {
                'success': True,
                'value': value,
                'confidence': confidence,
                'unit': 'кВт⋅ч' if 'electricity' in str(image_file) else 'м³'
            }
        else:
            return {
                'success': False,
                'error': 'Не удалось распознать числа'
            }
            
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

# API маршруты
# Улучшенная авторизация через Telegram
@app.route('/api/auth/telegram', methods=['POST'])
def telegram_auth():
    """Авторизация через Telegram Web App"""
    try:
        data = request.get_json()
        
        # Проверяем наличие обязательных полей
        if not data or 'id' not in data:
            return jsonify({'error': 'Invalid Telegram data'}), 400
        
        telegram_id = str(data['id'])
        first_name = data.get('first_name', '')
        last_name = data.get('last_name', '')
        username = data.get('username', '')
        
        # Проверяем, существует ли пользователь
        user = User.query.filter_by(telegram_id=telegram_id).first()
        
        if not user:
            # Создаем нового пользователя
            user = User(
                telegram_id=telegram_id,
                first_name=first_name,
                last_name=last_name,
                username=username,
                is_active=True
            )
            db.session.add(user)
            db.session.commit()
        
        # Генерируем токен
        token = generate_token(user.id)
        
        return jsonify({
            'success': True,
            'token': token,
            'user': {
                'id': user.id,
                'telegram_id': user.telegram_id,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'username': user.username,
                'apartment': user.apartment,
                'building': user.building,
                'street': user.street,
                'phone': user.phone,
                'email': user.email,
                'is_admin': user.is_admin,
                'is_active': user.is_active
            }
        })
        
    except Exception as e:
        print(f"Error in telegram auth: {e}")
        return jsonify({'error': 'Authentication failed'}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    
    # В реальном приложении здесь была бы проверка email/password
    # Для демо используем простую логику
    user = User.query.filter_by(email=data['email']).first()
    
    if user:
        token = generate_token(user.id)
        return jsonify({
            'success': True,
            'user': {
                'id': user.id,
                'telegram_id': user.telegram_id,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'username': user.username,
                'apartment': user.apartment,
                'building': user.building,
                'street': user.street,
                'phone': user.phone,
                'email': user.email
            },
            'token': token
        })
    
    return jsonify({'success': False, 'message': 'Неверные данные'}), 401

@app.route('/api/users/stats', methods=['GET'])
def user_stats():
    # Получаем пользователя из токена
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Unauthorized'}), 401
    
    token = auth_header.split(' ')[1]
    user_id = verify_token(token)
    
    if not user_id:
        return jsonify({'error': 'Invalid token'}), 401
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Статистика пользователя
    readings_count = MeterReading.query.filter_by(user_id=user_id).count()
    complaints_count = Complaint.query.filter_by(user_id=user_id).count()
    active_complaints = Complaint.query.filter_by(user_id=user_id, status='new').count()
    
    # Последние показания
    last_reading = MeterReading.query.filter_by(user_id=user_id).order_by(MeterReading.created_at.desc()).first()
    
    stats = {
        'metersCount': readings_count,
        'complaintsCount': complaints_count,
        'activeComplaints': active_complaints,
        'lastReading': {
            'electricity': last_reading.value if last_reading and last_reading.meter_type == 'electricity' else 0,
            'water': last_reading.value if last_reading and last_reading.meter_type == 'water' else 0,
            'gas': last_reading.value if last_reading and last_reading.meter_type == 'gas' else 0,
            'date': last_reading.created_at.isoformat() if last_reading else None
        } if last_reading else None
    }
    
    return jsonify(stats)

@app.route('/api/meters/ocr', methods=['POST'])
def meter_ocr():
    if 'photo' not in request.files:
        return jsonify({'success': False, 'error': 'No photo provided'}), 400
    
    photo = request.files['photo']
    meter_type = request.form.get('meter_type', 'electricity')
    
    # Обработка изображения
    result = process_meter_image(photo)
    
    return jsonify(result)

@app.route('/api/meters/submit', methods=['POST'])
def submit_meter_readings():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Unauthorized'}), 401
    
    token = auth_header.split(' ')[1]
    user_id = verify_token(token)
    
    if not user_id:
        return jsonify({'error': 'Invalid token'}), 401
    
    data = request.json
    readings = data['readings']
    
    try:
        for meter_type, value in readings.items():
            if value:  # Если есть значение
                reading = MeterReading(
                    user_id=user_id,
                    meter_type=meter_type,
                    value=float(value)
                )
                db.session.add(reading)
        
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Показания успешно сохранены'})
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/complaints', methods=['GET'])
def get_complaints():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Unauthorized'}), 401
    
    token = auth_header.split(' ')[1]
    user_id = verify_token(token)
    
    if not user_id:
        return jsonify({'error': 'Invalid token'}), 401
    
    complaints = Complaint.query.filter_by(user_id=user_id).order_by(Complaint.created_at.desc()).all()
    
    complaints_data = []
    for complaint in complaints:
        complaints_data.append({
            'id': complaint.id,
            'title': complaint.title,
            'description': complaint.description,
            'category': complaint.category,
            'status': complaint.status,
            'response': complaint.response,
            'created_at': complaint.created_at.isoformat()
        })
    
    return jsonify({'complaints': complaints_data})

# API для типов счетчиков
@app.route('/api/meter-types', methods=['GET'])
def get_meter_types():
    """Получить все типы счетчиков"""
    meter_types = MeterType.query.filter_by(is_active=True).all()
    return jsonify([{
        'id': mt.id,
        'name': mt.name,
        'code': mt.code,
        'unit': mt.unit,
        'description': mt.description
    } for mt in meter_types])

# API для категорий обращений
@app.route('/api/complaint-categories', methods=['GET'])
def get_complaint_categories():
    """Получить все категории обращений"""
    categories = ComplaintCategory.query.filter_by(is_active=True).all()
    return jsonify([{
        'id': cat.id,
        'name': cat.name,
        'code': cat.code,
        'description': cat.description,
        'sla_hours': cat.sla_hours
    } for cat in categories])

# Улучшенный API для показаний счетчиков
@app.route('/api/meters/readings', methods=['GET'])
def get_meter_readings():
    """Получить показания счетчиков пользователя"""
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_id = verify_token(token)
    
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Получаем последние показания по каждому типу счетчика
    readings = db.session.query(MeterReading).filter(
        MeterReading.user_id == user_id
    ).order_by(MeterReading.created_at.desc()).all()
    
    # Группируем по типу счетчика
    readings_by_type = {}
    for reading in readings:
        if reading.meter_type not in readings_by_type:
            readings_by_type[reading.meter_type] = []
        readings_by_type[reading.meter_type].append({
            'id': reading.id,
            'value': reading.value,
            'previous_value': reading.previous_value,
            'consumption': reading.consumption,
            'notes': reading.notes,
            'is_verified': reading.is_verified,
            'created_at': reading.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'photo_path': reading.photo_path
        })
    
    return jsonify(readings_by_type)

@app.route('/api/meters/readings/<meter_type>', methods=['POST'])
def submit_meter_reading(meter_type):
    """Отправить показания конкретного счетчика"""
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_id = verify_token(token)
    
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json()
    value = data.get('value')
    notes = data.get('notes', '')
    photo_data = data.get('photo')
    
    if not value:
        return jsonify({'error': 'Value is required'}), 400
    
    # Получаем предыдущее показание
    previous_reading = MeterReading.query.filter_by(
        user_id=user_id, 
        meter_type=meter_type
    ).order_by(MeterReading.created_at.desc()).first()
    
    previous_value = previous_reading.value if previous_reading else None
    consumption = value - previous_value if previous_value else None
    
    # Сохраняем фото если есть
    photo_path = None
    if photo_data:
        try:
            # Декодируем base64
            photo_bytes = base64.b64decode(photo_data.split(',')[1])
            filename = f"meter_{user_id}_{meter_type}_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg"
            photo_path = f"uploads/{filename}"
            
            # Создаем папку если не существует
            os.makedirs('uploads', exist_ok=True)
            
            with open(photo_path, 'wb') as f:
                f.write(photo_bytes)
        except Exception as e:
            print(f"Error saving photo: {e}")
    
    # Создаем новое показание
    reading = MeterReading(
        user_id=user_id,
        meter_type=meter_type,
        value=value,
        previous_value=previous_value,
        consumption=consumption,
        notes=notes,
        photo_path=photo_path
    )
    
    db.session.add(reading)
    db.session.commit()
    
    return jsonify({
        'id': reading.id,
        'value': reading.value,
        'previous_value': reading.previous_value,
        'consumption': reading.consumption,
        'created_at': reading.created_at.strftime('%Y-%m-%d %H:%M:%S')
    })

# Улучшенный API для обращений
@app.route('/api/complaints', methods=['POST'])
def create_complaint():
    """Создать новое обращение"""
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_id = verify_token(token)
    
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json()
    title = data.get('title')
    description = data.get('description')
    category = data.get('category')
    priority = data.get('priority', 'medium')
    
    if not all([title, description, category]):
        return jsonify({'error': 'Title, description and category are required'}), 400
    
    complaint = Complaint(
        user_id=user_id,
        title=title,
        description=description,
        category=category,
        priority=priority
    )
    
    db.session.add(complaint)
    db.session.commit()
    
    return jsonify({
        'id': complaint.id,
        'title': complaint.title,
        'status': complaint.status,
        'created_at': complaint.created_at.strftime('%Y-%m-%d %H:%M:%S')
    })

@app.route('/api/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Unauthorized'}), 401
    
    token = auth_header.split(' ')[1]
    current_user_id = verify_token(token)
    
    if not current_user_id or current_user_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.json
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Обновляем поля
    for field in ['apartment', 'building', 'street', 'phone', 'email']:
        if field in data:
            setattr(user, field, data[field])
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'user': {
            'id': user.id,
            'telegram_id': user.telegram_id,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'username': user.username,
            'apartment': user.apartment,
            'building': user.building,
            'street': user.street,
            'phone': user.phone,
            'email': user.email
        }
    })

# API для обновления профиля пользователя
@app.route('/api/users/profile', methods=['PUT'])
def update_user_profile():
    """Обновить профиль пользователя"""
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_id = verify_token(token)
    
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    
    # Обновляем поля профиля
    if 'apartment' in data:
        user.apartment = data['apartment']
    if 'building' in data:
        user.building = data['building']
    if 'street' in data:
        user.street = data['street']
    if 'phone' in data:
        user.phone = data['phone']
    if 'email' in data:
        user.email = data['email']
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'user': {
            'id': user.id,
            'telegram_id': user.telegram_id,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'username': user.username,
            'apartment': user.apartment,
            'building': user.building,
            'street': user.street,
            'phone': user.phone,
            'email': user.email,
            'is_admin': user.is_admin,
            'is_active': user.is_active
        }
    })

# Админские маршруты
@app.route('/api/admin/stats', methods=['GET'])
def admin_stats():
    # В реальном приложении здесь была бы проверка на админа
    total_users = User.query.count()
    total_complaints = Complaint.query.count()
    total_readings = MeterReading.query.count()
    active_complaints = Complaint.query.filter_by(status='new').count()
    
    return jsonify({
        'totalUsers': total_users,
        'totalComplaints': total_complaints,
        'totalReadings': total_readings,
        'activeComplaints': active_complaints
    })

@app.route('/api/admin/complaints', methods=['GET'])
def admin_complaints():
    complaints = db.session.query(Complaint, User).join(User).order_by(Complaint.created_at.desc()).all()
    
    complaints_data = []
    for complaint, user in complaints:
        complaints_data.append({
            'id': complaint.id,
            'title': complaint.title,
            'description': complaint.description,
            'category': complaint.category,
            'status': complaint.status,
            'response': complaint.response,
            'created_at': complaint.created_at.isoformat(),
            'user_name': f"{user.first_name} {user.last_name}",
            'address': f"{user.street} {user.building} {user.apartment}"
        })
    
    return jsonify({'complaints': complaints_data})

# CRM API для администраторов
@app.route('/api/admin/complaints/<int:complaint_id>', methods=['PUT'])
def update_complaint_status(complaint_id):
    """Обновить статус обращения (CRM)"""
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_id = verify_token(token)
    
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    user = User.query.get(user_id)
    if not user or not user.is_admin:
        return jsonify({'error': 'Admin access required'}), 403
    
    complaint = Complaint.query.get(complaint_id)
    if not complaint:
        return jsonify({'error': 'Complaint not found'}), 404
    
    data = request.get_json()
    status = data.get('status')
    response = data.get('response')
    resolution_notes = data.get('resolution_notes')
    assigned_to = data.get('assigned_to')
    estimated_completion = data.get('estimated_completion')
    
    if status:
        complaint.status = status
        if status == 'resolved':
            complaint.actual_completion = datetime.datetime.utcnow()
    
    if response:
        complaint.response = response
    
    if resolution_notes:
        complaint.resolution_notes = resolution_notes
    
    if assigned_to:
        complaint.assigned_to_name = assigned_to # Changed from assigned_to to assigned_to_name
    
    if estimated_completion:
        complaint.estimated_completion = datetime.datetime.strptime(estimated_completion, '%Y-%m-%d %H:%M:%S')
    
    complaint.updated_at = datetime.datetime.utcnow()
    
    db.session.commit()
    
    return jsonify({
        'id': complaint.id,
        'status': complaint.status,
        'updated_at': complaint.updated_at.strftime('%Y-%m-%d %H:%M:%S')
    })

@app.route('/api/admin/meter-readings', methods=['GET'])
def admin_meter_readings():
    """Получить все показания счетчиков для админа"""
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_id = verify_token(token)
    
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    user = User.query.get(user_id)
    if not user or not user.is_admin:
        return jsonify({'error': 'Admin access required'}), 403
    
    # Получаем параметры фильтрации
    meter_type = request.args.get('meter_type')
    user_filter = request.args.get('user_id')
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')
    
    query = db.session.query(MeterReading).join(User)
    
    if meter_type:
        query = query.filter(MeterReading.meter_type == meter_type)
    
    if user_filter:
        query = query.filter(MeterReading.user_id == user_filter)
    
    if date_from:
        query = query.filter(MeterReading.created_at >= datetime.datetime.strptime(date_from, '%Y-%m-%d'))
    
    if date_to:
        query = query.filter(MeterReading.created_at <= datetime.datetime.strptime(date_to, '%Y-%m-%d'))
    
    readings = query.order_by(MeterReading.created_at.desc()).all()
    
    result = []
    for reading in readings:
        user = User.query.get(reading.user_id)
        result.append({
            'id': reading.id,
            'user_name': f"{user.first_name} {user.last_name}",
            'user_apartment': user.apartment,
            'user_building': user.building,
            'meter_type': reading.meter_type,
            'value': reading.value,
            'previous_value': reading.previous_value,
            'consumption': reading.consumption,
            'is_verified': reading.is_verified,
            'created_at': reading.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'notes': reading.notes
        })
    
    return jsonify(result)

@app.route('/api/admin/meter-readings/<int:reading_id>/verify', methods=['POST'])
def verify_meter_reading(reading_id):
    """Подтвердить показания счетчика"""
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_id = verify_token(token)
    
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    user = User.query.get(user_id)
    if not user or not user.is_admin:
        return jsonify({'error': 'Admin access required'}), 403
    
    reading = MeterReading.query.get(reading_id)
    if not reading:
        return jsonify({'error': 'Reading not found'}), 404
    
    reading.is_verified = True
    reading.verified_by_name = user.first_name + ' ' + user.last_name # Changed from verified_by to verified_by_name
    reading.verified_at = datetime.datetime.utcnow()
    
    db.session.commit()
    
    return jsonify({
        'id': reading.id,
        'is_verified': reading.is_verified,
        'verified_at': reading.verified_at.strftime('%Y-%m-%d %H:%M:%S')
    })

@app.route('/api/admin/users', methods=['GET'])
def admin_users():
    users = User.query.all()
    
    users_data = []
    for user in users:
        readings_count = MeterReading.query.filter_by(user_id=user.id).count()
        complaints_count = Complaint.query.filter_by(user_id=user.id).count()
        
        users_data.append({
            'id': user.id,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'username': user.username,
            'address': f"{user.street} {user.building} {user.apartment}",
            'readings_count': readings_count,
            'complaints_count': complaints_count
        })
    
    return jsonify({'users': users_data})

@app.route('/api/admin/notifications', methods=['POST'])
def send_notification():
    data = request.json
    
    notification = Notification(
        message=data['message'],
        target=data.get('target', 'all')
    )
    
    db.session.add(notification)
    db.session.commit()
    
    # В реальном приложении здесь была бы отправка через Telegram Bot API
    return jsonify({'success': True})

# API для экспорта данных в Excel
@app.route('/api/admin/export/<export_type>', methods=['GET'])
def export_data(export_type):
    """Экспорт данных в Excel"""
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_id = verify_token(token)
    
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    user = User.query.get(user_id)
    if not user or not user.is_admin:
        return jsonify({'error': 'Admin access required'}), 403
    
    try:
        output = BytesIO()
        
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            if export_type == 'meter_readings':
                # Экспорт показаний счетчиков
                readings = MeterReading.query.all()
                readings_data = []
                
                for reading in readings:
                    user = User.query.get(reading.user_id)
                    readings_data.append({
                        'ID': reading.id,
                        'Пользователь': f"{user.first_name} {user.last_name}",
                        'Telegram ID': user.telegram_id,
                        'Квартира': user.apartment or '',
                        'Дом': user.building or '',
                        'Улица': user.street or '',
                        'Тип счетчика': reading.meter_type,
                        'Показания': reading.value,
                        'Предыдущие показания': reading.previous_value or '',
                        'Расход': reading.consumption or '',
                        'Примечания': reading.notes or '',
                        'Подтверждено': 'Да' if reading.is_verified else 'Нет',
                        'Подтвердил': reading.verified_by_name or '',
                        'Дата подтверждения': reading.verified_at.strftime('%Y-%m-%d %H:%M:%S') if reading.verified_at else '',
                        'Дата создания': reading.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                        'Дата обновления': reading.updated_at.strftime('%Y-%m-%d %H:%M:%S')
                    })
                
                if readings_data:
                    df_readings = pd.DataFrame(readings_data)
                    df_readings.to_excel(writer, sheet_name='Показания счетчиков', index=False)
                    
                    # Автоматическая ширина столбцов
                    worksheet = writer.sheets['Показания счетчиков']
                    for column in worksheet.columns:
                        max_length = 0
                        column_letter = column[0].column_letter
                        for cell in column:
                            try:
                                if len(str(cell.value)) > max_length:
                                    max_length = len(str(cell.value))
                            except:
                                pass
                        adjusted_width = min(max_length + 2, 50)
                        worksheet.column_dimensions[column_letter].width = adjusted_width
            
            elif export_type == 'complaints':
                # Экспорт обращений
                complaints = Complaint.query.all()
                complaints_data = []
                
                for complaint in complaints:
                    user = User.query.get(complaint.user_id)
                    complaints_data.append({
                        'ID': complaint.id,
                        'Пользователь': f"{user.first_name} {user.last_name}",
                        'Telegram ID': user.telegram_id,
                        'Квартира': user.apartment or '',
                        'Дом': user.building or '',
                        'Улица': user.street or '',
                        'Заголовок': complaint.title,
                        'Описание': complaint.description,
                        'Категория': complaint.category,
                        'Приоритет': complaint.priority,
                        'Статус': complaint.status,
                        'Назначено': complaint.assigned_to_name or '',
                        'Ответ': complaint.response or '',
                        'Заметки по решению': complaint.resolution_notes or '',
                        'Ожидаемое завершение': complaint.estimated_completion.strftime('%Y-%m-%d %H:%M:%S') if complaint.estimated_completion else '',
                        'Фактическое завершение': complaint.actual_completion.strftime('%Y-%m-%d %H:%M:%S') if complaint.actual_completion else '',
                        'Дата создания': complaint.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                        'Дата обновления': complaint.updated_at.strftime('%Y-%m-%d %H:%M:%S')
                    })
                
                if complaints_data:
                    df_complaints = pd.DataFrame(complaints_data)
                    df_complaints.to_excel(writer, sheet_name='Обращения', index=False)
                    
                    # Автоматическая ширина столбцов
                    worksheet = writer.sheets['Обращения']
                    for column in worksheet.columns:
                        max_length = 0
                        column_letter = column[0].column_letter
                        for cell in column:
                            try:
                                if len(str(cell.value)) > max_length:
                                    max_length = len(str(cell.value))
                            except:
                                pass
                        adjusted_width = min(max_length + 2, 50)
                        worksheet.column_dimensions[column_letter].width = adjusted_width
            
            elif export_type == 'users':
                # Экспорт пользователей
                users = User.query.all()
                users_data = []
                
                for user in users:
                    users_data.append({
                        'ID': user.id,
                        'Telegram ID': user.telegram_id,
                        'Имя': user.first_name,
                        'Фамилия': user.last_name,
                        'Username': user.username or '',
                        'Квартира': user.apartment or '',
                        'Дом': user.building or '',
                        'Улица': user.street or '',
                        'Телефон': user.phone or '',
                        'Email': user.email or '',
                        'Администратор': 'Да' if user.is_admin else 'Нет',
                        'Активен': 'Да' if user.is_active else 'Нет',
                        'Дата регистрации': user.created_at.strftime('%Y-%m-%d %H:%M:%S')
                    })
                
                if users_data:
                    df_users = pd.DataFrame(users_data)
                    df_users.to_excel(writer, sheet_name='Пользователи', index=False)
                    
                    # Автоматическая ширина столбцов
                    worksheet = writer.sheets['Пользователи']
                    for column in worksheet.columns:
                        max_length = 0
                        column_letter = column[0].column_letter
                        for cell in column:
                            try:
                                if len(str(cell.value)) > max_length:
                                    max_length = len(str(cell.value))
                            except:
                                pass
                        adjusted_width = min(max_length + 2, 50)
                        worksheet.column_dimensions[column_letter].width = adjusted_width
            
            elif export_type == 'all':
                # Экспорт всех данных
                # Показания счетчиков
                readings = MeterReading.query.all()
                readings_data = []
                
                for reading in readings:
                    user = User.query.get(reading.user_id)
                    readings_data.append({
                        'ID': reading.id,
                        'Пользователь': f"{user.first_name} {user.last_name}",
                        'Telegram ID': user.telegram_id,
                        'Квартира': user.apartment or '',
                        'Дом': user.building or '',
                        'Улица': user.street or '',
                        'Тип счетчика': reading.meter_type,
                        'Показания': reading.value,
                        'Предыдущие показания': reading.previous_value or '',
                        'Расход': reading.consumption or '',
                        'Примечания': reading.notes or '',
                        'Подтверждено': 'Да' if reading.is_verified else 'Нет',
                        'Подтвердил': reading.verified_by_name or '',
                        'Дата подтверждения': reading.verified_at.strftime('%Y-%m-%d %H:%M:%S') if reading.verified_at else '',
                        'Дата создания': reading.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                        'Дата обновления': reading.updated_at.strftime('%Y-%m-%d %H:%M:%S')
                    })
                
                if readings_data:
                    df_readings = pd.DataFrame(readings_data)
                    df_readings.to_excel(writer, sheet_name='Показания счетчиков', index=False)
                    
                    # Автоматическая ширина столбцов
                    worksheet = writer.sheets['Показания счетчиков']
                    for column in worksheet.columns:
                        max_length = 0
                        column_letter = column[0].column_letter
                        for cell in column:
                            try:
                                if len(str(cell.value)) > max_length:
                                    max_length = len(str(cell.value))
                            except:
                                pass
                        adjusted_width = min(max_length + 2, 50)
                        worksheet.column_dimensions[column_letter].width = adjusted_width
                
                # Обращения
                complaints = Complaint.query.all()
                complaints_data = []
                
                for complaint in complaints:
                    user = User.query.get(complaint.user_id)
                    complaints_data.append({
                        'ID': complaint.id,
                        'Пользователь': f"{user.first_name} {user.last_name}",
                        'Telegram ID': user.telegram_id,
                        'Квартира': user.apartment or '',
                        'Дом': user.building or '',
                        'Улица': user.street or '',
                        'Заголовок': complaint.title,
                        'Описание': complaint.description,
                        'Категория': complaint.category,
                        'Приоритет': complaint.priority,
                        'Статус': complaint.status,
                        'Назначено': complaint.assigned_to_name or '',
                        'Ответ': complaint.response or '',
                        'Заметки по решению': complaint.resolution_notes or '',
                        'Ожидаемое завершение': complaint.estimated_completion.strftime('%Y-%m-%d %H:%M:%S') if complaint.estimated_completion else '',
                        'Фактическое завершение': complaint.actual_completion.strftime('%Y-%m-%d %H:%M:%S') if complaint.actual_completion else '',
                        'Дата создания': complaint.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                        'Дата обновления': complaint.updated_at.strftime('%Y-%m-%d %H:%M:%S')
                    })
                
                if complaints_data:
                    df_complaints = pd.DataFrame(complaints_data)
                    df_complaints.to_excel(writer, sheet_name='Обращения', index=False)
                    
                    # Автоматическая ширина столбцов
                    worksheet = writer.sheets['Обращения']
                    for column in worksheet.columns:
                        max_length = 0
                        column_letter = column[0].column_letter
                        for cell in column:
                            try:
                                if len(str(cell.value)) > max_length:
                                    max_length = len(str(cell.value))
                            except:
                                pass
                        adjusted_width = min(max_length + 2, 50)
                        worksheet.column_dimensions[column_letter].width = adjusted_width
                
                # Пользователи
                users = User.query.all()
                users_data = []
                
                for user in users:
                    users_data.append({
                        'ID': user.id,
                        'Telegram ID': user.telegram_id,
                        'Имя': user.first_name,
                        'Фамилия': user.last_name,
                        'Username': user.username or '',
                        'Квартира': user.apartment or '',
                        'Дом': user.building or '',
                        'Улица': user.street or '',
                        'Телефон': user.phone or '',
                        'Email': user.email or '',
                        'Администратор': 'Да' if user.is_admin else 'Нет',
                        'Активен': 'Да' if user.is_active else 'Нет',
                        'Дата регистрации': user.created_at.strftime('%Y-%m-%d %H:%M:%S')
                    })
                
                if users_data:
                    df_users = pd.DataFrame(users_data)
                    df_users.to_excel(writer, sheet_name='Пользователи', index=False)
                    
                    # Автоматическая ширина столбцов
                    worksheet = writer.sheets['Пользователи']
                    for column in worksheet.columns:
                        max_length = 0
                        column_letter = column[0].column_letter
                        for cell in column:
                            try:
                                if len(str(cell.value)) > max_length:
                                    max_length = len(str(cell.value))
                            except:
                                pass
                        adjusted_width = min(max_length + 2, 50)
                        worksheet.column_dimensions[column_letter].width = adjusted_width
        
        output.seek(0)
        
        return send_file(
            output,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name=f'uk_mini_app_{export_type}_{datetime.datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx'
        )
    
    except Exception as e:
        print(f"Error exporting data: {e}")
        return jsonify({'error': 'Export failed'}), 500
    
    return jsonify({'error': 'Invalid export type'}), 400

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8000) 