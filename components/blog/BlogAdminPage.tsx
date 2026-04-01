'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import type { BlogPost } from '@/types';

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString();
};

export const BlogAdminPage: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchPosts = async () => {
    setIsLoading(true);
    const res = await fetch('/api/admin/blog/posts');
    if (res.ok) {
      setPosts(await res.json());
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const filteredPosts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return posts;
    return posts.filter((post) => {
      const title = post.title?.toLowerCase() || '';
      const slug = post.slug?.toLowerCase() || '';
      return title.includes(query) || slug.includes(query);
    });
  }, [posts, search]);

  const handleDelete = async (postId: string) => {
    if (!window.confirm('Delete this post?')) return;
    await fetch(`/api/admin/blog/posts/${postId}`, { method: 'DELETE' });
    fetchPosts();
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-widest">Blog</h1>
          <p className="text-sm text-black">Manage posts for the storefront blog.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/blog/categories">
            <Button variant="outline">Categories</Button>
          </Link>
          <Link href="/admin/blog/new">
            <Button>New Post</Button>
          </Link>
        </div>
      </div>

      <div className="mb-6">
        <input
          className="w-full border border-gray-300 p-3"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search posts"
        />
      </div>

      <div className="border border-gray-200">
        <div className="grid grid-cols-5 gap-4 p-4 text-xs uppercase tracking-widest text-black border-b border-gray-200">
          <span>Title</span>
          <span>Status</span>
          <span>Category</span>
          <span>Created</span>
          <span>Updated</span>
        </div>
        {isLoading && <div className="p-6 text-sm text-black">Loading...</div>}
        {!isLoading && filteredPosts.length === 0 && (
          <div className="p-6 text-sm text-black">No posts found.</div>
        )}
        {!isLoading &&
          filteredPosts.map((post) => {
            const category = typeof post.category === 'string' ? post.category : post.category?.name || '-';
            return (
              <div key={post._id} className="grid grid-cols-5 gap-4 p-4 border-b border-gray-100 text-sm">
                <div className="space-y-2">
                  <div className="font-medium">{post.title}</div>
                  <div className="flex gap-3 text-xs">
                    <Link href={`/admin/blog/edit/${post._id}`} className="underline">
                      Edit
                    </Link>
                    <button className="text-red-600" onClick={() => handleDelete(post._id)}>
                      Delete
                    </button>
                  </div>
                </div>
                <div className="uppercase text-xs tracking-widest">{post.status}</div>
                <div>{category}</div>
                <div>{formatDate(post.createdAt)}</div>
                <div>{formatDate(post.updatedAt)}</div>
              </div>
            );
          })}
      </div>
    </div>
  );
};
