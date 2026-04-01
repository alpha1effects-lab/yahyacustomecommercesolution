'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from './ui/Button';

interface HeroProps {
  heroImage?: string;
  heroSlideIntervalSeconds?: number;
  heroSlides?: {
    image: string;
    headline?: string;
    subheadline?: string;
    ctaLabel?: string;
    ctaLink?: string;
  }[];
}

export const Hero: React.FC<HeroProps> = ({ heroImage, heroSlides, heroSlideIntervalSeconds = 6 }) => {
  const fallbackImage = heroImage || 'https://images.unsplash.com/photo-1613918108466-292b78a8ef95?q=80&w=2574&auto=format&fit=crop';
  const slides = useMemo(() => {
    if (heroSlides && heroSlides.length > 0) {
      return heroSlides;
    }
    return [
      {
        image: fallbackImage,
        headline: '',
        subheadline: '',
        ctaLabel: 'Shop Now',
        ctaLink: '/shop',
      },
    ];
  }, [fallbackImage, heroSlides]);

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, Math.max(2, heroSlideIntervalSeconds) * 1000);
    return () => clearInterval(interval);
  }, [slides.length, heroSlideIntervalSeconds]);

  const activeSlide = slides[activeIndex];
  const headline = activeSlide.headline || '';
  const subheadline = activeSlide.subheadline || '';

  return (
    <section className="relative w-full h-[600px] md:h-[80vh] overflow-hidden">
      <div className="absolute inset-0">
        <img 
          src={activeSlide.image}
          alt="Hero banner" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/5 dark:bg-black/20" />
      </div>

      <div className="absolute inset-0 flex items-center justify-center md:justify-start">
        <div className="max-w-[1440px] mx-auto px-6 w-full">
          <div className="max-w-xl animate-fade-in-up">
            {headline && (
              <h1 className="text-5xl md:text-7xl font-bold mb-6 text-black dark:text-white tracking-tight">
                {headline}
              </h1>
            )}
            {subheadline && (
              <p className="text-black dark:text-gray-300 text-lg mb-8 max-w-md">
                {subheadline}
              </p>
            )}
            <div className="flex gap-4 items-center">
              <Link href={activeSlide.ctaLink || '/shop'}>
                <Button>{activeSlide.ctaLabel || 'Shop Collection'}</Button>
              </Link>
              {slides.length > 1 && (
                <div className="flex gap-2">
                  {slides.map((_, index) => (
                    <button
                      key={`slide-dot-${index}`}
                      onClick={() => setActiveIndex(index)}
                      className={`w-8 h-[2px] transition-colors ${index === activeIndex ? 'bg-black dark:bg-white' : 'bg-black/30 dark:bg-white/40'}`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
