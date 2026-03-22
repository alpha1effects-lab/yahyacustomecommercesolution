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

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  await dbConnect();
  const body = await request.json();

  const name = (body.name || '').trim();
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  const slug = (body.slug || '').trim() || slugify(name);
  const existing = await BlogTag.exists({ slug, _id: { $ne: id } });
  if (existing) return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });

  const updated = await BlogTag.findByIdAndUpdate(id, { name, slug }, { new: true });
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  await dbConnect();
  const deleted = await BlogTag.findByIdAndDelete(id);
  if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
