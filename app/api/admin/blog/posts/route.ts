import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import BlogPost from '@/lib/models/blogPost';
import { slugify } from '@/lib/utils/blogUtils';

async function getAdminSession() {
  const session = await auth();
  if (!session || (session.user as any)?.role !== 'admin') {
    return null;
  }
  return session;
}

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('q') || '').trim();
  const status = (searchParams.get('status') || '').trim();

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (query) {
    filter.$or = [
      { title: { $regex: query, $options: 'i' } },
      { slug: { $regex: query, $options: 'i' } },
    ];
  }

  const posts = await BlogPost.find(filter)
    .populate('category')
    .populate('tags')
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json(posts);
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const body = await request.json();

  const title = (body.title || '').trim();
  if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 });

  const slug = (body.slug || '').trim() || slugify(title);
  const existing = await BlogPost.exists({ slug });
  if (existing) return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });

  const post = await BlogPost.create({
    title,
    slug,
    content: body.content || '',
    excerpt: body.excerpt || '',
    featuredImage: body.featuredImage || '',
    status: body.status || 'draft',
    category: body.category || undefined,
    tags: Array.isArray(body.tags) ? body.tags : [],
    metaTitle: body.metaTitle || '',
    metaDescription: body.metaDescription || '',
    ogImage: body.ogImage || '',
    publishedAt: body.publishedAt || null,
  });

  return NextResponse.json(post);
}
