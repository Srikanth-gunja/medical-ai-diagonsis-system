'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface RejectReasonModalProps {
    isOpen: boolean;
    requestId: string;
    patientName: string;
    onConfirm: (id: string, reason: string) => void;
    onCancel: () => void;
}

export default function RejectReasonModal({
    isOpen,
    requestId,
    patientName,
    onConfirm,
    onCancel
}: RejectReasonModalProps) {
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const quickReasons = [
        'Schedule conflict',
        'Not accepting new patients at this time',
        'Specialty mismatch - please consult a different specialist',
        'Emergency leave - please reschedule',
        'Patient needs to provide more information'
    ];

    const handleSelectQuickReason = (quickReason: string) => {
        setReason(quickReason);
    };

    const handleConfirm = async () => {
        if (!reason.trim()) {
            return;
        }
        setIsSubmitting(true);
        try {
            await onConfirm(requestId, reason);
        } finally {
            setIsSubmitting(false);
            setReason('');
        }
    };

    const handleClose = () => {
        setReason('');
        onCancel();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-card rounded-2xl shadow-elevation-4 max-w-md w-full overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center">
                            <Icon name="XCircleIcon" size={24} className="text-error" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-text-primary">
                                Decline Appointment
                            </h3>
                            <p className="text-sm text-text-secondary">
                                {patientName}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-muted rounded-lg transition-base"
                    >
                        <Icon name="XMarkIcon" size={20} className="text-text-secondary" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                            Reason for declining <span className="text-error">*</span>
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Please provide a reason for declining this appointment..."
                            rows={3}
                            className="w-full px-4 py-3 bg-background border border-input rounded-lg transition-base focus:outline-none focus:ring-2 focus:border-primary focus:ring-primary/20 resize-none"
                        />
                    </div>

                    <div>
                        <p className="text-xs text-text-secondary mb-2">Quick reasons:</p>
                        <div className="flex flex-wrap gap-2">
                            {quickReasons.map((quickReason, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => handleSelectQuickReason(quickReason)}
                                    className={`px-3 py-1.5 text-xs rounded-full border transition-base ${reason === quickReason
                                            ? 'bg-primary text-primary-foreground border-primary'
                                            : 'bg-muted text-text-secondary border-border hover:border-primary/50'
                                        }`}
                                >
                                    {quickReason}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                            <Icon name="ExclamationTriangleIcon" size={16} className="text-warning mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-text-secondary">
                                The patient will be notified with this reason. Please be professional and considerate.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 p-6 border-t border-border bg-muted/30">
                    <button
                        onClick={handleClose}
                        className="flex-1 h-11 px-4 bg-muted text-text-primary font-medium rounded-lg hover:bg-muted/80 transition-base"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!reason.trim() || isSubmitting}
                        className="flex-1 h-11 px-4 bg-error text-error-foreground font-medium rounded-lg hover:shadow-elevation-2 transition-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Declining...</span>
                            </>
                        ) : (
                            <>
                                <Icon name="XMarkIcon" size={16} />
                                <span>Decline Request</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
