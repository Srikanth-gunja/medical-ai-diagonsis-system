"""
Video Call Signaling Service

Handles room management, participant validation, and call lifecycle tracking
for WebRTC video calls between doctors and patients.

Security:
- Validates appointment ownership before allowing room access
- Enforces 1 doctor + 1 patient per room
- Tracks participants to prevent duplicate connections
"""

import logging
from typing import Optional
# Note: bson import not needed - appointment ID is passed as string
from ..models.appointment import Appointment
from ..models.doctor import Doctor
from ..models.patient import Patient

# Configure logger - never log sensitive data like JWTs
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# In-memory room storage: { room_id: { 'participants': [{ 'user_id', 'role', 'sid' }] } }
# In production, consider Redis for multi-instance support
_active_rooms: dict[str, dict] = {}


class VideoCallService:
    """
    Service for managing video call rooms and participants.
    
    Follows Single Responsibility Principle - handles only room/participant logic.
    Signaling events are handled separately in the routes.
    """
    
    @staticmethod
    def validate_appointment_access(user_id: str, role: str, appointment_id: str) -> tuple[bool, str]:
        """
        Validate that a user has access to the appointment.
        
        Args:
            user_id: The user's ID from JWT
            role: 'doctor' or 'patient'
            appointment_id: The appointment ID (used as room ID)
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        try:
            appointment = Appointment.find_by_id(appointment_id)
            if not appointment:
                logger.warning(f"Appointment not found: {appointment_id}")
                return False, "Appointment not found"
            
            # Check appointment status - only confirmed appointments can have video calls
            if appointment.get('status') != 'confirmed':
                logger.warning(f"Appointment {appointment_id} is not confirmed")
                return False, "Appointment is not confirmed"
            
            if role == 'patient':
                # Patient's user_id is stored as patient_id in appointment
                if str(appointment['patient_id']) != user_id:
                    logger.warning(f"Patient {user_id} not authorized for appointment {appointment_id}")
                    return False, "Not authorized for this appointment"
            elif role == 'doctor':
                # Doctor's profile _id is stored as doctor_id in appointment
                # We need to find the doctor by user_id first
                doctor = Doctor.find_by_user_id(user_id)
                if not doctor:
                    logger.warning(f"Doctor profile not found for user {user_id}")
                    return False, "Doctor profile not found"
                if str(appointment['doctor_id']) != str(doctor['_id']):
                    logger.warning(f"Doctor {user_id} not authorized for appointment {appointment_id}")
                    return False, "Not authorized for this appointment"
            else:
                return False, "Invalid role"
            
            logger.info(f"Access validated for {role} to appointment {appointment_id}")
            return True, ""
            
        except Exception as e:
            logger.error(f"Error validating appointment access: {e}")
            return False, "Internal error validating access"
    
    @staticmethod
    def can_join_room(room_id: str, role: str) -> tuple[bool, str]:
        """
        Check if a user with the given role can join the room.
        
        Enforces:
        - Maximum 2 participants per room
        - Only 1 doctor and 1 patient per room
        
        Args:
            room_id: The appointment ID
            role: 'doctor' or 'patient'
            
        Returns:
            Tuple of (can_join, error_message)
        """
        if room_id not in _active_rooms:
            return True, ""
        
        room = _active_rooms[room_id]
        participants = room.get('participants', [])
        
        if len(participants) >= 2:
            return False, "Room is full"
        
        # Check if a user with this role is already in the room
        for p in participants:
            if p['role'] == role:
                return False, f"A {role} is already in this call"
        
        return True, ""
    
    @staticmethod
    def is_user_in_room(room_id: str, user_id: str) -> bool:
        """Check if a user is already in the room."""
        if room_id not in _active_rooms:
            return False
        
        participants = _active_rooms[room_id].get('participants', [])
        return any(p['user_id'] == user_id for p in participants)
    
    @staticmethod
    def add_participant(room_id: str, user_id: str, role: str, sid: str) -> None:
        """
        Add a participant to the room.
        
        Args:
            room_id: The appointment ID
            user_id: User's ID
            role: 'doctor' or 'patient'
            sid: Socket.IO session ID
        """
        if room_id not in _active_rooms:
            _active_rooms[room_id] = {'participants': []}
        
        _active_rooms[room_id]['participants'].append({
            'user_id': user_id,
            'role': role,
            'sid': sid
        })
        
        logger.info(f"Call lifecycle: {role} joined room {room_id} (session: {sid[:8]}...)")
    
    @staticmethod
    def remove_participant(room_id: str, user_id: Optional[str] = None, sid: Optional[str] = None) -> Optional[dict]:
        """
        Remove a participant from the room.
        
        Args:
            room_id: The appointment ID
            user_id: User's ID (optional)
            sid: Socket.IO session ID (optional, used for disconnect cleanup)
            
        Returns:
            The removed participant info, or None if not found
        """
        if room_id not in _active_rooms:
            return None
        
        participants = _active_rooms[room_id]['participants']
        removed = None
        
        for i, p in enumerate(participants):
            if (user_id and p['user_id'] == user_id) or (sid and p['sid'] == sid):
                removed = participants.pop(i)
                logger.info(f"Call lifecycle: {removed['role']} left room {room_id}")
                break
        
        # Clean up empty rooms
        if not participants:
            del _active_rooms[room_id]
            logger.info(f"Call lifecycle: Room {room_id} closed (empty)")
        
        return removed
    
    @staticmethod
    def remove_participant_by_sid(sid: str) -> Optional[tuple[str, dict]]:
        """
        Remove a participant from any room by their socket session ID.
        Used for handling disconnects.
        
        Args:
            sid: Socket.IO session ID
            
        Returns:
            Tuple of (room_id, participant_info) or None
        """
        for room_id in list(_active_rooms.keys()):
            result = VideoCallService.remove_participant(room_id, sid=sid)
            if result:
                return room_id, result
        return None
    
    @staticmethod
    def get_other_participant(room_id: str, user_id: str) -> Optional[dict]:
        """
        Get the other participant in the room.
        
        Args:
            room_id: The appointment ID
            user_id: The current user's ID
            
        Returns:
            The other participant's info, or None
        """
        if room_id not in _active_rooms:
            return None
        
        participants = _active_rooms[room_id].get('participants', [])
        for p in participants:
            if p['user_id'] != user_id:
                return p
        return None
    
    @staticmethod
    def get_room_participants(room_id: str) -> list[dict]:
        """Get all participants in a room."""
        if room_id not in _active_rooms:
            return []
        return _active_rooms[room_id].get('participants', [])
    
    @staticmethod
    def get_participant_count(room_id: str) -> int:
        """Get the number of participants in a room."""
        return len(VideoCallService.get_room_participants(room_id))
    
    # ========== Pending Invites Management ==========
    # Stores incoming call invites: { appointment_id: { user_id, role, sid, timestamp } }
    
    @staticmethod
    def add_pending_invite(appointment_id: str, user_id: str, role: str, sid: str) -> None:
        """
        Store a pending call invite.
        
        Args:
            appointment_id: The appointment ID
            user_id: Caller's user ID
            role: Caller's role ('doctor' or 'patient')
            sid: Caller's socket session ID
        """
        import time
        _pending_invites[appointment_id] = {
            'user_id': user_id,
            'role': role,
            'sid': sid,
            'timestamp': time.time()
        }
        logger.info(f"Pending invite added for appointment {appointment_id} by {role}")
    
    @staticmethod
    def get_pending_invite(appointment_id: str) -> Optional[dict]:
        """Get a pending invite for an appointment."""
        return _pending_invites.get(appointment_id)
    
    @staticmethod
    def remove_pending_invite(appointment_id: str) -> Optional[dict]:
        """Remove and return a pending invite."""
        invite = _pending_invites.pop(appointment_id, None)
        if invite:
            logger.info(f"Pending invite removed for appointment {appointment_id}")
        return invite
    
    @staticmethod
    def get_user_display_name(user_id: str, role: str) -> str:
        """
        Get a display name for a user based on their role.
        
        Args:
            user_id: User's ID
            role: 'doctor' or 'patient'
            
        Returns:
            Display name string
        """
        try:
            if role == 'doctor':
                doctor = Doctor.find_by_user_id(user_id)
                if doctor:
                    return f"Dr. {doctor.get('firstName', '')} {doctor.get('lastName', '')}".strip()
            elif role == 'patient':
                patient = Patient.find_by_user_id(user_id)
                if patient:
                    return f"{patient.get('firstName', '')} {patient.get('lastName', '')}".strip()
        except Exception as e:
            logger.error(f"Error getting display name: {e}")
        
        return role.capitalize()


# Pending invites storage
_pending_invites: dict[str, dict] = {}
