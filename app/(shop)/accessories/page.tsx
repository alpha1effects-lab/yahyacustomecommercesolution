import dbConnect from '@/lib/db';
import Product from '@/lib/models/product';
import { ProductCollection } from '@/components/ProductCollection';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Accessories',
  description: 'Browse our art and craft accessories.',
  openGraph: {
    title: 'Accessories',
    description: 'Browse our art and craft accessories.',
  },
};

export default async function AccessoriesPage() {
  await dbConnect();
  const products = await Product.find({ category: 'accessory' }).sort({ createdAt: -1 }).lean();

  // Fallback: show all if none have accessory category
  const allProducts = products.length > 0 
    ? products 
    : await Product.find().lean();

  const serialized = JSON.parse(JSON.stringify(allProducts));

  return (
    <ProductCollection
      products={serialized}
      title="Accessories"
    />
  );
}
