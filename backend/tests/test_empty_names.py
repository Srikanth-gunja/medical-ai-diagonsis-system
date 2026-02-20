def test():
    from src.models.appointment import Appointment
    from src.models.patient import Patient
    from src import create_app
    app = create_app()

    with app.app_context():
        from src.database import get_db
        db = get_db()
        
        appts = list(db.appointments.find())
        print(f"Total appointments in DB: {len(appts)}")
        
        empty_names = []
        for appt in appts:
            patient = Patient.find_by_user_id(str(appt["patient_id"]))
            if patient:
                name = f"{patient.get('firstName', '')} {patient.get('lastName', '')}".strip()
                if not name:
                    empty_names.append((appt, patient))
            
        print(f"Appointments with empty patient names: {len(empty_names)}")
        for appt, patient in empty_names:
            print(f"Appt {appt['_id']}: Patient User ID: {patient['user_id']}")
            print(f"  Patient doc: firstName='{patient.get('firstName')}' lastName='{patient.get('lastName')}' email='{patient.get('email')}'")

if __name__ == '__main__':
    test()
