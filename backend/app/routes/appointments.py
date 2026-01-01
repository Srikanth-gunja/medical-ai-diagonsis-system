from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from ..models.appointment import Appointment
from ..models.doctor import Doctor
from ..models.patient import Patient
from ..models.medical_record import MedicalRecord
import json
from datetime import datetime

appointments_bp = Blueprint('appointments', __name__)

def get_current_user():
    """Parse JWT identity and return user dict."""
    identity = get_jwt_identity()
    if isinstance(identity, str):
        return json.loads(identity)
    return identity

@appointments_bp.route('/', methods=['GET'])
@jwt_required()
def get_appointments():
    current_user = get_current_user()
    user_id = current_user['id']
    role = current_user['role']
    
    if role == 'patient':
        appointments = Appointment.find_by_patient_id(user_id)
    else:
        # For doctors, find by doctor profile's _id
        doctor = Doctor.find_by_user_id(user_id)
        if doctor:
            appointments = Appointment.find_by_doctor_id(doctor['_id'])
        else:
            appointments = []
    
    return jsonify([Appointment.to_dict(appt) for appt in appointments])

@appointments_bp.route('/', methods=['POST'])
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
    
    return jsonify(Appointment.to_dict(appointment)), 201

@appointments_bp.route('/<appt_id>/status', methods=['PATCH'])
@jwt_required()
def update_status(appt_id):
    data = request.get_json()
    status = data.get('status')
    
    appointment = Appointment.update_status(appt_id, status)
    if appointment:
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
    """Allow patient to revoke their pending appointment."""
    current_user = get_current_user()
    
    # Only patients can revoke
    if current_user['role'] != 'patient':
        return jsonify({'error': 'Only patients can revoke appointments'}), 403
    
    appointment = Appointment.find_by_id(appt_id)
    if not appointment:
        return jsonify({'error': 'Appointment not found'}), 404
    
    # Verify ownership
    if str(appointment['patient_id']) != current_user['id']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Only pending appointments can be revoked
    if appointment['status'] != 'pending':
        return jsonify({'error': 'Only pending appointments can be revoked'}), 400
    
    updated = Appointment.update_status(appt_id, 'cancelled')
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
    
    return jsonify({
        'message': 'Appointment completed and medical record created',
        'appointment': Appointment.to_dict(updated_appointment),
        'medicalRecord': MedicalRecord.to_dict(record)
    })

