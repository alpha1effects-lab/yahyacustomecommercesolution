'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Facebook, Instagram, Twitter, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import type { SiteSettingsData } from '@/types';

const isActiveLink = (value?: string) => {
  if (!value) return false;
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed !== '#';
};

const TiktokIcon: React.FC<{ size?: number; strokeWidth?: number; className?: string }> = ({ size = 20, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M14.5 3a5.1 5.1 0 0 0 3.5 3.5v2.4a7.3 7.3 0 0 1-3.5-1.2v7.1a5.8 5.8 0 1 1-5.8-5.8c.4 0 .9.1 1.3.2v2.6a3.3 3.3 0 1 0 2.1 3.1V3h2.4z" />
  </svg>
);

export const Footer: React.FC = () => {
  const [footer, setFooter] = useState<SiteSettingsData['footer'] | null>(null);

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data: SiteSettingsData) => {
        if (data.footer) setFooter(data.footer);
      })
      .catch(() => {});
  }, []);

  const fallbackFooter = useMemo<SiteSettingsData['footer']>(() => ({
    topLinks: [
      { label: 'Search', href: '#', order: 0 },
      { label: 'About Us', href: '#', order: 1 },
      { label: 'Contact', href: '#', order: 2 },
      { label: 'Shipping Policy', href: '#', order: 3 },
      { label: 'Terms of Service', href: '#', order: 4 },
    ],
    columns: [
      {
        title: 'About',
        description: 'Your one-stop shop for premium art supplies and craft materials.',
        order: 0,
        links: [],
        showNewsletterForm: false,
      },
      {
        title: "Let's Talk",
        description: '',
        order: 1,
        links: [
          { label: 'hello@example.com', href: 'mailto:hello@example.com' },
          { label: '+1 (555) 000-0000', href: 'tel:+15550000000' },
          { label: 'Mon - Fri: 9am - 5pm EST', href: '#' },
        ],
        showNewsletterForm: false,
      },
      {
        title: 'Newsletter',
        description: 'Subscribe to receive updates, access to exclusive deals, and more.',
        order: 2,
        links: [],
        showNewsletterForm: true,
        newsletterPlaceholder: 'Enter your email',
      },
    ],
    socialLinks: {
      instagram: '',
      facebook: '',
      twitter: '',
      tiktok: '',
    },
  }), []);

  const footerData = footer || fallbackFooter!;
  const socialLinks = footerData.socialLinks || {};

  const topLinks = (footerData.topLinks || [])
    .filter((link) => link.label && link.href)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const columns = [...(footerData.columns || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const socialItems = [
    { key: 'instagram', href: socialLinks.instagram, icon: <Instagram size={20} strokeWidth={1.5} /> },
    { key: 'facebook', href: socialLinks.facebook, icon: <Facebook size={20} strokeWidth={1.5} /> },
    { key: 'twitter', href: socialLinks.twitter, icon: <Twitter size={20} strokeWidth={1.5} /> },
    { key: 'tiktok', href: socialLinks.tiktok, icon: <TiktokIcon size={20} /> },
  ].filter((item) => isActiveLink(item.href));

  return (
    <footer className="bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800 pt-20 pb-10 transition-colors duration-200">
      <div className="max-w-[1440px] mx-auto px-6">
        {topLinks.length > 0 && (
          <div className="mb-12">
            <div className="flex flex-wrap gap-6 text-xs uppercase tracking-widest text-text-secondary dark:text-gray-400">
              {topLinks.map((link, index) => (
                <Link
                  key={`${link.label}-${index}`}
                  href={link.href}
                  className="hover:text-black dark:hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}

        <div
          className={`grid grid-cols-1 ${
            columns.length <= 1
              ? 'md:grid-cols-1'
              : columns.length === 2
              ? 'md:grid-cols-2'
              : columns.length === 3
              ? 'md:grid-cols-3'
              : 'md:grid-cols-4'
          } gap-12 mb-20`}
        >
          {columns.map((column, index) => (
            <div key={`${column.title}-${index}`} className="space-y-6">
              {column.image && (
                <div className="w-32 h-20 bg-gray-100 dark:bg-neutral-800 overflow-hidden">
                  <img src={column.image} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              {column.title && (
                <h3 className="text-sm font-bold uppercase tracking-widest text-black dark:text-white">
                  {column.title}
                </h3>
              )}
              {column.description && (
                <p className="text-sm text-text-secondary dark:text-gray-400 leading-relaxed max-w-xs">
                  {column.description}
                </p>
              )}
              {(column.links || []).length > 0 && (
                <ul className="space-y-4 text-sm text-text-secondary dark:text-gray-400">
                  {(column.links || []).map((link, linkIndex) => (
                    <li key={`${link.label}-${linkIndex}`}>
                      <Link href={link.href || '#'} className="hover:text-black dark:hover:text-white transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              {column.showNewsletterForm && (
                <div className="relative">
                  <input
                    type="email"
                    placeholder={column.newsletterPlaceholder || 'Enter your email'}
                    className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black dark:text-white p-3 pr-10 text-sm focus:outline-none focus:border-black dark:focus:border-white transition-colors rounded-none placeholder:text-gray-400"
                  />
                  <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-black dark:text-white hover:text-text-secondary dark:hover:text-gray-300">
                    {column.newsletterButtonLabel ? (
                      <span className="text-xs uppercase tracking-widest">{column.newsletterButtonLabel}</span>
                    ) : (
                      <ArrowRight size={18} />
                    )}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center border-t border-gray-100 dark:border-gray-800 pt-10 gap-6">
          <div className="flex gap-6">
            {socialItems.map((item) => (
              <Link
                key={item.key}
                href={item.href as string}
                className="text-black dark:text-white hover:text-text-secondary dark:hover:text-gray-400"
                target={item.href?.startsWith('http') ? '_blank' : undefined}
                rel={item.href?.startsWith('http') ? 'noreferrer' : undefined}
              >
                {item.icon}
              </Link>
            ))}
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-4 text-xs text-text-secondary dark:text-gray-500">
           
            <span>&copy; {new Date().getFullYear()} Inno Bricks. All rights reserved.</span>
            
          </div>
        </div>
      </div>
    </footer>
  );
};
