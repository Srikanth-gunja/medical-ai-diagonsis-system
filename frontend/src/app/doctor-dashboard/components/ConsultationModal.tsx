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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 bg-card/95 backdrop-blur-xl border border-white/20 dark:border-border/50 rounded-[2rem] shadow-elevation-3 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
              <Icon name="ClipboardDocumentCheckIcon" size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-text-primary tracking-tight">
                Consultation Log
              </h2>
              <p className="text-sm font-medium text-text-secondary mt-0.5">
                Recording for <span className="text-primary">{patientName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
            aria-label="Close consultation modal"
            title="Close"
          >
            <Icon name="XMarkIcon" size={22} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Consultation Type */}
          <div>
            <label className="block text-sm font-bold text-text-primary mb-2 uppercase tracking-wider text-opacity-80">
              Consultation Type
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-muted/50 border border-border/50 rounded-xl text-text-primary font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none"
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
            <label className="block text-sm font-bold text-text-primary mb-2 uppercase tracking-wider text-opacity-80">
              Diagnosis / Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter diagnosis or consultation summary..."
              rows={3}
              className="w-full px-4 py-3 bg-muted/50 border border-border/50 rounded-xl text-text-primary font-medium placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
              required
            />
          </div>

          {/* Result */}
          <div>
            <label className="block text-sm font-bold text-text-primary mb-2 uppercase tracking-wider text-opacity-80">
              Outcome / Result
            </label>
            <select
              name="result"
              value={formData.result}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-muted/50 border border-border/50 rounded-xl text-text-primary font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none"
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
            <label className="block text-sm font-bold text-text-primary mb-2 uppercase tracking-wider text-opacity-80">
              Additional Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any additional notes or recommendations..."
              rows={2}
              className="w-full px-4 py-3 bg-muted/50 border border-border/50 rounded-xl text-text-primary font-medium placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4 border-t border-border/30">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3.5 bg-background border border-border text-text-primary rounded-xl hover:bg-muted font-bold transition-all"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.description}
              className="flex-1 px-4 py-3.5 bg-gradient-to-r from-primary to-accent text-white rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all font-bold disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Icon name="CheckCircleIcon" size={20} />
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
