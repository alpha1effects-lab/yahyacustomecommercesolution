'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { useEffect, useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface OrderSummary {
  orderNumber: string;
  email: string;
  phone: string;
  fullName: string;
  address: string;
  city: string;
  postalCode: string;
  total: number;
  subtotal: number;
  deliveryFee: number;
  paymentMethod: string;
  status: string;
  items: { name: string; quantity: number; price: number; image: string }[];
  createdAt: string;
}

export default function OrderConfirmationPage() {
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('lastOrder');
      if (stored) setOrder(JSON.parse(stored));
    } catch {}
  }, []);

  const handleCopy = () => {
    if (!order) return;
    navigator.clipboard.writeText(order.orderNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-[70vh] max-w-[800px] mx-auto px-6 py-20 animate-fade-in">
      <div className="flex flex-col items-center text-center mb-10">
        <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold tracking-widest uppercase mb-3 text-black dark:text-white">Thank You!</h1>
        <p className="text-black dark:text-gray-400 max-w-md">
          Your order has been placed successfully.
        </p>
      </div>

      {order && (
        <div className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-neutral-900 divide-y divide-gray-100 dark:divide-gray-800">
          {/* Order ID */}
          <div className="p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-black dark:text-gray-400 mb-2">Order ID</p>
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-black dark:text-white tracking-wide">{order.orderNumber}</span>
              <button
                onClick={handleCopy}
                className="text-black hover:text-black dark:hover:text-white transition-colors"
                title="Copy Order ID"
              >
                {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          {/* Customer Info */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-black dark:text-gray-400 mb-1">Name</p>
              <p className="text-sm text-black dark:text-white">{order.fullName}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-black dark:text-gray-400 mb-1">Email</p>
              <p className="text-sm text-black dark:text-white">{order.email}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-black dark:text-gray-400 mb-1">Phone</p>
              <p className="text-sm text-black dark:text-white">{order.phone}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-black dark:text-gray-400 mb-1">Payment</p>
              <p className="text-sm text-black dark:text-white">{order.paymentMethod}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs font-bold uppercase tracking-widest text-black dark:text-gray-400 mb-1">Shipping Address</p>
              <p className="text-sm text-black dark:text-white">{order.address}, {order.city}{order.postalCode ? `, ${order.postalCode}` : ''}</p>
            </div>
          </div>

          {/* Items */}
          <div className="p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-black dark:text-gray-400 mb-3">Items</p>
            <div className="space-y-3">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 text-sm">
                  {item.image && (
                    <img src={item.image} alt={item.name} className="w-10 h-10 object-cover border border-gray-200 dark:border-gray-700" />
                  )}
                  <div className="flex-grow">
                    <span className="text-black dark:text-white">{item.name}</span>
                    <span className="text-black dark:text-gray-400 ml-2">x{item.quantity}</span>
                  </div>
                  <span className="text-black dark:text-white">Rs. {(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="p-6 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-black dark:text-gray-400">Subtotal</span><span className="text-black dark:text-white">Rs. {order.subtotal.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-black dark:text-gray-400">Delivery</span><span className="text-black dark:text-white">{order.deliveryFee === 0 ? 'Free' : `Rs. ${order.deliveryFee.toLocaleString()}`}</span></div>
            <div className="flex justify-between font-bold text-base border-t border-gray-200 dark:border-gray-700 pt-2">
              <span className="text-black dark:text-white">Total</span>
              <span className="text-black dark:text-white">Rs. {order.total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
        <Link href="/track">
          <Button variant="outline">Track Your Order</Button>
        </Link>
        <Link href="/">
          <Button>Continue Shopping</Button>
        </Link>
      </div>
    </div>
  );
}
