import type { Metadata } from 'next';
import Script from 'next/script';
import { SessionProvider } from 'next-auth/react';
import { CartProvider } from '@/contexts/CartContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { UIProvider } from '@/contexts/UIContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'Art & Craft Store',
  description: 'Discover premium art supplies, craft materials, and creative essentials.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-X89R61XJJ1"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('consent', 'default', {
              analytics_storage: 'granted'
            });
            gtag('config', 'G-X89R61XJJ1');
          `}
        </Script>
        <link
          href="https://fonts.googleapis.com/css2?family=Assistant:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased bg-white dark:bg-black text-black dark:text-white">
        <SessionProvider>
          <ThemeProvider>
            <CartProvider>
              <CurrencyProvider>
                <UIProvider>
                  {children}
                </UIProvider>
              </CurrencyProvider>
            </CartProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
