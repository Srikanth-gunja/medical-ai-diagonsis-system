from bson import ObjectId
from datetime import datetime
from ..database import get_db, PRESCRIPTIONS_COLLECTION


class Prescription:
    """Model for doctor prescriptions."""
    
    @staticmethod
    def create(doctor_id, patient_id, appointment_id, medications, diagnosis='', notes=''):
        """Create a new prescription."""
        db = get_db()
        
        prescription_data = {
            'doctor_id': ObjectId(doctor_id) if isinstance(doctor_id, str) else doctor_id,
            'patient_id': ObjectId(patient_id) if isinstance(patient_id, str) else patient_id,
            'appointment_id': ObjectId(appointment_id) if isinstance(appointment_id, str) else appointment_id,
            'medications': medications,  # List of {name, dosage, frequency, duration, instructions}
            'diagnosis': diagnosis,
            'notes': notes,
            'created_at': datetime.utcnow()
        }
        
        result = db[PRESCRIPTIONS_COLLECTION].insert_one(prescription_data)
        prescription_data['_id'] = result.inserted_id
        return prescription_data
    
    @staticmethod
    def find_by_patient_id(patient_id):
        """Get all prescriptions for a patient."""
        db = get_db()
        if isinstance(patient_id, str):
            patient_id = ObjectId(patient_id)
        return list(db[PRESCRIPTIONS_COLLECTION].find({'patient_id': patient_id}).sort('created_at', -1))
    
    @staticmethod
    def find_by_doctor_id(doctor_id):
        """Get all prescriptions by a doctor."""
        db = get_db()
        if isinstance(doctor_id, str):
            doctor_id = ObjectId(doctor_id)
        return list(db[PRESCRIPTIONS_COLLECTION].find({'doctor_id': doctor_id}).sort('created_at', -1))
    
    @staticmethod
    def find_by_appointment_id(appointment_id):
        """Get prescription for an appointment."""
        db = get_db()
        if isinstance(appointment_id, str):
            appointment_id = ObjectId(appointment_id)
        return db[PRESCRIPTIONS_COLLECTION].find_one({'appointment_id': appointment_id})
    
    @staticmethod
    def find_by_id(prescription_id):
        """Find a prescription by ID."""
        db = get_db()
        if isinstance(prescription_id, str):
            prescription_id = ObjectId(prescription_id)
        return db[PRESCRIPTIONS_COLLECTION].find_one({'_id': prescription_id})
    
    @staticmethod
    def to_dict(prescription, include_names=False):
        """Convert prescription to dictionary."""
        data = {
            'id': str(prescription['_id']),
            'doctorId': str(prescription['doctor_id']),
            'patientId': str(prescription['patient_id']),
            'appointmentId': str(prescription['appointment_id']),
            'medications': prescription.get('medications', []),
            'diagnosis': prescription.get('diagnosis', ''),
            'notes': prescription.get('notes', ''),
            'createdAt': prescription.get('created_at', '').isoformat() if prescription.get('created_at') else ''
        }
        return data
