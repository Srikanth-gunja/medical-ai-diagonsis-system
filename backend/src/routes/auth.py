from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token
from ..models.user import User
from ..models.patient import Patient
from ..models.doctor import Doctor
from ..models.notification import Notification
from ..database import get_db
import json
import re
import time
import logging
from collections import defaultdict, deque

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

_RATE_LIMIT_BUCKETS = defaultdict(deque)
logger = logging.getLogger(__name__)


def _get_client_id():
    # Only trust forwarded headers behind a trusted reverse proxy.
    if current_app.config.get("TRUST_PROXY_HEADERS", False):
        forwarded = request.headers.get("X-Forwarded-For", "")
        if forwarded:
            return forwarded.split(",")[0].strip()
    return request.remote_addr or "unknown"


def _prune_rate_limit_buckets(now: float, window_seconds: int, max_buckets: int) -> None:
    stale_threshold = max(window_seconds * 5, 300)
    for key in list(_RATE_LIMIT_BUCKETS.keys()):
        bucket = _RATE_LIMIT_BUCKETS.get(key)
        if not bucket:
            _RATE_LIMIT_BUCKETS.pop(key, None)
            continue
        while bucket and now - bucket[0] > window_seconds:
            bucket.popleft()
        if not bucket or now - bucket[-1] > stale_threshold:
            _RATE_LIMIT_BUCKETS.pop(key, None)

    if len(_RATE_LIMIT_BUCKETS) <= max_buckets:
        return

    overflow = len(_RATE_LIMIT_BUCKETS) - max_buckets
    oldest = sorted(
        (
            (key, bucket[-1] if bucket else 0.0)
            for key, bucket in _RATE_LIMIT_BUCKETS.items()
        ),
        key=lambda item: item[1],
    )
    for key, _ in oldest[:overflow]:
        _RATE_LIMIT_BUCKETS.pop(key, None)


