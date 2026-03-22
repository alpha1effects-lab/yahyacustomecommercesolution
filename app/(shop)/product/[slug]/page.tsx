import type { Metadata } from 'next';
import dbConnect from '@/lib/db';
import Product from '@/lib/models/product';
import { ProductHighlight } from '@/components/ProductHighlight';
import { ProductGrid } from '@/components/ProductGrid';
import ProductReviews from '@/components/ProductReviews';
import ProductQASection from '@/components/ProductQASection';
import ProductDescription from '@/components/ProductDescription';
import { notFound, redirect } from 'next/navigation';
import { slugifyProductName } from '@/lib/utils/productUtils';
import { getSeoSettings, resolveTitle } from '@/lib/utils/seoUtils';

export const dynamic = 'force-dynamic';

const isObjectId = (value: string) => /^[a-f0-9]{24}$/i.test(value);

async function getProduct(slug: string) {
  await dbConnect();
  let product = await Product.findOne({ slug, isPublished: true })
    .populate('brand')
    .populate('category')
    .lean();

  if (!product && isObjectId(slug)) {
    const byId = await Product.findOne({ _id: slug, isPublished: true })
      .populate('brand')
      .populate('category')
      .lean();
    if (byId) return { product: byId, redirectSlug: byId.slug || slugifyProductName(byId.name || 'product') };
  }
  return { product, redirectSlug: null };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { product } = await getProduct(slug);
  if (!product) return {};

  const seo = product.seo || ({} as any);
  const { templates, defaults } = await getSeoSettings();
  const brandName = product.brand && typeof product.brand === 'object' && 'name' in product.brand
    ? (product.brand as any).name
    : '';
  const categoryName = product.category && typeof product.category === 'object' && 'name' in product.category
    ? (product.category as any).name
    : '';

  const title = resolveTitle(
    seo.metaTitle,
    templates.product,
    { name: product.name, brand: brandName, category: categoryName, price: product.price },
    product.name || 'Product',
    defaults.titleSuffix
  );
  const description = seo.metaDescription || defaults.defaultDescription || product.description || '';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
  const url = seo.canonicalUrl || (siteUrl ? `${siteUrl}/product/${product.slug}` : undefined);
  const ogImage = seo.ogImage || (product.images?.length ? product.images[0] : undefined) || defaults.defaultOgImage || undefined;

  return {
    title,
    description,
    alternates: url ? { canonical: url } : undefined,
    openGraph: {
      title: seo.ogTitle || title,
      description: seo.ogDescription || description,
      images: ogImage ? [ogImage] : undefined,
      url,
      type: 'website',
    },
    robots: {
      index: seo.robots?.index !== false,
      follow: seo.robots?.follow !== false,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await dbConnect();
  const { slug } = await params;

  const { product, redirectSlug } = await getProduct(slug);

  if (redirectSlug) {
    redirect(`/product/${redirectSlug}`);
  }
  if (!product) notFound();

  // Get related products from same brand
  const related = await Product.find({
    brand: product.brand?._id,
    _id: { $ne: product._id },
    isPublished: true,
  })
    .limit(4)
    .populate('brand')
    .lean();

  const serialize = (doc: any) => JSON.parse(JSON.stringify(doc));

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || '',
    image: product.images?.length ? product.images[0] : undefined,
    sku: product.sku,
    brand: product.brand && typeof product.brand === 'object' && 'name' in product.brand
      ? { '@type': 'Brand', name: (product.brand as any).name }
      : undefined,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'PKR',
      availability: product.stock > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: siteUrl ? `${siteUrl}/product/${product.slug}` : undefined,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductHighlight product={serialize(product)} />
      <ProductDescription description={product.description || ''} productName={product.name || 'This Product'} />
      <ProductReviews productId={product._id.toString()} productSlug={slug} />
      <ProductQASection productId={product._id.toString()} productName={product.name || 'This Product'} />
      {related.length > 0 && (
        <ProductGrid
          title="You may also like"
          products={serialize(related)}
        />
      )}
    </>
  );
}
