from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from ..models.prescription import Prescription
from ..models.appointment import Appointment
from ..models.doctor import Doctor
from ..models.patient import Patient
from ..models.notification import Notification
from ..database import get_db
import json
from datetime import datetime

prescriptions_bp = Blueprint('prescriptions', __name__)

ACTIVITIES_COLLECTION = 'activities'


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


def get_current_user():
    """Parse JWT identity and return user dict."""
    identity = get_jwt_identity()
    if isinstance(identity, str):
        return json.loads(identity)
    return identity


@prescriptions_bp.route('/', methods=['POST'])
@jwt_required()
def create_prescription():
    """Create a new prescription (doctors only)."""
    current_user = get_current_user()
    
    if current_user['role'] != 'doctor':
        return jsonify({'error': 'Only doctors can create prescriptions'}), 403
    
    data = request.get_json()
    appointment_id = data.get('appointmentId')
    medications = data.get('medications', [])
    diagnosis = data.get('diagnosis', '')
    notes = data.get('notes', '')
    
    if not appointment_id:
        return jsonify({'error': 'Appointment ID is required'}), 400
    
    if not medications or len(medications) == 0:
        return jsonify({'error': 'At least one medication is required'}), 400
    
    # Validate each medication has required fields
    for med in medications:
        if not med.get('name') or not med.get('dosage'):
            return jsonify({'error': 'Each medication must have name and dosage'}), 400
    
    # Get appointment
    appointment = Appointment.find_by_id(appointment_id)
    if not appointment:
        return jsonify({'error': 'Appointment not found'}), 404
    
    # Check if prescription already exists for this appointment
    existing = Prescription.find_by_appointment_id(appointment_id)
    if existing:
        return jsonify({'error': 'Prescription already exists for this appointment'}), 400
    
    # Get doctor info
    doctor = Doctor.find_by_user_id(current_user['id'])
    if not doctor:
        return jsonify({'error': 'Doctor profile not found'}), 404
    
    # Create prescription
    prescription = Prescription.create(
        doctor_id=doctor['_id'],
        patient_id=appointment['patient_id'],
        appointment_id=appointment_id,
        medications=medications,
        diagnosis=diagnosis,
        notes=notes
    )
    
    # Create notification for patient
    Notification.create(
        user_id=appointment['patient_id'],
        title='New Prescription',
        message=f"Dr. {doctor['name']} has created a new prescription for you.",
        notification_type='prescription',
        link='/patient-dashboard/prescriptions'
    )
    
    # Create activity for patient
    create_activity(
        user_id=str(appointment['patient_id']),
        activity_type='prescription',
        title='New Prescription',
        description=f"Dr. {doctor['name']} prescribed {len(medications)} medication(s).",
        icon='ClipboardDocumentListIcon',
        color='bg-accent'
    )
    
    result = Prescription.to_dict(prescription)
    result['doctorName'] = doctor['name']
    
    return jsonify(result), 201


@prescriptions_bp.route('/patient', methods=['GET'])
@jwt_required()
def get_patient_prescriptions():
    """Get all prescriptions for the current patient."""
    current_user = get_current_user()
    
    if current_user['role'] != 'patient':
        return jsonify({'error': 'Only patients can access this endpoint'}), 403
    
    # Prescriptions are stored with user_id as patient_id (from appointment)
    # So we query directly by user_id, not patient profile's _id
    user_id = current_user['id']
    prescriptions = Prescription.find_by_patient_id(user_id)
    
    # Add doctor names
    result = []
    for p in prescriptions:
        data = Prescription.to_dict(p)
        doctor = Doctor.find_by_id(p['doctor_id'])
        data['doctorName'] = doctor['name'] if doctor else 'Unknown'
        result.append(data)
    
    return jsonify(result)


@prescriptions_bp.route('/appointment/<appointment_id>', methods=['GET'])
@jwt_required()
def get_prescription_by_appointment(appointment_id):
    """Get prescription for a specific appointment."""
    current_user = get_current_user()
    
    prescription = Prescription.find_by_appointment_id(appointment_id)
    if not prescription:
        return jsonify({'error': 'No prescription found for this appointment'}), 404
    
    # Verify user has access to this prescription
    appointment = Appointment.find_by_id(appointment_id)
    if not appointment:
        return jsonify({'error': 'Appointment not found'}), 404
    
    # Check if user is the patient or the doctor
    if current_user['role'] == 'patient':
        if str(appointment['patient_id']) != current_user['id']:
            return jsonify({'error': 'Access denied'}), 403
    elif current_user['role'] == 'doctor':
        doctor = Doctor.find_by_user_id(current_user['id'])
        if not doctor or str(appointment['doctor_id']) != str(doctor['_id']):
            return jsonify({'error': 'Access denied'}), 403
    
    result = Prescription.to_dict(prescription)
    doctor = Doctor.find_by_id(prescription['doctor_id'])
    result['doctorName'] = doctor['name'] if doctor else 'Unknown'
    
    return jsonify(result)


