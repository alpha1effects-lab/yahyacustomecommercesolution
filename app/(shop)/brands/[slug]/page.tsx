import type { Metadata } from 'next';
import dbConnect from '@/lib/db';
import Brand from '@/lib/models/brand';
import Product from '@/lib/models/product';
import { notFound } from 'next/navigation';
import { ProductGrid } from '@/components/ProductGrid';
import { getSeoSettings, resolveTitle } from '@/lib/utils/seoUtils';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  await dbConnect();
  const { slug } = await params;
  const brand = await Brand.findOne({ slug, isActive: true }).lean();
  if (!brand) return { title: 'Brand Not Found' };

  const seo = brand.seo || ({} as any);
  const { templates, defaults } = await getSeoSettings();
  const title = resolveTitle(
    seo.metaTitle,
    templates.brand,
    { name: brand.name },
    brand.name,
    defaults.titleSuffix
  );
  const description = seo.metaDescription || defaults.defaultDescription || brand.description || `Browse all products from ${brand.name}`;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
  const url = seo.canonicalUrl || (siteUrl ? `${siteUrl}/brands/${brand.slug}` : undefined);
  const ogImage = seo.ogImage || brand.logo || defaults.defaultOgImage || undefined;

  return {
    title,
    description,
    alternates: url ? { canonical: url } : undefined,
    openGraph: {
      title: seo.ogTitle || title,
      description: seo.ogDescription || description,
      images: ogImage ? [ogImage] : undefined,
      url,
    },
    robots: {
      index: seo.robots?.index !== false,
      follow: seo.robots?.follow !== false,
    },
  };
}

export default async function BrandDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  await dbConnect();
  const { slug } = await params;
  const brand = await Brand.findOne({ slug, isActive: true }).lean();
  if (!brand) return notFound();

  const products = await Product.find({ brand: brand._id, isPublished: true, isActive: true })
    .populate('brand')
    .populate('category')
    .sort({ createdAt: -1 })
    .lean();

  const serialize = (docs: any[]) => JSON.parse(JSON.stringify(docs));
  const serializedBrand = JSON.parse(JSON.stringify(brand));
  const serializedProducts = serialize(products);

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-12">
      {/* Brand Header */}
      <div className="mb-12 flex flex-col sm:flex-row items-start sm:items-center gap-6">
        {serializedBrand.logo && (
          <div className="w-24 h-24 border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-black flex items-center justify-center flex-shrink-0">
            <img
              src={serializedBrand.logo}
              alt={`${serializedBrand.name} logo`}
              className="max-w-[80%] max-h-[80%] object-contain"
            />
          </div>
        )}
        <div>
          <h1 className="text-4xl font-medium tracking-tight text-black dark:text-white">
            {serializedBrand.name}
          </h1>
          {serializedBrand.description && (
            <p className="mt-2 text-sm text-text-secondary dark:text-gray-400 max-w-2xl">
              {serializedBrand.description}
            </p>
          )}
        </div>
      </div>

      {/* Products */}
      {serializedProducts.length > 0 ? (
        <ProductGrid
          title={`${serializedBrand.name} Products`}
          products={serializedProducts}
        />
      ) : (
        <div className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-neutral-900 p-12 text-center">
          <p className="text-sm text-text-secondary dark:text-gray-400">
            No products available from {serializedBrand.name} yet.
          </p>
        </div>
      )}
    </div>
  );
}
