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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const { id } = await params;
  const body = await request.json();
  const announcement = await Announcement.findByIdAndUpdate(
    id,
    {
      text: body.text,
      order: body.order,
      isActive: body.isActive,
    },
    { new: true }
  ).lean();
  if (!announcement) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(announcement);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const { id } = await params;
  await Announcement.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
