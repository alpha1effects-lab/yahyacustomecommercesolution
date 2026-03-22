'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cropper, { Area } from 'react-easy-crop';
import { Button } from '@/components/ui/Button';
import { slugify } from '@/lib/utils/blogUtils';
import type { BlogCategory, BlogPost, BlogTag } from '@/types';
import 'react-quill-new/dist/quill.snow.css';
let dividerRegistered = false;
const CropperComponent = Cropper as unknown as React.FC<any>;
const CREATE_CATEGORY_VALUE = '__create__';

type CropState = {
  src: string;
  aspect: number;
  onComplete: (blob: Blob) => Promise<void> | void;
};

type BlogEditorProps = {
  postId?: string;
};

export const BlogEditor: React.FC<BlogEditorProps> = ({ postId }) => {
  const router = useRouter();
  const quillRef = useRef<any>(null);
  const quillContainerRef = useRef<HTMLDivElement | null>(null);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isSlugEdited, setIsSlugEdited] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [error, setError] = useState('');
  const [cropState, setCropState] = useState<CropState | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [form, setForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: '',
    tags: [] as string[],
    featuredImage: '',
    metaTitle: '',
    metaDescription: '',
    ogImage: '',
    status: 'draft' as BlogPost['status'],
  });
  const contentRef = useRef('');

  const fetchData = useCallback(async () => {
    const [categoriesRes, tagsRes] = await Promise.all([
      fetch('/api/admin/blog/categories'),
      fetch('/api/admin/blog/tags'),
    ]);

    if (categoriesRes.ok) setCategories(await categoriesRes.json());
    if (tagsRes.ok) setTags(await tagsRes.json());
  }, []);

  const fetchPost = useCallback(async () => {
    if (!postId) return;
    const res = await fetch(`/api/admin/blog/posts/${postId}`);
    if (!res.ok) return;
    const data: BlogPost = await res.json();
    setForm({
      title: data.title || '',
      slug: data.slug || '',
      excerpt: data.excerpt || '',
      content: data.content || '',
      category: typeof data.category === 'string' ? data.category : data.category?._id || '',
      tags: (data.tags || []).map((tag) => (typeof tag === 'string' ? tag : tag._id)),
      featuredImage: data.featuredImage || '',
      metaTitle: data.metaTitle || '',
      metaDescription: data.metaDescription || '',
      ogImage: data.ogImage || '',
      status: data.status || 'draft',
    });
  }, [postId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  useEffect(() => {
    contentRef.current = form.content || '';
  }, [form.content]);

  

  const updateField = (key: keyof typeof form, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleTitleChange = (value: string) => {
    updateField('title', value);
    if (!isSlugEdited) {
      updateField('slug', slugify(value));
    }
  };

  const handleSave = async (status: BlogPost['status']) => {
    setError('');
    if (!form.title.trim()) {
      setError('Title is required.');
      return;
    }
    if (status === 'published' && !form.content.trim()) {
      setError('Content is required to publish.');
      return;
    }
    if (status === 'published' && !form.category) {
      setError('Category is required to publish.');
      return;
    }

    let selectedCategory = form.category;
    if (selectedCategory === CREATE_CATEGORY_VALUE) {
      const name = newCategoryName.trim();
      if (!name) {
        setError('Category name is required.');
        return;
      }
      setIsCreatingCategory(true);
      const createRes = await fetch('/api/admin/blog/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      setIsCreatingCategory(false);
      if (!createRes.ok) {
        const data = await createRes.json();
        setError(data?.error || 'Failed to create category.');
        return;
      }
      const created = await createRes.json();
      setCategories((prev) => [...prev, created]);
      setNewCategoryName('');
      selectedCategory = created._id;
    }

    setIsSaving(true);
    const payload = { ...form, status, category: selectedCategory };

    const res = await fetch(postId ? `/api/admin/blog/posts/${postId}` : '/api/admin/blog/posts', {
      method: postId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data?.error || 'Failed to save.');
      setIsSaving(false);
      return;
    }

    router.push('/admin/blog');
  };

  const handleCreateTag = async () => {
    const name = tagInput.trim();
    if (!name) return;
    const res = await fetch('/api/admin/blog/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      const created = await res.json();
      setTags((prev) => [...prev, created]);
      setForm((prev) => ({ ...prev, tags: [...prev.tags, created._id] }));
      setTagInput('');
    }
  };

  const handleToggleTag = (tagId: string) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tagId) ? prev.tags.filter((id) => id !== tagId) : [...prev.tags, tagId],
    }));
  };

  const openCropper = (src: string, aspect: number, onComplete: (blob: Blob) => Promise<void> | void) => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setCropState({ src, aspect, onComplete });
  };

  const handleSelectImage = async (file: File, aspect: number, onComplete: (blob: Blob) => Promise<void> | void) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        openCropper(reader.result, aspect, onComplete);
      }
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async (blob: Blob) => {
    const file = new File([blob], `blog-${Date.now()}.jpg`, { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/admin/blog/upload', { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Upload failed');
    const data = await res.json();
    return data.url as string;
  };

  const handleFeaturedImage = async (file: File) => {
    await handleSelectImage(file, 16 / 9, async (blob) => {
      const url = await uploadImage(blob);
      updateField('featuredImage', url);
    });
  };

  const handleOgImage = async (file: File) => {
    await handleSelectImage(file, 1.91 / 1, async (blob) => {
      const url = await uploadImage(blob);
      updateField('ogImage', url);
    });
  };

  const handleInsertImage = async (file: File) => {
    await handleSelectImage(file, 4 / 3, async (blob) => {
      const url = await uploadImage(blob);
      const editor = quillRef.current?.getEditor();
      if (!editor) return;
      const range = editor.getSelection(true);
      const index = range ? range.index : editor.getLength();
      editor.insertEmbed(index, 'image', url, 'user');
      editor.setSelection(index + 1, 0, 'silent');
    });
  };


  const quillModules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          [{ align: [] }],
          ['blockquote', 'code-block'],
          ['link', 'image'],
          ['divider'],
          ['undo', 'redo'],
          ['clean'],
        ],
        handlers: {
          image: () => {
            const input = document.createElement('input');
            input.setAttribute('type', 'file');
            input.setAttribute('accept', 'image/*');
            input.onchange = () => {
              const file = input.files?.[0];
              if (file) handleInsertImage(file);
            };
            input.click();
          },
          divider: () => {
            const editor = quillRef.current?.getEditor();
            if (!editor) return;
            const range = editor.getSelection(true);
            const index = range ? range.index : editor.getLength();
            editor.insertEmbed(index, 'divider', true, 'user');
          },
          undo: () => {
            const editor = quillRef.current?.getEditor();
            editor?.history.undo();
          },
          redo: () => {
            const editor = quillRef.current?.getEditor();
            editor?.history.redo();
          },
        },
      },
      history: {
        delay: 1000,
        maxStack: 100,
        userOnly: true,
      },
    }),
    []
  );

  const quillFormats = useMemo(
    () => [
      'header',
      'bold',
      'italic',
      'underline',
      'list',
      'link',
      'image',
      'blockquote',
      'code-block',
      'align',
      'divider',
    ],
    []
  );
  useEffect(() => {
    let isMounted = true;

    const initQuill = async () => {
      if (!quillContainerRef.current) return;
      // @ts-ignore
      const quillModule = await import('quill');
      const Quill = (quillModule as any).default || quillModule;

      if (!dividerRegistered) {
        dividerRegistered = true;
        const BlockEmbed = Quill.import('blots/block/embed');
        class DividerBlot extends BlockEmbed {
          static blotName = 'divider';
          static tagName = 'hr';
        }
        Quill.register(DividerBlot);
      }

      if (!isMounted) return;
      const quill = new Quill(quillContainerRef.current, {
        theme: 'snow',
        modules: quillModules,
        formats: quillFormats,
      });
      quillRef.current = quill;
      if (contentRef.current) {
        quill.root.innerHTML = contentRef.current;
      }
      quill.on('text-change', () => {
        const html = quill.root.innerHTML;
        updateField('content', html);
      });
    };

    initQuill();

    return () => {
      isMounted = false;
      quillRef.current = null;
      if (quillContainerRef.current) {
        // 1. Remove the toolbar Quill injected BEFORE the container
        const toolbar = quillContainerRef.current.previousSibling;
        if (toolbar && (toolbar as Element).classList?.contains('ql-toolbar')) {
          toolbar.parentNode?.removeChild(toolbar);
        }
        
        // 2. Reset the container itself
        quillContainerRef.current.innerHTML = '';
        quillContainerRef.current.className = ''; // Strips leftover Quill classes
      }
    };
  }, [quillModules, quillFormats]);

  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) return;
    const current = quill.root.innerHTML || '';
    if (form.content !== current) {
      quill.root.innerHTML = form.content || '';
    }
  }, [form.content]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-widest">{postId ? 'Edit Post' : 'New Post'}</h1>
          <p className="text-sm text-text-secondary">Keep it simple and publish when ready.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => handleSave('draft')} disabled={isSaving}>
            Save Draft
          </Button>
          <Button onClick={() => handleSave('published')} disabled={isSaving}>
            Publish
          </Button>
        </div>
      </div>

      {error && <div className="mb-6 text-sm text-red-600">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <label className="text-xs uppercase tracking-widest text-text-secondary">
              Title <span className="text-red-600">*</span>
            </label>
            <input
              className="w-full border border-gray-300 p-3 mt-2"
              value={form.title}
              onChange={(event) => handleTitleChange(event.target.value)}
              placeholder="Post title"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-widest text-text-secondary">
              Slug <span className="text-red-600">*</span>
            </label>
            <input
              className="w-full border border-gray-300 p-3 mt-2"
              value={form.slug}
              onChange={(event) => {
                setIsSlugEdited(true);
                updateField('slug', event.target.value);
              }}
              placeholder="post-title"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-widest text-text-secondary">Excerpt</label>
            <textarea
              className="w-full border border-gray-300 p-3 mt-2 min-h-[120px]"
              value={form.excerpt}
              onChange={(event) => updateField('excerpt', event.target.value)}
              placeholder="Short summary"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-widest text-text-secondary">
              Content <span className="text-red-600">*</span>
            </label>
            <div className="mt-2 grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div>
                <div ref={quillContainerRef} />
              </div>
              <div className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-black min-h-[300px]">
                <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-800 text-[11px] font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400">
                  Live Preview
                </div>
                <div className="p-4 text-sm text-black dark:text-white max-h-[600px] overflow-y-auto rich-text">
                  {form.content.trim() ? (
                    <div dangerouslySetInnerHTML={{ __html: form.content }} />
                  ) : (
                    <p className="text-text-secondary dark:text-gray-500">Content preview will appear here as you type.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-xs uppercase tracking-widest text-text-secondary">
              Category <span className="text-red-600">*</span>
            </label>
            <select
              className="w-full border border-gray-300 p-3 mt-2"
              value={form.category}
              onChange={(event) => updateField('category', event.target.value)}
            >
              <option value="">Select category</option>
              <option value={CREATE_CATEGORY_VALUE}>Create new</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
            {form.category === CREATE_CATEGORY_VALUE && (
              <div className="mt-3 border border-gray-200 p-3">
                <label className="text-xs uppercase tracking-widest text-text-secondary">
                  New Category Name <span className="text-red-600">*</span>
                </label>
                <div className="mt-2 flex gap-2">
                  <input
                    className="flex-1 border border-gray-300 p-2"
                    value={newCategoryName}
                    onChange={(event) => setNewCategoryName(event.target.value)}
                    placeholder="Category name"
                  />
                  <Button
                    variant="outline"
                    onClick={async () => {
                      if (!newCategoryName.trim()) return;
                      setError('');
                      setIsCreatingCategory(true);
                      const res = await fetch('/api/admin/blog/categories', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: newCategoryName.trim() }),
                      });
                      setIsCreatingCategory(false);
                      if (!res.ok) {
                        const data = await res.json();
                        setError(data?.error || 'Failed to create category.');
                        return;
                      }
                      const created = await res.json();
                      setCategories((prev) => [...prev, created]);
                      updateField('category', created._id);
                      setNewCategoryName('');
                    }}
                    disabled={isCreatingCategory}
                  >
                    {isCreatingCategory ? 'Creating...' : 'Create'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs uppercase tracking-widest text-text-secondary">Tags</label>
            <div className="mt-2 space-y-2">
              <div className="flex gap-2">
                <input
                  className="flex-1 border border-gray-300 p-2"
                  value={tagInput}
                  onChange={(event) => setTagInput(event.target.value)}
                  placeholder="Add tag"
                />
                <Button variant="outline" onClick={handleCreateTag}>
                  Add
                </Button>
              </div>
              <div className="space-y-2">
                {tags.map((tag) => (
                  <label key={tag._id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.tags.includes(tag._id)}
                      onChange={() => handleToggleTag(tag._id)}
                    />
                    <span>{tag.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-widest text-text-secondary">Featured Image</label>
            <input
              type="file"
              accept="image/*"
              className="mt-2"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) handleFeaturedImage(file);
              }}
            />
            {form.featuredImage && (
              <img src={form.featuredImage} alt="Featured" className="mt-4 w-full h-48 object-cover" />
            )}
          </div>

          <div>
            <label className="text-xs uppercase tracking-widest text-text-secondary">SEO Meta Title</label>
            <input
              className="w-full border border-gray-300 p-3 mt-2"
              value={form.metaTitle}
              onChange={(event) => updateField('metaTitle', event.target.value)}
              placeholder="Meta title"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-widest text-text-secondary">SEO Meta Description</label>
            <textarea
              className="w-full border border-gray-300 p-3 mt-2 min-h-[120px]"
              value={form.metaDescription}
              onChange={(event) => updateField('metaDescription', event.target.value)}
              placeholder="Meta description"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-widest text-text-secondary">Open Graph Image</label>
            <input
              type="file"
              accept="image/*"
              className="mt-2"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) handleOgImage(file);
              }}
            />
            {form.ogImage && (
              <img src={form.ogImage} alt="Open Graph" className="mt-4 w-full h-40 object-cover" />
            )}
          </div>
        </div>
      </div>

      {cropState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
          <div className="bg-white p-6 max-w-3xl w-full">
            <div className="relative w-full h-[420px] bg-black">
              <CropperComponent
                image={cropState.src}
                crop={crop}
                zoom={zoom}
                aspect={cropState.aspect}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_: Area, croppedPixels: Area) => setCroppedAreaPixels(croppedPixels)}
              />
            </div>
            <div className="flex items-center justify-between mt-4">
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCropState(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    if (!croppedAreaPixels) return;
                    const blob = await getCroppedImg(cropState.src, croppedAreaPixels);
                    await cropState.onComplete(blob);
                    setCropState(null);
                  }}
                >
                  Use Image
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

const getCroppedImg = async (imageSrc: string, pixelCrop: { width: number; height: number; x: number; y: number }) => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to crop image'));
        return;
      }
      resolve(blob);
    }, 'image/jpeg');
  });
};
