import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface CachedRedirect {
  from: string;
  to: string;
  type: number;
}

let redirectCache: CachedRedirect[] = [];
let cacheTimestamp = 0;
const CACHE_TTL = 60_000; // 60 seconds

async function getRedirects(): Promise<CachedRedirect[]> {
  const now = Date.now();
  if (redirectCache.length > 0 && now - cacheTimestamp < CACHE_TTL) {
    return redirectCache;
  }

  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) return redirectCache;

    // Dynamic import to avoid bundling issues in edge runtime
    const mongoose = await import('mongoose');

    // Lightweight direct query — avoid importing full model in middleware
    if (mongoose.default.connection.readyState !== 1) {
      await mongoose.default.connect(mongoUri);
    }

    const collection = mongoose.default.connection.collection('redirects');
    const docs = await collection
      .find({ isActive: true }, { projection: { from: 1, to: 1, type: 1 } })
      .toArray();

    redirectCache = docs.map((d) => ({
      from: d.from as string,
      to: d.to as string,
      type: (d.type as number) || 301,
    }));
    cacheTimestamp = now;
  } catch {
    // If DB fails, use whatever's cached
  }

  return redirectCache;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const redirects = await getRedirects();
  const match = redirects.find((r) => r.from === pathname);

  if (match) {
    const url = request.nextUrl.clone();
    // Support both absolute and relative redirect targets
    if (match.to.startsWith('http')) {
      return NextResponse.redirect(match.to, { status: match.type });
    }
    url.pathname = match.to;
    return NextResponse.redirect(url, { status: match.type });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public files (images, etc.)
     * - API routes
     * - sitemap.xml, robots.txt
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$|api/|sitemap\\.xml|robots\\.txt).*)',
  ],
};
