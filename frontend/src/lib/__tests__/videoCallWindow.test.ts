import { checkVideoCallWindow } from '../videoCallWindow';

describe('checkVideoCallWindow', () => {
  it('allows in-progress appointments regardless of time', () => {
    const result = checkVideoCallWindow({
      date: '2026-02-11',
      time: '10:00 AM',
      status: 'in_progress',
    });

    expect(result.allowed).toBe(true);
  });

  it('allows confirmed appointments at any time for testing', () => {
    const result = checkVideoCallWindow({
      date: '2026-02-11',
      time: '10:00 AM',
      status: 'confirmed',
    });

    expect(result.allowed).toBe(true);
  });

  it('allows calls even when date/time is missing', () => {
    const result = checkVideoCallWindow({
      date: '',
      time: '',
      status: 'confirmed',
    });

    expect(result.allowed).toBe(true);
  });

  it('blocks disallowed statuses', () => {
    const result = checkVideoCallWindow({
      date: '2026-02-11',
      time: '10:00 AM',
      status: 'completed',
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("Appointment status is 'completed'");
  });
});
