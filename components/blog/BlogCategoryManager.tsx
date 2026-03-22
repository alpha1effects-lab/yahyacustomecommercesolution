'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import type { BlogCategory } from '@/types';

export const BlogCategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [form, setForm] = useState({ name: '', slug: '', description: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchCategories = async () => {
    const res = await fetch('/api/admin/blog/categories');
    if (res.ok) setCategories(await res.json());
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const resetForm = () => {
    setForm({ name: '', slug: '', description: '' });
    setEditingId(null);
  };

  const handleSave = async () => {
    setError('');
    if (!form.name.trim()) {
      setError('Name is required.');
      return;
    }

    const payload = { ...form };
    const res = await fetch(editingId ? `/api/admin/blog/categories/${editingId}` : '/api/admin/blog/categories', {
      method: editingId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data?.error || 'Failed to save.');
      return;
    }

    resetForm();
    fetchCategories();
  };

  const handleEdit = (category: BlogCategory) => {
    setEditingId(category._id);
    setForm({
      name: category.name || '',
      slug: category.slug || '',
      description: category.description || '',
    });
  };

  const handleDelete = async (categoryId: string) => {
    if (!window.confirm('Delete this category?')) return;
    await fetch(`/api/admin/blog/categories/${categoryId}`, { method: 'DELETE' });
    fetchCategories();
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-widest">Blog Categories</h1>
          <p className="text-sm text-text-secondary">Organize blog posts by category.</p>
        </div>
        <Link href="/admin/blog">
          <Button variant="outline">Back to Blog</Button>
        </Link>
      </div>

      {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

      <div className="border border-gray-200 p-6 mb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs uppercase tracking-widest text-text-secondary">Name</label>
            <input
              className="w-full border border-gray-300 p-3 mt-2"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-text-secondary">Slug</label>
            <input
              className="w-full border border-gray-300 p-3 mt-2"
              value={form.slug}
              onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))}
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="text-xs uppercase tracking-widest text-text-secondary">Description</label>
          <textarea
            className="w-full border border-gray-300 p-3 mt-2 min-h-[120px]"
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
          />
        </div>
        <div className="flex gap-3 mt-4">
          <Button onClick={handleSave}>{editingId ? 'Update' : 'Create'}</Button>
          {editingId && (
            <Button variant="outline" onClick={resetForm}>
              Cancel
            </Button>
          )}
        </div>
      </div>

      <div className="border border-gray-200">
        <div className="grid grid-cols-3 gap-4 p-4 text-xs uppercase tracking-widest text-text-secondary border-b border-gray-200">
          <span>Name</span>
          <span>Slug</span>
          <span>Actions</span>
        </div>
        {categories.map((category) => (
          <div key={category._id} className="grid grid-cols-3 gap-4 p-4 border-b border-gray-100 text-sm">
            <span>{category.name}</span>
            <span>{category.slug}</span>
            <div className="flex gap-3">
              <button className="underline" onClick={() => handleEdit(category)}>
                Edit
              </button>
              <button className="text-red-600" onClick={() => handleDelete(category._id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
