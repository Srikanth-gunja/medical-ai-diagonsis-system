from bson import ObjectId
from ..database import get_db, DOCTORS_COLLECTION

class Doctor:
    """Doctor model."""
    
    @staticmethod
    def create(user_id, name, specialty, location, availability, rating, image):
        """Create a new doctor profile."""
        db = get_db()
        doctor_data = {
            'user_id': ObjectId(user_id) if isinstance(user_id, str) else user_id,
            'name': name,
            'specialty': specialty,
            'location': location,
            'availability': availability,
            'rating': rating,
            'rating_count': 0,
            'image': image
        }
        result = db[DOCTORS_COLLECTION].insert_one(doctor_data)
        doctor_data['_id'] = result.inserted_id
        return doctor_data
    
    @staticmethod
    def find_all():
        """Get all doctors."""
        db = get_db()
        return list(db[DOCTORS_COLLECTION].find())
    
    @staticmethod
    def find_by_id(doctor_id):
        """Find a doctor by ID."""
        db = get_db()
        if isinstance(doctor_id, str):
            doctor_id = ObjectId(doctor_id)
        return db[DOCTORS_COLLECTION].find_one({'_id': doctor_id})
    
    @staticmethod
    def find_by_user_id(user_id):
        """Find a doctor by user ID."""
        db = get_db()
        if isinstance(user_id, str):
            user_id = ObjectId(user_id)
        return db[DOCTORS_COLLECTION].find_one({'user_id': user_id})
    
    @staticmethod
    def update(doctor_id, update_data):
        """Update a doctor profile."""
        db = get_db()
        if isinstance(doctor_id, str):
            doctor_id = ObjectId(doctor_id)
        db[DOCTORS_COLLECTION].update_one(
            {'_id': doctor_id},
            {'$set': update_data}
        )
        return Doctor.find_by_id(doctor_id)
    
    @staticmethod
    def delete(doctor_id):
        """Delete a doctor."""
        db = get_db()
        if isinstance(doctor_id, str):
            doctor_id = ObjectId(doctor_id)
        return db[DOCTORS_COLLECTION].delete_one({'_id': doctor_id})
    
    @staticmethod
    def to_dict(doctor):
        """Convert doctor to dictionary."""
        return {
            'id': str(doctor['_id']),
            'user_id': str(doctor.get('user_id', '')),
            'name': doctor['name'],
            'specialty': doctor['specialty'],
            'location': doctor['location'],
            'availability': doctor['availability'],
            'rating': doctor.get('rating', 0),
            'rating_count': doctor.get('rating_count', 0),
            'image': doctor['image']
        }
