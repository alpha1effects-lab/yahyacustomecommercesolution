import { AnnouncementBar } from '@/components/AnnouncementBar';
import { Header } from '@/components/Header';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Footer } from '@/components/Footer';
import { CartDrawer } from '@/components/CartDrawer';
import { SearchOverlay } from '@/components/SearchOverlay';
import { WhatsAppButton } from '@/components/WhatsAppButton';

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AnnouncementBar />
      <Header />
      <Breadcrumbs />
      <main className="min-h-screen">
        {children}
      </main>
      <Footer />
      <CartDrawer />
      <SearchOverlay />
      <WhatsAppButton />
    </>
  );
}
