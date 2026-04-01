'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, ArrowRight } from 'lucide-react';
import { Product } from '@/types';
import { useUI } from '@/contexts/UIContext';
import { useRouter } from 'next/navigation';
import { filterProductsByQuery, getProductSearchSuggestions, normalizeSearchQuery, slugifyProductName } from '@/lib/utils/productUtils';

export const SearchOverlay: React.FC = () => {
  const { isSearchOpen, setIsSearchOpen } = useUI();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  // Fetch products once on open
  useEffect(() => {
    if (isSearchOpen && allProducts.length === 0) {
      fetch('/api/products')
        .then(r => r.json())
        .then(data => setAllProducts(data.products || data))
        .catch(() => {});
    }
  }, [isSearchOpen, allProducts.length]);

  // Debounce query input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 150);
    return () => clearTimeout(timer);
  }, [query]);

  // Reset query when closed
  useEffect(() => {
    if (!isSearchOpen) setQuery('');
  }, [isSearchOpen]);

  // Lock body scroll when open
  useEffect(() => {
    if (isSearchOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isSearchOpen]);

  useEffect(() => {
    if (!isSearchOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen]);

  const onClose = () => setIsSearchOpen(false);

  const handleSearchSubmit = () => {
    const q = query.trim();
    if (!q) {
      onClose();
      return;
    }
    router.push(`/search?q=${encodeURIComponent(q)}`);
    onClose();
  };

  const goToProduct = (product: Product) => {
    const safeSlug = product.slug || slugifyProductName(product.name || 'product');
    router.push(`/product/${safeSlug}`);
    onClose();
  };

  const { suggestions, products } = useMemo(() => {
    const q = normalizeSearchQuery(debouncedQuery);
    if (q.length < 3) return { suggestions: [], products: [] };

    const filtered = filterProductsByQuery(allProducts, q);
    const rawSuggestions = getProductSearchSuggestions(allProducts, q, 6);

    const sortedProducts = [...filtered].sort((a, b) => {
      const aTitle = (a.name || '').toLowerCase().startsWith(q);
      const bTitle = (b.name || '').toLowerCase().startsWith(q);
      if (aTitle && !bTitle) return -1;
      if (!aTitle && bTitle) return 1;
      return 0;
    });

    return {
      suggestions: rawSuggestions,
      products: sortedProducts.slice(0, 4)
    };
  }, [debouncedQuery, allProducts]);

  if (!isSearchOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-white dark:bg-black animate-fade-in flex flex-col font-sans"
      onClick={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      {/* Top Bar with Input */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-[1440px] mx-auto px-6 py-6">
          <div className="border border-black dark:border-white p-4 flex items-center bg-white dark:bg-black relative" onClick={(event) => event.stopPropagation()}>
            <div className="flex-grow">
              <label htmlFor="search-main" className="block text-xs text-black dark:text-gray-400 mb-1">Search</label>
              <input 
                id="search-main"
                autoFocus
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearchSubmit();
                  }
                }}
                className="w-full text-2xl font-medium outline-none bg-transparent placeholder:text-gray-300 text-black dark:text-white"
                placeholder=""
              />
            </div>
            <div className="flex items-center gap-4">
              {query.length > 0 && (
                <button onClick={() => setQuery('')} className="text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                  <X size={20} />
                </button>
              )}
              <button onClick={handleSearchSubmit} className="text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                <Search size={24} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Area */}
      <div
        className="flex-grow overflow-y-auto w-full bg-white dark:bg-black"
        onClick={(event) => {
          if (event.currentTarget === event.target) onClose();
        }}
      >
        <div className="max-w-[1440px] mx-auto px-6 py-10">
          {query.length >= 3 ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
              
              {/* Suggestions Column */}
              <div className="md:col-span-4 lg:col-span-3 border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-800 pb-8 md:pb-0">
                <h3 className="text-xs font-bold text-black dark:text-gray-400 uppercase tracking-widest mb-6">Suggestions</h3>
                {suggestions.length > 0 ? (
                  <ul className="space-y-4">
                    {suggestions.map((s, i) => (
                      <li key={i}>
                        <button 
                          className="text-base font-medium hover:underline underline-offset-4 decoration-1 text-left w-full transition-all text-black dark:text-white"
                          onClick={() => setQuery(s)}
                        >
                          {s.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')).map((part, idx) => 
                            part.toLowerCase() === query.toLowerCase() ? <span key={idx} className="font-bold">{part}</span> : part
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-black dark:text-gray-500 italic">No suggestions found.</p>
                )}
              </div>

              {/* Products Column */}
              <div className="md:col-span-8 lg:col-span-9 pl-0 md:pl-8">
                <h3 className="text-xs font-bold text-black dark:text-gray-400 uppercase tracking-widest mb-6">Products</h3>
                {products.length > 0 ? (
                  <div className="space-y-6">
                    {products.map(product => (
                      <div 
                        key={product._id} 
                        className="group cursor-pointer flex items-start gap-6 p-2 -ml-2 hover:bg-gray-50 dark:hover:bg-neutral-900 transition-colors rounded-sm"
                        onClick={() => goToProduct(product)}
                      >
                        <div className="w-20 h-24 bg-[#F3F3F3] dark:bg-neutral-800 flex-shrink-0 overflow-hidden">
                          <img src={product.images?.[0] || product.carouselImage || ''} alt={product.name} className="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-500" />
                        </div>
                        <div className="pt-1">
                          <h4 className="font-medium text-lg text-black dark:text-white underline underline-offset-4 decoration-1 decoration-transparent group-hover:decoration-black dark:group-hover:decoration-white transition-all">
                            {product.name}
                          </h4>
                          <p className="text-sm text-black dark:text-gray-400 mt-1 uppercase tracking-wider text-[10px]">{product.brand?.name || 'Studio'}</p>
                          <p className="text-sm font-medium mt-1 text-gray-900 dark:text-gray-200">PKR {Number(product.price || 0).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-black dark:text-gray-500 italic">No products found matching &quot;{query}&quot;.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="animate-fade-in">
              <h3 className="text-xs font-bold text-black dark:text-gray-400 uppercase tracking-widest mb-6">Products For You</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {allProducts.slice(0, 4).map(product => (
                  <div 
                    key={product._id} 
                    className="group cursor-pointer"
                    onClick={() => goToProduct(product)}
                  >
                    <div className="bg-[#F3F3F3] dark:bg-neutral-800 aspect-[4/5] w-full mb-4 overflow-hidden relative">
                      <img src={product.images?.[0] || product.carouselImage || ''} alt={product.name} className="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-base text-black dark:text-white group-hover:underline underline-offset-4 decoration-1">
                        {product.name}
                      </h4>
                      <p className="text-xs text-black dark:text-gray-400 mt-1 uppercase tracking-wider">{product.brand?.name || 'Studio'}</p>
                      <p className="text-sm font-medium mt-1 text-gray-900 dark:text-gray-200">PKR {Number(product.price || 0).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
              {query.length > 0 && (
                <div className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-800 text-center text-black dark:text-gray-500">
                  <p>Type at least 3 characters to search entire catalog...</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Footer Link */}
      {query.length > 0 && (
        <div className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-black py-6" onClick={(event) => event.stopPropagation()}>
          <div className="max-w-[1440px] mx-auto px-6 flex justify-between items-center">
            <button
              onClick={handleSearchSubmit}
              className="flex items-center gap-2 text-lg font-medium hover:underline underline-offset-4 transition-all text-black dark:text-white"
            >
              Search for &quot;{query}&quot; <ArrowRight size={20} />
            </button>
            <button onClick={onClose} className="text-sm text-black dark:text-gray-400 hover:text-black dark:hover:text-white underline underline-offset-4">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
