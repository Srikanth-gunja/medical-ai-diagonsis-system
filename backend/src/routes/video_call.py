"""
Video Call Socket.IO Event Handlers

Implements WebRTC signaling for 1-to-1 video calls between doctors and patients.
All events require JWT authentication passed via query parameter.

Events:
- connect: Authenticate with JWT
- join_room: Join appointment-based room
- offer: Forward SDP offer to peer
- answer: Forward SDP answer to peer
- ice_candidate: Forward ICE candidates to peer
- call_end: End call and notify peer

Security:
- JWT validation on connect
- Appointment ownership validation
- No video/audio data passes through server (peer-to-peer WebRTC)
"""

import json
import logging
from typing import Optional
from functools import wraps
from flask import request
from flask_socketio import SocketIO, emit, join_room, leave_room, disconnect
from flask_jwt_extended import decode_token
from jwt.exceptions import InvalidTokenError
from ..services.video_call_service import VideoCallService

logger = logging.getLogger(__name__)

# Will be initialized by create_app
socketio: Optional[SocketIO] = None


def init_socketio(app, cors_allowed_origins="*"):
    """Initialize Socket.IO with the Flask app."""
    global socketio
    socketio = SocketIO(
        app,
        cors_allowed_origins=cors_allowed_origins,
        async_mode='eventlet',
        logger=False,  # Disable verbose Socket.IO logging
        engineio_logger=False
    )
    register_events()
    return socketio


def get_user_from_token(token: str) -> dict | None:
    """
    Decode JWT token and extract user information.
    
    Args:
        token: JWT access token
        
    Returns:
        User dict with 'id' and 'role', or None if invalid
    """
    try:
        decoded = decode_token(token)
        identity = decoded.get('sub')
        if isinstance(identity, str):
            return json.loads(identity)
        return identity
    except (InvalidTokenError, json.JSONDecodeError) as e:
        logger.warning(f"Invalid token: {type(e).__name__}")
        return None


# Store user info in socket session
_socket_sessions: dict[str, dict] = {}


