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
    """Get all doctors with pagination support - optimized to avoid N+1 queries."""
    from ..database import get_db, DOCTORS_COLLECTION, SCHEDULES_COLLECTION

    # Get pagination parameters
    page, per_page = get_pagination_params(default_per_page=12, max_per_page=50)
    skip = (page - 1) * per_page

    db = get_db()
    verified_query = {
        "$or": [{"verified": True}, {"verification_status": "verified"}]
    }

    # Use aggregation pipeline to fetch doctors with schedules in one query
    pipeline = [
        {"$match": verified_query},
        {"$sort": {"_id": -1}},  # Sort by newest first
        {"$skip": skip},
        {"$limit": per_page},
        {
            "$lookup": {
                "from": SCHEDULES_COLLECTION,
                "localField": "_id",
                "foreignField": "doctor_id",
                "as": "schedule",
            }
        },
        {"$addFields": {"schedule": {"$arrayElemAt": ["$schedule", 0]}}},
    ]

    doctors = list(db[DOCTORS_COLLECTION].aggregate(pipeline))

    # Get total count for pagination
    total_count = db[DOCTORS_COLLECTION].count_documents(verified_query)

    # Pre-compute current time info (do once, not per doctor)
    now = datetime.now()
    today_str = now.strftime("%Y-%m-%d")
    day_name = now.strftime("%A").lower()
    current_hour = now.hour
    ist = ZoneInfo("Asia/Kolkata")
    now_ist = datetime.now(ist)

    result = []
    for doc in doctors:
        doc_dict = Doctor.to_dict(doc)
        schedule = doc.get("schedule")

        # Calculate availability in-memory (no DB query)
        is_available, status_message = _calculate_availability_from_schedule(
            schedule, now, today_str, day_name, current_hour
        )
        doc_dict["isAvailable"] = is_available
        doc_dict["availabilityStatus"] = status_message

        # Format availability from schedule (no DB query)
        doc_dict["availability"] = _format_availability_from_schedule(schedule)

        # Calculate next available slot (optimized, no DB query per iteration)
        next_available = _get_next_available_from_schedule(
            schedule, now_ist, str(doc["_id"])
        )
        doc_dict["nextAvailable"] = next_available

        result.append(doc_dict)

    # Build paginated response
    total_pages = (total_count + per_page - 1) // per_page
    paginated_result = {
        "items": result,
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": total_count,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1,
        },
    }

    return jsonify(paginated_result)


def _calculate_availability_from_schedule(
    schedule, now, today_str, day_name, current_hour
):
    """Calculate availability status from schedule data (in-memory, no DB query)."""
    if not schedule:
        # No schedule set - assume available during business hours (9 AM - 5 PM)
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


def _format_availability_from_schedule(schedule):
    """Format availability strings from schedule data (in-memory, no DB query)."""
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


def _get_next_available_from_schedule(schedule, now_ist, doctor_id):
    """Get next available slot from schedule data (optimized, minimal DB queries)."""
    max_days = 30  # Reduced from 90 for performance

    for offset in range(0, max_days + 1):
        date_obj = now_ist + timedelta(days=offset)
        date_str = date_obj.strftime("%Y-%m-%d")

        # Get slots from schedule data (no DB query if we have schedule)
        slots = _get_slots_from_schedule(schedule, date_str, doctor_id)
        if not slots:
            continue

        for slot in slots:
            dt = _parse_slot_time(date_str, slot)
            if not dt:
                continue
            dt = dt.replace(tzinfo=ZoneInfo("Asia/Kolkata"))
            if dt > now_ist:
                return _format_next_available_label(date_obj, slot, now_ist)

    return None


def _get_slots_from_schedule(schedule, date_str, doctor_id):
    """Get available slots for a date from schedule (faster than Schedule model method)."""
    from ..database import get_db, APPOINTMENTS_COLLECTION
    from bson import ObjectId
    from datetime import datetime as dt

    def normalize_time(value):
        if not value:
            return None
        for fmt in ("%I:%M %p", "%I:%M%p", "%H:%M"):
            try:
                parsed = dt.strptime(value.strip(), fmt)
                return parsed.strftime("%I:%M %p").lstrip("0")
            except ValueError:
                continue
        return value.strip()

    if not schedule:
        # Return default slots
        default_slots = [
            "9:00 AM",
            "9:30 AM",
            "10:00 AM",
            "10:30 AM",
            "11:00 AM",
            "2:00 PM",
            "2:30 PM",
            "3:00 PM",
            "3:30 PM",
            "4:00 PM",
        ]
        return _filter_past_slots_fast(default_slots, date_str)

    # Check if date is blocked
    if date_str in schedule.get("blocked_dates", []):
        return []

    # Get day of week
    date_obj = dt.strptime(date_str, "%Y-%m-%d")
    day_name = date_obj.strftime("%A").lower()

    weekly = schedule.get("weekly_schedule", {})
    day_schedule = weekly.get(day_name, {})

    if not day_schedule.get("enabled", False):
        return []

    # Generate time slots
    start_time = day_schedule.get("start", "09:00")
    end_time = day_schedule.get("end", "17:00")
    slot_duration = schedule.get("slot_duration", 30)

    slots = _generate_time_slots_fast(start_time, end_time, slot_duration)

    # Filter out past slots
    slots = _filter_past_slots_fast(slots, date_str)

    if isinstance(doctor_id, str):
        doctor_id = ObjectId(doctor_id)

    db = get_db()
    booked = db[APPOINTMENTS_COLLECTION].find(
        {
            "doctor_id": doctor_id,
            "date": date_str,
            "status": {"$nin": ["cancelled", "rejected"]},
        }
    )
    booked_times = []
    for appt in booked:
        normalized = normalize_time(appt.get("time"))
        if normalized:
            booked_times.append(normalized)

    return [slot for slot in slots if slot not in booked_times]


def _generate_time_slots_fast(start_time, end_time, duration_minutes):
    """Fast slot generation without DB dependencies."""
    from datetime import datetime as dt, timedelta

    slots = []
    start = dt.strptime(start_time, "%H:%M")
    end = dt.strptime(end_time, "%H:%M")

    current = start
    while current < end:
        slots.append(current.strftime("%-I:%M %p").replace(" 0", " "))
        current += timedelta(minutes=duration_minutes)

    return slots


def _filter_past_slots_fast(slots, date_str):
    """Fast past slot filtering without DB dependencies."""
    from datetime import datetime as dt, timedelta

    requested_date = dt.strptime(date_str, "%Y-%m-%d").date()
    today = dt.now().date()

    if requested_date != today:
        return slots

    now = dt.now()
    min_booking_time = now + timedelta(minutes=30)

    filtered_slots = []
    for slot in slots:
        try:
            slot_time = dt.strptime(slot, "%I:%M %p")
            slot_datetime = dt.combine(today, slot_time.time())

            if slot_datetime > min_booking_time:
                filtered_slots.append(slot)
        except ValueError:
            filtered_slots.append(slot)

    return filtered_slots


@doctors_bp.route("/next-available", methods=["GET"])
def get_next_available():
    """Return next available slot for all doctors in IST."""
    doctors = Doctor.find_all(verified_only=True)
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

    data = request.get_json(silent=True) or {}
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

    data = request.get_json(silent=True) or {}
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
    data = request.get_json(silent=True) or {}
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
    data = request.get_json(silent=True) or {}
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
