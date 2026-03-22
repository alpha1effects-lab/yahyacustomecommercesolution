import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Announcement from '@/lib/models/announcement';

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
  const announcements = await Announcement.find().sort({ order: 1, createdAt: -1 }).lean();
  return NextResponse.json(announcements);
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const body = await request.json();
  const text = (body.text || '').trim();
  if (!text) return NextResponse.json({ error: 'Text is required' }, { status: 400 });

  const announcement = await Announcement.create({
    text,
    order: body.order ?? 0,
    isActive: body.isActive ?? true,
  });
  return NextResponse.json(announcement);
}
