'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { SeoFieldsEditor } from '@/components/seo/SeoFieldsEditor';
import { Button } from '@/components/ui/Button';
import type { Product, Category, Brand, BlogPost, SeoFields, Redirect, PageSeoData } from '@/types';

type Tab = 'pages' | 'products' | 'categories' | 'brands' | 'blog' | 'redirects' | 'robots' | 'defaults' | 'templates';

/* ─── helpers ─── */
const seoStatus = (seo?: SeoFields) => {
  if (!seo) return 'empty';
  const hasTitle = !!seo.metaTitle;
  const hasDesc = !!seo.metaDescription;
  if (hasTitle && hasDesc) return 'complete';
  if (hasTitle || hasDesc) return 'partial';
  return 'empty';
};

const StatusDot: React.FC<{ status: string }> = ({ status }) => (
  <span
    className={`inline-block w-2 h-2 rounded-full ${
      status === 'complete'
        ? 'bg-green-500'
        : status === 'partial'
        ? 'bg-yellow-500'
        : 'bg-red-400'
    }`}
  />
);

/* generate default JSON-LD for a product */
const productJsonLd = (p: Product) => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
  return JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: p.name,
      description: p.description || '',
      image: p.images?.length ? p.images[0] : undefined,
      sku: p.sku,
      brand:
        p.brand && typeof p.brand === 'object' && 'name' in p.brand
          ? { '@type': 'Brand', name: p.brand.name }
          : undefined,
      offers: {
        '@type': 'Offer',
        price: p.price,
        priceCurrency: 'PKR',
        availability:
          (p.stock ?? 0) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        url: siteUrl ? `${siteUrl}/product/${p.slug}` : undefined,
      },
    },
    null,
    2
  );
};

/* generate default JSON-LD for a blog post */
const blogJsonLd = (post: BlogPost) => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
  return JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: post.metaDescription || post.excerpt || '',
      image: post.featuredImage || undefined,
      datePublished: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
      dateModified: post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined,
      url: siteUrl ? `${siteUrl}/blog/${post.slug}` : undefined,
    },
    null,
    2
  );
};

