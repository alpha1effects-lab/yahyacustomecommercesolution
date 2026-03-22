import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Announcement from '@/lib/models/announcement';

export async function GET() {
  await dbConnect();
  const announcements = await Announcement.find({ isActive: true })
    .sort({ order: 1, createdAt: -1 })
    .lean();
  return NextResponse.json(announcements);
}
