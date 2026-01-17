from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from ..models.doctor import Doctor
from ..models.patient import Patient
from ..models.user import User
from ..database import get_db
import json

admin_bp = Blueprint('admin', __name__)


def get_current_user():
    """Parse JWT identity and return user dict."""
    identity = get_jwt_identity()
    if isinstance(identity, str):
        return json.loads(identity)
    return identity


def require_admin(func):
    """Decorator to require admin role."""
    from functools import wraps
    
    @wraps(func)
    def wrapper(*args, **kwargs):
        current_user = get_current_user()
        if current_user.get('role') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        return func(*args, **kwargs)
    return wrapper


@admin_bp.route('/stats', methods=['GET'])
@jwt_required()
@require_admin
def get_stats():
    """Get admin dashboard statistics."""
    db = get_db()
    
    # Count users by role
    total_patients = db.patients.count_documents({})
    total_doctors = db.doctors.count_documents({})
    verified_doctors = db.doctors.count_documents({'verified': True})
    pending_doctors = db.doctors.count_documents({'verification_status': 'pending'})
    rejected_doctors = db.doctors.count_documents({'verification_status': 'rejected'})
    
    # Count appointments
    total_appointments = db.appointments.count_documents({})
    completed_appointments = db.appointments.count_documents({'status': 'completed'})
    pending_appointments = db.appointments.count_documents({'status': 'pending'})
    
    # Count other entities
    total_prescriptions = db.prescriptions.count_documents({})
    total_ratings = db.ratings.count_documents({})
    
    return jsonify({
        'patients': {
            'total': total_patients
        },
        'doctors': {
            'total': total_doctors,
            'verified': verified_doctors,
            'pending': pending_doctors,
            'rejected': rejected_doctors
        },
        'appointments': {
            'total': total_appointments,
            'completed': completed_appointments,
            'pending': pending_appointments
        },
        'prescriptions': total_prescriptions,
        'ratings': total_ratings
    })


@admin_bp.route('/doctors', methods=['GET'])
@jwt_required()
@require_admin
def get_doctors():
    """Get all doctors with optional status filter."""
    status = request.args.get('status')  # pending, verified, rejected, or all
    
    if status and status != 'all':
        doctors = Doctor.find_by_verification_status(status)
    else:
        doctors = Doctor.find_all(verified_only=False)
    
    # Get user email for each doctor
    result = []
    for doctor in doctors:
        doctor_dict = Doctor.to_dict(doctor)
        user = User.find_by_id(doctor.get('user_id'))
        if user:
            doctor_dict['email'] = user.get('email', '')
        result.append(doctor_dict)
    
    return jsonify({'doctors': result})


@admin_bp.route('/patients', methods=['GET'])
@jwt_required()
@require_admin
def get_patients():
    """Get all patients."""
    db = get_db()
    patients = list(db.patients.find())
    
    result = []
    for patient in patients:
        patient_dict = Patient.to_dict(patient)
        result.append(patient_dict)
    
    return jsonify({'patients': result})


@admin_bp.route('/doctors/<doctor_id>/verify', methods=['POST'])
@jwt_required()
@require_admin
def verify_doctor(doctor_id):
    """Verify a doctor."""
    doctor = Doctor.find_by_id(doctor_id)
    if not doctor:
        return jsonify({'error': 'Doctor not found'}), 404
    
    Doctor.verify(doctor_id)
    
    return jsonify({
        'message': 'Doctor verified successfully',
        'doctor': Doctor.to_dict(Doctor.find_by_id(doctor_id))
    })


@admin_bp.route('/doctors/<doctor_id>/reject', methods=['POST'])
@jwt_required()
@require_admin
def reject_doctor(doctor_id):
    """Reject a doctor verification."""
    doctor = Doctor.find_by_id(doctor_id)
    if not doctor:
        return jsonify({'error': 'Doctor not found'}), 404
    
    reason = request.get_json().get('reason', '') if request.get_json() else ''
    
    Doctor.reject(doctor_id)
    
    return jsonify({
        'message': 'Doctor verification rejected',
        'doctor': Doctor.to_dict(Doctor.find_by_id(doctor_id))
    })


@admin_bp.route('/users/<user_id>', methods=['DELETE'])
@jwt_required()
@require_admin
def delete_user(user_id):
    """Delete a user and their profile."""
    user = User.find_by_id(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Prevent deleting admin
    if user.get('role') == 'admin':
        return jsonify({'error': 'Cannot delete admin user'}), 403
    
    # Delete associated profile
    if user['role'] == 'patient':
        patient = Patient.find_by_user_id(user_id)
        if patient:
            db = get_db()
            db.patients.delete_one({'_id': patient['_id']})
    elif user['role'] == 'doctor':
        doctor = Doctor.find_by_user_id(user_id)
        if doctor:
            Doctor.delete(doctor['_id'])
    
    # Delete user
    User.delete(user_id)
    
    return jsonify({'message': 'User deleted successfully'})


@admin_bp.route('/profile-requests', methods=['GET'])
@jwt_required()
@require_admin
def get_profile_update_requests():
    """Get all doctors with pending profile updates."""
    doctors = Doctor.find_with_pending_updates()
    
    result = []
    for doctor in doctors:
        doctor_dict = Doctor.to_dict(doctor)
        user = User.find_by_id(doctor.get('user_id'))
        if user:
            doctor_dict['email'] = user.get('email', '')
        result.append(doctor_dict)
    
    return jsonify({'doctors': result})


@admin_bp.route('/doctors/<doctor_id>/approve-profile', methods=['POST'])
@jwt_required()
@require_admin
def approve_doctor_profile_update(doctor_id):
    """Approve pending profile update for a doctor."""
    doctor = Doctor.find_by_id(doctor_id)
    if not doctor:
        return jsonify({'error': 'Doctor not found'}), 404
    
    if not doctor.get('pending_profile_update'):
        return jsonify({'error': 'No pending profile update found'}), 400
    
    updated = Doctor.approve_profile_update(doctor_id)
    
    return jsonify({
        'message': 'Profile update approved and applied',
        'doctor': Doctor.to_dict(updated) if updated else None
    })


@admin_bp.route('/doctors/<doctor_id>/reject-profile', methods=['POST'])
@jwt_required()
@require_admin
def reject_doctor_profile_update(doctor_id):
    """Reject pending profile update for a doctor."""
    doctor = Doctor.find_by_id(doctor_id)
    if not doctor:
        return jsonify({'error': 'Doctor not found'}), 404
    
    if not doctor.get('pending_profile_update'):
        return jsonify({'error': 'No pending profile update found'}), 400
    
    updated = Doctor.reject_profile_update(doctor_id)
    
    return jsonify({
        'message': 'Profile update rejected',
        'doctor': Doctor.to_dict(updated) if updated else None
    })
