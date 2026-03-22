import dbConnect from '@/lib/db';
import Product from '@/lib/models/product';
import { ProductGrid } from '@/components/ProductGrid';

export const dynamic = 'force-dynamic';

type SearchPageProps = {
  searchParams?: { q?: string } | Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  await dbConnect();
  const resolvedParams = await Promise.resolve(searchParams);
  const rawQuery = resolvedParams?.q || '';
  const query = decodeURIComponent(rawQuery).trim();

  const filter: Record<string, any> = { isPublished: true };
  if (query) {
    filter.$or = [
      { name: { $regex: query, $options: 'i' } },
      { sku: { $regex: query, $options: 'i' } },
      { slug: { $regex: query, $options: 'i' } },
    ];
  }

  const products = await Product.find(filter)
    .sort({ createdAt: -1 })
    .populate('brand')
    .populate('category')
    .populate('categories')
    .lean();

  const safeProducts = JSON.parse(JSON.stringify(products));
  const hasQuery = query.length > 0;

  let recommended: any[] = [];
  if (hasQuery && safeProducts.length === 0) {
    recommended = await Product.find({ isPublished: true })
      .sort({ createdAt: -1 })
      .limit(4)
      .populate('brand')
      .populate('category')
      .lean();
  }
  const safeRecommended = JSON.parse(JSON.stringify(recommended));

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="max-w-[1440px] mx-auto px-6 pt-12 pb-8">
        <h1 className="text-3xl font-bold text-black dark:text-white">Search Results</h1>
        <p className="text-sm text-text-secondary dark:text-gray-400 mt-2">
          {query ? `Showing results for "${query}"` : 'Showing all products'}
        </p>
      </div>
      {safeProducts.length > 0 && <ProductGrid title="" products={safeProducts} />}
      {safeProducts.length === 0 && (
        <div className="max-w-[1440px] mx-auto px-6 pb-20 text-text-secondary dark:text-gray-400">
          No products found.
        </div>
      )}
      {hasQuery && safeProducts.length === 0 && safeRecommended.length > 0 && (
        <ProductGrid title="But, you may like:" products={safeRecommended} />
      )}
    </div>
  );
}
