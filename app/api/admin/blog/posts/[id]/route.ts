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

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  await dbConnect();
  const post = await BlogPost.findById(id).populate('category').populate('tags');
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(post);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  await dbConnect();
  const body = await request.json();

  const post = await BlogPost.findById(id);
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const title = (body.title || '').trim();
  if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 });

  const slug = (body.slug || '').trim() || slugify(title);
  const existing = await BlogPost.exists({ slug, _id: { $ne: id } });
  if (existing) return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });

  post.title = title;
  post.slug = slug;
  post.content = body.content || '';
  post.excerpt = body.excerpt || '';
  post.featuredImage = body.featuredImage || '';
  post.status = body.status || 'draft';
  post.category = body.category || undefined;
  post.tags = Array.isArray(body.tags) ? body.tags : [];
  post.metaTitle = body.metaTitle || '';
  post.metaDescription = body.metaDescription || '';
  post.ogImage = body.ogImage || '';
  post.canonicalUrl = body.canonicalUrl || '';
  post.ogTitle = body.ogTitle || '';
  post.ogDescription = body.ogDescription || '';
  if (body.robots !== undefined) {
    post.robots = {
      index: body.robots.index ?? true,
      follow: body.robots.follow ?? true,
    };
  }
  if (body.publishedAt !== undefined) {
    post.publishedAt = body.publishedAt || null;
  }

  await post.save();
  const saved = await BlogPost.findById(id).populate('category').populate('tags');
  return NextResponse.json(saved);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  await dbConnect();
  const deleted = await BlogPost.findByIdAndDelete(id);
  if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ success: true });
}
