'use client';

import { useState, useEffect } from 'react';
import NavigationBreadcrumbs from '@/components/common/NavigationBreadcrumbs';
import Icon from '@/components/ui/AppIcon';
import { patientsApi, reportsApi, type MedicalRecord } from '@/lib/api';

export default function MedicalHistoryPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [records, setRecords] = useState<MedicalRecord[]>([]);
    const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
    const [filter, setFilter] = useState<string>('all');
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        fetchRecords();
    }, []);

    const fetchRecords = async () => {
        try {
            const data = await patientsApi.getRecords();
            setRecords(data);
        } catch (error) {
            console.error('Failed to fetch records:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadPdf = async () => {
        if (!selectedRecord) return;

        setIsDownloading(true);
        try {
            const blob = await reportsApi.downloadMedicalRecord(selectedRecord.id);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const recordType = selectedRecord.type.replace(/\s+/g, '_').toLowerCase();
            a.download = `medical_record_${recordType}_${new Date(selectedRecord.date).toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Failed to download medical record:', error);
            alert('Failed to download medical record. Please try again.');
        } finally {
            setIsDownloading(false);
        }
    };


    const getTypeColor = (type: string) => {
        switch (type.toLowerCase()) {
            case 'consultation': return 'bg-primary/10 text-primary';
            case 'lab result': return 'bg-accent/10 text-accent';
            case 'vaccination': return 'bg-success/10 text-success';
            case 'prescription': return 'bg-warning/10 text-warning';
            default: return 'bg-muted text-text-secondary';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case 'consultation': return 'ClipboardDocumentCheckIcon';
            case 'lab result': return 'BeakerIcon';
            case 'vaccination': return 'ShieldCheckIcon';
            case 'prescription': return 'DocumentTextIcon';
            default: return 'DocumentIcon';
        }
    };

    const filteredRecords = filter === 'all'
        ? records
        : records.filter(r => r.type.toLowerCase() === filter.toLowerCase());

    const recordTypes = ['all', ...new Set(records.map(r => r.type))];

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
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                        <Icon name="DocumentTextIcon" size={28} className="text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-text-primary">Medical History</h1>
                        <p className="text-text-secondary">{records.length} records found</p>
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
                {recordTypes.map((type) => (
                    <button
                        key={type}
                        onClick={() => setFilter(type)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-base ${filter === type
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-card border border-border text-text-secondary hover:text-primary'
                            }`}
                    >
                        {type === 'all' ? 'All Records' : type}
                    </button>
                ))}
            </div>

            {filteredRecords.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Records List */}
                    <div className="space-y-4">
                        {filteredRecords.map((record) => (
                            <button
                                key={record.id}
                                onClick={() => setSelectedRecord(record)}
                                className={`w-full text-left bg-card border rounded-xl p-5 transition-base hover:shadow-elevation-2 ${selectedRecord?.id === record.id
                                    ? 'border-primary shadow-elevation-2'
                                    : 'border-border'
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-4">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getTypeColor(record.type)}`}>
                                            <Icon name={getTypeIcon(record.type)} size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-text-primary">{record.description}</h3>
                                            <p className="text-sm text-text-secondary">{record.doctor}</p>
                                            <div className="flex items-center space-x-3 mt-2">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(record.type)}`}>
                                                    {record.type}
                                                </span>
                                                <span className="text-xs text-text-secondary flex items-center space-x-1">
                                                    <Icon name="CalendarIcon" size={12} />
                                                    <span>{new Date(record.date).toLocaleDateString()}</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <Icon name="ChevronRightIcon" size={20} className="text-text-secondary" />
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Record Detail */}
                    <div className="lg:sticky lg:top-8">
                        {selectedRecord ? (
                            <div className="bg-card border border-border rounded-2xl p-6 shadow-elevation-1">
                                <div className="flex items-center justify-between mb-6">
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(selectedRecord.type)}`}>
                                        {selectedRecord.type}
                                    </span>
                                    <span className="text-sm text-text-secondary">
                                        {new Date(selectedRecord.date).toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </span>
                                </div>

                                <h2 className="text-xl font-bold text-text-primary mb-2">
                                    {selectedRecord.description}
                                </h2>
                                <p className="text-text-secondary mb-6">
                                    Attending: {selectedRecord.doctor}
                                </p>

                                {selectedRecord.result && (
                                    <div className="mb-6">
                                        <h3 className="text-sm font-medium text-text-primary mb-2">Result</h3>
                                        <p className="text-text-secondary bg-muted rounded-lg p-4">
                                            {selectedRecord.result}
                                        </p>
                                    </div>
                                )}

                                {selectedRecord.notes && (
                                    <div className="mb-6">
                                        <h3 className="text-sm font-medium text-text-primary mb-2">Notes</h3>
                                        <p className="text-text-secondary bg-muted rounded-lg p-4">
                                            {selectedRecord.notes}
                                        </p>
                                    </div>
                                )}

                                <div className="flex items-center space-x-3 pt-4 border-t border-border">
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
                                </div>
                            </div>
                        ) : (
                            <div className="bg-card border border-border rounded-2xl p-8 text-center">
                                <Icon name="DocumentMagnifyingGlassIcon" size={48} className="mx-auto text-text-secondary mb-4" />
                                <p className="text-text-secondary">Select a record to view details</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="bg-card border border-border rounded-2xl p-12 text-center">
                    <Icon name="DocumentTextIcon" size={64} className="mx-auto text-text-secondary mb-4" />
                    <h3 className="text-xl font-semibold text-text-primary mb-2">No Medical Records</h3>
                    <p className="text-text-secondary">Your medical history will appear here after consultations</p>
                </div>
            )}
        </div>
    );
}
