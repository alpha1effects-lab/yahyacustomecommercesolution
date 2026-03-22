import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import PageSeo from '@/lib/models/pageSeo';

async function getAdminSession() {
  const session = await auth();
  if (!session || (session.user as any)?.role !== 'admin') return null;
  return session;
}

const STATIC_PAGES = [
  { pagePath: '/', displayName: 'Home Page' },
  { pagePath: '/shop', displayName: 'Shop' },
  { pagePath: '/accessories', displayName: 'Accessories' },
  { pagePath: '/brands', displayName: 'All Brands' },
  { pagePath: '/blog', displayName: 'Blog' },
  { pagePath: '/search', displayName: 'Search' },
  { pagePath: '/offers/new', displayName: 'New Offers' },
  { pagePath: '/offers/best', displayName: 'Best Offers' },
  { pagePath: '/offers/love', displayName: "Products You'll Love" },
  { pagePath: '/checkout', displayName: 'Checkout' },
  { pagePath: '/order-confirmation', displayName: 'Order Confirmation' },
  { pagePath: '/track', displayName: 'Track Order' },
  { pagePath: '/login', displayName: 'Login' },
];

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const saved = await PageSeo.find().lean();
  const savedMap = new Map(saved.map((s) => [s.pagePath, s]));

  // Merge static definitions with any saved data
  const pages = STATIC_PAGES.map((sp) => {
    const existing = savedMap.get(sp.pagePath);
    if (existing) return existing;
    return {
      pagePath: sp.pagePath,
      displayName: sp.displayName,
      metaTitle: '',
      metaDescription: '',
      metaKeywords: '',
      canonicalUrl: '',
      ogTitle: '',
      ogDescription: '',
      ogImage: '',
      ogType: 'website',
      robots: { index: true, follow: true },
      jsonLd: '',
    };
  });

  return NextResponse.json(pages);
}

export async function PUT(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const body = await request.json();

  if (!body.pagePath) {
    return NextResponse.json({ error: 'pagePath is required' }, { status: 400 });
  }

  // Validate pagePath is one of the known static pages
  const validPaths = STATIC_PAGES.map((p) => p.pagePath);
  if (!validPaths.includes(body.pagePath)) {
    return NextResponse.json({ error: 'Invalid page path' }, { status: 400 });
  }

  const result = await PageSeo.findOneAndUpdate(
    { pagePath: body.pagePath },
    {
      $set: {
        displayName: body.displayName || '',
        metaTitle: body.metaTitle || '',
        metaDescription: body.metaDescription || '',
        metaKeywords: body.metaKeywords || '',
        canonicalUrl: body.canonicalUrl || '',
        ogTitle: body.ogTitle || '',
        ogDescription: body.ogDescription || '',
        ogImage: body.ogImage || '',
        ogType: body.ogType || 'website',
        robots: body.robots || { index: true, follow: true },
        jsonLd: body.jsonLd || '',
      },
    },
    { upsert: true, new: true }
  );

  return NextResponse.json(result);
}
