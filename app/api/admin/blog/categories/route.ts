import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import BlogCategory from '@/lib/models/blogCategory';
import { slugify } from '@/lib/utils/blogUtils';

async function getAdminSession() {
  const session = await auth();
  if (!session || (session.user as any)?.role !== 'admin') {
    return null;
  }
  return session;
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const categories = await BlogCategory.find().sort({ name: 1 }).lean();
  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const body = await request.json();

  const name = (body.name || '').trim();
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  const slug = (body.slug || '').trim() || slugify(name);
  const existing = await BlogCategory.exists({ slug });
  if (existing) return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });

  const category = await BlogCategory.create({
    name,
    slug,
    description: body.description || '',
  });
  return NextResponse.json(category);
}
