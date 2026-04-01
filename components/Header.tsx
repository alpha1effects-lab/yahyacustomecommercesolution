'use client';

import React, { useEffect, useState } from 'react';
import { ShoppingBag, Search, Menu, X, Moon, Sun, User, LogOut } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useCart } from '@/contexts/CartContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useUI } from '@/contexts/UIContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import type { SiteSettingsData } from '@/types';

export const Header: React.FC = () => {
  const [openMobileIndex, setOpenMobileIndex] = useState<number | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { data: session } = useSession();
  const defaultMegaMenu: SiteSettingsData['megaMenu'] = [
    {
      label: 'Shop',
      href: '/shop',
      order: 0,
      columns: [
        {
          title: 'Shop',
          order: 0,
          links: [
            { label: 'Shop All', href: '/shop', order: 0 },
            { label: 'Browse New Offers', href: '/offers/new', order: 1 },
            { label: 'Our Best Offers', href: '/offers/best', order: 2 },
            { label: "Products You'll Love", href: '/offers/love', order: 3 },
          ],
        },
      ],
    },
  ];
  const [megaMenuItems, setMegaMenuItems] = useState<SiteSettingsData['megaMenu']>(defaultMegaMenu);
  const { cartCount, setIsCartOpen } = useCart();
  const { isDarkMode, toggleTheme } = useTheme();
  const { setIsSearchOpen, isMobileMenuOpen, setIsMobileMenuOpen } = useUI();
  const { currency, setCurrency, isLoading } = useCurrency();
  const router = useRouter();

  const orderedMegaMenu = [...(megaMenuItems || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const handleNavClick = (path: string) => {
    router.push(path);
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data: SiteSettingsData) => {
        if (data.megaMenu && data.megaMenu.length > 0) setMegaMenuItems(data.megaMenu);
      })
      .catch(() => {});
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-black border-b border-gray-100 dark:border-gray-800 transition-colors duration-200">
      <div className="max-w-[1440px] mx-auto px-6 h-20 flex items-center gap-6">
        
        {/* Mobile Menu Trigger */}
        <div className="flex items-center md:hidden text-black dark:text-white">
          <button onClick={() => setIsMobileMenuOpen(true)} aria-label="Open menu">
            <Menu size={24} strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex-1 md:hidden text-center">
          <Link href="/" className="inline-flex items-center justify-center">
            <Image
              src="/site-logo.svg"
              alt="Store"
              width={180}
              height={45}
              className="h-10 w-auto"
              priority
            />
          </Link>
        </div>

        <div className="md:hidden flex items-center gap-4 text-black dark:text-white">
          <button onClick={() => setIsSearchOpen(true)} aria-label="Search">
            <Search size={20} strokeWidth={1.5} />
          </button>
          <button
            className="relative"
            onClick={() => setIsCartOpen(true)}
            title="Cart"
          >
            <ShoppingBag size={20} strokeWidth={1.5} />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-black dark:bg-white text-white dark:text-black text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
                {cartCount}
              </span>
            )}
          </button>
        </div>

        {/* Logo */}
        <div className="hidden md:flex items-center">
          <Link href="/" className="inline-flex items-center">
            <Image
              src="/site-logo.svg"
              alt="Store"
              width={200}
              height={50}
              className="h-11 w-auto"
              priority
            />
          </Link>
        </div>

        {/* Desktop Mega Menu */}
        <nav className="hidden md:flex items-center justify-center gap-10 text-xs font-semibold uppercase tracking-[0.2em] text-black dark:text-gray-400 flex-1">
          {orderedMegaMenu.map((item) => (
            <div key={item.label} className="relative group">
              <Link href={item.href || '#'} className="hover:text-black dark:hover:text-white transition-colors">
                {item.label}
              </Link>
              <div className="absolute left-1/2 -translate-x-1/2 top-full pt-6 hidden group-hover:block pointer-events-none group-hover:pointer-events-auto">
                <div className="bg-white dark:bg-black border border-gray-100 dark:border-gray-800 shadow-xl p-8 min-w-[720px]">
                  <div
                    className="grid gap-8"
                    style={{ gridTemplateColumns: `repeat(${Math.min(item.columns?.length || 1, 6)}, minmax(0, 1fr))` }}
                  >
                    {[...(item.columns || [])]
                      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                      .map((column, idx) => (
                      <div key={`${item.label}-col-${idx}`} className="space-y-4">
                        {column.image && (
                          <div className="w-40 h-24 bg-gray-100 dark:bg-neutral-800 overflow-hidden">
                            <img src={column.image} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}
                        {column.title && (
                          <div className="text-[11px] font-bold uppercase tracking-widest text-black dark:text-white">
                            {column.title}
                          </div>
                        )}
                        <div className="flex flex-col gap-2">
                          {[...(column.links || [])]
                            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                            .map((link) => (
                            <Link
                              key={`${link.label}-${link.href}`}
                              href={link.href}
                              className="text-[11px] uppercase tracking-[0.18em] text-black dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                            >
                              {link.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </nav>

        {/* Icons Right */}
        <div className="hidden md:flex items-center gap-5 text-black dark:text-white">
          <button 
            className="hover:text-black dark:hover:text-gray-400 transition-colors"
            onClick={() => setIsSearchOpen(true)}
            title="Search"
          >
            <Search size={20} strokeWidth={1.5} />
          </button>
          <button
            className="text-xs font-semibold uppercase tracking-[0.2em] border border-gray-200 dark:border-gray-700 px-3 py-2 hover:border-black dark:hover:border-white transition-colors"
            onClick={() => setCurrency(currency === 'PKR' ? 'USD' : 'PKR')}
            disabled={isLoading}
            title="Toggle currency"
          >
            {currency}
          </button>
          <button 
            className="hover:text-black dark:hover:text-gray-400 transition-colors"
            onClick={toggleTheme}
            title="Toggle Theme"
          >
            {isDarkMode ? <Sun size={20} strokeWidth={1.5} /> : <Moon size={20} strokeWidth={1.5} />}
          </button>
          {!(session?.user && (session.user as any).role === 'user') && (
            <Link
              href="/track"
              className="text-xs font-semibold uppercase tracking-[0.2em] border border-gray-200 dark:border-gray-700 px-3 py-2 hover:border-black dark:hover:border-white transition-colors"
            >
              Track Order
            </Link>
          )}
          {/* User Auth */}
          {session?.user && (session.user as any).role === 'user' ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="hover:text-black dark:hover:text-gray-400 transition-colors"
                title="Account"
              >
                <User size={20} strokeWidth={1.5} />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-black border border-gray-200 dark:border-gray-700 shadow-xl z-50">
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                    <p className="text-xs font-bold uppercase tracking-widest truncate">{session.user.name}</p>
                    <p className="text-[10px] text-gray-400 truncate">{session.user.email}</p>
                  </div>
                  <Link
                    href="/account"
                    onClick={() => setUserMenuOpen(false)}
                    className="block px-4 py-2.5 text-xs uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-neutral-900 transition-colors"
                  >
                    My Account
                  </Link>
                  <Link
                    href="/account?tab=orders"
                    onClick={() => setUserMenuOpen(false)}
                    className="block px-4 py-2.5 text-xs uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-neutral-900 transition-colors"
                  >
                    My Orders
                  </Link>
                  <Link
                    href="/track"
                    onClick={() => setUserMenuOpen(false)}
                    className="block px-4 py-2.5 text-xs uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-neutral-900 transition-colors"
                  >
                    Track Order
                  </Link>
                  <button
                    onClick={() => { setUserMenuOpen(false); signOut({ callbackUrl: '/' }); }}
                    className="w-full text-left px-4 py-2.5 text-xs uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-neutral-900 transition-colors text-red-500"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (session?.user && (session.user as any).role !== 'user') ? null : (
            <Link
              href="/login"
              className="text-xs font-semibold uppercase tracking-[0.2em] border border-gray-200 dark:border-gray-700 px-3 py-2 hover:border-black dark:hover:border-white transition-colors"
            >
              Login
            </Link>
          )}
          <button 
            className="relative hover:text-black dark:hover:text-gray-400 transition-colors"
            onClick={() => setIsCartOpen(true)}
            title="Cart"
          >
            <ShoppingBag size={20} strokeWidth={1.5} />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-black dark:bg-white text-white dark:text-black text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-white dark:bg-black animate-fade-in text-black dark:text-white">
          <div className="p-6 flex justify-between items-center border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-xl font-bold tracking-widest uppercase">Menu</h2>
            <button onClick={() => setIsMobileMenuOpen(false)} aria-label="Close menu">
              <X size={24} strokeWidth={1.5} />
            </button>
          </div>
          <div className="flex flex-col p-6 gap-6 text-lg tracking-wide">
            {orderedMegaMenu.map((item, index) => (
              <div key={`${item.label}-${index}`} className="border-b border-gray-100 dark:border-gray-800 pb-4">
                <button
                  onClick={() => setOpenMobileIndex(openMobileIndex === index ? null : index)}
                  className="w-full text-left flex items-center justify-between"
                >
                  <span>{item.label}</span>
                  <span className="text-xs">{openMobileIndex === index ? '−' : '+'}</span>
                </button>
                {openMobileIndex === index && (
                  <div className="mt-4 space-y-6 text-sm">
                    {[...(item.columns || [])]
                      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                      .map((column, colIndex) => (
                      <div key={`${item.label}-mobile-${colIndex}`} className="space-y-3">
                        {column.image && (
                          <div className="w-full h-28 bg-gray-100 dark:bg-neutral-800 overflow-hidden">
                            <img src={column.image} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}
                        {column.title && (
                          <div className="text-xs font-bold uppercase tracking-widest text-black dark:text-gray-400">
                            {column.title}
                          </div>
                        )}
                        <div className="flex flex-col gap-2">
                          {[...(column.links || [])]
                            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                            .map((link) => (
                            <button
                              key={`${link.label}-${link.href}`}
                              onClick={() => handleNavClick(link.href)}
                              className="text-left"
                            >
                              {link.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <button onClick={() => handleNavClick('/track')} className="text-left border-b border-gray-100 dark:border-gray-800 pb-4">TRACK ORDER</button>
            {session?.user && (session.user as any).role === 'user' ? (
              <>
                <button onClick={() => handleNavClick('/account')} className="text-left border-b border-gray-100 dark:border-gray-800 pb-4">MY ACCOUNT</button>
                <button onClick={() => handleNavClick('/account?tab=orders')} className="text-left border-b border-gray-100 dark:border-gray-800 pb-4">MY ORDERS</button>
                <button
                  onClick={() => { setIsMobileMenuOpen(false); signOut({ callbackUrl: '/' }); }}
                  className="text-left border-b border-gray-100 dark:border-gray-800 pb-4 text-red-500"
                >
                  SIGN OUT
                </button>
              </>
            ) : (session?.user && (session.user as any).role !== 'user') ? null : (
              <button onClick={() => handleNavClick('/login')} className="text-left border-b border-gray-100 dark:border-gray-800 pb-4">LOGIN</button>
            )}
            <div className="flex items-center gap-4 pt-2">
              <button
                onClick={() => setCurrency(currency === 'PKR' ? 'USD' : 'PKR')}
                className="text-[11px] font-bold uppercase tracking-widest border border-gray-200 dark:border-gray-700 px-3 py-2"
                disabled={isLoading}
              >
                {currency}
              </button>
              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 text-sm uppercase tracking-widest"
              >
                {isDarkMode ? <Sun size={16} strokeWidth={1.5} /> : <Moon size={16} strokeWidth={1.5} />}
                {isDarkMode ? 'Light' : 'Dark'}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
