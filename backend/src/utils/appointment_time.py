from datetime import datetime, timedelta
from zoneinfo import ZoneInfo


DEFAULT_TIMEZONE = ZoneInfo("Asia/Kolkata")


def _parse_appointment_start(appointment, tz=DEFAULT_TIMEZONE):
    date_str = (appointment.get("date") or "").strip()
    time_str = (appointment.get("time") or "").strip()
    if not date_str or not time_str:
        return None

    time_str = " ".join(time_str.upper().split())
    for fmt in ("%Y-%m-%d %I:%M %p", "%Y-%m-%d %I:%M%p", "%Y-%m-%d %H:%M"):
        try:
            parsed = datetime.strptime(f"{date_str} {time_str}", fmt)
            return parsed.replace(tzinfo=tz)
        except ValueError:
            continue
    return None


def _get_slot_duration_minutes(appointment):
    duration = appointment.get("slot_duration") or appointment.get("slotDuration") or 30
    try:
        duration = int(duration)
        if duration <= 0:
            return 30
        return duration
    except (TypeError, ValueError):
        return 30


def get_appointment_window(appointment, tz=DEFAULT_TIMEZONE):
    start = _parse_appointment_start(appointment, tz=tz)
    if not start:
        return None, None
    duration = _get_slot_duration_minutes(appointment)
    end = start + timedelta(minutes=duration)
    return start, end


def is_in_appointment_window(appointment, now=None, tz=DEFAULT_TIMEZONE):
    start, end = get_appointment_window(appointment, tz=tz)
    if not start or not end:
        return False, "Invalid appointment time format"

    if now is None:
        now = datetime.now(tz)

    if now < start:
        return False, f"Chat available from {start.strftime('%Y-%m-%d %I:%M %p')}"
    if now > end:
        return False, "Appointment time has ended"
    return True, ""


def should_mark_no_show(
    appointment, now=None, tz=DEFAULT_TIMEZONE, grace_minutes=0, eligible_statuses=None
):
    if eligible_statuses is None:
        eligible_statuses = {"confirmed"}
    status = appointment.get("status")
    if status not in eligible_statuses:
        return False

    # If there is any call activity, avoid marking as no-show automatically
    if appointment.get("call_started_at") or appointment.get("call_duration") or appointment.get(
        "call_ended_at"
    ):
        return False

    _, end = get_appointment_window(appointment, tz=tz)
    if not end:
        return False

    if now is None:
        now = datetime.now(tz)

    if grace_minutes:
        end = end + timedelta(minutes=grace_minutes)

    return now > end


def should_mark_rejected_expired(appointment, now=None, tz=DEFAULT_TIMEZONE, grace_minutes=0):
    if appointment.get("status") != "pending":
        return False

    _, end = get_appointment_window(appointment, tz=tz)
    if not end:
        return False

    if now is None:
        now = datetime.now(tz)

    if grace_minutes:
        end = end + timedelta(minutes=grace_minutes)

    return now > end


def mark_expired_no_show(appointment, now=None, tz=DEFAULT_TIMEZONE, grace_minutes=0):
    if not appointment:
        return appointment, False

    if not should_mark_no_show(appointment, now=now, tz=tz, grace_minutes=grace_minutes):
        return appointment, False

    from ..models.appointment import Appointment

    updated = Appointment.update_status(appointment["_id"], "no_show")
    return updated or appointment, True


def mark_expired_rejected(
    appointment, now=None, tz=DEFAULT_TIMEZONE, grace_minutes=0, reason="Expired (no response)"
):
    if not appointment:
        return appointment, False

    if not should_mark_rejected_expired(
        appointment, now=now, tz=tz, grace_minutes=grace_minutes
    ):
        return appointment, False

    from ..models.appointment import Appointment

    updated = Appointment.update(
        appointment["_id"],
        {"status": "rejected", "rejection_reason": reason},
    )
    return updated or appointment, True


def mark_expired_appointments_no_show(appointments, tz=DEFAULT_TIMEZONE, grace_minutes=0):
    if not appointments:
        return appointments

    now = datetime.now(tz)
    updated = []
    for appointment in appointments:
        refreshed, _ = mark_expired_no_show(
            appointment, now=now, tz=tz, grace_minutes=grace_minutes
        )
        updated.append(refreshed)
    return updated


def mark_expired_appointments(appointments, tz=DEFAULT_TIMEZONE, grace_minutes=0):
    if not appointments:
        return appointments

    now = datetime.now(tz)
    updated = []
    for appointment in appointments:
        refreshed, marked = mark_expired_no_show(
            appointment, now=now, tz=tz, grace_minutes=grace_minutes
        )
        if not marked:
            refreshed, _ = mark_expired_rejected(
                appointment, now=now, tz=tz, grace_minutes=grace_minutes
            )
        updated.append(refreshed)
    return updated
