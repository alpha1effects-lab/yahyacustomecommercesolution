'use client';

import React from 'react';
import { X, Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from './ui/Button';
import { useCart } from '@/contexts/CartContext';
import { useRouter } from 'next/navigation';
import { useCurrency } from '@/contexts/CurrencyContext';

export const CartDrawer: React.FC = () => {
  const { cartItems, isCartOpen, setIsCartOpen, updateQuantity, removeItem } = useCart();
  const { formatPrice } = useCurrency();
  const router = useRouter();
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] transition-opacity duration-300 ${isCartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsCartOpen(false)}
      />
      
      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full w-full md:w-[450px] bg-white dark:bg-black z-[70] transform transition-transform duration-300 shadow-2xl flex flex-col ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-bold tracking-widest uppercase text-black dark:text-white">Shopping Bag ({cartItems.length})</h2>
          <button onClick={() => setIsCartOpen(false)} className="hover:text-black dark:hover:text-gray-400 text-black dark:text-white transition-colors">
            <X size={24} strokeWidth={1.5} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-grow overflow-y-auto p-6 space-y-8">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-black dark:text-gray-500 space-y-4">
              <p>Your bag is empty.</p>
              <Button variant="outline" onClick={() => setIsCartOpen(false)}>Continue Shopping</Button>
            </div>
          ) : (
            cartItems.map(item => (
              <div key={item._id} className="flex gap-4 animate-fade-in">
                <div className="w-24 h-24 bg-[#F3F3F3] dark:bg-neutral-800 flex-shrink-0">
                  <img src={item.images?.[0] || ''} alt={item.name} className="w-full h-full object-cover mix-blend-multiply" />
                </div>
                <div className="flex-grow flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium text-sm text-black dark:text-white">{item.name}</h3>
                      <button onClick={() => removeItem(item._id)} className="text-gray-400 hover:text-red-500 transition-colors">
                         <Trash2 size={16} />
                      </button>
                    </div>
                    <p className="text-xs text-black dark:text-gray-400 uppercase tracking-wider mt-1">{item.brand?.name || 'Unbranded'}</p>
                  </div>
                  
                  <div className="flex justify-between items-end">
                    <div className="flex items-center border border-gray-200 dark:border-gray-700 h-8">
                      <button 
                        onClick={() => updateQuantity(item._id, -1)}
                        className="px-2 h-full hover:bg-gray-50 dark:hover:bg-neutral-900 text-gray-500 disabled:opacity-30 transition-colors"
                        disabled={item.quantity <= 1}
                      >
                        <Minus size={12} />
                      </button>
                      <span className="px-2 text-sm font-medium min-w-[1.5rem] text-center text-black dark:text-white">{item.quantity}</span>
                      <button 
                         onClick={() => updateQuantity(item._id, 1)}
                         className="px-2 h-full hover:bg-gray-50 dark:hover:bg-neutral-900 text-gray-500 transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <span className="font-medium text-sm text-black dark:text-white">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-neutral-900 space-y-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium uppercase tracking-widest text-black dark:text-white">Subtotal</span>
              <span className="text-lg font-bold text-black dark:text-white">{formatPrice(subtotal)}</span>
            </div>
            <p className="text-xs text-black dark:text-gray-400 text-center mb-4">Shipping and taxes calculated at checkout.</p>
            <Button fullWidth onClick={() => { setIsCartOpen(false); router.push('/checkout'); }}>Checkout</Button>
          </div>
        )}
      </div>
    </>
  );
};
