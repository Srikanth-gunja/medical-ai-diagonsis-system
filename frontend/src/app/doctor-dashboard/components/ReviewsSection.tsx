'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';
import { ratingsApi, type Review } from '@/lib/api';

interface ReviewsSectionProps {
  className?: string;
}

const ReviewsSection = ({ className = '' }: ReviewsSectionProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [average, setAverage] = useState<number>(0);
  const [count, setCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const data = await ratingsApi.getMyReviews();
      setReviews(data.reviews);
      setAverage(data.average);
      setCount(data.count);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
      setError('Failed to load reviews');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderStars = (score: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Icon
            key={star}
            name="StarIcon"
            size={16}
            className={star <= score ? 'text-warning fill-warning' : 'text-muted-foreground'}
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className={`bg-card border border-border rounded-lg p-6 ${className}`}>
        <h2 className="text-xl font-semibold text-text-primary mb-6">Patient Reviews</h2>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-primary/30 border-t-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-card border border-border rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-text-primary">Patient Reviews</h2>
        {count > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Icon name="StarIcon" size={20} className="text-warning fill-warning" />
              <span className="text-lg font-bold text-text-primary">{average.toFixed(1)}</span>
            </div>
            <span className="text-sm text-text-secondary">({count} reviews)</span>
          </div>
        )}
      </div>

      {error ? (
        <div className="text-center py-8">
          <Icon name="ExclamationCircleIcon" size={48} className="mx-auto text-error mb-4" />
          <p className="text-text-secondary">{error}</p>
          <button
            onClick={fetchReviews}
            className="mt-4 px-4 py-2 text-sm text-primary hover:bg-primary/10 rounded-lg transition-base"
          >
            Try Again
          </button>
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="ChatBubbleBottomCenterTextIcon" size={32} className="text-text-secondary" />
          </div>
          <p className="text-text-secondary font-medium">No reviews yet</p>
          <p className="text-sm text-text-tertiary mt-1">
            Reviews will appear here after patients rate their appointments
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="p-4 bg-muted/50 rounded-lg border border-border/50 hover:border-border transition-base"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
                    <Icon name="UserIcon" size={20} className="text-accent" />
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">
                      {review.patientName || 'Anonymous Patient'}
                    </p>
                    <p className="text-xs text-text-tertiary">{formatDate(review.createdAt)}</p>
                  </div>
                </div>
                {renderStars(review.score)}
              </div>
              {review.comment && (
                <p className="text-sm text-text-secondary mt-3 pl-13">"{review.comment}"</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewsSection;
