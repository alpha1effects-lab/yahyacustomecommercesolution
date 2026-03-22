import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import ProductQA from '@/lib/models/productQA';

async function getAdminSession() {
  const session = await auth();
  if (!session || (session.user as any)?.role !== 'admin') return null;
  return session;
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const qas = await ProductQA.find().sort({ productId: 1, order: 1 }).populate('productId', 'name').lean();
  return NextResponse.json(qas);
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const body = await request.json();
  const qa = await ProductQA.create({
    productId: body.productId,
    question: body.question,
    answer: body.answer,
    order: body.order ?? 0,
  });
  return NextResponse.json(qa, { status: 201 });
}
