import pytest
import json
from bson import ObjectId
from flask_jwt_extended import create_access_token
from unittest.mock import patch
from werkzeug.security import generate_password_hash

def test_unauthorized_access(client):
    """Test that accessing a protected route without a token fails."""
    # Assuming /api/appointments requires login
    response = client.post('/api/appointments', json={})
    assert response.status_code == 401
    
def test_rbac_doctor_route_access_by_patient(client, app):
    """Test that a patient cannot access doctor-specific routes."""
    # We need to find a route that is doctor only.
    # If none exist, we can test that the token role is correctly embedded.
    
    with app.app_context():
        token = create_access_token(identity=json.dumps({'id': '507f1f77bcf86cd799439011', 'role': 'patient'}))

    response = client.get(
        '/api/doctors/profile',
        headers={'Authorization': f'Bearer {token}'},
    )
    assert response.status_code == 403

def test_jwt_token_generation_and_validation(app):
    """Test token generation and structure."""
    with app.app_context():
        # create_access_token requires app context and secret key (handled by app fixture)
        token = create_access_token(identity='user1', additional_claims={'role': 'patient'})
        assert token is not None
        assert isinstance(token, str)


def test_doctor_cannot_create_appointment(client, app):
    with app.app_context():
        token = create_access_token(
            identity=json.dumps({'id': '507f1f77bcf86cd799439012', 'role': 'doctor'})
        )

    response = client.post(
        '/api/appointments',
        json={'doctorId': '507f1f77bcf86cd799439013'},
        headers={'Authorization': f'Bearer {token}'},
    )
    assert response.status_code == 403


def test_doctor_cannot_complete_other_doctors_appointment(client, app):
    appointment_id = ObjectId()
    doctor_owner_id = ObjectId()
    doctor_actor_profile_id = ObjectId()
    patient_user_id = ObjectId()

    with app.app_context():
        token = create_access_token(
            identity=json.dumps({'id': str(ObjectId()), 'role': 'doctor'})
        )

    mocked_appointment = {
        '_id': appointment_id,
        'doctor_id': doctor_owner_id,
        'patient_id': patient_user_id,
        'doctor_name': 'Doctor One',
        'date': '2099-12-31',
        'time': '10:00 AM',
        'status': 'confirmed',
    }
    mocked_doctor = {
        '_id': doctor_actor_profile_id,
        'name': 'Doctor Two',
        'user_id': ObjectId(),
    }

    with patch(
        'src.routes.appointments.Appointment.find_by_id', return_value=mocked_appointment
    ), patch(
        'src.routes.appointments.Doctor.find_by_user_id', return_value=mocked_doctor
    ):
        response = client.post(
            f"/api/appointments/{appointment_id}/complete",
            json={'type': 'Consultation', 'description': 'Done'},
            headers={'Authorization': f'Bearer {token}'},
        )

    assert response.status_code == 403


def test_doctor_cannot_access_unrelated_patient_profile(client, app):
    patient_user_id = ObjectId()

    with app.app_context():
        token = create_access_token(
            identity=json.dumps({'id': str(ObjectId()), 'role': 'doctor'})
        )

    with patch(
        'src.routes.patients.Doctor.find_by_user_id',
        return_value={'_id': ObjectId(), 'user_id': ObjectId()},
    ), patch(
        'src.routes.patients.Patient.find_by_user_id',
        return_value={'_id': ObjectId(), 'user_id': patient_user_id},
    ), patch(
        'src.routes.patients._doctor_has_patient_access', return_value=False
    ):
        response = client.get(
            f"/api/patients/{patient_user_id}",
            headers={'Authorization': f'Bearer {token}'},
        )

    assert response.status_code == 403


def test_doctor_login_requires_doctor_profile(client, app):
    mocked_user = {
        '_id': ObjectId(),
        'email': 'orphan-doctor@test.com',
        'password': generate_password_hash('password123'),
        'role': 'doctor',
    }

    with patch('src.routes.auth.User.find_by_email', return_value=mocked_user), patch(
        'src.routes.auth.Doctor.find_by_user_id', return_value=None
    ):
        response = client.post(
            '/api/auth/login',
            json={'email': 'orphan-doctor@test.com', 'password': 'password123'},
        )

    assert response.status_code == 403
    data = response.get_json()
    assert data.get('error') == 'pending_verification'
