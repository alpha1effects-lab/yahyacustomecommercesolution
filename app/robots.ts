import type { MetadataRoute } from 'next';
import dbConnect from '@/lib/db';
import SiteSettings from '@/lib/models/siteSettings';

export const dynamic = 'force-dynamic';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';

  await dbConnect();
  const settings = await SiteSettings.findOne().select('robotsTxt').lean();

  if (settings?.robotsTxt) {
    // Return as structured data parsed from custom content
    // Next.js will generate the robots.txt from this
    const lines = settings.robotsTxt.split('\n');
    const rules: { userAgent: string; allow?: string[]; disallow?: string[] }[] = [];
    let current: { userAgent: string; allow: string[]; disallow: string[] } | null = null;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.toLowerCase().startsWith('user-agent:')) {
        if (current) rules.push(current);
        current = { userAgent: trimmed.slice(11).trim(), allow: [], disallow: [] };
      } else if (current && trimmed.toLowerCase().startsWith('allow:')) {
        current.allow.push(trimmed.slice(6).trim());
      } else if (current && trimmed.toLowerCase().startsWith('disallow:')) {
        current.disallow.push(trimmed.slice(9).trim());
      }
    }
    if (current) rules.push(current);

    if (rules.length > 0) {
      return {
        rules: rules.map((r) => ({
          userAgent: r.userAgent,
          allow: r.allow && r.allow.length > 0 ? r.allow : undefined,
          disallow: r.disallow && r.disallow.length > 0 ? r.disallow : undefined,
        })),
        sitemap: `${siteUrl}/sitemap.xml`,
      };
    }
  }

  // Default robots.txt
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/seller/', '/checkout', '/order-confirmation', '/track'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
