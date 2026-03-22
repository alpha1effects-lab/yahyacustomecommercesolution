import type { Product } from '@/types';

export type ProductFilterOptions = {
  query?: string;
  brandId?: string;
  categoryId?: string;
  status?: 'all' | 'published' | 'draft';
};

export const normalizeSearchQuery = (value: string) => value.trim().toLowerCase();

const getProductSearchTokens = (product: Product) => {
  const tokens: string[] = [];
  if (product.name) tokens.push(product.name);
  if (product.sku) tokens.push(product.sku);
  if (product.brand?.name) tokens.push(product.brand.name);
  if (product.category?.name) tokens.push(product.category.name);
  if (product.categories?.length) {
    product.categories.forEach(category => {
      if (category?.name) tokens.push(category.name);
    });
  }
  return tokens.join(' ').toLowerCase();
};

export const productMatchesQuery = (product: Product, query: string) => {
  const normalized = normalizeSearchQuery(query);
  if (!normalized) return true;
  return getProductSearchTokens(product).includes(normalized);
};

export const filterProductsByQuery = (products: Product[], query: string) => {
  const normalized = normalizeSearchQuery(query);
  if (!normalized) return products;
  return products.filter(product => productMatchesQuery(product, normalized));
};

export const filterProductsForAdmin = (products: Product[], options: ProductFilterOptions) => {
  const { query = '', brandId = '', categoryId = '', status = 'all' } = options;
  return products.filter(product => {
    if (query && !productMatchesQuery(product, query)) return false;
    if (brandId && product.brand?._id !== brandId) return false;
    if (categoryId) {
      const primaryMatch = product.category?._id === categoryId;
      const extraMatch = product.categories?.some(category => category._id === categoryId) || false;
      if (!primaryMatch && !extraMatch) return false;
    }
    if (status === 'published' && !product.isPublished) return false;
    if (status === 'draft' && product.isPublished) return false;
    return true;
  });
};

export const getProductSearchSuggestions = (products: Product[], query: string, limit = 6) => {
  const normalized = normalizeSearchQuery(query);
  if (!normalized) return [] as string[];

  const suggestions = new Set<string>();
  const consider = (value?: string | null) => {
    if (!value) return;
    const trimmed = value.trim();
    if (!trimmed) return;
    const lower = trimmed.toLowerCase();
    if (lower.includes(normalized) || normalized.includes(lower)) {
      suggestions.add(trimmed);
    }
  };

  products.forEach(product => {
    consider(product.name);
    consider(product.brand?.name || undefined);
    consider(product.category?.name || undefined);
    product.categories?.forEach(category => consider(category?.name));
  });

  return Array.from(suggestions).slice(0, limit);
};

export const generateSkuFromName = (name: string) => {
  const base = name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 14);
  const stamp = Date.now().toString().slice(-6);
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `${base || 'SKU'}-${stamp}${rand}`;
};

export const slugifyProductName = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
