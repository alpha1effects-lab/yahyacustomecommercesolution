'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { useCart } from '@/contexts/CartContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCurrency } from '@/contexts/CurrencyContext';
import { ChevronDown, Landmark } from 'lucide-react';
import Image from 'next/image';

type PaymentMethod = 'cod' | 'jazzcash' | 'bank_transfer';

export const Checkout: React.FC = () => {
  const { cartItems, clearCart } = useCart();
  const { formatPrice } = useCurrency();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [paymentMethodTexts, setPaymentMethodTexts] = useState<{ jazzcash?: string; bankTransfer?: string }>({});
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    phone2: '',
    address: '',
    city: '',
    postalCode: '',
    orderNotes: '',
  });

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.paymentMethodTexts) setPaymentMethodTexts(data.paymentMethodTexts);
      })
      .catch(() => {});
  }, []);

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 150 ? 0 : 15;
  const total = subtotal + shipping;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const paymentMethodLabel = (method: PaymentMethod) => {
    switch (method) {
      case 'cod': return 'Cash on Delivery';
      case 'jazzcash': return 'JazzCash';
      case 'bank_transfer': return 'Bank Transfer';
    }
  };

  const handlePlaceOrder = async () => {
    setIsSubmitting(true);
    setOrderError('');
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems.map(item => ({
            productId: item._id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            total: item.price * item.quantity,
            image: item.images?.[0] || '',
          })),
          customer: {
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            phone2: formData.phone2,
            address: formData.address,
            city: formData.city,
            postalCode: formData.postalCode,
          },
          subtotal,
          deliveryFee: shipping,
          total,
          paymentMethod: paymentMethodLabel(paymentMethod),
          notes: formData.orderNotes,
        }),
      });

      if (res.ok) {
        const orderData = await res.json();
        // Save order to localStorage for confirmation page and track page
        try {
          const recentOrders = JSON.parse(localStorage.getItem('recentOrders') || '[]');
          const orderSummary = {
            orderNumber: orderData.orderNumber,
            email: formData.email,
            phone: formData.phone,
            fullName: formData.fullName,
            address: formData.address,
            city: formData.city,
            postalCode: formData.postalCode,
            total: total,
            subtotal: subtotal,
            deliveryFee: shipping,
            paymentMethod: paymentMethodLabel(paymentMethod),
            status: 'pending',
            items: cartItems.map(item => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price,
              image: item.images?.[0] || '',
            })),
            createdAt: new Date().toISOString(),
          };
          recentOrders.unshift(orderSummary);
          // Keep max 10 recent orders
          if (recentOrders.length > 10) recentOrders.length = 10;
          localStorage.setItem('recentOrders', JSON.stringify(recentOrders));
          localStorage.setItem('lastOrder', JSON.stringify(orderSummary));
        } catch {}
        clearCart();
        router.push('/order-confirmation');
      } else {
        const data = await res.json();
        setOrderError(data.error || 'Failed to place order. Please try again.');
      }
    } catch {
      setOrderError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white p-3 text-sm focus:outline-none focus:border-black dark:focus:border-white transition-colors rounded-none placeholder:text-gray-400";

  return (
    <div className="min-h-screen bg-white dark:bg-black animate-fade-in">
      {/* Simple Header for Checkout */}
      <div className="border-b border-gray-100 dark:border-gray-800 py-6 px-6 md:px-12 flex justify-between items-center bg-white dark:bg-black sticky top-0 z-10">
        <h1 className="text-2xl font-bold tracking-[0.15em] uppercase text-black dark:text-white">Checkout</h1>
        <Link href="/" className="text-sm text-text-secondary hover:text-black dark:hover:text-white transition-colors underline underline-offset-4">Return to Cart</Link>
      </div>

      <div className="flex flex-col lg:flex-row max-w-[1440px] mx-auto">
        {/* Left Column: Forms */}
        <div className="flex-grow p-6 md:p-12 lg:pr-24">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-text-secondary dark:text-gray-400 mb-8">
            <Link href="/" className="cursor-pointer hover:text-black dark:hover:text-white transition-colors">Cart</Link>
            <span className="text-xs">{'>'}</span>
            <span className="text-black dark:text-white font-medium">Checkout</span>
          </div>

          <div className="space-y-12 max-w-xl">
            {/* Contact & Shipping Info */}
            <section>
              <h2 className="text-lg font-medium mb-4 text-black dark:text-white">Your Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-widest text-text-secondary dark:text-gray-400 mb-1">Full Name *</label>
                  <input name="fullName" type="text" placeholder="Full name" value={formData.fullName} onChange={handleChange} className={inputClass} required />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-text-secondary dark:text-gray-400 mb-1">Email *</label>
                  <input name="email" type="email" placeholder="Email address" value={formData.email} onChange={handleChange} className={inputClass} required />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-text-secondary dark:text-gray-400 mb-1">Phone 1 *</label>
                  <input name="phone" type="tel" placeholder="Phone number" value={formData.phone} onChange={handleChange} className={inputClass} required />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-text-secondary dark:text-gray-400 mb-1">Phone 2 (Alternate - Optional)</label>
                  <input name="phone2" type="tel" placeholder="Alternate phone" value={formData.phone2} onChange={handleChange} className={inputClass} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-widest text-text-secondary dark:text-gray-400 mb-1">Address *</label>
                  <input name="address" type="text" placeholder="Full address" value={formData.address} onChange={handleChange} className={inputClass} required />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-text-secondary dark:text-gray-400 mb-1">City *</label>
                  <input name="city" type="text" placeholder="City" value={formData.city} onChange={handleChange} className={inputClass} required />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-text-secondary dark:text-gray-400 mb-1">Postal Code</label>
                  <input name="postalCode" type="text" placeholder="Postal code" value={formData.postalCode} onChange={handleChange} className={inputClass} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-widest text-text-secondary dark:text-gray-400 mb-1">Order Notes</label>
                  <textarea name="orderNotes" placeholder="Any special instructions..." value={formData.orderNotes} onChange={handleChange} rows={3} className={inputClass} />
                </div>
              </div>
            </section>

            {/* Payment Method */}
            <section>
              <h2 className="text-lg font-medium mb-4 text-black dark:text-white">Payment Method</h2>
              <div className="space-y-3">
                {/* Cash on Delivery */}
                <label className={`flex items-center gap-3 p-4 border cursor-pointer transition-colors ${paymentMethod === 'cod' ? 'border-black dark:border-white bg-gray-50 dark:bg-neutral-900' : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'}`}>
                  <input type="radio" name="paymentMethod" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="accent-black dark:accent-white" />
                  <span className="text-sm font-medium text-black dark:text-white">Cash on Delivery</span>
                </label>

                {/* JazzCash */}
                <div className={`border transition-colors ${paymentMethod === 'jazzcash' ? 'border-black dark:border-white bg-gray-50 dark:bg-neutral-900' : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'}`}>
                  <label className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setPaymentMethod('jazzcash')}>
                    <input type="radio" name="paymentMethod" value="jazzcash" checked={paymentMethod === 'jazzcash'} onChange={() => setPaymentMethod('jazzcash')} className="accent-black dark:accent-white" />
                    <Image src="/Jazzcash new logo.svg" alt="JazzCash" width={80} height={24} className="h-5 w-auto" />
                    <span className="text-sm font-medium text-black dark:text-white">JazzCash</span>
                    <ChevronDown size={16} className={`ml-auto text-gray-500 transition-transform ${paymentMethod === 'jazzcash' ? 'rotate-180' : ''}`} />
                  </label>
                  {paymentMethod === 'jazzcash' && paymentMethodTexts.jazzcash && (
                    <div className="px-4 pb-4">
                      <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-sm text-yellow-800 dark:text-yellow-200 whitespace-pre-wrap">
                        {paymentMethodTexts.jazzcash}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bank Transfer */}
                <div className={`border transition-colors ${paymentMethod === 'bank_transfer' ? 'border-black dark:border-white bg-gray-50 dark:bg-neutral-900' : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'}`}>
                  <label className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setPaymentMethod('bank_transfer')}>
                    <input type="radio" name="paymentMethod" value="bank_transfer" checked={paymentMethod === 'bank_transfer'} onChange={() => setPaymentMethod('bank_transfer')} className="accent-black dark:accent-white" />
                    <Landmark size={20} className="text-gray-600 dark:text-gray-400" />
                    <span className="text-sm font-medium text-black dark:text-white">Bank Transfer</span>
                    <ChevronDown size={16} className={`ml-auto text-gray-500 transition-transform ${paymentMethod === 'bank_transfer' ? 'rotate-180' : ''}`} />
                  </label>
                  {paymentMethod === 'bank_transfer' && paymentMethodTexts.bankTransfer && (
                    <div className="px-4 pb-4">
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-sm text-blue-800 dark:text-blue-200 whitespace-pre-wrap">
                        {paymentMethodTexts.bankTransfer}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {orderError && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-800 dark:text-red-200">
                {orderError}
              </div>
            )}

            <Button fullWidth onClick={handlePlaceOrder} disabled={isSubmitting}>
              {isSubmitting ? 'Processing...' : 'Place Order'}
            </Button>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="w-full lg:w-[450px] bg-gray-50 dark:bg-neutral-900 p-6 md:p-12 border-l border-gray-100 dark:border-gray-800 min-h-[calc(100vh-80px)]">
          <div className="space-y-6">
            {cartItems.map(item => (
              <div key={item._id} className="flex gap-4 items-center">
                <div className="relative w-16 h-16 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-gray-700 rounded-none overflow-hidden flex-shrink-0">
                  <img src={item.images?.[0] || ''} alt={item.name} className="w-full h-full object-cover mix-blend-multiply" />
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-gray-500 text-white text-xs flex items-center justify-center rounded-full">
                    {item.quantity}
                  </span>
                </div>
                <div className="flex-grow">
                  <h3 className="text-sm font-medium text-black dark:text-white">{item.name}</h3>
                  <p className="text-xs text-text-secondary dark:text-gray-400">{item.brand?.name || 'Unbranded'}</p>
                </div>
                <div className="text-sm font-medium text-black dark:text-white">
                  {formatPrice(item.price * item.quantity)}
                </div>
              </div>
            ))}
            {cartItems.length === 0 && (
              <p className="text-text-secondary dark:text-gray-500 text-sm">Your cart is empty.</p>
            )}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 mt-8 pt-8 space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary dark:text-gray-400">Subtotal</span>
              <span className="font-medium text-black dark:text-white">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary dark:text-gray-400">Shipping</span>
              <span className="font-medium text-black dark:text-white">{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t border-gray-200 dark:border-gray-700 pt-4 text-black dark:text-white">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
