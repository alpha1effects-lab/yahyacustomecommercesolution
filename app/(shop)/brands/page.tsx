import dbConnect from '@/lib/db';
import Brand from '@/lib/models/brand';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Brands',
};

export default async function BrandsPage() {
  await dbConnect();
  const brands = await Brand.find({ isActive: true }).sort({ displayOrder: 1, name: 1 }).lean();
  const serialized = JSON.parse(JSON.stringify(brands));

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-12">
      <h1 className="text-4xl font-medium tracking-tight mb-2 text-black dark:text-white">Brands</h1>
      <p className="text-text-secondary dark:text-gray-400 text-sm mb-10">
        Explore all available brands in our store.
      </p>

      {serialized.length === 0 ? (
        <div className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-neutral-900 p-8 text-sm text-text-secondary dark:text-gray-400">
          No brands available yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {serialized.map((brand: { _id: string; name: string; slug: string; logo?: string; description?: string }) => (
            <Link
              key={brand._id}
              href={`/brands/${brand.slug}`}
              className="group border border-gray-200 dark:border-gray-800 bg-white dark:bg-neutral-900 p-5 flex flex-col gap-4 transition-all duration-300 hover:border-black dark:hover:border-white hover:shadow-md cursor-pointer"
            >
              <div className="w-full h-28 border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-black flex items-center justify-center">
                {brand.logo ? (
                  <img
                    src={brand.logo}
                    alt={`${brand.name} logo`}
                    className="max-w-[85%] max-h-[85%] object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <span className="text-sm uppercase tracking-widest text-text-secondary dark:text-gray-500">
                    {brand.name.slice(0, 2)}
                  </span>
                )}
              </div>

              <div>
                <h2 className="text-lg font-semibold text-black dark:text-white">{brand.name}</h2>
                <p className="mt-1 text-xs uppercase tracking-widest text-text-secondary dark:text-gray-500">
                  {brand.slug}
                </p>
              </div>

              <p className="text-sm text-text-secondary dark:text-gray-400 line-clamp-3">
                {brand.description?.trim() || 'No description available.'}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
