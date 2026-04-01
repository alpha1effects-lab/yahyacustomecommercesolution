import React from 'react';
import { Star } from 'lucide-react';

interface Review {
  name: string;
  rating: number;
  text: string;
  location?: string;
}

interface CustomerReviewsProps {
  reviews: Review[];
}

const fallbackReviews: Review[] = [
  {
    name: 'Ayesha Rahman',
    rating: 5,
    text: 'Fast delivery and the product quality is excellent. Very happy with my purchase.',
    location: 'Lahore',
  },
  {
    name: 'Imran Siddiq',
    rating: 4,
    text: 'Great variety and the offers section is spot on. Checkout was smooth.',
    location: 'Karachi',
  },
  {
    name: 'Sana Malik',
    rating: 5,
    text: 'Love the curated picks. The hero banner changes are eye-catching and clean.',
    location: 'Islamabad',
  },
];

export const CustomerReviews: React.FC<CustomerReviewsProps> = ({ reviews }) => {
  const items = reviews.length > 0 ? reviews : fallbackReviews;

  return (
    <section className="max-w-[1440px] mx-auto px-6 py-24 border-t border-gray-100 dark:border-gray-800">
      <div className="flex justify-between items-end mb-10">
        <h2 className="text-3xl font-medium tracking-tight text-black dark:text-white">Customer Reviews</h2>
        <span className="text-xs uppercase tracking-widest text-black dark:text-gray-400">Verified buyers</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {items.map((review, index) => (
          <div key={`${review.name}-${index}`} className="border border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-neutral-900">
            <div className="flex items-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={`${review.name}-star-${i}`}
                  size={14}
                  fill={i < Math.round(review.rating) ? 'black' : 'transparent'}
                  color={i < Math.round(review.rating) ? 'black' : '#777'}
                  className="dark:fill-white dark:text-white"
                />
              ))}
              <span className="text-xs text-black dark:text-gray-400 ml-2">{review.rating.toFixed(1)}</span>
            </div>
            <p className="text-sm text-black dark:text-gray-300 leading-relaxed mb-6">"{review.text}"</p>
            <div className="text-sm font-semibold text-black dark:text-white">
              {review.name}
              {review.location && <span className="text-xs text-black dark:text-gray-400 ml-2">{review.location}</span>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
