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
        appts = list(db.appointments.find().limit(1))
        
        result = []
        for appt in appts:
            appt_dict = Appointment.to_dict(appt)
            patient = Patient.find_by_user_id(str(appt["patient_id"]))
            if patient:
                appt_dict["patientName"] = f"{patient.get('firstName', '')} {patient.get('lastName', '')}".strip()
            result.append(appt_dict)
            
        logger.info("API Response items[0]:")
        import json
        logger.info(json.dumps(result[0], indent=2))

if __name__ == '__main__':
    test()
