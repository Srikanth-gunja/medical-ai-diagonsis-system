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
        
        unknowns = []
        for appt in appts:
            patient = Patient.find_by_user_id(str(appt["patient_id"]))
            if not patient:
                unknowns.append(appt)
        
        print(f"Total unknowns: {len(unknowns)}")
        for u in unknowns:
            print(f"Appt {u['_id']}:")
            print(f"  Doctor Name: {u.get('doctor_name')}")
            print(f"  Time: {u.get('date')} {u.get('time')}")
            print(f"  Status: {u.get('status')}")
            print(f"  patient_id field: {u.get('patient_id')}")
            
            # Why is patient not found?
            # Check by raw _id
            p_by_id = db.patients.find_one({'_id': u.get('patient_id')})
            if p_by_id:
                print(f"  Wait! Found this patient by _id: {p_by_id.get('firstName')} {p_by_id.get('lastName')}")
            
            # Check if this user_id exists in users collection
            u_user = db.users.find_one({'_id': u.get('patient_id')})
            if u_user:
                print(f"  Found in users! Role: {u_user.get('role')} Email: {u_user.get('email')}")
            else:
                print(f"  NOT even found in users collection!")

if __name__ == '__main__':
    test()
