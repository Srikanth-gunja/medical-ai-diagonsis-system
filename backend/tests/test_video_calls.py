import json
from bson import ObjectId
from src.models.appointment import Appointment


def _register_and_login_patient(client, email: str):
    register_data = {
        "email": email,
        "password": "password123",
        "role": "patient",
        "security_question": "Pet?",
        "security_answer": "Dog",
        "firstName": "Test",
        "lastName": "Patient",
    }
    res = client.post(
        "/api/auth/register",
        data=json.dumps(register_data),
        content_type="application/json",
    )
    assert res.status_code == 201, f"Registration failed: {res.data}"

    login_data = {"email": email, "password": "password123"}
    res = client.post(
        "/api/auth/login",
        data=json.dumps(login_data),
        content_type="application/json",
    )
    assert res.status_code == 200, f"Login failed: {res.data}"
    token = json.loads(res.data)["access_token"]
    user_id = json.loads(res.data)["id"]
    return token, user_id


def test_video_call_end_logs_metadata(client, app):
    token, user_id = _register_and_login_patient(client, "videocall@test.com")
    headers = {"Authorization": f"Bearer {token}"}

    with app.app_context():
        appointment = Appointment.create(
            patient_id=user_id,
            doctor_id=str(ObjectId()),
            doctor_name="Test Doctor",
            date="2026-01-15",
            time="10:00 AM",
            symptoms="Cough",
        )
        appointment_id = str(appointment["_id"])

    response = client.post(
        f"/api/video-calls/call/{appointment_id}/end",
        headers=headers,
        data=json.dumps({"duration": 123}),
        content_type="application/json",
    )

    assert response.status_code == 200, response.data

    with app.app_context():
        updated = Appointment.find_by_id(appointment_id)
        assert updated.get("call_ended_at") is not None
        assert updated.get("call_duration") == 123
