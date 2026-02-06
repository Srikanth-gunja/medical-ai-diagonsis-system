from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from ..models.appointment import Appointment
from ..models.doctor import Doctor
from ..models.patient import Patient
from ..models.medical_record import MedicalRecord
from ..models.notification import Notification
from ..models.schedule import Schedule
from ..database import get_db, APPOINTMENTS_COLLECTION
from ..realtime import publish_event
from ..utils.pagination import paginate, get_pagination_params
from ..utils.appointment_time import (
    mark_expired_appointments,
    mark_expired_no_show,
    mark_expired_rejected,
)
import json
from datetime import datetime

appointments_bp = Blueprint("appointments", __name__)

ACTIVITIES_COLLECTION = "activities"

ALLOWED_STATUSES = {
    "pending",
    "confirmed",
    "cancelled",
    "no_show",
    "rejected",
    "in_progress",
    "completed",
}

ALLOWED_TRANSITIONS = {
    "pending": {"confirmed", "rejected", "cancelled"},
    "confirmed": {"in_progress", "cancelled", "no_show"},
    "in_progress": {"completed", "cancelled", "no_show"},
    "completed": set(),
    "rejected": set(),
    "cancelled": set(),
    "no_show": set(),
}


def get_current_user():
    """Parse JWT identity and return user dict."""
    identity = get_jwt_identity()
    if isinstance(identity, str):
        return json.loads(identity)
    return identity


def _parse_date(value: str):
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except Exception:
        return None


def _normalize_time(value: str):
    if not value:
        return None
    for fmt in ("%I:%M %p", "%I:%M%p", "%H:%M"):
        try:
            parsed = datetime.strptime(value.strip(), fmt)
            return parsed.strftime("%I:%M %p").lstrip("0")
        except ValueError:
            continue
    return None


def create_activity(
    user_id: str,
    activity_type: str,
    title: str,
    description: str,
    icon: str = "BellIcon",
    color: str = "bg-primary",
):
    """Create an activity entry for a user."""
    db = get_db()
    activity = {
        "user_id": ObjectId(user_id),
        "type": activity_type,
        "title": title,
        "description": description,
        "timestamp": datetime.utcnow(),
        "icon": icon,
        "color": color,
    }
    db[ACTIVITIES_COLLECTION].insert_one(activity)
    publish_event([str(user_id)], "activities.updated", {})


@appointments_bp.route("", methods=["GET"])
@jwt_required()
def get_appointments():
    """Get appointments with pagination support."""
    current_user = get_current_user()
    user_id = current_user["id"]
    role = current_user["role"]

    # Get pagination parameters
    page, per_page = get_pagination_params(default_per_page=10, max_per_page=50)

    if role == "patient":
        appointments = Appointment.find_by_patient_id(user_id)
        appointments = mark_expired_appointments(appointments)
        result = [Appointment.to_dict(appt) for appt in appointments]
    else:
        # For doctors, find by doctor profile's _id and include patient names
        doctor = Doctor.find_by_user_id(user_id)
        if doctor:
            appointments = Appointment.find_by_doctor_id(doctor["_id"])
        else:
            appointments = []

        appointments = mark_expired_appointments(appointments)

        # Enrich with patient names
        result = []
        for appt in appointments:
            appt_dict = Appointment.to_dict(appt)
            # Get patient info
            patient = Patient.find_by_user_id(str(appt["patient_id"]))
            if patient:
                appt_dict["patientName"] = (
                    f"{patient.get('firstName', '')} {patient.get('lastName', '')}".strip()
                )
            else:
                appt_dict["patientName"] = "Unknown Patient"
            # Add type if not present
            if "type" not in appt_dict:
                appt_dict["type"] = appt.get("type", "video")
            result.append(appt_dict)

    # Apply pagination
    paginated_result = paginate(result, page, per_page)
    return jsonify(paginated_result)


