import dbConnect from '@/lib/db';
import Product from '@/lib/models/product';
import SiteSettings from '@/lib/models/siteSettings';
import { ProductCollection } from '@/components/ProductCollection';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Our Best Offers',
};

export default async function BestOffersPage() {
  await dbConnect();
  const settings = await SiteSettings.findOne().lean();

  let products;
  if (settings?.bestOffersProductIds?.length) {
    products = await Product.find({ _id: { $in: settings.bestOffersProductIds }, isPublished: true }).populate('brand').populate('category').lean();
  } else {
    products = await Product.find({ isBestOffer: true, isPublished: true }).sort({ createdAt: -1 }).populate('brand').populate('category').lean();
  }

  return (
    <ProductCollection
      products={JSON.parse(JSON.stringify(products))}
      title="Our Best Offers"
    />
  );
}
