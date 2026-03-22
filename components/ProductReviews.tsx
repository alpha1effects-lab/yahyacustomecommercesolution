'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Star, X } from 'lucide-react';

interface Review {
  _id: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface ReviewStats {
  avgRating: number;
  totalReviews: number;
  stars1: number;
  stars2: number;
  stars3: number;
  stars4: number;
  stars5: number;
}

interface ProductReviewsProps {
  productId: string;
  productSlug: string;
}

function StarRating({ rating, size = 16, interactive, onRate }: { rating: number; size?: number; interactive?: boolean; onRate?: (r: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          disabled={!interactive}
          onClick={() => onRate?.(s)}
          onMouseEnter={() => interactive && setHover(s)}
          onMouseLeave={() => interactive && setHover(0)}
          className={interactive ? 'cursor-pointer' : 'cursor-default'}
        >
          <Star
            size={size}
            strokeWidth={1.5}
            className={
              s <= (hover || rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300 dark:text-gray-600'
            }
          />
        </button>
      ))}
    </div>
  );
}

export default function ProductReviews({ productId, productSlug }: ProductReviewsProps) {
  const { data: session } = useSession();
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session?.user as any;
  const isLoggedIn = user?.role === 'user';

  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch(`/api/reviews?productId=${productId}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews);
        setStats(data.stats);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleWriteReview = () => {
    if (!isLoggedIn) {
      setShowLoginPopup(true);
      return;
    }
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    setSubmitting(true);
    setSubmitMsg('');

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, rating, comment }),
      });

      if (res.ok) {
        setSubmitMsg('Review submitted! It will appear after approval.');
        setRating(0);
        setComment('');
        setShowForm(false);
        fetchReviews();
      } else {
        const data = await res.json();
        setSubmitMsg(data.error || 'Failed to submit review');
      }
    } catch {
      setSubmitMsg('Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const avgRating = stats?.avgRating || 0;
  const totalReviews = stats?.totalReviews || 0;

  return (
    <section className="max-w-[1440px] mx-auto px-6 py-16">
      <h2 className="text-xl font-bold tracking-[0.15em] uppercase text-black dark:text-white mb-8">
        What Other People Say About {productSlug.replace(/-/g, ' ')}
      </h2>

      {/* Stats summary */}
      {totalReviews > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8 p-6 border border-gray-200 dark:border-gray-700">
          <div className="text-center sm:text-left">
            <p className="text-4xl font-bold text-black dark:text-white">{avgRating.toFixed(1)}</p>
            <StarRating rating={Math.round(avgRating)} size={18} />
            <p className="text-xs text-gray-400 mt-1">{totalReviews} review{totalReviews !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex-1 space-y-1.5 w-full">
            {([5, 4, 3, 2, 1] as const).map((s) => {
              const count = stats?.[`stars${s}` as keyof ReviewStats] as number || 0;
              const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
              return (
                <div key={s} className="flex items-center gap-2 text-xs">
                  <span className="w-3 text-gray-500">{s}</span>
                  <Star size={12} className="fill-yellow-400 text-yellow-400" />
                  <div className="flex-1 h-2 bg-gray-100 dark:bg-neutral-800 overflow-hidden">
                    <div className="h-full bg-yellow-400" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-6 text-right text-gray-400">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Write a review button */}
      <div className="mb-8">
        {submitMsg && (
          <p className={`text-sm mb-4 ${submitMsg.includes('submitted') ? 'text-green-600' : 'text-red-500'}`}>
            {submitMsg}
          </p>
        )}
        {!showForm && (
          <button
            onClick={handleWriteReview}
            className="bg-black dark:bg-white text-white dark:text-black px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] hover:opacity-80 transition-opacity"
          >
            Write a Review
          </button>
        )}
      </div>

      {/* Review form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold uppercase tracking-widest">Your Review</h3>
            <button type="button" onClick={() => setShowForm(false)}><X size={18} /></button>
          </div>
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2 uppercase tracking-widest">Rating *</p>
            <StarRating rating={rating} size={28} interactive onRate={setRating} />
            {rating === 0 && (
              <p className="text-xs text-gray-400 mt-1">Click a star to rate</p>
            )}
          </div>
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2 uppercase tracking-widest">Comment (optional)</p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience..."
              rows={3}
              className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-black px-4 py-3 text-sm focus:outline-none focus:border-black dark:focus:border-white resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={rating === 0 || submitting}
            className="bg-black dark:bg-white text-white dark:text-black px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] hover:opacity-80 transition-opacity disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      )}

      {/* Reviews list */}
      {loading ? (
        <div className="animate-pulse text-gray-400 text-sm">Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-gray-400">No reviews yet. Be the first to share your thoughts!</p>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review._id} className="border-b border-gray-100 dark:border-gray-800 pb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-black dark:text-white">{review.userName}</span>
                  <StarRating rating={review.rating} size={14} />
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(review.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
              {review.comment && (
                <p className="text-sm text-gray-600 dark:text-gray-300">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Login required popup */}
      {showLoginPopup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 p-8 max-w-sm w-full text-center">
            <p className="text-sm text-black dark:text-white mb-6">
              Only logged in users can leave a review.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowLoginPopup(false)}
                className="px-5 py-2.5 text-xs font-bold uppercase tracking-[0.2em] border border-gray-200 dark:border-gray-700 hover:border-black dark:hover:border-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => router.push(`/login?callbackUrl=/product/${productSlug}`)}
                className="px-5 py-2.5 text-xs font-bold uppercase tracking-[0.2em] bg-black dark:bg-white text-white dark:text-black hover:opacity-80 transition-opacity"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
