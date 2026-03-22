'use client';

import React, { useState, useMemo } from 'react';
import { Filter, ChevronDown, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Product } from '@/types';
import { useCart } from '@/contexts/CartContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { slugifyProductName } from '@/lib/utils/productUtils';

interface ProductCollectionProps {
  products: Product[];
  forcedVendor?: string;
  hideTitle?: boolean;
  initialSort?: string;
  title?: string;
}

export const ProductCollection: React.FC<ProductCollectionProps> = ({ 
  products,
  forcedVendor,
  hideTitle = false,
  initialSort = 'featured',
  title = 'Products',
}) => {
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>(initialSort);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const { addToCart } = useCart();
  const { formatPrice } = useCurrency();
  const router = useRouter();
  const getProductSlug = (product: Product) => product.slug || slugifyProductName(product.name || 'product');

  const brands = Array.from(new Set(products.map(p => p.brand?.name || 'Unbranded')));

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev => 
      prev.includes(brand) 
        ? prev.filter(b => b !== brand)
        : [...prev, brand]
    );
  };

  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    if (forcedVendor) {
       filtered = filtered.filter(p => (p.brand?.name || 'Unbranded') === forcedVendor);
    } else if (selectedBrands.length > 0) {
      filtered = filtered.filter(p => selectedBrands.includes(p.brand?.name || 'Unbranded'));
    }

    if (priceRange === 'under5k') {
      filtered = filtered.filter(p => p.price < 5000);
    } else if (priceRange === '5k-10k') {
      filtered = filtered.filter(p => p.price >= 5000 && p.price <= 10000);
    } else if (priceRange === 'over10k') {
      filtered = filtered.filter(p => p.price > 10000);
    }

    if (sortBy === 'low-high') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'high-low') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'newest') {
      filtered.sort((a, b) => (b.isNewOffer ? 1 : 0) - (a.isNewOffer ? 1 : 0));
    }

    return filtered;
  }, [products, selectedBrands, priceRange, sortBy, forcedVendor]);

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
        <div>
          {!hideTitle && <h1 className="text-4xl font-medium tracking-tight mb-2 text-black dark:text-white">{title}</h1>}
          <p className="text-text-secondary dark:text-gray-400 text-sm">Showing {filteredProducts.length} results</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
          <button 
            className="md:hidden flex items-center gap-2 text-sm font-medium border border-gray-200 dark:border-gray-800 px-4 py-2 text-black dark:text-white"
            onClick={() => setIsMobileFiltersOpen(true)}
          >
            <Filter size={16} /> Filters
          </button>

          <div className="relative group">
            <select 
              className="appearance-none bg-transparent pl-2 pr-8 py-2 text-sm font-medium focus:outline-none cursor-pointer text-black dark:text-white"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="featured" className="text-black">Featured</option>
              <option value="newest" className="text-black">Newest Arrivals</option>
              <option value="low-high" className="text-black">Price: Low to High</option>
              <option value="high-low" className="text-black">Price: High to Low</option>
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-text-secondary" />
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-12">
        {/* Sidebar Filters - Desktop */}
        <div className="hidden md:block w-64 space-y-10 flex-shrink-0">
          {!forcedVendor && (
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest mb-4 text-black dark:text-white">Brand</h3>
              <div className="space-y-3">
                {brands.map(brand => (
                  <label key={brand} className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-4 h-4 border border-gray-300 dark:border-gray-600 flex items-center justify-center transition-colors ${selectedBrands.includes(brand) ? 'bg-black dark:bg-white border-black dark:border-white' : 'group-hover:border-black dark:group-hover:border-white'}`}>
                      {selectedBrands.includes(brand) && <div className="w-2 h-2 bg-white dark:bg-black" />}
                    </div>
                    <input 
                      type="checkbox" 
                      className="hidden"
                      checked={selectedBrands.includes(brand)}
                      onChange={() => toggleBrand(brand)}
                    />
                    <span className="text-sm text-text-secondary dark:text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors">{brand}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest mb-4 text-black dark:text-white">Price</h3>
            <div className="space-y-3">
              {[
                { label: 'All', value: 'all' },
                { label: `Under ${formatPrice(5000)}`, value: 'under5k' },
                { label: `${formatPrice(5000)} - ${formatPrice(10000)}`, value: '5k-10k' },
                { label: `Over ${formatPrice(10000)}`, value: 'over10k' },
              ].map(option => (
                <label key={option.value} className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center transition-colors ${priceRange === option.value ? 'border-black dark:border-white' : 'group-hover:border-black dark:group-hover:border-white'}`}>
                    {priceRange === option.value && <div className="w-2 h-2 rounded-full bg-black dark:bg-white" />}
                  </div>
                  <input 
                    type="radio" 
                    name="price"
                    className="hidden"
                    checked={priceRange === option.value}
                    onChange={() => setPriceRange(option.value)}
                  />
                  <span className="text-sm text-text-secondary dark:text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-grow">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
            {filteredProducts.map((product) => (
              <div 
                key={product._id} 
                className="group cursor-pointer animate-fade-in"
                onClick={() => router.push(`/product/${getProductSlug(product)}`)}
              >
                <div className="bg-[#F3F3F3] dark:bg-neutral-800 aspect-[4/5] w-full mb-4 overflow-hidden relative transition-colors duration-200">
                  <img 
                    src={product.images?.[0] || ''} 
                    alt={product.name} 
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
                  <p className="text-xs uppercase tracking-widest text-text-secondary dark:text-gray-400">
                    {product.brand?.name || 'Unbranded'}
                  </p>
                  <p className="text-sm text-black dark:text-white pt-1">
                    {formatPrice(product.price)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          {filteredProducts.length === 0 && (
            <div className="text-center py-20 text-text-secondary dark:text-gray-500">
              <p>No products match your selected filters.</p>
              <button 
                onClick={() => { setSelectedBrands([]); setPriceRange('all'); }}
                className="mt-4 text-black dark:text-white underline underline-offset-4"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      {isMobileFiltersOpen && (
        <div className="fixed inset-0 z-50 bg-white dark:bg-black md:hidden animate-fade-in flex flex-col text-black dark:text-white">
          <div className="p-6 flex justify-between items-center border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-xl font-bold tracking-widest uppercase">Filters</h2>
            <button onClick={() => setIsMobileFiltersOpen(false)}>
              <X size={24} strokeWidth={1.5} />
            </button>
          </div>
          
          <div className="flex-grow overflow-y-auto p-6 space-y-8">
            {!forcedVendor && (
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest mb-4">Brand</h3>
                <div className="space-y-3">
                  {brands.map(brand => (
                    <label key={brand} className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 border-gray-300 text-black focus:ring-black"
                        checked={selectedBrands.includes(brand)}
                        onChange={() => toggleBrand(brand)}
                      />
                      <span className="text-sm text-text-secondary dark:text-gray-400">{brand}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest mb-4">Price</h3>
              <div className="space-y-3">
                {[
                  { label: 'All', value: 'all' },
                  { label: `Under ${formatPrice(5000)}`, value: 'under5k' },
                  { label: `${formatPrice(5000)} - ${formatPrice(10000)}`, value: '5k-10k' },
                  { label: `Over ${formatPrice(10000)}`, value: 'over10k' },
                ].map(option => (
                  <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="radio" 
                      name="mobile-price"
                      className="w-4 h-4 border-gray-300 text-black focus:ring-black"
                      checked={priceRange === option.value}
                      onChange={() => setPriceRange(option.value)}
                    />
                    <span className="text-sm text-text-secondary dark:text-gray-400">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          
          <div className="p-6 border-t border-gray-100 dark:border-gray-800">
            <button 
              className="w-full bg-black text-white dark:bg-white dark:text-black py-4 text-sm tracking-widest uppercase font-medium"
              onClick={() => setIsMobileFiltersOpen(false)}
            >
              Show {filteredProducts.length} Results
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
