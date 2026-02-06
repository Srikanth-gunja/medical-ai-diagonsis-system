from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from ..models.doctor import Doctor
from ..models.schedule import Schedule
from ..utils.pagination import paginate, get_pagination_params
import json

doctors_bp = Blueprint("doctors", __name__)


def get_current_user():
    """Parse JWT identity and return user dict."""
    identity = get_jwt_identity()
    if isinstance(identity, str):
        return json.loads(identity)
    return identity


def check_doctor_availability(doctor_id):
    """Check if doctor is available now based on their schedule."""
    schedule = Schedule.find_by_doctor_id(doctor_id)
    now = datetime.now()
    today_str = now.strftime("%Y-%m-%d")
    day_name = now.strftime("%A").lower()

    if not schedule:
        # No schedule set - assume available during business hours (9 AM - 5 PM)
        current_hour = now.hour
        if 9 <= current_hour < 17:
            return True, "Available"
        return False, "Outside business hours"

    # Check if today is blocked
    if today_str in schedule.get("blocked_dates", []):
        return False, "Not available today"

    weekly = schedule.get("weekly_schedule", {})
    day_schedule = weekly.get(day_name, {})

    if not day_schedule.get("enabled", False):
        return False, "Not available today"

    # Check if current time is within working hours
    start_time = day_schedule.get("start", "09:00")
    end_time = day_schedule.get("end", "17:00")

    try:
        start = datetime.strptime(start_time, "%H:%M").time()
        end = datetime.strptime(end_time, "%H:%M").time()
        current_time = now.time()

        if start <= current_time <= end:
            return True, "Available now"
        elif current_time < start:
            return (
                False,
                f"Available from {datetime.strptime(start_time, '%H:%M').strftime('%I:%M %p')}",
            )
        else:
            return False, "Closed for today"
    except ValueError:
        return True, "Available"


def get_formatted_availability(doctor_id):
    """Generate formatted availability strings from Schedule data."""
    schedule = Schedule.find_by_doctor_id(doctor_id)

    if not schedule:
        # Return default if no schedule set
        return [
            "Mon 9:00 AM - 5:00 PM",
            "Tue 9:00 AM - 5:00 PM",
            "Wed 9:00 AM - 5:00 PM",
            "Thu 9:00 AM - 5:00 PM",
            "Fri 9:00 AM - 5:00 PM",
        ]

    weekly = schedule.get("weekly_schedule", {})
    day_abbrev = {
        "monday": "Mon",
        "tuesday": "Tue",
        "wednesday": "Wed",
        "thursday": "Thu",
        "friday": "Fri",
        "saturday": "Sat",
        "sunday": "Sun",
    }

    availability = []
    for day in [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
    ]:
        day_schedule = weekly.get(day, {})
        if day_schedule.get("enabled", False):
            start = day_schedule.get("start", "09:00")
            end = day_schedule.get("end", "17:00")

            # Convert 24h to 12h format
            try:
                start_formatted = (
                    datetime.strptime(start, "%H:%M").strftime("%I:%M %p").lstrip("0")
                )
                end_formatted = (
                    datetime.strptime(end, "%H:%M").strftime("%I:%M %p").lstrip("0")
                )
                availability.append(
                    f"{day_abbrev[day]} {start_formatted} - {end_formatted}"
                )
            except ValueError:
                availability.append(f"{day_abbrev[day]} {start} - {end}")

    return availability if availability else ["No availability set"]


def _parse_slot_time(date_str: str, time_str: str):
    """Parse slot time like '9:00 AM' for a given date."""
    try:
        time_val = datetime.strptime(time_str, "%I:%M %p").time()
        date_val = datetime.strptime(date_str, "%Y-%m-%d").date()
        return datetime.combine(date_val, time_val)
    except ValueError:
        return None


def _format_next_available_label(date_obj: datetime, slot: str, now: datetime) -> str:
    if date_obj.date() == now.date():
        return f"Today, {slot}"
    if date_obj.date() == (now + timedelta(days=1)).date():
        return f"Tomorrow, {slot}"
    return f"{date_obj.strftime('%b %d')}, {slot}"


def _get_next_available_slot_ist(doctor_id: str, max_days: int = 90) -> str | None:
    """Return formatted next available slot in IST or None."""
    ist = ZoneInfo("Asia/Kolkata")
    now = datetime.now(ist)

    for offset in range(0, max_days + 1):
        date_obj = now + timedelta(days=offset)
        date_str = date_obj.strftime("%Y-%m-%d")
        slots = Schedule.get_available_slots(doctor_id, date_str)
        if not slots:
            continue

        for slot in slots:
            dt = _parse_slot_time(date_str, slot)
            if not dt:
                continue
            dt = dt.replace(tzinfo=ist)
            if dt > now:
                return _format_next_available_label(date_obj, slot, now)

    return None


@doctors_bp.route("", methods=["GET"])
def get_doctors():
    """Get all doctors with pagination support."""
    # Get pagination parameters
    page, per_page = get_pagination_params(default_per_page=12, max_per_page=50)

    doctors = Doctor.find_all()
    result = []
    for doc in doctors:
        doc_dict = Doctor.to_dict(doc)
        is_available, status_message = check_doctor_availability(doc["_id"])
        doc_dict["isAvailable"] = is_available
        doc_dict["availabilityStatus"] = status_message
        # Use schedule-based availability instead of old static field
        doc_dict["availability"] = get_formatted_availability(doc["_id"])
        # Next available slot calculated in IST
        next_available = _get_next_available_slot_ist(str(doc["_id"]))
        doc_dict["nextAvailable"] = next_available
        result.append(doc_dict)

    # Apply pagination
    paginated_result = paginate(result, page, per_page)
    return jsonify(paginated_result)


