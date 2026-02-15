interface CallWindowInput {
  date: string;
  time: string;
  status?: string;
}

interface CallWindowResult {
  allowed: boolean;
  reason?: string;
}

export const checkVideoCallWindow = ({
  status,
}: CallWindowInput): CallWindowResult => {
  if (status && !['confirmed', 'pending', 'in_progress'].includes(status)) {
    return {
      allowed: false,
      reason: `Appointment status is '${status}'. Only confirmed, pending, or in-progress appointments can start video calls`,
    };
  }

  return { allowed: true };
};
