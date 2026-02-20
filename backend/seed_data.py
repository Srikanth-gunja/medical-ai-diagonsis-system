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
DEFAULT_DOCTOR_PROFILE_IMAGE = os.getenv(
    "DEFAULT_DOCTOR_PROFILE_IMAGE",
    "/assets/images/doctor_profile.png",
)
DEFAULT_PATIENT_PROFILE_IMAGE = os.getenv(
    "DEFAULT_PATIENT_PROFILE_IMAGE",
    "/assets/images/patient_profile.png",
)


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
    doctor_users.extend(
        [
            {
                "_id": ObjectId(),
                "email": "dr.arjun.mehta@hospital.in",
                "password": generate_password_hash("password"),
                "role": "doctor",
                "created_at": datetime.utcnow(),
            },
            {
                "_id": ObjectId(),
                "email": "dr.priya.nair@hospital.in",
                "password": generate_password_hash("password"),
                "role": "doctor",
                "created_at": datetime.utcnow(),
            },
            {
                "_id": ObjectId(),
                "email": "dr.karthik.reddy@hospital.in",
                "password": generate_password_hash("password"),
                "role": "doctor",
                "created_at": datetime.utcnow(),
            },
            {
                "_id": ObjectId(),
                "email": "dr.neha.sharma@hospital.in",
                "password": generate_password_hash("password"),
                "role": "doctor",
                "created_at": datetime.utcnow(),
            },
            {
                "_id": ObjectId(),
                "email": "dr.rohan.banerjee@hospital.in",
                "password": generate_password_hash("password"),
                "role": "doctor",
                "created_at": datetime.utcnow(),
            },
            {
                "_id": ObjectId(),
                "email": "dr.aisha.khan@hospital.in",
                "password": generate_password_hash("password"),
                "role": "doctor",
                "created_at": datetime.utcnow(),
            },
            {
                "_id": ObjectId(),
                "email": "dr.vikram.patel@hospital.in",
                "password": generate_password_hash("password"),
                "role": "doctor",
                "created_at": datetime.utcnow(),
            },
            {
                "_id": ObjectId(),
                "email": "dr.isha.kapoor@hospital.in",
                "password": generate_password_hash("password"),
                "role": "doctor",
                "created_at": datetime.utcnow(),
            },
            {
                "_id": ObjectId(),
                "email": "dr.sandeep.iyer@hospital.in",
                "password": generate_password_hash("password"),
                "role": "doctor",
                "created_at": datetime.utcnow(),
            },
            {
                "_id": ObjectId(),
                "email": "dr.manisha.joshi@hospital.in",
                "password": generate_password_hash("password"),
                "role": "doctor",
                "created_at": datetime.utcnow(),
            },
        ]
    )

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
    patient_users.extend(
        [
            {
                "_id": ObjectId(),
                "email": "rahul.verma@example.in",
                "password": generate_password_hash("password"),
                "role": "patient",
                "created_at": datetime.utcnow(),
            },
            {
                "_id": ObjectId(),
                "email": "ananya.iyer@example.in",
                "password": generate_password_hash("password"),
                "role": "patient",
                "created_at": datetime.utcnow(),
            },
            {
                "_id": ObjectId(),
                "email": "pradeep.singh@example.in",
                "password": generate_password_hash("password"),
                "role": "patient",
                "created_at": datetime.utcnow(),
            },
            {
                "_id": ObjectId(),
                "email": "meera.patel@example.in",
                "password": generate_password_hash("password"),
                "role": "patient",
                "created_at": datetime.utcnow(),
            },
            {
                "_id": ObjectId(),
                "email": "farhan.ali@example.in",
                "password": generate_password_hash("password"),
                "role": "patient",
                "created_at": datetime.utcnow(),
            },
            {
                "_id": ObjectId(),
                "email": "kavya.reddy@example.in",
                "password": generate_password_hash("password"),
                "role": "patient",
                "created_at": datetime.utcnow(),
            },
        ]
    )

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
            "image": DEFAULT_DOCTOR_PROFILE_IMAGE,
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
            "image": DEFAULT_DOCTOR_PROFILE_IMAGE,
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
            "image": DEFAULT_DOCTOR_PROFILE_IMAGE,
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
            "image": DEFAULT_DOCTOR_PROFILE_IMAGE,
            "verified": True,
            "verification_status": "verified",
        },
    ]
    doctors.extend(
        [
            {
                "_id": ObjectId(),
                "user_id": doctor_users[4]["_id"],
                "name": "Dr. Arjun Mehta",
                "specialty": "Cardiology",
                "location": "Mumbai, Maharashtra",
                "availability": ["Mon 9:00 AM - 5:00 PM", "Tue 9:00 AM - 2:00 PM", "Thu 10:00 AM - 6:00 PM"],
                "rating": 0,
                "rating_count": 0,
                "review_count": 0,
                "experience": 14,
                "available_today": True,
                "consultation_types": ["video", "in-person"],
                "next_available": "Today, 5:30 PM",
                "image": DEFAULT_DOCTOR_PROFILE_IMAGE,
                "verified": True,
                "verification_status": "verified",
            },
            {
                "_id": ObjectId(),
                "user_id": doctor_users[5]["_id"],
                "name": "Dr. Priya Nair",
                "specialty": "Dermatology",
                "location": "Kochi, Kerala",
                "availability": ["Mon 10:00 AM - 6:00 PM", "Wed 10:00 AM - 6:00 PM", "Sat 9:00 AM - 1:00 PM"],
                "rating": 0,
                "rating_count": 0,
                "review_count": 0,
                "experience": 11,
                "available_today": True,
                "consultation_types": ["video", "in-person"],
                "next_available": "Today, 4:00 PM",
                "image": DEFAULT_DOCTOR_PROFILE_IMAGE,
                "verified": True,
                "verification_status": "verified",
            },
            {
                "_id": ObjectId(),
                "user_id": doctor_users[6]["_id"],
                "name": "Dr. Karthik Reddy",
                "specialty": "Endocrinology",
                "location": "Hyderabad, Telangana",
                "availability": ["Tue 9:00 AM - 5:00 PM", "Thu 9:00 AM - 5:00 PM", "Fri 9:00 AM - 2:00 PM"],
                "rating": 0,
                "rating_count": 0,
                "review_count": 0,
                "experience": 13,
                "available_today": False,
                "consultation_types": ["video", "in-person"],
                "next_available": "Tomorrow, 10:30 AM",
                "image": DEFAULT_DOCTOR_PROFILE_IMAGE,
                "verified": True,
                "verification_status": "verified",
            },
            {
                "_id": ObjectId(),
                "user_id": doctor_users[7]["_id"],
                "name": "Dr. Neha Sharma",
                "specialty": "Gynecology",
                "location": "Delhi, NCR",
                "availability": ["Mon 8:30 AM - 4:30 PM", "Wed 8:30 AM - 4:30 PM", "Fri 8:30 AM - 2:30 PM"],
                "rating": 0,
                "rating_count": 0,
                "review_count": 0,
                "experience": 16,
                "available_today": True,
                "consultation_types": ["video", "in-person"],
                "next_available": "Today, 2:45 PM",
                "image": DEFAULT_DOCTOR_PROFILE_IMAGE,
                "verified": True,
                "verification_status": "verified",
            },
            {
                "_id": ObjectId(),
                "user_id": doctor_users[8]["_id"],
                "name": "Dr. Rohan Banerjee",
                "specialty": "Pulmonology",
                "location": "Kolkata, West Bengal",
                "availability": ["Mon 9:00 AM - 5:00 PM", "Tue 9:00 AM - 5:00 PM", "Sat 10:00 AM - 2:00 PM"],
                "rating": 0,
                "rating_count": 0,
                "review_count": 0,
                "experience": 12,
                "available_today": True,
                "consultation_types": ["video", "in-person"],
                "next_available": "Today, 6:00 PM",
                "image": DEFAULT_DOCTOR_PROFILE_IMAGE,
                "verified": True,
                "verification_status": "verified",
            },
            {
                "_id": ObjectId(),
                "user_id": doctor_users[9]["_id"],
                "name": "Dr. Aisha Khan",
                "specialty": "ENT",
                "location": "Lucknow, Uttar Pradesh",
                "availability": ["Tue 10:00 AM - 6:00 PM", "Thu 10:00 AM - 6:00 PM", "Sat 9:00 AM - 1:00 PM"],
                "rating": 0,
                "rating_count": 0,
                "review_count": 0,
                "experience": 9,
                "available_today": False,
                "consultation_types": ["video", "in-person"],
                "next_available": "Tomorrow, 11:00 AM",
                "image": DEFAULT_DOCTOR_PROFILE_IMAGE,
                "verified": True,
                "verification_status": "verified",
            },
            {
                "_id": ObjectId(),
                "user_id": doctor_users[10]["_id"],
                "name": "Dr. Vikram Patel",
                "specialty": "Gastroenterology",
                "location": "Ahmedabad, Gujarat",
                "availability": ["Mon 9:30 AM - 5:30 PM", "Wed 9:30 AM - 5:30 PM", "Fri 9:30 AM - 3:00 PM"],
                "rating": 0,
                "rating_count": 0,
                "review_count": 0,
                "experience": 15,
                "available_today": True,
                "consultation_types": ["video", "in-person"],
                "next_available": "Today, 4:30 PM",
                "image": DEFAULT_DOCTOR_PROFILE_IMAGE,
                "verified": True,
                "verification_status": "verified",
            },
            {
                "_id": ObjectId(),
                "user_id": doctor_users[11]["_id"],
                "name": "Dr. Isha Kapoor",
                "specialty": "Ophthalmology",
                "location": "Chandigarh, Chandigarh",
                "availability": ["Mon 10:00 AM - 6:00 PM", "Wed 10:00 AM - 6:00 PM", "Thu 10:00 AM - 2:00 PM"],
                "rating": 0,
                "rating_count": 0,
                "review_count": 0,
                "experience": 10,
                "available_today": True,
                "consultation_types": ["video", "in-person"],
                "next_available": "Today, 3:30 PM",
                "image": DEFAULT_DOCTOR_PROFILE_IMAGE,
                "verified": True,
                "verification_status": "verified",
            },
            {
                "_id": ObjectId(),
                "user_id": doctor_users[12]["_id"],
                "name": "Dr. Sandeep Iyer",
                "specialty": "Nephrology",
                "location": "Chennai, Tamil Nadu",
                "availability": ["Tue 9:00 AM - 5:00 PM", "Thu 9:00 AM - 5:00 PM", "Fri 9:00 AM - 1:00 PM"],
                "rating": 0,
                "rating_count": 0,
                "review_count": 0,
                "experience": 17,
                "available_today": False,
                "consultation_types": ["video", "in-person"],
                "next_available": "Tomorrow, 9:30 AM",
                "image": DEFAULT_DOCTOR_PROFILE_IMAGE,
                "verified": True,
                "verification_status": "verified",
            },
            {
                "_id": ObjectId(),
                "user_id": doctor_users[13]["_id"],
                "name": "Dr. Manisha Joshi",
                "specialty": "General Medicine",
                "location": "Pune, Maharashtra",
                "availability": ["Mon 8:00 AM - 4:00 PM", "Tue 8:00 AM - 4:00 PM", "Thu 8:00 AM - 2:00 PM"],
                "rating": 0,
                "rating_count": 0,
                "review_count": 0,
                "experience": 8,
                "available_today": True,
                "consultation_types": ["video", "in-person"],
                "next_available": "Today, 1:30 PM",
                "image": DEFAULT_DOCTOR_PROFILE_IMAGE,
                "verified": True,
                "verification_status": "verified",
            },
        ]
    )
    for doctor in doctors:
        doctor["image"] = DEFAULT_DOCTOR_PROFILE_IMAGE

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
    patients.extend(
        [
            {
                "_id": ObjectId(),
                "user_id": patient_users[4]["_id"],
                "email": "rahul.verma@example.in",
                "firstName": "Rahul",
                "lastName": "Verma",
                "phone": "+91-98765-21001",
                "address": "Flat 12B, Lake View Residency, Andheri East, Mumbai, Maharashtra 400059",
                "dateOfBirth": "1988-09-12",
                "gender": "male",
                "bloodGroup": "B+",
                "city": "Mumbai",
                "state": "Maharashtra",
                "zipCode": "400059",
                "emergencyContactName": "Pooja Verma",
                "emergencyContactPhone": "+91-98765-21002",
                "allergies": "Penicillin",
                "currentMedications": "Metformin 500mg",
                "chronicConditions": ["Type 2 Diabetes"],
                "insuranceProvider": "Star Health",
                "insurancePolicyNumber": "SH-2026-11209",
            },
            {
                "_id": ObjectId(),
                "user_id": patient_users[5]["_id"],
                "email": "ananya.iyer@example.in",
                "firstName": "Ananya",
                "lastName": "Iyer",
                "phone": "+91-98450-32010",
                "address": "No. 7, 4th Cross, Indiranagar, Bengaluru, Karnataka 560038",
                "dateOfBirth": "1992-04-03",
                "gender": "female",
                "bloodGroup": "O+",
                "city": "Bengaluru",
                "state": "Karnataka",
                "zipCode": "560038",
                "emergencyContactName": "S. R. Iyer",
                "emergencyContactPhone": "+91-98450-32011",
                "allergies": "None",
                "currentMedications": "",
                "chronicConditions": ["Family history of hypertension"],
                "insuranceProvider": "HDFC Ergo",
                "insurancePolicyNumber": "HE-2026-49018",
            },
            {
                "_id": ObjectId(),
                "user_id": patient_users[6]["_id"],
                "email": "pradeep.singh@example.in",
                "firstName": "Pradeep",
                "lastName": "Singh",
                "phone": "+91-98110-44022",
                "address": "C-14, Sector 62, Noida, Uttar Pradesh 201309",
                "dateOfBirth": "1981-01-25",
                "gender": "male",
                "bloodGroup": "A+",
                "city": "Noida",
                "state": "Uttar Pradesh",
                "zipCode": "201309",
                "emergencyContactName": "Neelam Singh",
                "emergencyContactPhone": "+91-98110-44023",
                "allergies": "Dust allergy",
                "currentMedications": "Pantoprazole 40mg",
                "chronicConditions": ["Acid reflux"],
                "insuranceProvider": "ICICI Lombard",
                "insurancePolicyNumber": "ICL-2026-66820",
            },
            {
                "_id": ObjectId(),
                "user_id": patient_users[7]["_id"],
                "email": "meera.patel@example.in",
                "firstName": "Meera",
                "lastName": "Patel",
                "phone": "+91-98250-55133",
                "address": "B-302, Shree Residency, Satellite, Ahmedabad, Gujarat 380015",
                "dateOfBirth": "1994-12-11",
                "gender": "female",
                "bloodGroup": "AB+",
                "city": "Ahmedabad",
                "state": "Gujarat",
                "zipCode": "380015",
                "emergencyContactName": "Harsh Patel",
                "emergencyContactPhone": "+91-98250-55134",
                "allergies": "None",
                "currentMedications": "Iron and folic acid supplements",
                "chronicConditions": [],
                "insuranceProvider": "Niva Bupa",
                "insurancePolicyNumber": "NB-2026-77931",
            },
            {
                "_id": ObjectId(),
                "user_id": patient_users[8]["_id"],
                "email": "farhan.ali@example.in",
                "firstName": "Farhan",
                "lastName": "Ali",
                "phone": "+91-98300-66144",
                "address": "27 Park Circus, Kolkata, West Bengal 700017",
                "dateOfBirth": "1986-06-29",
                "gender": "male",
                "bloodGroup": "O-",
                "city": "Kolkata",
                "state": "West Bengal",
                "zipCode": "700017",
                "emergencyContactName": "Sana Ali",
                "emergencyContactPhone": "+91-98300-66145",
                "allergies": "Pollen",
                "currentMedications": "Budesonide inhaler",
                "chronicConditions": ["Mild asthma"],
                "insuranceProvider": "Care Health",
                "insurancePolicyNumber": "CH-2026-90211",
            },
            {
                "_id": ObjectId(),
                "user_id": patient_users[9]["_id"],
                "email": "kavya.reddy@example.in",
                "firstName": "Kavya",
                "lastName": "Reddy",
                "phone": "+91-99590-77255",
                "address": "Plot 44, Kondapur, Hyderabad, Telangana 500084",
                "dateOfBirth": "1997-08-17",
                "gender": "female",
                "bloodGroup": "A-",
                "city": "Hyderabad",
                "state": "Telangana",
                "zipCode": "500084",
                "emergencyContactName": "Ramesh Reddy",
                "emergencyContactPhone": "+91-99590-77256",
                "allergies": "Nickel",
                "currentMedications": "Topical tretinoin",
                "chronicConditions": ["PCOS"],
                "insuranceProvider": "Aditya Birla Health",
                "insurancePolicyNumber": "ABH-2026-33570",
            },
        ]
    )
    for patient in patients:
        patient["image"] = DEFAULT_PATIENT_PROFILE_IMAGE

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
    appt_ananya_cardiology_completed = {
        "_id": ObjectId(),
        "patient_id": patient_users[5]["_id"],
        "patient_name": "Ananya Iyer",
        "doctor_id": doctors[4]["_id"],
        "doctor_name": "Dr. Arjun Mehta",
        "date": two_weeks_ago,
        "time": "10:30 AM",
        "status": "completed",
        "rated": True,
        "type": "in-person",
        "symptoms": "Episodes of palpitations and borderline high BP",
        "created_at": datetime.utcnow() - timedelta(days=17),
    }
    appt_rahul_diabetes_completed = {
        "_id": ObjectId(),
        "patient_id": patient_users[4]["_id"],
        "patient_name": "Rahul Verma",
        "doctor_id": doctors[6]["_id"],
        "doctor_name": "Dr. Karthik Reddy",
        "date": last_week,
        "time": "09:30 AM",
        "status": "completed",
        "rated": True,
        "type": "video",
        "symptoms": "High fasting sugar and fatigue",
        "created_at": datetime.utcnow() - timedelta(days=11),
    }
    appt_meera_gyn_completed = {
        "_id": ObjectId(),
        "patient_id": patient_users[7]["_id"],
        "patient_name": "Meera Patel",
        "doctor_id": doctors[7]["_id"],
        "doctor_name": "Dr. Neha Sharma",
        "date": yesterday,
        "time": "11:15 AM",
        "status": "completed",
        "rated": True,
        "type": "in-person",
        "symptoms": "Irregular cycle and low iron symptoms",
        "created_at": datetime.utcnow() - timedelta(days=5),
    }
    appt_farhan_pulmo_completed = {
        "_id": ObjectId(),
        "patient_id": patient_users[8]["_id"],
        "patient_name": "Farhan Ali",
        "doctor_id": doctors[8]["_id"],
        "doctor_name": "Dr. Rohan Banerjee",
        "date": three_weeks_ago,
        "time": "04:30 PM",
        "status": "completed",
        "rated": True,
        "type": "video",
        "symptoms": "Night cough and wheezing episodes",
        "created_at": datetime.utcnow() - timedelta(days=23),
    }
    appt_kavya_derma_completed = {
        "_id": ObjectId(),
        "patient_id": patient_users[9]["_id"],
        "patient_name": "Kavya Reddy",
        "doctor_id": doctors[5]["_id"],
        "doctor_name": "Dr. Priya Nair",
        "date": last_week,
        "time": "03:45 PM",
        "status": "completed",
        "rated": True,
        "type": "video",
        "symptoms": "Acne flare-up and post-inflammatory marks",
        "created_at": datetime.utcnow() - timedelta(days=9),
    }
    appt_pradeep_gastro_completed = {
        "_id": ObjectId(),
        "patient_id": patient_users[6]["_id"],
        "patient_name": "Pradeep Singh",
        "doctor_id": doctors[10]["_id"],
        "doctor_name": "Dr. Vikram Patel",
        "date": two_weeks_ago,
        "time": "12:15 PM",
        "status": "completed",
        "rated": True,
        "type": "in-person",
        "symptoms": "Acidity, bloating and early satiety",
        "created_at": datetime.utcnow() - timedelta(days=16),
    }
    appt_rahul_eye_completed = {
        "_id": ObjectId(),
        "patient_id": patient_users[4]["_id"],
        "patient_name": "Rahul Verma",
        "doctor_id": doctors[11]["_id"],
        "doctor_name": "Dr. Isha Kapoor",
        "date": yesterday,
        "time": "05:00 PM",
        "status": "completed",
        "rated": True,
        "type": "in-person",
        "symptoms": "Eye strain and dryness from long screen hours",
        "created_at": datetime.utcnow() - timedelta(days=6),
    }
    appt_ananya_nephro_completed = {
        "_id": ObjectId(),
        "patient_id": patient_users[5]["_id"],
        "patient_name": "Ananya Iyer",
        "doctor_id": doctors[12]["_id"],
        "doctor_name": "Dr. Sandeep Iyer",
        "date": last_week,
        "time": "01:00 PM",
        "status": "completed",
        "rated": True,
        "type": "video",
        "symptoms": "Mild edema and elevated creatinine in annual tests",
        "created_at": datetime.utcnow() - timedelta(days=10),
    }
    appt_meera_general_completed = {
        "_id": ObjectId(),
        "patient_id": patient_users[7]["_id"],
        "patient_name": "Meera Patel",
        "doctor_id": doctors[13]["_id"],
        "doctor_name": "Dr. Manisha Joshi",
        "date": yesterday,
        "time": "10:00 AM",
        "status": "completed",
        "rated": True,
        "type": "video",
        "symptoms": "Viral fever follow-up and weakness",
        "created_at": datetime.utcnow() - timedelta(days=4),
    }
    appt_farhan_ent_completed = {
        "_id": ObjectId(),
        "patient_id": patient_users[8]["_id"],
        "patient_name": "Farhan Ali",
        "doctor_id": doctors[9]["_id"],
        "doctor_name": "Dr. Aisha Khan",
        "date": two_weeks_ago,
        "time": "11:30 AM",
        "status": "completed",
        "rated": True,
        "type": "in-person",
        "symptoms": "Chronic sinus congestion and blocked nose",
        "created_at": datetime.utcnow() - timedelta(days=15),
    }
    appt_rahul_cardio_upcoming = {
        "_id": ObjectId(),
        "patient_id": patient_users[4]["_id"],
        "patient_name": "Rahul Verma",
        "doctor_id": doctors[4]["_id"],
        "doctor_name": "Dr. Arjun Mehta",
        "date": tomorrow,
        "time": "06:00 PM",
        "status": "confirmed",
        "type": "video",
        "symptoms": "Cardiac lifestyle follow-up",
        "created_at": datetime.utcnow() - timedelta(days=1),
    }
    appt_kavya_nephro_upcoming = {
        "_id": ObjectId(),
        "patient_id": patient_users[9]["_id"],
        "patient_name": "Kavya Reddy",
        "doctor_id": doctors[12]["_id"],
        "doctor_name": "Dr. Sandeep Iyer",
        "date": next_week,
        "time": "09:30 AM",
        "status": "pending",
        "type": "video",
        "symptoms": "Kidney function review after antibiotics",
        "created_at": datetime.utcnow(),
    }
    appt_pradeep_pulmo_upcoming = {
        "_id": ObjectId(),
        "patient_id": patient_users[6]["_id"],
        "patient_name": "Pradeep Singh",
        "doctor_id": doctors[8]["_id"],
        "doctor_name": "Dr. Rohan Banerjee",
        "date": day_after,
        "time": "02:00 PM",
        "status": "confirmed",
        "type": "in-person",
        "symptoms": "Persistent cough after viral infection",
        "created_at": datetime.utcnow() - timedelta(hours=8),
    }
    appt_ananya_eye_upcoming = {
        "_id": ObjectId(),
        "patient_id": patient_users[5]["_id"],
        "patient_name": "Ananya Iyer",
        "doctor_id": doctors[11]["_id"],
        "doctor_name": "Dr. Isha Kapoor",
        "date": today,
        "time": "07:00 PM",
        "status": "confirmed",
        "type": "video",
        "symptoms": "Dry eyes and mild headache from screen exposure",
        "created_at": datetime.utcnow() - timedelta(hours=3),
    }
    appointments.extend(
        [
            appt_ananya_cardiology_completed,
            appt_rahul_diabetes_completed,
            appt_meera_gyn_completed,
            appt_farhan_pulmo_completed,
            appt_kavya_derma_completed,
            appt_pradeep_gastro_completed,
            appt_rahul_eye_completed,
            appt_ananya_nephro_completed,
            appt_meera_general_completed,
            appt_farhan_ent_completed,
            appt_rahul_cardio_upcoming,
            appt_kavya_nephro_upcoming,
            appt_pradeep_pulmo_upcoming,
            appt_ananya_eye_upcoming,
        ]
    )

    # Ensure appointments have a slot duration captured at booking time
    for appt in appointments:
        appt.setdefault("slot_duration", 30)

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
    medical_records.extend(
        [
            {
                "_id": ObjectId(),
                "patient_id": patients[4]["_id"],
                "date": last_week,
                "type": "Consultation",
                "doctor": "Dr. Karthik Reddy",
                "description": "Diabetes management review",
                "result": "HbA1c mildly elevated",
                "notes": "Adjusted metformin timing and advised evening walk after dinner.",
            },
            {
                "_id": ObjectId(),
                "patient_id": patients[5]["_id"],
                "date": two_weeks_ago,
                "type": "Consultation",
                "doctor": "Dr. Arjun Mehta",
                "description": "Cardiac risk assessment",
                "result": "No acute findings",
                "notes": "ECG normal. Recommended low-salt diet and home BP monitoring.",
            },
            {
                "_id": ObjectId(),
                "patient_id": patients[6]["_id"],
                "date": two_weeks_ago,
                "type": "Lab Result",
                "doctor": "Dr. Vikram Patel",
                "description": "Liver Function Test and H. pylori panel",
                "result": "Mild gastritis markers present",
                "notes": "Start PPI for 4 weeks and avoid late-night spicy meals.",
            },
            {
                "_id": ObjectId(),
                "patient_id": patients[7]["_id"],
                "date": yesterday,
                "type": "Consultation",
                "doctor": "Dr. Neha Sharma",
                "description": "Cycle irregularity and iron deficiency review",
                "result": "Stable, improving with supplements",
                "notes": "Continue iron supplements and follow-up CBC in 6 weeks.",
            },
            {
                "_id": ObjectId(),
                "patient_id": patients[8]["_id"],
                "date": three_weeks_ago,
                "type": "Consultation",
                "doctor": "Dr. Rohan Banerjee",
                "description": "Asthma symptom control assessment",
                "result": "Mild persistent asthma",
                "notes": "Continued inhaled steroid plan and breathing exercises explained.",
            },
            {
                "_id": ObjectId(),
                "patient_id": patients[9]["_id"],
                "date": last_week,
                "type": "Consultation",
                "doctor": "Dr. Priya Nair",
                "description": "Acne treatment follow-up",
                "result": "Improving",
                "notes": "Continue topical treatment and sun protection. Review in 1 month.",
            },
        ]
    )
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
    activities.extend(
        [
            {
                "_id": ObjectId(),
                "user_id": patient_users[4]["_id"],
                "type": "appointment",
                "title": "Follow-up Confirmed",
                "description": "Video follow-up with Dr. Arjun Mehta is confirmed",
                "timestamp": datetime.utcnow() - timedelta(hours=6),
                "icon": "CheckCircleIcon",
                "color": "bg-success",
            },
            {
                "_id": ObjectId(),
                "user_id": patient_users[5]["_id"],
                "type": "report",
                "title": "Kidney Profile Reviewed",
                "description": "Dr. Sandeep Iyer reviewed your test reports",
                "timestamp": datetime.utcnow() - timedelta(days=3),
                "icon": "DocumentTextIcon",
                "color": "bg-primary",
            },
            {
                "_id": ObjectId(),
                "user_id": patient_users[6]["_id"],
                "type": "appointment",
                "title": "Appointment Confirmed",
                "description": "In-person consultation with Dr. Rohan Banerjee on day after tomorrow",
                "timestamp": datetime.utcnow() - timedelta(hours=10),
                "icon": "CheckCircleIcon",
                "color": "bg-success",
            },
            {
                "_id": ObjectId(),
                "user_id": patient_users[7]["_id"],
                "type": "prescription",
                "title": "New Prescription",
                "description": "Dr. Neha Sharma prescribed iron and folate tablets",
                "timestamp": datetime.utcnow() - timedelta(days=1),
                "icon": "ClipboardDocumentListIcon",
                "color": "bg-accent",
            },
            {
                "_id": ObjectId(),
                "user_id": patient_users[8]["_id"],
                "type": "report",
                "title": "Spirometry Update",
                "description": "Breathing assessment notes are now available",
                "timestamp": datetime.utcnow() - timedelta(days=6),
                "icon": "DocumentTextIcon",
                "color": "bg-primary",
            },
            {
                "_id": ObjectId(),
                "user_id": patient_users[9]["_id"],
                "type": "appointment",
                "title": "Dermatology Session Completed",
                "description": "Video review with Dr. Priya Nair completed successfully",
                "timestamp": datetime.utcnow() - timedelta(days=7),
                "icon": "CheckCircleIcon",
                "color": "bg-success",
            },
        ]
    )
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
    schedules.extend(
        [
            {
                "_id": ObjectId(),
                "doctor_id": doctors[4]["_id"],
                "weekly_schedule": {
                    "monday": {"enabled": True, "start": "09:00", "end": "17:00"},
                    "tuesday": {"enabled": True, "start": "09:00", "end": "14:00"},
                    "wednesday": {"enabled": False},
                    "thursday": {"enabled": True, "start": "10:00", "end": "18:00"},
                    "friday": {"enabled": False},
                    "saturday": {"enabled": True, "start": "09:00", "end": "13:00"},
                    "sunday": {"enabled": False},
                },
                "blocked_dates": [],
            },
            {
                "_id": ObjectId(),
                "doctor_id": doctors[5]["_id"],
                "weekly_schedule": {
                    "monday": {"enabled": True, "start": "10:00", "end": "18:00"},
                    "tuesday": {"enabled": False},
                    "wednesday": {"enabled": True, "start": "10:00", "end": "18:00"},
                    "thursday": {"enabled": False},
                    "friday": {"enabled": True, "start": "10:00", "end": "16:00"},
                    "saturday": {"enabled": True, "start": "09:00", "end": "13:00"},
                    "sunday": {"enabled": False},
                },
                "blocked_dates": [],
            },
            {
                "_id": ObjectId(),
                "doctor_id": doctors[6]["_id"],
                "weekly_schedule": {
                    "monday": {"enabled": False},
                    "tuesday": {"enabled": True, "start": "09:00", "end": "17:00"},
                    "wednesday": {"enabled": False},
                    "thursday": {"enabled": True, "start": "09:00", "end": "17:00"},
                    "friday": {"enabled": True, "start": "09:00", "end": "14:00"},
                    "saturday": {"enabled": False},
                    "sunday": {"enabled": False},
                },
                "blocked_dates": [],
            },
            {
                "_id": ObjectId(),
                "doctor_id": doctors[7]["_id"],
                "weekly_schedule": {
                    "monday": {"enabled": True, "start": "08:30", "end": "16:30"},
                    "tuesday": {"enabled": False},
                    "wednesday": {"enabled": True, "start": "08:30", "end": "16:30"},
                    "thursday": {"enabled": False},
                    "friday": {"enabled": True, "start": "08:30", "end": "14:30"},
                    "saturday": {"enabled": True, "start": "09:00", "end": "12:30"},
                    "sunday": {"enabled": False},
                },
                "blocked_dates": [],
            },
            {
                "_id": ObjectId(),
                "doctor_id": doctors[8]["_id"],
                "weekly_schedule": {
                    "monday": {"enabled": True, "start": "09:00", "end": "17:00"},
                    "tuesday": {"enabled": True, "start": "09:00", "end": "17:00"},
                    "wednesday": {"enabled": False},
                    "thursday": {"enabled": True, "start": "11:00", "end": "18:00"},
                    "friday": {"enabled": False},
                    "saturday": {"enabled": True, "start": "10:00", "end": "14:00"},
                    "sunday": {"enabled": False},
                },
                "blocked_dates": [],
            },
            {
                "_id": ObjectId(),
                "doctor_id": doctors[9]["_id"],
                "weekly_schedule": {
                    "monday": {"enabled": False},
                    "tuesday": {"enabled": True, "start": "10:00", "end": "18:00"},
                    "wednesday": {"enabled": False},
                    "thursday": {"enabled": True, "start": "10:00", "end": "18:00"},
                    "friday": {"enabled": False},
                    "saturday": {"enabled": True, "start": "09:00", "end": "13:00"},
                    "sunday": {"enabled": False},
                },
                "blocked_dates": [],
            },
            {
                "_id": ObjectId(),
                "doctor_id": doctors[10]["_id"],
                "weekly_schedule": {
                    "monday": {"enabled": True, "start": "09:30", "end": "17:30"},
                    "tuesday": {"enabled": False},
                    "wednesday": {"enabled": True, "start": "09:30", "end": "17:30"},
                    "thursday": {"enabled": False},
                    "friday": {"enabled": True, "start": "09:30", "end": "15:00"},
                    "saturday": {"enabled": True, "start": "09:30", "end": "12:30"},
                    "sunday": {"enabled": False},
                },
                "blocked_dates": [],
            },
            {
                "_id": ObjectId(),
                "doctor_id": doctors[11]["_id"],
                "weekly_schedule": {
                    "monday": {"enabled": True, "start": "10:00", "end": "18:00"},
                    "tuesday": {"enabled": False},
                    "wednesday": {"enabled": True, "start": "10:00", "end": "18:00"},
                    "thursday": {"enabled": True, "start": "10:00", "end": "14:00"},
                    "friday": {"enabled": False},
                    "saturday": {"enabled": True, "start": "09:30", "end": "13:30"},
                    "sunday": {"enabled": False},
                },
                "blocked_dates": [],
            },
            {
                "_id": ObjectId(),
                "doctor_id": doctors[12]["_id"],
                "weekly_schedule": {
                    "monday": {"enabled": False},
                    "tuesday": {"enabled": True, "start": "09:00", "end": "17:00"},
                    "wednesday": {"enabled": False},
                    "thursday": {"enabled": True, "start": "09:00", "end": "17:00"},
                    "friday": {"enabled": True, "start": "09:00", "end": "13:00"},
                    "saturday": {"enabled": False},
                    "sunday": {"enabled": False},
                },
                "blocked_dates": [],
            },
            {
                "_id": ObjectId(),
                "doctor_id": doctors[13]["_id"],
                "weekly_schedule": {
                    "monday": {"enabled": True, "start": "08:00", "end": "16:00"},
                    "tuesday": {"enabled": True, "start": "08:00", "end": "16:00"},
                    "wednesday": {"enabled": False},
                    "thursday": {"enabled": True, "start": "08:00", "end": "14:00"},
                    "friday": {"enabled": False},
                    "saturday": {"enabled": True, "start": "08:30", "end": "12:30"},
                    "sunday": {"enabled": False},
                },
                "blocked_dates": [],
            },
        ]
    )
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
    prescriptions.extend(
        [
            {
                "_id": ObjectId(),
                "patient_id": patients[4]["_id"],
                "doctor_id": doctors[6]["_id"],
                "appointment_id": appt_rahul_diabetes_completed["_id"],
                "medications": [
                    {"name": "Metformin", "dosage": "500mg", "frequency": "Twice daily after meals", "duration": "30 days"},
                    {"name": "Vitamin D3", "dosage": "60,000 IU", "frequency": "Once weekly", "duration": "8 weeks"},
                ],
                "notes": "Monitor fasting and post-meal sugar logs. Repeat HbA1c after 3 months.",
                "created_at": datetime.utcnow() - timedelta(days=7),
            },
            {
                "_id": ObjectId(),
                "patient_id": patients[6]["_id"],
                "doctor_id": doctors[10]["_id"],
                "appointment_id": appt_pradeep_gastro_completed["_id"],
                "medications": [
                    {"name": "Pantoprazole", "dosage": "40mg", "frequency": "Once daily before breakfast", "duration": "4 weeks"},
                    {"name": "Domperidone", "dosage": "10mg", "frequency": "Twice daily before meals", "duration": "10 days"},
                ],
                "notes": "Avoid oily and late-night meals. Follow-up if symptoms persist beyond 2 weeks.",
                "created_at": datetime.utcnow() - timedelta(days=12),
            },
            {
                "_id": ObjectId(),
                "patient_id": patients[7]["_id"],
                "doctor_id": doctors[7]["_id"],
                "appointment_id": appt_meera_gyn_completed["_id"],
                "medications": [
                    {"name": "Ferrous Ascorbate + Folic Acid", "dosage": "1 tablet", "frequency": "Once daily after dinner", "duration": "45 days"},
                ],
                "notes": "Continue hydration and iron-rich diet. Repeat CBC in 6 weeks.",
                "created_at": datetime.utcnow() - timedelta(days=1),
            },
            {
                "_id": ObjectId(),
                "patient_id": patients[8]["_id"],
                "doctor_id": doctors[9]["_id"],
                "appointment_id": appt_farhan_ent_completed["_id"],
                "medications": [
                    {"name": "Mometasone Nasal Spray", "dosage": "2 sprays", "frequency": "Once daily", "duration": "21 days"},
                    {"name": "Levocetirizine", "dosage": "5mg", "frequency": "At bedtime", "duration": "10 days"},
                ],
                "notes": "Steam inhalation advised nightly. Avoid known dust triggers.",
                "created_at": datetime.utcnow() - timedelta(days=11),
            },
            {
                "_id": ObjectId(),
                "patient_id": patients[9]["_id"],
                "doctor_id": doctors[5]["_id"],
                "appointment_id": appt_kavya_derma_completed["_id"],
                "medications": [
                    {"name": "Adapalene Gel", "dosage": "0.1%", "frequency": "Apply thin layer at night", "duration": "8 weeks"},
                    {"name": "Clindamycin Gel", "dosage": "1%", "frequency": "Apply in morning", "duration": "6 weeks"},
                ],
                "notes": "Use non-comedogenic moisturizer and sunscreen SPF 50 daily.",
                "created_at": datetime.utcnow() - timedelta(days=6),
            },
        ]
    )
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
    ratings.extend(
        [
            {
                "_id": ObjectId(),
                "doctor_id": doctors[4]["_id"],
                "patient_id": patient_users[5]["_id"],  # Ananya Iyer
                "appointment_id": appt_ananya_cardiology_completed["_id"],
                "score": 5,
                "comment": "Dr. Mehta explained my ECG and blood pressure trend in very simple terms. Practical plan and no unnecessary tests.",
                "created_at": datetime.utcnow() - timedelta(days=13),
            },
            {
                "_id": ObjectId(),
                "doctor_id": doctors[5]["_id"],
                "patient_id": patient_users[9]["_id"],  # Kavya Reddy
                "appointment_id": appt_kavya_derma_completed["_id"],
                "score": 4,
                "comment": "Good acne treatment plan tailored for my skin. Skin is improving, only mild dryness in week one.",
                "created_at": datetime.utcnow() - timedelta(days=8),
            },
            {
                "_id": ObjectId(),
                "doctor_id": doctors[6]["_id"],
                "patient_id": patient_users[4]["_id"],  # Rahul Verma
                "appointment_id": appt_rahul_diabetes_completed["_id"],
                "score": 5,
                "comment": "Excellent diabetes consultation with detailed diet advice for Indian meals and clear sugar targets.",
                "created_at": datetime.utcnow() - timedelta(days=7),
            },
            {
                "_id": ObjectId(),
                "doctor_id": doctors[7]["_id"],
                "patient_id": patient_users[7]["_id"],  # Meera Patel
                "appointment_id": appt_meera_gyn_completed["_id"],
                "score": 5,
                "comment": "Very reassuring and respectful consultation. Dr. Sharma addressed all concerns and gave a clear follow-up plan.",
                "created_at": datetime.utcnow() - timedelta(days=1),
            },
            {
                "_id": ObjectId(),
                "doctor_id": doctors[8]["_id"],
                "patient_id": patient_users[8]["_id"],  # Farhan Ali
                "appointment_id": appt_farhan_pulmo_completed["_id"],
                "score": 4,
                "comment": "Thorough asthma review and inhaler technique correction helped reduce my night symptoms.",
                "created_at": datetime.utcnow() - timedelta(days=20),
            },
            {
                "_id": ObjectId(),
                "doctor_id": doctors[9]["_id"],
                "patient_id": patient_users[8]["_id"],  # Farhan Ali
                "appointment_id": appt_farhan_ent_completed["_id"],
                "score": 5,
                "comment": "Great ENT consultation for sinus issues. I felt better within a few days of starting treatment.",
                "created_at": datetime.utcnow() - timedelta(days=12),
            },
            {
                "_id": ObjectId(),
                "doctor_id": doctors[10]["_id"],
                "patient_id": patient_users[6]["_id"],  # Pradeep Singh
                "appointment_id": appt_pradeep_gastro_completed["_id"],
                "score": 4,
                "comment": "Dr. Patel gave a practical gastritis plan and explained how to prevent flare-ups with routine changes.",
                "created_at": datetime.utcnow() - timedelta(days=13),
            },
            {
                "_id": ObjectId(),
                "doctor_id": doctors[11]["_id"],
                "patient_id": patient_users[4]["_id"],  # Rahul Verma
                "appointment_id": appt_rahul_eye_completed["_id"],
                "score": 5,
                "comment": "Helpful eye consultation with immediate relief tips for digital strain and dryness.",
                "created_at": datetime.utcnow() - timedelta(days=5),
            },
            {
                "_id": ObjectId(),
                "doctor_id": doctors[12]["_id"],
                "patient_id": patient_users[5]["_id"],  # Ananya Iyer
                "appointment_id": appt_ananya_nephro_completed["_id"],
                "score": 4,
                "comment": "Clear explanation of kidney profile and hydration strategy. Consultation was calm and detailed.",
                "created_at": datetime.utcnow() - timedelta(days=9),
            },
            {
                "_id": ObjectId(),
                "doctor_id": doctors[13]["_id"],
                "patient_id": patient_users[7]["_id"],  # Meera Patel
                "appointment_id": appt_meera_general_completed["_id"],
                "score": 5,
                "comment": "Quick but attentive follow-up for fever recovery. Advice on diet and rest was very useful.",
                "created_at": datetime.utcnow() - timedelta(days=2),
            },
        ]
    )
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
    for user in patient_users:
        print(f"  Email: {user['email']}")
        print("  Password: password")
        print()

    print("Doctors:")
    for user in doctor_users:
        print(f"  Email: {user['email']}")
        print("  Password: password")
        print()

    print("-" * 50)

    client.close()


if __name__ == "__main__":
    seed_database()
