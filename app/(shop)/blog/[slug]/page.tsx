import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connectDB } from '@/lib/db';
import BlogPost from '@/lib/models/blogPost';
import { getSeoSettings, resolveTitle } from '@/lib/utils/seoUtils';

const formatDate = (value?: Date | string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString();
};

async function getPost(slug: string) {
  await connectDB();
  return BlogPost.findOne({ slug, status: 'published', publishedAt: { $ne: null, $lte: new Date() } })
    .populate('category')
    .lean();
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};

  const { templates, defaults } = await getSeoSettings();
  const categoryName =
    post.category && typeof post.category === 'object' && 'name' in post.category
      ? (post.category as any).name
      : '';

  const title = resolveTitle(
    post.metaTitle,
    templates.blog,
    { title: post.title, category: categoryName },
    post.title,
    defaults.titleSuffix
  );
  const description = post.metaDescription || defaults.defaultDescription || post.excerpt || '';
  const ogImage = post.ogImage || post.featuredImage || defaults.defaultOgImage || '';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
  const url = (post as any).canonicalUrl || (siteUrl ? `${siteUrl}/blog/${post.slug}` : undefined);

  return {
    title,
    description,
    alternates: url ? { canonical: url } : undefined,
    openGraph: {
      title: (post as any).ogTitle || title,
      description: (post as any).ogDescription || description,
      images: ogImage ? [ogImage] : undefined,
      url,
      type: 'article',
    },
    robots: {
      index: (post as any).robots?.index !== false,
      follow: (post as any).robots?.follow !== false,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return notFound();
  const category =
    post.category && typeof post.category === 'object' && 'name' in post.category
      ? (post.category as { name?: string })
      : null;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.metaDescription || post.excerpt || '',
    image: post.featuredImage || undefined,
    datePublished: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
    dateModified: post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined,
    url: siteUrl ? `${siteUrl}/blog/${post.slug}` : undefined,
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="text-xs uppercase tracking-widest text-black mb-3">
        {category?.name || 'Uncategorized'}
      </div>
      <h1 className="text-3xl font-bold mb-3">{post.title}</h1>
      <div className="text-xs text-black mb-8">
        {formatDate(post.publishedAt)}
        {post.readingTimeMinutes ? ` • ${post.readingTimeMinutes} min read` : ''}
      </div>
      {post.featuredImage && (
        <img src={post.featuredImage} alt={post.title} className="w-full h-[360px] object-cover mb-8" />
      )}
      <div className="text-base leading-relaxed" dangerouslySetInnerHTML={{ __html: post.content }} />
    </div>
  );
}
