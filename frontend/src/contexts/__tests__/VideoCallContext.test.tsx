'use client';

import React, { useEffect } from 'react';
import { render, waitFor } from '@testing-library/react';
import { VideoCallProvider, useVideoCall } from '../VideoCallContext';

const mockCall = {
  getOrCreate: jest.fn().mockResolvedValue(undefined),
  join: jest.fn().mockResolvedValue(undefined),
  leave: jest.fn().mockResolvedValue(undefined),
  endCall: jest.fn().mockResolvedValue(undefined),
};

jest.mock('../AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'u1', email: 'patient@test.com', role: 'patient' },
  }),
}));

jest.mock('../../lib/api', () => ({
  videoCallsApi: {
    getToken: jest.fn(),
    createCall: jest.fn(),
    endCall: jest.fn(),
  },
}));

jest.mock('@stream-io/video-react-sdk', () => {
  const React = require('react');
  return {
    StreamVideoClient: class {
      call() {
        return mockCall;
      }
      disconnectUser() {}
    },
    StreamVideo: ({ children }: { children: React.ReactNode }) => (
      <React.Fragment>{children}</React.Fragment>
    ),
    useCalls: () => [],
    CallingState: {
      RINGING: 'ringing',
      IDLE: 'idle',
      JOINED: 'joined',
      LEFT: 'left',
      ENDED: 'ended',
    },
  };
});

const { videoCallsApi } = jest.requireMock('../../lib/api');

function TestConsumer() {
  const { initializeCall, leaveCall, activeCall } = useVideoCall();

  useEffect(() => {
    initializeCall('appt1').catch(() => {});
  }, [initializeCall]);

  useEffect(() => {
    if (activeCall) {
      leaveCall().catch(() => {});
    }
  }, [activeCall, leaveCall]);

  return null;
}

describe('VideoCallContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    videoCallsApi.getToken.mockResolvedValue({
      token: 'token',
      api_key: 'api_key',
      user_id: 'u1',
      user_name: 'Patient',
    });
    videoCallsApi.createCall.mockResolvedValue({
      call_id: 'call1',
      token: 'token',
      api_key: 'api_key',
      user_id: 'u1',
      user_name: 'Patient',
      appointment: {},
      other_user_id: 'u2',
      other_user_name: 'Doctor',
    });
    videoCallsApi.endCall.mockResolvedValue({ message: 'ok' });
  });

  it('logs call end when leaving a call', async () => {
    render(
      <VideoCallProvider>
        <TestConsumer />
      </VideoCallProvider>
    );

    await waitFor(() => {
      expect(videoCallsApi.endCall).toHaveBeenCalledWith('appt1', expect.any(Number));
    });
  });
});
