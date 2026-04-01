'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Product } from '@/types';
import { useCart } from '@/contexts/CartContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { slugifyProductName } from '@/lib/utils/productUtils';

interface ProductGridProps {
  title?: string;
  products: Product[];
  onViewAll?: string;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ 
  title = "New Arrivals", 
  products,
  onViewAll,
}) => {
  const { addToCart } = useCart();
  const { formatPrice } = useCurrency();
  const router = useRouter();
  const getProductSlug = (product: Product) => product.slug || slugifyProductName(product.name || 'product');

  return (
    <section className="max-w-[1440px] mx-auto px-6 pb-24 md:pb-32 mt-8">
      <div className="flex justify-between items-end mb-10">
        <h2 className="text-3xl font-medium tracking-tight text-black dark:text-white">{title}</h2>
        {onViewAll && (
          <Link 
            href={onViewAll}
            className="text-sm underline underline-offset-4 hover:text-black transition-colors text-black dark:text-gray-300 dark:hover:text-white"
          >
            View all
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
        {products.map((product) => (
          <div 
            key={product._id} 
            className="group cursor-pointer"
            onClick={() => router.push(`/product/${getProductSlug(product)}`)}
          >
            <div className="bg-[#F3F3F3] dark:bg-neutral-800 aspect-[4/5] w-full mb-4 overflow-hidden relative transition-colors duration-200">
              <img 
                src={product.images?.[0] || ''} 
                alt={product.imageAlts?.[0] || product.name} 
                className="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-500 ease-out"
              />
              {product.isNewOffer && (
                <span className="absolute top-2 left-2 bg-white dark:bg-black dark:text-white px-2 py-1 text-[10px] uppercase tracking-widest font-bold border border-gray-100 dark:border-gray-800">
                  New
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <button 
                  className="w-full bg-white text-black py-3 text-xs uppercase tracking-widest font-bold border border-black hover:bg-black hover:text-white transition-colors dark:bg-black dark:text-white dark:border-white dark:hover:bg-white dark:hover:text-black"
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(product, 1);
                  }}
                >
                   Add to Cart
                </button>
              </div>
            </div>
            
            <div className="space-y-1">
                  <h3 className="text-base font-medium text-black dark:text-white group-hover:underline underline-offset-4 decoration-1">
                    {product.name}
              </h3>
              {product.brand?.name && product.brand.name !== 'Unbranded' && (
                <p className="text-xs uppercase tracking-widest text-black dark:text-gray-400">
                  {product.brand.name}
                </p>
              )}
              <p className="text-base font-medium text-black dark:text-white pt-1">
                {formatPrice(product.price)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
