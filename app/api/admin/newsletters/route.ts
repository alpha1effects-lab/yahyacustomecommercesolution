import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Newsletter from '@/lib/models/newsletter';

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
  const subscribers = await Newsletter.find().sort({ subscribedAt: -1 }).lean();
  return NextResponse.json(subscribers);
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const body = await request.json();
  const email = (body.email || '').trim().toLowerCase();
  if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

  const existing = await Newsletter.findOne({ email });
  if (existing) {
    existing.isActive = true;
    existing.unsubscribedAt = null;
    existing.source = 'admin';
    await existing.save();
    return NextResponse.json(existing);
  }

  const subscriber = await Newsletter.create({ email, source: 'admin' });
  return NextResponse.json(subscriber);
}
