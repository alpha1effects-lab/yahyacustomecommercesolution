'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/Button';
import { ShieldAlert } from 'lucide-react';

export const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await signIn('admin-credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError('Invalid root credentials.');
      setIsLoading(false);
    } else {
      router.push('/admin/dashboard');
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-white dark:bg-black px-6 py-20 animate-fade-in">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-black dark:bg-white text-white dark:text-black rounded-full mb-4">
            <ShieldAlert size={24} />
          </div>
          <h1 className="text-3xl font-bold tracking-widest uppercase mb-2 text-black dark:text-white">Root Admin</h1>
          <p className="text-black dark:text-gray-400 text-sm">Platform Management Access</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2 text-black dark:text-white">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white p-4 text-sm focus:outline-none focus:border-black dark:focus:border-white transition-colors rounded-none placeholder:text-gray-300"
                placeholder="admin@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2 text-black dark:text-white">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white p-4 text-sm focus:outline-none focus:border-black dark:focus:border-white transition-colors rounded-none placeholder:text-gray-300"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 text-xs text-center">
              {error}
            </div>
          )}

          <Button fullWidth disabled={isLoading} className="mt-6">
            {isLoading ? 'Authenticating...' : 'Access Panel'}
          </Button>
        </form>
      </div>
    </div>
  );
};