/* ─── main component ─── */
export const SeoAdminPanel: React.FC = () => {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('pages');

  /* data */
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [redirects, setRedirects] = useState<Redirect[]>([]);
  const [robotsTxt, setRobotsTxt] = useState('');
  const [defaults, setDefaults] = useState({ titleSuffix: '', defaultDescription: '', defaultOgImage: '' });
  const [pages, setPages] = useState<PageSeoData[]>([]);
  const [templates, setTemplates] = useState({ product: '', category: '', brand: '', blog: '' });

  /* UI */
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editSeo, setEditSeo] = useState<SeoFields>({});
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  /* page SEO editing */
  const [editingPagePath, setEditingPagePath] = useState<string | null>(null);
  const [editPageSeo, setEditPageSeo] = useState<PageSeoData | null>(null);

  /* redirect form */
  const [redirectForm, setRedirectForm] = useState({ from: '', to: '', type: 301 as 301 | 302, note: '' });
  const [editingRedirectId, setEditingRedirectId] = useState<string | null>(null);

  /* auth guard */
  useEffect(() => {
    if (authStatus === 'unauthenticated') router.push('/admin/login');
  }, [authStatus, router]);

  /* fetch all */
  const fetchData = useCallback(async () => {
    const [pRes, cRes, bRes, blRes, rRes, robRes, defRes, pgRes, tplRes] = await Promise.all([
      fetch('/api/admin/products'),
      fetch('/api/admin/categories'),
      fetch('/api/admin/brands'),
      fetch('/api/admin/blog/posts'),
      fetch('/api/admin/seo/redirects'),
      fetch('/api/admin/seo/robots'),
      fetch('/api/admin/seo/defaults'),
      fetch('/api/admin/seo/pages'),
      fetch('/api/admin/seo/templates'),
    ]);
    if (pRes.ok) setProducts(await pRes.json());
    if (cRes.ok) setCategories(await cRes.json());
    if (bRes.ok) setBrands(await bRes.json());
    if (blRes.ok) setBlogPosts(await blRes.json());
    if (rRes.ok) setRedirects(await rRes.json());
    if (robRes.ok) {
      const d = await robRes.json();
      setRobotsTxt(d.robotsTxt || '');
    }
    if (defRes.ok) setDefaults(await defRes.json());
    if (pgRes.ok) setPages(await pgRes.json());
    if (tplRes.ok) setTemplates(await tplRes.json());
  }, []);

  useEffect(() => {
    if (authStatus === 'authenticated') fetchData();
  }, [authStatus, fetchData]);

  /* expand entity for SEO editing — ensure pre-population */
  const toggleExpand = (id: string, seo?: SeoFields) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    setEditSeo({
      metaTitle: seo?.metaTitle || '',
      metaDescription: seo?.metaDescription || '',
      metaKeywords: seo?.metaKeywords || '',
      canonicalUrl: seo?.canonicalUrl || '',
      ogTitle: seo?.ogTitle || '',
      ogDescription: seo?.ogDescription || '',
      ogImage: seo?.ogImage || '',
      ogType: seo?.ogType || 'website',
      robots: {
        index: seo?.robots?.index !== false,
        follow: seo?.robots?.follow !== false,
      },
      jsonLd: seo?.jsonLd || '',
    });
  };

  /* generic SEO save */
  const saveSeo = async (endpoint: string, id: string, entityData?: Record<string, unknown>) => {
    setSaving(true);
    const body = entityData ? { ...entityData, seo: editSeo } : { seo: editSeo };
    await fetch(`${endpoint}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setSaving(false);
    setExpandedId(null);
    fetchData();
  };

  /* save blog SEO (flat fields) */
  const saveBlogSeo = async (id: string) => {
    setSaving(true);
    const post = blogPosts.find((p) => p._id === id);
    await fetch(`/api/admin/blog/posts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: post?.title,
        slug: post?.slug,
        content: post?.content,
        excerpt: post?.excerpt,
        featuredImage: post?.featuredImage,
        status: post?.status,
        category: typeof post?.category === 'string' ? post.category : (post?.category as any)?._id,
        tags: (post?.tags || []).map((t) => (typeof t === 'string' ? t : (t as any)._id)),
        metaTitle: editSeo.metaTitle || '',
        metaDescription: editSeo.metaDescription || '',
        ogImage: editSeo.ogImage || '',
        canonicalUrl: editSeo.canonicalUrl || '',
        ogTitle: editSeo.ogTitle || '',
        ogDescription: editSeo.ogDescription || '',
        robots: editSeo.robots,
      }),
    });
    setSaving(false);
    setExpandedId(null);
    fetchData();
  };

  /* page SEO save */
  const savePageSeo = async () => {
    if (!editPageSeo) return;
    setSaving(true);
    await fetch('/api/admin/seo/pages', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editPageSeo),
    });
    setSaving(false);
    setEditingPagePath(null);
    setEditPageSeo(null);
    fetchData();
  };

  /* redirect CRUD */
  const saveRedirect = async () => {
    setSaving(true);
    if (editingRedirectId) {
      await fetch(`/api/admin/seo/redirects/${editingRedirectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(redirectForm),
      });
    } else {
      await fetch('/api/admin/seo/redirects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(redirectForm),
      });
    }
    setRedirectForm({ from: '', to: '', type: 301, note: '' });
    setEditingRedirectId(null);
    setSaving(false);
    fetchData();
  };

  const deleteRedirect = async (id: string) => {
    if (!window.confirm('Delete this redirect?')) return;
    await fetch(`/api/admin/seo/redirects/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const toggleRedirectActive = async (r: Redirect) => {
    await fetch(`/api/admin/seo/redirects/${r._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !r.isActive }),
    });
    fetchData();
  };

  /* save robots.txt */
  const saveRobots = async () => {
    setSaving(true);
    await fetch('/api/admin/seo/robots', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ robotsTxt }),
    });
    setSaving(false);
  };

  /* save defaults */
  const saveDefaults = async () => {
    setSaving(true);
    await fetch('/api/admin/seo/defaults', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(defaults),
    });
    setSaving(false);
  };

  /* save templates */
  const saveTemplates = async () => {
    setSaving(true);
    await fetch('/api/admin/seo/templates', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(templates),
    });
    setSaving(false);
  };

  if (authStatus === 'loading') {
    return <div className="flex items-center justify-center min-h-screen text-sm text-black">Loading…</div>;
  }
  if (!session || (session.user as any)?.role !== 'admin') return null;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'pages', label: 'Pages' },
    { key: 'products', label: 'Products' },
    { key: 'categories', label: 'Categories' },
    { key: 'brands', label: 'Brands' },
    { key: 'blog', label: 'Blog Posts' },
    { key: 'redirects', label: 'Redirects' },
    { key: 'robots', label: 'Robots.txt' },
    { key: 'defaults', label: 'Global Defaults' },
    { key: 'templates', label: 'SEO Templates' },
  ];

  /* filter helper */
  const q = search.trim().toLowerCase();
  const filterByName = <T extends { name?: string; slug?: string; title?: string }>(items: T[]) =>
    q
      ? items.filter(
          (i) =>
            (i.name || '').toLowerCase().includes(q) ||
            (i.slug || '').toLowerCase().includes(q) ||
            ('title' in i && (i.title || '').toLowerCase().includes(q))
        )
      : items;

  /* ─── entity table renderer ─── */
  const renderEntityTable = <T extends { _id: string; name?: string; slug?: string; title?: string; seo?: SeoFields }>(
    items: T[],
    apiBase: string,
    basePath: string,
    type: 'entity' | 'blog'
  ) => {
    const filtered = filterByName(items);
    return (
      <>
        <div className="mb-4">
          <input
            className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-neutral-900 p-2 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
          />
        </div>
        <div className="border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-[auto_1fr_1fr_80px] gap-4 p-3 text-xs uppercase tracking-widest text-black border-b border-gray-200 dark:border-gray-700">
            <span>SEO</span>
            <span>Name</span>
            <span>Slug</span>
            <span>Action</span>
          </div>
          {filtered.length === 0 && (
            <div className="p-6 text-center text-sm text-black">No items found.</div>
          )}
          {filtered.map((item) => {
            const entitySeo =
              type === 'blog'
                ? ({
                    metaTitle: (item as any).metaTitle || '',
                    metaDescription: (item as any).metaDescription || '',
                    ogImage: (item as any).ogImage || '',
                    canonicalUrl: (item as any).canonicalUrl || '',
                    ogTitle: (item as any).ogTitle || '',
                    ogDescription: (item as any).ogDescription || '',
                    robots: (item as any).robots,
                    jsonLd: (item as any).jsonLd || '',
                  } as SeoFields)
                : item.seo || {};
            const status = seoStatus(entitySeo);
            const isOpen = expandedId === item._id;

            /* compute default JSON-LD */
            let defaultJld = '';
            if (type === 'blog') {
              defaultJld = blogJsonLd(item as unknown as BlogPost);
            } else if (apiBase.includes('products')) {
              defaultJld = productJsonLd(item as unknown as Product);
            }

            return (
              <div key={item._id} className="border-b border-gray-100 dark:border-gray-800 last:border-b-0">
                <div className="grid grid-cols-[auto_1fr_1fr_80px] gap-4 p-3 items-center">
                  <StatusDot status={status} />
                  <span className="text-sm truncate">{item.name || item.title || '—'}</span>
                  <span className="text-xs text-black truncate">{item.slug || '—'}</span>
                  <button
                    className="text-xs underline text-blue-600 dark:text-blue-400"
                    onClick={() => toggleExpand(item._id, entitySeo)}
                  >
                    {isOpen ? 'Close' : 'Edit SEO'}
                  </button>
                </div>
                {isOpen && (
                  <div className="px-4 pb-4">
                    <SeoFieldsEditor
                      values={editSeo}
                      onChange={setEditSeo}
                      entityName={item.name || item.title}
                      entitySlug={item.slug}
                      basePath={basePath}
                      defaultJsonLd={defaultJld}
                    />
                    <div className="mt-4 flex gap-3">
                      <Button
                        onClick={() =>
                          type === 'blog'
                            ? saveBlogSeo(item._id)
                            : saveSeo(apiBase, item._id, type === 'entity' ? {} : undefined)
                        }
                        disabled={saving}
                      >
                        {saving ? 'Saving…' : 'Save SEO'}
                      </Button>
                      <Button variant="outline" onClick={() => setExpandedId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </>
    );
  };

  const inputCls = 'w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-neutral-900 p-2 text-sm';

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-widest">SEO Panel</h1>
          <p className="text-sm text-black">Manage SEO metadata, redirects, and indexing.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/dashboard">
            <Button variant="outline">← Dashboard</Button>
          </Link>
          <Button variant="outline" onClick={() => signOut({ callbackUrl: '/admin/login' })}>
            Log Out
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 dark:border-gray-700 pb-3">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setTab(t.key);
              setExpandedId(null);
              setEditingPagePath(null);
              setSearch('');
            }}
            className={`px-4 py-2 text-xs uppercase tracking-widest transition-colors ${
              tab === t.key
                ? 'bg-black text-white dark:bg-white dark:text-black'
                : 'bg-gray-100 dark:bg-neutral-800 text-black hover:bg-gray-200 dark:hover:bg-neutral-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── Pages Tab ─── */}
      {tab === 'pages' && (
        <div>
          <p className="text-sm text-black mb-4">
            Manage SEO for all static pages. Dynamic pages (products, blog posts, brands) are managed in their respective tabs.
          </p>
          <div className="border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-[auto_1fr_1fr_80px] gap-4 p-3 text-xs uppercase tracking-widest text-black border-b border-gray-200 dark:border-gray-700">
              <span>SEO</span>
              <span>Page</span>
              <span>Path</span>
              <span>Action</span>
            </div>
            {pages.map((page) => {
              const status = seoStatus({ metaTitle: page.metaTitle, metaDescription: page.metaDescription });
              const isOpen = editingPagePath === page.pagePath;
              return (
                <div key={page.pagePath} className="border-b border-gray-100 dark:border-gray-800 last:border-b-0">
                  <div className="grid grid-cols-[auto_1fr_1fr_80px] gap-4 p-3 items-center">
                    <StatusDot status={status} />
                    <span className="text-sm truncate">{page.displayName}</span>
                    <span className="text-xs text-black truncate">{page.pagePath}</span>
                    <button
                      className="text-xs underline text-blue-600 dark:text-blue-400"
                      onClick={() => {
                        if (isOpen) {
                          setEditingPagePath(null);
                          setEditPageSeo(null);
                        } else {
                          setEditingPagePath(page.pagePath);
                          setEditPageSeo({ ...page });
                        }
                      }}
                    >
                      {isOpen ? 'Close' : 'Edit SEO'}
                    </button>
                  </div>
                  {isOpen && editPageSeo && (
                    <div className="px-4 pb-4">
                      <SeoFieldsEditor
                        values={{
                          metaTitle: editPageSeo.metaTitle,
                          metaDescription: editPageSeo.metaDescription,
                          metaKeywords: editPageSeo.metaKeywords,
                          canonicalUrl: editPageSeo.canonicalUrl,
                          ogTitle: editPageSeo.ogTitle,
                          ogDescription: editPageSeo.ogDescription,
                          ogImage: editPageSeo.ogImage,
                          ogType: editPageSeo.ogType,
                          robots: editPageSeo.robots,
                          jsonLd: editPageSeo.jsonLd,
                        }}
                        onChange={(fields) => {
                          setEditPageSeo({
                            ...editPageSeo,
                            metaTitle: fields.metaTitle || '',
                            metaDescription: fields.metaDescription || '',
                            metaKeywords: fields.metaKeywords || '',
                            canonicalUrl: fields.canonicalUrl || '',
                            ogTitle: fields.ogTitle || '',
                            ogDescription: fields.ogDescription || '',
                            ogImage: fields.ogImage || '',
                            ogType: fields.ogType || 'website',
                            robots: {
                              index: fields.robots?.index !== false,
                              follow: fields.robots?.follow !== false,
                            },
                            jsonLd: fields.jsonLd || '',
                          });
                        }}
                        entityName={editPageSeo.displayName}
                        basePath=""
                        entitySlug={editPageSeo.pagePath === '/' ? '' : editPageSeo.pagePath}
                      />
                      <div className="mt-4 flex gap-3">
                        <Button onClick={savePageSeo} disabled={saving}>
                          {saving ? 'Saving…' : 'Save SEO'}
                        </Button>
                        <Button variant="outline" onClick={() => { setEditingPagePath(null); setEditPageSeo(null); }}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab Content */}
      {tab === 'products' && renderEntityTable(products, '/api/admin/products', '/product', 'entity')}
      {tab === 'categories' && renderEntityTable(categories, '/api/admin/categories', '/category', 'entity')}
      {tab === 'brands' && renderEntityTable(brands, '/api/admin/brands', '/brands', 'entity')}
      {tab === 'blog' && renderEntityTable(blogPosts as any, '/api/admin/blog/posts', '/blog', 'blog')}

      {/* Redirects */}
      {tab === 'redirects' && (
        <div className="space-y-6">
          {/* Add/Edit form */}
          <div className="border border-gray-200 dark:border-gray-700 p-4 space-y-3">
            <h3 className="text-xs uppercase tracking-widest text-black mb-2">
              {editingRedirectId ? 'Edit Redirect' : 'Add Redirect'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-neutral-900 p-2 text-sm"
                value={redirectForm.from}
                onChange={(e) => setRedirectForm({ ...redirectForm, from: e.target.value })}
                placeholder="/old-path"
              />
              <input
                className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-neutral-900 p-2 text-sm"
                value={redirectForm.to}
                onChange={(e) => setRedirectForm({ ...redirectForm, to: e.target.value })}
                placeholder="/new-path"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <select
                className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-neutral-900 p-2 text-sm"
                value={redirectForm.type}
                onChange={(e) => setRedirectForm({ ...redirectForm, type: Number(e.target.value) as 301 | 302 })}
              >
                <option value={301}>301 (Permanent)</option>
                <option value={302}>302 (Temporary)</option>
              </select>
              <input
                className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-neutral-900 p-2 text-sm"
                value={redirectForm.note}
                onChange={(e) => setRedirectForm({ ...redirectForm, note: e.target.value })}
                placeholder="Note (optional)"
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={saveRedirect} disabled={saving || !redirectForm.from || !redirectForm.to}>
                {saving ? 'Saving…' : editingRedirectId ? 'Update' : 'Add Redirect'}
              </Button>
              {editingRedirectId && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingRedirectId(null);
                    setRedirectForm({ from: '', to: '', type: 301, note: '' });
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>

          {/* Redirects list */}
          <div className="border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-[1fr_1fr_60px_60px_auto] gap-4 p-3 text-xs uppercase tracking-widest text-black border-b border-gray-200 dark:border-gray-700">
              <span>From</span>
              <span>To</span>
              <span>Type</span>
              <span>Active</span>
              <span>Actions</span>
            </div>
            {redirects.length === 0 && (
              <div className="p-6 text-center text-sm text-black">No redirects configured.</div>
            )}
            {redirects.map((r) => (
              <div
                key={r._id}
                className="grid grid-cols-[1fr_1fr_60px_60px_auto] gap-4 p-3 items-center border-b border-gray-100 dark:border-gray-800 last:border-b-0"
              >
                <span className="text-sm truncate">{r.from}</span>
                <span className="text-sm truncate">{r.to}</span>
                <span className="text-xs">{r.type}</span>
                <button onClick={() => toggleRedirectActive(r)} className="text-xs">
                  {r.isActive ? '✓' : '✗'}
                </button>
                <div className="flex gap-2">
                  <button
                    className="text-xs underline text-blue-600 dark:text-blue-400"
                    onClick={() => {
                      setEditingRedirectId(r._id);
                      setRedirectForm({ from: r.from, to: r.to, type: r.type, note: r.note || '' });
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="text-xs underline text-red-600 dark:text-red-400"
                    onClick={() => deleteRedirect(r._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Robots.txt */}
      {tab === 'robots' && (
        <div className="space-y-4">
          <p className="text-sm text-black">
            Edit the custom robots.txt content. Pre-populated with sensible defaults.
          </p>
          <textarea
            className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-neutral-900 p-3 text-sm font-mono resize-y"
            rows={12}
            value={robotsTxt}
            onChange={(e) => setRobotsTxt(e.target.value)}
            placeholder="Loading robots.txt…"
          />
          <Button onClick={saveRobots} disabled={saving}>
            {saving ? 'Saving…' : 'Save Robots.txt'}
          </Button>
        </div>
      )}

      {/* Global Defaults */}
      {tab === 'defaults' && (
        <div className="space-y-4 max-w-xl">
          <div>
            <label className="block text-xs uppercase tracking-widest text-black mb-1">
              Title Suffix
            </label>
            <input
              className={inputCls}
              value={defaults.titleSuffix}
              onChange={(e) => setDefaults({ ...defaults, titleSuffix: e.target.value })}
              placeholder="e.g. — My Store"
            />
            <p className="text-xs text-black mt-1">Appended to page titles, e.g. &quot;Product Name — My Store&quot;</p>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-black mb-1">
              Default Description
            </label>
            <textarea
              className={`${inputCls} resize-none`}
              rows={3}
              value={defaults.defaultDescription}
              onChange={(e) => setDefaults({ ...defaults, defaultDescription: e.target.value })}
              placeholder="Fallback meta description for pages without one set."
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-black mb-1">
              Default OG Image URL
            </label>
            <input
              className={inputCls}
              value={defaults.defaultOgImage}
              onChange={(e) => setDefaults({ ...defaults, defaultOgImage: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <Button onClick={saveDefaults} disabled={saving}>
            {saving ? 'Saving…' : 'Save Defaults'}
          </Button>
        </div>
      )}

      {/* SEO Templates */}
      {tab === 'templates' && (
        <div className="space-y-6 max-w-2xl">
          <div>
            <p className="text-sm text-black mb-4">
              Define title templates per entity type. Use placeholders like <code className="text-xs bg-gray-100 dark:bg-neutral-800 px-1 py-0.5 rounded">{'{{name}}'}</code>,{' '}
              <code className="text-xs bg-gray-100 dark:bg-neutral-800 px-1 py-0.5 rounded">{'{{title}}'}</code>,{' '}
              <code className="text-xs bg-gray-100 dark:bg-neutral-800 px-1 py-0.5 rounded">{'{{brand}}'}</code>,{' '}
              <code className="text-xs bg-gray-100 dark:bg-neutral-800 px-1 py-0.5 rounded">{'{{category}}'}</code>.
            </p>
            <p className="text-sm text-black mb-6">
              <strong>Priority:</strong> Per-page/entity SEO → Template-generated SEO → Global defaults (fallback).
            </p>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-black mb-1">
              Product Title Template
            </label>
            <input
              className={inputCls}
              value={templates.product}
              onChange={(e) => setTemplates({ ...templates, product: e.target.value })}
              placeholder="{{name}} | Buy Online in Pakistan"
            />
            <p className="text-xs text-black mt-1">
              Available: {'{{name}}'}, {'{{brand}}'}, {'{{category}}'}, {'{{price}}'}
            </p>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-black mb-1">
              Category Title Template
            </label>
            <input
              className={inputCls}
              value={templates.category}
              onChange={(e) => setTemplates({ ...templates, category: e.target.value })}
              placeholder="{{name}} — Shop the Best Collection"
            />
            <p className="text-xs text-black mt-1">Available: {'{{name}}'}</p>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-black mb-1">
              Brand Title Template
            </label>
            <input
              className={inputCls}
              value={templates.brand}
              onChange={(e) => setTemplates({ ...templates, brand: e.target.value })}
              placeholder="{{name}} — Official Store"
            />
            <p className="text-xs text-black mt-1">Available: {'{{name}}'}</p>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-black mb-1">
              Blog Title Template
            </label>
            <input
              className={inputCls}
              value={templates.blog}
              onChange={(e) => setTemplates({ ...templates, blog: e.target.value })}
              placeholder="{{title}} — Blog"
            />
            <p className="text-xs text-black mt-1">Available: {'{{title}}'}, {'{{category}}'}</p>
          </div>

          <Button onClick={saveTemplates} disabled={saving}>
            {saving ? 'Saving…' : 'Save Templates'}
          </Button>
        </div>
      )}
    </div>
  );
};
