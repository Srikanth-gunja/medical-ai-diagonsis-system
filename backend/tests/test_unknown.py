def test():
    from src.models.appointment import Appointment
    from src.models.patient import Patient
    from src.models.doctor import Doctor
    from src import create_app
    app = create_app()

    with app.app_context():
        from src.database import get_db
        db = get_db()
        
        # Get Dr. Aisha Khan
        doctor = db.doctors.find_one({'name': 'Dr. Aisha Khan'})
        if not doctor:
            print("Dr. Aisha Khan not found!")
            return
            
        appts = Appointment.find_by_doctor_id(doctor['_id'])
        
        print(f"Total apps for doctor: {len(appts)}")
        for appt in appts:
            patient = Patient.find_by_user_id(str(appt["patient_id"]))
            if patient:
                name = f"{patient.get('firstName', '')} {patient.get('lastName', '')}".strip()
                print(f"Appt {appt['_id']} (Time: {appt.get('time')}, Status: {appt.get('status')}) -> Patient: {name}")
                if not name:
                    print("  Wait, FIRST/LAST NAME missing from patient document!", patient)
            else:
                print(f"Appt {appt['_id']} (Time: {appt.get('time')}, Status: {appt.get('status')}) -> UNKNOWN.")
                print(f"  patient_id in appt: {appt.get('patient_id')} Type: {type(appt.get('patient_id'))}")
                
                # Check if patient exists by _id instead
                p2 = db.patients.find_one({'_id': appt.get('patient_id')})
                if p2:
                    print(f"  Found patient by _id! Name: {p2.get('firstName')} {p2.get('lastName')}")
                else:
                    print("  Patient not found by _id either.")

if __name__ == '__main__':
    test()
