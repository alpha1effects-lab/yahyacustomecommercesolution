import Link from 'next/link';
import { connectDB } from '@/lib/db';
import BlogPost from '@/lib/models/blogPost';
import BlogCategory from '@/lib/models/blogCategory';

const POSTS_PER_PAGE = 6;

const formatDate = (value?: Date | string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString();
};

export default async function BlogListPage({
  searchParams,
}: {
  searchParams?: { page?: string; category?: string };
}) {
  await connectDB();
  const page = Number(searchParams?.page || 1);
  const categorySlug = searchParams?.category || '';
  const currentPage = Number.isNaN(page) || page < 1 ? 1 : page;

  const categories = await BlogCategory.find().sort({ name: 1 }).lean();
  const activeCategory = categorySlug
    ? await BlogCategory.findOne({ slug: categorySlug }).lean()
    : null;

  const filter: Record<string, unknown> = {
    status: 'published',
    publishedAt: { $ne: null, $lte: new Date() },
  };
  if (activeCategory?._id) {
    filter.category = activeCategory._id;
  }

  const total = await BlogPost.countDocuments(filter);
  const totalPages = Math.max(1, Math.ceil(total / POSTS_PER_PAGE));
  const posts = await BlogPost.find(filter)
    .populate('category')
    .sort({ publishedAt: -1 })
    .skip((currentPage - 1) * POSTS_PER_PAGE)
    .limit(POSTS_PER_PAGE)
    .lean();

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold uppercase tracking-widest">Blog</h1>
        <p className="text-sm text-text-secondary">News, tips, and guides from our blog.</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-8 text-xs uppercase tracking-widest">
        <Link
          href="/blog"
          className={`border px-3 py-2 ${!categorySlug ? 'border-black' : 'border-gray-300'}`}
        >
          All
        </Link>
        {categories.map((category) => (
          <Link
            key={String(category._id)}
            href={`/blog?category=${category.slug}`}
            className={`border px-3 py-2 ${category.slug === categorySlug ? 'border-black' : 'border-gray-300'}`}
          >
            {category.name}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {posts.map((post) => {
          const category =
            post.category && typeof post.category === 'object' && 'name' in post.category
              ? (post.category as { name?: string })
              : null;
          return (
            <article key={String(post._id)} className="border border-gray-200 p-6">
              {post.featuredImage && (
                <Link href={`/blog/${post.slug}`}>
                  <img src={post.featuredImage} alt={post.title} className="w-full h-52 object-cover mb-4" />
                </Link>
              )}
              <div className="text-xs uppercase tracking-widest text-text-secondary mb-2">
                {category?.name || 'Uncategorized'}
              </div>
              <h2 className="text-xl font-semibold mb-2">
                <Link href={`/blog/${post.slug}`}>{post.title}</Link>
              </h2>
              <div className="text-xs text-text-secondary mb-4">
                {formatDate(post.publishedAt)}
                {post.readingTimeMinutes ? ` • ${post.readingTimeMinutes} min read` : ''}
              </div>
              <p className="text-sm text-text-secondary">{post.excerpt}</p>
            </article>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex gap-3 mt-10">
          {Array.from({ length: totalPages }).map((_, index) => {
            const pageNumber = index + 1;
            const query = new URLSearchParams();
            query.set('page', String(pageNumber));
            if (categorySlug) query.set('category', categorySlug);
            return (
              <Link
                key={pageNumber}
                href={`/blog?${query.toString()}`}
                className={`border px-3 py-2 text-xs uppercase tracking-widest ${pageNumber === currentPage ? 'border-black' : 'border-gray-300'}`}
              >
                {pageNumber}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
