from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models.message import Message
from ..models.appointment import Appointment
from ..models.doctor import Doctor
from ..realtime import publish_event
from ..utils.appointment_time import is_in_appointment_window
import json

messages_bp = Blueprint('messages', __name__)

def get_current_user():
    """Parse JWT identity and return user dict."""
    identity = get_jwt_identity()
    if isinstance(identity, str):
        return json.loads(identity)
    return identity

def is_during_appointment_time(appointment):
    """Check if current time is within the appointment time window.

    Returns:
        tuple: (is_valid: bool, error_message: str)
    """
    return is_in_appointment_window(appointment)


def verify_appointment_access(current_user, appointment):
    user_id = current_user['id']
    role = current_user.get('role')
    patient_id = str(appointment.get('patient_id', ''))
    doctor_id = appointment.get('doctor_id')

    if role == 'patient':
        return user_id == patient_id
    if role == 'doctor':
        doctor = Doctor.find_by_user_id(user_id)
        if not doctor:
            return False
        return str(doctor.get('_id')) == str(doctor_id)
    return False

@messages_bp.route('/<appointment_id>', methods=['GET'])
@jwt_required()
def get_messages(appointment_id):
    """Get all messages for an appointment."""
    current_user = get_current_user()
    
    # Verify user has access to this appointment
    appointment = Appointment.find_by_id(appointment_id)
    if not appointment:
        return jsonify({'error': 'Appointment not found'}), 404
    
    if not verify_appointment_access(current_user, appointment):
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Mark messages as read
    Message.mark_as_read(appointment_id, current_user['role'])
    
    messages = Message.find_by_appointment(appointment_id)
    return jsonify([Message.to_dict(msg) for msg in messages])

@messages_bp.route('/<appointment_id>', methods=['POST'])
@jwt_required()
def send_message(appointment_id):
    """Send a new message."""
    current_user = get_current_user()
    data = request.get_json(silent=True) or {}
    
    if not data.get('content'):
        return jsonify({'error': 'Message content is required'}), 400
    
    # Verify appointment exists
    appointment = Appointment.find_by_id(appointment_id)
    if not appointment:
        return jsonify({'error': 'Appointment not found'}), 404

    if not verify_appointment_access(current_user, appointment):
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Check appointment status - only confirmed appointments allow chat
    if appointment['status'] != 'confirmed':
        return jsonify({'error': 'Chat is only available for confirmed appointments'}), 403
    
    # Check time window - only allow chat during appointment time
    is_in_window, time_message = is_during_appointment_time(appointment)
    if not is_in_window:
        return jsonify({'error': time_message}), 403
    
    message = Message.create(
        appointment_id=appointment_id,
        sender_id=current_user['id'],
        sender_role=current_user['role'],
        content=data['content']
    )

    target_user_ids = []
    patient_id = str(appointment.get('patient_id', ''))
    if patient_id:
        target_user_ids.append(patient_id)
    doctor_user_id = None
    doctor_id = appointment.get('doctor_id')
    if doctor_id:
        doctor = Doctor.find_by_id(doctor_id)
        if doctor and doctor.get('user_id'):
            doctor_user_id = str(doctor['user_id'])
    if doctor_user_id:
        target_user_ids.append(doctor_user_id)
    if target_user_ids:
        publish_event(target_user_ids, 'messages.updated', {'appointmentId': appointment_id})

    return jsonify(Message.to_dict(message)), 201

@messages_bp.route('/<appointment_id>/unread', methods=['GET'])
@jwt_required()
def get_unread_count(appointment_id):
    """Get unread message count."""
    current_user = get_current_user()
    appointment = Appointment.find_by_id(appointment_id)
    if not appointment:
        return jsonify({'error': 'Appointment not found'}), 404
    if not verify_appointment_access(current_user, appointment):
        return jsonify({'error': 'Unauthorized'}), 403
    count = Message.get_unread_count(appointment_id, current_user['role'])
    return jsonify({'unread': count})

@messages_bp.route('/<appointment_id>/status', methods=['GET'])
@jwt_required()
def get_chat_status(appointment_id):
    """Get chat availability status."""
    current_user = get_current_user()
    
    appointment = Appointment.find_by_id(appointment_id)
    if not appointment:
        return jsonify({'error': 'Appointment not found'}), 404

    if not verify_appointment_access(current_user, appointment):
        return jsonify({'error': 'Unauthorized'}), 403
    
    status = appointment.get('status', 'pending')
    
    # Check time window
    is_in_window, time_message = is_during_appointment_time(appointment)
    
    # Chat is only enabled when appointment is confirmed AND we're in the time window
    can_chat = status == 'confirmed' and is_in_window
    
    return jsonify({
        'canChat': can_chat,
        'appointmentStatus': status,
        'isInTimeWindow': is_in_window,
        'timeMessage': time_message if not is_in_window else 'Chat available',
        'doctorName': appointment.get('doctor_name', 'Doctor'),
        'appointmentDate': appointment.get('date'),
        'appointmentTime': appointment.get('time')
    })
