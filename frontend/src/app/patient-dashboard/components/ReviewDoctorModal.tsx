'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import { ratingsApi, type Appointment } from '@/lib/api';

interface ReviewDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment;
  onSuccess: () => void;
}

const ReviewDoctorModal = ({ isOpen, onClose, appointment, onSuccess }: ReviewDoctorModalProps) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Pass appointmentId (not doctorId), score, and comment
      await ratingsApi.create(appointment.id, rating, comment);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to submit review:', err);
      setError('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-card border border-border rounded-2xl shadow-elevation-3 overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="bg-primary/5 p-6 border-b border-border text-center">
          <div className="w-20 h-20 bg-card rounded-full mx-auto mb-4 border-4 border-white shadow-sm overflow-hidden p-0.5">
            <img
              src={
                appointment.doctorImage ||
                '/assets/images/doctor_profile.png'
              }
              alt={appointment.doctorName}
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          <h2 className="text-xl font-bold text-text-primary mb-1">How was your visit?</h2>
          <p className="text-sm text-text-secondary">Dr. {appointment.doctorName}</p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Star Rating */}
          <div className="flex justify-center space-x-2 mb-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="p-1 transition-transform hover:scale-110 focus:outline-none"
              >
                <Icon
                  name="StarIcon"
                  variant={(hoveredRating || rating) >= star ? 'solid' : 'outline'}
                  size={32}
                  className={
                    (hoveredRating || rating) >= star ? 'text-warning' : 'text-muted-foreground/30'
                  }
                />
              </button>
            ))}
          </div>

          {/* Comment Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-text-primary mb-2">
              Share your experience (optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us about your consultation..."
              className="w-full h-32 px-4 py-3 bg-muted border border-border rounded-xl text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-ring resize-none transition-base"
            />
          </div>

          {error && (
            <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-lg flex items-center space-x-2 text-error text-sm">
              <Icon name="ExclamationCircleIcon" size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-border rounded-xl text-text-secondary font-medium hover:bg-muted transition-base"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || rating === 0}
              className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:shadow-elevation-2 disabled:opacity-50 disabled:cursor-not-allowed transition-base flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit Review</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewDoctorModal;
