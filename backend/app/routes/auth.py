from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from ..models.user import User
from ..models.patient import Patient
from ..models.doctor import Doctor
import json
import re

auth_bp = Blueprint('auth', __name__)

# List of valid specialties
VALID_SPECIALTIES = [
    'General Practice',
    'Cardiology',
    'Dermatology',
    'Neurology',
    'Orthopedics',
    'Pediatrics',
    'Psychiatry',
    'Ophthalmology',
    'Gynecology',
    'Urology',
    'Oncology',
    'Endocrinology',
    'Gastroenterology',
    'Pulmonology',
    'Nephrology',
    'Rheumatology',
    'Emergency Medicine'
]


def validate_password(password):
    """Validate password strength."""
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    if not re.search(r'[A-Za-z]', password):
        return False, "Password must contain at least one letter"
    if not re.search(r'\d', password):
        return False, "Password must contain at least one number"
    return True, None


def validate_email(email):
    """Validate email format."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = User.find_by_email(email)
    if not user or not User.check_password(user, password):
        return jsonify({'error': 'Invalid credentials'}), 401

    # Create identity as JSON string containing user info
    identity = json.dumps({'id': str(user['_id']), 'role': user['role']})
    access_token = create_access_token(identity=identity)
    return jsonify({
        'access_token': access_token, 
        'role': user['role'], 
        'id': str(user['_id'])
    })


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    role = data.get('role', 'patient')
    
    # Validate email
    if not email or not validate_email(email):
        return jsonify({'error': 'Invalid email format'}), 400
    
    # Validate password
    is_valid, error_msg = validate_password(password)
    if not is_valid:
        return jsonify({'error': error_msg}), 400
    
    # Check if user already exists
    if User.find_by_email(email):
        return jsonify({'error': 'User already exists'}), 400
    
    # Validate role
    if role not in ['patient', 'doctor']:
        return jsonify({'error': 'Invalid role'}), 400
    
    # Create user
    user = User.create(email, password, role)
    
    # If patient, create patient profile
    if role == 'patient':
        first_name = data.get('firstName', '').strip()
        last_name = data.get('lastName', '').strip()
        
        if not first_name or not last_name:
            return jsonify({'error': 'First name and last name are required'}), 400
        
        Patient.create(
            user_id=user['_id'],
            email=email,
            first_name=first_name,
            last_name=last_name,
            phone=data.get('phone', ''),
            address=data.get('address', '')
        )
    
    # If doctor, create doctor profile
    elif role == 'doctor':
        name = data.get('name', '').strip()
        specialty = data.get('specialty', '').strip()
        location = data.get('location', '').strip()
        availability = data.get('availability', [])
        image = data.get('image', '')
        
        # Validate required doctor fields
        if not name:
            return jsonify({'error': 'Doctor name is required'}), 400
        if not specialty:
            return jsonify({'error': 'Specialty is required'}), 400
        if specialty not in VALID_SPECIALTIES:
            return jsonify({'error': f'Invalid specialty. Must be one of: {", ".join(VALID_SPECIALTIES)}'}), 400
        if not location:
            return jsonify({'error': 'Location is required'}), 400
        
        # Create doctor profile
        Doctor.create(
            user_id=user['_id'],
            name=name,
            specialty=specialty,
            location=location,
            availability=availability if isinstance(availability, list) else [],
            rating=0,
            image=image or 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200'
        )
    
    return jsonify({'message': 'User registered successfully', 'id': str(user['_id'])}), 201


@auth_bp.route('/specialties', methods=['GET'])
def get_specialties():
    """Get list of valid specialties."""
    return jsonify({'specialties': VALID_SPECIALTIES})

