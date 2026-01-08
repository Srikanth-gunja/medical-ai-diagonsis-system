#!/usr/bin/env python3
"""
Seed script to populate MongoDB with initial data for the Medical Project.
Run this script to insert doctors, patients, and sample medical records.
"""

import os
from dotenv import load_dotenv

load_dotenv()
from pymongo import MongoClient
from werkzeug.security import generate_password_hash
from datetime import datetime
from bson import ObjectId

# MongoDB connection - reads from environment variables with fallback
MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017/")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "medical_project")



def seed_database():
    """Seed the database with initial data."""
    client = MongoClient(MONGO_URI)
    db = client[MONGO_DB_NAME]

    # Clear existing data
    print("Clearing existing data...")
    db.users.delete_many({})
    db.doctors.delete_many({})
    db.patients.delete_many({})
    db.medical_records.delete_many({})
    db.appointments.delete_many({})

    print("Seeding database...")

    # Create doctor users
    doctor_users = [
        {
            "_id": ObjectId(),
            "email": "dr.smith@hospital.com",
            "password": generate_password_hash("password"),
            "role": "doctor",
            "created_at": datetime.utcnow(),
        },
        {
            "_id": ObjectId(),
            "email": "dr.doe@hospital.com",
            "password": generate_password_hash("password"),
            "role": "doctor",
            "created_at": datetime.utcnow(),
        },
        {
            "_id": ObjectId(),
            "email": "dr.white@hospital.com",
            "password": generate_password_hash("password"),
            "role": "doctor",
            "created_at": datetime.utcnow(),
        },
    ]

    # Create patient users
    patient_users = [
        {
            "_id": ObjectId(),
            "email": "patient@example.com",
            "password": generate_password_hash("password"),
            "role": "patient",
            "created_at": datetime.utcnow(),
        },
        {
            "_id": ObjectId(),
            "email": "john.patient@example.com",
            "password": generate_password_hash("password"),
            "role": "patient",
            "created_at": datetime.utcnow(),
        },
    ]

    # Insert all users
    all_users = doctor_users + patient_users
    db.users.insert_many(all_users)
    print(f"✓ Created {len(all_users)} users")

    # Create doctor profiles
    doctors = [
        {
            "_id": ObjectId(),
            "user_id": doctor_users[0]["_id"],
            "name": "Dr. Sarah Smith",
            "specialty": "Cardiology",
            "location": "New York, NY",
            "availability": ["Mon 9am-5pm", "Wed 9am-12pm", "Fri 2pm-6pm"],
            "rating": 4.8,
            "image": "https://placehold.co/100x100?text=Dr.Smith",
        },
        {
            "_id": ObjectId(),
            "user_id": doctor_users[1]["_id"],
            "name": "Dr. John Doe",
            "specialty": "Dermatology",
            "location": "San Francisco, CA",
            "availability": ["Tue 10am-4pm", "Thu 10am-4pm"],
            "rating": 4.5,
            "image": "https://placehold.co/100x100?text=Dr.Doe",
        },
        {
            "_id": ObjectId(),
            "user_id": doctor_users[2]["_id"],
            "name": "Dr. Emily White",
            "specialty": "General Practice",
            "location": "Austin, TX",
            "availability": [
                "Mon 8am-4pm",
                "Tue 8am-4pm",
                "Wed 8am-4pm",
                "Thu 8am-4pm",
                "Fri 8am-4pm",
            ],
            "rating": 4.9,
            "image": "https://placehold.co/100x100?text=Dr.White",
        },
    ]
    db.doctors.insert_many(doctors)
    print(f"✓ Created {len(doctors)} doctor profiles")

    # Create patient profiles
    patients = [
        {
            "_id": ObjectId(),
            "user_id": patient_users[0]["_id"],
            "email": "patient@example.com",
            "firstName": "John",
            "lastName": "Doe",
            "phone": "123-456-7890",
            "address": "123 Main St, New York, NY 10001",
        },
        {
            "_id": ObjectId(),
            "user_id": patient_users[1]["_id"],
            "email": "john.patient@example.com",
            "firstName": "Jane",
            "lastName": "Smith",
            "phone": "987-654-3210",
            "address": "456 Oak Ave, San Francisco, CA 94102",
        },
    ]
    db.patients.insert_many(patients)
    print(f"✓ Created {len(patients)} patient profiles")

    # Create medical records for the first patient
    medical_records = [
        {
            "_id": ObjectId(),
            "patient_id": patients[0]["_id"],
            "date": "2023-09-15",
            "type": "Lab Result",
            "doctor": "Dr. Sarah Smith",
            "description": "Blood Test - Complete Blood Count (CBC)",
            "result": "Normal",
            "notes": "All values within normal range. Hemoglobin: 14.5 g/dL, WBC: 7,500/μL, Platelets: 250,000/μL",
        },
        {
            "_id": ObjectId(),
            "patient_id": patients[0]["_id"],
            "date": "2023-08-10",
            "type": "Consultation",
            "doctor": "Dr. John Doe",
            "description": "Skin Rash Checkup",
            "result": "Diagnosed: Contact Dermatitis",
            "notes": "Prescribed hydrocortisone cream 1%. Apply twice daily for 2 weeks. Avoid known allergens.",
        },
        {
            "_id": ObjectId(),
            "patient_id": patients[0]["_id"],
            "date": "2023-01-20",
            "type": "Vaccination",
            "doctor": "Clinic Staff",
            "description": "Flu Shot (Influenza Vaccine)",
            "result": "Completed",
            "notes": "Annual flu vaccination administered. No adverse reactions observed.",
        },
        {
            "_id": ObjectId(),
            "patient_id": patients[0]["_id"],
            "date": "2023-06-05",
            "type": "Lab Result",
            "doctor": "Dr. Emily White",
            "description": "Lipid Panel",
            "result": "Slightly Elevated",
            "notes": "Total Cholesterol: 215 mg/dL, LDL: 140 mg/dL, HDL: 55 mg/dL. Recommended dietary changes.",
        },
        {
            "_id": ObjectId(),
            "patient_id": patients[1]["_id"],
            "date": "2023-11-12",
            "type": "Consultation",
            "doctor": "Dr. Sarah Smith",
            "description": "Annual Heart Checkup",
            "result": "Normal",
            "notes": "ECG normal. Blood pressure 120/80. Heart sounds normal. No concerns.",
        },
    ]
    db.medical_records.insert_many(medical_records)
    print(f"✓ Created {len(medical_records)} medical records")

    # Create sample appointments
    appointments = [
        {
            "_id": ObjectId(),
            "patient_id": patient_users[0]["_id"],
            "doctor_id": doctors[0]["_id"],
            "doctor_name": "Dr. Sarah Smith",
            "date": "2024-01-15",
            "time": "10:00 AM",
            "status": "confirmed",
            "symptoms": "Regular checkup",
            "created_at": datetime.utcnow(),
        },
        {
            "_id": ObjectId(),
            "patient_id": patient_users[0]["_id"],
            "doctor_id": doctors[2]["_id"],
            "doctor_name": "Dr. Emily White",
            "date": "2024-01-20",
            "time": "2:00 PM",
            "status": "pending",
            "symptoms": "Mild headache and fatigue",
            "created_at": datetime.utcnow(),
        },
    ]
    db.appointments.insert_many(appointments)
    print(f"✓ Created {len(appointments)} sample appointments")

    print("\n" + "=" * 50)
    print("Database seeded successfully!")
    print("=" * 50)
    print("\nTest credentials:")
    print("-" * 50)
    print("Patients:")
    print("  Email: patient@example.com")
    print("  Password: password")
    print()
    print("  Email: john.patient@example.com")
    print("  Password: password")
    print()
    print("Doctors:")
    print("  Email: dr.smith@hospital.com")
    print("  Password: password")
    print()
    print("  Email: dr.doe@hospital.com")
    print("  Password: password")
    print()
    print("  Email: dr.white@hospital.com")
    print("  Password: password")
    print("-" * 50)

    client.close()


if __name__ == "__main__":
    seed_database()
