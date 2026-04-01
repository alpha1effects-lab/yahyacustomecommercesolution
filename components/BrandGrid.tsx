'use client';

import React from 'react';
import Link from 'next/link';
import { Brand } from '@/types';

interface BrandGridProps {
  title: string;
  brands: Brand[];
  onViewAll?: string;
}

export const BrandGrid: React.FC<BrandGridProps> = ({ title, brands, onViewAll }) => {
  if (!brands || brands.length === 0) return null;

  return (
    <section className="max-w-[1440px] mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl md:text-3xl font-medium tracking-tight text-black dark:text-white">
          {title}
        </h2>
        {onViewAll && (
          <Link
            href={onViewAll}
            className="text-sm uppercase tracking-widest text-black hover:text-black dark:hover:text-white transition-colors border-b border-transparent hover:border-current pb-0.5 cursor-pointer"
          >
            View All
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
        {brands.map((brand) => (
          <Link
            key={brand._id}
            href={`/brands/${brand.slug}`}
            className="group flex flex-col items-center gap-3 transition-all duration-300 cursor-pointer"
          >
            <div className="w-full aspect-[3/2] flex items-center justify-center overflow-hidden">
              {brand.logo ? (
                <img
                  src={brand.logo}
                  alt={`${brand.name} logo`}
                  className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <span className="text-3xl font-bold uppercase tracking-widest text-gray-300 dark:text-gray-600 group-hover:text-black dark:group-hover:text-white transition-colors">
                  {brand.name.slice(0, 2)}
                </span>
              )}
            </div>
            <div className="text-center">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-black dark:text-white">
                {brand.name}
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};
