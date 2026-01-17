from bson import ObjectId
from ..database import get_db, DOCTORS_COLLECTION

class Doctor:
    """Doctor model."""
    
    @staticmethod
    def create(user_id, name, specialty, location, availability, rating, image, verified=False):
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
            'image': image,
            'verified': verified,
            'verification_status': 'verified' if verified else 'pending'
        }
        result = db[DOCTORS_COLLECTION].insert_one(doctor_data)
        doctor_data['_id'] = result.inserted_id
        return doctor_data
    
    @staticmethod
    def find_all(verified_only=False):
        """Get all doctors."""
        db = get_db()
        query = {'verified': True} if verified_only else {}
        return list(db[DOCTORS_COLLECTION].find(query))
    
    @staticmethod
    def find_by_verification_status(status):
        """Find doctors by verification status."""
        db = get_db()
        return list(db[DOCTORS_COLLECTION].find({'verification_status': status}))
    
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
    def verify(doctor_id):
        """Verify a doctor."""
        return Doctor.update(doctor_id, {
            'verified': True,
            'verification_status': 'verified'
        })
    
    @staticmethod
    def reject(doctor_id):
        """Reject a doctor verification."""
        return Doctor.update(doctor_id, {
            'verified': False,
            'verification_status': 'rejected'
        })
    
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
            'userId': str(doctor.get('user_id', '')),
            'name': doctor['name'],
            'specialty': doctor['specialty'],
            'location': doctor['location'],
            'availability': doctor.get('availability', []),
            'rating': doctor.get('rating', 0),
            'reviewCount': doctor.get('review_count', doctor.get('rating_count', 0)),
            'experience': doctor.get('experience', 0),
            'availableToday': doctor.get('available_today', False),
            'consultationTypes': doctor.get('consultation_types', ['video', 'in-person']),
            'nextAvailable': doctor.get('next_available', ''),
            'image': doctor.get('image', ''),
            'verified': doctor.get('verified', False),
            'verificationStatus': doctor.get('verification_status', 'pending'),
            'pendingProfileUpdate': doctor.get('pending_profile_update'),
            'pendingProfileUpdateAt': doctor.get('pending_profile_update_at')
        }
    
    @staticmethod
    def request_profile_update(doctor_id, update_data):
        """Request a profile update (requires admin approval)."""
        from datetime import datetime
        db = get_db()
        if isinstance(doctor_id, str):
            doctor_id = ObjectId(doctor_id)
        db[DOCTORS_COLLECTION].update_one(
            {'_id': doctor_id},
            {'$set': {
                'pending_profile_update': update_data,
                'pending_profile_update_at': datetime.utcnow()
            }}
        )
        return Doctor.find_by_id(doctor_id)
    
    @staticmethod
    def approve_profile_update(doctor_id):
        """Apply pending profile update."""
        db = get_db()
        if isinstance(doctor_id, str):
            doctor_id = ObjectId(doctor_id)
        doctor = Doctor.find_by_id(doctor_id)
        if not doctor or not doctor.get('pending_profile_update'):
            return None
        
        pending = doctor['pending_profile_update']
        db[DOCTORS_COLLECTION].update_one(
            {'_id': doctor_id},
            {
                '$set': pending,
                '$unset': {
                    'pending_profile_update': '',
                    'pending_profile_update_at': ''
                }
            }
        )
        return Doctor.find_by_id(doctor_id)
    
    @staticmethod
    def reject_profile_update(doctor_id):
        """Clear pending profile update without applying."""
        db = get_db()
        if isinstance(doctor_id, str):
            doctor_id = ObjectId(doctor_id)
        db[DOCTORS_COLLECTION].update_one(
            {'_id': doctor_id},
            {'$unset': {
                'pending_profile_update': '',
                'pending_profile_update_at': ''
            }}
        )
        return Doctor.find_by_id(doctor_id)
    
    @staticmethod
    def find_with_pending_updates():
        """Find all doctors with pending profile updates."""
        db = get_db()
        return list(db[DOCTORS_COLLECTION].find({'pending_profile_update': {'$exists': True, '$ne': None}}))
