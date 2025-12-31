from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from ..models.schedule import Schedule
from ..models.doctor import Doctor
import json

schedules_bp = Blueprint('schedules', __name__)


def get_current_user():
    """Parse JWT identity and return user dict."""
    identity = get_jwt_identity()
    if isinstance(identity, str):
        return json.loads(identity)
    return identity


@schedules_bp.route('/', methods=['GET'])
@jwt_required()
def get_my_schedule():
    """Get current doctor's schedule."""
    current_user = get_current_user()
    
    if current_user['role'] != 'doctor':
        return jsonify({'error': 'Only doctors can access this endpoint'}), 403
    
    doctor = Doctor.find_by_user_id(current_user['id'])
    if not doctor:
        return jsonify({'error': 'Doctor profile not found'}), 404
    
    schedule = Schedule.find_by_doctor_id(doctor['_id'])
    
    if not schedule:
        # Return default schedule
        return jsonify({
            'doctorId': str(doctor['_id']),
            'weeklySchedule': {
                'monday': {'start': '09:00', 'end': '17:00', 'enabled': True},
                'tuesday': {'start': '09:00', 'end': '17:00', 'enabled': True},
                'wednesday': {'start': '09:00', 'end': '17:00', 'enabled': True},
                'thursday': {'start': '09:00', 'end': '17:00', 'enabled': True},
                'friday': {'start': '09:00', 'end': '17:00', 'enabled': True},
                'saturday': {'start': '09:00', 'end': '13:00', 'enabled': False},
                'sunday': {'start': '09:00', 'end': '13:00', 'enabled': False}
            },
            'blockedDates': [],
            'slotDuration': 30
        })
    
    return jsonify(Schedule.to_dict(schedule))


@schedules_bp.route('/', methods=['PUT'])
@jwt_required()
def update_schedule():
    """Update doctor's schedule."""
    current_user = get_current_user()
    
    if current_user['role'] != 'doctor':
        return jsonify({'error': 'Only doctors can update schedules'}), 403
    
    doctor = Doctor.find_by_user_id(current_user['id'])
    if not doctor:
        return jsonify({'error': 'Doctor profile not found'}), 404
    
    data = request.get_json()
    weekly_schedule = data.get('weeklySchedule', {})
    blocked_dates = data.get('blockedDates', [])
    slot_duration = data.get('slotDuration', 30)
    
    # Validate slot duration
    if slot_duration not in [15, 30, 45, 60]:
        return jsonify({'error': 'Slot duration must be 15, 30, 45, or 60 minutes'}), 400
    
    schedule = Schedule.create_or_update(
        doctor_id=doctor['_id'],
        weekly_schedule=weekly_schedule,
        blocked_dates=blocked_dates,
        slot_duration=slot_duration
    )
    
    return jsonify(Schedule.to_dict(schedule))


@schedules_bp.route('/doctor/<doctor_id>/slots', methods=['GET'])
def get_available_slots(doctor_id):
    """Get available time slots for a doctor on a specific date (public endpoint)."""
    date = request.args.get('date')
    
    if not date:
        return jsonify({'error': 'Date parameter is required'}), 400
    
    # Verify doctor exists
    doctor = Doctor.find_by_id(doctor_id)
    if not doctor:
        return jsonify({'error': 'Doctor not found'}), 404
    
    slots = Schedule.get_available_slots(doctor_id, date)
    
    return jsonify({
        'doctorId': doctor_id,
        'date': date,
        'slots': slots
    })


@schedules_bp.route('/blocked-dates', methods=['POST'])
@jwt_required()
def add_blocked_date():
    """Add a blocked date for the doctor."""
    current_user = get_current_user()
    
    if current_user['role'] != 'doctor':
        return jsonify({'error': 'Only doctors can block dates'}), 403
    
    doctor = Doctor.find_by_user_id(current_user['id'])
    if not doctor:
        return jsonify({'error': 'Doctor profile not found'}), 404
    
    data = request.get_json()
    date = data.get('date')
    
    if not date:
        return jsonify({'error': 'Date is required'}), 400
    
    schedule = Schedule.find_by_doctor_id(doctor['_id'])
    
    if schedule:
        blocked_dates = schedule.get('blocked_dates', [])
        if date not in blocked_dates:
            blocked_dates.append(date)
        Schedule.create_or_update(
            doctor_id=doctor['_id'],
            weekly_schedule=schedule.get('weekly_schedule', {}),
            blocked_dates=blocked_dates,
            slot_duration=schedule.get('slot_duration', 30)
        )
    else:
        Schedule.create_or_update(
            doctor_id=doctor['_id'],
            weekly_schedule={},
            blocked_dates=[date],
            slot_duration=30
        )
    
    return jsonify({'message': 'Date blocked successfully'})


@schedules_bp.route('/blocked-dates', methods=['DELETE'])
@jwt_required()
def remove_blocked_date():
    """Remove a blocked date for the doctor."""
    current_user = get_current_user()
    
    if current_user['role'] != 'doctor':
        return jsonify({'error': 'Only doctors can unblock dates'}), 403
    
    doctor = Doctor.find_by_user_id(current_user['id'])
    if not doctor:
        return jsonify({'error': 'Doctor profile not found'}), 404
    
    data = request.get_json()
    date = data.get('date')
    
    if not date:
        return jsonify({'error': 'Date is required'}), 400
    
    schedule = Schedule.find_by_doctor_id(doctor['_id'])
    
    if schedule:
        blocked_dates = schedule.get('blocked_dates', [])
        if date in blocked_dates:
            blocked_dates.remove(date)
        Schedule.create_or_update(
            doctor_id=doctor['_id'],
            weekly_schedule=schedule.get('weekly_schedule', {}),
            blocked_dates=blocked_dates,
            slot_duration=schedule.get('slot_duration', 30)
        )
    
    return jsonify({'message': 'Date unblocked successfully'})