@doctors_bp.route("/next-available", methods=["GET"])
def get_next_available():
    """Return next available slot for all doctors in IST."""
    doctors = Doctor.find_all()
    result = {}
    for doc in doctors:
        result[str(doc["_id"])] = _get_next_available_slot_ist(str(doc["_id"]))
    return jsonify(result)


@doctors_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_doctor_profile():
    """Get current doctor's profile."""
    current_user = get_current_user()
    if current_user["role"] != "doctor":
        return jsonify({"error": "Unauthorized"}), 403

    doctor = Doctor.find_by_user_id(current_user["id"])
    if doctor:
        return jsonify(Doctor.to_dict(doctor))
    return jsonify({"error": "Doctor profile not found"}), 404


@doctors_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_doctor_profile():
    """Update current doctor's profile."""
    current_user = get_current_user()
    if current_user["role"] != "doctor":
        return jsonify({"error": "Unauthorized"}), 403

    doctor = Doctor.find_by_user_id(current_user["id"])
    if not doctor:
        return jsonify({"error": "Doctor profile not found"}), 404

    data = request.get_json()
    updated = Doctor.update(str(doctor["_id"]), data)
    if updated:
        return jsonify(
            {"message": "Profile updated", "profile": Doctor.to_dict(updated)}
        )
    return jsonify({"error": "Failed to update profile"}), 500


@doctors_bp.route("/profile/request-update", methods=["POST"])
@jwt_required()
def request_profile_update():
    """Request a profile update (requires admin approval)."""
    current_user = get_current_user()
    if current_user["role"] != "doctor":
        return jsonify({"error": "Unauthorized"}), 403

    doctor = Doctor.find_by_user_id(current_user["id"])
    if not doctor:
        return jsonify({"error": "Doctor profile not found"}), 404

    # Check if already has pending update
    if doctor.get("pending_profile_update"):
        return jsonify({"error": "You already have a pending profile update"}), 400

    data = request.get_json()
    Doctor.request_profile_update(str(doctor["_id"]), data)

    # Create notification for admin (we'll notify via admin endpoint polling)
    return jsonify({"message": "Profile update request submitted for admin approval"})


@doctors_bp.route("/profile/pending", methods=["GET"])
@jwt_required()
def get_pending_profile_update():
    """Get pending profile update status."""
    current_user = get_current_user()
    if current_user["role"] != "doctor":
        return jsonify({"error": "Unauthorized"}), 403

    doctor = Doctor.find_by_user_id(current_user["id"])
    if not doctor:
        return jsonify({"error": "Doctor profile not found"}), 404

    pending = doctor.get("pending_profile_update")
    pending_at = doctor.get("pending_profile_update_at")

    return jsonify(
        {
            "hasPendingUpdate": pending is not None,
            "pendingData": pending,
            "requestedAt": pending_at.isoformat() if pending_at else None,
        }
    )


@doctors_bp.route("/<doctor_id>", methods=["GET"])
def get_doctor(doctor_id):
    doctor = Doctor.find_by_id(doctor_id)
    if doctor:
        return jsonify(Doctor.to_dict(doctor))
    return jsonify({"error": "Doctor not found"}), 404


@doctors_bp.route("", methods=["POST"])
@jwt_required()
def create_doctor():
    current_user = get_current_user()
    if current_user.get("role") != "admin":
        return jsonify({"error": "Admin access required"}), 403
    data = request.get_json()
    doctor = Doctor.create(
        user_id=data.get("user_id"),
        name=data["name"],
        specialty=data["specialty"],
        location=data["location"],
        availability=data.get("availability", []),
        rating=data.get("rating", 0.0),
        image=data.get("image", ""),
    )
    return jsonify(Doctor.to_dict(doctor)), 201


@doctors_bp.route("/<doctor_id>", methods=["PUT"])
@jwt_required()
def update_doctor(doctor_id):
    current_user = get_current_user()
    if current_user.get("role") not in ["admin", "doctor"]:
        return jsonify({"error": "Unauthorized"}), 403
    if current_user.get("role") == "doctor":
        doctor = Doctor.find_by_user_id(current_user["id"])
        if not doctor or str(doctor.get("_id")) != str(doctor_id):
            return jsonify({"error": "Unauthorized"}), 403
    data = request.get_json()
    doctor = Doctor.update(doctor_id, data)
    if doctor:
        return jsonify(Doctor.to_dict(doctor))
    return jsonify({"error": "Doctor not found"}), 404


@doctors_bp.route("/<doctor_id>", methods=["DELETE"])
@jwt_required()
def delete_doctor(doctor_id):
    current_user = get_current_user()
    if current_user.get("role") != "admin":
        return jsonify({"error": "Admin access required"}), 403
    result = Doctor.delete(doctor_id)
    if result.deleted_count > 0:
        return jsonify({"message": "Doctor deleted successfully"})
    return jsonify({"error": "Doctor not found"}), 404
