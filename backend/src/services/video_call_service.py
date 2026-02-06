from getstream import Stream
from getstream.models import UserRequest
import os
from datetime import datetime, timedelta, timezone
try:
    from zoneinfo import ZoneInfo
except ImportError:  # pragma: no cover - fallback for older Python
    ZoneInfo = None
from ..database import get_db, APPOINTMENTS_COLLECTION
from bson import ObjectId


class VideoCallService:
    def __init__(self):
        self.api_key = os.environ.get("GETSTREAM_API_KEY")
        self.api_secret = os.environ.get("GETSTREAM_API_SECRET")
        self.client = None
        if self.api_key and self.api_secret:
            try:
                self.client = Stream(
                    api_key=self.api_key, api_secret=self.api_secret
                )
                print("Stream Video client initialized successfully")
            except Exception as e:
                print(f"Error initializing Stream client: {e}")

    def generate_user_token(
        self, user_id: str, user_name: str = None, role: str = "patient"
    ):
        """Generate GetStream token for video call authentication"""
        if not self.client:
            print("Stream client not initialized - check GETSTREAM_API_KEY and GETSTREAM_API_SECRET")
            return None

        try:
            # Create token with 24 hour expiration (in seconds)
            token = self.client.create_token(user_id, expiration=86400)

            # Upsert user in Stream to sync their details
            self._upsert_user_internal(user_id, user_name, role)

            return token
        except Exception as e:
            print(f"Error generating token: {e}")
            return None

    def _upsert_user_internal(self, user_id: str, user_name: str = None, role: str = "patient"):
        """Internal method to upsert user without returning result"""
        if not self.client:
            return

        try:
            self.client.upsert_users(
                UserRequest(
                    id=user_id,
                    name=user_name or user_id,
                    role="admin" if role == "doctor" else "user",
                )
            )
        except Exception as e:
            print(f"Error upserting user in Stream: {e}")

    def upsert_user(self, user_id: str, user_name: str = None, role: str = "patient"):
        """Create or update a user in Stream (for the other call participant)"""
        if not self.client:
            return False

        try:
            self.client.upsert_users(
                UserRequest(
                    id=user_id,
                    name=user_name or user_id,
                    role="admin" if role == "doctor" else "user",
                )
            )
            return True
        except Exception as e:
            print(f"Error upserting user in Stream: {e}")
            return False

    def create_call_id(self, appointment_id: str) -> str:
        """Generate call ID from appointment ID"""
        return f"appointment_{appointment_id}"

    def validate_call_access(
        self, user_id: str, appointment_id: str, role: str
    ) -> dict:
        """
        Validate user can access the video call.
        Returns appointment details if valid, None otherwise.
        """
        from ..models.doctor import Doctor
        
        db = get_db()
        try:
            appt_oid = ObjectId(appointment_id)
        except Exception:
            return None

        appointment = db[APPOINTMENTS_COLLECTION].find_one({"_id": appt_oid})

        if not appointment:
            return None

        # Check if user is participant
        # For patients: patient_id IS the user_id
        is_patient = str(appointment.get("patient_id")) == user_id
        
        # For doctors: doctor_id is Doctor._id, need to lookup doctor.user_id
        is_doctor = False
        if role == "doctor":
            doctor_doc_id = appointment.get("doctor_id")
            if doctor_doc_id:
                doctor = Doctor.find_by_id(str(doctor_doc_id))
                if doctor and str(doctor.get("user_id")) == user_id:
                    is_doctor = True

        if not (is_patient or is_doctor):
            return None

        # Check appointment status - allow pending or confirmed for now
        # Ideally only confirmed, but for testing pending might be useful
        if appointment.get("status") not in ["confirmed", "pending", "in_progress"]:
            return None

        # Validate time window - allow calls 30 mins before to 30 mins after appointment
        # Skip time validation for in_progress appointments (already started)
        if appointment.get("status") != "in_progress":
            appt_date_str = appointment.get("date")
            appt_time_str = appointment.get("time")

            if not appt_date_str or not appt_time_str:
                return None

            try:
                appt_date = datetime.strptime(appt_date_str, "%Y-%m-%d").date()
            except ValueError:
                return None

            time_str = appt_time_str.strip().upper()
            appt_time = None
            for fmt in ["%I:%M %p", "%I:%M%p", "%H:%M"]:
                try:
                    appt_time = datetime.strptime(time_str, fmt).time()
                    break
                except ValueError:
                    continue
            if not appt_time:
                return None

            tz_name = os.environ.get("APPOINTMENT_TIMEZONE", "UTC")
            try:
                tz = ZoneInfo(tz_name) if ZoneInfo else timezone.utc
            except Exception:
                tz = timezone.utc

            appt_datetime = datetime.combine(appt_date, appt_time, tzinfo=tz)
            now = datetime.now(tz)

            grace_before = timedelta(minutes=30)
            grace_after = timedelta(minutes=30)
            earliest_allowed = appt_datetime - grace_before
            latest_allowed = appt_datetime + grace_after

            if now < earliest_allowed or now > latest_allowed:
                print(
                    "Video call access denied - outside time window. "
                    f"Now: {now}, Appointment: {appt_datetime}"
                )
                return None

        return appointment