@appointments_bp.route("", methods=["POST"])
@jwt_required()
def create_appointment():
    data = request.get_json() or {}
    current_user = get_current_user()

    doctor_id = data.get("doctorId")
    if not doctor_id:
        return jsonify({"error": "doctorId is required"}), 400

    try:
        doctor = Doctor.find_by_id(doctor_id)
    except Exception:
        return jsonify({"error": "Invalid doctorId"}), 400

    if not doctor:
        return jsonify({"error": "Doctor not found"}), 404

    date_str = (data.get("date") or "").strip()
    time_raw = (data.get("time") or "").strip()
    if not date_str or not time_raw:
        return jsonify({"error": "date and time are required"}), 400

    if not _parse_date(date_str):
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD."}), 400

    normalized_time = _normalize_time(time_raw)
    if not normalized_time:
        return jsonify({"error": "Invalid time format. Use HH:MM or HH:MM AM/PM."}), 400

    available_slots = Schedule.get_available_slots(doctor_id, date_str)
    if normalized_time not in available_slots:
        return jsonify({"error": "Selected time slot is not available"}), 409

    # Prevent duplicate bookings for the same slot
    db = get_db()
    existing = db[APPOINTMENTS_COLLECTION].find_one(
        {
            "doctor_id": doctor["_id"],
            "date": date_str,
            "time": normalized_time,
            "status": {"$nin": ["cancelled", "rejected"]},
        }
    )
    if existing:
        return jsonify({"error": "Selected time slot is already booked"}), 409

    schedule = Schedule.find_by_doctor_id(doctor_id)
    slot_duration = schedule.get("slot_duration", 30) if schedule else 30
    doctor_name = doctor.get("name", "Doctor")

    appointment = Appointment.create(
        patient_id=current_user["id"],
        doctor_id=doctor_id,
        doctor_name=doctor_name,
        date=date_str,
        time=normalized_time,
        symptoms=data.get("symptoms", ""),
        slot_duration=slot_duration,
    )

    # Get patient name for notification
    patient = Patient.find_by_user_id(current_user["id"])
    patient_name = (
        f"{patient.get('firstName', '')} {patient.get('lastName', '')}"
        if patient
        else "A patient"
    )

    # Create notification for doctor with reference to appointment
    doctor_user_id = doctor.get("user_id") if doctor else None
    if doctor_user_id:
        Notification.create(
            user_id=doctor_user_id,
            title="New Appointment Request",
            message=f"{patient_name} has requested an appointment on {date_str} at {normalized_time}",
            notification_type="appointment",
            link="/doctor-dashboard",
            reference_id=f"appointment:{str(appointment['_id'])}",
        )

    # Create activity for patient
    create_activity(
        user_id=current_user["id"],
        activity_type="appointment",
        title="Appointment Booked",
        description=f"Requested appointment with {doctor_name} on {date_str} at {normalized_time}",
        icon="CalendarIcon",
        color="bg-primary",
    )

    appointment_dict = Appointment.to_dict(appointment)

    # Push real-time updates to patient and doctor
    target_user_ids = [current_user["id"]]
    if doctor_user_id:
        target_user_ids.append(str(doctor_user_id))
    publish_event(
        target_user_ids,
        "appointments.updated",
        {"appointmentId": appointment_dict["id"]},
    )

    return jsonify(appointment_dict), 201


