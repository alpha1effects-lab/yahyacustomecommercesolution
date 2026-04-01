'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type BreadcrumbItem = {
  label: string;
  href?: string;
};

const formatLabel = (value: string) =>
  value
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());

const isProductPath = (segments: string[]) => segments[0] === 'product' && segments.length >= 2;

const mapSegmentLabel = (segment: string) => {
  const map: Record<string, string> = {
    shop: 'Shop',
    offers: 'Offers',
    new: 'New Offers',
    best: 'Best Offers',
    love: "Products You'll Love",
    accessories: 'Accessories',
    track: 'Track Order',
    checkout: 'Checkout',
    'order-confirmation': 'Order Confirmation',
    search: 'Search Results',
  };
  return map[segment] || formatLabel(segment);
};

const buildItemsFromPath = (pathname: string): BreadcrumbItem[] => {
  if (!pathname || pathname === '/') return [];
  const segments = pathname.split('?')[0].split('#')[0].split('/').filter(Boolean);
  if (segments.length === 0) return [];

  if (isProductPath(segments)) {
    const productSlug = segments[1];
    return [
      { label: 'Home', href: '/' },
      { label: 'Shop', href: '/shop' },
      { label: formatLabel(productSlug), href: `/product/${productSlug}` },
    ];
  }

  const items: BreadcrumbItem[] = [{ label: 'Home', href: '/' }];
  const pathParts: string[] = [];
  segments.forEach((segment) => {
    pathParts.push(segment);
    items.push({
      label: mapSegmentLabel(segment),
      href: `/${pathParts.join('/')}`,
    });
  });

  return items;
};

export const Breadcrumbs: React.FC<{ items?: BreadcrumbItem[] }> = ({ items }) => {
  const pathname = usePathname();
  const trail = useMemo(() => {
    if (items && items.length > 0) {
      return [{ label: 'Home', href: '/' }, ...items.filter((item) => item.label !== 'Home')];
    }
    return buildItemsFromPath(pathname || '/');
  }, [items, pathname]);

  const baseUrl = typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_SITE_URL || '';

  const jsonLd = useMemo(() => {
    if (trail.length === 0) return null;
    const itemListElement = trail.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: item.href ? `${baseUrl}${item.href}` : baseUrl,
    }));
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement,
    };
  }, [trail, baseUrl]);

  if (trail.length <= 1) return null;

  return (
    <div className="max-w-[1440px] mx-auto px-6 pt-5 pb-4">
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-widest text-black dark:text-gray-400">
          {trail.map((item, index) => {
            const isLast = index === trail.length - 1;
            return (
              <li key={`${item.label}-${index}`} className="flex items-center gap-2">
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className="hover:text-black dark:hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-black dark:text-white">{item.label}</span>
                )}
                {!isLast && <span className="text-[10px]">&gt;</span>}
              </li>
            );
          })}
        </ol>
      </nav>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
    </div>
  );
};
