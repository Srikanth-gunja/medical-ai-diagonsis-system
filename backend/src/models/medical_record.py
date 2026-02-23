from bson import ObjectId
from ..database import get_db, MEDICAL_RECORDS_COLLECTION


class MedicalRecord:
    """Medical Record model."""

    @staticmethod
    def create(patient_id, date, record_type, doctor, description, result, notes):
        """Create a new medical record."""
        db = get_db()
        record_data = {
            "patient_id": ObjectId(patient_id)
            if isinstance(patient_id, str)
            else patient_id,
            "date": date,
            "type": record_type,
            "doctor": doctor,
            "description": description,
            "result": result,
            "notes": notes,
        }
        result_obj = db[MEDICAL_RECORDS_COLLECTION].insert_one(record_data)
        record_data["_id"] = result_obj.inserted_id
        return record_data

    @staticmethod
    def find_by_patient_id(patient_id):
        """Get all records for a patient."""
        db = get_db()
        if isinstance(patient_id, str):
            patient_id = ObjectId(patient_id)
        return list(db[MEDICAL_RECORDS_COLLECTION].find({"patient_id": patient_id}))

    @staticmethod
    def find_by_patient_user_id(user_id):
        """Get all records for a patient by their user ID."""
        db = get_db()
        from .patient import Patient

        patient = Patient.find_by_user_id(user_id)
        if not patient:
            return []
        return list(db[MEDICAL_RECORDS_COLLECTION].find({"patient_id": patient["_id"]}))

    @staticmethod
    def find_by_id(record_id):
        """Find a medical record by ID."""
        db = get_db()
        if isinstance(record_id, str):
            record_id = ObjectId(record_id)
        return db[MEDICAL_RECORDS_COLLECTION].find_one({"_id": record_id})

    @staticmethod
    def update(record_id, update_data):
        """Update a medical record."""
        db = get_db()
        if isinstance(record_id, str):
            record_id = ObjectId(record_id)
        db[MEDICAL_RECORDS_COLLECTION].update_one(
            {"_id": record_id}, {"$set": update_data}
        )
        return MedicalRecord.find_by_id(record_id)

    @staticmethod
    def delete(record_id):
        """Delete a medical record."""
        db = get_db()
        if isinstance(record_id, str):
            record_id = ObjectId(record_id)
        return db[MEDICAL_RECORDS_COLLECTION].delete_one({"_id": record_id})

    @staticmethod
    def to_dict(record):
        """Convert medical record to dictionary."""
        return {
            "id": str(record["_id"]),
            "patient_id": str(record.get("patient_id", "")),
            "date": record.get("date", ""),
            "type": record.get("type", ""),
            "doctor": record.get("doctor", ""),
            "description": record.get("description", ""),
            "result": record.get("result", ""),
            "notes": record.get("notes", ""),
        }
