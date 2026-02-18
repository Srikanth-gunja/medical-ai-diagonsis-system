'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface ConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ConsultationData) => void;
  patientName: string;
  isLoading?: boolean;
}

export interface ConsultationData {
  type: string;
  description: string;
  result: string;
  notes: string;
}

const ConsultationModal = ({
  isOpen,
  onClose,
  onSubmit,
  patientName,
  isLoading = false,
}: ConsultationModalProps) => {
  const [formData, setFormData] = useState<ConsultationData>({
    type: 'Consultation',
    description: '',
    result: 'Completed',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 bg-card border border-border rounded-2xl shadow-elevation-3 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon name="ClipboardDocumentCheckIcon" size={24} className="text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Complete Consultation</h2>
              <p className="text-sm text-text-secondary">Recording for {patientName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-muted rounded-lg transition-base"
            aria-label="Close consultation modal"
            title="Close"
          >
            <Icon name="XMarkIcon" size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Consultation Type */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Consultation Type
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="Consultation">General Consultation</option>
              <option value="Follow-up">Follow-up Visit</option>
              <option value="Check-up">Routine Check-up</option>
              <option value="Emergency">Emergency Visit</option>
              <option value="Specialist">Specialist Consultation</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Diagnosis / Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter diagnosis or consultation summary..."
              rows={3}
              className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              required
            />
          </div>

          {/* Result */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Outcome / Result
            </label>
            <select
              name="result"
              value={formData.result}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="Completed">Completed Successfully</option>
              <option value="Requires Follow-up">Requires Follow-up</option>
              <option value="Referred">Referred to Specialist</option>
              <option value="Treatment Started">Treatment Started</option>
              <option value="Under Observation">Under Observation</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Additional Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any additional notes or recommendations..."
              rows={3}
              className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-muted text-text-primary rounded-lg hover:bg-muted/80 transition-base font-medium"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.description}
              className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-base font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Icon name="CheckCircleIcon" size={18} />
                  <span>Complete & Save</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConsultationModal;
