const parseAppointmentDateTime = (dateStr: string, timeStr: string): Date | null => {
  if (!dateStr || !timeStr) return null;

  const dateMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!dateMatch) return null;

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);

  const normalizedTime = timeStr.trim().toUpperCase();
  const ampmMatch = normalizedTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  let hours: number;
  let minutes: number;

  if (ampmMatch) {
    hours = Number(ampmMatch[1]);
    minutes = Number(ampmMatch[2]);
    const period = ampmMatch[3];
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
  } else {
    const hhmmMatch = normalizedTime.match(/^(\d{1,2}):(\d{2})$/);
    if (!hhmmMatch) return null;
    hours = Number(hhmmMatch[1]);
    minutes = Number(hhmmMatch[2]);
  }

  const appointmentDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
  if (Number.isNaN(appointmentDate.getTime())) return null;
  return appointmentDate;
};

interface CallWindowInput {
  date: string;
  time: string;
  status?: string;
  now?: Date;
}

interface CallWindowResult {
  allowed: boolean;
  reason?: string;
}

export const checkVideoCallWindow = ({
  date,
  time,
  status,
  now = new Date(),
}: CallWindowInput): CallWindowResult => {
  if (status === 'in_progress') {
    return { allowed: true };
  }

  if (status && !['confirmed', 'pending', 'in_progress'].includes(status)) {
    return {
      allowed: false,
      reason: `Appointment status is '${status}'. Only confirmed or pending appointments can start video calls`,
    };
  }

  if (!date || !time) {
    return {
      allowed: false,
      reason: 'Appointment is missing date or time information',
    };
  }

  const appointmentDate = parseAppointmentDateTime(date, time);
  if (!appointmentDate) {
    return {
      allowed: false,
      reason: 'Invalid appointment date or time format',
    };
  }

  const graceBeforeMs = 30 * 60 * 1000;
  const graceAfterMs = 30 * 60 * 1000;
  const appointmentMs = appointmentDate.getTime();
  const nowMs = now.getTime();
  const earliestAllowed = appointmentMs - graceBeforeMs;
  const latestAllowed = appointmentMs + graceAfterMs;

  if (nowMs < earliestAllowed) {
    const minutesUntil = Math.max(1, Math.ceil((earliestAllowed - nowMs) / 60000));
    return {
      allowed: false,
      reason: `Video call can only be started 30 minutes before the appointment. Please wait ${minutesUntil} more minutes.`,
    };
  }

  if (nowMs > latestAllowed) {
    return {
      allowed: false,
      reason:
        'This appointment has already passed. Video calls can only be started within 30 minutes before or after the scheduled time.',
    };
  }

  return { allowed: true };
};
