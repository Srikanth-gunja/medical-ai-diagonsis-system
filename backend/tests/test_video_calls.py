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


def test_video_call_end_logs_metadata(client, app, db):
    token, user_id = _register_and_login_patient(client, "videocall@test.com")
    headers = {"Authorization": f"Bearer {token}"}

    # Create appointment using the db fixture directly
    from datetime import datetime, timedelta

    # Use current time + 5 minutes so the appointment is within the valid time window
    # (The time window allows calls from 30 mins before to 30 mins after the appointment)
    now = datetime.utcnow()
    appointment_datetime = now + timedelta(minutes=5)
    appointment_date = appointment_datetime.strftime("%Y-%m-%d")
    appointment_time = appointment_datetime.strftime("%I:%M %p")

    appointment_data = {
        "patient_id": ObjectId(user_id),
        "doctor_id": ObjectId(),
        "doctor_name": "Test Doctor",
        "date": appointment_date,
        "time": appointment_time,
        "status": "confirmed",
        "symptoms": "Cough",
        "slot_duration": 30,
        "created_at": datetime.utcnow(),
    }
    result = db["appointments"].insert_one(appointment_data)
    appointment_id = str(result.inserted_id)

    response = client.post(
        f"/api/video-calls/call/{appointment_id}/end",
        headers=headers,
        data=json.dumps({"duration": 123}),
        content_type="application/json",
    )

    assert response.status_code == 200, response.data

    # Verify the appointment was updated in the database
    updated = db["appointments"].find_one({"_id": ObjectId(appointment_id)})
    assert updated is not None
    assert updated.get("call_ended_at") is not None
    assert updated.get("call_duration") == 123
