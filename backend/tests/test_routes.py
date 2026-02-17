import pytest
import json
from bson import ObjectId
from unittest.mock import patch

def test_auth_routes(client):
    """Test user registration and login."""
    # Register
    register_data = {
        "email": "patient@test.com",
        "password": "password123",
        "role": "patient",
        "security_question": "Pet?",
        "security_answer": "Dog",
        "firstName": "Test",
        "lastName": "Patient"
    }
    
    response = client.post('/api/auth/register', 
                          data=json.dumps(register_data),
                          content_type='application/json')
    assert response.status_code == 201
    
    # Login
    login_data = {
        "email": "patient@test.com",
        "password": "password123"
    }
    response = client.post('/api/auth/login',
                          data=json.dumps(login_data),
                          content_type='application/json')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'access_token' in data

def test_appointment_booking_flow(client):
    """Test full booking flow."""
    # 1. Register logic is handled in test_auth_routes, but we need fresh data here
    # or we can use a fixture. Let's just create a user quickly.
    
    res_reg = client.post('/api/auth/register', 
               data=json.dumps({
                   "email": "patient2@test.com",
                   "password": "password123",
                   "role": "patient",
                   "firstName": "P2", "lastName": "Test",
                   "security_question": "Q", "security_answer": "A"
               }), content_type='application/json')
    assert res_reg.status_code == 201, f"Registration failed: {res_reg.data}"
               
    # Login Patient
    res = client.post('/api/auth/login', 
                     data=json.dumps({"email": "patient2@test.com", "password": "password123"}),
                     content_type='application/json')
    assert res.status_code == 200, f"Login failed: {res.data}"
    token = json.loads(res.data)['access_token']
    headers = {'Authorization': f'Bearer {token}'}
    
    doctor_id = str(ObjectId())

    # 2. Book Appointment
    booking_data = {
        "doctorId": doctor_id,
        "doctorName": "Test Doctor",
        "date": "2099-12-31",
        "time": "10:00 AM",
        "symptoms": "Cough"
    }

    with patch(
        'src.routes.appointments.Doctor.find_by_id',
        return_value={'_id': ObjectId(doctor_id), 'name': 'Test Doctor'},
    ), patch(
        'src.routes.appointments.Schedule.get_available_slots',
        return_value=['10:00 AM'],
    ), patch(
        'src.routes.appointments.Schedule.find_by_doctor_id',
        return_value={'slot_duration': 30},
    ):
        response = client.post(
            '/api/appointments',
            headers=headers,
            data=json.dumps(booking_data),
            content_type='application/json',
        )

    assert response.status_code == 201, response.data
    data = json.loads(response.data)
    assert data['status'] == 'pending'
    assert data['doctorName'] == "Test Doctor"
