from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from ..models.rating import Rating
from ..models.appointment import Appointment
from ..models.doctor import Doctor
from ..models.patient import Patient
from ..models.notification import Notification
import json

ratings_bp = Blueprint('ratings', __name__)


def get_current_user():
    """Parse JWT identity and return user dict."""
    identity = get_jwt_identity()
    if isinstance(identity, str):
        return json.loads(identity)
    return identity


@ratings_bp.route('/', methods=['POST'])
@jwt_required()
def create_rating():
    """Submit a rating for a doctor after completed appointment."""
    current_user = get_current_user()
    
    # Only patients can rate
    if current_user['role'] != 'patient':
        return jsonify({'error': 'Only patients can rate doctors'}), 403
    
    data = request.get_json()
    appointment_id = data.get('appointmentId')
    score = data.get('score')
    comment = data.get('comment', '')
    
    # Validate required fields
    if not appointment_id or not score:
        return jsonify({'error': 'Appointment ID and score are required'}), 400
    
    # Validate score range
    try:
        score = int(score)
        if score < 1 or score > 5:
            return jsonify({'error': 'Score must be between 1 and 5'}), 400
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid score value'}), 400
    
    # Get appointment and verify it belongs to this patient
    appointment = Appointment.find_by_id(appointment_id)
    if not appointment:
        return jsonify({'error': 'Appointment not found'}), 404
    
    if str(appointment['patient_id']) != current_user['id']:
        return jsonify({'error': 'You can only rate your own appointments'}), 403
    
    # Verify appointment is completed
    if appointment.get('status') != 'completed':
        return jsonify({'error': 'You can only rate completed appointments'}), 400
    
    # Check if already rated
    if Rating.has_rated(current_user['id'], appointment_id):
        return jsonify({'error': 'You have already rated this appointment'}), 400
    
    # Create the rating
    try:
        rating = Rating.create(
            patient_id=current_user['id'],
            doctor_id=appointment['doctor_id'],
            appointment_id=appointment_id,
            score=score,
            comment=comment
        )
        
        # Mark appointment as rated
        Appointment.update(appointment_id, {'rated': True})
        
        # Update doctor's average rating
        rating_stats = Rating.calculate_average(appointment['doctor_id'])
        Doctor.update(appointment['doctor_id'], {
            'rating': rating_stats['average'],
            'rating_count': rating_stats['count']
        })
        
        # Create notification for doctor
        doctor = Doctor.find_by_id(appointment['doctor_id'])
        if doctor:
            patient = Patient.find_by_user_id(current_user['id'])
            patient_name = f"{patient.get('firstName', '')} {patient.get('lastName', '')}" if patient else 'A patient'
            Notification.create(
                user_id=doctor['user_id'],
                title='New Review Received',
                message=f"{patient_name} has left you a {score}-star review.",
                notification_type='info',
                link='/doctor-dashboard'
            )
        
        return jsonify({
            'message': 'Rating submitted successfully',
            'rating': Rating.to_dict(rating)
        }), 201
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400


@ratings_bp.route('/doctor/<doctor_id>', methods=['GET'])
def get_doctor_ratings(doctor_id):
    """Get all ratings for a doctor (public endpoint)."""
    try:
        # Verify doctor exists
        doctor = Doctor.find_by_id(doctor_id)
        if not doctor:
            return jsonify({'error': 'Doctor not found'}), 404
        
        ratings = Rating.find_by_doctor_id(doctor_id)
        stats = Rating.calculate_average(doctor_id)
        
        return jsonify({
            'ratings': [Rating.to_dict(r) for r in ratings],
            'average': stats['average'],
            'count': stats['count']
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@ratings_bp.route('/check/<appointment_id>', methods=['GET'])
@jwt_required()
def check_rating(appointment_id):
    """Check if user has already rated an appointment."""
    current_user = get_current_user()
    
    has_rated = Rating.has_rated(current_user['id'], appointment_id)
    
    return jsonify({
        'hasRated': has_rated
    })


@ratings_bp.route('/my-reviews', methods=['GET'])
@jwt_required()
def get_my_reviews():
    """Get reviews for the logged-in doctor."""
    current_user = get_current_user()
    
    if current_user['role'] != 'doctor':
        return jsonify({'error': 'Only doctors can access this endpoint'}), 403
    
    doctor = Doctor.find_by_user_id(current_user['id'])
    if not doctor:
        return jsonify({'error': 'Doctor profile not found'}), 404
    
    ratings = Rating.find_by_doctor_id(doctor['_id'])
    stats = Rating.calculate_average(doctor['_id'])
    
    # Enrich with patient names
    result = []
    for r in ratings:
        rating_dict = Rating.to_dict(r)
        patient = Patient.find_by_user_id(str(r.get('patient_id', '')))
        if patient:
            rating_dict['patientName'] = f"{patient.get('firstName', '')} {patient.get('lastName', '')}"
        else:
            rating_dict['patientName'] = 'Anonymous'
        result.append(rating_dict)
    
    return jsonify({
        'reviews': result,
        'average': stats['average'],
        'count': stats['count']
    })

