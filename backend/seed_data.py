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
from datetime import datetime, timedelta
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
    db.activities.delete_many({})
    db.schedules.delete_many({})
    db.prescriptions.delete_many({})
    db.ratings.delete_many({})
    db.notifications.delete_many({})

    print("Seeding database...")

    # Create admin user with strong credentials
    admin_user = {
        "_id": ObjectId(),
        "email": os.getenv("ADMIN_EMAIL"),
        "password": generate_password_hash(os.getenv("ADMIN_PASSWORD")),
        "role": "admin",
        "created_at": datetime.utcnow(),
    }
    db.users.insert_one(admin_user)
    print(f"✓ Created admin user")

    # Create doctor users
    doctor_users = [
        {
            "_id": ObjectId(),
            "email": "dr.rodriguez@hospital.com",
            "password": generate_password_hash("password"),
            "role": "doctor",
            "created_at": datetime.utcnow(),
        },
        {
            "_id": ObjectId(),
            "email": "dr.thompson@hospital.com",
            "password": generate_password_hash("password"),
            "role": "doctor",
            "created_at": datetime.utcnow(),
        },
        {
            "_id": ObjectId(),
            "email": "dr.anderson@hospital.com",
            "password": generate_password_hash("password"),
            "role": "doctor",
            "created_at": datetime.utcnow(),
        },
        {
            "_id": ObjectId(),
            "email": "dr.wilson@hospital.com",
            "password": generate_password_hash("password"),
            "role": "doctor",
            "created_at": datetime.utcnow(),
        },
    ]

    # Create patient users
    patient_users = [
        {
            "_id": ObjectId(),
            "email": "john.doe@example.com",
            "password": generate_password_hash("password"),
            "role": "patient",
            "created_at": datetime.utcnow(),
        },
        {
            "_id": ObjectId(),
            "email": "sarah.johnson@example.com",
            "password": generate_password_hash("password"),
            "role": "patient",
            "created_at": datetime.utcnow(),
        },
        {
            "_id": ObjectId(),
            "email": "michael.chen@example.com",
            "password": generate_password_hash("password"),
            "role": "patient",
            "created_at": datetime.utcnow(),
        },
        {
            "_id": ObjectId(),
            "email": "emily.davis@example.com",
            "password": generate_password_hash("password"),
            "role": "patient",
            "created_at": datetime.utcnow(),
        },
    ]

    # Insert all users
    all_users = doctor_users + patient_users
    db.users.insert_many(all_users)
    print(f"✓ Created {len(all_users)} users")

    # Create doctor profiles - start with 0 rating (will be calculated from reviews)
    doctors = [
        {
            "_id": ObjectId(),
            "user_id": doctor_users[0]["_id"],
            "name": "Dr. Emily Rodriguez",
            "specialty": "Pediatrics",
            "location": "New York, NY",
            "availability": ["Mon 9:00 AM - 5:00 PM", "Wed 9:00 AM - 12:00 PM", "Fri 2:00 PM - 6:00 PM"],
            "rating": 0,  # Will be calculated from actual reviews
            "rating_count": 0,
            "review_count": 0,
            "experience": 12,
            "available_today": True,
            "consultation_types": ["video", "in-person"],
            "next_available": "Today, 3:00 PM",
            "image": "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400",
            "verified": True,
            "verification_status": "verified",
        },
        {
            "_id": ObjectId(),
            "user_id": doctor_users[1]["_id"],
            "name": "Dr. David Thompson",
            "specialty": "Orthopedics",
            "location": "San Francisco, CA",
            "availability": ["Mon 8:00 AM - 4:00 PM", "Tue 8:00 AM - 4:00 PM", "Thu 10:00 AM - 6:00 PM"],
            "rating": 0,
            "rating_count": 0,
            "review_count": 0,
            "experience": 15,
            "available_today": False,
            "consultation_types": ["video", "in-person"],
            "next_available": "Tomorrow, 9:00 AM",
            "image": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400",
            "verified": True,
            "verification_status": "verified",
        },
        {
            "_id": ObjectId(),
            "user_id": doctor_users[2]["_id"],
            "name": "Dr. Lisa Anderson",
            "specialty": "Psychiatry",
            "location": "Austin, TX",
            "availability": ["Mon 10:00 AM - 6:00 PM", "Wed 10:00 AM - 6:00 PM", "Fri 10:00 AM - 4:00 PM"],
            "rating": 0,
            "rating_count": 0,
            "review_count": 0,
            "experience": 10,
            "available_today": True,
            "consultation_types": ["video"],
            "next_available": "Today, 4:30 PM",
            "image": "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400",
            "verified": True,
            "verification_status": "verified",
        },
        {
            "_id": ObjectId(),
            "user_id": doctor_users[3]["_id"],
            "name": "Dr. James Wilson",
            "specialty": "Neurology",
            "location": "Chicago, IL",
            "availability": ["Mon 9:00 AM - 5:00 PM", "Tue 9:00 AM - 5:00 PM", "Wed 9:00 AM - 5:00 PM", "Thu 9:00 AM - 5:00 PM", "Fri 9:00 AM - 3:00 PM"],
            "rating": 0,
            "rating_count": 0,
            "review_count": 0,
            "experience": 18,
            "available_today": True,
            "consultation_types": ["video", "in-person"],
            "next_available": "Today, 5:00 PM",
            "image": "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400",
            "verified": True,
            "verification_status": "verified",
        },
    ]
    db.doctors.insert_many(doctors)
    print(f"✓ Created {len(doctors)} doctor profiles")

    # Create patient profiles with enhanced data
    patients = [
        {
            "_id": ObjectId(),
            "user_id": patient_users[0]["_id"],
            "email": "john.doe@example.com",
            "firstName": "John",
            "lastName": "Doe",
            "phone": "212-555-0123",
            "address": "123 Main St, New York, NY 10001",
            "dateOfBirth": "1985-03-15",
            "gender": "male",
            "emergencyContact": "Jane Doe - 212-555-0124",
        },
        {
            "_id": ObjectId(),
            "user_id": patient_users[1]["_id"],
            "email": "sarah.johnson@example.com",
            "firstName": "Sarah",
            "lastName": "Johnson",
            "phone": "415-555-0189",
            "address": "456 Oak Ave, San Francisco, CA 94102",
            "dateOfBirth": "1978-07-22",
            "gender": "female",
            "emergencyContact": "Tom Johnson - 415-555-0190",
        },
        {
            "_id": ObjectId(),
            "user_id": patient_users[2]["_id"],
            "email": "michael.chen@example.com",
            "firstName": "Michael",
            "lastName": "Chen",
            "phone": "512-555-0167",
            "address": "789 Pine Rd, Austin, TX 78701",
            "dateOfBirth": "1990-11-08",
            "gender": "male",
            "emergencyContact": "Lisa Chen - 512-555-0168",
        },
        {
            "_id": ObjectId(),
            "user_id": patient_users[3]["_id"],
            "email": "emily.davis@example.com",
            "firstName": "Emily",
            "lastName": "Davis",
            "phone": "312-555-0145",
            "address": "321 Elm Blvd, Chicago, IL 60601",
            "dateOfBirth": "1995-05-30",
            "gender": "female",
            "emergencyContact": "Mark Davis - 312-555-0146",
        },
    ]
    db.patients.insert_many(patients)
    print(f"✓ Created {len(patients)} patient profiles")

    # Calculate dates for appointments
    today = datetime.utcnow().strftime('%Y-%m-%d')
    tomorrow = (datetime.utcnow() + timedelta(days=1)).strftime('%Y-%m-%d')
    day_after = (datetime.utcnow() + timedelta(days=2)).strftime('%Y-%m-%d')
    next_week = (datetime.utcnow() + timedelta(days=7)).strftime('%Y-%m-%d')
    yesterday = (datetime.utcnow() - timedelta(days=1)).strftime('%Y-%m-%d')
    last_week = (datetime.utcnow() - timedelta(days=7)).strftime('%Y-%m-%d')
    two_weeks_ago = (datetime.utcnow() - timedelta(days=14)).strftime('%Y-%m-%d')
    three_weeks_ago = (datetime.utcnow() - timedelta(days=21)).strftime('%Y-%m-%d')

    # Create sample appointments with varied statuses
    # Important: Completed appointments will have ratings linked to them
    appointments = [
        # John Doe's appointments
        {
            "_id": ObjectId(),
            "patient_id": patient_users[0]["_id"],
            "patient_name": "John Doe",
            "doctor_id": doctors[0]["_id"],
            "doctor_name": "Dr. Emily Rodriguez",
            "date": today,
            "time": "10:00 AM",
            "status": "confirmed",
            "type": "video",
            "symptoms": "Follow-up consultation for child vaccination",
            "created_at": datetime.utcnow() - timedelta(days=3),
        },
        {
            "_id": ObjectId(),
            "patient_id": patient_users[0]["_id"],
            "patient_name": "John Doe",
            "doctor_id": doctors[1]["_id"],
            "doctor_name": "Dr. David Thompson",
            "date": tomorrow,
            "time": "02:30 PM",
            "status": "pending",
            "type": "in-person",
            "symptoms": "Knee pain after jogging",
            "created_at": datetime.utcnow() - timedelta(days=1),
        },
        # John Doe - COMPLETED appointment with Dr. Lisa Anderson (will be rated)
        {
            "_id": ObjectId(),
            "patient_id": patient_users[0]["_id"],
            "patient_name": "John Doe",
            "doctor_id": doctors[2]["_id"],
            "doctor_name": "Dr. Lisa Anderson",
            "date": last_week,
            "time": "11:00 AM",
            "status": "completed",
            "rated": True,
            "type": "video",
            "symptoms": "Anxiety and stress management",
            "created_at": datetime.utcnow() - timedelta(days=10),
        },
        # Sarah Johnson's appointments
        {
            "_id": ObjectId(),
            "patient_id": patient_users[1]["_id"],
            "patient_name": "Sarah Johnson",
            "doctor_id": doctors[3]["_id"],
            "doctor_name": "Dr. James Wilson",
            "date": today,
            "time": "09:00 AM",
            "status": "confirmed",
            "type": "video",
            "symptoms": "Recurring headaches",
            "created_at": datetime.utcnow() - timedelta(days=2),
        },
        {
            "_id": ObjectId(),
            "patient_id": patient_users[1]["_id"],
            "patient_name": "Sarah Johnson",
            "doctor_id": doctors[0]["_id"],
            "doctor_name": "Dr. Emily Rodriguez",
            "date": day_after,
            "time": "03:00 PM",
            "status": "pending",
            "type": "in-person",
            "symptoms": "Child's routine checkup",
            "created_at": datetime.utcnow(),
        },
        # Sarah Johnson - COMPLETED appointment with Dr. Emily Rodriguez (will be rated)
        {
            "_id": ObjectId(),
            "patient_id": patient_users[1]["_id"],
            "patient_name": "Sarah Johnson",
            "doctor_id": doctors[0]["_id"],
            "doctor_name": "Dr. Emily Rodriguez",
            "date": two_weeks_ago,
            "time": "10:00 AM",
            "status": "completed",
            "rated": True,
            "type": "in-person",
            "symptoms": "Child vaccination",
            "created_at": datetime.utcnow() - timedelta(days=20),
        },
        # Sarah Johnson - COMPLETED appointment with Dr. James Wilson (will be rated)
        {
            "_id": ObjectId(),
            "patient_id": patient_users[1]["_id"],
            "patient_name": "Sarah Johnson",
            "doctor_id": doctors[3]["_id"],
            "doctor_name": "Dr. James Wilson",
            "date": three_weeks_ago,
            "time": "11:00 AM",
            "status": "completed",
            "rated": True,
            "type": "video",
            "symptoms": "Initial headache consultation",
            "created_at": datetime.utcnow() - timedelta(days=25),
        },
        # Michael Chen's appointments
        {
            "_id": ObjectId(),
            "patient_id": patient_users[2]["_id"],
            "patient_name": "Michael Chen",
            "doctor_id": doctors[1]["_id"],
            "doctor_name": "Dr. David Thompson",
            "date": today,
            "time": "11:00 AM",
            "status": "confirmed",
            "type": "in-person",
            "symptoms": "Annual physical examination",
            "created_at": datetime.utcnow() - timedelta(days=5),
        },
        # Michael Chen - COMPLETED appointment with Dr. Lisa Anderson (will be rated)
        {
            "_id": ObjectId(),
            "patient_id": patient_users[2]["_id"],
            "patient_name": "Michael Chen",
            "doctor_id": doctors[2]["_id"],
            "doctor_name": "Dr. Lisa Anderson",
            "date": yesterday,
            "time": "04:00 PM",
            "status": "completed",
            "rated": True,
            "type": "video",
            "symptoms": "Work stress consultation",
            "created_at": datetime.utcnow() - timedelta(days=8),
        },
        # Michael Chen - COMPLETED appointment with Dr. David Thompson (will be rated)
        {
            "_id": ObjectId(),
            "patient_id": patient_users[2]["_id"],
            "patient_name": "Michael Chen",
            "doctor_id": doctors[1]["_id"],
            "doctor_name": "Dr. David Thompson",
            "date": two_weeks_ago,
            "time": "02:00 PM",
            "status": "completed",
            "rated": True,
            "type": "in-person",
            "symptoms": "Back pain evaluation",
            "created_at": datetime.utcnow() - timedelta(days=18),
        },
        # Emily Davis's appointments
        {
            "_id": ObjectId(),
            "patient_id": patient_users[3]["_id"],
            "patient_name": "Emily Davis",
            "doctor_id": doctors[3]["_id"],
            "doctor_name": "Dr. James Wilson",
            "date": next_week,
            "time": "10:30 AM",
            "status": "pending",
            "type": "video",
            "symptoms": "Persistent migraines",
            "created_at": datetime.utcnow(),
        },
        # Emily Davis - COMPLETED appointment with Dr. Emily Rodriguez (will be rated)
        {
            "_id": ObjectId(),
            "patient_id": patient_users[3]["_id"],
            "patient_name": "Emily Davis",
            "doctor_id": doctors[0]["_id"],
            "doctor_name": "Dr. Emily Rodriguez",
            "date": last_week,
            "time": "09:00 AM",
            "status": "completed",
            "rated": True,
            "type": "video",
            "symptoms": "General health checkup",
            "created_at": datetime.utcnow() - timedelta(days=12),
        },
        # Emily Davis - COMPLETED appointment with Dr. James Wilson (will be rated)
        {
            "_id": ObjectId(),
            "patient_id": patient_users[3]["_id"],
            "patient_name": "Emily Davis",
            "doctor_id": doctors[3]["_id"],
            "doctor_name": "Dr. James Wilson",
            "date": two_weeks_ago,
            "time": "03:00 PM",
            "status": "completed",
            "rated": True,
            "type": "in-person",
            "symptoms": "Migraine treatment follow-up",
            "created_at": datetime.utcnow() - timedelta(days=16),
        },
    ]
    db.appointments.insert_many(appointments)
    print(f"✓ Created {len(appointments)} sample appointments")

    # Create medical records
    medical_records = [
        {
            "_id": ObjectId(),
            "patient_id": patients[0]["_id"],
            "date": last_week,
            "type": "Consultation",
            "doctor": "Dr. Lisa Anderson",
            "description": "Anxiety and stress management session",
            "result": "Diagnosed: Generalized Anxiety Disorder",
            "notes": "Recommended cognitive behavioral therapy. Follow-up in 2 weeks. Prescribed mild anxiolytic if needed.",
        },
        {
            "_id": ObjectId(),
            "patient_id": patients[0]["_id"],
            "date": "2025-12-15",
            "type": "Lab Result",
            "doctor": "Dr. Emily Rodriguez",
            "description": "Blood Test - Complete Blood Count (CBC)",
            "result": "Normal",
            "notes": "All values within normal range. Hemoglobin: 14.5 g/dL, WBC: 7,500/μL, Platelets: 250,000/μL",
        },
        {
            "_id": ObjectId(),
            "patient_id": patients[0]["_id"],
            "date": "2025-11-20",
            "type": "Vaccination",
            "doctor": "Clinic Staff",
            "description": "Flu Shot (Influenza Vaccine)",
            "result": "Completed",
            "notes": "Annual flu vaccination administered. No adverse reactions observed.",
        },
        {
            "_id": ObjectId(),
            "patient_id": patients[1]["_id"],
            "date": "2025-12-28",
            "type": "Consultation",
            "doctor": "Dr. James Wilson",
            "description": "Neurological assessment for headaches",
            "result": "Normal MRI - Tension headaches",
            "notes": "Recommended stress reduction techniques. Prescribed over-the-counter pain relief. Follow-up in 1 month if symptoms persist.",
        },
        {
            "_id": ObjectId(),
            "patient_id": patients[2]["_id"],
            "date": yesterday,
            "type": "Consultation",
            "doctor": "Dr. Lisa Anderson",
            "description": "Work stress counseling session",
            "result": "Completed",
            "notes": "Discussed work-life balance strategies. Recommended mindfulness exercises. Scheduled monthly check-ins.",
        },
        {
            "_id": ObjectId(),
            "patient_id": patients[2]["_id"],
            "date": "2025-12-01",
            "type": "Lab Result",
            "doctor": "Dr. David Thompson",
            "description": "Lipid Panel",
            "result": "Slightly Elevated",
            "notes": "Total Cholesterol: 215 mg/dL, LDL: 140 mg/dL, HDL: 55 mg/dL. Recommended dietary changes and exercise.",
        },
    ]
    db.medical_records.insert_many(medical_records)
    print(f"✓ Created {len(medical_records)} medical records")

    # Create activities for patients
    activities = [
        # John Doe's activities
        {
            "_id": ObjectId(),
            "user_id": patient_users[0]["_id"],
            "type": "appointment",
            "title": "Appointment Confirmed",
            "description": f"Video consultation with Dr. Emily Rodriguez on {today}",
            "timestamp": datetime.utcnow() - timedelta(hours=2),
            "icon": "CheckCircleIcon",
            "color": "bg-success",
        },
        {
            "_id": ObjectId(),
            "user_id": patient_users[0]["_id"],
            "type": "prescription",
            "title": "New Prescription",
            "description": "Dr. Lisa Anderson prescribed Lorazepam 0.5mg",
            "timestamp": datetime.utcnow() - timedelta(days=1),
            "icon": "ClipboardDocumentListIcon",
            "color": "bg-accent",
        },
        {
            "_id": ObjectId(),
            "user_id": patient_users[0]["_id"],
            "type": "report",
            "title": "Lab Results Available",
            "description": "Blood test results are ready to view",
            "timestamp": datetime.utcnow() - timedelta(days=2),
            "icon": "DocumentTextIcon",
            "color": "bg-primary",
        },
        {
            "_id": ObjectId(),
            "user_id": patient_users[0]["_id"],
            "type": "appointment",
            "title": "Appointment Completed",
            "description": "Session with Dr. Lisa Anderson completed",
            "timestamp": datetime.utcnow() - timedelta(days=7),
            "icon": "CheckCircleIcon",
            "color": "bg-success",
        },
        # Sarah Johnson's activities
        {
            "_id": ObjectId(),
            "user_id": patient_users[1]["_id"],
            "type": "appointment",
            "title": "Appointment Confirmed",
            "description": f"Video consultation with Dr. James Wilson on {today}",
            "timestamp": datetime.utcnow() - timedelta(hours=5),
            "icon": "CheckCircleIcon",
            "color": "bg-success",
        },
        {
            "_id": ObjectId(),
            "user_id": patient_users[1]["_id"],
            "type": "report",
            "title": "MRI Results Available",
            "description": "Brain MRI scan results are ready",
            "timestamp": datetime.utcnow() - timedelta(days=3),
            "icon": "DocumentTextIcon",
            "color": "bg-primary",
        },
        # Michael Chen's activities
        {
            "_id": ObjectId(),
            "user_id": patient_users[2]["_id"],
            "type": "appointment",
            "title": "Consultation Completed",
            "description": "Stress counseling with Dr. Lisa Anderson completed",
            "timestamp": datetime.utcnow() - timedelta(days=1),
            "icon": "CheckCircleIcon",
            "color": "bg-success",
        },
        {
            "_id": ObjectId(),
            "user_id": patient_users[2]["_id"],
            "type": "report",
            "title": "Lipid Panel Results",
            "description": "Cholesterol test results require attention",
            "timestamp": datetime.utcnow() - timedelta(days=14),
            "icon": "ExclamationTriangleIcon",
            "color": "bg-warning",
        },
    ]
    db.activities.insert_many(activities)
    print(f"✓ Created {len(activities)} patient activities")

    # Create doctor schedules
    schedules = [
        {
            "_id": ObjectId(),
            "doctor_id": doctors[0]["_id"],
            "weekly_schedule": {
                "monday": {"enabled": True, "start": "09:00", "end": "17:00"},
                "tuesday": {"enabled": False},
                "wednesday": {"enabled": True, "start": "09:00", "end": "12:00"},
                "thursday": {"enabled": False},
                "friday": {"enabled": True, "start": "14:00", "end": "18:00"},
                "saturday": {"enabled": False},
                "sunday": {"enabled": False},
            },
            "blocked_dates": [],
        },
        {
            "_id": ObjectId(),
            "doctor_id": doctors[1]["_id"],
            "weekly_schedule": {
                "monday": {"enabled": True, "start": "08:00", "end": "16:00"},
                "tuesday": {"enabled": True, "start": "08:00", "end": "16:00"},
                "wednesday": {"enabled": False},
                "thursday": {"enabled": True, "start": "10:00", "end": "18:00"},
                "friday": {"enabled": False},
                "saturday": {"enabled": False},
                "sunday": {"enabled": False},
            },
            "blocked_dates": [],
        },
        {
            "_id": ObjectId(),
            "doctor_id": doctors[2]["_id"],
            "weekly_schedule": {
                "monday": {"enabled": True, "start": "10:00", "end": "18:00"},
                "tuesday": {"enabled": False},
                "wednesday": {"enabled": True, "start": "10:00", "end": "18:00"},
                "thursday": {"enabled": False},
                "friday": {"enabled": True, "start": "10:00", "end": "16:00"},
                "saturday": {"enabled": False},
                "sunday": {"enabled": False},
            },
            "blocked_dates": [],
        },
        {
            "_id": ObjectId(),
            "doctor_id": doctors[3]["_id"],
            "weekly_schedule": {
                "monday": {"enabled": True, "start": "09:00", "end": "17:00"},
                "tuesday": {"enabled": True, "start": "09:00", "end": "17:00"},
                "wednesday": {"enabled": True, "start": "09:00", "end": "17:00"},
                "thursday": {"enabled": True, "start": "09:00", "end": "17:00"},
                "friday": {"enabled": True, "start": "09:00", "end": "15:00"},
                "saturday": {"enabled": False},
                "sunday": {"enabled": False},
            },
            "blocked_dates": [],
        },
    ]
    db.schedules.insert_many(schedules)
    print(f"✓ Created {len(schedules)} doctor schedules")

    # Create sample prescriptions linked to completed appointments
    prescriptions = [
        {
            "_id": ObjectId(),
            "patient_id": patients[0]["_id"],
            "doctor_id": doctors[2]["_id"],
            "appointment_id": appointments[2]["_id"],  # John Doe's completed appointment with Dr. Anderson
            "medications": [
                {"name": "Lorazepam", "dosage": "0.5mg", "frequency": "Once daily at bedtime", "duration": "2 weeks"},
            ],
            "notes": "Take as needed for acute anxiety. Do not exceed recommended dose.",
            "created_at": datetime.utcnow() - timedelta(days=7),
        },
        {
            "_id": ObjectId(),
            "patient_id": patients[2]["_id"],
            "doctor_id": doctors[1]["_id"],
            "appointment_id": appointments[10]["_id"],  # Michael Chen's completed appointment with Dr. Thompson
            "medications": [
                {"name": "Atorvastatin", "dosage": "10mg", "frequency": "Once daily", "duration": "30 days"},
                {"name": "Omega-3 Fish Oil", "dosage": "1000mg", "frequency": "Twice daily with meals", "duration": "90 days"},
            ],
            "notes": "For cholesterol management. Follow up with lipid panel in 3 months.",
            "created_at": datetime.utcnow() - timedelta(days=14),
        },
    ]
    db.prescriptions.insert_many(prescriptions)
    print(f"✓ Created {len(prescriptions)} prescriptions")

    # Create realistic ratings linked to ACTUAL completed appointments
    # Each rating corresponds to a real completed appointment relationship
    ratings = [
        # Dr. Emily Rodriguez ratings (3 ratings from completed appointments)
        {
            "_id": ObjectId(),
            "doctor_id": doctors[0]["_id"],
            "patient_id": patient_users[1]["_id"],  # Sarah Johnson
            "appointment_id": appointments[5]["_id"],  # Sarah's completed appointment
            "score": 5,
            "comment": "Excellent pediatrician! Very patient and thorough with my child. Dr. Rodriguez explained everything clearly and made my daughter feel comfortable.",
            "created_at": datetime.utcnow() - timedelta(days=14),
        },
        {
            "_id": ObjectId(),
            "doctor_id": doctors[0]["_id"],
            "patient_id": patient_users[3]["_id"],  # Emily Davis
            "appointment_id": appointments[11]["_id"],  # Emily's completed appointment with Dr. Rodriguez
            "score": 5,
            "comment": "Very professional and caring doctor. Made me feel at ease and answered all my questions thoroughly.",
            "created_at": datetime.utcnow() - timedelta(days=7),
        },
        # Dr. David Thompson ratings (2 ratings from completed appointments)
        {
            "_id": ObjectId(),
            "doctor_id": doctors[1]["_id"],
            "patient_id": patient_users[2]["_id"],  # Michael Chen
            "appointment_id": appointments[9]["_id"],  # Michael's completed back pain appointment
            "score": 4,
            "comment": "Great orthopedic specialist. Provided helpful exercises and treatment plan for my back pain. The wait was a bit long but worth it.",
            "created_at": datetime.utcnow() - timedelta(days=14),
        },
        # Dr. Lisa Anderson ratings (2 ratings from completed appointments)
        {
            "_id": ObjectId(),
            "doctor_id": doctors[2]["_id"],
            "patient_id": patient_users[0]["_id"],  # John Doe
            "appointment_id": appointments[2]["_id"],  # John's completed appointment
            "score": 5,
            "comment": "Dr. Anderson is incredibly understanding and helpful. She provided excellent guidance for managing my anxiety. Highly recommend for mental health support.",
            "created_at": datetime.utcnow() - timedelta(days=7),
        },
        {
            "_id": ObjectId(),
            "doctor_id": doctors[2]["_id"],
            "patient_id": patient_users[2]["_id"],  # Michael Chen
            "appointment_id": appointments[8]["_id"],  # Michael's completed stress consultation
            "score": 5,
            "comment": "Really helpful session. Dr. Anderson gave me practical strategies to manage work stress. I feel much better already.",
            "created_at": datetime.utcnow() - timedelta(days=1),
        },
        # Dr. James Wilson ratings (3 ratings from completed appointments)
        {
            "_id": ObjectId(),
            "doctor_id": doctors[3]["_id"],
            "patient_id": patient_users[1]["_id"],  # Sarah Johnson
            "appointment_id": appointments[6]["_id"],  # Sarah's initial headache consultation
            "score": 4,
            "comment": "Very knowledgeable neurologist. He ordered the right tests and explained my condition well. Wait time was a bit long but worth it.",
            "created_at": datetime.utcnow() - timedelta(days=21),
        },
        {
            "_id": ObjectId(),
            "doctor_id": doctors[3]["_id"],
            "patient_id": patient_users[3]["_id"],  # Emily Davis
            "appointment_id": appointments[12]["_id"],  # Emily's migraine follow-up
            "score": 5,
            "comment": "Excellent follow-up care for my migraines. Dr. Wilson adjusted my treatment and I'm seeing significant improvement. Thank you!",
            "created_at": datetime.utcnow() - timedelta(days=14),
        },
    ]
    db.ratings.insert_many(ratings)
    print(f"✓ Created {len(ratings)} ratings")

    # Calculate and update actual doctor ratings based on inserted reviews
    print("\n📊 Calculating doctor ratings from reviews...")
    for doctor in doctors:
        doctor_ratings = [r for r in ratings if r["doctor_id"] == doctor["_id"]]
        if doctor_ratings:
            avg_rating = sum(r["score"] for r in doctor_ratings) / len(doctor_ratings)
            rating_count = len(doctor_ratings)
            db.doctors.update_one(
                {"_id": doctor["_id"]},
                {"$set": {
                    "rating": round(avg_rating, 1),
                    "rating_count": rating_count,
                    "review_count": rating_count
                }}
            )
            print(f"   {doctor['name']}: {round(avg_rating, 1)} stars ({rating_count} reviews)")
        else:
            print(f"   {doctor['name']}: No reviews yet")

    print("\n" + "=" * 50)
    print("Database seeded successfully!")
    print("=" * 50)
    print("\nTest credentials:")
    print("-" * 50)
   
    print()
    print("Patients:")
    print("  Email: john.doe@example.com")
    print("  Password: password")
    print()
    print("  Email: sarah.johnson@example.com")
    print("  Password: password")
    print()
    print("  Email: michael.chen@example.com")
    print("  Password: password")
    print()
    print("  Email: emily.davis@example.com")
    print("  Password: password")
    print()
    print("Doctors:")
    print("  Email: dr.rodriguez@hospital.com")
    print("  Password: password")
    print()
    print("  Email: dr.thompson@hospital.com")
    print("  Password: password")
    print()
    print("  Email: dr.anderson@hospital.com")
    print("  Password: password")
    print()
    print("  Email: dr.wilson@hospital.com")
    print("  Password: password")
    print("-" * 50)

    client.close()


if __name__ == "__main__":
    seed_database()
