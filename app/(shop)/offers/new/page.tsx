import dbConnect from '@/lib/db';
import Product from '@/lib/models/product';
import SiteSettings from '@/lib/models/siteSettings';
import { ProductCollection } from '@/components/ProductCollection';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Browse New Offers',
};

export default async function NewOffersPage() {
  await dbConnect();
  const settings = await SiteSettings.findOne().lean();

  let products;
  if (settings?.newOffersProductIds?.length) {
    products = await Product.find({ _id: { $in: settings.newOffersProductIds }, isPublished: true }).populate('brand').populate('category').lean();
  } else {
    products = await Product.find({ isNewOffer: true, isPublished: true }).sort({ createdAt: -1 }).populate('brand').populate('category').lean();
  }

  return (
    <ProductCollection
      products={JSON.parse(JSON.stringify(products))}
      title="Browse New Offers"
    />
  );
}
