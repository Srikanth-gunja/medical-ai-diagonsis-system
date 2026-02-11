import { checkVideoCallWindow } from '../videoCallWindow';

describe('checkVideoCallWindow', () => {
  it('allows in-progress appointments regardless of time', () => {
    const result = checkVideoCallWindow({
      date: '2026-02-11',
      time: '10:00 AM',
      status: 'in_progress',
      now: new Date('2026-02-11T20:00:00'),
    });

    expect(result.allowed).toBe(true);
  });

  it('blocks calls that are too early', () => {
    const result = checkVideoCallWindow({
      date: '2026-02-11',
      time: '10:00 AM',
      status: 'confirmed',
      now: new Date('2026-02-11T08:00:00'),
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Video call can only be started 30 minutes before');
  });

  it('blocks calls that are too late', () => {
    const result = checkVideoCallWindow({
      date: '2026-02-11',
      time: '10:00 AM',
      status: 'confirmed',
      now: new Date('2026-02-11T12:00:00'),
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('already passed');
  });

  it('allows calls within the 30-minute window', () => {
    const result = checkVideoCallWindow({
      date: '2026-02-11',
      time: '10:00 AM',
      status: 'confirmed',
      now: new Date('2026-02-11T09:45:00'),
    });

    expect(result.allowed).toBe(true);
  });
});
