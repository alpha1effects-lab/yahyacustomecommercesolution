'use client';

import React, { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface QAItem {
  _id: string;
  question: string;
  answer: string;
}

interface ProductQASectionProps {
  productId: string;
  productName: string;
}

const ProductQASection: React.FC<ProductQASectionProps> = ({ productId, productName }) => {
  const [qas, setQas] = useState<QAItem[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch(`/api/products/${productId}/qa`)
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setQas(data); })
      .catch(() => {});
  }, [productId]);

  if (qas.length === 0) return null;

  return (
    <section className="max-w-[1440px] mx-auto px-6 py-16">
      <div className="max-w-3xl mx-auto text-center mb-10">
        <h2 className="text-xl font-bold tracking-[0.15em] uppercase text-black dark:text-white mb-8">
          FAQ
        </h2>
        <p className="text-black dark:text-gray-400 text-sm md:text-base">
          Frequently asked questions about {productName}
        </p>
      </div>
      <div className="max-w-3xl mx-auto divide-y divide-gray-200 dark:divide-gray-800">
        {qas.map((qa) => (
          <div key={qa._id}>
            <button
              className="w-full flex items-center justify-between py-5 text-left group"
              onClick={() => setExpanded(prev => ({ ...prev, [qa._id]: !prev[qa._id] }))}
            >
              <span className="text-sm md:text-base font-semibold text-black dark:text-white pr-4">{qa.question}</span>
              <ChevronDown
                size={20}
                className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${expanded[qa._id] ? 'rotate-180' : ''}`}
              />
            </button>
            {expanded[qa._id] && (
              <div className="pb-5 text-sm text-black dark:text-gray-400 leading-relaxed">
                {qa.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default ProductQASection;
