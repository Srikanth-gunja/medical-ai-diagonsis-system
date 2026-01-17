from bson import ObjectId
from ..database import get_db, PATIENTS_COLLECTION

class Patient:
    """Patient model."""
    
    @staticmethod
    def create(user_id, email, first_name, last_name, phone='', address='', **kwargs):
        """Create a new patient profile."""
        db = get_db()
        patient_data = {
            'user_id': ObjectId(user_id) if isinstance(user_id, str) else user_id,
            'email': email,
            'firstName': first_name,
            'lastName': last_name,
            'phone': phone,
            'address': address,
            'dateOfBirth': kwargs.get('date_of_birth', ''),
            'gender': kwargs.get('gender', ''),
            'bloodGroup': kwargs.get('blood_group', ''),
            'city': kwargs.get('city', ''),
            'state': kwargs.get('state', ''),
            'zipCode': kwargs.get('zip_code', ''),
            'emergencyContactName': kwargs.get('emergency_contact_name', ''),
            'emergencyContactPhone': kwargs.get('emergency_contact_phone', ''),
            'allergies': kwargs.get('allergies', ''),
            'currentMedications': kwargs.get('current_medications', ''),
            'chronicConditions': kwargs.get('chronic_conditions', []),
            'previousSurgeries': kwargs.get('previous_surgeries', ''),
            'insuranceProvider': kwargs.get('insurance_provider', ''),
            'insurancePolicyNumber': kwargs.get('insurance_policy_number', ''),
        }
        result = db[PATIENTS_COLLECTION].insert_one(patient_data)
        patient_data['_id'] = result.inserted_id
        return patient_data
    
    @staticmethod
    def find_by_id(patient_id):
        """Find a patient by ID."""
        db = get_db()
        if isinstance(patient_id, str):
            patient_id = ObjectId(patient_id)
        return db[PATIENTS_COLLECTION].find_one({'_id': patient_id})
    
    @staticmethod
    def find_by_user_id(user_id):
        """Find a patient by user ID."""
        db = get_db()
        if isinstance(user_id, str):
            user_id = ObjectId(user_id)
        return db[PATIENTS_COLLECTION].find_one({'user_id': user_id})
    
    @staticmethod
    def update(patient_id, update_data):
        """Update a patient profile."""
        db = get_db()
        if isinstance(patient_id, str):
            patient_id = ObjectId(patient_id)
        db[PATIENTS_COLLECTION].update_one(
            {'_id': patient_id},
            {'$set': update_data}
        )
        return Patient.find_by_id(patient_id)
    
    @staticmethod
    def update_by_user_id(user_id, update_data):
        """Update a patient profile by user ID."""
        db = get_db()
        if isinstance(user_id, str):
            user_id = ObjectId(user_id)
        db[PATIENTS_COLLECTION].update_one(
            {'user_id': user_id},
            {'$set': update_data}
        )
        return Patient.find_by_user_id(user_id)
    
    @staticmethod
    def to_dict(patient):
        """Convert patient to dictionary."""
        return {
            'id': str(patient['_id']),
            'userId': str(patient.get('user_id', '')),
            'email': patient.get('email', ''),
            'firstName': patient.get('firstName', ''),
            'lastName': patient.get('lastName', ''),
            'phone': patient.get('phone', ''),
            'address': patient.get('address', ''),
            'dateOfBirth': patient.get('dateOfBirth', ''),
            'gender': patient.get('gender', ''),
            'bloodGroup': patient.get('bloodGroup', ''),
            'city': patient.get('city', ''),
            'state': patient.get('state', ''),
            'zipCode': patient.get('zipCode', ''),
            'emergencyContactName': patient.get('emergencyContactName', ''),
            'emergencyContactPhone': patient.get('emergencyContactPhone', ''),
            'allergies': patient.get('allergies', ''),
            'currentMedications': patient.get('currentMedications', ''),
            'chronicConditions': patient.get('chronicConditions', []),
            'previousSurgeries': patient.get('previousSurgeries', ''),
            'insuranceProvider': patient.get('insuranceProvider', ''),
            'insurancePolicyNumber': patient.get('insurancePolicyNumber', ''),
        }
