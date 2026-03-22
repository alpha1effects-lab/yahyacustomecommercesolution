'use client';

import React, { useState } from 'react';
import { X, Search } from 'lucide-react';
import { Product } from '@/types';
import { useCurrency } from '@/contexts/CurrencyContext';

interface ProductSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSelect: (product: Product) => void;
  excludeIds?: string[];
}

export const ProductSelectorModal: React.FC<ProductSelectorModalProps> = ({ 
  isOpen, 
  onClose, 
  products, 
  onSelect,
  excludeIds = []
}) => {
  const [query, setQuery] = useState('');
  const { formatPrice } = useCurrency();

  if (!isOpen) return null;

  const filteredProducts = products.filter(p => {
    const brandName = p.brand?.name || 'Unbranded';
    const matchesSearch = p.name.toLowerCase().includes(query.toLowerCase()) || brandName.toLowerCase().includes(query.toLowerCase());
    const isNotExcluded = !excludeIds.includes(p._id);
    return matchesSearch && isNotExcluded;
  });

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative bg-white dark:bg-neutral-900 w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl animate-fade-in-up">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-bold uppercase tracking-widest text-black dark:text-white">Select Product</h2>
          <button onClick={onClose} className="hover:text-red-500 transition-colors text-black dark:text-white">
            <X size={24} strokeWidth={1.5} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-neutral-800">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search inventory..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white focus:border-black dark:focus:border-white outline-none text-sm"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto p-4 space-y-2 flex-grow">
          {filteredProducts.map(product => (
            <div 
              key={product._id}
              className="flex items-center gap-4 p-2 hover:bg-gray-50 dark:hover:bg-neutral-800 cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all group"
              onClick={() => onSelect(product)}
            >
              <div className="w-12 h-12 bg-white dark:bg-neutral-700 border border-gray-100 dark:border-gray-600 flex-shrink-0">
                <img src={product.images?.[0] || ''} alt="" className="w-full h-full object-cover mix-blend-multiply" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-black dark:text-white">{product.name}</h4>
                <p className="text-xs text-text-secondary dark:text-gray-400">{product.brand?.name || 'Unbranded'} &bull; {formatPrice(product.price)}</p>
              </div>
              <div className="ml-auto opacity-0 group-hover:opacity-100 text-xs font-bold uppercase tracking-widest bg-black dark:bg-white text-white dark:text-black px-2 py-1">
                Select
              </div>
            </div>
          ))}
          
          {filteredProducts.length === 0 && (
            <div className="text-center py-8 text-text-secondary dark:text-gray-500 text-sm">
              {query ? 'No matching products found.' : 'No available products to add.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
