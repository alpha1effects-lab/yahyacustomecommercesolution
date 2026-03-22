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

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const settings = await SiteSettings.findOne().lean();
  return NextResponse.json({
    titleSuffix: settings?.defaultSeo?.titleSuffix ?? '',
    defaultDescription: settings?.defaultSeo?.defaultDescription ?? '',
    defaultOgImage: settings?.defaultSeo?.defaultOgImage ?? '',
  });
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

  settings.defaultSeo = {
    titleSuffix: body.titleSuffix ?? settings.defaultSeo?.titleSuffix ?? '',
    defaultDescription: body.defaultDescription ?? settings.defaultSeo?.defaultDescription ?? '',
    defaultOgImage: body.defaultOgImage ?? settings.defaultSeo?.defaultOgImage ?? '',
  };
  await settings.save();

  return NextResponse.json(settings.defaultSeo);
}
