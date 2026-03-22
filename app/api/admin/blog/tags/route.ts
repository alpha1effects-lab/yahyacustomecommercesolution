import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import BlogTag from '@/lib/models/blogTag';
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
  const tags = await BlogTag.find().sort({ name: 1 }).lean();
  return NextResponse.json(tags);
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const body = await request.json();

  const name = (body.name || '').trim();
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  const slug = (body.slug || '').trim() || slugify(name);
  const existing = await BlogTag.exists({ slug });
  if (existing) return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });

  const tag = await BlogTag.create({ name, slug });
  return NextResponse.json(tag);
}
