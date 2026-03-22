import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Brand from '@/lib/models/brand';

async function getAdminSession() {
  const session = await auth();
  if (!session || (session.user as any)?.role !== 'admin') {
    return null;
  }
  return session;
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const brands = await Brand.find().sort({ name: 1 }).lean();
  return NextResponse.json(brands);
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  try {
    const body = await request.json();
    const name = (body.name || '').trim();
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const slug = (body.slug || '').trim() || slugify(name);
    const brand = await Brand.create({
      name,
      slug,
      description: body.description || '',
      logo: body.logo || '',
    });
    return NextResponse.json(brand);
  } catch (error: any) {
    if (error?.code === 11000) {
      return NextResponse.json({ error: 'A brand with this name or slug already exists.' }, { status: 400 });
    }
    console.error('Brand creation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create brand' }, { status: 500 });
  }
}
