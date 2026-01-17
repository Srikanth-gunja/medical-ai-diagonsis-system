'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';
import { patientsApi, prescriptionsApi, type Patient } from '@/lib/api';

interface Medication {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
}

interface PrescriptionFormProps {
    patientId?: string;
    patientName?: string;
    appointmentId?: string;
    onSubmit: (success: boolean) => void;
    onCancel: () => void;
}

export default function PrescriptionForm({
    patientId: initialPatientId,
    patientName: initialPatientName,
    appointmentId,
    onSubmit,
    onCancel
}: PrescriptionFormProps) {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [selectedPatientId, setSelectedPatientId] = useState<string>(initialPatientId || '');
    const [selectedPatientName, setSelectedPatientName] = useState<string>(initialPatientName || '');
    const [diagnosis, setDiagnosis] = useState<string>('');
    const [notes, setNotes] = useState<string>('');
    const [medications, setMedications] = useState<Medication[]>([
        { name: '', dosage: '', frequency: '', duration: '' }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingPatients, setIsLoadingPatients] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        try {
            const data = await patientsApi.getDoctorPatients();
            setPatients(data);
        } catch (err) {
            console.error('Failed to fetch patients:', err);
        } finally {
            setIsLoadingPatients(false);
        }
    };

    const handlePatientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const patientId = e.target.value;
        setSelectedPatientId(patientId);
        const patient = patients.find(p => p.userId === patientId);
        if (patient) {
            setSelectedPatientName(`${patient.firstName} ${patient.lastName}`);
        }
    };

    const addMedication = () => {
        setMedications([...medications, { name: '', dosage: '', frequency: '', duration: '' }]);
    };

    const removeMedication = (index: number) => {
        setMedications(medications.filter((_, i) => i !== index));
    };

    const updateMedication = (index: number, field: keyof Medication, value: string) => {
        const updated = [...medications];
        updated[index][field] = value;
        setMedications(updated);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        // Validate medications
        const validMedications = medications.filter(m => m.name && m.dosage);
        if (validMedications.length === 0) {
            setError('Please add at least one medication with name and dosage');
            setIsLoading(false);
            return;
        }

        try {
            if (appointmentId) {
                // Create prescription linked to appointment
                await prescriptionsApi.create({
                    appointmentId,
                    medications: validMedications,
                    diagnosis,
                    notes
                });
            } else if (selectedPatientId) {
                // Create prescription directly for patient
                await prescriptionsApi.createForPatient(selectedPatientId, {
                    medications: validMedications,
                    diagnosis,
                    notes
                });
            } else {
                setError('Please select a patient');
                setIsLoading(false);
                return;
            }

            onSubmit(true);
        } catch (err) {
            console.error('Failed to create prescription:', err);
            setError(err instanceof Error ? err.message : 'Failed to create prescription');
            onSubmit(false);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-text-primary">Create Prescription</h2>
                    {selectedPatientName && (
                        <p className="text-sm text-text-secondary mt-1">Patient: {selectedPatientName}</p>
                    )}
                </div>
                <button
                    onClick={onCancel}
                    className="p-2 hover:bg-muted rounded-lg transition-base"
                    aria-label="Close prescription form"
                >
                    <Icon name="XMarkIcon" size={20} className="text-text-secondary" />
                </button>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-error/10 border border-error/20 rounded-lg text-error text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Patient Selection - only show if not pre-selected */}
                {!initialPatientId && !appointmentId && (
                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-1">
                            Select Patient
                        </label>
                        <select
                            value={selectedPatientId}
                            onChange={handlePatientChange}
                            className="w-full px-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text-primary"
                            required
                            disabled={isLoadingPatients}
                        >
                            <option value="">
                                {isLoadingPatients ? 'Loading patients...' : 'Select a patient'}
                            </option>
                            {patients.map((patient) => (
                                <option key={patient.userId} value={patient.userId}>
                                    {patient.firstName} {patient.lastName} - {patient.email}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Diagnosis */}
                <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">
                        Diagnosis
                    </label>
                    <input
                        type="text"
                        value={diagnosis}
                        onChange={(e) => setDiagnosis(e.target.value)}
                        className="w-full px-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text-primary"
                        placeholder="e.g., Upper respiratory infection"
                    />
                </div>

                {/* Medications */}
                {medications.map((medication, index) => (
                    <div key={index} className="p-4 bg-muted/50 rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="font-medium text-text-primary">Medication {index + 1}</h3>
                            {medications.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeMedication(index)}
                                    className="p-1 text-error hover:bg-error/10 rounded transition-base"
                                    aria-label="Remove medication"
                                >
                                    <Icon name="TrashIcon" size={16} />
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-1">
                                    Medication Name
                                </label>
                                <input
                                    type="text"
                                    value={medication.name}
                                    onChange={(e) => updateMedication(index, 'name', e.target.value)}
                                    className="w-full px-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text-primary"
                                    placeholder="e.g., Amoxicillin"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-1">
                                    Dosage
                                </label>
                                <input
                                    type="text"
                                    value={medication.dosage}
                                    onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                                    className="w-full px-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text-primary"
                                    placeholder="e.g., 500mg"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-1">
                                    Frequency
                                </label>
                                <select
                                    value={medication.frequency}
                                    onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                                    className="w-full px-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text-primary"
                                    required
                                >
                                    <option value="">Select frequency</option>
                                    <option value="Once daily">Once daily</option>
                                    <option value="Twice daily">Twice daily</option>
                                    <option value="Three times daily">Three times daily</option>
                                    <option value="Four times daily">Four times daily</option>
                                    <option value="As needed">As needed</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-1">
                                    Duration
                                </label>
                                <input
                                    type="text"
                                    value={medication.duration}
                                    onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                                    className="w-full px-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text-primary"
                                    placeholder="e.g., 7 days"
                                    required
                                />
                            </div>
                        </div>
                    </div>
                ))}

                <button
                    type="button"
                    onClick={addMedication}
                    className="flex items-center gap-2 px-4 py-2 text-primary hover:bg-primary/10 rounded-lg transition-base font-medium"
                >
                    <Icon name="PlusIcon" size={20} />
                    <span>Add Another Medication</span>
                </button>

                {/* Notes */}
                <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">
                        Additional Notes
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text-primary"
                        placeholder="Any special instructions or notes..."
                        rows={3}
                    />
                </div>

                <div className="flex gap-3 pt-4">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:shadow-elevation-2 transition-base font-medium disabled:opacity-50"
                    >
                        {isLoading ? 'Creating...' : 'Create Prescription'}
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-3 bg-muted text-text-primary rounded-lg hover:bg-muted/80 transition-base font-medium"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}