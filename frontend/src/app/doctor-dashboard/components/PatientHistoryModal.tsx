'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';
import { patientsApi, type PatientHistory, type Patient } from '@/lib/api';

interface PatientHistoryModalProps {
  patientId: string;
  onClose: () => void;
}

export default function PatientHistoryModal({ patientId, onClose }: PatientHistoryModalProps) {
  const [history, setHistory] = useState<PatientHistory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'medical' | 'appointments' | 'prescriptions'>(
    'medical'
  );

  useEffect(() => {
    fetchHistory();
  }, [patientId]);

  const fetchHistory = async () => {
    try {
      const data = await patientsApi.getPatientHistory(patientId);
      setHistory(data);
    } catch (err) {
      console.error('Failed to fetch patient history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load patient history');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const calculateAge = (dob: string): number => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const formatStatus = (status: string): string =>
    status
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');

  const parseAppointmentDateTime = (dateStr: string, timeStr: string): Date | null => {
    const dateParts = dateStr.split('-').map((value) => Number(value));
    if (dateParts.length !== 3 || dateParts.some((value) => Number.isNaN(value))) {
      return null;
    }
    const [year, month, day] = dateParts;
    const date = new Date(year, month - 1, day);
    if (Number.isNaN(date.getTime())) return null;

    const normalizedTime = timeStr.trim().toUpperCase();
    const timeMatch = normalizedTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      const period = timeMatch[3];
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      date.setHours(hours, minutes, 0, 0);
      return date;
    }

    const twentyFourMatch = normalizedTime.match(/^(\d{1,2}):(\d{2})$/);
    if (twentyFourMatch) {
      const hours = parseInt(twentyFourMatch[1], 10);
      const minutes = parseInt(twentyFourMatch[2], 10);
      date.setHours(hours, minutes, 0, 0);
      return date;
    }

    return null;
  };

  const deriveStatus = (appointment: PatientHistory['appointments'][number]): string => {
    if (
      appointment.status !== 'pending' &&
      appointment.status !== 'confirmed' &&
      appointment.status !== 'in_progress'
    ) {
      return appointment.status;
    }

    const start = parseAppointmentDateTime(appointment.date, appointment.time);
    if (!start) {
      return appointment.status;
    }

    const durationMinutes = appointment.slotDuration ?? 30;
    const endTime = new Date(start.getTime() + durationMinutes * 60000);
    const now = new Date();

    if (now.getTime() <= endTime.getTime()) {
      return appointment.status;
    }

    if (appointment.status === 'pending') return 'rejected';
    return 'no_show';
  };

  const deriveRejectionReason = (
    appointment: PatientHistory['appointments'][number],
    derivedStatus: string
  ): string => {
    if (derivedStatus !== 'rejected') {
      return appointment.rejectionReason || '';
    }
    if (appointment.rejectionReason) return appointment.rejectionReason;
    if (appointment.status === 'pending') return 'Expired (no response)';
    return '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-text-primary">Patient History</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-base"
            aria-label="Close modal"
          >
            <Icon name="XMarkIcon" size={20} className="text-text-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
            </div>
          )}

          {error && (
            <div className="p-4 bg-error/10 border border-error/20 rounded-lg text-error text-center">
              {error}
            </div>
          )}

          {history && (
            <>
              {/* Patient Info */}
              <div className="mb-6 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <Icon name="UserIcon" size={32} className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-text-primary">
                      {history.patient.firstName} {history.patient.lastName}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 text-sm text-text-secondary">
                      <div>
                        <span className="text-text-muted">Age:</span>{' '}
                        {calculateAge(history.patient.dateOfBirth || '')} years
                      </div>
                      <div>
                        <span className="text-text-muted">Gender:</span>{' '}
                        {history.patient.gender || 'N/A'}
                      </div>
                      <div>
                        <span className="text-text-muted">Blood Group:</span>{' '}
                        {history.patient.bloodGroup || 'N/A'}
                      </div>
                      <div>
                        <span className="text-text-muted">Phone:</span>{' '}
                        {history.patient.phone || 'N/A'}
                      </div>
                    </div>
                    {history.patient.allergies && (
                      <div className="mt-2 text-sm">
                        <span className="text-error font-medium">Allergies:</span>{' '}
                        <span className="text-text-secondary">{history.patient.allergies}</span>
                      </div>
                    )}
                    {history.patient.chronicConditions &&
                      history.patient.chronicConditions.length > 0 && (
                        <div className="mt-1 text-sm">
                          <span className="text-warning font-medium">Conditions:</span>{' '}
                          <span className="text-text-secondary">
                            {history.patient.chronicConditions.join(', ')}
                          </span>
                        </div>
                      )}
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-4 mb-6 border-b border-border">
                <button
                  onClick={() => setActiveTab('medical')}
                  className={`pb-3 px-2 font-medium transition-base relative ${
                    activeTab === 'medical'
                      ? 'text-primary'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Medical Records ({history.medicalRecords.length})
                  {activeTab === 'medical' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('appointments')}
                  className={`pb-3 px-2 font-medium transition-base relative ${
                    activeTab === 'appointments'
                      ? 'text-primary'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Appointments ({history.appointments.length})
                  {activeTab === 'appointments' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('prescriptions')}
                  className={`pb-3 px-2 font-medium transition-base relative ${
                    activeTab === 'prescriptions'
                      ? 'text-primary'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Prescriptions ({history.prescriptions.length})
                  {activeTab === 'prescriptions' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                  )}
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === 'medical' && (
                <div className="space-y-3">
                  {history.medicalRecords.length === 0 ? (
                    <p className="text-center text-text-secondary py-8">No medical records found</p>
                  ) : (
                    history.medicalRecords.map((record) => (
                      <div
                        key={record.id}
                        className="p-4 bg-muted/30 rounded-lg border border-border"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-text-primary">{record.type}</h4>
                            <p className="text-sm text-text-secondary">{record.description}</p>
                          </div>
                          <span className="text-xs text-text-muted">{formatDate(record.date)}</span>
                        </div>
                        {record.result && (
                          <p className="mt-2 text-sm">
                            <span className="font-medium">Result:</span> {record.result}
                          </p>
                        )}
                        {record.notes && (
                          <p className="mt-1 text-sm text-text-secondary">{record.notes}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'appointments' && (
                <div className="space-y-3">
                  {history.appointments.length === 0 ? (
                    <p className="text-center text-text-secondary py-8">No appointments found</p>
                  ) : (
                    history.appointments.map((appt) => {
                      const derivedStatus = deriveStatus(appt);
                      const rejectionReason = deriveRejectionReason(appt, derivedStatus);
                      return (
                        <div
                          key={appt.id}
                          className="p-4 bg-muted/30 rounded-lg border border-border"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium text-text-primary">
                                {formatDate(appt.date)} at {appt.time}
                              </h4>
                              <p className="text-sm text-text-secondary">
                                {appt.symptoms || 'General consultation'}
                              </p>
                            </div>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                derivedStatus === 'completed'
                                  ? 'bg-success/10 text-success'
                                  : derivedStatus === 'confirmed'
                                    ? 'bg-primary/10 text-primary'
                                    : derivedStatus === 'cancelled'
                                      ? 'bg-error/10 text-error'
                                      : 'bg-warning/10 text-warning'
                              }`}
                            >
                              {formatStatus(derivedStatus)}
                          </span>
                        </div>
                        {derivedStatus === 'rejected' && rejectionReason && (
                          <div className="mt-3 rounded-md border border-error/20 bg-error/5 p-3 text-sm text-text-secondary">
                            <span className="font-medium text-error">Rejection Reason:</span>{' '}
                            {rejectionReason}
                          </div>
                        )}
                        <div className="mt-2 flex items-center gap-2 text-sm text-text-muted">
                          <Icon name="VideoCameraIcon" size={14} />
                          <span>{appt.type || 'video'}</span>
                        </div>
                      </div>
                      );
                    })
                  )}
                </div>
              )}

              {activeTab === 'prescriptions' && (
                <div className="space-y-3">
                  {history.prescriptions.length === 0 ? (
                    <p className="text-center text-text-secondary py-8">No prescriptions found</p>
                  ) : (
                    history.prescriptions.map((prescription) => (
                      <div
                        key={prescription.id}
                        className="p-4 bg-muted/30 rounded-lg border border-border"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-text-primary">
                            {prescription.diagnosis || 'Prescription'}
                          </h4>
                          <span className="text-xs text-text-muted">
                            {formatDate(prescription.createdAt)}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {prescription.medications.map((med, idx) => (
                            <div key={idx} className="text-sm flex items-center gap-2">
                              <Icon name="BeakerIcon" size={14} className="text-primary" />
                              <span className="font-medium">{med.name}</span>
                              <span className="text-text-secondary">
                                {med.dosage} - {med.frequency} for {med.duration}
                              </span>
                            </div>
                          ))}
                        </div>
                        {prescription.notes && (
                          <p className="mt-2 text-sm text-text-secondary italic">
                            {prescription.notes}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-muted text-text-primary rounded-lg hover:bg-muted/80 transition-base font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
