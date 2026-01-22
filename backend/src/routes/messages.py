from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from ..models.message import Message
from ..models.appointment import Appointment
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
    appt_date = appointment['date']  # Format: "YYYY-MM-DD"
    appt_time = appointment['time']  # Format: "HH:MM AM/PM" or "H:MM AM/PM"
    
    # Parse appointment datetime
    try:
        time_str = appt_time.upper().strip()
        appt_datetime = datetime.strptime(f"{appt_date} {time_str}", "%Y-%m-%d %I:%M %p")
    except ValueError:
        try:
            # Fallback: try 24-hour format
            appt_datetime = datetime.strptime(f"{appt_date} {appt_time}", "%Y-%m-%d %H:%M")
        except ValueError:
            return False, "Invalid appointment time format"
    
    now = datetime.now()
    end_time = appt_datetime + timedelta(minutes=30)  # 30-min appointment window
    
    if now < appt_datetime:
        return False, f"Chat available from {appt_datetime.strftime('%Y-%m-%d %I:%M %p')}"
    elif now > end_time:
        return False, "Appointment time has ended"
    
    return True, ""

@messages_bp.route('/<appointment_id>', methods=['GET'])
@jwt_required()
def get_messages(appointment_id):
    """Get all messages for an appointment."""
    current_user = get_current_user()
    
    # Verify user has access to this appointment
    appointment = Appointment.find_by_id(appointment_id)
    if not appointment:
        return jsonify({'error': 'Appointment not found'}), 404
    
    # Check if user is part of this appointment
    user_id = current_user['id']
    patient_id = str(appointment.get('patient_id', ''))
    doctor_id = str(appointment.get('doctor_id', ''))
    
    if user_id != patient_id and current_user['role'] != 'doctor':
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
    data = request.get_json()
    
    if not data.get('content'):
        return jsonify({'error': 'Message content is required'}), 400
    
    # Verify appointment exists
    appointment = Appointment.find_by_id(appointment_id)
    if not appointment:
        return jsonify({'error': 'Appointment not found'}), 404
    
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
    
    return jsonify(Message.to_dict(message)), 201

@messages_bp.route('/<appointment_id>/unread', methods=['GET'])
@jwt_required()
def get_unread_count(appointment_id):
    """Get unread message count."""
    current_user = get_current_user()
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
