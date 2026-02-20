from bson import ObjectId
from datetime import datetime
from ..database import get_db, APPOINTMENTS_COLLECTION

class Appointment:
    """Appointment model."""
    
    @staticmethod
    def create(patient_id, doctor_id, doctor_name, date, time, symptoms='', slot_duration=30):
        """Create a new appointment."""
        db = get_db()
        appointment_data = {
            'patient_id': ObjectId(patient_id) if isinstance(patient_id, str) else patient_id,
            'doctor_id': ObjectId(doctor_id) if isinstance(doctor_id, str) else doctor_id,
            'doctor_name': doctor_name,
            'date': date,
            'time': time,
            'status': 'pending',
            'symptoms': symptoms,
            'slot_duration': slot_duration,
            'created_at': datetime.utcnow()
        }
        result = db[APPOINTMENTS_COLLECTION].insert_one(appointment_data)
        appointment_data['_id'] = result.inserted_id
        return appointment_data
    
    @staticmethod
    def find_by_patient_id(patient_id):
        """Get all appointments for a patient (by user_id stored as patient_id)."""
        db = get_db()
        if isinstance(patient_id, str):
            patient_id = ObjectId(patient_id)
        return list(db[APPOINTMENTS_COLLECTION].find({'patient_id': patient_id}))
    
    @staticmethod
    def find_by_doctor_id(doctor_id):
        """Get all appointments for a doctor."""
        db = get_db()
        if isinstance(doctor_id, str):
            doctor_id = ObjectId(doctor_id)
        return list(db[APPOINTMENTS_COLLECTION].find({'doctor_id': doctor_id}))
    
    @staticmethod
    def find_by_id(appointment_id):
        """Find an appointment by ID."""
        db = get_db()
        if isinstance(appointment_id, str):
            appointment_id = ObjectId(appointment_id)
        return db[APPOINTMENTS_COLLECTION].find_one({'_id': appointment_id})
    
    @staticmethod
    def update_status(appointment_id, status):
        """Update appointment status."""
        db = get_db()
        if isinstance(appointment_id, str):
            appointment_id = ObjectId(appointment_id)
        db[APPOINTMENTS_COLLECTION].update_one(
            {'_id': appointment_id},
            {'$set': {'status': status}}
        )
        return Appointment.find_by_id(appointment_id)
    
    @staticmethod
    def update(appointment_id, updates):
        """Update appointment with given fields."""
        db = get_db()
        if isinstance(appointment_id, str):
            appointment_id = ObjectId(appointment_id)
        db[APPOINTMENTS_COLLECTION].update_one(
            {'_id': appointment_id},
            {'$set': updates}
        )
        return Appointment.find_by_id(appointment_id)
    
    @staticmethod
    def delete(appointment_id):
        """Delete an appointment."""
        db = get_db()
        if isinstance(appointment_id, str):
            appointment_id = ObjectId(appointment_id)
        return db[APPOINTMENTS_COLLECTION].delete_one({'_id': appointment_id})
    
    @staticmethod
    def to_dict(appointment):
        """Convert appointment to dictionary."""
        from .patient import Patient
        
        patient_name = appointment.get('patient_name')
        if not patient_name and appointment.get('patient_id'):
            try:
                patient = Patient.find_by_user_id(str(appointment['patient_id']))
                if patient:
                    patient_name = f"{patient.get('firstName', '')} {patient.get('lastName', '')}".strip()
            except Exception:
                pass

        return {
            'id': str(appointment['_id']),
            'patientId': str(appointment.get('patient_id', '')),
            'patientName': patient_name or 'Unknown Patient',
            'doctorId': str(appointment.get('doctor_id', '')),
            'doctorName': appointment['doctor_name'],
            'date': appointment['date'],
            'time': appointment['time'],
            'status': appointment['status'],
            'type': appointment.get('type', 'video'),
            'symptoms': appointment.get('symptoms', ''),
            'rated': appointment.get('rated', False),
            'rejectionReason': appointment.get('rejection_reason', ''),
            'created_at': appointment.get('created_at', '').isoformat() if appointment.get('created_at') else None,
            'call_started_at': appointment.get('call_started_at', '').isoformat() if appointment.get('call_started_at') else None,
            'call_ended_at': appointment.get('call_ended_at', '').isoformat() if appointment.get('call_ended_at') else None,
            'call_duration': appointment.get('call_duration'),
            'slotDuration': appointment.get('slot_duration'),
        }
