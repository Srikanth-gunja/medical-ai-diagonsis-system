import logging

from src.models.appointment import Appointment
from src.models.patient import Patient
from src import create_app

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s [%(name)s] %(message)s")
logger = logging.getLogger(__name__)

app = create_app()

with app.app_context():
    from src.database import get_db
    db = get_db()
    appts = list(db.appointments.find().limit(5))
    
    for appt in appts:
        logger.info(f"Appt id: {appt['_id']}")
        pid_str = str(appt['patient_id'])
        logger.info(f"  String patient_id: '{pid_str}'")
        
        patient = Patient.find_by_user_id(pid_str)
        logger.info(f"  Result of Patient.find_by_user_id: {bool(patient)}")
        if patient:
            name = f"{patient.get('firstName', '')} {patient.get('lastName', '')}".strip()
            logger.info(f"  Computed name: '{name}'")
