import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s [%(name)s] %(message)s")
logger = logging.getLogger(__name__)


def test():
    from src.models.appointment import Appointment
    from src.models.patient import Patient
    from src import create_app
    app = create_app()

    with app.app_context():
        from src.database import get_db
        db = get_db()
        
        appts = list(db.appointments.find())
        logger.info(f"Total appointments in DB: {len(appts)}")
        
        empty_names = []
        for appt in appts:
            patient = Patient.find_by_user_id(str(appt["patient_id"]))
            if patient:
                name = f"{patient.get('firstName', '')} {patient.get('lastName', '')}".strip()
                if not name:
                    empty_names.append((appt, patient))
            
        logger.info(f"Appointments with empty patient names: {len(empty_names)}")
        for appt, patient in empty_names:
            logger.info(f"Appt {appt['_id']}: Patient User ID: {patient['user_id']}")
            logger.info(f"  Patient doc: firstName='{patient.get('firstName')}' lastName='{patient.get('lastName')}' email='{patient.get('email')}'")

if __name__ == '__main__':
    test()
