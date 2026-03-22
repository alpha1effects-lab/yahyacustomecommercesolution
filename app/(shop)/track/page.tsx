'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { ChevronDown, Copy, Check } from 'lucide-react';

interface TrackResult {
  _id: string;
  orderNumber?: string;
  status: string;
  total: number;
  createdAt: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  items: {
    name: string;
    quantity: number;
    price: number;
    image?: string;
  }[];
}

interface RecentOrder {
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
  items: { name: string; quantity: number; price: number; image?: string }[];
  createdAt: string;
}

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [result, setResult] = useState<TrackResult | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [expandedRecent, setExpandedRecent] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState('');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('recentOrders');
      if (stored) setRecentOrders(JSON.parse(stored));
    } catch {}
  }, []);

  const handleCopyOrderId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(''), 2000);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setResult(null);
    if (!orderNumber || !email) {
      setError('Please enter both order number and email.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/orders/track?orderNumber=${encodeURIComponent(orderNumber)}&email=${encodeURIComponent(email)}`);
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Order not found.');
      } else {
        setResult(data);
      }
    } catch {
      setError('Unable to fetch order status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] max-w-[960px] mx-auto px-6 py-20">
      <div className="mb-10">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-black dark:text-white">Track Your Order</h1>
        <p className="text-text-secondary dark:text-gray-400 mt-3 max-w-xl">
          Enter your order ID and email to check the latest status and tracking details.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-[1.2fr_1.2fr_auto] gap-4 items-end">
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400">Order Number</label>
          <input
            type="text"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white px-3 py-3 text-sm focus:border-black dark:focus:border-white outline-none"
            placeholder="e.g. ORD-AB12C-3X9QK"
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white px-3 py-3 text-sm focus:border-black dark:focus:border-white outline-none"
            placeholder="you@example.com"
          />
        </div>
        <Button type="submit" className="w-full md:w-auto" disabled={isLoading}>
          {isLoading ? 'Checking...' : 'Track Order'}
        </Button>
      </form>

      {error && (
        <div className="mt-6 text-sm text-red-500">{error}</div>
      )}

      {result && (
        <div className="mt-10 border border-gray-200 dark:border-gray-800 p-6 bg-white dark:bg-neutral-900">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-black dark:text-white">Order {result.orderNumber || result._id}</h2>
              <p className="text-xs uppercase tracking-widest text-text-secondary dark:text-gray-400 mt-2">
                Status: <span className="font-bold">{result.status}</span>
              </p>
            </div>
            <div className="text-sm font-medium text-black dark:text-white">
              Rs. {result.total.toLocaleString()}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <p className="text-xs uppercase tracking-widest text-text-secondary dark:text-gray-400">Tracking Number</p>
              <p className="text-black dark:text-white mt-1">{result.trackingNumber || 'Not assigned yet'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-text-secondary dark:text-gray-400">Estimated Delivery</p>
              <p className="text-black dark:text-white mt-1">{result.estimatedDelivery ? new Date(result.estimatedDelivery).toLocaleDateString() : 'Pending'}</p>
            </div>
          </div>

          <div className="mt-8">
            <p className="text-xs uppercase tracking-widest text-text-secondary dark:text-gray-400 mb-3">Items</p>
            <div className="space-y-3">
              {result.items.map((item, index) => (
                <div key={`${item.name}-${index}`} className="flex items-center gap-3 text-sm border-b border-gray-100 dark:border-gray-800 pb-3">
                  {item.image && <img src={item.image} alt={item.name} className="w-10 h-10 object-cover border border-gray-200 dark:border-gray-700" />}
                  <span className="flex-grow text-black dark:text-white">{item.name}</span>
                  <span className="text-text-secondary dark:text-gray-400">{item.quantity} x Rs. {item.price.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent Orders */}
      {recentOrders.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold tracking-tight text-black dark:text-white mb-6">Your Recent Orders</h2>
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div key={order.orderNumber} className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-neutral-900">
                {/* Summary row */}
                <div
                  className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
                  onClick={() => setExpandedRecent(prev => ({ ...prev, [order.orderNumber]: !prev[order.orderNumber] }))}
                >
                  <div className="flex items-center gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-black dark:text-white">{order.orderNumber}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCopyOrderId(order.orderNumber); }}
                          className="text-text-secondary hover:text-black dark:hover:text-white transition-colors"
                          title="Copy Order ID"
                        >
                          {copiedId === order.orderNumber ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                        </button>
                      </div>
                      <span className="text-xs text-text-secondary dark:text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                    <span className="text-sm font-medium text-black dark:text-white">Rs. {order.total.toLocaleString()}</span>
                    <span className={`text-xs font-bold uppercase px-2 py-1 ${order.status === 'delivered' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : order.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>{order.status}</span>
                  </div>
                  <ChevronDown size={18} className={`text-gray-400 transition-transform ${expandedRecent[order.orderNumber] ? 'rotate-180' : ''}`} />
                </div>

                {/* Expanded details */}
                {expandedRecent[order.orderNumber] && (
                  <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-neutral-800/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 mb-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400 mb-1">Name</p>
                        <p className="text-sm text-black dark:text-white">{order.fullName}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400 mb-1">Email</p>
                        <p className="text-sm text-black dark:text-white">{order.email}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400 mb-1">Phone</p>
                        <p className="text-sm text-black dark:text-white">{order.phone}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400 mb-1">Payment</p>
                        <p className="text-sm text-black dark:text-white">{order.paymentMethod}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400 mb-1">Address</p>
                        <p className="text-sm text-black dark:text-white">{order.address}, {order.city}{order.postalCode ? `, ${order.postalCode}` : ''}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400 mb-2">Items</p>
                      <div className="space-y-2">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3 text-sm">
                            {item.image && <img src={item.image} alt={item.name} className="w-9 h-9 object-cover border border-gray-200 dark:border-gray-700" />}
                            <span className="flex-grow text-black dark:text-white">{item.name} <span className="text-text-secondary dark:text-gray-400">x{item.quantity}</span></span>
                            <span className="text-black dark:text-white">Rs. {(item.price * item.quantity).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 text-sm space-y-1">
                      <div className="flex justify-between"><span className="text-text-secondary dark:text-gray-400">Subtotal</span><span className="text-black dark:text-white">Rs. {order.subtotal.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-text-secondary dark:text-gray-400">Delivery</span><span className="text-black dark:text-white">{order.deliveryFee === 0 ? 'Free' : `Rs. ${order.deliveryFee.toLocaleString()}`}</span></div>
                      <div className="flex justify-between font-bold"><span className="text-black dark:text-white">Total</span><span className="text-black dark:text-white">Rs. {order.total.toLocaleString()}</span></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
