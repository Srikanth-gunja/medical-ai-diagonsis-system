describe('Video Call Flow', () => {
  const appointmentId = 'appt-123';

  beforeEach(() => {
    const now = new Date();
    const appointmentDate = now.toISOString().split('T')[0];
    const appointmentTime = now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    cy.intercept('GET', '**/api/appointments', {
      statusCode: 200,
      body: [
        {
          id: appointmentId,
          doctorId: 'doc-1',
          doctorName: 'Dr. Jane Smith',
          date: appointmentDate,
          time: appointmentTime,
          status: 'confirmed',
          type: 'video',
        },
      ],
    }).as('getAppointments');

    cy.intercept('GET', '**/api/doctors', {
      statusCode: 200,
      body: [
        {
          id: 'doc-1',
          name: 'Dr. Jane Smith',
          specialty: 'General',
          rating: 4.5,
        },
      ],
    }).as('getDoctors');

    cy.intercept('POST', '**/api/video-calls/token', {
      statusCode: 200,
      body: {
        token: 'mock-token',
        api_key: 'mock-key',
        user_id: 'user-1',
        user_name: 'Test Patient',
      },
    }).as('getVideoToken');

    cy.intercept('POST', `**/api/video-calls/call/${appointmentId}`, {
      statusCode: 200,
      body: {
        call_id: 'call-1',
        token: 'mock-token',
        api_key: 'mock-key',
        user_id: 'user-1',
        user_name: 'Test Patient',
        appointment: { id: appointmentId },
        other_user_id: 'user-2',
        other_user_name: 'Dr. Jane Smith',
      },
    }).as('createVideoCall');

    cy.intercept('POST', `**/api/video-calls/call/${appointmentId}/end`, {
      statusCode: 200,
      body: { message: 'Call ended logged successfully' },
    }).as('endVideoCall');

    cy.visit('/patient-dashboard', {
      onBeforeLoad(win) {
        win.localStorage.setItem('token', 'mock-jwt');
        win.localStorage.setItem(
          'user',
          JSON.stringify({
            id: 'user-1',
            email: 'patient@test.com',
            role: 'patient',
          })
        );
        (win as any).__STREAM_MOCK__ = {
          disableAutoJoin: true,
          call: {
            getOrCreate: () => Promise.resolve(),
            join: () => Promise.resolve(),
            leave: () => Promise.resolve(),
            endCall: () => Promise.resolve(),
          },
        };
      },
    });
  });

  it('starts a call and logs end on cancel', () => {
    cy.wait('@getAppointments');
    cy.wait('@getDoctors');

    cy.contains('Join').click();
    cy.wait('@createVideoCall');

    cy.contains('Calling').should('be.visible');
    cy.contains('Cancel Call').click();

    cy.wait('@endVideoCall');
  });

  it('does not retry create call on 403 and shows backend reason', () => {
    let deniedCount = 0;
    const backendError =
      'Video call can only be started 30 minutes before the appointment. Please wait 5 more minutes.';

    cy.intercept('POST', `**/api/video-calls/call/${appointmentId}`, (req) => {
      deniedCount += 1;
      req.reply({
        statusCode: 403,
        body: { error: backendError },
      });
    }).as('createVideoCallDenied');

    cy.wait('@getAppointments');
    cy.wait('@getDoctors');

    cy.contains('Join').click();
    cy.wait('@createVideoCallDenied');

    cy.contains('Call Failed').should('be.visible');
    cy.contains(backendError).should('be.visible');

    cy.wait(1500).then(() => {
      expect(deniedCount).to.eq(1);
    });
  });
});
