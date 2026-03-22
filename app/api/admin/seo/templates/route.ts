import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import SiteSettings from '@/lib/models/siteSettings';

async function getAdminSession() {
  const session = await auth();
  if (!session || (session.user as any)?.role !== 'admin') return null;
  return session;
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const settings = await SiteSettings.findOne().lean();
  return NextResponse.json({
    product: settings?.seoTemplates?.product ?? '{{name}} | Buy Online in Pakistan',
    category: settings?.seoTemplates?.category ?? '{{name}} — Shop the Best Collection',
    brand: settings?.seoTemplates?.brand ?? '{{name}} — Official Store',
    blog: settings?.seoTemplates?.blog ?? '{{title}} — Blog',
  });
}

export async function PUT(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const body = await request.json();

  let settings = await SiteSettings.findOne();
  if (!settings) settings = new SiteSettings({});

  settings.seoTemplates = {
    product: body.product ?? settings.seoTemplates?.product ?? '',
    category: body.category ?? settings.seoTemplates?.category ?? '',
    brand: body.brand ?? settings.seoTemplates?.brand ?? '',
    blog: body.blog ?? settings.seoTemplates?.blog ?? '',
  };

  await settings.save();
  return NextResponse.json(settings.seoTemplates);
}
