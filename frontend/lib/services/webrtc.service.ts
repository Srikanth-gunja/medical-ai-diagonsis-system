/**
 * WebRTC Service
 * 
 * Handles WebRTC peer connection, media streams, and call controls.
 * Provides clean API for creating offers/answers and managing media.
 * 
 * ICE Configuration:
 * - Uses Google STUN servers for development
 * - Prepared for TURN servers in production (via environment variables)
 */

// ICE server configuration - uses STUN for development, supports TURN for production
const getIceServers = (): RTCIceServer[] => {
    const servers: RTCIceServer[] = [
        // Google's public STUN servers
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ];

    // Add TURN server if configured (for production NAT traversal)
    const turnServer = process.env.NEXT_PUBLIC_TURN_SERVER;
    const turnUsername = process.env.NEXT_PUBLIC_TURN_USERNAME;
    const turnCredential = process.env.NEXT_PUBLIC_TURN_CREDENTIAL;

    if (turnServer && turnUsername && turnCredential) {
        // Ensure URL has proper scheme
        let turnUrl = turnServer;
        if (!turnUrl.startsWith('turn:') && !turnUrl.startsWith('turns:')) {
            // Default to turn: with standard port if no scheme provided
            turnUrl = `turn:${turnUrl}`;
        }

        servers.push({
            urls: turnUrl,
            username: turnUsername,
            credential: turnCredential,
        });
    }

    return servers;
};

export interface WebRTCEventHandlers {
    onLocalStream?: (stream: MediaStream) => void;
    onRemoteStream?: (stream: MediaStream) => void;
    onIceCandidate?: (candidate: RTCIceCandidate) => void;
    onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
    onError?: (error: Error) => void;
}

/**
 * WebRTCService - Manages peer connection and media streams
 * 
 * Follows Single Responsibility Principle:
 * - Only handles WebRTC connection logic
 * - Signaling is handled separately by SignalingService
 */
class WebRTCService {
    private peerConnection: RTCPeerConnection | null = null;
    private localStream: MediaStream | null = null;
    private remoteStream: MediaStream | null = null;
    private handlers: WebRTCEventHandlers = {};

    // Track media states
    private isAudioEnabled: boolean = true;
    private isVideoEnabled: boolean = true;

    /**
     * Set event handlers for WebRTC events
     */
    setHandlers(handlers: WebRTCEventHandlers): void {
        this.handlers = handlers;
    }

