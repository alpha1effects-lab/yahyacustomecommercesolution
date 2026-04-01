'use client';

import React, { useState, useEffect } from 'react';
import { Share2 } from 'lucide-react';
import { Button } from './ui/Button';
import { QuantitySelector } from './ui/QuantitySelector';
import { Product } from '@/types';
import { useCart } from '@/contexts/CartContext';
import { useRouter } from 'next/navigation';
import { useCurrency } from '@/contexts/CurrencyContext';

interface ProductHighlightProps {
  product: Product;
}

export const ProductHighlight: React.FC<ProductHighlightProps> = ({ product }) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const { addToCart } = useCart();
  const { formatPrice } = useCurrency();
  const router = useRouter();

  useEffect(() => {
    setQuantity(1);
    setSelectedImage(0);
  }, [product._id]);

  const images = product.images && product.images.length > 0 
    ? product.images 
    : [];

  return (
    <section className="max-w-[1440px] mx-auto px-6 py-20 md:py-32 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 items-start">
        
        {/* Left: Image Gallery */}
        <div className="flex flex-col-reverse md:flex-row gap-4 md:sticky md:top-24">
          <div className="flex md:flex-col gap-4 overflow-x-auto md:overflow-x-visible">
            {images.map((img, idx) => (
              <button 
                key={idx}
                onClick={() => setSelectedImage(idx)}
                className={`w-16 h-16 md:w-20 md:h-20 flex-shrink-0 bg-gray-100 dark:bg-neutral-800 border ${selectedImage === idx ? 'border-black dark:border-white' : 'border-transparent'} hover:border-gray-400 dark:hover:border-gray-500 transition-all`}
              >
                <img src={img} alt={product.imageAlts?.[idx] || product.name} className="w-full h-full object-cover mix-blend-multiply" />
              </button>
            ))}
          </div>
          <div className="bg-[#F3F3F3] dark:bg-neutral-800 aspect-[4/5] w-full flex items-center justify-center relative group transition-colors duration-200">
             <img 
              src={images[selectedImage] || ''} 
              alt={product.imageAlts?.[selectedImage] || product.name} 
              className="w-full h-full object-cover mix-blend-multiply cursor-zoom-in"
            />
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
               <button className="p-2 bg-white dark:bg-black rounded-full shadow-sm hover:scale-110 transition-transform">
                 <Share2 size={18} className="text-black dark:text-white" />
               </button>
            </div>
          </div>
        </div>

        {/* Right: Product Details */}
        <div className="flex flex-col pt-4">
          <span className="text-sm md:text-xs font-bold tracking-widest uppercase text-black dark:text-gray-400 mb-3">
            {product.brand?.name || 'Unbranded'}
          </span>
          
          <h2 className="text-4xl md:text-5xl font-medium tracking-tight mb-4 text-black dark:text-white">
            {product.name}
          </h2>

          <div className="flex items-center gap-4 mb-8">
            <span className="text-2xl md:text-xl font-medium text-black dark:text-white">{formatPrice(product.price)}</span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-sm text-black dark:text-gray-400 line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-xs uppercase tracking-widest text-black dark:text-gray-400">Quantity</label>
              <QuantitySelector 
                quantity={quantity} 
                onIncrease={() => setQuantity(q => q + 1)} 
                onDecrease={() => setQuantity(q => Math.max(1, q - 1))}
              />
            </div>

            <div className="flex flex-col gap-3 pt-6">
              <Button 
                variant="secondary" 
                fullWidth 
                onClick={() => addToCart(product, quantity)}
              >
                Add to cart
              </Button>
              <Button 
                variant="primary" 
                fullWidth
                onClick={() => {
                  addToCart(product, quantity);
                  router.push('/checkout');
                }}
              >
                Buy it now
              </Button>
            </div>
            
            <p className="text-xs text-center text-black dark:text-gray-500 pt-4">
              Free shipping on orders over $150. 30-day returns.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
