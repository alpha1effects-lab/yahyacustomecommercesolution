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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const { id } = await params;
  const body = await request.json();

  const update: Record<string, unknown> = {};
  if (body.from !== undefined) update.from = (body.from as string).trim();
  if (body.to !== undefined) update.to = (body.to as string).trim();
  if (body.type !== undefined) update.type = body.type === 302 ? 302 : 301;
  if (body.isActive !== undefined) update.isActive = body.isActive;
  if (body.note !== undefined) update.note = body.note;

  const redirect = await Redirect.findByIdAndUpdate(id, update, { new: true }).lean();
  if (!redirect) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(redirect);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const { id } = await params;
  await Redirect.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
