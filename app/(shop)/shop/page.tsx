import dbConnect from '@/lib/db';
import Product from '@/lib/models/product';
import { ProductCollection } from '@/components/ProductCollection';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Shop All',
};

export default async function ShopPage() {
  await dbConnect();
  const products = await Product.find({ isPublished: true }).sort({ createdAt: -1 }).populate('brand').populate('category').lean();
  const serialized = JSON.parse(JSON.stringify(products));

  return (
    <ProductCollection
      products={serialized}
      title="All Products"
    />
  );
}
