from src.models.appointment import Appointment
from src.models.patient import Patient
from src import create_app

app = create_app()

with app.app_context():
    from src.database import get_db
    db = get_db()
    appts = list(db.appointments.find().limit(5))
    
    for appt in appts:
        print(f"Appt id: {appt['_id']}")
        pid_str = str(appt['patient_id'])
        print(f"  String patient_id: '{pid_str}'")
        
        patient = Patient.find_by_user_id(pid_str)
        print(f"  Result of Patient.find_by_user_id: {bool(patient)}")
        if patient:
            name = f"{patient.get('firstName', '')} {patient.get('lastName', '')}".strip()
            print(f"  Computed name: '{name}'")
