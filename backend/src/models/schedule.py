from bson import ObjectId
from datetime import datetime
from ..database import get_db, SCHEDULES_COLLECTION


class Schedule:
    """Model for doctor schedules/availability."""
    
    @staticmethod
    def create_or_update(doctor_id, weekly_schedule, blocked_dates=None, slot_duration=30):
        """Create or update doctor's schedule."""
        db = get_db()
        if isinstance(doctor_id, str):
            doctor_id = ObjectId(doctor_id)
        
        schedule_data = {
            'doctor_id': doctor_id,
            'weekly_schedule': weekly_schedule,  # {monday: {start: "09:00", end: "17:00", enabled: true}, ...}
            'blocked_dates': blocked_dates or [],  # List of blocked date strings
            'slot_duration': slot_duration,  # in minutes
            'updated_at': datetime.utcnow()
        }
        
        # Upsert - update if exists, insert if not
        result = db[SCHEDULES_COLLECTION].update_one(
            {'doctor_id': doctor_id},
            {'$set': schedule_data},
            upsert=True
        )
        
        return Schedule.find_by_doctor_id(doctor_id)
    
    @staticmethod
    def find_by_doctor_id(doctor_id):
        """Get schedule for a doctor."""
        db = get_db()
        if isinstance(doctor_id, str):
            doctor_id = ObjectId(doctor_id)
        return db[SCHEDULES_COLLECTION].find_one({'doctor_id': doctor_id})
    
    @staticmethod
    def get_available_slots(doctor_id, date_str):
        """Get available time slots for a specific date."""
        from ..models.appointment import Appointment
        from datetime import datetime as dt, timedelta
        
        schedule = Schedule.find_by_doctor_id(doctor_id)
        if not schedule:
            # Return default slots if no schedule set
            default_slots = ["9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", 
                    "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM"]
            # Filter out past slots for default schedule too
            return Schedule._filter_past_slots(default_slots, date_str)
        
        # Check if date is blocked
        if date_str in schedule.get('blocked_dates', []):
            return []
        
        # Get day of week
        date_obj = dt.strptime(date_str, '%Y-%m-%d')
        day_name = date_obj.strftime('%A').lower()
        
        weekly = schedule.get('weekly_schedule', {})
        day_schedule = weekly.get(day_name, {})
        
        if not day_schedule.get('enabled', False):
            return []
        
        # Generate time slots based on schedule
        start_time = day_schedule.get('start', '09:00')
        end_time = day_schedule.get('end', '17:00')
        slot_duration = schedule.get('slot_duration', 30)
        
        slots = Schedule._generate_time_slots(start_time, end_time, slot_duration)
        
        # Filter out past time slots if the date is today
        slots = Schedule._filter_past_slots(slots, date_str)
        
        # Get booked appointments for this doctor on this date
        if isinstance(doctor_id, str):
            doctor_id = ObjectId(doctor_id)
        
        db = get_db()
        from ..database import APPOINTMENTS_COLLECTION
        booked = db[APPOINTMENTS_COLLECTION].find({
            'doctor_id': doctor_id,
            'date': date_str,
            'status': {'$nin': ['cancelled', 'rejected']}
        })
        
        booked_times = [appt['time'] for appt in booked]
        
        # Filter out booked slots
        available_slots = [slot for slot in slots if slot not in booked_times]
        
        return available_slots
    
    @staticmethod
    def _filter_past_slots(slots, date_str):
        """Filter out slots that have already passed if date is today."""
        from datetime import datetime as dt, timedelta
        
        # Parse the requested date
        requested_date = dt.strptime(date_str, '%Y-%m-%d').date()
        today = dt.now().date()
        
        # If the date is not today, return all slots
        if requested_date != today:
            return slots
        
        # Get current time with a 30-minute buffer (minimum booking lead time)
        now = dt.now()
        min_booking_time = now + timedelta(minutes=30)
        
        filtered_slots = []
        for slot in slots:
            # Parse slot time like "9:00 AM" or "2:30 PM"
            try:
                slot_time = dt.strptime(slot, '%I:%M %p')
                # Combine with today's date
                slot_datetime = dt.combine(today, slot_time.time())
                
                # Only include slots that are after the minimum booking time
                if slot_datetime > min_booking_time:
                    filtered_slots.append(slot)
            except ValueError:
                # If parsing fails, include the slot anyway
                filtered_slots.append(slot)
        
        return filtered_slots
    
    @staticmethod
    def _generate_time_slots(start_time, end_time, duration_minutes):
        """Generate time slots between start and end times."""
        from datetime import datetime as dt, timedelta
        
        slots = []
        start = dt.strptime(start_time, '%H:%M')
        end = dt.strptime(end_time, '%H:%M')
        
        current = start
        while current < end:
            # Format as "9:00 AM"
            slots.append(current.strftime('%-I:%M %p').replace(' 0', ' '))
            current += timedelta(minutes=duration_minutes)
        
        return slots
    
    @staticmethod
    def to_dict(schedule):
        """Convert schedule to dictionary."""
        if not schedule:
            return None
        return {
            'id': str(schedule['_id']),
            'doctorId': str(schedule['doctor_id']),
            'weeklySchedule': schedule.get('weekly_schedule', {}),
            'blockedDates': schedule.get('blocked_dates', []),
            'slotDuration': schedule.get('slot_duration', 30),
            'updatedAt': schedule.get('updated_at', '').isoformat() if schedule.get('updated_at') else ''
        }
