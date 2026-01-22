'use client';

import { useState, useEffect, useRef } from 'react';
import Icon from '@/components/ui/AppIcon';
import { messagesApi, appointmentsApi, authApi, type Appointment } from '@/lib/api';

interface Message {
  id: string;
  senderId: string;
  senderRole: 'patient' | 'doctor';
  content: string;
  createdAt?: string;
  read: boolean;
}

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  patientImage?: string;
}

const ChatPanel = ({ isOpen, onClose, patientId, patientName, patientImage }: ChatPanelProps) => {
  const user = authApi.getUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [canChat, setCanChat] = useState(false);
  const [hasAppointment, setHasAppointment] = useState(false);
  const [chatTimeMessage, setChatTimeMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollInterval = useRef<NodeJS.Timeout | null>(null);

  // Fetch appointments to find confirmed ones with this patient
  useEffect(() => {
    if (isOpen && patientId) {
      setIsLoading(true);
      setError(null);
      fetchAppointments();
    } else {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }
      setMessages([]);
      setSelectedAppointmentId(null);
    }

    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }
    };
  }, [isOpen, patientId]);

  // Fetch messages and check chat status when appointment is selected
  useEffect(() => {
    const fetchChatStatusForAppointment = async () => {
      if (!selectedAppointmentId) return;

      try {
        const status = await messagesApi.getChatStatus(selectedAppointmentId);
        setCanChat(status.canChat);
        setHasAppointment(true);
        if (!status.canChat && !status.isInTimeWindow) {
          setChatTimeMessage(status.timeMessage || 'Chat is not available at this time');
          setError(null);
        } else {
          setChatTimeMessage(null);
          setError(null);
        }
      } catch (err) {
        console.error('Failed to fetch chat status:', err);
        setCanChat(false);
      }
    };

    if (selectedAppointmentId) {
      fetchChatStatusForAppointment();
      fetchMessages();
      // Poll for new messages every 5 seconds
      pollInterval.current = setInterval(fetchMessages, 5000);
    }

    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }
    };
  }, [selectedAppointmentId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  const fetchAppointments = async () => {
    try {
      const allAppointments = await appointmentsApi.getAll();
      // Filter for confirmed appointments with this patient
      const patientAppointments = allAppointments.filter(
        (a) => a.patientId === patientId && a.status === 'confirmed'
      );
      setAppointments(patientAppointments);

      if (patientAppointments.length > 0) {
        const firstAppointmentId = patientAppointments[0].id;
        setSelectedAppointmentId(firstAppointmentId);
        setHasAppointment(true);

        // Check chat status from backend to respect time window
        try {
          const status = await messagesApi.getChatStatus(firstAppointmentId);
          setCanChat(status.canChat);
          if (!status.canChat && !status.isInTimeWindow) {
            setChatTimeMessage(status.timeMessage || 'Chat is not available at this time');
          } else {
            setChatTimeMessage(null);
          }
        } catch (statusErr) {
          console.error('Failed to fetch chat status:', statusErr);
          setCanChat(false);
        }
      } else {
        setHasAppointment(false);
        setChatTimeMessage(null);
        setCanChat(false);
        setError(
          'No active appointments with this patient. Chat is available during confirmed appointments.'
        );
      }
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
      setError('Failed to load appointments');
      setIsLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!selectedAppointmentId) return;

    try {
      const data = await messagesApi.getMessages(selectedAppointmentId);
      setMessages(data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch messages:', err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isSending || !selectedAppointmentId) return;

    const content = inputValue.trim();

    // Optimistic update
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      senderId: user?.id || '',
      senderRole: 'doctor',
      content,
      createdAt: new Date().toISOString(),
      read: false,
    };
    setMessages((prev) => [...prev, tempMessage]);
    setInputValue('');
    setIsSending(true);

    try {
      await messagesApi.send(selectedAppointmentId, content);
      await fetchMessages();
    } catch (err: any) {
      console.error('Failed to send message:', err);
      setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
      setInputValue(content);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        onClick={onClose}
      />

      {/* Slide-in Chat Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-card border-l border-border shadow-elevation-3 z-50 transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        {/* Gradient Header */}
        <div className="relative bg-gradient-to-br from-primary via-primary/90 to-accent p-6 pb-4">
          <div className="absolute inset-0 opacity-10 bg-gradient-to-r from-white/20 via-transparent to-white/10" />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden ring-2 ring-white/30">
                  {patientImage ? (
                    <img
                      src={patientImage}
                      alt={patientName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Icon name="UserIcon" size={28} className="text-white" />
                  )}
                </div>
                <div
                  className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${canChat ? 'bg-success animate-pulse' : 'bg-gray-400'}`}
                />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{patientName}</h2>
                <p className="text-white/70 text-sm">
                  {canChat
                    ? 'Online • Active appointment'
                    : hasAppointment && chatTimeMessage
                      ? chatTimeMessage
                      : 'No active appointment'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            >
              <Icon name="XMarkIcon" size={24} />
            </button>
          </div>

          {/* Appointment Selector */}
          {appointments.length > 1 && (
            <div className="relative mt-4">
              <select
                value={selectedAppointmentId || ''}
                onChange={(e) => setSelectedAppointmentId(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/30 appearance-none cursor-pointer"
              >
                {appointments.map((apt) => (
                  <option key={apt.id} value={apt.id} className="text-text-primary bg-card">
                    {formatDate(apt.date)} at {apt.time}
                  </option>
                ))}
              </select>
              <Icon
                name="ChevronDownIcon"
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 pointer-events-none"
              />
            </div>
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 h-[calc(100vh-220px)] bg-gradient-to-b from-muted/30 to-background/50">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center space-y-3">
                <div className="relative w-12 h-12">
                  <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
                </div>
                <span className="text-sm text-text-secondary">Loading conversation...</span>
              </div>
            </div>
          ) : !canChat ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8 px-4">
              <div className="w-20 h-20 bg-gradient-to-br from-warning/20 to-warning/5 rounded-full flex items-center justify-center mb-4">
                <Icon name={hasAppointment ? 'ClockIcon' : 'CalendarIcon'} size={40} className="text-warning" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                {hasAppointment ? 'Chat Not Yet Available' : 'No Active Appointment'}
              </h3>
              <p className="text-sm text-text-secondary max-w-[280px]">
                {hasAppointment && chatTimeMessage
                  ? chatTimeMessage
                  : 'Chat is available only during confirmed appointments. Schedule or confirm an appointment to start messaging.'}
              </p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <div className="relative mb-4">
                <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-accent/10 rounded-full flex items-center justify-center">
                  <Icon name="ChatBubbleLeftRightIcon" size={40} className="text-primary" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-success rounded-full flex items-center justify-center">
                  <Icon name="SparklesIcon" size={16} className="text-white" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Start the Conversation
              </h3>
              <p className="text-sm text-text-secondary max-w-[240px]">
                Send a message to {patientName} about their health consultation
              </p>
            </div>
          ) : (
            <>
              {messages.map((message, index) => {
                const isMe = isDoctorSender(message);
                const isTemp = message.id.startsWith('temp-');
                const showAvatar =
                  index === 0 || messages[index - 1].senderRole !== message.senderRole;

                return (
                  <div
                    key={message.id}
                    className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-8 h-8 flex-shrink-0 ${showAvatar ? 'visible' : 'invisible'}`}
                    >
                      {isMe ? (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                          <Icon name="UserIcon" size={16} className="text-white" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                          {patientImage ? (
                            <img src={patientImage} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Icon name="UserIcon" size={16} className="text-muted-foreground" />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Message Bubble */}
                    <div
                      className={`max-w-[75%] px-4 py-3 ${isMe
                        ? 'bg-gradient-to-br from-primary to-primary/90 text-white rounded-2xl rounded-br-sm'
                        : 'bg-card border border-border text-text-primary rounded-2xl rounded-bl-sm shadow-sm'
                        } ${isTemp ? 'opacity-70' : ''}`}
                    >
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {message.content}
                      </p>
                      <div
                        className={`flex items-center justify-end gap-1 mt-1.5 ${isMe ? 'text-white/60' : 'text-text-tertiary'}`}
                      >
                        <span className="text-[10px]">{formatTime(message.createdAt)}</span>
                        {isMe && !isTemp && (
                          <Icon
                            name={message.read ? 'CheckCircleIcon' : 'CheckIcon'}
                            size={12}
                            className={message.read ? 'text-white' : 'text-white/50'}
                          />
                        )}
                        {isTemp && (
                          <div className="w-3 h-3 border border-white/50 border-t-white rounded-full animate-spin" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Error Banner */}
        {error && canChat && (
          <div className="px-4 py-2 bg-error/10 border-t border-error/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="ExclamationCircleIcon" size={16} className="text-error" />
              <span className="text-xs text-error">{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-error hover:text-error/80">
              <Icon name="XMarkIcon" size={14} />
            </button>
          </div>
        )}

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-card border-t border-border">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={canChat ? 'Type your message...' : 'Chat unavailable'}
                className="w-full h-12 px-5 py-2 bg-muted border-0 rounded-full text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                disabled={isSending || !canChat}
              />
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-text-secondary hover:text-text-primary transition-colors"
                disabled={!canChat}
              >
                <Icon name="FaceSmileIcon" size={20} />
              </button>
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isSending || !canChat}
              className="p-3 bg-gradient-to-br from-primary to-accent text-white rounded-full hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 flex items-center justify-center"
            >
              {isSending ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Icon name="PaperAirplaneIcon" size={20} />
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatPanel;