@prescriptions_bp.route('/<prescription_id>', methods=['GET'])
@jwt_required()
def get_prescription(prescription_id):
    """Get a specific prescription by ID."""
    current_user = get_current_user()
    
    prescription = Prescription.find_by_id(prescription_id)
    if not prescription:
        return jsonify({'error': 'Prescription not found'}), 404
    
    # Verify access
    if current_user['role'] == 'patient':
        patient = Patient.find_by_user_id(current_user['id'])
        if not patient or str(prescription['patient_id']) != str(patient['_id']):
            return jsonify({'error': 'Access denied'}), 403
    elif current_user['role'] == 'doctor':
        doctor = Doctor.find_by_user_id(current_user['id'])
        if not doctor or str(prescription['doctor_id']) != str(doctor['_id']):
            return jsonify({'error': 'Access denied'}), 403
    
    result = Prescription.to_dict(prescription)
    doctor = Doctor.find_by_id(prescription['doctor_id'])
    result['doctorName'] = doctor['name'] if doctor else 'Unknown'
    
    return jsonify(result)


@prescriptions_bp.route('/doctor', methods=['GET'])
@jwt_required()
def get_doctor_prescriptions():
    """Get all prescriptions written by the current doctor."""
    current_user = get_current_user()
    
    if current_user['role'] != 'doctor':
        return jsonify({'error': 'Only doctors can access this endpoint'}), 403
    
    doctor = Doctor.find_by_user_id(current_user['id'])
    if not doctor:
        return jsonify({'error': 'Doctor profile not found'}), 404
    
    prescriptions = Prescription.find_by_doctor_id(doctor['_id'])
    
    # Add patient names
    result = []
    for p in prescriptions:
        data = Prescription.to_dict(p)
        patient = Patient.find_by_user_id(str(p.get('patient_id', '')))
        if patient:
            data['patientName'] = f"{patient.get('firstName', '')} {patient.get('lastName', '')}"
        else:
            data['patientName'] = 'Unknown'
        result.append(data)
    
    return jsonify(result)


@prescriptions_bp.route('/patient/<patient_id>', methods=['POST'])
@jwt_required()
def create_prescription_for_patient(patient_id):
    """Create a prescription directly for a patient (without appointment)."""
    current_user = get_current_user()
    
    if current_user['role'] != 'doctor':
        return jsonify({'error': 'Only doctors can create prescriptions'}), 403
    
    data = request.get_json()
    medications = data.get('medications', [])
    diagnosis = data.get('diagnosis', '')
    notes = data.get('notes', '')
    
    if not medications or len(medications) == 0:
        return jsonify({'error': 'At least one medication is required'}), 400
    
    # Validate each medication has required fields
    for med in medications:
        if not med.get('name') or not med.get('dosage'):
            return jsonify({'error': 'Each medication must have name and dosage'}), 400
    
    # Verify patient exists
    patient = Patient.find_by_user_id(patient_id)
    if not patient:
        return jsonify({'error': 'Patient not found'}), 404
    
    # Get doctor info
    doctor = Doctor.find_by_user_id(current_user['id'])
    if not doctor:
        return jsonify({'error': 'Doctor profile not found'}), 404
    
    # Create prescription
    prescription = Prescription.create(
        doctor_id=doctor['_id'],
        patient_id=patient_id,
        appointment_id=None,  # No appointment linked
        medications=medications,
        diagnosis=diagnosis,
        notes=notes
    )
    
    # Create notification for patient
    Notification.create(
        user_id=patient_id,
        title='New Prescription',
        message=f"Dr. {doctor['name']} has created a new prescription for you.",
        notification_type='prescription',
        link='/patient-dashboard/prescriptions'
    )
    
    # Create activity for patient
    create_activity(
        user_id=patient_id,
        activity_type='prescription',
        title='New Prescription',
        description=f"Dr. {doctor['name']} prescribed {len(medications)} medication(s).",
        icon='ClipboardDocumentListIcon',
        color='bg-accent'
    )
    
    result = Prescription.to_dict(prescription)
    result['doctorName'] = doctor['name']
    result['patientName'] = f"{patient.get('firstName', '')} {patient.get('lastName', '')}"
    
    return jsonify(result), 201

