import os
import logging
from dotenv import load_dotenv
load_dotenv()
from pymongo import MongoClient

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s [%(name)s] %(message)s")
logger = logging.getLogger(__name__)


def main():
    uri = os.getenv("MONGO_URI")
    logger.info(f"Connecting to: {uri[:20]}...")
    db = MongoClient(uri)['medical_project']
    appointments = list(db.appointments.find().limit(5))
    logger.info(f"Total appointments checked: {len(appointments)}")
    for a in appointments:
        patient_id = a.get('patient_id')
        logger.info(f"Appt: {a['_id']} | patient_id: {patient_id} (Type: {type(patient_id)})")
        
        # Check if match by user_id
        p1 = db.patients.find_one({'user_id': patient_id})
        logger.info(f"  Match by user_id: {bool(p1)}")
        if p1:
            logger.info(f"    Name: {p1.get('firstName')} {p1.get('lastName')}")
            
        # Check if match by _id
        p2 = db.patients.find_one({'_id': patient_id})
        logger.info(f"  Match by _id: {bool(p2)}")
        if p2:
            logger.info(f"    Name: {p2.get('firstName')} {p2.get('lastName')}")

if __name__ == '__main__':
    main()