    /**
     * Initialize WebRTC - get local media and create peer connection
     */
    async initialize(): Promise<void> {
        try {
            // Get local media stream
            this.localStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user',
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                },
            });

            console.log('[WebRTC] Local stream obtained');
            this.handlers.onLocalStream?.(this.localStream);

            // Create peer connection
            this.createPeerConnection();

        } catch (error) {
            console.error('[WebRTC] Failed to initialize:', error);
            this.handlers.onError?.(error as Error);
            throw error;
        }
    }

    /**
     * Create RTCPeerConnection with ICE configuration
     */
    private createPeerConnection(): void {
        const config: RTCConfiguration = {
            iceServers: getIceServers(),
            iceCandidatePoolSize: 10,
        };

        this.peerConnection = new RTCPeerConnection(config);
        console.log('[WebRTC] Peer connection created');

        // Add local tracks to connection
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                if (this.peerConnection && this.localStream) {
                    this.peerConnection.addTrack(track, this.localStream);
                }
            });
        }

        // Handle ICE candidates
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('[WebRTC] ICE candidate generated');
                this.handlers.onIceCandidate?.(event.candidate);
            }
        };

        // Handle remote stream
        this.peerConnection.ontrack = (event) => {
            console.log('[WebRTC] Remote track received');
            if (event.streams && event.streams[0]) {
                this.remoteStream = event.streams[0];
                this.handlers.onRemoteStream?.(this.remoteStream);
            }
        };

        // Handle connection state changes
        this.peerConnection.onconnectionstatechange = () => {
            const state = this.peerConnection?.connectionState;
            console.log('[WebRTC] Connection state:', state);
            if (state) {
                this.handlers.onConnectionStateChange?.(state);
            }
        };

        // Handle ICE connection state changes
        this.peerConnection.oniceconnectionstatechange = () => {
            console.log('[WebRTC] ICE connection state:', this.peerConnection?.iceConnectionState);
        };
    }

    /**
     * Create SDP offer (called by the joiner - second person to join)
     */
    async createOffer(): Promise<RTCSessionDescriptionInit> {
        if (!this.peerConnection) {
            throw new Error('Peer connection not initialized');
        }

        const offer = await this.peerConnection.createOffer({
            offerToReceiveVideo: true,
            offerToReceiveAudio: true,
        });

        await this.peerConnection.setLocalDescription(offer);
        console.log('[WebRTC] Offer created and set as local description');

        return offer;
    }

    /**
     * Create SDP answer in response to an offer
     */
    async createAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
        if (!this.peerConnection) {
            throw new Error('Peer connection not initialized');
        }

        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        console.log('[WebRTC] Remote description set from offer');

        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        console.log('[WebRTC] Answer created and set as local description');

        return answer;
    }

    /**
     * Set remote answer (called by the offerer after receiving answer)
     */
    async setRemoteAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
        if (!this.peerConnection) {
            throw new Error('Peer connection not initialized');
        }

        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        console.log('[WebRTC] Remote description set from answer');
    }

    /**
     * Add ICE candidate from remote peer
     */
    async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
        if (!this.peerConnection) {
            console.warn('[WebRTC] Cannot add ICE candidate: no peer connection');
            return;
        }

        try {
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            console.log('[WebRTC] ICE candidate added');
        } catch (error) {
            console.error('[WebRTC] Failed to add ICE candidate:', error);
        }
    }

    /**
     * Toggle audio mute/unmute
     */
    toggleAudio(enabled?: boolean): boolean {
        if (!this.localStream) return false;

        const audioTracks = this.localStream.getAudioTracks();
        this.isAudioEnabled = enabled ?? !this.isAudioEnabled;

        audioTracks.forEach(track => {
            track.enabled = this.isAudioEnabled;
        });

        console.log('[WebRTC] Audio:', this.isAudioEnabled ? 'enabled' : 'disabled');
        return this.isAudioEnabled;
    }

    /**
     * Toggle video on/off
     */
    toggleVideo(enabled?: boolean): boolean {
        if (!this.localStream) return false;

        const videoTracks = this.localStream.getVideoTracks();
        this.isVideoEnabled = enabled ?? !this.isVideoEnabled;

        videoTracks.forEach(track => {
            track.enabled = this.isVideoEnabled;
        });

        console.log('[WebRTC] Video:', this.isVideoEnabled ? 'enabled' : 'disabled');
        return this.isVideoEnabled;
    }

    /**
     * Get current audio enabled state
     */
    getAudioEnabled(): boolean {
        return this.isAudioEnabled;
    }

    /**
     * Get current video enabled state
     */
    getVideoEnabled(): boolean {
        return this.isVideoEnabled;
    }

    /**
     * Get the local media stream
     */
    getLocalStream(): MediaStream | null {
        return this.localStream;
    }

    /**
     * Get the remote media stream
     */
    getRemoteStream(): MediaStream | null {
        return this.remoteStream;
    }

    /**
     * Clean up all resources
     */
    cleanup(): void {
        console.log('[WebRTC] Cleaning up');

        // Stop all local tracks
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }

        // Stop all remote tracks
        if (this.remoteStream) {
            this.remoteStream.getTracks().forEach(track => track.stop());
            this.remoteStream = null;
        }

        // Close peer connection
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }

        this.isAudioEnabled = true;
        this.isVideoEnabled = true;
    }

    /**
     * Recreate peer connection (for reconnection scenarios)
     */
    async reconnect(): Promise<void> {
        console.log('[WebRTC] Reconnecting');

        // Keep local stream but recreate peer connection
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }

        this.createPeerConnection();
    }
}

// Export singleton instance
export const webrtcService = new WebRTCService();
