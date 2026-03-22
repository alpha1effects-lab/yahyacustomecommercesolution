'use client';

import React, { Suspense, useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { Package, MapPin, LogOut, Plus, Trash2, Edit2, X, Star } from 'lucide-react';
import type { Order } from '@/types';

interface Address {
  _id: string;
  label: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  postalCode?: string;
  isDefault: boolean;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  processing: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  'out-for-delivery': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

function AccountContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'orders' ? 'orders' : 'orders';
  const [activeTab, setActiveTab] = useState<'orders' | 'addresses'>(initialTab as 'orders' | 'addresses');
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressForm, setAddressForm] = useState({
    label: 'Home',
    fullName: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    isDefault: false,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session?.user as any;

  useEffect(() => {
    if (status === 'unauthenticated' || (status === 'authenticated' && user?.role !== 'user')) {
      router.push('/login');
    }
  }, [status, user?.role, router]);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/user/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch {
      // silent
    }
  }, []);

  const fetchAddresses = useCallback(async () => {
    try {
      const res = await fetch('/api/user/addresses');
      if (res.ok) {
        const data = await res.json();
        setAddresses(data);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated' && user?.role === 'user') {
      Promise.all([fetchOrders(), fetchAddresses()]).finally(() => setLoading(false));
    }
  }, [status, user?.role, fetchOrders, fetchAddresses]);

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const method = editingAddress ? 'PUT' : 'POST';
    const body = editingAddress
      ? { addressId: editingAddress._id, ...addressForm }
      : addressForm;

    try {
      const res = await fetch('/api/user/addresses', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        setAddresses(data);
        resetAddressForm();
      }
    } catch {
      // silent
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      const res = await fetch(`/api/user/addresses?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        setAddresses(data);
      }
    } catch {
      // silent
    }
  };

  const handleSetDefault = async (addr: Address) => {
    try {
      const res = await fetch('/api/user/addresses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addressId: addr._id, isDefault: true }),
      });
      if (res.ok) {
        const data = await res.json();
        setAddresses(data);
      }
    } catch {
      // silent
    }
  };

  const resetAddressForm = () => {
    setShowAddressForm(false);
    setEditingAddress(null);
    setAddressForm({ label: 'Home', fullName: '', phone: '', address: '', city: '', postalCode: '', isDefault: false });
  };

  const startEdit = (addr: Address) => {
    setEditingAddress(addr);
    setAddressForm({
      label: addr.label,
      fullName: addr.fullName,
      phone: addr.phone,
      address: addr.address,
      city: addr.city,
      postalCode: addr.postalCode || '',
      isDefault: addr.isDefault,
    });
    setShowAddressForm(true);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400 text-sm uppercase tracking-widest">Loading...</div>
      </div>
    );
  }

  if (!user || user.role !== 'user') return null;

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-2xl font-bold tracking-[0.15em] uppercase text-black dark:text-white">
              My Account
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Welcome back, {user.name}
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex items-center gap-2 text-xs uppercase tracking-widest text-gray-500 hover:text-red-500 transition-colors"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-gray-200 dark:border-gray-700 mb-8">
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-3 text-sm font-bold uppercase tracking-widest transition-colors flex items-center gap-2 ${activeTab === 'orders' ? 'border-b-2 border-black dark:border-white text-black dark:text-white' : 'text-gray-400 hover:text-black dark:hover:text-white'}`}
          >
            <Package size={16} /> Orders
          </button>
          <button
            onClick={() => setActiveTab('addresses')}
            className={`pb-3 text-sm font-bold uppercase tracking-widest transition-colors flex items-center gap-2 ${activeTab === 'addresses' ? 'border-b-2 border-black dark:border-white text-black dark:text-white' : 'text-gray-400 hover:text-black dark:hover:text-white'}`}
          >
            <MapPin size={16} /> Addresses
          </button>
        </div>

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div>
            {orders.length === 0 ? (
              <div className="text-center py-16">
                <Package size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">No orders yet</p>
                <Link
                  href="/shop"
                  className="inline-block bg-black dark:bg-white text-white dark:text-black px-6 py-3 text-xs font-bold uppercase tracking-[0.2em]"
                >
                  Start Shopping
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order._id} className="border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <div>
                        <p className="text-sm font-bold tracking-widest text-black dark:text-white">
                          {order.orderNumber}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                          {order.status.replace(/-/g, ' ')}
                        </span>
                        <span className="text-sm font-bold text-black dark:text-white">
                          ${order.total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm">
                          {item.image && (
                            <img src={item.image} alt={item.name} className="w-10 h-10 object-cover bg-gray-100 dark:bg-neutral-800" />
                          )}
                          <span className="flex-1 text-gray-600 dark:text-gray-300">{item.name}</span>
                          <span className="text-gray-400">×{item.quantity}</span>
                          <span className="font-medium text-black dark:text-white">${item.total.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    {order.trackingNumber && (
                      <p className="mt-3 text-xs text-gray-500">
                        Tracking: <span className="font-mono text-black dark:text-white">{order.trackingNumber}</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Addresses Tab */}
        {activeTab === 'addresses' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {addresses.length} saved address{addresses.length !== 1 ? 'es' : ''}
              </p>
              {!showAddressForm && (
                <button
                  onClick={() => { resetAddressForm(); setShowAddressForm(true); }}
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest bg-black dark:bg-white text-white dark:text-black px-4 py-2"
                >
                  <Plus size={14} /> Add Address
                </button>
              )}
            </div>

            {showAddressForm && (
              <div className="border border-gray-200 dark:border-gray-700 p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold uppercase tracking-widest">
                    {editingAddress ? 'Edit Address' : 'New Address'}
                  </h3>
                  <button onClick={resetAddressForm}><X size={18} /></button>
                </div>
                <form onSubmit={handleAddressSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    placeholder="Label (e.g. Home, Office)"
                    value={addressForm.label}
                    onChange={(e) => setAddressForm(p => ({ ...p, label: e.target.value }))}
                    className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-black px-4 py-2.5 text-sm focus:outline-none focus:border-black dark:focus:border-white"
                  />
                  <input
                    placeholder="Full Name"
                    value={addressForm.fullName}
                    onChange={(e) => setAddressForm(p => ({ ...p, fullName: e.target.value }))}
                    required
                    className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-black px-4 py-2.5 text-sm focus:outline-none focus:border-black dark:focus:border-white"
                  />
                  <input
                    placeholder="Phone"
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm(p => ({ ...p, phone: e.target.value }))}
                    required
                    className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-black px-4 py-2.5 text-sm focus:outline-none focus:border-black dark:focus:border-white"
                  />
                  <input
                    placeholder="City"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm(p => ({ ...p, city: e.target.value }))}
                    required
                    className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-black px-4 py-2.5 text-sm focus:outline-none focus:border-black dark:focus:border-white"
                  />
                  <input
                    placeholder="Address"
                    value={addressForm.address}
                    onChange={(e) => setAddressForm(p => ({ ...p, address: e.target.value }))}
                    required
                    className="sm:col-span-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-black px-4 py-2.5 text-sm focus:outline-none focus:border-black dark:focus:border-white"
                  />
                  <input
                    placeholder="Postal Code (optional)"
                    value={addressForm.postalCode}
                    onChange={(e) => setAddressForm(p => ({ ...p, postalCode: e.target.value }))}
                    className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-black px-4 py-2.5 text-sm focus:outline-none focus:border-black dark:focus:border-white"
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={addressForm.isDefault}
                      onChange={(e) => setAddressForm(p => ({ ...p, isDefault: e.target.checked }))}
                    />
                    Set as default
                  </label>
                  <div className="sm:col-span-2">
                    <button
                      type="submit"
                      className="bg-black dark:bg-white text-white dark:text-black px-6 py-2.5 text-xs font-bold uppercase tracking-[0.2em]"
                    >
                      {editingAddress ? 'Update' : 'Save'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {addresses.length === 0 && !showAddressForm ? (
              <div className="text-center py-16">
                <MapPin size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No saved addresses</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <div
                    key={addr._id}
                    className={`border p-5 relative ${addr.isDefault ? 'border-black dark:border-white' : 'border-gray-200 dark:border-gray-700'}`}
                  >
                    {addr.isDefault && (
                      <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-widest bg-black dark:bg-white text-white dark:text-black px-2 py-0.5">
                        Default
                      </span>
                    )}
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">{addr.label}</p>
                    <p className="text-sm font-medium text-black dark:text-white">{addr.fullName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{addr.phone}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{addr.address}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {addr.city}{addr.postalCode ? `, ${addr.postalCode}` : ''}
                    </p>
                    <div className="flex gap-3 mt-4">
                      <button onClick={() => startEdit(addr)} className="text-xs text-gray-400 hover:text-black dark:hover:text-white flex items-center gap-1">
                        <Edit2 size={12} /> Edit
                      </button>
                      {!addr.isDefault && (
                        <button onClick={() => handleSetDefault(addr)} className="text-xs text-gray-400 hover:text-black dark:hover:text-white flex items-center gap-1">
                          <Star size={12} /> Set Default
                        </button>
                      )}
                      <button onClick={() => handleDeleteAddress(addr._id)} className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1">
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <AccountContent />
    </Suspense>
  );
}