def _is_rate_limited(
    bucket_key: str, limit: int, window_seconds: int, max_buckets: int
) -> bool:
    if current_app.testing:
        return False
    now = time.time()
    _prune_rate_limit_buckets(now, window_seconds, max_buckets)
    bucket = _RATE_LIMIT_BUCKETS[bucket_key]
    while bucket and now - bucket[0] > window_seconds:
        bucket.popleft()
    if len(bucket) >= limit:
        return True
    bucket.append(now)
    return False


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
    client_id = _get_client_id()
    window = current_app.config.get("AUTH_RATE_LIMIT_WINDOW_SECONDS", 60)
    limit = current_app.config.get("AUTH_RATE_LIMIT_MAX_LOGIN", 20)
    max_buckets = current_app.config.get("AUTH_RATE_LIMIT_MAX_BUCKETS", 5000)
    if _is_rate_limited(f"login:{client_id}", limit, window, max_buckets):
        return jsonify({'error': 'Too many login attempts. Please try again later.'}), 429

    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password')

    user = User.find_by_email(email)
    if not user or not User.check_password(user, password):
        return jsonify({'error': 'Invalid credentials'}), 401

    # Check if doctor is verified
    if user['role'] == 'doctor':
        doctor = Doctor.find_by_user_id(user['_id'])
        if not doctor:
            return jsonify({
                'error': 'pending_verification',
                'message': 'Your doctor profile is still being provisioned. Please try again shortly.'
            }), 403
        if doctor and not doctor.get('verified', False):
            verification_status = doctor.get('verification_status', 'pending')
            if verification_status == 'pending':
                return jsonify({
                    'error': 'pending_verification',
                    'message': 'Your account is awaiting admin verification. Please check back later.'
                }), 403
            elif verification_status == 'rejected':
                return jsonify({
                    'error': 'verification_rejected',
                    'message': 'Your doctor verification was rejected. Please contact support.'
                }), 403

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
    client_id = _get_client_id()
    window = current_app.config.get("AUTH_RATE_LIMIT_WINDOW_SECONDS", 60)
    limit = current_app.config.get("AUTH_RATE_LIMIT_MAX_REGISTER", 10)
    max_buckets = current_app.config.get("AUTH_RATE_LIMIT_MAX_BUCKETS", 5000)
    if _is_rate_limited(f"register:{client_id}", limit, window, max_buckets):
        return jsonify({'error': 'Too many registration attempts. Please try again later.'}), 429

    data = request.get_json() or {}
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
    
    # Validate role - admin cannot be registered via this endpoint
    if role not in ['patient', 'doctor']:
        return jsonify({'error': 'Invalid role'}), 400

    # Validate profile payload BEFORE creating the auth user to keep data consistent.
    first_name = data.get('firstName', '').strip()
    last_name = data.get('lastName', '').strip()
    name = data.get('name', '').strip()
    specialty = data.get('specialty', '').strip()
    location = data.get('location', '').strip()
    image = data.get('image', '')

    if role == 'patient':
        if not first_name or not last_name:
            return jsonify({'error': 'First name and last name are required'}), 400
    else:
        if not name:
            return jsonify({'error': 'Doctor name is required'}), 400
        if not specialty:
            return jsonify({'error': 'Specialty is required'}), 400
        if specialty not in VALID_SPECIALTIES:
            return jsonify({'error': f'Invalid specialty. Must be one of: {", ".join(VALID_SPECIALTIES)}'}), 400
        if not location:
            return jsonify({'error': 'Location is required'}), 400

    # Check if user already exists
    if User.find_by_email(email):
        return jsonify({'error': 'User already exists'}), 400

    user = None
    try:
        # Create user and profile as one logical unit; roll back user on profile failure.
        user = User.create(email, password, role)

        if role == 'patient':
            Patient.create(
                user_id=user['_id'],
                email=email,
                first_name=first_name,
                last_name=last_name,
                phone=data.get('phone', ''),
                address=data.get('address', ''),
                date_of_birth=data.get('dateOfBirth', ''),
                gender=data.get('gender', ''),
                blood_group=data.get('bloodGroup', ''),
                city=data.get('city', ''),
                state=data.get('state', ''),
                zip_code=data.get('zipCode', ''),
                emergency_contact_name=data.get('emergencyContactName', ''),
                emergency_contact_phone=data.get('emergencyContactPhone', ''),
                allergies=data.get('allergies', ''),
                current_medications=data.get('currentMedications', ''),
                chronic_conditions=data.get('chronicConditions', []),
                previous_surgeries=data.get('previousSurgeries', ''),
                insurance_provider=data.get('insuranceProvider', ''),
                insurance_policy_number=data.get('insurancePolicyNumber', '')
            )
            return jsonify({'message': 'Registration successful', 'id': str(user['_id'])}), 201

        # Doctor profile (unverified by default)
        Doctor.create(
            user_id=user['_id'],
            name=name,
            specialty=specialty,
            location=location,
            availability=[],
            rating=0,
            image=image or '/assets/images/doctor_profile.png',
            verified=False
        )

        # Create notification for all admin users
        db = get_db()
        admin_users = list(db.users.find({'role': 'admin'}))
        for admin in admin_users:
            Notification.create(
                user_id=admin['_id'],
                title='New Doctor Registration',
                message=f'{name} ({specialty}) has registered and is awaiting verification.',
                notification_type='info',
                link='/admin-dashboard'
            )

        return jsonify({
            'message': 'Registration successful. Your account is pending verification by an administrator.',
            'id': str(user['_id']),
            'pending_verification': True
        }), 201
    except Exception:
        logger.exception("Failed to register user")
        if user and user.get('_id'):
            try:
                User.delete(user['_id'])
            except Exception:
                logger.exception("Failed to rollback user after registration failure")
        return jsonify({'error': 'Registration failed. Please try again.'}), 500


@auth_bp.route('/specialties', methods=['GET'])
def get_specialties():
    """Get list of valid specialties."""
    return jsonify({'specialties': VALID_SPECIALTIES})
