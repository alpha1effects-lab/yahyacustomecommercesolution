import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import SiteSettings from '@/lib/models/siteSettings';

async function getAdminSession() {
  const session = await auth();
  if (!session || (session.user as any)?.role !== 'admin') {
    return null;
  }
  return session;
}

const DEFAULT_ROBOTS_TXT = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /seller/
Disallow: /checkout
Disallow: /order-confirmation
Disallow: /login

Sitemap: ${process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'}/sitemap.xml`;

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const settings = await SiteSettings.findOne().lean();
  return NextResponse.json({ robotsTxt: settings?.robotsTxt || DEFAULT_ROBOTS_TXT });
}

export async function PUT(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const body = await request.json();

  let settings = await SiteSettings.findOne();
  if (!settings) {
    settings = new SiteSettings({});
  }
  settings.robotsTxt = body.robotsTxt ?? '';
  await settings.save();

  return NextResponse.json({ robotsTxt: settings.robotsTxt });
}
