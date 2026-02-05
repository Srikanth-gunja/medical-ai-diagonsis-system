from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..services.video_call_service import VideoCallService
from ..models.patient import Patient
from ..models.doctor import Doctor
from ..models.appointment import Appointment
import json
import os
from datetime import datetime

video_calls_bp = Blueprint("video_calls", __name__)
video_service = VideoCallService()


def get_current_user():
    """Parse JWT identity and return user dict."""
    identity = get_jwt_identity()
    if isinstance(identity, str):
        return json.loads(identity)
    return identity


@video_calls_bp.route("/token", methods=["POST"])
@jwt_required()
def generate_token():
    """Generate a token for the current user to connect to GetStream"""
    current_user = get_current_user()
    user_id = current_user["id"]
    role = current_user["role"]

    # Get user details for token metadata
    user_name = "User"
    if role == "patient":
        patient = Patient.find_by_user_id(user_id)
        if patient:
            user_name = (
                f"{patient.get('firstName', '')} {patient.get('lastName', '')}".strip()
            )
    elif role == "doctor":
        doctor = Doctor.find_by_user_id(user_id)
        if doctor:
            user_name = doctor.get("name", "")

    token = video_service.generate_user_token(user_id, user_name, role)

    if not token:
        return jsonify(
            {"error": "Failed to generate token. Service not configured."}
        ), 503

    # SECURITY: API key should NOT be returned to frontend
    # Frontend should use NEXT_PUBLIC_GETSTREAM_API_KEY from env
    return jsonify(
        {
            "token": token,
            "user_id": user_id,
            "user_name": user_name,
        }
    )


@video_calls_bp.route("/call/<appointment_id>", methods=["POST"])
@jwt_required()
def create_call(appointment_id):
    """Initialize/Join a video call for an appointment"""
    current_user = get_current_user()
    user_id = current_user["id"]
    role = current_user["role"]

    # Validate appointment and permissions
    appointment = video_service.validate_call_access(user_id, appointment_id, role)

    if not appointment:
        return jsonify({"error": "Unauthorized or invalid appointment"}), 403

    # Generate call ID
    call_id = video_service.create_call_id(appointment_id)

    # Get current user details
    user_name = "User"
    if role == "patient":
        patient = Patient.find_by_user_id(user_id)
        if patient:
            user_name = (
                f"{patient.get('firstName', '')} {patient.get('lastName', '')}".strip()
            )
    elif role == "doctor":
        doctor = Doctor.find_by_user_id(user_id)
        if doctor:
            user_name = doctor.get("name", "")

    # Generate token for current user (this also upserts them to Stream)
    token = video_service.generate_user_token(user_id, user_name, role)
    if not token:
        return jsonify(
            {"error": "Failed to generate token. Service not configured."}
        ), 503

    # Get other participant details and ensure they exist in Stream
    other_user_id = None
    other_user_name = None
    other_role = None

    if role == "patient":
        # Current is patient, other is doctor
        # IMPORTANT: appointment.doctor_id is Doctor collection _id, not user_id
        # We need to find the doctor and get their user_id for Stream
        doctor_doc_id = str(appointment.get("doctor_id"))
        doctor = Doctor.find_by_id(doctor_doc_id)
        if doctor:
            other_user_id = str(doctor.get("user_id"))
            other_user_name = doctor.get("name", "Doctor")
        else:
            # Fallback: use doctor_id directly (shouldn't happen in normal flow)
            other_user_id = doctor_doc_id
            other_user_name = appointment.get("doctor_name", "Doctor")
        other_role = "doctor"
    else:
        # Current is doctor, other is patient
        # patient_id in appointments IS the user_id (stored correctly)
        other_user_id = str(appointment.get("patient_id"))
        patient = Patient.find_by_user_id(other_user_id)
        if patient:
            other_user_name = (
                f"{patient.get('firstName', '')} {patient.get('lastName', '')}".strip()
            )
            if not other_user_name:
                other_user_name = appointment.get("patient_name", "Patient")
        else:
            other_user_name = appointment.get("patient_name", "Patient")
        other_role = "patient"

    # Upsert the other participant to Stream so they can receive calls
    if not other_user_id:
        return jsonify({"error": "Other participant not found for appointment"}), 404

    video_service.upsert_user(other_user_id, other_user_name, other_role)

    # If doctor is joining, we can optionally mark appointment as "in_progress"
    # if it was confirmed
    if role == "doctor" and appointment.get("status") == "confirmed":
        Appointment.update_status(appointment_id, "in_progress")
        # We could also record call start time here
        Appointment.update(appointment_id, {"call_started_at": datetime.utcnow()})

    # SECURITY: API key is loaded from frontend env, not returned from backend
    return jsonify(
        {
            "call_id": call_id,
            "token": token,
            "user_id": user_id,
            "user_name": user_name,
            "appointment": Appointment.to_dict(appointment),
            "other_user_id": other_user_id,
            "other_user_name": other_user_name,
        }
    )


@video_calls_bp.route("/call/<appointment_id>/end", methods=["POST"])
@jwt_required()
def end_call(appointment_id):
    """End a video call"""
    current_user = get_current_user()
    user_id = current_user["id"]
    role = current_user["role"]

    # Validate access
    appointment = video_service.validate_call_access(user_id, appointment_id, role)

    if not appointment:
        return jsonify({"error": "Unauthorized or invalid appointment"}), 403

    data = request.get_json() or {}
    duration = data.get("duration", 0)

    # Update appointment metadata
    updates = {
        "call_ended_at": datetime.utcnow(),
    }

    if duration:
        updates["call_duration"] = duration

    # Only update status to completed if doctor ends it?
    # Or let the "Finish Consultation" button handle that.
    # For now just log the call end.

    Appointment.update(appointment_id, updates)

    return jsonify({"message": "Call ended logged successfully"})