def register_events():
    """Register all Socket.IO event handlers."""
    
    @socketio.on('connect')
    def handle_connect():
        """
        Handle new socket connection.
        Authenticates using JWT token from query parameter.
        """
        token = request.args.get('token')
        
        if not token:
            logger.warning("Connection rejected: No token provided")
            disconnect()
            return False
        
        user = get_user_from_token(token)
        if not user:
            logger.warning("Connection rejected: Invalid token")
            disconnect()
            return False
        
        # Store user info for this session
        sid = request.sid
        _socket_sessions[sid] = {
            'user_id': user['id'],
            'role': user['role'],
            'room': None
        }
        
        logger.info(f"Socket connected: {user['role']} (session: {sid[:8]}...)")
        emit('connected', {'status': 'ok', 'role': user['role']})
        return True
    
    @socketio.on('disconnect')
    def handle_disconnect():
        """
        Handle socket disconnection.
        Cleans up room membership and notifies peer.
        """
        sid = request.sid
        session = _socket_sessions.pop(sid, None)
        
        if session and session.get('room'):
            room_id = session['room']
            # Remove from room and notify other participant
            result = VideoCallService.remove_participant(room_id, sid=sid)
            if result:
                emit('peer_disconnected', {'role': result['role']}, room=room_id)
                logger.info(f"Call lifecycle: {result['role']} disconnected from room {room_id}")
    
    @socketio.on('join_room')
    def handle_join_room(data):
        """
        Handle room join request.
        
        Expected data: { 'appointmentId': string }
        
        Validates:
        - User is authenticated
        - User has access to the appointment
        - Room is not full
        - User is not already in room
        """
        sid = request.sid
        session = _socket_sessions.get(sid)
        
        if not session:
            emit('error', {'message': 'Not authenticated'})
            return
        
        appointment_id = data.get('appointmentId')
        if not appointment_id:
            emit('error', {'message': 'Appointment ID required'})
            return
        
        user_id = session['user_id']
        role = session['role']
        
        # Validate appointment access
        is_valid, error = VideoCallService.validate_appointment_access(
            user_id, role, appointment_id
        )
        if not is_valid:
            emit('error', {'message': error})
            return
        
        # Check if already in room
        if VideoCallService.is_user_in_room(appointment_id, user_id):
            emit('error', {'message': 'Already in this room'})
            return
        
        # Check room capacity
        can_join, error = VideoCallService.can_join_room(appointment_id, role)
        if not can_join:
            emit('error', {'message': error})
            return
        
        # Join the room
        join_room(appointment_id)
        VideoCallService.add_participant(appointment_id, user_id, role, sid)
        session['room'] = appointment_id
        
        # Check if peer is already in room
        other = VideoCallService.get_other_participant(appointment_id, user_id)
        
        if other:
            # Peer exists - notify both parties
            # The new joiner should create the offer
            emit('room_joined', {
                'room': appointment_id,
                'role': role,
                'peerConnected': True,
                'shouldCreateOffer': True  # New joiner creates offer
            })
            # Notify existing peer
            emit('peer_joined', {'role': role}, room=other['sid'])
        else:
            # First in room - wait for peer
            emit('room_joined', {
                'room': appointment_id,
                'role': role,
                'peerConnected': False,
                'shouldCreateOffer': False
            })
        
        logger.info(f"Call lifecycle: {role} joined room {appointment_id}, participants: {VideoCallService.get_participant_count(appointment_id)}")
    
    @socketio.on('offer')
    def handle_offer(data):
        """
        Forward WebRTC SDP offer to peer.
        
        Expected data: { 'offer': RTCSessionDescriptionInit }
        """
        sid = request.sid
        session = _socket_sessions.get(sid)
        
        if not session or not session.get('room'):
            emit('error', {'message': 'Not in a room'})
            return
        
        room_id = session['room']
        other = VideoCallService.get_other_participant(room_id, session['user_id'])
        
        if other:
            emit('offer', {'offer': data.get('offer')}, room=other['sid'])
            logger.debug(f"Offer forwarded in room {room_id}")
    
    @socketio.on('answer')
    def handle_answer(data):
        """
        Forward WebRTC SDP answer to peer.
        
        Expected data: { 'answer': RTCSessionDescriptionInit }
        """
        sid = request.sid
        session = _socket_sessions.get(sid)
        
        if not session or not session.get('room'):
            emit('error', {'message': 'Not in a room'})
            return
        
        room_id = session['room']
        other = VideoCallService.get_other_participant(room_id, session['user_id'])
        
        if other:
            emit('answer', {'answer': data.get('answer')}, room=other['sid'])
            logger.debug(f"Answer forwarded in room {room_id}")
    
    @socketio.on('ice_candidate')
    def handle_ice_candidate(data):
        """
        Forward ICE candidate to peer.
        
        Expected data: { 'candidate': RTCIceCandidate }
        """
        sid = request.sid
        session = _socket_sessions.get(sid)
        
        if not session or not session.get('room'):
            return  # Silently ignore if not in room
        
        room_id = session['room']
        other = VideoCallService.get_other_participant(room_id, session['user_id'])
        
        if other:
            emit('ice_candidate', {'candidate': data.get('candidate')}, room=other['sid'])
    
    @socketio.on('call_end')
    def handle_call_end():
        """
        Handle call end request.
        Notifies peer and cleans up room membership.
        """
        sid = request.sid
        session = _socket_sessions.get(sid)
        
        if not session or not session.get('room'):
            return
        
        room_id = session['room']
        user_id = session['user_id']
        role = session['role']
        
        # Notify peer before leaving
        other = VideoCallService.get_other_participant(room_id, user_id)
        if other:
            emit('call_ended', {'endedBy': role}, room=other['sid'])
        
        # Leave the room
        leave_room(room_id)
        VideoCallService.remove_participant(room_id, user_id=user_id)
        session['room'] = None
        
        emit('call_ended', {'endedBy': 'self'})
        logger.info(f"Call lifecycle: {role} ended call in room {room_id}")
    
    @socketio.on('call_invite')
    def handle_call_invite(data):
        """
        Handle call invite - notify the other party of incoming call.
        
        Expected data: { 'appointmentId': string }
        
        Flow:
        1. Caller clicks "Video Call" button
        2. Server sends 'incoming_call' to the other party
        3. Other party sees accept/decline popup
        4. If accepted, both join the room
        """
        sid = request.sid
        session = _socket_sessions.get(sid)
        
        if not session:
            emit('error', {'message': 'Not authenticated'})
            return
        
        appointment_id = data.get('appointmentId')
        if not appointment_id:
            emit('error', {'message': 'Appointment ID required'})
            return
        
        user_id = session['user_id']
        role = session['role']
        
        # Validate appointment access
        is_valid, error = VideoCallService.validate_appointment_access(
            user_id, role, appointment_id
        )
        if not is_valid:
            emit('error', {'message': error})
            return
        
        # Store pending invite
        VideoCallService.add_pending_invite(appointment_id, user_id, role, sid)
        
        # Get caller name for the notification
        caller_name = VideoCallService.get_user_display_name(user_id, role)
        
        # Notify the other party (broadcast to appointment room)
        # The other party needs to be connected to receive this
        emit('incoming_call', {
            'appointmentId': appointment_id,
            'callerRole': role,
            'callerName': caller_name,
            'callerId': user_id
        }, broadcast=True, include_self=False)
        
        # Confirm to caller that invite was sent
        emit('invite_sent', {
            'appointmentId': appointment_id,
            'status': 'waiting'
        })
        
        logger.info(f"Call invite: {role} initiated call for appointment {appointment_id}")
    
    @socketio.on('call_accept')
    def handle_call_accept(data):
        """
        Handle call accept - both parties join the room.
        
        Expected data: { 'appointmentId': string }
        """
        sid = request.sid
        session = _socket_sessions.get(sid)
        
        if not session:
            emit('error', {'message': 'Not authenticated'})
            return
        
        appointment_id = data.get('appointmentId')
        if not appointment_id:
            emit('error', {'message': 'Appointment ID required'})
            return
        
        user_id = session['user_id']
        role = session['role']
        
        # Get pending invite
        invite = VideoCallService.get_pending_invite(appointment_id)
        if not invite:
            emit('error', {'message': 'No pending invite for this appointment'})
            return
        
        # Notify the caller that call was accepted
        caller_sid = invite.get('sid')
        if caller_sid and caller_sid in _socket_sessions:
            emit('call_accepted', {
                'appointmentId': appointment_id,
                'acceptedBy': role
            }, room=caller_sid)
        
        # Clear pending invite
        VideoCallService.remove_pending_invite(appointment_id)
        
        # Confirm to acceptor
        emit('call_accepted', {
            'appointmentId': appointment_id,
            'acceptedBy': 'self'
        })
        
        logger.info(f"Call accepted: {role} accepted call for appointment {appointment_id}")
    
    @socketio.on('call_decline')
    def handle_call_decline(data):
        """
        Handle call decline - notify caller that call was declined.
        
        Expected data: { 'appointmentId': string }
        """
        sid = request.sid
        session = _socket_sessions.get(sid)
        
        if not session:
            emit('error', {'message': 'Not authenticated'})
            return
        
        appointment_id = data.get('appointmentId')
        if not appointment_id:
            emit('error', {'message': 'Appointment ID required'})
            return
        
        role = session['role']
        
        # Get pending invite
        invite = VideoCallService.get_pending_invite(appointment_id)
        if not invite:
            emit('error', {'message': 'No pending invite for this appointment'})
            return
        
        # Notify the caller that call was declined
        caller_sid = invite.get('sid')
        if caller_sid and caller_sid in _socket_sessions:
            emit('call_declined', {
                'appointmentId': appointment_id,
                'declinedBy': role
            }, room=caller_sid)
        
        # Clear pending invite
        VideoCallService.remove_pending_invite(appointment_id)
        
        # Confirm to decliner
        emit('call_declined', {
            'appointmentId': appointment_id,
            'declinedBy': 'self'
        })
        
        logger.info(f"Call declined: {role} declined call for appointment {appointment_id}")
    
    @socketio.on('cancel_invite')
    def handle_cancel_invite(data):
        """
        Handle invite cancellation - caller cancelled before answer.
        
        Expected data: { 'appointmentId': string }
        """
        sid = request.sid
        session = _socket_sessions.get(sid)
        
        if not session:
            return
        
        appointment_id = data.get('appointmentId')
        if not appointment_id:
            return
        
        # Clear pending invite
        VideoCallService.remove_pending_invite(appointment_id)
        
        # Notify everyone that invite was cancelled
        emit('invite_cancelled', {
            'appointmentId': appointment_id
        }, broadcast=True, include_self=False)
        
        logger.info(f"Call invite cancelled for appointment {appointment_id}")
