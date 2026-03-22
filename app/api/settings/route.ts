import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import SiteSettings from '@/lib/models/siteSettings';

export async function GET() {
  await dbConnect();
  let settings: any = await SiteSettings.findOne().lean();
  if (!settings) {
    const created = await SiteSettings.create({});
    settings = created.toObject();
  }
  return NextResponse.json(settings);
}
