import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ProductQA from '@/lib/models/productQA';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();
  const { id } = await params;
  const qas = await ProductQA.find({ productId: id }).sort({ order: 1 }).lean();
  return NextResponse.json(qas);
}
