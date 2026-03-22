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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const { id } = await params;
  const body = await request.json();
  const subscriber = await Newsletter.findByIdAndUpdate(
    id,
    {
      isActive: body.isActive,
      unsubscribedAt: body.isActive ? null : new Date(),
    },
    { new: true }
  ).lean();
  if (!subscriber) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(subscriber);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const { id } = await params;
  await Newsletter.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
