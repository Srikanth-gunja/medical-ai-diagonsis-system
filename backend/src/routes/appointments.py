from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from ..models.appointment import Appointment
from ..models.doctor import Doctor
from ..models.patient import Patient
from ..models.medical_record import MedicalRecord
from ..models.notification import Notification
from ..database import get_db
import json
from datetime import datetime

appointments_bp = Blueprint('appointments', __name__)

ACTIVITIES_COLLECTION = 'activities'

def get_current_user():
    """Parse JWT identity and return user dict."""
    identity = get_jwt_identity()
    if isinstance(identity, str):
        return json.loads(identity)
    return identity


def create_activity(user_id: str, activity_type: str, title: str, description: str, icon: str = 'BellIcon', color: str = 'bg-primary'):
    """Create an activity entry for a user."""
    db = get_db()
    activity = {
        'user_id': ObjectId(user_id),
        'type': activity_type,
        'title': title,
        'description': description,
        'timestamp': datetime.utcnow(),
        'icon': icon,
        'color': color,
    }
    db[ACTIVITIES_COLLECTION].insert_one(activity)

@appointments_bp.route('', methods=['GET'])
@jwt_required()
def get_appointments():
    current_user = get_current_user()
    user_id = current_user['id']
    role = current_user['role']
    
    if role == 'patient':
        appointments = Appointment.find_by_patient_id(user_id)
        result = [Appointment.to_dict(appt) for appt in appointments]
    else:
        # For doctors, find by doctor profile's _id and include patient names
        doctor = Doctor.find_by_user_id(user_id)
        if doctor:
            appointments = Appointment.find_by_doctor_id(doctor['_id'])
        else:
            appointments = []
        
        # Enrich with patient names
        result = []
        for appt in appointments:
            appt_dict = Appointment.to_dict(appt)
            # Get patient info
            patient = Patient.find_by_user_id(str(appt['patient_id']))
            if patient:
                appt_dict['patientName'] = f"{patient.get('firstName', '')} {patient.get('lastName', '')}".strip()
            else:
                appt_dict['patientName'] = 'Unknown Patient'
            # Add type if not present
            if 'type' not in appt_dict:
                appt_dict['type'] = appt.get('type', 'video')
            result.append(appt_dict)
    
    return jsonify(result)

@appointments_bp.route('', methods=['POST'])
@jwt_required()
def create_appointment():
    data = request.get_json()
    current_user = get_current_user()
    
    appointment = Appointment.create(
        patient_id=current_user['id'],
        doctor_id=data['doctorId'],
        doctor_name=data['doctorName'],
        date=data['date'],
        time=data['time'],
        symptoms=data.get('symptoms', '')
    )
    
    # Get patient name for notification
    patient = Patient.find_by_user_id(current_user['id'])
    patient_name = f"{patient.get('firstName', '')} {patient.get('lastName', '')}" if patient else 'A patient'
    
    # Create notification for doctor with reference to appointment
    doctor = Doctor.find_by_id(data['doctorId'])
    if doctor:
        Notification.create(
            user_id=doctor['user_id'],
            title='New Appointment Request',
            message=f"{patient_name} has requested an appointment on {data['date']} at {data['time']}",
            notification_type='appointment',
            link='/doctor-dashboard',
            reference_id=f"appointment:{str(appointment['_id'])}"
        )
    
    # Create activity for patient
    create_activity(
        user_id=current_user['id'],
        activity_type='appointment',
        title='Appointment Booked',
        description=f"Requested appointment with {data['doctorName']} on {data['date']} at {data['time']}",
        icon='CalendarIcon',
        color='bg-primary'
    )
    
    return jsonify(Appointment.to_dict(appointment)), 201

@appointments_bp.route('/<appt_id>/status', methods=['PATCH'])
@jwt_required()
def update_status(appt_id):
    data = request.get_json()
    status = data.get('status')
    
    # Get appointment before update for notification
    original_appointment = Appointment.find_by_id(appt_id)
    
    appointment = Appointment.update_status(appt_id, status)
    if appointment:
        # Create notification for patient about status change
        if original_appointment:
            patient_id = original_appointment['patient_id']
            doctor_name = original_appointment.get('doctor_name', 'Doctor')
            appt_date = original_appointment.get('date', '')
            appt_time = original_appointment.get('time', '')
            doctor_id = original_appointment.get('doctor_id')
            
            # Get doctor's user_id to mark their notification as read
            if doctor_id:
                doctor = Doctor.find_by_id(doctor_id)
                if doctor:
                    # Mark the appointment request notification as read for the doctor
                    Notification.mark_read_by_reference(
                        doctor['user_id'],
                        f"appointment:{appt_id}"
                    )
            
            if status == 'confirmed':
                Notification.create(
                    user_id=patient_id,
                    title='Appointment Confirmed',
                    message=f'Your appointment with {doctor_name} on {appt_date} at {appt_time} has been confirmed.',
                    notification_type='success',
                    link='/patient-dashboard'
                )
                # Create activity for patient
                create_activity(
                    user_id=str(patient_id),
                    activity_type='appointment',
                    title='Appointment Confirmed',
                    description=f'Your appointment with {doctor_name} on {appt_date} at {appt_time} has been confirmed.',
                    icon='CheckCircleIcon',
                    color='bg-success'
                )
            elif status == 'cancelled':
                Notification.create(
                    user_id=patient_id,
                    title='Appointment Cancelled',
                    message=f'Your appointment with {doctor_name} on {appt_date} at {appt_time} has been cancelled.',
                    notification_type='warning',
                    link='/patient-dashboard'
                )
                # Create activity for patient
                create_activity(
                    user_id=str(patient_id),
                    activity_type='appointment',
                    title='Appointment Cancelled',
                    description=f'Your appointment with {doctor_name} on {appt_date} at {appt_time} was cancelled.',
                    icon='XCircleIcon',
                    color='bg-warning'
                )
        
        return jsonify(Appointment.to_dict(appointment))
    return jsonify({'error': 'Appointment not found'}), 404

