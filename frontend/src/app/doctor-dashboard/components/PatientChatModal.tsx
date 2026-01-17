'use client';

import { useState, useEffect, useRef } from 'react';
import Icon from '@/components/ui/AppIcon';
import { messagesApi, authApi } from '@/lib/api';

interface Message {
    id: string;
    senderId: string;
    senderRole: 'patient' | 'doctor';
    content: string;
    createdAt?: string;
    read: boolean;
}

interface ChatAppointment {
    id: string;
    patientName: string;
    patientImage?: string;
    date: string;
    time: string;
    status: string;
    patientId: string;
}

interface PatientChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    appointment: ChatAppointment;
}

const PatientChatModal = ({ isOpen, onClose, appointment }: PatientChatModalProps) => {
    const user = authApi.getUser();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [chatStatus, setChatStatus] = useState<{
        canChat: boolean;
        timeMessage: string;
        isInTimeWindow: boolean;
    } | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const pollInterval = useRef<NodeJS.Timeout | null>(null);

    // Initial fetch and polling setup
    useEffect(() => {
        if (isOpen && appointment.id) {
            setIsLoading(true);
            setError(null);
            fetchChatStatus();
            fetchMessages();
            // Poll for new messages every 5 seconds
            pollInterval.current = setInterval(fetchMessages, 5000);
        } else {
            if (pollInterval.current) {
                clearInterval(pollInterval.current);
            }
        }

        return () => {
            if (pollInterval.current) {
                clearInterval(pollInterval.current);
            }
        };
    }, [isOpen, appointment.id]);

    // Scroll to bottom on new messages
    useEffect(() => {
        if (messages.length > 0) {
            scrollToBottom();
        }
    }, [messages]);

    const fetchChatStatus = async () => {
        try {
            const status = await messagesApi.getChatStatus(appointment.id);
            setChatStatus(status);
        } catch (err) {
            console.error('Failed to fetch chat status:', err);
        }
    };

    const fetchMessages = async () => {
        try {
            const data = await messagesApi.getMessages(appointment.id);
            setMessages(data);
            setError(null);
        } catch (err: any) {
            console.error('Failed to fetch messages:', err);
            if (err.message?.includes('Unauthorized')) {
                setError('You are not authorized to view these messages');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isSending) return;

        const content = inputValue.trim();

        // Optimistic update
        const tempMessage: Message = {
            id: `temp-${Date.now()}`,
            senderId: user?.id || '',
            senderRole: 'doctor',
            content,
            createdAt: new Date().toISOString(),
            read: false
        };
        setMessages(prev => [...prev, tempMessage]);
        setInputValue('');
        setIsSending(true);

        try {
            await messagesApi.send(appointment.id, content);
            await fetchMessages(); // Refresh to get actual message with ID
        } catch (err: any) {
            console.error('Failed to send message:', err);
            // Remove temp message on error
            setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
            setInputValue(content); // Restore input
            setError(err.message || 'Failed to send message');
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const isDoctorSender = (message: Message) => {
        return message.senderRole === 'doctor';
    };

    const formatTime = (dateString?: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg mx-4 bg-card border border-border rounded-2xl shadow-elevation-3 flex flex-col h-[80vh] sm:h-[600px] animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-accent/5 to-transparent">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                            {appointment.patientImage ? (
                                <img src={appointment.patientImage} alt={appointment.patientName} className="w-full h-full object-cover" />
                            ) : (
                                <Icon name="UserIcon" size={24} className="text-accent" />
                            )}
                        </div>
                        <div>
                            <h3 className="font-semibold text-text-primary">{appointment.patientName}</h3>
                            <div className="flex items-center space-x-1.5">
                                <div className={`w-2 h-2 rounded-full ${chatStatus?.canChat ? 'bg-success animate-pulse' : 'bg-muted-foreground'}`} />
                                <span className="text-xs text-text-secondary">
                                    {chatStatus?.canChat ? 'Active' : 'Unavailable'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="text-xs text-text-secondary bg-muted px-2 py-1 rounded-full">
                            {appointment.date} • {appointment.time}
                        </span>
                        <button
                            onClick={onClose}
                            className="p-2 text-text-secondary hover:text-text-primary hover:bg-muted rounded-lg transition-base"
                        >
                            <Icon name="XMarkIcon" size={20} />
                        </button>
                    </div>
                </div>

                {/* Chat Status Banner */}
                {chatStatus && !chatStatus.isInTimeWindow && (
                    <div className="px-4 py-2 bg-warning/10 border-b border-warning/20 flex items-center space-x-2">
                        <Icon name="ClockIcon" size={16} className="text-warning" />
                        <span className="text-xs text-warning">{chatStatus.timeMessage}</span>
                    </div>
                )}

                {/* Error Banner */}
                {error && (
                    <div className="px-4 py-2 bg-error/10 border-b border-error/20 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Icon name="ExclamationCircleIcon" size={16} className="text-error" />
                            <span className="text-xs text-error">{error}</span>
                        </div>
                        <button onClick={() => setError(null)} className="text-error hover:text-error/80">
                            <Icon name="XMarkIcon" size={14} />
                        </button>
                    </div>
                )}

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-background/30 to-background/50">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="flex flex-col items-center space-y-3">
                                <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
                                <span className="text-sm text-text-secondary">Loading messages...</span>
                            </div>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-8">
                            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-4">
                                <Icon name="ChatBubbleLeftRightIcon" size={32} className="text-accent" />
                            </div>
                            <p className="text-text-secondary font-medium">Start the conversation</p>
                            <p className="text-xs text-text-tertiary mt-1 max-w-[200px]">
                                Send a message to {appointment.patientName} about their consultation
                            </p>
                        </div>
                    ) : (
                        messages.map((message) => {
                            const isMe = isDoctorSender(message);
                            const isTemp = message.id.startsWith('temp-');
                            return (
                                <div
                                    key={message.id}
                                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[80%] px-4 py-2.5 rounded-2xl shadow-sm ${isMe
                                            ? 'bg-primary text-primary-foreground rounded-br-md'
                                            : 'bg-card border border-border text-text-primary rounded-bl-md'
                                            } ${isTemp ? 'opacity-70' : ''}`}
                                    >
                                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                                        <div className={`flex items-center justify-end space-x-1 mt-1 ${isMe ? 'text-primary-foreground/70' : 'text-text-tertiary'}`}>
                                            <span className="text-[10px]">
                                                {formatTime(message.createdAt)}
                                            </span>
                                            {isMe && !isTemp && (
                                                <Icon
                                                    name={message.read ? "CheckCircleIcon" : "CheckIcon"}
                                                    size={12}
                                                    className={message.read ? "text-white" : "text-white/50"}
                                                />
                                            )}
                                            {isTemp && (
                                                <div className="w-3 h-3 border border-white/50 border-t-white rounded-full animate-spin" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-card border-t border-border rounded-b-2xl">
                    <div className="flex items-center space-x-3">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder={chatStatus?.canChat ? "Type a message..." : "Chat unavailable"}
                                className="w-full h-11 px-4 py-2 bg-muted border border-border rounded-full text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-base"
                                disabled={isSending || !chatStatus?.canChat}
                            />
                        </div>
                        <button
                            onClick={handleSendMessage}
                            disabled={!inputValue.trim() || isSending || !chatStatus?.canChat}
                            className="p-3 bg-primary text-primary-foreground rounded-full hover:shadow-elevation-2 disabled:opacity-50 disabled:cursor-not-allowed transition-base flex items-center justify-center"
                        >
                            {isSending ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Icon name="PaperAirplaneIcon" size={18} />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PatientChatModal;
