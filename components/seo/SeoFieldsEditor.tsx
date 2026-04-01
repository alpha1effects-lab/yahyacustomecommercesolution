'use client';

import React, { useRef, useState } from 'react';
import type { SeoFields } from '@/types';

interface SeoFieldsEditorProps {
  values: SeoFields;
  onChange: (fields: SeoFields) => void;
  entityName?: string;
  entitySlug?: string;
  basePath?: string;
  /** Pre-populated JSON-LD string for products / blog posts */
  defaultJsonLd?: string;
}

export const SeoFieldsEditor: React.FC<SeoFieldsEditorProps> = ({
  values,
  onChange,
  entityName,
  entitySlug,
  basePath,
  defaultJsonLd,
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const update = (key: keyof SeoFields, value: unknown) => {
    onChange({ ...values, [key]: value });
  };

  const updateRobots = (key: 'index' | 'follow', value: boolean) => {
    onChange({ ...values, robots: { ...values.robots, [key]: value } });
  };

  const metaTitleLen = (values.metaTitle || '').length;
  const metaDescLen = (values.metaDescription || '').length;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';

  const previewTitle = values.metaTitle || entityName || 'Page Title';
  const previewDesc = values.metaDescription || 'No description set';
  const previewUrl = values.canonicalUrl || (basePath && entitySlug ? `${siteUrl}${basePath}/${entitySlug}` : siteUrl);

  /* OG Image upload via /api/upload */
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('images', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (res.ok) {
        const data = await res.json();
        if (data.images?.[0]) {
          update('ogImage', data.images[0]);
        }
      }
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  /* Use default JSON-LD if no custom one is set */
  const effectiveJsonLd = values.jsonLd || defaultJsonLd || '';

  const inputCls = 'w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-neutral-900 p-2 text-sm';
  const labelCls = 'block text-xs uppercase tracking-widest text-black mb-1';

  return (
    <div className="space-y-6">
      {/* SERP Preview */}
      <div>
        <label className="block text-xs uppercase tracking-widest text-black mb-2">
          Google Search Preview
        </label>
        <div className="border border-gray-200 dark:border-gray-700 rounded p-4 bg-white dark:bg-neutral-900">
          <div className="text-[#1a0dab] dark:text-blue-400 text-lg leading-tight truncate">{previewTitle}</div>
          <div className="text-green-700 dark:text-green-400 text-xs mt-1 truncate">{previewUrl}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{previewDesc}</div>
        </div>
      </div>

      {/* Meta Title */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs uppercase tracking-widest text-black">Meta Title</label>
          <span className={`text-xs ${metaTitleLen > 70 ? 'text-red-500' : 'text-black'}`}>
            {metaTitleLen}/70
          </span>
        </div>
        <input
          className={inputCls}
          value={values.metaTitle || ''}
          onChange={(e) => update('metaTitle', e.target.value)}
          placeholder={entityName || 'Enter meta title'}
        />
      </div>

      {/* Meta Description */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs uppercase tracking-widest text-black">Meta Description</label>
          <span className={`text-xs ${metaDescLen > 160 ? 'text-red-500' : 'text-black'}`}>
            {metaDescLen}/160
          </span>
        </div>
        <textarea
          className={`${inputCls} resize-none`}
          rows={3}
          value={values.metaDescription || ''}
          onChange={(e) => update('metaDescription', e.target.value)}
          placeholder="Enter meta description"
        />
      </div>

      {/* Meta Keywords */}
      <div>
        <label className={labelCls}>Meta Keywords</label>
        <input
          className={inputCls}
          value={values.metaKeywords || ''}
          onChange={(e) => update('metaKeywords', e.target.value)}
          placeholder="keyword1, keyword2, keyword3"
        />
        <p className="text-xs text-black mt-1">Comma-separated keywords</p>
      </div>

      {/* Canonical URL */}
      <div>
        <label className={labelCls}>Canonical URL</label>
        <input
          className={inputCls}
          value={values.canonicalUrl || ''}
          onChange={(e) => update('canonicalUrl', e.target.value)}
          placeholder={previewUrl}
        />
      </div>

      {/* Robots */}
      <div>
        <label className="block text-xs uppercase tracking-widest text-black mb-2">Robots Directive</label>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={values.robots?.index !== false}
              onChange={(e) => updateRobots('index', e.target.checked)}
              className="accent-black dark:accent-white"
            />
            Allow indexing
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={values.robots?.follow !== false}
              onChange={(e) => updateRobots('follow', e.target.checked)}
              className="accent-black dark:accent-white"
            />
            Follow links
          </label>
        </div>
      </div>

      {/* OG Image with upload */}
      <div>
        <label className={labelCls}>OG Image (1200×630 recommended)</label>
        <div className="flex items-center gap-3">
          <input
            className={`${inputCls} flex-1`}
            value={values.ogImage || ''}
            onChange={(e) => update('ogImage', e.target.value)}
            placeholder="https://... or upload below"
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 text-xs uppercase tracking-widest border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors whitespace-nowrap"
          >
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
        </div>
        {values.ogImage && (
          <img
            src={values.ogImage}
            alt="OG preview"
            className="mt-2 max-h-32 object-contain border border-gray-200 dark:border-gray-700"
          />
        )}
      </div>

      {/* OG Type */}
      <div>
        <label className={labelCls}>OG Type</label>
        <select
          className={inputCls}
          value={values.ogType || 'website'}
          onChange={(e) => update('ogType', e.target.value)}
        >
          <option value="website">website</option>
          <option value="article">article</option>
          <option value="product">product</option>
        </select>
      </div>

      {/* OG Title */}
      <div>
        <label className={labelCls}>OG Title</label>
        <input
          className={inputCls}
          value={values.ogTitle || ''}
          onChange={(e) => update('ogTitle', e.target.value)}
          placeholder={values.metaTitle || entityName || 'Same as meta title'}
        />
      </div>

      {/* OG Description */}
      <div>
        <label className={labelCls}>OG Description</label>
        <textarea
          className={`${inputCls} resize-none`}
          rows={2}
          value={values.ogDescription || ''}
          onChange={(e) => update('ogDescription', e.target.value)}
          placeholder={values.metaDescription || 'Same as meta description'}
        />
      </div>

      {/* Advanced: Structured Data (JSON-LD) */}
      <div>
        <label className={labelCls}>Structured Data (JSON-LD)</label>
        <textarea
          className={`${inputCls} font-mono text-xs resize-y`}
          rows={8}
          value={effectiveJsonLd}
          onChange={(e) => update('jsonLd', e.target.value)}
          placeholder='{"@context": "https://schema.org", ...}'
        />
        <p className="text-xs text-black mt-1">
          Custom JSON-LD structured data. Leave empty to use auto-generated schema.
        </p>
      </div>
    </div>
  );
};
