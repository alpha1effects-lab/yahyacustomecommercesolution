import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Redirect from '@/lib/models/redirect';

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
  const redirects = await Redirect.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json(redirects);
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const body = await request.json();

  const from = (body.from || '').trim();
  const to = (body.to || '').trim();
  if (!from || !to) {
    return NextResponse.json({ error: 'Both "from" and "to" paths are required' }, { status: 400 });
  }
  if (from === to) {
    return NextResponse.json({ error: 'Source and destination cannot be the same' }, { status: 400 });
  }

  const existing = await Redirect.findOne({ from });
  if (existing) {
    return NextResponse.json({ error: 'A redirect from this path already exists' }, { status: 409 });
  }

  const redirect = await Redirect.create({
    from,
    to,
    type: body.type === 302 ? 302 : 301,
    isActive: body.isActive !== false,
    note: body.note || '',
  });

  return NextResponse.json(redirect, { status: 201 });
}