@appointments_bp.route("/<appt_id>/status", methods=["PATCH"])
@jwt_required()
def update_status(appt_id):
    current_user = get_current_user()
    data = request.get_json() or {}
    status = data.get("status")
    if status not in ALLOWED_STATUSES:
        return jsonify({"error": "Invalid status value"}), 400

    # Get appointment before update for notification
    original_appointment = Appointment.find_by_id(appt_id)
    if not original_appointment:
        return jsonify({"error": "Appointment not found"}), 404

    current_status = original_appointment.get("status", "pending")
    allowed = ALLOWED_TRANSITIONS.get(current_status, set())
    if status != current_status and status not in allowed:
        return jsonify({"error": f"Invalid status transition from {current_status} to {status}"}), 400

    # Only the assigned doctor (or admin) can update status
    if current_user.get("role") == "doctor":
        doctor = Doctor.find_by_user_id(current_user["id"])
        if not doctor or str(doctor.get("_id")) != str(
            original_appointment.get("doctor_id")
        ):
            return jsonify({"error": "Unauthorized"}), 403
    elif current_user.get("role") != "admin":
        return jsonify({"error": "Unauthorized"}), 403

    appointment = Appointment.update_status(appt_id, status)
    if appointment:
        # Create notification for patient about status change
        if original_appointment:
            patient_id = original_appointment["patient_id"]
            doctor_name = original_appointment.get("doctor_name", "Doctor")
            appt_date = original_appointment.get("date", "")
            appt_time = original_appointment.get("time", "")
            doctor_id = original_appointment.get("doctor_id")

            # Get doctor's user_id to mark their notification as read
            if doctor_id:
                doctor = Doctor.find_by_id(doctor_id)
                if doctor:
                    # Mark the appointment request notification as read for the doctor
                    Notification.mark_read_by_reference(
                        doctor["user_id"], f"appointment:{appt_id}"
                    )

            if status == "confirmed":
                Notification.create(
                    user_id=patient_id,
                    title="Appointment Confirmed",
                    message=f"Your appointment with {doctor_name} on {appt_date} at {appt_time} has been confirmed.",
                    notification_type="success",
                    link="/patient-dashboard",
                )
                # Create activity for patient
                create_activity(
                    user_id=str(patient_id),
                    activity_type="appointment",
                    title="Appointment Confirmed",
                    description=f"Your appointment with {doctor_name} on {appt_date} at {appt_time} has been confirmed.",
                    icon="CheckCircleIcon",
                    color="bg-success",
                )
            elif status == "cancelled":
                Notification.create(
                    user_id=patient_id,
                    title="Appointment Cancelled",
                    message=f"Your appointment with {doctor_name} on {appt_date} at {appt_time} has been cancelled.",
                    notification_type="warning",
                    link="/patient-dashboard",
                )
                # Create activity for patient
                create_activity(
                    user_id=str(patient_id),
                    activity_type="appointment",
                    title="Appointment Cancelled",
                    description=f"Your appointment with {doctor_name} on {appt_date} at {appt_time} was cancelled.",
                    icon="XCircleIcon",
                    color="bg-warning",
                )
            elif status == "no_show":
                Notification.create(
                    user_id=patient_id,
                    title="Appointment Marked No-Show",
                    message=f"Your appointment with {doctor_name} on {appt_date} at {appt_time} was marked as no-show.",
                    notification_type="warning",
                    link="/patient-dashboard",
                )
                create_activity(
                    user_id=str(patient_id),
                    activity_type="appointment",
                    title="Appointment No-Show",
                    description=f"Your appointment with {doctor_name} on {appt_date} at {appt_time} was marked as no-show.",
                    icon="ExclamationTriangleIcon",
                    color="bg-warning",
                )

        appointment_dict = Appointment.to_dict(appointment)
        target_user_ids = []
        if original_appointment:
            target_user_ids.append(str(original_appointment["patient_id"]))
            if original_appointment.get("doctor_id"):
                doctor_for_appt = Doctor.find_by_id(
                    original_appointment.get("doctor_id")
                )
                if doctor_for_appt:
                    target_user_ids.append(str(doctor_for_appt["user_id"]))
        publish_event(
            target_user_ids,
            "appointments.updated",
            {"appointmentId": appointment_dict["id"]},
        )
        return jsonify(appointment_dict)
    return jsonify({"error": "Appointment not found"}), 404


