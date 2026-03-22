'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { X, Upload, Trash2, Loader2 } from 'lucide-react';
import { Button } from './ui/Button';
import { Brand, Category, Product } from '@/types';
import { generateSkuFromName } from '@/lib/utils/productUtils';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(
  () => import('react-quill-new'),
  { ssr: false }
);
const QuillEditor = ReactQuill as unknown as React.FC<any>;

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: Record<string, unknown>) => void;
  initialData?: Product | null;
  categories: Category[];
  brands: Brand[];
  onCategoryCreated?: () => void;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  categories,
  brands,
  onCategoryCreated,
}) => {
  const quillModules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, 4, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ align: [] }],
        ['blockquote'],
        ['link', 'image'],
        ['clean'],
      ],
    }),
    []
  );

  const quillFormats = useMemo(
    () => ['header', 'bold', 'italic', 'underline', 'strike', 'list', 'bullet', 'link', 'image', 'blockquote', 'align'],
    []
  );

  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    price: '',
    originalPrice: '',
    description: '',
    stock: '',
    categoryId: '',
    brandId: '',
    isNewOffer: false,
    isBestOffer: false,
    isFeatured: false,
    carouselImage: '',
  });

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [localCategories, setLocalCategories] = useState<Category[]>(categories);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategorySlug, setNewCategorySlug] = useState('');
  const [isSkuManual, setIsSkuManual] = useState(false);

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [imageAlts, setImageAlts] = useState<string[]>([]);
  const [carouselImage, setCarouselImage] = useState('');
  const [carouselPreview, setCarouselPreview] = useState('');
  const [carouselUploading, setCarouselUploading] = useState(false);
  const [submitMode, setSubmitMode] = useState<'publish' | 'draft'>('publish');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    if (initialData) {
      const initialCategories = initialData.categories?.map(category => category._id) || [];
      const primaryCategory = initialData.category?._id ? [initialData.category._id] : [];
      const combinedCategories = Array.from(new Set([...primaryCategory, ...initialCategories]));

      setFormData({
        sku: initialData.sku || '',
        name: initialData.name || '',
        price: initialData.price?.toString() || '',
        originalPrice: initialData.originalPrice != null ? initialData.originalPrice.toString() : '',
        description: initialData.description || '',
        stock: initialData.stock?.toString() || '0',
        categoryId: initialData.category?._id || '',
        brandId: initialData.brand?._id || '',
        isNewOffer: !!initialData.isNewOffer,
        isBestOffer: !!initialData.isBestOffer,
        isFeatured: !!initialData.isFeatured,
        carouselImage: initialData.carouselImage || '',
      });
      setSelectedCategoryIds(combinedCategories);
      setExistingImages(initialData.images || []);
      setImageAlts(initialData.imageAlts || []);
      setCarouselImage(initialData.carouselImage || '');
      setCarouselPreview(initialData.carouselImage || '');
      setSubmitMode(initialData.isPublished === false ? 'draft' : 'publish');
      setIsSkuManual(true);
    } else {
      setFormData({
        sku: '',
        name: '',
        price: '',
        originalPrice: '',
        description: '',
        stock: '',
        categoryId: '',
        brandId: '',
        isNewOffer: false,
        isBestOffer: false,
        isFeatured: false,
        carouselImage: '',
      });
      setSelectedCategoryIds([]);
      setExistingImages([]);
      setImageAlts([]);
      setCarouselImage('');
      setCarouselPreview('');
      setSubmitMode('publish');
      setIsSkuManual(false);
    }
    setImageFiles([]);
    setImagePreviews([]);
    setUploadError('');
  }, [initialData, isOpen]);

  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'sku') {
      setIsSkuManual(value.trim().length > 0);
    }
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'name' && !isSkuManual) {
        updated.sku = generateSkuFromName(value);
      }
      return updated;
    });
    if (name === 'categoryId' && value) {
      setSelectedCategoryIds(prev => (prev.includes(value) ? prev : [...prev, value]));
    }
  };

  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalImages = existingImages.length + imageFiles.length + files.length;

    if (totalImages > 7) {
      setUploadError('Maximum 7 images allowed');
      return;
    }

    for (const file of files) {
      if (file.size > 2 * 1024 * 1024) {
        setUploadError(`${file.name} exceeds 2MB limit`);
        return;
      }
      if (!file.type.startsWith('image/')) {
        setUploadError(`${file.name} is not a valid image`);
        return;
      }
    }

    setUploadError('');
    setImageFiles(prev => [...prev, ...files]);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleCarouselImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setUploadError(`${file.name} exceeds 2MB limit`);
      return;
    }
    if (!file.type.startsWith('image/')) {
      setUploadError(`${file.name} is not a valid image`);
      return;
    }
    setUploadError('');
    setCarouselUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('images', file);
      const response = await fetch('/api/upload', { method: 'POST', body: uploadFormData });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }
      const result = await response.json();
      const imageUrl = result.images?.[0] || '';
      setCarouselImage(imageUrl);
      setCarouselPreview(imageUrl);
      setFormData(prev => ({ ...prev, carouselImage: imageUrl }));
    } catch (error: any) {
      setUploadError(error.message || 'Failed to upload carousel image');
    } finally {
      setCarouselUploading(false);
      e.currentTarget.value = '';
    }
  };

  const removeNewImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
    setImageAlts(prev => prev.filter((_, i) => i !== index));
  };

  const toggleCategoryId = (categoryId: string) => {
    setSelectedCategoryIds(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleCreateCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    const slug = (newCategorySlug.trim() || name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const response = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, slug }),
    });

    if (response.ok) {
      const created = await response.json();
      setLocalCategories(prev => [...prev, created]);
      setFormData(prev => ({ ...prev, categoryId: created._id }));
      setSelectedCategoryIds(prev => (prev.includes(created._id) ? prev : [...prev, created._id]));
      setNewCategoryName('');
      setNewCategorySlug('');
      onCategoryCreated?.();
    }
  };

  const handleSubmit = async (e: React.SyntheticEvent, mode: 'publish' | 'draft') => {
    e.preventDefault();

    if (mode === 'publish') {
      if (!formData.name.trim()) {
        setUploadError('Product name is required');
        return;
      }

      if (!formData.categoryId) {
        setUploadError('Please select a category');
        return;
      }

      if (existingImages.length === 0 && imageFiles.length === 0) {
        setUploadError('At least one image is required');
        return;
      }
    }

    setUploading(true);
    setSubmitMode(mode);
    setUploadError('');

    try {
      let uploadedImages: string[] = [...existingImages];
      const baseName = formData.name.trim();
      const slug = initialData?.slug || (
        baseName
          ? baseName
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/(^-|-$)/g, '') + '-' + Date.now()
          : undefined
      );
      const categoriesPayload = selectedCategoryIds.length > 0
        ? selectedCategoryIds
        : formData.categoryId
          ? [formData.categoryId]
          : [];

      if (imageFiles.length > 0) {
        const uploadFormData = new FormData();
        imageFiles.forEach(file => uploadFormData.append('images', file));
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Upload failed');
        }

        const result = await response.json();
        uploadedImages = [...uploadedImages, ...(result.images || [])];
      }

      const productData: Record<string, unknown> = {
        sku: formData.sku.trim() || generateSkuFromName(formData.name),
        name: baseName || undefined,
        slug,
        price: formData.price ? parseFloat(formData.price) : undefined,
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
        description: formData.description || undefined,
        stock: formData.stock ? parseInt(formData.stock, 10) : 0,
        category: formData.categoryId || undefined,
        categories: categoriesPayload.length > 0 ? categoriesPayload : undefined,
        brand: formData.brandId || null,
        images: uploadedImages,
        imageAlts: imageAlts,
        isNewOffer: formData.isNewOffer,
        isBestOffer: formData.isBestOffer,
        isFeatured: formData.isFeatured,
        isActive: true,
        isPublished: mode === 'publish',
        carouselImage: carouselImage || uploadedImages[0] || '',
      };

      onSave(productData);
      onClose();
    } catch (error: any) {
      console.error('Submit error:', error);
      setUploadError(error.message || 'Failed to save product');
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-5xl bg-white dark:bg-neutral-900 shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold uppercase tracking-widest text-black dark:text-white">
            {initialData ? 'Edit Product' : 'Add Product'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-black dark:hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form className="max-h-[75vh] overflow-y-auto">
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400">Product Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white px-3 py-3 text-sm focus:border-black dark:focus:border-white outline-none"
                placeholder="e.g. Hand-thrown Ceramic Mug"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400">SKU</label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white px-3 py-3 text-sm focus:border-black dark:focus:border-white outline-none"
                placeholder="e.g. ART-0001"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400">Price (PKR)</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white px-3 py-3 text-sm focus:border-black dark:focus:border-white outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400">Original Price (PKR)</label>
              <input
                type="number"
                name="originalPrice"
                value={formData.originalPrice}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white px-3 py-3 text-sm focus:border-black dark:focus:border-white outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400">Stock</label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white px-3 py-3 text-sm focus:border-black dark:focus:border-white outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400">Category</label>
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white px-3 py-3 text-sm focus:border-black dark:focus:border-white outline-none"
              >
                <option value="">Select a category</option>
                {localCategories.map(category => (
                  <option key={category._id} value={category._id}>{category.name}</option>
                ))}
              </select>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white px-3 py-2 text-xs"
                  placeholder="New category name"
                />
                <input
                  type="text"
                  value={newCategorySlug}
                  onChange={(e) => setNewCategorySlug(e.target.value)}
                  className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white px-3 py-2 text-xs"
                  placeholder="Slug (optional)"
                />
                <Button type="button" onClick={handleCreateCategory}>Add</Button>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400">Brand</label>
              <select
                name="brandId"
                value={formData.brandId}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white px-3 py-3 text-sm focus:border-black dark:focus:border-white outline-none"
              >
                <option value="">Unbranded</option>
                {brands.map(brand => (
                  <option key={brand._id} value={brand._id}>{brand.name}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400">Additional Categories</label>
              <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                {localCategories.map(category => (
                  <label key={`multi-${category._id}`} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedCategoryIds.includes(category._id)}
                      onChange={() => toggleCategoryId(category._id)}
                    />
                    <span>{category.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400">Carousel Image (optional)</label>
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-2 border border-dashed border-gray-300 dark:border-gray-700 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors">
                  <Upload size={16} />
                  <span className="text-sm">Upload carousel image</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleCarouselImageSelect} />
                </label>
                {carouselPreview && (
                  <div className="relative w-28 h-28 border border-gray-200 dark:border-gray-700">
                    <img src={carouselPreview} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setCarouselImage('');
                        setCarouselPreview('');
                        setFormData(prev => ({ ...prev, carouselImage: '' }));
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
                {carouselUploading && <p className="text-xs text-text-secondary">Uploading...</p>}
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400">Description</label>
              <div className="mt-2 grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white">
                  <QuillEditor
                    theme="snow"
                    value={formData.description}
                    onChange={(value: string) => setFormData(prev => ({ ...prev, description: value }))}
                    modules={quillModules}
                    formats={quillFormats}
                    placeholder="Write product details, specs, and highlights..."
                    className="bg-white dark:bg-black text-black dark:text-white"
                  />
                </div>
                <div className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-black min-h-[170px]">
                  <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-800 text-[11px] font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400">
                    Live Preview
                  </div>
                  <div className="p-3 text-sm text-black dark:text-white max-h-[280px] overflow-y-auto rich-text">
                    {formData.description.trim() ? (
                      <div dangerouslySetInnerHTML={{ __html: formData.description }} />
                    ) : (
                      <p className="text-text-secondary dark:text-gray-500">Description preview will appear here as you type.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 dark:border-gray-800 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-bold text-sm uppercase tracking-widest text-black dark:text-white">Media</h4>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400">Images (max 7)</label>
                <label className="flex items-center gap-2 border border-dashed border-gray-300 dark:border-gray-700 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors">
                  <Upload size={16} /> <span className="text-sm">Upload images</span>
                  <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageSelect} />
                </label>
                {uploadError && <p className="text-xs text-red-500 mt-2">{uploadError}</p>}
                <div className="flex flex-wrap gap-3 mt-3">
                  {existingImages.map((img, index) => (
                    <div key={`${img}-${index}`} className="relative w-20 h-20 border border-gray-200 dark:border-gray-700">
                      <img src={img} alt={imageAlts[index] || ''} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeExistingImage(index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><Trash2 size={12} /></button>
                    </div>
                  ))}
                  {imagePreviews.map((img, index) => (
                    <div key={`${img}-${index}`} className="relative w-20 h-20 border border-gray-200 dark:border-gray-700">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeNewImage(index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><Trash2 size={12} /></button>
                    </div>
                  ))}
                </div>
              </div>
              {/* Image Alt Texts */}
              {existingImages.length > 0 && (
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400">Image Alt Texts</label>
                  <div className="space-y-2 mt-2">
                    {existingImages.map((_, index) => (
                      <input
                        key={index}
                        className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-neutral-900 p-2 text-xs"
                        value={imageAlts[index] || ''}
                        onChange={(e) => {
                          const updated = [...imageAlts];
                          updated[index] = e.target.value;
                          setImageAlts(updated);
                        }}
                        placeholder={`Alt text for image ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-sm uppercase tracking-widest text-black dark:text-white">Flags</h4>
              <div className="space-y-3 text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="isNewOffer" checked={formData.isNewOffer} onChange={handleToggle} />
                  <span>New Offer</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="isBestOffer" checked={formData.isBestOffer} onChange={handleToggle} />
                  <span>Best Offer</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="isFeatured" checked={formData.isFeatured} onChange={handleToggle} />
                  <span>Featured</span>
                </label>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={uploading}
                onClick={(e) => handleSubmit(e, 'draft')}
              >
                {uploading && submitMode === 'draft' ? (
                  <><Loader2 size={16} className="animate-spin" /> Saving Draft...</>
                ) : 'Save as Draft'}
              </Button>
              <Button
                type="button"
                disabled={uploading}
                onClick={(e) => handleSubmit(e, 'publish')}
              >
                {uploading && submitMode === 'publish' ? (
                  <><Loader2 size={16} className="animate-spin" /> {initialData ? 'Saving...' : 'Publishing...'}</>
                ) : initialData ? 'Save' : 'Publish Product'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