@appointments_bp.route('/<appt_id>', methods=['DELETE'])
@jwt_required()
def delete_appointment(appt_id):
    result = Appointment.delete(appt_id)
    if result.deleted_count > 0:
        return jsonify({'message': 'Appointment deleted successfully'})
    return jsonify({'error': 'Appointment not found'}), 404

@appointments_bp.route('/<appt_id>/revoke', methods=['PATCH'])
@jwt_required()
def revoke_appointment(appt_id):
    """Allow patient to cancel their pending or confirmed appointment."""
    current_user = get_current_user()
    
    # Only patients can cancel
    if current_user['role'] != 'patient':
        return jsonify({'error': 'Only patients can cancel appointments'}), 403
    
    appointment = Appointment.find_by_id(appt_id)
    if not appointment:
        return jsonify({'error': 'Appointment not found'}), 404
    
    # Verify ownership
    if str(appointment['patient_id']) != current_user['id']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Only pending or confirmed appointments can be cancelled
    if appointment['status'] not in ['pending', 'confirmed']:
        return jsonify({'error': 'Only pending or confirmed appointments can be cancelled'}), 400
    
    # Get appointment details for notifications
    doctor_name = appointment.get('doctor_name', 'Doctor')
    appt_date = appointment.get('date', '')
    appt_time = appointment.get('time', '')
    doctor_id = appointment.get('doctor_id')
    
    # Update appointment status to rejected with patient cancellation reason
    updated = Appointment.update(appt_id, {
        'status': 'rejected',
        'rejection_reason': 'Cancelled by patient'
    })
    
    # Get patient name for notification
    patient = Patient.find_by_user_id(current_user['id'])
    patient_name = f"{patient.get('firstName', '')} {patient.get('lastName', '')}".strip() if patient else 'A patient'
    
    # Notify the doctor about the cancellation
    if doctor_id:
        doctor = Doctor.find_by_id(doctor_id)
        if doctor:
            Notification.create(
                user_id=doctor['user_id'],
                title='Appointment Cancelled by Patient',
                message=f'{patient_name} has cancelled their appointment on {appt_date} at {appt_time}.',
                notification_type='warning',
                link='/doctor-dashboard'
            )
    
    # Create activity for patient
    create_activity(
        user_id=current_user['id'],
        activity_type='appointment',
        title='Appointment Cancelled',
        description=f'You cancelled your appointment with {doctor_name} on {appt_date} at {appt_time}.',
        icon='XCircleIcon',
        color='bg-warning'
    )
    
    return jsonify(Appointment.to_dict(updated))

@appointments_bp.route('/<appt_id>/complete', methods=['POST'])
@jwt_required()
def complete_appointment(appt_id):
    """Mark appointment as completed and create a medical record."""
    current_user = get_current_user()
    
    # Only doctors can complete appointments
    if current_user['role'] != 'doctor':
        return jsonify({'error': 'Only doctors can complete appointments'}), 403
    
    data = request.get_json()
    
    # Get the appointment
    appointment = Appointment.find_by_id(appt_id)
    if not appointment:
        return jsonify({'error': 'Appointment not found'}), 404
    
    # Update appointment status to completed
    Appointment.update_status(appt_id, 'completed')
    
    # Get doctor info
    doctor = Doctor.find_by_user_id(current_user['id'])
    doctor_name = doctor['name'] if doctor else 'Unknown Doctor'
    
    # Get patient info to get patient._id for medical record
    patient_user_id = str(appointment['patient_id'])
    patient = Patient.find_by_user_id(patient_user_id)
    
    if not patient:
        return jsonify({'error': 'Patient not found'}), 404
    
    # Create medical record from the consultation
    record = MedicalRecord.create(
        patient_id=patient['_id'],
        date=datetime.utcnow().strftime('%Y-%m-%d'),
        record_type=data.get('type', 'Consultation'),
        doctor=doctor_name,
        description=data.get('description', f"Consultation on {appointment['date']} - {appointment.get('symptoms', 'General checkup')}"),
        result=data.get('result', 'Completed'),
        notes=data.get('notes', '')
    )
    
    updated_appointment = Appointment.find_by_id(appt_id)
    
    # Create activity for patient - consultation completed
    create_activity(
        user_id=patient_user_id,
        activity_type='report',
        title='Consultation Completed',
        description=f'Your consultation with {doctor_name} has been completed. Medical record created.',
        icon='ClipboardDocumentCheckIcon',
        color='bg-success'
    )
    
    return jsonify({
        'message': 'Appointment completed and medical record created',
        'appointment': Appointment.to_dict(updated_appointment),
        'medicalRecord': MedicalRecord.to_dict(record)
    })


