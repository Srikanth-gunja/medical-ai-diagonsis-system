from bson import ObjectId
from datetime import datetime
from ..database import get_db, RATINGS_COLLECTION


class Rating:
    """Model for patient ratings of doctors."""
    
    @staticmethod
    def create(patient_id, doctor_id, appointment_id, score, comment=''):
        """Create a new rating."""
        db = get_db()
        
        # Validate score
        if not isinstance(score, (int, float)) or score < 1 or score > 5:
            raise ValueError("Score must be between 1 and 5")
        
        rating_data = {
            'patient_id': ObjectId(patient_id) if isinstance(patient_id, str) else patient_id,
            'doctor_id': ObjectId(doctor_id) if isinstance(doctor_id, str) else doctor_id,
            'appointment_id': ObjectId(appointment_id) if isinstance(appointment_id, str) else appointment_id,
            'score': int(score),
            'comment': comment.strip() if comment else '',
            'created_at': datetime.utcnow()
        }
        
        result = db[RATINGS_COLLECTION].insert_one(rating_data)
        rating_data['_id'] = result.inserted_id
        return rating_data
    
    @staticmethod
    def find_by_doctor_id(doctor_id):
        """Get all ratings for a doctor."""
        db = get_db()
        if isinstance(doctor_id, str):
            doctor_id = ObjectId(doctor_id)
        return list(db[RATINGS_COLLECTION].find({'doctor_id': doctor_id}).sort('created_at', -1))
    
    @staticmethod
    def find_by_appointment_id(appointment_id):
        """Find rating by appointment ID."""
        db = get_db()
        if isinstance(appointment_id, str):
            appointment_id = ObjectId(appointment_id)
        return db[RATINGS_COLLECTION].find_one({'appointment_id': appointment_id})
    
    @staticmethod
    def has_rated(patient_id, appointment_id):
        """Check if patient has already rated this appointment."""
        db = get_db()
        if isinstance(patient_id, str):
            patient_id = ObjectId(patient_id)
        if isinstance(appointment_id, str):
            appointment_id = ObjectId(appointment_id)
        
        existing = db[RATINGS_COLLECTION].find_one({
            'patient_id': patient_id,
            'appointment_id': appointment_id
        })
        return existing is not None
    
    @staticmethod
    def calculate_average(doctor_id):
        """Calculate average rating and count for a doctor."""
        db = get_db()
        if isinstance(doctor_id, str):
            doctor_id = ObjectId(doctor_id)
        
        pipeline = [
            {'$match': {'doctor_id': doctor_id}},
            {'$group': {
                '_id': '$doctor_id',
                'average': {'$avg': '$score'},
                'count': {'$sum': 1}
            }}
        ]
        
        result = list(db[RATINGS_COLLECTION].aggregate(pipeline))
        if result:
            return {
                'average': round(result[0]['average'], 1),
                'count': result[0]['count']
            }
        return {'average': 0, 'count': 0}
    
    @staticmethod
    def to_dict(rating, include_patient=False):
        """Convert rating to dictionary."""
        data = {
            'id': str(rating['_id']),
            'patientId': str(rating['patient_id']),
            'doctorId': str(rating['doctor_id']),
            'appointmentId': str(rating['appointment_id']),
            'score': rating['score'],
            'comment': rating.get('comment', ''),
            'createdAt': rating.get('created_at', '').isoformat() if rating.get('created_at') else ''
        }
        return data
