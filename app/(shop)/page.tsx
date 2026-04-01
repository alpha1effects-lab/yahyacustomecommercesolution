import dbConnect from '@/lib/db';
import Product from '@/lib/models/product';
import Brand from '@/lib/models/brand';
import SiteSettings from '@/lib/models/siteSettings';
import { Hero } from '@/components/Hero';
import { ProductGrid } from '@/components/ProductGrid';
import { BrandGrid } from '@/components/BrandGrid';
import { CustomerReviews } from '@/components/CustomerReviews';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  await dbConnect();

  const settings = await SiteSettings.findOne().lean();
  const safeHeroSlides = settings?.heroSlides
    ? settings.heroSlides.map((slide: any) => ({
        image: slide.image,
        headline: slide.headline,
        subheadline: slide.subheadline,
        ctaLabel: slide.ctaLabel,
        ctaLink: slide.ctaLink,
      }))
    : undefined;
  const safeReviews = settings?.reviews ? JSON.parse(JSON.stringify(settings.reviews)) : [];

  // Fetch new offers products
  let newOffers;
  if (settings?.newOffersProductIds?.length) {
    newOffers = await Product.find({ _id: { $in: settings.newOffersProductIds }, isPublished: true }).populate('brand').populate('category').lean();
  } else {
    newOffers = await Product.find({ isNewOffer: true, isPublished: true }).limit(4).populate('brand').populate('category').lean();
    if (newOffers.length === 0) {
      newOffers = await Product.find({ isNewOffer: true, isPublished: true }).limit(4).populate('brand').populate('category').lean();
    }
  }

  // Fetch best offers products
  let bestOffers;
  if (settings?.bestOffersProductIds?.length) {
    bestOffers = await Product.find({ _id: { $in: settings.bestOffersProductIds }, isPublished: true }).populate('brand').populate('category').lean();
  } else {
    bestOffers = await Product.find({ isBestOffer: true, isPublished: true }).limit(4).populate('brand').populate('category').lean();
    if (bestOffers.length === 0) {
      bestOffers = await Product.find({ isPublished: true }).limit(4).populate('brand').populate('category').lean();
    }
  }

  // Fetch products you'll love
  let productsYouLove;
  if (settings?.productsYouLoveProductIds?.length) {
    productsYouLove = await Product.find({ _id: { $in: settings.productsYouLoveProductIds }, isPublished: true }).populate('brand').populate('category').lean();
  } else {
    productsYouLove = await Product.find({ isFeatured: true, isPublished: true }).limit(4).populate('brand').populate('category').lean();
    if (productsYouLove.length === 0) {
      productsYouLove = await Product.find({ isPublished: true }).limit(4).populate('brand').populate('category').lean();
    }
  }

  // Fetch brands for "Shop via Brands" section
  const brandsRaw = await Brand.find({ isActive: true }).sort({ displayOrder: 1, name: 1 }).limit(5).lean();

  const defaultSections = {
    newOffers: { title: 'Browse New Offers', show: true },
    bestOffers: { title: 'Our Best Offers', show: true },
    productsYouLove: { title: "Products You'll Love", show: true },
  };
  const sections = { ...defaultSections, ...(settings?.sections || {}) };

  // Serialize MongoDB documents
  const serialize = (docs: any[]) => JSON.parse(JSON.stringify(docs));

  return (
    <>
      <Hero
        heroImage={settings?.heroImage}
        heroSlides={safeHeroSlides}
        heroSlideIntervalSeconds={settings?.heroSlideIntervalSeconds}
      />

      {sections.newOffers.show && newOffers.length > 0 && (
        <ProductGrid
          title={sections.newOffers.title}
          products={serialize(newOffers)}
          onViewAll="/offers/new"
        />
      )}

      {sections.bestOffers.show && bestOffers.length > 0 && (
        <ProductGrid
          title={sections.bestOffers.title}
          products={serialize(bestOffers)}
          onViewAll="/offers/best"
        />
      )}

      {sections.productsYouLove.show && productsYouLove.length > 0 && (
        <ProductGrid
          title={sections.productsYouLove.title}
          products={serialize(productsYouLove)}
          onViewAll="/offers/love"
        />
      )}

      {brandsRaw.length > 0 && (
        <BrandGrid
          title="Popular Brands"
          brands={serialize(brandsRaw)}
          onViewAll="/brands"
        />
      )}

      <CustomerReviews reviews={safeReviews} />
    </>
  );
}