@appointments_bp.route("/<appt_id>", methods=["DELETE"])
@jwt_required()
def delete_appointment(appt_id):
    current_user = get_current_user()
    existing = Appointment.find_by_id(appt_id)
    if not existing:
        return jsonify({"error": "Appointment not found"}), 404
    if current_user.get("role") == "patient":
        if str(existing.get("patient_id")) != current_user["id"]:
            return jsonify({"error": "Unauthorized"}), 403
    elif current_user.get("role") == "doctor":
        doctor = Doctor.find_by_user_id(current_user["id"])
        if not doctor or str(doctor.get("_id")) != str(existing.get("doctor_id")):
            return jsonify({"error": "Unauthorized"}), 403
    elif current_user.get("role") != "admin":
        return jsonify({"error": "Unauthorized"}), 403
    result = Appointment.delete(appt_id)
    if result.deleted_count > 0:
        target_user_ids = []
        if existing:
            target_user_ids.append(str(existing["patient_id"]))
            if existing.get("doctor_id"):
                doctor = Doctor.find_by_id(existing.get("doctor_id"))
                if doctor:
                    target_user_ids.append(str(doctor["user_id"]))
        publish_event(
            target_user_ids, "appointments.updated", {"appointmentId": str(appt_id)}
        )
        return jsonify({"message": "Appointment deleted successfully"})
    return jsonify({"error": "Appointment not found"}), 404


@appointments_bp.route("/<appt_id>/revoke", methods=["PATCH"])
@jwt_required()
def revoke_appointment(appt_id):
    """Allow patient to cancel their pending or confirmed appointment."""
    current_user = get_current_user()

    # Only patients can cancel
    if current_user["role"] != "patient":
        return jsonify({"error": "Only patients can cancel appointments"}), 403

    appointment = Appointment.find_by_id(appt_id)
    if not appointment:
        return jsonify({"error": "Appointment not found"}), 404

    # Verify ownership
    if str(appointment["patient_id"]) != current_user["id"]:
        return jsonify({"error": "Unauthorized"}), 403

    # If appointment time has ended, auto-mark expired appointments to avoid cancel errors
    if appointment["status"] in ["pending", "confirmed"]:
        if appointment["status"] == "confirmed":
            updated, marked = mark_expired_no_show(appointment)
            if marked:
                appointment_dict = Appointment.to_dict(updated)
                target_user_ids = [current_user["id"]]
                doctor_id = appointment.get("doctor_id")
                if doctor_id:
                    doctor = Doctor.find_by_id(doctor_id)
                    if doctor:
                        target_user_ids.append(str(doctor["user_id"]))
                publish_event(
                    target_user_ids,
                    "appointments.updated",
                    {"appointmentId": appointment_dict["id"]},
                )
                return jsonify(appointment_dict)
        else:
            updated, marked = mark_expired_rejected(appointment)
            if marked:
                appointment_dict = Appointment.to_dict(updated)
                target_user_ids = [current_user["id"]]
                doctor_id = appointment.get("doctor_id")
                if doctor_id:
                    doctor = Doctor.find_by_id(doctor_id)
                    if doctor:
                        target_user_ids.append(str(doctor["user_id"]))
                publish_event(
                    target_user_ids,
                    "appointments.updated",
                    {"appointmentId": appointment_dict["id"]},
                )
                return jsonify(appointment_dict)

    # Only pending or confirmed appointments can be cancelled
    if appointment["status"] not in ["pending", "confirmed"]:
        return jsonify(
            {"error": "Only pending or confirmed appointments can be cancelled"}
        ), 400

    # Get appointment details for notifications
    doctor_name = appointment.get("doctor_name", "Doctor")
    appt_date = appointment.get("date", "")
    appt_time = appointment.get("time", "")
    doctor_id = appointment.get("doctor_id")
    doctor = None  # Initialize doctor variable

    # Update appointment status to rejected with patient cancellation reason
    updated = Appointment.update(
        appt_id, {"status": "rejected", "rejection_reason": "Cancelled by patient"}
    )

    # Get patient name for notification
    patient = Patient.find_by_user_id(current_user["id"])
    patient_name = (
        f"{patient.get('firstName', '')} {patient.get('lastName', '')}".strip()
        if patient
        else "A patient"
    )

    # Notify the doctor about the cancellation
    if doctor_id:
        doctor = Doctor.find_by_id(doctor_id)
        if doctor:
            Notification.create(
                user_id=doctor["user_id"],
                title="Appointment Cancelled by Patient",
                message=f"{patient_name} has cancelled their appointment on {appt_date} at {appt_time}.",
                notification_type="warning",
                link="/doctor-dashboard",
            )

    # Create activity for patient
    create_activity(
        user_id=current_user["id"],
        activity_type="appointment",
        title="Appointment Cancelled",
        description=f"You cancelled your appointment with {doctor_name} on {appt_date} at {appt_time}.",
        icon="XCircleIcon",
        color="bg-warning",
    )

    appointment_dict = Appointment.to_dict(updated)
    target_user_ids = [current_user["id"]]
    if doctor:
        target_user_ids.append(str(doctor["user_id"]))
    publish_event(
        target_user_ids,
        "appointments.updated",
        {"appointmentId": appointment_dict["id"]},
    )
    return jsonify(appointment_dict)


