import type { MetadataRoute } from 'next';
import dbConnect from '@/lib/db';
import Product from '@/lib/models/product';
import BlogPost from '@/lib/models/blogPost';
import Brand from '@/lib/models/brand';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';
  await dbConnect();

  const [products, posts, brands] = await Promise.all([
    Product.find({
      isPublished: true,
      isActive: true,
      'seo.robots.index': { $ne: false },
    })
      .select('slug updatedAt')
      .lean(),
    BlogPost.find({
      status: 'published',
      publishedAt: { $ne: null, $lte: new Date() },
      'robots.index': { $ne: false },
    })
      .select('slug updatedAt')
      .lean(),
    Brand.find({
      isActive: true,
      'seo.robots.index': { $ne: false },
    })
      .select('slug updatedAt')
      .lean(),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${siteUrl}/shop`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${siteUrl}/brands`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${siteUrl}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
  ];

  const productPages: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${siteUrl}/product/${p.slug}`,
    lastModified: (p as any).updatedAt ? new Date((p as any).updatedAt) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const blogPages: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${siteUrl}/blog/${p.slug}`,
    lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  const brandPages: MetadataRoute.Sitemap = brands.map((b) => ({
    url: `${siteUrl}/brands/${b.slug}`,
    lastModified: (b as any).updatedAt ? new Date((b as any).updatedAt) : new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [...staticPages, ...productPages, ...blogPages, ...brandPages];
}
