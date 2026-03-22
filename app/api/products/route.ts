import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Product from '@/lib/models/product';

export async function GET(request: Request) {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const brand = searchParams.get('brand');
  const category = searchParams.get('category');
  const search = searchParams.get('search');

  const filter: Record<string, any> = { isPublished: true };

  if (brand) filter.brand = brand;
  if (category) filter.category = category;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
    ];
  }

  const products = await Product.find(filter).sort({ createdAt: -1 }).populate('brand').populate('category').lean();
  return NextResponse.json(products);
}
