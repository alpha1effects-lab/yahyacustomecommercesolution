import dbConnect from '@/lib/db';
import SiteSettings from '@/lib/models/siteSettings';

export interface SeoTemplates {
  product: string;
  category: string;
  brand: string;
  blog: string;
}

export interface DefaultSeo {
  titleSuffix: string;
  defaultDescription: string;
  defaultOgImage: string;
}

let cachedSettings: { templates: SeoTemplates; defaults: DefaultSeo } | null = null;
let cacheTime = 0;
const CACHE_TTL = 60_000; // 60s

export async function getSeoSettings() {
  const now = Date.now();
  if (cachedSettings && now - cacheTime < CACHE_TTL) return cachedSettings;

  await dbConnect();
  const settings = await SiteSettings.findOne().lean();
  cachedSettings = {
    templates: {
      product: settings?.seoTemplates?.product || '{{name}} | Buy Online in Pakistan',
      category: settings?.seoTemplates?.category || '{{name}} — Shop the Best Collection',
      brand: settings?.seoTemplates?.brand || '{{name}} — Official Store',
      blog: settings?.seoTemplates?.blog || '{{title}} — Blog',
    },
    defaults: {
      titleSuffix: settings?.defaultSeo?.titleSuffix || '',
      defaultDescription: settings?.defaultSeo?.defaultDescription || '',
      defaultOgImage: settings?.defaultSeo?.defaultOgImage || '',
    },
  };
  cacheTime = now;
  return cachedSettings;
}

/**
 * Apply a template string with placeholder substitution.
 * Supports {{name}}, {{title}}, {{brand}}, {{category}}, {{price}}.
 */
export function applyTemplate(template: string, vars: Record<string, string | number | undefined>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value ?? ''));
  }
  return result;
}

/**
 * Resolve title with priority: per-entity SEO > template > fallback name + suffix.
 */
export function resolveTitle(
  entitySeoTitle: string | undefined,
  template: string,
  templateVars: Record<string, string | number | undefined>,
  fallbackName: string,
  titleSuffix: string
): string {
  if (entitySeoTitle) return entitySeoTitle;
  if (template) return applyTemplate(template, templateVars);
  return fallbackName + titleSuffix;
}
