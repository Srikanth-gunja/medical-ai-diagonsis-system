/**
 * Signaling Service
 * 
 * Handles Socket.IO connection for WebRTC signaling.
 * Manages room joining, offer/answer exchange, and ICE candidate forwarding.
 * 
 * Security: JWT token is passed via query parameter (not exposed in logs)
 */

import { io, Socket } from 'socket.io-client';

// Types for signaling events
export interface RoomJoinedData {
    room: string;
    role: 'doctor' | 'patient';
    peerConnected: boolean;
    shouldCreateOffer: boolean;
}

export interface SignalingEventHandlers {
    onConnected?: (data: { status: string; role: string }) => void;
    onRoomJoined?: (data: RoomJoinedData) => void;
    onPeerJoined?: (data: { role: string }) => void;
    onPeerDisconnected?: (data: { role: string }) => void;
    onOffer?: (data: { offer: RTCSessionDescriptionInit }) => void;
    onAnswer?: (data: { answer: RTCSessionDescriptionInit }) => void;
    onIceCandidate?: (data: { candidate: RTCIceCandidateInit }) => void;
    onCallEnded?: (data: { endedBy: string }) => void;
    onError?: (data: { message: string }) => void;
    // Incoming call notification events
    onIncomingCall?: (data: IncomingCallData) => void;
    onInviteSent?: (data: { appointmentId: string; status: string }) => void;
    onCallAccepted?: (data: { appointmentId: string; acceptedBy: string }) => void;
    onCallDeclined?: (data: { appointmentId: string; declinedBy: string }) => void;
    onInviteCancelled?: (data: { appointmentId: string }) => void;
}

export interface IncomingCallData {
    appointmentId: string;
    callerRole: 'doctor' | 'patient';
    callerName: string;
    callerId: string;
}

/**
 * SignalingService - Singleton for managing WebSocket connection
 * 
 * Follows Single Responsibility Principle:
 * - Only handles signaling (WebSocket communication)
 * - WebRTC logic is separate in WebRTCService
 */
class SignalingService {
    private socket: Socket | null = null;
    private handlers: SignalingEventHandlers = {};
    private currentRoom: string | null = null;

    /**
     * Get the Socket.IO server URL from environment
     */
    private getSocketUrl(): string {
        return process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
    }

    /**
     * Connect to the signaling server with JWT authentication
     * 
     * @param token - JWT access token (passed securely via query param)
     */
    connect(token: string): void {
        if (this.socket?.connected) {
            console.log('[Signaling] Already connected');
            return;
        }

        const socketUrl = this.getSocketUrl();
        console.log('[Signaling] Connecting to:', socketUrl);

        this.socket = io(socketUrl, {
            query: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
        });

        this.setupEventListeners();
    }

    /**
     * Setup Socket.IO event listeners
     */
    private setupEventListeners(): void {
        if (!this.socket) return;

        // Connection events
        this.socket.on('connect', () => {
            console.log('[Signaling] Socket connected');
        });

        this.socket.on('disconnect', (reason) => {
            console.log('[Signaling] Socket disconnected:', reason);
        });

        this.socket.on('connect_error', (error) => {
            console.error('[Signaling] Connection error:', error.message);
            this.handlers.onError?.({ message: 'Connection failed: ' + error.message });
        });

        // Custom events from server
        this.socket.on('connected', (data) => {
            console.log('[Signaling] Authenticated as:', data.role);
            this.handlers.onConnected?.(data);
        });

        this.socket.on('room_joined', (data: RoomJoinedData) => {
            console.log('[Signaling] Room joined:', data.room, 'Peer connected:', data.peerConnected);
            this.currentRoom = data.room;
            this.handlers.onRoomJoined?.(data);
        });

        this.socket.on('peer_joined', (data) => {
            console.log('[Signaling] Peer joined:', data.role);
            this.handlers.onPeerJoined?.(data);
        });

        this.socket.on('peer_disconnected', (data) => {
            console.log('[Signaling] Peer disconnected:', data.role);
            this.handlers.onPeerDisconnected?.(data);
        });

        // WebRTC signaling events
        this.socket.on('offer', (data) => {
            console.log('[Signaling] Received offer');
            this.handlers.onOffer?.(data);
        });

        this.socket.on('answer', (data) => {
            console.log('[Signaling] Received answer');
            this.handlers.onAnswer?.(data);
        });

        this.socket.on('ice_candidate', (data) => {
            console.log('[Signaling] Received ICE candidate');
            this.handlers.onIceCandidate?.(data);
        });

        this.socket.on('call_ended', (data) => {
            console.log('[Signaling] Call ended by:', data.endedBy);
            this.currentRoom = null;
            this.handlers.onCallEnded?.(data);
        });

        this.socket.on('error', (data) => {
            console.error('[Signaling] Error:', data.message);
            this.handlers.onError?.(data);
        });

        // Incoming call notification events
        this.socket.on('incoming_call', (data) => {
            console.log('[Signaling] Incoming call from:', data.callerName);
            this.handlers.onIncomingCall?.(data);
        });

        this.socket.on('invite_sent', (data) => {
            console.log('[Signaling] Invite sent, waiting for response');
            this.handlers.onInviteSent?.(data);
        });

        this.socket.on('call_accepted', (data) => {
            console.log('[Signaling] Call accepted by:', data.acceptedBy);
            this.handlers.onCallAccepted?.(data);
        });

        this.socket.on('call_declined', (data) => {
            console.log('[Signaling] Call declined by:', data.declinedBy);
            this.handlers.onCallDeclined?.(data);
        });

        this.socket.on('invite_cancelled', (data) => {
            console.log('[Signaling] Invite cancelled');
            this.handlers.onInviteCancelled?.(data);
        });
    }