@appointments_bp.route("/<appt_id>/complete", methods=["POST"])
@jwt_required()
def complete_appointment(appt_id):
    """Mark appointment as completed and create a medical record."""
    current_user = get_current_user()

    # Only doctors can complete appointments
    if current_user["role"] != "doctor":
        return jsonify({"error": "Only doctors can complete appointments"}), 403

    data = request.get_json()

    # Get the appointment
    appointment = Appointment.find_by_id(appt_id)
    if not appointment:
        return jsonify({"error": "Appointment not found"}), 404

    # Update appointment status to completed
    Appointment.update_status(appt_id, "completed")

    # Get doctor info
    doctor = Doctor.find_by_user_id(current_user["id"])
    doctor_name = doctor["name"] if doctor else "Unknown Doctor"

    # Get patient info to get patient._id for medical record
    patient_user_id = str(appointment["patient_id"])
    patient = Patient.find_by_user_id(patient_user_id)

    if not patient:
        return jsonify({"error": "Patient not found"}), 404

    # Create medical record from the consultation
    record = MedicalRecord.create(
        patient_id=patient["_id"],
        date=datetime.utcnow().strftime("%Y-%m-%d"),
        record_type=data.get("type", "Consultation"),
        doctor=doctor_name,
        description=data.get(
            "description",
            f"Consultation on {appointment['date']} - {appointment.get('symptoms', 'General checkup')}",
        ),
        result=data.get("result", "Completed"),
        notes=data.get("notes", ""),
    )

    updated_appointment = Appointment.find_by_id(appt_id)

    # Create activity for patient - consultation completed
    create_activity(
        user_id=patient_user_id,
        activity_type="report",
        title="Consultation Completed",
        description=f"Your consultation with {doctor_name} has been completed. Medical record created.",
        icon="ClipboardDocumentCheckIcon",
        color="bg-success",
    )

    target_user_ids = [patient_user_id]
    if doctor:
        target_user_ids.append(str(doctor["user_id"]))
    publish_event(
        target_user_ids, "appointments.updated", {"appointmentId": str(appt_id)}
    )

    return jsonify(
        {
            "message": "Appointment completed and medical record created",
            "appointment": Appointment.to_dict(updated_appointment),
            "medicalRecord": MedicalRecord.to_dict(record),
        }
    )


