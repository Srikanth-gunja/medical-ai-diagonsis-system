from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from ..models.doctor import Doctor
from ..models.patient import Patient
from ..models.appointment import Appointment
from ..models.rating import Rating
from ..models.prescription import Prescription
from ..database import get_db, APPOINTMENTS_COLLECTION
import json
from datetime import datetime, timedelta

analytics_bp = Blueprint('analytics', __name__)


def get_current_user():
    """Parse JWT identity and return user dict."""
    identity = get_jwt_identity()
    if isinstance(identity, str):
        return json.loads(identity)
    return identity


@analytics_bp.route('/doctor', methods=['GET'])
@jwt_required()
def get_doctor_analytics():
    """Get analytics for doctor dashboard."""
    current_user = get_current_user()
    
    if current_user['role'] != 'doctor':
        return jsonify({'error': 'Only doctors can access this endpoint'}), 403
    
    doctor = Doctor.find_by_user_id(current_user['id'])
    if not doctor:
        return jsonify({'error': 'Doctor profile not found'}), 404
    
    doctor_id = doctor['_id']
    db = get_db()
    
    # Get all appointments for this doctor
    appointments = list(db[APPOINTMENTS_COLLECTION].find({'doctor_id': doctor_id}))
    
    # Calculate stats
    total_appointments = len(appointments)
    pending = sum(1 for a in appointments if a['status'] == 'pending')
    confirmed = sum(1 for a in appointments if a['status'] == 'confirmed')
    completed = sum(1 for a in appointments if a['status'] == 'completed')
    cancelled = sum(1 for a in appointments if a['status'] == 'cancelled')
    
    # Get unique patients
    unique_patients = len(set(str(a['patient_id']) for a in appointments))
    
    # Get this month's appointments
    now = datetime.utcnow()
    first_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    this_month_appointments = sum(
        1 for a in appointments 
        if a.get('created_at') and a['created_at'] >= first_of_month
    )
    
    # Get rating stats
    rating_stats = Rating.calculate_average(doctor_id)
    
    # Get prescriptions count
    prescriptions = Prescription.find_by_doctor_id(doctor_id)
    
    # Today's appointments
    today = datetime.utcnow().strftime('%Y-%m-%d')
    today_appointments = sum(1 for a in appointments if a.get('date') == today)
    
    return jsonify({
        'totalAppointments': total_appointments,
        'appointmentsByStatus': {
            'pending': pending,
            'confirmed': confirmed,
            'completed': completed,
            'cancelled': cancelled
        },
        'uniquePatients': unique_patients,
        'thisMonthAppointments': this_month_appointments,
        'todayAppointments': today_appointments,
        'rating': rating_stats['average'],
        'ratingCount': rating_stats['count'],
        'prescriptionsWritten': len(prescriptions)
    })


@analytics_bp.route('/patient', methods=['GET'])
@jwt_required()
def get_patient_analytics():
    """Get analytics for patient dashboard."""
    current_user = get_current_user()
    
    if current_user['role'] != 'patient':
        return jsonify({'error': 'Only patients can access this endpoint'}), 403
    
    patient = Patient.find_by_user_id(current_user['id'])
    db = get_db()
    
    # Get all appointments for this patient
    appointments = Appointment.find_by_patient_id(current_user['id'])
    
    # Calculate stats
    total_appointments = len(appointments)
    upcoming = sum(1 for a in appointments if a['status'] in ['pending', 'confirmed'])
    completed = sum(1 for a in appointments if a['status'] == 'completed')
    
    # Get prescriptions
    if patient:
        prescriptions = Prescription.find_by_patient_id(patient['_id'])
    else:
        prescriptions = []
    
    # Get unique doctors visited
    unique_doctors = len(set(str(a['doctor_id']) for a in appointments if a['status'] == 'completed'))
    
    # Next appointment
    next_appointment = None
    for appt in sorted(appointments, key=lambda x: (x.get('date', ''), x.get('time', ''))):
        if appt['status'] in ['pending', 'confirmed']:
            next_appointment = {
                'date': appt['date'],
                'time': appt['time'],
                'doctorName': appt['doctor_name']
            }
            break
    
    return jsonify({
        'totalAppointments': total_appointments,
        'upcomingAppointments': upcoming,
        'completedAppointments': completed,
        'prescriptionsReceived': len(prescriptions),
        'doctorsVisited': unique_doctors,
        'nextAppointment': next_appointment
    })


@analytics_bp.route('/doctor/chart', methods=['GET'])
@jwt_required()
def get_doctor_chart_data():
    """Get chart data for doctor dashboard."""
    current_user = get_current_user()
    
    if current_user['role'] != 'doctor':
        return jsonify({'error': 'Only doctors can access this endpoint'}), 403
    
    doctor = Doctor.find_by_user_id(current_user['id'])
    if not doctor:
        return jsonify({'error': 'Doctor profile not found'}), 404
    
    doctor_id = doctor['_id']
    db = get_db()
    
    # Get all appointments for this doctor
    appointments = list(db[APPOINTMENTS_COLLECTION].find({'doctor_id': doctor_id}))
    
    # Calculate appointments for the last 7 days
    day_names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    appointments_data = []
    
    for i in range(6, -1, -1):
        day = datetime.utcnow() - timedelta(days=i)
        day_str = day.strftime('%Y-%m-%d')
        day_name = day_names[day.weekday()]
        count = sum(1 for a in appointments if a.get('date') == day_str)
        appointments_data.append({
            'day': day_name,
            'appointments': count
        })
    
    # Calculate status breakdown
    pending = sum(1 for a in appointments if a['status'] == 'pending')
    confirmed = sum(1 for a in appointments if a['status'] == 'confirmed')
    completed = sum(1 for a in appointments if a['status'] == 'completed')
    total = pending + confirmed + completed
    
    if total > 0:
        status_data = [
            {'name': 'Confirmed', 'value': round(confirmed / total * 100), 'color': '#3B82F6'},
            {'name': 'Pending', 'value': round(pending / total * 100), 'color': '#F59E0B'},
            {'name': 'Completed', 'value': round(completed / total * 100), 'color': '#10B981'},
        ]
    else:
        status_data = [
            {'name': 'Confirmed', 'value': 0, 'color': '#3B82F6'},
            {'name': 'Pending', 'value': 0, 'color': '#F59E0B'},
            {'name': 'Completed', 'value': 0, 'color': '#10B981'},
        ]
    
    return jsonify({
        'appointmentsData': appointments_data,
        'statusData': status_data
    })


@analytics_bp.route('/public-stats', methods=['GET'])
def get_public_stats():
    """Get public stats for homepage - no auth required."""
    db = get_db()
    
    # Count patients
    patients_count = db.patients.count_documents({})
    
    # Count doctors (only verified ones)
    doctors_count = db.doctors.count_documents({'verified': True})
    
    # Count total completed appointments
    completed_appointments = db.appointments.count_documents({'status': 'completed'})
    
    # Calculate average satisfaction (from ratings)
    ratings = list(db.ratings.find({}, {'score': 1}))
    if ratings:
        avg_rating = sum(r['score'] for r in ratings) / len(ratings)
        satisfaction_percent = round(avg_rating / 5 * 100)
        average_rating = round(avg_rating, 1)
    else:
        satisfaction_percent = 0
        average_rating = 0
    
    return jsonify({
        'activePatients': patients_count,
        'licensedDoctors': doctors_count,
        'completedConsultations': completed_appointments,
        'satisfactionRate': satisfaction_percent,
        'averageRating': average_rating
    })

