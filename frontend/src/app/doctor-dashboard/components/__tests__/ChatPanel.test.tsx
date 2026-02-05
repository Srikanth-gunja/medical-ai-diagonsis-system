import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChatPanel from '../ChatPanel';
import { appointmentsApi, messagesApi, authApi } from '@/lib/api';

// Mock dependencies
jest.mock('@/components/ui/AppIcon', () => {
  return function MockIcon({ name }: { name: string }) {
    return <span data-testid={`icon-${name}`}>{name}</span>;
  };
});

jest.mock('@/lib/api', () => ({
  authApi: {
    getUser: jest.fn(() => ({ id: 'doctor1', role: 'doctor' })),
  },
  appointmentsApi: {
    getAll: jest.fn(),
  },
  messagesApi: {
    getChatStatus: jest.fn(),
    getMessages: jest.fn(),
    send: jest.fn(),
  },
}));

describe('ChatPanel', () => {
  const mockAppointments = [
    {
      id: 'apt1',
      patientId: 'patient1',
      date: '2025-01-01',
      time: '10:00 AM',
      status: 'confirmed',
    },
  ];

  const mockMessages = [
    {
      id: 'msg1',
      senderId: 'patient1',
      senderRole: 'patient',
      content: 'Hello doctor',
      read: true,
      createdAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock scrollIntoView
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
    (appointmentsApi.getAll as jest.Mock).mockResolvedValue(mockAppointments);
    (messagesApi.getChatStatus as jest.Mock).mockResolvedValue({ canChat: true });
    (messagesApi.getMessages as jest.Mock).mockResolvedValue(mockMessages);
  });

  it('renders correctly when open', async () => {
    render(
      <ChatPanel isOpen={true} onClose={jest.fn()} patientId="patient1" patientName="John Doe" />
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('fetches appointments and messages on mount', async () => {
    render(
      <ChatPanel isOpen={true} onClose={jest.fn()} patientId="patient1" patientName="John Doe" />
    );

    await waitFor(() => {
      expect(appointmentsApi.getAll).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(messagesApi.getChatStatus).toHaveBeenCalledWith('apt1');
    });

    await waitFor(() => {
      expect(messagesApi.getMessages).toHaveBeenCalledWith('apt1');
      expect(screen.getByText('Hello doctor')).toBeInTheDocument();
    });
  });

  it('displays chat unavailable message when no appointments', async () => {
    (appointmentsApi.getAll as jest.Mock).mockResolvedValue([]);

    render(
      <ChatPanel isOpen={true} onClose={jest.fn()} patientId="patient1" patientName="John Doe" />
    );

    await waitFor(() => {
      expect(screen.getByText(/No Active Appointment/i)).toBeInTheDocument();
    });
  });

  it('sends a message when valid input provided', async () => {
    render(
      <ChatPanel isOpen={true} onClose={jest.fn()} patientId="patient1" patientName="John Doe" />
    );

    await waitFor(() => {
      expect(screen.getByText('Hello doctor')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(input, { target: { value: 'Hi there' } });

    const sendButton = screen.getByTestId('icon-PaperAirplaneIcon').closest('button');
    fireEvent.click(sendButton!);

    expect(messagesApi.send).toHaveBeenCalledWith('apt1', 'Hi there');
  });
});