@appointments_bp.route("/<appt_id>/reject", methods=["POST"])
@jwt_required()
def reject_appointment(appt_id):
    """Doctor rejects an appointment with a reason."""
    current_user = get_current_user()

    # Only doctors can reject appointments
    if current_user["role"] != "doctor":
        return jsonify({"error": "Only doctors can reject appointments"}), 403

    data = request.get_json()
    reason = data.get("reason", "No reason provided")

    # Get the appointment
    appointment = Appointment.find_by_id(appt_id)
    if not appointment:
        return jsonify({"error": "Appointment not found"}), 404

    # Update appointment status to rejected with reason
    updated = Appointment.update(
        appt_id, {"status": "rejected", "rejection_reason": reason}
    )

    # Get doctor info
    doctor = Doctor.find_by_user_id(current_user["id"])
    doctor_name = doctor["name"] if doctor else "Doctor"

    # Get appointment info
    patient_id = appointment["patient_id"]
    appt_date = appointment.get("date", "")
    appt_time = appointment.get("time", "")

    # Create notification for patient with rejection reason
    Notification.create(
        user_id=patient_id,
        title="Appointment Rejected",
        message=f"Your appointment with {doctor_name} on {appt_date} at {appt_time} was rejected. Reason: {reason}",
        notification_type="warning",
        link="/patient-dashboard",
    )

    # Create activity for patient
    create_activity(
        user_id=str(patient_id),
        activity_type="appointment",
        title="Appointment Rejected",
        description=f"Your appointment with {doctor_name} on {appt_date} at {appt_time} was rejected. Reason: {reason}",
        icon="XCircleIcon",
        color="bg-error",
    )

    # Mark the appointment request notification as read for the doctor
    if doctor:
        Notification.mark_read_by_reference(doctor["user_id"], f"appointment:{appt_id}")

    target_user_ids = [str(patient_id)]
    if doctor:
        target_user_ids.append(str(doctor["user_id"]))
    publish_event(
        target_user_ids, "appointments.updated", {"appointmentId": str(appt_id)}
    )

    return jsonify(
        {"message": "Appointment rejected", "appointment": Appointment.to_dict(updated)}
    )


@appointments_bp.route("/<appt_id>/reschedule", methods=["PATCH"])
@jwt_required()
def reschedule_appointment(appt_id):
    """Reschedule an appointment to a new date and time."""
    current_user = get_current_user()
    data = request.get_json()

    new_date = data.get("date")
    new_time = data.get("time")

    if not new_date or not new_time:
        return jsonify({"error": "New date and time are required"}), 400

    # Get the appointment
    appointment = Appointment.find_by_id(appt_id)
    if not appointment:
        return jsonify({"error": "Appointment not found"}), 404

    # Verify ownership - patient can reschedule their own appointments
    if current_user["role"] == "patient":
        if str(appointment["patient_id"]) != current_user["id"]:
            return jsonify({"error": "Unauthorized"}), 403

    old_date = appointment.get("date", "")
    old_time = appointment.get("time", "")
    doctor_name = appointment.get("doctor_name", "Doctor")

    schedule = Schedule.find_by_doctor_id(appointment["doctor_id"])
    slot_duration = schedule.get("slot_duration", 30) if schedule else 30

    # Update appointment with new date/time
    updated = Appointment.update(
        appt_id,
        {
            "date": new_date,
            "time": new_time,
            "status": "pending",  # Reset to pending for doctor to confirm
            "slot_duration": slot_duration,
        },
    )

    # Get patient info for notification
    patient = Patient.find_by_user_id(str(appointment["patient_id"]))
    patient_name = (
        f"{patient.get('firstName', '')} {patient.get('lastName', '')}".strip()
        if patient
        else "Patient"
    )

    # Notify doctor about reschedule
    doctor = Doctor.find_by_id(str(appointment["doctor_id"]))
    if doctor:
        Notification.create(
            user_id=doctor["user_id"],
            title="Appointment Rescheduled",
            message=f"{patient_name} has rescheduled their appointment from {old_date} {old_time} to {new_date} at {new_time}",
            notification_type="info",
            link="/doctor-dashboard",
            reference_id=f"appointment:{appt_id}",
        )

    # Create activity for patient
    create_activity(
        user_id=str(appointment["patient_id"]),
        activity_type="appointment",
        title="Appointment Rescheduled",
        description=f"Your appointment with {doctor_name} has been rescheduled to {new_date} at {new_time}",
        icon="CalendarIcon",
        color="bg-primary",
    )

    target_user_ids = [str(appointment["patient_id"])]
    if doctor:
        target_user_ids.append(str(doctor["user_id"]))
    publish_event(
        target_user_ids, "appointments.updated", {"appointmentId": str(appt_id)}
    )

    return jsonify(
        {
            "message": "Appointment rescheduled successfully",
            "appointment": Appointment.to_dict(updated),
        }
    )