    /**
     * Set event handlers for signaling events
     */
    setHandlers(handlers: SignalingEventHandlers): void {
        this.handlers = handlers;
    }

    /**
     * Join an appointment room
     */
    joinRoom(appointmentId: string): void {
        if (!this.socket?.connected) {
            console.error('[Signaling] Not connected');
            return;
        }

        console.log('[Signaling] Joining room:', appointmentId);
        this.socket.emit('join_room', { appointmentId });
    }

    /**
     * Send WebRTC offer to peer
     */
    sendOffer(offer: RTCSessionDescriptionInit): void {
        if (!this.socket?.connected) {
            console.error('[Signaling] Not connected');
            return;
        }

        console.log('[Signaling] Sending offer');
        this.socket.emit('offer', { offer });
    }

    /**
     * Send WebRTC answer to peer
     */
    sendAnswer(answer: RTCSessionDescriptionInit): void {
        if (!this.socket?.connected) {
            console.error('[Signaling] Not connected');
            return;
        }

        console.log('[Signaling] Sending answer');
        this.socket.emit('answer', { answer });
    }

    /**
     * Send ICE candidate to peer
     */
    sendIceCandidate(candidate: RTCIceCandidate): void {
        if (!this.socket?.connected) {
            console.error('[Signaling] Not connected');
            return;
        }

        this.socket.emit('ice_candidate', { candidate: candidate.toJSON() });
    }

    /**
     * End the current call
     */
    endCall(): void {
        if (!this.socket?.connected) return;

        console.log('[Signaling] Ending call');
        this.socket.emit('call_end');
        this.currentRoom = null;
    }

    /**
     * Send a call invite to the other party
     */
    sendInvite(appointmentId: string): void {
        if (!this.socket?.connected) {
            console.error('[Signaling] Not connected');
            return;
        }

        console.log('[Signaling] Sending call invite for:', appointmentId);
        this.socket.emit('call_invite', { appointmentId });
    }

    /**
     * Accept an incoming call
     */
    acceptCall(appointmentId: string): void {
        if (!this.socket?.connected) {
            console.error('[Signaling] Not connected');
            return;
        }

        console.log('[Signaling] Accepting call for:', appointmentId);
        this.socket.emit('call_accept', { appointmentId });
    }

    /**
     * Decline an incoming call
     */
    declineCall(appointmentId: string): void {
        if (!this.socket?.connected) {
            console.error('[Signaling] Not connected');
            return;
        }

        console.log('[Signaling] Declining call for:', appointmentId);
        this.socket.emit('call_decline', { appointmentId });
    }

    /**
     * Cancel a pending invite
     */
    cancelInvite(appointmentId: string): void {
        if (!this.socket?.connected) return;

        console.log('[Signaling] Cancelling invite for:', appointmentId);
        this.socket.emit('cancel_invite', { appointmentId });
    }

    /**
     * Disconnect from the signaling server
     */
    disconnect(): void {
        if (this.socket) {
            console.log('[Signaling] Disconnecting');
            this.socket.disconnect();
            this.socket = null;
            this.currentRoom = null;
        }
    }

    /**
     * Check if connected to signaling server
     */
    isConnected(): boolean {
        return this.socket?.connected ?? false;
    }

    /**
     * Get the current room ID
     */
    getCurrentRoom(): string | null {
        return this.currentRoom;
    }
}

// Export singleton instance
export const signalingService = new SignalingService();
