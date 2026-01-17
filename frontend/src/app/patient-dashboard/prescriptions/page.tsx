'use client';

import { useState, useEffect } from 'react';
import NavigationBreadcrumbs from '@/components/common/NavigationBreadcrumbs';
import Icon from '@/components/ui/AppIcon';
import { prescriptionsApi, reportsApi } from '@/lib/api';

interface Prescription {
    id: string;
    doctorId: string;
    doctorName: string;
    date: string;
    medications: {
        name: string;
        dosage: string;
        frequency: string;
        duration: string;
    }[];
    notes?: string;
    status: 'active' | 'completed' | 'expired';
}

export default function PrescriptionsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
    const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'expired'>('all');
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        fetchPrescriptions();
    }, []);

    const fetchPrescriptions = async () => {
        try {
            const data = await prescriptionsApi.getAll();
            // Map API data to local Prescription interface
            const mapped: Prescription[] = data.map((p: any) => ({
                id: p.id,
                doctorId: p.doctorId,
                doctorName: p.doctorName || 'Unknown Doctor',
                date: p.createdAt || new Date().toISOString(),
                medications: p.medications || [],
                notes: p.notes,
                status: 'active' as const, // Default to active since API doesn't have status
            }));
            setPrescriptions(mapped);
        } catch (error) {
            console.error('Failed to fetch prescriptions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadPdf = async () => {
        if (!selectedPrescription) return;

        setIsDownloading(true);
        try {
            const blob = await reportsApi.downloadPrescription(selectedPrescription.id);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `prescription_${new Date(selectedPrescription.date).toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Failed to download prescription:', error);
            alert('Failed to download prescription. Please try again.');
        } finally {
            setIsDownloading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-success/10 text-success';
            case 'completed': return 'bg-primary/10 text-primary';
            case 'expired': return 'bg-error/10 text-error';
            default: return 'bg-muted text-text-secondary';
        }
    };

    const filteredPrescriptions = filter === 'all'
        ? prescriptions
        : prescriptions.filter(p => p.status === filter);

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 sm:px-6 py-8 flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 sm:px-6 py-8">
            <NavigationBreadcrumbs />

            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                        <Icon name="ClipboardDocumentListIcon" size={28} className="text-accent" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-text-primary">Prescriptions</h1>
                        <p className="text-text-secondary">{prescriptions.length} prescriptions found</p>
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
                {(['all', 'active', 'completed', 'expired'] as const).map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-base ${filter === status
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-card border border-border text-text-secondary hover:text-primary'
                            }`}
                    >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                ))}
            </div>

            {filteredPrescriptions.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Prescriptions List */}
                    <div className="space-y-4">
                        {filteredPrescriptions.map((prescription) => (
                            <button
                                key={prescription.id}
                                onClick={() => setSelectedPrescription(prescription)}
                                className={`w-full text-left bg-card border rounded-xl p-5 transition-base hover:shadow-elevation-2 ${selectedPrescription?.id === prescription.id
                                    ? 'border-primary shadow-elevation-2'
                                    : 'border-border'
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center space-x-3 mb-2">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(prescription.status)}`}>
                                                {prescription.status}
                                            </span>
                                            <span className="text-xs text-text-secondary">
                                                {new Date(prescription.date).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h3 className="font-semibold text-text-primary mb-1">
                                            {prescription.medications.length} Medication{prescription.medications.length > 1 ? 's' : ''}
                                        </h3>
                                        <p className="text-sm text-text-secondary">
                                            Prescribed by {prescription.doctorName}
                                        </p>
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {prescription.medications.slice(0, 3).map((med, idx) => (
                                                <span key={idx} className="px-2 py-1 bg-muted rounded text-xs text-text-secondary">
                                                    {med.name}
                                                </span>
                                            ))}
                                            {prescription.medications.length > 3 && (
                                                <span className="px-2 py-1 bg-muted rounded text-xs text-text-secondary">
                                                    +{prescription.medications.length - 3} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <Icon name="ChevronRightIcon" size={20} className="text-text-secondary mt-4" />
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Prescription Detail */}
                    <div className="lg:sticky lg:top-8">
                        {selectedPrescription ? (
                            <div className="bg-card border border-border rounded-2xl p-6 shadow-elevation-1">
                                <div className="flex items-center justify-between mb-6">
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedPrescription.status)}`}>
                                        {selectedPrescription.status}
                                    </span>
                                    <span className="text-sm text-text-secondary">
                                        {new Date(selectedPrescription.date).toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </span>
                                </div>

                                <p className="text-text-secondary mb-6">
                                    Prescribed by: <span className="font-medium text-text-primary">{selectedPrescription.doctorName}</span>
                                </p>

                                <h3 className="text-sm font-medium text-text-primary mb-4">Medications</h3>
                                <div className="space-y-4">
                                    {selectedPrescription.medications.map((med, idx) => (
                                        <div key={idx} className="bg-muted rounded-lg p-4">
                                            <div className="flex items-start justify-between mb-2">
                                                <h4 className="font-semibold text-text-primary">{med.name}</h4>
                                                <span className="text-sm text-accent font-medium">{med.dosage}</span>
                                            </div>
                                            <div className="flex items-center space-x-4 text-sm text-text-secondary">
                                                <span className="flex items-center space-x-1">
                                                    <Icon name="ClockIcon" size={14} />
                                                    <span>{med.frequency}</span>
                                                </span>
                                                <span className="flex items-center space-x-1">
                                                    <Icon name="CalendarDaysIcon" size={14} />
                                                    <span>{med.duration}</span>
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {selectedPrescription.notes && (
                                    <div className="mt-6">
                                        <h3 className="text-sm font-medium text-text-primary mb-2">Notes</h3>
                                        <p className="text-text-secondary bg-warning/5 border border-warning/20 rounded-lg p-4">
                                            {selectedPrescription.notes}
                                        </p>
                                    </div>
                                )}

                                <div className="flex items-center space-x-3 pt-6 mt-6 border-t border-border">
                                    <button
                                        onClick={handleDownloadPdf}
                                        disabled={isDownloading}
                                        className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:shadow-elevation-2 transition-base flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isDownloading ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <Icon name="ArrowDownTrayIcon" size={18} />
                                        )}
                                        <span>{isDownloading ? 'Downloading...' : 'Download PDF'}</span>
                                    </button>
                                    <button
                                        onClick={handlePrint}
                                        className="px-4 py-2.5 border border-border rounded-lg text-text-secondary hover:text-primary transition-base"
                                        title="Print"
                                    >
                                        <Icon name="PrinterIcon" size={18} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-card border border-border rounded-2xl p-8 text-center">
                                <Icon name="ClipboardDocumentListIcon" size={48} className="mx-auto text-text-secondary mb-4" />
                                <p className="text-text-secondary">Select a prescription to view details</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="bg-card border border-border rounded-2xl p-12 text-center">
                    <Icon name="ClipboardDocumentListIcon" size={64} className="mx-auto text-text-secondary mb-4" />
                    <h3 className="text-xl font-semibold text-text-primary mb-2">No Prescriptions</h3>
                    <p className="text-text-secondary">Your prescriptions will appear here after doctor consultations</p>
                </div>
            )}
        </div>
    );
}