@appointments_bp.route('/<appt_id>/reject', methods=['POST'])
@jwt_required()
def reject_appointment(appt_id):
    """Doctor rejects an appointment with a reason."""
    current_user = get_current_user()
    
    # Only doctors can reject appointments
    if current_user['role'] != 'doctor':
        return jsonify({'error': 'Only doctors can reject appointments'}), 403
    
    data = request.get_json()
    reason = data.get('reason', 'No reason provided')
    
    # Get the appointment
    appointment = Appointment.find_by_id(appt_id)
    if not appointment:
        return jsonify({'error': 'Appointment not found'}), 404
    
    # Update appointment status to rejected with reason
    updated = Appointment.update(appt_id, {
        'status': 'rejected',
        'rejection_reason': reason
    })
    
    # Get doctor info
    doctor = Doctor.find_by_user_id(current_user['id'])
    doctor_name = doctor['name'] if doctor else 'Doctor'
    
    # Get appointment info
    patient_id = appointment['patient_id']
    appt_date = appointment.get('date', '')
    appt_time = appointment.get('time', '')
    
    # Create notification for patient with rejection reason
    Notification.create(
        user_id=patient_id,
        title='Appointment Rejected',
        message=f'Your appointment with {doctor_name} on {appt_date} at {appt_time} was rejected. Reason: {reason}',
        notification_type='warning',
        link='/patient-dashboard'
    )
    
    # Create activity for patient
    create_activity(
        user_id=str(patient_id),
        activity_type='appointment',
        title='Appointment Rejected',
        description=f'Your appointment with {doctor_name} on {appt_date} at {appt_time} was rejected. Reason: {reason}',
        icon='XCircleIcon',
        color='bg-error'
    )
    
    # Mark the appointment request notification as read for the doctor
    if doctor:
        Notification.mark_read_by_reference(
            doctor['user_id'],
            f"appointment:{appt_id}"
        )
    
    return jsonify({
        'message': 'Appointment rejected',
        'appointment': Appointment.to_dict(updated)
    })


@appointments_bp.route('/<appt_id>/reschedule', methods=['PATCH'])
@jwt_required()
def reschedule_appointment(appt_id):
    """Reschedule an appointment to a new date and time."""
    current_user = get_current_user()
    data = request.get_json()
    
    new_date = data.get('date')
    new_time = data.get('time')
    
    if not new_date or not new_time:
        return jsonify({'error': 'New date and time are required'}), 400
    
    # Get the appointment
    appointment = Appointment.find_by_id(appt_id)
    if not appointment:
        return jsonify({'error': 'Appointment not found'}), 404
    
    # Verify ownership - patient can reschedule their own appointments
    if current_user['role'] == 'patient':
        if str(appointment['patient_id']) != current_user['id']:
            return jsonify({'error': 'Unauthorized'}), 403
    
    old_date = appointment.get('date', '')
    old_time = appointment.get('time', '')
    doctor_name = appointment.get('doctor_name', 'Doctor')
    
    # Update appointment with new date/time
    updated = Appointment.update(appt_id, {
        'date': new_date,
        'time': new_time,
        'status': 'pending'  # Reset to pending for doctor to confirm
    })
    
    # Get patient info for notification
    patient = Patient.find_by_user_id(str(appointment['patient_id']))
    patient_name = f"{patient.get('firstName', '')} {patient.get('lastName', '')}".strip() if patient else 'Patient'
    
    # Notify doctor about reschedule
    doctor = Doctor.find_by_id(str(appointment['doctor_id']))
    if doctor:
        Notification.create(
            user_id=doctor['user_id'],
            title='Appointment Rescheduled',
            message=f'{patient_name} has rescheduled their appointment from {old_date} {old_time} to {new_date} at {new_time}',
            notification_type='info',
            link='/doctor-dashboard',
            reference_id=f"appointment:{appt_id}"
        )
    
    # Create activity for patient
    create_activity(
        user_id=str(appointment['patient_id']),
        activity_type='appointment',
        title='Appointment Rescheduled',
        description=f'Your appointment with {doctor_name} has been rescheduled to {new_date} at {new_time}',
        icon='CalendarIcon',
        color='bg-primary'
    )
    
    return jsonify({
        'message': 'Appointment rescheduled successfully',
        'appointment': Appointment.to_dict(updated)
    })
