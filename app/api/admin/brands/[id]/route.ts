import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Brand from '@/lib/models/brand';

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

async function getAdminSession() {
  const session = await auth();
  if (!session || (session.user as any)?.role !== 'admin') {
    return null;
  }
  return session;
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const { id } = await params;
  const body = await request.json();
  const name = (body.name || '').trim();
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  const slug = (body.slug || '').trim() || slugify(name);

  const brand = await Brand.findByIdAndUpdate(
    id,
    {
      name,
      slug,
      description: body.description || '',
      logo: body.logo || '',
      ...(body.seo !== undefined && { seo: body.seo }),
    },
    { new: true }
  ).lean();
  if (!brand) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(brand);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const { id } = await params;
  await Brand.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
