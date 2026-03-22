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
            className="text-sm uppercase tracking-widest text-text-secondary hover:text-black dark:hover:text-white transition-colors border-b border-transparent hover:border-current pb-0.5 cursor-pointer"
          >
            View All
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
        {brands.map((brand) => (
          <Link
            key={brand._id}
            href={`/brands/${brand.slug}`}
            className="group border border-gray-200 dark:border-gray-800 bg-white dark:bg-neutral-900 p-6 flex flex-col items-center gap-4 transition-all duration-300 hover:border-black dark:hover:border-white hover:shadow-md cursor-pointer"
          >
            <div className="w-full aspect-square flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-neutral-800">
              {brand.logo ? (
                <img
                  src={brand.logo}
                  alt={`${brand.name} logo`}
                  className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
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
