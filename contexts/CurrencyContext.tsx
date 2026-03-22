'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type CurrencyCode = 'PKR' | 'USD';

interface CurrencyContextType {
  currency: CurrencyCode;
  rate: number;
  isLoading: boolean;
  setCurrency: (next: CurrencyCode) => void;
  formatPrice: (amountPkr: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const CURRENCY_COOKIE = 'currency';
const RATE_CACHE_KEY = 'currency-rate-usd';
const RATE_CACHE_TIME_KEY = 'currency-rate-usd-time';

const getCookie = (name: string) => {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : '';
};

const setCookie = (name: string, value: string) => {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000`;
};

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>('PKR');
  const [rate, setRate] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const stored = getCookie(CURRENCY_COOKIE) || localStorage.getItem(CURRENCY_COOKIE);
    if (stored === 'USD' || stored === 'PKR') {
      setCurrencyState(stored);
    }
  }, []);

  useEffect(() => {
    if (currency === 'USD') {
      fetchUsdRate();
    } else {
      setRate(1);
    }
    setCookie(CURRENCY_COOKIE, currency);
    localStorage.setItem(CURRENCY_COOKIE, currency);
  }, [currency]);

  const fetchUsdRate = async () => {
    setIsLoading(true);
    try {
      const cached = localStorage.getItem(RATE_CACHE_KEY);
      const cachedTime = localStorage.getItem(RATE_CACHE_TIME_KEY);
      const cachedRate = cached ? Number(cached) : 0;
      const cachedTimestamp = cachedTime ? Number(cachedTime) : 0;
      const isFresh = cachedRate > 0 && Date.now() - cachedTimestamp < 1000 * 60 * 60 * 24;

      if (isFresh) {
        setRate(cachedRate);
        return;
      }

      const rateFromApi = await fetchRateWithFallback();
      if (rateFromApi) {
        setRate(rateFromApi);
        localStorage.setItem(RATE_CACHE_KEY, rateFromApi.toString());
        localStorage.setItem(RATE_CACHE_TIME_KEY, Date.now().toString());
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRateWithFallback = async () => {
    const endpoints = [
      'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/pkr.json',
      'https://latest.currency-api.pages.dev/v1/currencies/pkr.json',
    ];

    for (const url of endpoints) {
      try {
        const response = await fetch(url);
        if (!response.ok) continue;
        const data = await response.json();
        const usdRate = data?.pkr?.usd;
        if (typeof usdRate === 'number') return usdRate;
      } catch {
        // try next fallback
      }
    }

    return null;
  };

  const setCurrency = (next: CurrencyCode) => {
    setCurrencyState(next);
  };

  const formatPrice = useMemo(() => {
    return (amountPkr: number) => {
      if (currency === 'USD') {
        const usd = amountPkr * rate;
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(usd);
      }
      return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(amountPkr);
    };
  }, [currency, rate]);

  return (
    <CurrencyContext.Provider value={{ currency, rate, isLoading, setCurrency, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}
