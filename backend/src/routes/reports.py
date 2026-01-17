"""API routes for report generation."""
from flask import Blueprint, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
import json

from ..models.prescription import Prescription
from ..models.patient import Patient
from ..models.doctor import Doctor
from ..models.appointment import Appointment
from ..models.medical_record import MedicalRecord
from ..services.report_service import generate_prescription_pdf, generate_medical_record_pdf

reports_bp = Blueprint('reports', __name__)


def get_current_user():
    """Parse JWT identity and return user dict."""
    identity = get_jwt_identity()
    if isinstance(identity, str):
        return json.loads(identity)
    return identity


@reports_bp.route('/prescription/<prescription_id>', methods=['GET'])
@jwt_required()
def generate_prescription_report(prescription_id):
    """Generate and download a PDF report for a prescription."""
    current_user = get_current_user()
    
    # Only patients can generate reports
    if current_user['role'] != 'patient':
        return jsonify({'error': 'Only patients can generate prescription reports'}), 403
    
    # Get prescription
    prescription = Prescription.find_by_id(prescription_id)
    if not prescription:
        return jsonify({'error': 'Prescription not found'}), 404
    
    # Prescriptions store user_id as patient_id (from appointment)
    # Verify ownership by comparing with current user's id
    user_id = current_user['id']
    if str(prescription['patient_id']) != user_id:
        return jsonify({'error': 'Access denied'}), 403
    
    # Get patient profile for name/email
    patient = Patient.find_by_user_id(user_id)
    if not patient:
        return jsonify({'error': 'Patient profile not found'}), 404
    
    # Get doctor info
    doctor = Doctor.find_by_id(prescription['doctor_id'])
    doctor_name = doctor['name'] if doctor else 'Unknown Doctor'
    doctor_specialty = doctor['specialty'] if doctor else 'General Practice'
    
    # Get appointment date
    appointment = None
    if prescription.get('appointment_id'):
        appointment = Appointment.find_by_id(prescription['appointment_id'])
    appointment_date = appointment.get('date', 'N/A') if appointment else 'N/A'
    
    # Patient info
    patient_name = patient.get('name', 'Patient')
    patient_email = patient.get('email', 'N/A')
    
    try:
        # Generate PDF
        pdf_buffer = generate_prescription_pdf(
            prescription=Prescription.to_dict(prescription),
            patient_name=patient_name,
            patient_email=patient_email,
            doctor_name=doctor_name,
            doctor_specialty=doctor_specialty,
            appointment_date=appointment_date
        )
        
        # Create filename
        from datetime import datetime
        date_str = datetime.now().strftime('%Y%m%d')
        filename = f"prescription_report_{date_str}.pdf"
        
        return send_file(
            pdf_buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=filename
        )
        
    except Exception as e:
        return jsonify({'error': f'Failed to generate report: {str(e)}'}), 500


@reports_bp.route('/medical-record/<record_id>', methods=['GET'])
@jwt_required()
def generate_medical_record_report(record_id):
    """Generate and download a PDF report for a medical record."""
    current_user = get_current_user()
    
    # Only patients can generate reports
    if current_user['role'] != 'patient':
        return jsonify({'error': 'Only patients can generate medical records'}), 403
    
    user_id = current_user['id']
    
    # Get patient profile first
    patient = Patient.find_by_user_id(user_id)
    if not patient:
        return jsonify({'error': 'Patient profile not found'}), 404
    
    # Get medical record
    record = MedicalRecord.find_by_id(record_id)
    if not record:
        return jsonify({'error': 'Medical record not found'}), 404
    
    # Verify ownership - compare patient ObjectId
    if str(record.get('patient_id')) != str(patient['_id']):
        return jsonify({'error': 'Access denied'}), 403
    
    # Patient info
    patient_name = patient.get('name', 'Patient')
    patient_email = patient.get('email', 'N/A')
    doctor_name = record.get('doctor', 'Unknown Doctor').replace('Dr. ', '')
    
    try:
        # Generate PDF
        pdf_buffer = generate_medical_record_pdf(
            record=MedicalRecord.to_dict(record),
            patient_name=patient_name,
            patient_email=patient_email,
            doctor_name=doctor_name
        )
        
        # Create filename
        from datetime import datetime
        date_str = datetime.now().strftime('%Y%m%d')
        record_type = record.get('type', 'record').replace(' ', '_').lower()
        filename = f"medical_record_{record_type}_{date_str}.pdf"
        
        return send_file(
            pdf_buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=filename
        )
        
    except Exception as e:
        return jsonify({'error': f'Failed to generate report: {str(e)}'}), 500
