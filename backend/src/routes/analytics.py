from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models.doctor import Doctor
from ..models.patient import Patient
from ..models.appointment import Appointment
from ..models.rating import Rating
from ..models.prescription import Prescription
from ..database import get_db, APPOINTMENTS_COLLECTION
import json
from datetime import datetime, timedelta

analytics_bp = Blueprint('analytics', __name__)
PUBLIC_STATS_CACHE_TTL_SECONDS = 5 * 60
_public_stats_cache = {
    'expires_at': 0.0,
    'data': None,
}


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
    
    now = datetime.utcnow()
    first_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    today = now.strftime('%Y-%m-%d')

    pipeline = [
        {'$match': {'doctor_id': doctor_id}},
        {
            '$group': {
                '_id': None,
                'total': {'$sum': 1},
                'pending': {'$sum': {'$cond': [{'$eq': ['$status', 'pending']}, 1, 0]}},
                'confirmed': {'$sum': {'$cond': [{'$eq': ['$status', 'confirmed']}, 1, 0]}},
                'completed': {'$sum': {'$cond': [{'$eq': ['$status', 'completed']}, 1, 0]}},
                'cancelled': {'$sum': {'$cond': [{'$eq': ['$status', 'cancelled']}, 1, 0]}},
                'uniquePatients': {'$addToSet': '$patient_id'},
                'thisMonthAppointments': {
                    '$sum': {
                        '$cond': [
                            {
                                '$and': [
                                    {'$gte': ['$created_at', first_of_month]},
                                    {'$ne': ['$created_at', None]}
                                ]
                            },
                            1,
                            0
                        ]
                    }
                },
                'todayAppointments': {
                    '$sum': {'$cond': [{'$eq': ['$date', today]}, 1, 0]}
                },
            }
        },
    ]

    agg_result = list(db[APPOINTMENTS_COLLECTION].aggregate(pipeline))
    stats = agg_result[0] if agg_result else {}

    # Get rating stats
    rating_stats = Rating.calculate_average(doctor_id)
    
    # Get prescriptions count
    prescriptions = Prescription.find_by_doctor_id(doctor_id)

    return jsonify({
        'totalAppointments': stats.get('total', 0),
        'appointmentsByStatus': {
            'pending': stats.get('pending', 0),
            'confirmed': stats.get('confirmed', 0),
            'completed': stats.get('completed', 0),
            'cancelled': stats.get('cancelled', 0)
        },
        'uniquePatients': len(stats.get('uniquePatients', [])),
        'thisMonthAppointments': stats.get('thisMonthAppointments', 0),
        'todayAppointments': stats.get('todayAppointments', 0),
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
    
    db = get_db()
    
    # Get all appointments for this patient
    appointments = Appointment.find_by_patient_id(current_user['id'])
    
    # Calculate stats
    total_appointments = len(appointments)
    upcoming = sum(1 for a in appointments if a['status'] in ['pending', 'confirmed'])
    completed = sum(1 for a in appointments if a['status'] == 'completed')
    
    # Get prescriptions
    prescriptions = Prescription.find_by_patient_id(current_user['id'])
    
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
    
    # Appointments for the last 7 days
    today = datetime.utcnow().date()
    start_date = today - timedelta(days=6)
    start_str = start_date.strftime('%Y-%m-%d')
    end_str = today.strftime('%Y-%m-%d')

    chart_pipeline = [
        {'$match': {'doctor_id': doctor_id, 'date': {'$gte': start_str, '$lte': end_str}}},
        {'$group': {'_id': '$date', 'appointments': {'$sum': 1}}},
        {'$sort': {'_id': 1}}
    ]
    chart_result = {doc['_id']: doc['appointments'] for doc in db[APPOINTMENTS_COLLECTION].aggregate(chart_pipeline)}

    day_names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    appointments_data = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        day_str = day.strftime('%Y-%m-%d')
        day_name = day_names[day.weekday()]
        appointments_data.append({
            'day': day_name,
            'appointments': chart_result.get(day_str, 0)
        })

    # Status breakdown percentages
    status_pipeline = [
        {'$match': {'doctor_id': doctor_id}},
        {
            '$group': {
                '_id': None,
                'pending': {'$sum': {'$cond': [{'$eq': ['$status', 'pending']}, 1, 0]}},
                'confirmed': {'$sum': {'$cond': [{'$eq': ['$status', 'confirmed']}, 1, 0]}},
                'completed': {'$sum': {'$cond': [{'$eq': ['$status', 'completed']}, 1, 0]}},
            }
        },
    ]
    status_result = list(db[APPOINTMENTS_COLLECTION].aggregate(status_pipeline))
    status_counts = status_result[0] if status_result else {}
    total = sum(status_counts.get(k, 0) for k in ('pending', 'confirmed', 'completed'))

    def pct(val):
        return round(val / total * 100) if total else 0

    status_data = [
        {'name': 'Confirmed', 'value': pct(status_counts.get('confirmed', 0)), 'color': '#3B82F6'},
        {'name': 'Pending', 'value': pct(status_counts.get('pending', 0)), 'color': '#F59E0B'},
        {'name': 'Completed', 'value': pct(status_counts.get('completed', 0)), 'color': '#10B981'},
    ]
    
    return jsonify({
        'appointmentsData': appointments_data,
        'statusData': status_data
    })


@analytics_bp.route('/public-stats', methods=['GET'])
def get_public_stats():
    """Get public stats for homepage - no auth required."""
    now_ts = datetime.utcnow().timestamp()
    cached_data = _public_stats_cache.get('data')
    if cached_data is not None and now_ts < float(_public_stats_cache.get('expires_at', 0.0)):
        response = jsonify(cached_data)
        response.headers['Cache-Control'] = (
            f'public, max-age={PUBLIC_STATS_CACHE_TTL_SECONDS}, '
            f's-maxage={PUBLIC_STATS_CACHE_TTL_SECONDS}, stale-while-revalidate=60'
        )
        return response

    db = get_db()
    
    patients_count = db.patients.count_documents({})
    doctors_count = db.doctors.count_documents({'verified': True})
    completed_appointments = db.appointments.count_documents({'status': 'completed'})

    rating_stats = list(db.ratings.aggregate([
        {'$group': {'_id': None, 'avgRating': {'$avg': '$score'}, 'count': {'$sum': 1}}}
    ]))
    if rating_stats:
        avg_rating = rating_stats[0].get('avgRating') or 0
        satisfaction_percent = round(avg_rating / 5 * 100)
        average_rating = round(avg_rating, 1)
    else:
        satisfaction_percent = 0
        average_rating = 0

    payload = {
        'activePatients': patients_count,
        'licensedDoctors': doctors_count,
        'completedConsultations': completed_appointments,
        'satisfactionRate': satisfaction_percent,
        'averageRating': average_rating
    }
    _public_stats_cache['data'] = payload
    _public_stats_cache['expires_at'] = now_ts + PUBLIC_STATS_CACHE_TTL_SECONDS

    response = jsonify(payload)
    response.headers['Cache-Control'] = (
        f'public, max-age={PUBLIC_STATS_CACHE_TTL_SECONDS}, '
        f's-maxage={PUBLIC_STATS_CACHE_TTL_SECONDS}, stale-while-revalidate=60'
    )
    return response
