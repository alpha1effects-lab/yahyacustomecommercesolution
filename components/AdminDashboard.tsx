'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { Product, SectionSettings, Category, Brand, Announcement, Newsletter, Order } from '@/types';
import { LogOut, Plus, Edit2, Trash2, ShieldCheck, Package, Layout, X, Tags, Megaphone, Mail, ClipboardList, Upload, Download, ChevronDown } from 'lucide-react';
import { Button } from './ui/Button';
import { AddProductModal } from '@/components/AddProductModal';
import { ProductSelectorModal } from './ProductSelectorModal';
import { signOut } from 'next-auth/react';
import { filterProductsForAdmin } from '@/lib/utils/productUtils';
import Cropper, { Area } from 'react-easy-crop';

const CropperComponent = Cropper as unknown as React.FC<any>;

type MegaMenuLink = { label: string; href: string; order?: number };
type MegaMenuColumn = { title: string; image?: string; links: MegaMenuLink[]; order?: number };
type MegaMenuItem = { label: string; href?: string; columns: MegaMenuColumn[]; order?: number };
type FooterLink = { label: string; href: string; order?: number };
type FooterColumn = {
  title: string;
  image?: string;
  description?: string;
  order?: number;
  links: FooterLink[];
  showNewsletterForm?: boolean;
  newsletterPlaceholder?: string;
  newsletterButtonLabel?: string;
};
type FooterConfig = {
  topLinks: FooterLink[];
  columns: FooterColumn[];
  socialLinks: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    tiktok?: string;
  };
};

type CropState = {
  src: string;
  aspect: number;
  onComplete: (blob: Blob) => Promise<void> | void;
};

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'brands' | 'orders' | 'announcements' | 'newsletters' | 'inventory' | 'mega-menu' | 'footer' | 'layout' | 'comments' | 'payment-methods' | 'whatsapp' | 'qa'>('products');
  const [adminReviews, setAdminReviews] = useState<any[]>([]);
  const [reviewStatusFilter, setReviewStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [editingReview, setEditingReview] = useState<any | null>(null);
  const [showCreateReview, setShowCreateReview] = useState(false);
  const [createReviewForm, setCreateReviewForm] = useState({ productId: '', rating: 5, comment: '', userName: '', userEmail: '' });
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [productBrandFilter, setProductBrandFilter] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('');
  const [productStatusFilter, setProductStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [productSelectorOpen, setProductSelectorOpen] = useState<{isOpen: boolean, section: 'newOffers' | 'bestOffers' | 'productsYouLove' | null}>({isOpen: false, section: null});
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [whatsappSaving, setWhatsappSaving] = useState(false);
  const [paymentMethodTexts, setPaymentMethodTexts] = useState<{ jazzcash: string; bankTransfer: string }>({ jazzcash: '', bankTransfer: '' });
  const [paymentMethodSaving, setPaymentMethodSaving] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

  const defaultSectionSettings: SectionSettings = {
    newOffers: { title: 'Browse New Offers', show: true },
    bestOffers: { title: 'Our Best Offers', show: true },
    productsYouLove: { title: "Products You'll Love", show: true },
  };

  const defaultFooter: FooterConfig = {
    topLinks: [
      { label: 'Search', href: '#', order: 0 },
      { label: 'About Us', href: '#', order: 1 },
      { label: 'Contact', href: '#', order: 2 },
      { label: 'Shipping Policy', href: '#', order: 3 },
      { label: 'Terms of Service', href: '#', order: 4 },
    ],
    columns: [
      {
        title: 'About',
        image: '',
        description: 'Your one-stop shop for premium art supplies and craft materials.',
        order: 0,
        links: [],
        showNewsletterForm: false,
      },
      {
        title: "Let's Talk",
        image: '',
        description: '',
        order: 1,
        links: [
          { label: 'hello@example.com', href: 'mailto:hello@example.com' },
          { label: '+1 (555) 000-0000', href: 'tel:+15550000000' },
          { label: 'Mon - Fri: 9am - 5pm EST', href: '#' },
        ],
        showNewsletterForm: false,
      },
      {
        title: 'Newsletter',
        image: '',
        description: 'Subscribe to receive updates, access to exclusive deals, and more.',
        order: 2,
        links: [],
        showNewsletterForm: true,
        newsletterPlaceholder: 'Enter your email',
        newsletterButtonLabel: '',
      },
    ],
    socialLinks: {
      instagram: '',
      facebook: '',
      twitter: '',
      tiktok: '',
    },
  };

  const [sectionSettings, setSectionSettings] = useState<SectionSettings>(defaultSectionSettings);
  const [sectionProducts, setSectionProducts] = useState<{ newOffers: Product[]; bestOffers: Product[]; productsYouLove: Product[] }>({
    newOffers: [],
    bestOffers: [],
    productsYouLove: [],
  });
  const [heroSlides, setHeroSlides] = useState<{ image: string; headline?: string; subheadline?: string; ctaLabel?: string; ctaLink?: string }[]>([]);
  const [heroSlideIntervalSeconds, setHeroSlideIntervalSeconds] = useState(6);
  const [megaMenu, setMegaMenu] = useState<MegaMenuItem[]>([]);
  const [isMegaMenuSaving, setIsMegaMenuSaving] = useState(false);
  const [footerConfig, setFooterConfig] = useState<FooterConfig>(defaultFooter);
  const [isFooterSaving, setIsFooterSaving] = useState(false);
  const [megaMenuPreviewIndex, setMegaMenuPreviewIndex] = useState(0);
  const [isHeroUploadBusy, setIsHeroUploadBusy] = useState(false);
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', slug: '', description: '', parentId: '' });
  const [isBrandFormOpen, setIsBrandFormOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [brandForm, setBrandForm] = useState({
    name: '',
    slug: '',
    description: '',
    logo: '',
  });
  const [brandLogoUploading, setBrandLogoUploading] = useState(false);
  const [brandSaveError, setBrandSaveError] = useState('');
  const [brandSaving, setBrandSaving] = useState(false);
  const [brandLogoCropState, setBrandLogoCropState] = useState<CropState | null>(null);
  const [brandLogoCrop, setBrandLogoCrop] = useState({ x: 0, y: 0 });
  const [brandLogoZoom, setBrandLogoZoom] = useState(1);
  const [brandLogoCroppedAreaPixels, setBrandLogoCroppedAreaPixels] = useState<Area | null>(null);
  const [announcementForm, setAnnouncementForm] = useState({ text: '', order: 0, isActive: true });
  const [announcementSaveState, setAnnouncementSaveState] = useState<Record<string, 'idle' | 'saving' | 'saved'>>({});
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterAddState, setNewsletterAddState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [orderEdits, setOrderEdits] = useState<Record<string, { status: string; trackingNumber: string; estimatedDelivery: string }>>({});
  const [orderUpdating, setOrderUpdating] = useState<Record<string, boolean>>({});
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [inventoryEdits, setInventoryEdits] = useState<Record<string, string>>({});
  const [inventorySaving, setInventorySaving] = useState<Record<string, boolean>>({});
  const [qaItems, setQaItems] = useState<any[]>([]);
  const [qaForm, setQaForm] = useState({ productId: '', question: '', answer: '' });
  const [qaEditing, setQaEditing] = useState<any | null>(null);
  const [qaSaving, setQaSaving] = useState(false);

  const orderedMegaMenu = useMemo(
    () => [...megaMenu].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [megaMenu]
  );

  const filteredProducts = useMemo(
    () => filterProductsForAdmin(products, {
      query: productSearch,
      brandId: productBrandFilter,
      categoryId: productCategoryFilter,
      status: productStatusFilter,
    }),
    [products, productSearch, productBrandFilter, productCategoryFilter, productStatusFilter]
  );

  const slugify = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  const fetchData = async () => {
    try {
      const [productsRes, settingsRes, categoriesRes, brandsRes, ordersRes, announcementsRes, newslettersRes, usersRes, qaRes] = await Promise.all([
        fetch('/api/admin/products'),
        fetch('/api/admin/settings'),
        fetch('/api/admin/categories'),
        fetch('/api/admin/brands'),
        fetch('/api/admin/orders'),
        fetch('/api/admin/announcements'),
        fetch('/api/admin/newsletters'),
        fetch('/api/admin/users'),
        fetch('/api/admin/qa'),
      ]);
      if (productsRes.ok) setProducts(await productsRes.json());
      if (categoriesRes.ok) setCategories(await categoriesRes.json());
      if (brandsRes.ok) setBrands(await brandsRes.json());
      if (ordersRes.ok) setOrders(await ordersRes.json());
      if (announcementsRes.ok) setAnnouncements(await announcementsRes.json());
      if (newslettersRes.ok) setNewsletters(await newslettersRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
      if (qaRes.ok) setQaItems(await qaRes.json());
      if (settingsRes.ok) {
        const settings = await settingsRes.json();
        if (settings.sections) setSectionSettings({ ...defaultSectionSettings, ...settings.sections });
        if (settings.heroSlides) setHeroSlides(settings.heroSlides);
        if (settings.heroSlideIntervalSeconds) setHeroSlideIntervalSeconds(settings.heroSlideIntervalSeconds);
        if (settings.megaMenu) setMegaMenu(settings.megaMenu);
        if (settings.footer) setFooterConfig({ ...defaultFooter, ...settings.footer });
        if (settings.newOffersProducts) setSectionProducts(prev => ({ ...prev, newOffers: settings.newOffersProducts }));
        if (settings.bestOffersProducts) setSectionProducts(prev => ({ ...prev, bestOffers: settings.bestOffersProducts }));
        if (settings.productsYouLoveProducts) setSectionProducts(prev => ({ ...prev, productsYouLove: settings.productsYouLoveProducts }));
        if (settings.whatsappNumber) setWhatsappNumber(settings.whatsappNumber);
        if (settings.paymentMethodTexts) setPaymentMethodTexts({ jazzcash: settings.paymentMethodTexts.jazzcash || '', bankTransfer: settings.paymentMethodTexts.bankTransfer || '' });
      }
    } catch {} finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);
  
  const fetchAdminReviews = async (status?: string) => {
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      const res = await fetch(`/api/admin/reviews?${params}`);
      if (res.ok) setAdminReviews(await res.json());
    } catch { /* silent */ }
  };

  useEffect(() => {
    if (activeTab === 'comments') fetchAdminReviews(reviewStatusFilter === 'all' ? undefined : reviewStatusFilter);
  }, [activeTab]);

  useEffect(() => {
    if (megaMenuPreviewIndex >= orderedMegaMenu.length) {
      setMegaMenuPreviewIndex(0);
    }
  }, [orderedMegaMenu.length, megaMenuPreviewIndex]);

  // Product Handlers
  const handleOpenEditProduct = (product: Product) => { setEditingProduct(product); setIsProductModalOpen(true); };
  const handleOpenAddProduct = () => { setEditingProduct(null); setIsProductModalOpen(true); };
  const handleDeleteProduct = async (product: Product) => {
    if (window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
      await fetch(`/api/admin/products/${product._id}`, { method: 'DELETE' });
      fetchData();
    }
  };
  const handleProductModalSave = async (productData: Record<string, unknown>) => {
    if (editingProduct) {
      await fetch(`/api/admin/products/${editingProduct._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });
    } else {
      await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });
    }
    setIsProductModalOpen(false);
    fetchData();
  };

  const resetCategoryForm = () => {
    setCategoryForm({ name: '', slug: '', description: '', parentId: '' });
    setEditingCategory(null);
  };

  const handleSaveCategory = async () => {
    const payload = {
      name: categoryForm.name.trim(),
      slug: categoryForm.slug.trim() || slugify(categoryForm.name),
      description: categoryForm.description,
      parent: categoryForm.parentId || null,
    };
    if (!payload.name) return;

    if (editingCategory) {
      await fetch(`/api/admin/categories/${editingCategory._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }

    resetCategoryForm();
    setIsCategoryFormOpen(false);
    fetchData();
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      parentId: category.parent || '',
    });
    setIsCategoryFormOpen(true);
  };

  const handleDeleteCategory = async (category: Category) => {
    if (!window.confirm(`Delete category "${category.name}"?`)) return;
    await fetch(`/api/admin/categories/${category._id}`, { method: 'DELETE' });
    fetchData();
  };

  const resetBrandForm = () => {
    setBrandForm({
      name: '',
      slug: '',
      description: '',
      logo: '',
    });
    setBrandSaveError('');
    setEditingBrand(null);
  };

  const handleSaveBrand = async () => {
    const payload = {
      name: brandForm.name.trim(),
      slug: brandForm.slug.trim() || slugify(brandForm.name),
      description: brandForm.description,
      logo: brandForm.logo,
    };
    if (!payload.name) {
      setBrandSaveError('Brand name is required.');
      return;
    }

    setBrandSaveError('');
    setBrandSaving(true);

    try {
      const response = editingBrand
        ? await fetch(`/api/admin/brands/${editingBrand._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/admin/brands', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to save brand.');
      }

      resetBrandForm();
      setIsBrandFormOpen(false);
      await fetchData();
    } catch (error: any) {
      setBrandSaveError(error.message || 'Failed to save brand.');
    } finally {
      setBrandSaving(false);
    }
  };

  const handleEditBrand = (brand: Brand) => {
    setEditingBrand(brand);
    setBrandForm({
      name: brand.name,
      slug: brand.slug,
      description: brand.description || '',
      logo: brand.logo || '',
    });
    setIsBrandFormOpen(true);
  };

  const handleDeleteBrand = async (brand: Brand) => {
    if (!window.confirm(`Delete brand "${brand.name}"?`)) return;
    await fetch(`/api/admin/brands/${brand._id}`, { method: 'DELETE' });
    fetchData();
  };

  const openBrandLogoCropper = (src: string, aspect: number, onComplete: (blob: Blob) => Promise<void> | void) => {
    setBrandLogoCrop({ x: 0, y: 0 });
    setBrandLogoZoom(1);
    setBrandLogoCroppedAreaPixels(null);
    setBrandLogoCropState({ src, aspect, onComplete });
  };

  const selectBrandLogo = async (file: File, aspect: number, onComplete: (blob: Blob) => Promise<void> | void) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        openBrandLogoCropper(reader.result, aspect, onComplete);
      }
    };
    reader.readAsDataURL(file);
  };

  const uploadBrandLogo = async (blob: Blob) => {
    const file = new File([blob], `brand-logo-${Date.now()}.jpg`, { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('images', file);
    const response = await fetch('/api/upload', { method: 'POST', body: formData });
    const data = await response.json();
    if (!response.ok || !data.images?.[0]) {
      throw new Error(data?.error || 'Brand logo upload failed');
    }
    return data.images[0] as string;
  };

  const handleBrandLogoFile = async (file: File) => {
    await selectBrandLogo(file, 1, async (blob) => {
      setBrandLogoUploading(true);
      try {
        const imageUrl = await uploadBrandLogo(blob);
        setBrandForm(prev => ({ ...prev, logo: imageUrl }));
      } catch (error) {
        console.error(error);
        window.alert('Failed to upload brand logo. Please try again.');
      } finally {
        setBrandLogoUploading(false);
      }
    });
  };

  const handleAddAnnouncement = async () => {
    if (!announcementForm.text.trim()) return;
    if (announcements.length >= 5) {
      window.alert('You can add up to 5 announcements.');
      return;
    }
    await fetch('/api/admin/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(announcementForm),
    });
    setAnnouncementForm({ text: '', order: 0, isActive: true });
    fetchData();
  };

  const handleUpdateAnnouncement = async (announcement: Announcement) => {
    setAnnouncementSaveState(prev => ({ ...prev, [announcement._id]: 'saving' }));
    const response = await fetch(`/api/admin/announcements/${announcement._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(announcement),
    });
    if (response.ok) {
      setAnnouncementSaveState(prev => ({ ...prev, [announcement._id]: 'saved' }));
      setTimeout(() => {
        setAnnouncementSaveState(prev => ({ ...prev, [announcement._id]: 'idle' }));
      }, 1500);
      fetchData();
    } else {
      setAnnouncementSaveState(prev => ({ ...prev, [announcement._id]: 'idle' }));
    }
  };

  const handleDeleteAnnouncement = async (announcement: Announcement) => {
    if (!window.confirm('Delete this announcement?')) return;
    await fetch(`/api/admin/announcements/${announcement._id}`, { method: 'DELETE' });
    fetchData();
  };

  const handleAddSubscriber = async () => {
    const email = newsletterEmail.trim();
    if (!email) return;
    setNewsletterAddState('saving');
    const response = await fetch('/api/admin/newsletters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (response.ok) {
      setNewsletterEmail('');
      setNewsletterAddState('saved');
      fetchData();
      setTimeout(() => setNewsletterAddState('idle'), 1500);
    } else {
      setNewsletterAddState('idle');
    }
  };

  const handleToggleSubscriber = async (subscriber: Newsletter) => {
    await fetch(`/api/admin/newsletters/${subscriber._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !subscriber.isActive }),
    });
    fetchData();
  };

  const handleDeleteSubscriber = async (subscriber: Newsletter) => {
    if (!window.confirm(`Delete subscriber ${subscriber.email}?`)) return;
    await fetch(`/api/admin/newsletters/${subscriber._id}`, { method: 'DELETE' });
    fetchData();
  };

  const exportCSV = (type: 'orders' | 'newsletters' | 'users') => {
    let csvContent = '';
    let filename = '';

    if (type === 'orders') {
      csvContent = 'Order Number,Customer Name,Email,Phone,Address,City,Postal Code,Total,Status,Payment Method,Date\n';
      orders.forEach(order => {
        csvContent += `"${order.orderNumber}","${order.customer.fullName}","${order.customer.email}","${order.customer.phone}","${(order.customer.address || '').replace(/"/g, '""')}","${order.customer.city}","${order.customer.postalCode || ''}","${order.total}","${order.status}","${order.paymentMethod || ''}","${new Date(order.createdAt).toLocaleDateString()}"\n`;
      });
      filename = 'orders.csv';
    } else if (type === 'newsletters') {
      csvContent = 'Email,Status,Source,Subscribed At\n';
      newsletters.forEach(sub => {
        csvContent += `"${sub.email}","${sub.isActive ? 'Active' : 'Inactive'}","${sub.source || 'website'}","${new Date(sub.subscribedAt || '').toLocaleDateString()}"\n`;
      });
      filename = 'newsletter-subscribers.csv';
    } else if (type === 'users') {
      csvContent = 'Name,Email,Provider,Created At\n';
      users.forEach(user => {
        csvContent += `"${user.name}","${user.email}","${user.provider || 'credentials'}","${new Date(user.createdAt).toLocaleDateString()}"\n`;
      });
      filename = 'signup-emails.csv';
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportOrderDetails = () => {
    let csvContent = 'Order Number,Product Name,Brand,Quantity\n';
    orders.forEach(order => {
      order.items.forEach(item => {
        const product = products.find(p => p._id === item.productId);
        const brandName = product?.brand ? brands.find(b => b._id === (typeof product.brand === 'string' ? product.brand : (product.brand as any)?._id))?.name || '' : '';
        csvContent += `"${order.orderNumber}","${item.name}","${brandName}","${item.quantity}"\n`;
      });
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'order-details.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSaveWhatsapp = async () => {
    setWhatsappSaving(true);
    try {
      await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsappNumber }),
      });
    } catch {} finally {
      setWhatsappSaving(false);
    }
  };

  const handleSavePaymentMethods = async () => {
    setPaymentMethodSaving(true);
    try {
      await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethodTexts }),
      });
    } catch {} finally {
      setPaymentMethodSaving(false);
    }
  };

  const handleOrderEditChange = (orderId: string, field: 'status' | 'trackingNumber' | 'estimatedDelivery', value: string) => {
    setOrderEdits(prev => ({
      ...prev,
      [orderId]: {
        status: prev[orderId]?.status || '',
        trackingNumber: prev[orderId]?.trackingNumber || '',
        estimatedDelivery: prev[orderId]?.estimatedDelivery || '',
        [field]: value,
      },
    }));
  };

  const handleUpdateOrder = async (order: Order) => {
    const edit = orderEdits[order._id] || { status: order.status, trackingNumber: order.trackingNumber || '', estimatedDelivery: order.estimatedDelivery || '' };
    setOrderUpdating(prev => ({ ...prev, [order._id]: true }));
    try {
      await fetch(`/api/admin/orders/${order._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: edit.status || order.status,
          trackingNumber: edit.trackingNumber,
          estimatedDelivery: edit.estimatedDelivery,
        }),
      });
      await fetchData();
    } finally {
      setOrderUpdating(prev => ({ ...prev, [order._id]: false }));
    }
  };

  // Section settings update
  const handleUpdateSectionSettings = async (key: keyof SectionSettings, settings: { title: string; show: boolean }) => {
    const updated = { ...sectionSettings, [key]: settings };
    setSectionSettings(updated);
    await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sections: updated }),
    });
  };

  const saveHeroSlides = async (slides: { image: string; headline?: string; subheadline?: string; ctaLabel?: string; ctaLink?: string }[]) => {
    setHeroSlides(slides);
    await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ heroSlides: slides }),
    });
  };

  const saveHeroInterval = async (value: number) => {
    setHeroSlideIntervalSeconds(value);
    await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ heroSlideIntervalSeconds: value }),
    });
  };

  const handleAddHeroSlide = () => {
    const updated = [
      ...heroSlides,
      { image: '', headline: '', subheadline: '', ctaLabel: '', ctaLink: '' },
    ];
    setHeroSlides(updated);
  };

  const handleRemoveHeroSlide = (index: number) => {
    const updated = heroSlides.filter((_, i) => i !== index);
    setHeroSlides(updated);
  };

  const handleUpdateHeroSlide = (index: number, field: 'image' | 'headline' | 'subheadline' | 'ctaLabel' | 'ctaLink', value: string) => {
    const updated = heroSlides.map((slide, i) => (i === index ? { ...slide, [field]: value } : slide));
    setHeroSlides(updated);
  };

  const handleHeroUpload = async (file: File) => {
    setIsHeroUploadBusy(true);
    try {
      const formData = new FormData();
      formData.append('images', file);
      const response = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await response.json();
      if (response.ok && data.images?.[0]) {
        const updated = [...heroSlides, { image: data.images[0], headline: '', subheadline: '', ctaLabel: '', ctaLink: '' }];
        await saveHeroSlides(updated);
      }
    } finally {
      setIsHeroUploadBusy(false);
    }
  };

  const updateMegaMenuItem = (index: number, updated: MegaMenuItem) => {
    setMegaMenu(prev => prev.map((item, i) => (i === index ? updated : item)));
  };

  const addMegaMenuItem = () => {
    setMegaMenu(prev => ([
      ...prev,
      { label: 'New', href: '', order: prev.length, columns: [{ title: '', image: '', order: 0, links: [{ label: 'Link', href: '/', order: 0 }] }] },
    ]));
  };

  const removeMegaMenuItem = (index: number) => {
    setMegaMenu(prev => prev.filter((_, i) => i !== index));
  };

  const addMegaMenuColumn = (itemIndex: number) => {
    setMegaMenu(prev => prev.map((item, i) => {
      if (i !== itemIndex) return item;
      return {
        ...item,
        columns: [...item.columns, { title: '', image: '', order: item.columns.length, links: [{ label: 'Link', href: '/', order: 0 }] }],
      };
    }));
  };

  const removeMegaMenuColumn = (itemIndex: number, columnIndex: number) => {
    setMegaMenu(prev => prev.map((item, i) => {
      if (i !== itemIndex) return item;
      return { ...item, columns: item.columns.filter((_, c) => c !== columnIndex) };
    }));
  };

  const addMegaMenuLink = (itemIndex: number, columnIndex: number) => {
    setMegaMenu(prev => prev.map((item, i) => {
      if (i !== itemIndex) return item;
      return {
        ...item,
        columns: item.columns.map((column, c) => {
          if (c !== columnIndex) return column;
          return { ...column, links: [...column.links, { label: 'Link', href: '/', order: column.links.length }] };
        }),
      };
    }));
  };

  const removeMegaMenuLink = (itemIndex: number, columnIndex: number, linkIndex: number) => {
    setMegaMenu(prev => prev.map((item, i) => {
      if (i !== itemIndex) return item;
      return {
        ...item,
        columns: item.columns.map((column, c) => {
          if (c !== columnIndex) return column;
          return { ...column, links: column.links.filter((_, l) => l !== linkIndex) };
        }),
      };
    }));
  };

  const uploadMegaMenuImage = async (itemIndex: number, columnIndex: number, file: File) => {
    const formData = new FormData();
    formData.append('images', file);
    const response = await fetch('/api/upload', { method: 'POST', body: formData });
    if (!response.ok) return;
    const data = await response.json();
    const imageUrl = data.images?.[0];
    if (!imageUrl) return;

    setMegaMenu(prev => prev.map((item, i) => {
      if (i !== itemIndex) return item;
      return {
        ...item,
        columns: item.columns.map((column, c) => {
          if (c !== columnIndex) return column;
          return { ...column, image: imageUrl };
        }),
      };
    }));
  };

  const saveMegaMenu = async () => {
    setIsMegaMenuSaving(true);
    await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ megaMenu }),
    });
    setIsMegaMenuSaving(false);
  };

  const updateFooterTopLink = (index: number, updated: FooterLink) => {
    setFooterConfig(prev => ({
      ...prev,
      topLinks: prev.topLinks.map((link, i) => (i === index ? updated : link)),
    }));
  };

  const addFooterTopLink = () => {
    setFooterConfig(prev => ({
      ...prev,
      topLinks: [...prev.topLinks, { label: 'New Link', href: '/', order: prev.topLinks.length }],
    }));
  };

  const removeFooterTopLink = (index: number) => {
    setFooterConfig(prev => ({
      ...prev,
      topLinks: prev.topLinks.filter((_, i) => i !== index),
    }));
  };

  const updateFooterColumn = (index: number, updated: FooterColumn) => {
    setFooterConfig(prev => ({
      ...prev,
      columns: prev.columns.map((column, i) => (i === index ? updated : column)),
    }));
  };

  const addFooterColumn = () => {
    setFooterConfig(prev => ({
      ...prev,
      columns: [
        ...prev.columns,
        { title: 'New Column', image: '', description: '', order: prev.columns.length, links: [], showNewsletterForm: false },
      ],
    }));
  };

  const removeFooterColumn = (index: number) => {
    setFooterConfig(prev => ({
      ...prev,
      columns: prev.columns.filter((_, i) => i !== index),
    }));
  };

  const addFooterColumnLink = (columnIndex: number) => {
    setFooterConfig(prev => ({
      ...prev,
      columns: prev.columns.map((column, i) =>
        i === columnIndex
          ? { ...column, links: [...column.links, { label: 'Link', href: '/' }] }
          : column
      ),
    }));
  };

  const removeFooterColumnLink = (columnIndex: number, linkIndex: number) => {
    setFooterConfig(prev => ({
      ...prev,
      columns: prev.columns.map((column, i) =>
        i === columnIndex
          ? { ...column, links: column.links.filter((_, idx) => idx !== linkIndex) }
          : column
      ),
    }));
  };

  const uploadFooterColumnImage = async (columnIndex: number, file: File) => {
    const formData = new FormData();
    formData.append('images', file);
    const response = await fetch('/api/upload', { method: 'POST', body: formData });
    if (!response.ok) return;
    const data = await response.json();
    const imageUrl = data.images?.[0];
    if (!imageUrl) return;

    setFooterConfig(prev => ({
      ...prev,
      columns: prev.columns.map((column, i) =>
        i === columnIndex ? { ...column, image: imageUrl } : column
      ),
    }));
  };

  const saveFooter = async () => {
    setIsFooterSaving(true);
    await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ footer: footerConfig }),
    });
    setIsFooterSaving(false);
  };

  const handleUpdateInventory = async (product: Product) => {
    const value = inventoryEdits[product._id];
    const stock = Number.isFinite(Number(value)) ? Number(value) : product.stock || 0;
    setInventorySaving(prev => ({ ...prev, [product._id]: true }));
    await fetch(`/api/admin/products/${product._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock }),
    });
    setInventorySaving(prev => ({ ...prev, [product._id]: false }));
    fetchData();
  };

  // Section Products
  const handleRemoveProductFromSection = async (section: 'newOffers' | 'bestOffers' | 'productsYouLove', productId: string) => {
    const currentList = sectionProducts[section];
    const updated = currentList.filter(p => p._id !== productId);
    setSectionProducts(prev => ({ ...prev, [section]: updated }));
    await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [`${section}ProductIds`]: updated.map(p => p._id) }),
    });
  };

  const handleAddProductToSection = async (product: Product) => {
    if (!productSelectorOpen.section) return;
    const section = productSelectorOpen.section;
    const currentList = sectionProducts[section];
    if (!currentList.find(p => p._id === product._id)) {
      const updated = [...currentList, product];
      setSectionProducts(prev => ({ ...prev, [section]: updated }));
      await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [`${section}ProductIds`]: updated.map(p => p._id) }),
      });
    }
    setProductSelectorOpen({ isOpen: false, section: null });
  };

  const renderLayoutSetting = (key: keyof SectionSettings, label: string) => {
    const setting = sectionSettings[key];
    const isProductSection = key === 'newOffers' || key === 'bestOffers' || key === 'productsYouLove';
    
    return (
      <div className="flex flex-col p-6 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h4 className="font-bold text-sm uppercase tracking-wide mb-1 text-black dark:text-white">{label}</h4>
            <p className="text-xs text-text-secondary dark:text-gray-400">Manage visibility, title{isProductSection ? ' and products' : ''}.</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <label className="text-[10px] uppercase font-bold text-gray-400 mb-1">Section Title</label>
              <input 
                type="text" 
                value={setting.title}
                onChange={(e) => handleUpdateSectionSettings(key, { ...setting, title: e.target.value })}
                className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white px-3 py-2 text-sm w-64 focus:border-black dark:focus:border-white outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handleUpdateSectionSettings(key, { ...setting, show: !setting.show })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${setting.show ? 'bg-black dark:bg-white' : 'bg-gray-200 dark:bg-gray-700'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white dark:bg-black transition ${setting.show ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
              <span className="text-sm font-medium text-black dark:text-white">{setting.show ? 'Visible' : 'Hidden'}</span>
            </div>
          </div>
        </div>

        {isProductSection && (
          <div className="bg-gray-50 dark:bg-neutral-800 p-4 border border-gray-100 dark:border-gray-700 rounded-sm">
            <div className="flex justify-between items-center mb-4">
              <h5 className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400">Curated Products</h5>
              <button 
                onClick={() => setProductSelectorOpen({ isOpen: true, section: key as 'newOffers' | 'bestOffers' | 'productsYouLove' })}
                className="text-xs flex items-center gap-1 font-bold text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <Plus size={14} /> Add Product
              </button>
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-2">
              {(sectionProducts[key as 'newOffers' | 'bestOffers' | 'productsYouLove'] || []).map(product => (
                <div key={product._id} className="relative w-24 flex-shrink-0 group">
                  <div className="w-24 h-24 bg-white dark:bg-neutral-700 border border-gray-200 dark:border-gray-600 mb-2 overflow-hidden">
                    <img src={product.images?.[0] || product.carouselImage || ''} alt={product.name} className="w-full h-full object-cover mix-blend-multiply" />
                  </div>
                  <p className="text-[10px] font-medium truncate text-black dark:text-white">{product.name}</p>
                  <button 
                    onClick={() => handleRemoveProductFromSection(key as 'newOffers' | 'bestOffers' | 'productsYouLove', product._id)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              {(sectionProducts[key as 'newOffers' | 'bestOffers' | 'productsYouLove'] || []).length === 0 && (
                <div className="w-full py-4 text-center text-xs text-text-secondary dark:text-gray-500 italic">
                  No products selected for this section.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-text-secondary">Loading admin panel...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-neutral-950 animate-fade-in pb-20">
      {/* Admin Header */}
      <div className="bg-black text-white border-b border-gray-800">
        <div className="max-w-[1440px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <NextImage
              src="/site-logo.svg"
              alt="Admin"
              width={120}
              height={30}
              className="h-8 w-auto invert"
              priority
            />
            <span className="text-xs text-gray-400 uppercase tracking-widest">Admin</span>
          </div>
          <button 
            onClick={() => signOut({ callbackUrl: '/admin/login' })}
            className="flex items-center gap-2 text-sm font-medium hover:text-red-400 transition-colors"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 py-10">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white dark:bg-neutral-900 p-6 shadow-sm border-l-4 border-black cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors" onClick={() => setActiveTab('products')}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400 mb-1">Total Products</p>
                <p className="text-3xl font-bold text-black dark:text-white">{products.length}</p>
              </div>
              <Package className="text-gray-300" size={24} />
            </div>
          </div>
          <div className="bg-white dark:bg-neutral-900 p-6 shadow-sm border-l-4 border-black cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors" onClick={() => setActiveTab('categories')}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400 mb-1">Categories</p>
                <p className="text-3xl font-bold text-black dark:text-white">{categories.length}</p>
              </div>
              <Tags className="text-gray-300" size={24} />
            </div>
          </div>
          <div className="bg-white dark:bg-neutral-900 p-6 shadow-sm border-l-4 border-black cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors" onClick={() => setActiveTab('brands')}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400 mb-1">Brands</p>
                <p className="text-3xl font-bold text-black dark:text-white">{brands.length}</p>
              </div>
              <Tags className="text-gray-300" size={24} />
            </div>
          </div>
          <div className="bg-white dark:bg-neutral-900 p-6 shadow-sm border-l-4 border-black cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors" onClick={() => setActiveTab('orders')}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400 mb-1">Orders</p>
                <p className="text-3xl font-bold text-black dark:text-white">{orders.length}</p>
              </div>
              <ClipboardList className="text-gray-300" size={24} />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-6 border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto">
          {([
            { key: 'products', label: 'Products' },
            { key: 'categories', label: 'Categories' },
            { key: 'brands', label: 'Brands' },
            { key: 'orders', label: 'Orders' },
            { key: 'announcements', label: 'Announcements' },
            { key: 'newsletters', label: 'Newsletters' },
            { key: 'inventory', label: 'Inventory' },
            { key: 'mega-menu', label: 'Mega Menu' },
            { key: 'footer', label: 'Footer' },
            { key: 'layout', label: 'Homepage Layout' },
            { key: 'comments', label: 'Comments' },
            { key: 'payment-methods', label: 'Payment Methods' },
            { key: 'whatsapp', label: 'WhatsApp' },
            { key: 'qa', label: 'Q&A' },
          ] as const).map(tab => (
            <React.Fragment key={tab.key}>
              <button
                onClick={() => setActiveTab(tab.key)}
                className={`pb-3 text-sm font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${activeTab === tab.key ? 'border-b-2 border-black dark:border-white text-black dark:text-white' : 'text-gray-400 hover:text-black dark:hover:text-white'}`}
              >
                {tab.label}
              </button>
              {tab.key === 'footer' && (
                <>
                  <Link
                    href="/admin/blog"
                    className="pb-3 text-sm font-bold uppercase tracking-widest transition-colors whitespace-nowrap text-gray-400 hover:text-black dark:hover:text-white"
                  >
                    Blog
                  </Link>
                  <Link
                    href="/admin/seo"
                    className="pb-3 text-sm font-bold uppercase tracking-widest transition-colors whitespace-nowrap text-gray-400 hover:text-black dark:hover:text-white"
                  >
                    SEO
                  </Link>
                </>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="bg-white dark:bg-neutral-900 shadow-sm border border-gray-200 dark:border-gray-800 animate-fade-in">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h2 className="text-xl font-bold tracking-tight text-black dark:text-white">Global Product Inventory</h2>
              <Button onClick={handleOpenAddProduct} className="flex items-center gap-2 py-3">
                <Plus size={16} /> Add Product
              </Button>
            </div>
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-neutral-800">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400">Search</label>
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white px-3 py-3 text-sm focus:border-black dark:focus:border-white outline-none"
                    placeholder="Search by name, SKU, brand, or category"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400">Brand</label>
                  <select
                    value={productBrandFilter}
                    onChange={(e) => setProductBrandFilter(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white px-3 py-3 text-sm focus:border-black dark:focus:border-white outline-none"
                  >
                    <option value="">All brands</option>
                    {brands.map(brand => (
                      <option key={brand._id} value={brand._id}>{brand.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400">Category</label>
                  <select
                    value={productCategoryFilter}
                    onChange={(e) => setProductCategoryFilter(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white px-3 py-3 text-sm focus:border-black dark:focus:border-white outline-none"
                  >
                    <option value="">All categories</option>
                    {categories.map(category => (
                      <option key={category._id} value={category._id}>{category.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400">Status</label>
                  <select
                    value={productStatusFilter}
                    onChange={(e) => setProductStatusFilter(e.target.value as 'all' | 'published' | 'draft')}
                    className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white px-3 py-3 text-sm focus:border-black dark:focus:border-white outline-none"
                  >
                    <option value="all">All</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-neutral-800 text-xs uppercase tracking-widest text-text-secondary dark:text-gray-400">
                    <th className="p-6 font-semibold border-b border-gray-100 dark:border-gray-800">Product</th>
                    <th className="p-6 font-semibold border-b border-gray-100 dark:border-gray-800">SKU</th>
                    <th className="p-6 font-semibold border-b border-gray-100 dark:border-gray-800">Brand</th>
                    <th className="p-6 font-semibold border-b border-gray-100 dark:border-gray-800">Price</th>
                    <th className="p-6 font-semibold border-b border-gray-100 dark:border-gray-800">Status</th>
                    <th className="p-6 font-semibold border-b border-gray-100 dark:border-gray-800 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filteredProducts.map(product => (
                    <tr key={product._id} className="hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors group">
                      <td className="p-6 border-b border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gray-100 dark:bg-neutral-700 flex-shrink-0">
                            <img src={product.images?.[0] || product.carouselImage || ''} alt="" className="w-full h-full object-cover mix-blend-multiply" />
                          </div>
                          <span className="font-medium text-black dark:text-white">{product.name}</span>
                        </div>
                      </td>
                      <td className="p-6 border-b border-gray-100 dark:border-gray-800 text-xs text-text-secondary dark:text-gray-400">
                        {product.sku}
                      </td>
                      <td className="p-6 border-b border-gray-100 dark:border-gray-800">
                        <span className="inline-block px-2 py-1 bg-gray-100 dark:bg-neutral-700 rounded text-xs font-bold uppercase tracking-wider text-black dark:text-white">{product.brand?.name || 'Unbranded'}</span>
                      </td>
                      <td className="p-6 border-b border-gray-100 dark:border-gray-800 font-medium text-black dark:text-white">PKR {product.price.toFixed(2)}</td>
                      <td className="p-6 border-b border-gray-100 dark:border-gray-800">
                        <span className={`text-xs font-bold uppercase tracking-wider ${product.isPublished ? 'text-emerald-600' : 'text-amber-500'}`}>
                          {product.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="p-6 border-b border-gray-100 dark:border-gray-800 text-right">
                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleOpenEditProduct(product)} className="text-gray-400 hover:text-black dark:hover:text-white transition-colors" title="Edit"><Edit2 size={16} /></button>
                          <button onClick={() => handleDeleteProduct(product)} className="text-gray-400 hover:text-red-600 transition-colors" title="Delete"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {products.length === 0 && (
              <div className="p-12 text-center text-text-secondary dark:text-gray-500"><p>No products available.</p></div>
            )}
            {products.length > 0 && filteredProducts.length === 0 && (
              <div className="p-12 text-center text-text-secondary dark:text-gray-500"><p>No products match these filters.</p></div>
            )}
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="bg-white dark:bg-neutral-900 shadow-sm border border-gray-200 dark:border-gray-800 animate-fade-in">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h2 className="text-xl font-bold tracking-tight text-black dark:text-white">Categories</h2>
              <Button
                onClick={() => {
                  resetCategoryForm();
                  setIsCategoryFormOpen(!isCategoryFormOpen);
                }}
                className="flex items-center gap-2 py-3"
              >
                <Plus size={16} /> Add Category
              </Button>
            </div>

            {isCategoryFormOpen && (
              <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-neutral-800">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400">Name</label>
                    <input
                      type="text"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400">Slug (optional)</label>
                    <input
                      type="text"
                      value={categoryForm.slug}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, slug: e.target.value }))}
                      className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400">Parent Category</label>
                    <select
                      value={categoryForm.parentId}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, parentId: e.target.value }))}
                      className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white px-3 py-2 text-sm"
                    >
                      <option value="">No parent</option>
                      {categories.map(category => (
                        <option key={category._id} value={category._id}>{category.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400">Description</label>
                    <textarea
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white px-3 py-2 text-sm min-h-[90px]"
                    />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <Button onClick={handleSaveCategory}>{editingCategory ? 'Update Category' : 'Create Category'}</Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      resetCategoryForm();
                      setIsCategoryFormOpen(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-neutral-800 text-xs uppercase tracking-widest text-text-secondary dark:text-gray-400">
                    <th className="p-6 font-semibold border-b border-gray-100 dark:border-gray-800">Name</th>
                    <th className="p-6 font-semibold border-b border-gray-100 dark:border-gray-800">Slug</th>
                    <th className="p-6 font-semibold border-b border-gray-100 dark:border-gray-800">Parent</th>
                    <th className="p-6 font-semibold border-b border-gray-100 dark:border-gray-800">Attributes</th>
                    <th className="p-6 font-semibold border-b border-gray-100 dark:border-gray-800 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {categories.map(category => {
                    const parent = categories.find(parentCategory => parentCategory._id === category.parent);
                    return (
                      <tr key={category._id} className="hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors">
                        <td className="p-6 border-b border-gray-100 dark:border-gray-800 font-medium text-black dark:text-white">{category.name}</td>
                        <td className="p-6 border-b border-gray-100 dark:border-gray-800"><span className="px-2 py-1 bg-gray-100 dark:bg-neutral-700 rounded text-xs">{category.slug}</span></td>
                        <td className="p-6 border-b border-gray-100 dark:border-gray-800 text-text-secondary dark:text-gray-400">{parent?.name || '-'}</td>
                        <td className="p-6 border-b border-gray-100 dark:border-gray-800 text-text-secondary dark:text-gray-400">{category.attributes?.length ? category.attributes.length : '-'}</td>
                        <td className="p-6 border-b border-gray-100 dark:border-gray-800 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button onClick={() => handleEditCategory(category)} className="text-gray-400 hover:text-black dark:hover:text-white transition-colors" title="Edit"><Edit2 size={16} /></button>
                            <button onClick={() => handleDeleteCategory(category)} className="text-gray-400 hover:text-red-600 transition-colors" title="Delete"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {categories.length === 0 && (
              <div className="p-12 text-center text-text-secondary dark:text-gray-500"><p>No categories found.</p></div>
            )}
          </div>
        )}

        {/* Brands Tab */}
        {activeTab === 'brands' && (
          <div className="bg-white dark:bg-neutral-900 shadow-sm border border-gray-200 dark:border-gray-800 animate-fade-in">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h2 className="text-xl font-bold tracking-tight text-black dark:text-white">Brands</h2>
              <Button
                onClick={() => {
                  resetBrandForm();
                  setIsBrandFormOpen(!isBrandFormOpen);
                }}
                className="flex items-center gap-2 py-3"
              >
                <Plus size={16} /> Add Brand
              </Button>
            </div>

            {isBrandFormOpen && (
              <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-neutral-800">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400">Brand Name</label>
                    <input
                      type="text"
                      value={brandForm.name}
                      onChange={(e) => setBrandForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400">Slug (optional)</label>
                    <input
                      type="text"
                      value={brandForm.slug}
                      onChange={(e) => setBrandForm(prev => ({ ...prev, slug: e.target.value }))}
                      className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400">Description</label>
                    <textarea
                      value={brandForm.description}
                      onChange={(e) => setBrandForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white px-3 py-2 text-sm min-h-[90px]"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400">Logo</label>
                    <input
                      type="text"
                      value={brandForm.logo}
                      onChange={(e) => setBrandForm(prev => ({ ...prev, logo: e.target.value }))}
                      className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white px-3 py-2 text-sm"
                      placeholder="Paste logo URL or upload below"
                    />
                    <label className="mt-3 flex items-center gap-2 border border-dashed border-gray-300 dark:border-gray-700 p-3 cursor-pointer hover:bg-white dark:hover:bg-neutral-900 transition-colors text-xs uppercase tracking-widest font-bold">
                      <Upload size={14} />
                      <span>{brandLogoUploading ? 'Uploading...' : 'Upload and crop logo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleBrandLogoFile(file);
                          e.currentTarget.value = '';
                        }}
                      />
                    </label>
                    {brandForm.logo && (
                      <div className="mt-3 w-24 h-24 border border-gray-200 dark:border-gray-700 bg-white dark:bg-black flex items-center justify-center p-2">
                        <img src={brandForm.logo} alt="Brand logo preview" className="max-w-full max-h-full object-contain" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <Button onClick={handleSaveBrand} disabled={brandSaving || brandLogoUploading}>
                    {brandSaving
                      ? (editingBrand ? 'Updating...' : 'Creating...')
                      : (editingBrand ? 'Update Brand' : 'Create Brand')}
                  </Button>
                  <Button
                    variant="outline"
                    disabled={brandSaving}
                    onClick={() => {
                      resetBrandForm();
                      setIsBrandFormOpen(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
                {brandSaveError && (
                  <p className="mt-3 text-sm text-red-500">{brandSaveError}</p>
                )}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-neutral-800 text-xs uppercase tracking-widest text-text-secondary dark:text-gray-400">
                    <th className="p-6 font-semibold border-b border-gray-100 dark:border-gray-800">Brand</th>
                    <th className="p-6 font-semibold border-b border-gray-100 dark:border-gray-800">Slug</th>
                    <th className="p-6 font-semibold border-b border-gray-100 dark:border-gray-800">Logo</th>
                    <th className="p-6 font-semibold border-b border-gray-100 dark:border-gray-800">Description</th>
                    <th className="p-6 font-semibold border-b border-gray-100 dark:border-gray-800 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {brands.map(brand => (
                    <tr key={brand._id} className="hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors">
                      <td className="p-6 border-b border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-3">
                          {brand.logo && <img src={brand.logo} alt="" className="w-8 h-8 object-contain" />}
                          <span className="font-medium text-black dark:text-white">{brand.name}</span>
                        </div>
                      </td>
                      <td className="p-6 border-b border-gray-100 dark:border-gray-800"><span className="px-2 py-1 bg-gray-100 dark:bg-neutral-700 rounded text-xs">{brand.slug}</span></td>
                      <td className="p-6 border-b border-gray-100 dark:border-gray-800">
                        {brand.logo ? (
                          <img src={brand.logo} alt={`${brand.name} logo`} className="w-10 h-10 object-contain" />
                        ) : (
                          <span className="text-xs text-text-secondary dark:text-gray-500">-</span>
                        )}
                      </td>
                      <td className="p-6 border-b border-gray-100 dark:border-gray-800 text-text-secondary dark:text-gray-400 max-w-[340px] truncate">{brand.description || '-'}</td>
                      <td className="p-6 border-b border-gray-100 dark:border-gray-800 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button onClick={() => handleEditBrand(brand)} className="text-gray-400 hover:text-black dark:hover:text-white transition-colors" title="Edit"><Edit2 size={16} /></button>
                          <button onClick={() => handleDeleteBrand(brand)} className="text-gray-400 hover:text-red-600 transition-colors" title="Delete"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {brands.length === 0 && (
              <div className="p-12 text-center text-text-secondary dark:text-gray-500"><p>No brands found.</p></div>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="bg-white dark:bg-neutral-900 shadow-sm border border-gray-200 dark:border-gray-800 animate-fade-in">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-xl font-bold tracking-tight text-black dark:text-white">Orders</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => exportCSV('orders')}
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest border border-gray-200 dark:border-gray-700 px-4 py-2 hover:border-black dark:hover:border-white transition-colors text-black dark:text-white"
                >
                  <Download size={14} /> Export Customer Data
                </button>
                <button
                  onClick={exportOrderDetails}
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest border border-gray-200 dark:border-gray-700 px-4 py-2 hover:border-black dark:hover:border-white transition-colors text-black dark:text-white"
                >
                  <Download size={14} /> Export Order Details
                </button>
              </div>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {orders.map(order => (
                <div key={order._id} className="animate-fade-in">
                  {/* Clickable order summary row */}
                  <div
                    className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
                    onClick={() => setExpandedOrders(prev => ({ ...prev, [order._id]: !prev[order._id] }))}
                  >
                    <div className="flex items-center gap-6 flex-wrap">
                      <div>
                        <div className="font-medium text-black dark:text-white text-sm">{order.orderNumber}</div>
                        <div className="text-xs text-text-secondary dark:text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</div>
                      </div>
                      <div>
                        <div className="font-medium text-black dark:text-white text-sm">{order.customer.fullName}</div>
                        <div className="text-xs text-text-secondary dark:text-gray-400">{order.customer.email}</div>
                      </div>
                      <div className="text-sm font-medium text-black dark:text-white">Rs. {order.total.toLocaleString()}</div>
                      <span className={`text-xs font-bold uppercase tracking-widest px-2 py-1 ${order.status === 'delivered' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : order.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>{order.status}</span>
                    </div>
                    <ChevronDown size={18} className={`text-gray-400 transition-transform ${expandedOrders[order._id] ? 'rotate-180' : ''}`} />
                  </div>

                  {/* Expanded order details */}
                  {expandedOrders[order._id] && (
                    <div className="px-6 pb-6 bg-gray-50 dark:bg-neutral-800/50 border-t border-gray-100 dark:border-gray-800">
                      {/* Order Items */}
                      <div className="mt-4 mb-4">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400 mb-2">Items</h4>
                        <div className="space-y-2">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3 text-sm">
                              {item.image && (
                                <img src={item.image} alt={item.name} className="w-10 h-10 object-cover border border-gray-200 dark:border-gray-700" />
                              )}
                              <div className="flex-grow">
                                <span className="font-medium text-black dark:text-white">{item.name}</span>
                                <span className="text-xs text-text-secondary dark:text-gray-400 ml-2">x{item.quantity}</span>
                              </div>
                              <span className="text-black dark:text-white">Rs. {item.total.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Customer Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400 mb-1">Customer Info</h4>
                          <p className="text-sm text-black dark:text-white">{order.customer.fullName}</p>
                          <p className="text-sm text-text-secondary dark:text-gray-400">{order.customer.email}</p>
                          <p className="text-sm text-text-secondary dark:text-gray-400">{order.customer.phone}</p>
                          {order.customer.phone2 && <p className="text-sm text-text-secondary dark:text-gray-400">{order.customer.phone2}</p>}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400 mb-1">Shipping Address</h4>
                          <p className="text-sm text-black dark:text-white">{order.customer.address}</p>
                          <p className="text-sm text-text-secondary dark:text-gray-400">{order.customer.city}{order.customer.postalCode ? `, ${order.customer.postalCode}` : ''}</p>
                        </div>
                      </div>

                      {/* Pricing */}
                      <div className="mb-4">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400 mb-1">Pricing</h4>
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between max-w-xs"><span className="text-text-secondary dark:text-gray-400">Subtotal</span><span className="text-black dark:text-white">Rs. {order.subtotal.toLocaleString()}</span></div>
                          <div className="flex justify-between max-w-xs"><span className="text-text-secondary dark:text-gray-400">Delivery</span><span className="text-black dark:text-white">Rs. {order.deliveryFee.toLocaleString()}</span></div>
                          <div className="flex justify-between max-w-xs font-bold"><span className="text-black dark:text-white">Total</span><span className="text-black dark:text-white">Rs. {order.total.toLocaleString()}</span></div>
                        </div>
                      </div>

                      {/* Payment & Notes */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400 mb-1">Payment Method</h4>
                          <p className="text-sm text-black dark:text-white">{order.paymentMethod}</p>
                        </div>
                        {order.notes && (
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400 mb-1">Notes</h4>
                            <p className="text-sm text-text-secondary dark:text-gray-400">{order.notes}</p>
                          </div>
                        )}
                      </div>

                      {/* Admin Controls */}
                      <div className="flex flex-wrap gap-4 items-end border-t border-gray-200 dark:border-gray-700 pt-4">
                        <div>
                          <label className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400">Status</label>
                          <select
                            value={orderEdits[order._id]?.status || order.status}
                            onChange={(e) => handleOrderEditChange(order._id, 'status', e.target.value)}
                            className="block mt-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white px-2 py-1 text-xs"
                          >
                            {['pending', 'confirmed', 'processing', 'shipped', 'out-for-delivery', 'delivered', 'cancelled'].map(status => (
                              <option key={status} value={status}>{status}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400">Tracking</label>
                          <input
                            type="text"
                            placeholder="Tracking number"
                            value={orderEdits[order._id]?.trackingNumber || order.trackingNumber || ''}
                            onChange={(e) => handleOrderEditChange(order._id, 'trackingNumber', e.target.value)}
                            className="block mt-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white px-2 py-1 text-xs w-40"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400">Est. Delivery</label>
                          <input
                            type="date"
                            value={orderEdits[order._id]?.estimatedDelivery || (order.estimatedDelivery ? new Date(order.estimatedDelivery).toISOString().split('T')[0] : '')}
                            onChange={(e) => handleOrderEditChange(order._id, 'estimatedDelivery', e.target.value)}
                            className="block mt-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white px-2 py-1 text-xs"
                          />
                        </div>
                        <Button onClick={() => handleUpdateOrder(order)} disabled={!!orderUpdating[order._id]}>
                          {orderUpdating[order._id] ? 'Updating...' : 'Update'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {orders.length === 0 && (
              <div className="p-12 text-center text-text-secondary dark:text-gray-500"><p>No orders found.</p></div>
            )}
          </div>
        )}

        {/* Announcements Tab */}
        {activeTab === 'announcements' && (
          <div className="bg-white dark:bg-neutral-900 shadow-sm border border-gray-200 dark:border-gray-800 animate-fade-in">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight text-black dark:text-white">Announcement Bar</h2>
                <span className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400">{announcements.length} / 5</span>
              </div>
              <p className="text-xs text-text-secondary dark:text-gray-400 mt-2">Announcements scroll above the header. Add up to five active items.</p>
            </div>
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-neutral-800">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_120px_120px] gap-4 items-end">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400">Announcement Text</label>
                  <input
                    type="text"
                    value={announcementForm.text}
                    onChange={(e) => setAnnouncementForm(prev => ({ ...prev, text: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white px-3 py-2 text-sm"
                    placeholder="e.g. Free shipping on orders over $120"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400">Order</label>
                  <input
                    type="number"
                    value={announcementForm.order}
                    onChange={(e) => setAnnouncementForm(prev => ({ ...prev, order: Number(e.target.value) }))}
                    className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={announcementForm.isActive}
                    onChange={(e) => setAnnouncementForm(prev => ({ ...prev, isActive: e.target.checked }))}
                  />
                  <span className="text-sm text-black dark:text-white">Active</span>
                </div>
              </div>
              <div className="mt-4">
                <Button onClick={handleAddAnnouncement}>Add Announcement</Button>
              </div>
            </div>
            <div className="p-6">
              {announcements.length === 0 ? (
                <div className="text-center text-text-secondary dark:text-gray-500">No announcements yet.</div>
              ) : (
                <div className="space-y-4">
                  {announcements.map(announcement => (
                    <div key={announcement._id} className="flex flex-col md:flex-row md:items-center gap-4 border border-gray-100 dark:border-gray-800 p-4">
                      <input
                        type="text"
                        value={announcement.text}
                        onChange={(e) => setAnnouncements(prev => prev.map(item => item._id === announcement._id ? { ...item, text: e.target.value } : item))}
                        className="flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white px-3 py-2 text-sm"
                      />
                      <input
                        type="number"
                        value={announcement.order}
                        onChange={(e) => setAnnouncements(prev => prev.map(item => item._id === announcement._id ? { ...item, order: Number(e.target.value) } : item))}
                        className="w-24 border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white px-3 py-2 text-sm"
                      />
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={announcement.isActive}
                          onChange={(e) => setAnnouncements(prev => prev.map(item => item._id === announcement._id ? { ...item, isActive: e.target.checked } : item))}
                        />
                        Active
                      </label>
                      <div className="flex items-center gap-2">
                        <Button onClick={() => handleUpdateAnnouncement(announcement)} disabled={announcementSaveState[announcement._id] === 'saving'}>
                          {announcementSaveState[announcement._id] === 'saved'
                            ? 'Saved'
                            : announcementSaveState[announcement._id] === 'saving'
                              ? 'Saving...'
                              : 'Save'}
                        </Button>
                        <Button variant="outline" onClick={() => handleDeleteAnnouncement(announcement)}>Delete</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Newsletters Tab */}
        {activeTab === 'newsletters' && (
          <div className="bg-white dark:bg-neutral-900 shadow-sm border border-gray-200 dark:border-gray-800 animate-fade-in">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight text-black dark:text-white">Newsletter Subscribers</h2>
              <button
                onClick={() => exportCSV('newsletters')}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest border border-gray-200 dark:border-gray-700 px-4 py-2 hover:border-black dark:hover:border-white transition-colors text-black dark:text-white"
              >
                <Download size={14} /> Export CSV
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 border-b border-gray-100 dark:border-gray-800">
              <div className="bg-gray-50 dark:bg-neutral-800 p-4 text-center">
                <div className="text-2xl font-bold text-black dark:text-white">{newsletters.length}</div>
                <div className="text-xs uppercase tracking-widest text-text-secondary dark:text-gray-400">Total Subscribers</div>
              </div>
              <div className="bg-gray-50 dark:bg-neutral-800 p-4 text-center">
                <div className="text-2xl font-bold text-black dark:text-white">{newsletters.filter(n => n.isActive).length}</div>
                <div className="text-xs uppercase tracking-widest text-text-secondary dark:text-gray-400">Active</div>
              </div>
              <div className="bg-gray-50 dark:bg-neutral-800 p-4 text-center">
                <div className="text-2xl font-bold text-black dark:text-white">{newsletters.filter(n => !n.isActive).length}</div>
                <div className="text-xs uppercase tracking-widest text-text-secondary dark:text-gray-400">Unsubscribed</div>
              </div>
            </div>
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row gap-4 items-center">
              <input
                type="email"
                placeholder="Enter email address to add subscriber"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                className="flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white px-3 py-3 text-sm"
              />
              <Button onClick={handleAddSubscriber} disabled={newsletterAddState === 'saving'}>
                {newsletterAddState === 'saved'
                  ? 'Added'
                  : newsletterAddState === 'saving'
                    ? 'Adding...'
                    : 'Add Subscriber'}
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-neutral-800 text-xs uppercase tracking-widest text-text-secondary dark:text-gray-400">
                    <th className="p-6 font-semibold border-b border-gray-100 dark:border-gray-800">Email</th>
                    <th className="p-6 font-semibold border-b border-gray-100 dark:border-gray-800">Status</th>
                    <th className="p-6 font-semibold border-b border-gray-100 dark:border-gray-800">Source</th>
                    <th className="p-6 font-semibold border-b border-gray-100 dark:border-gray-800 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {newsletters.map(subscriber => (
                    <tr key={subscriber._id} className="hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors">
                      <td className="p-6 border-b border-gray-100 dark:border-gray-800 text-black dark:text-white">{subscriber.email}</td>
                      <td className="p-6 border-b border-gray-100 dark:border-gray-800">
                        <span className={`text-xs font-bold uppercase tracking-wider ${subscriber.isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
                          {subscriber.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-6 border-b border-gray-100 dark:border-gray-800 text-text-secondary dark:text-gray-400">{subscriber.source || 'website'}</td>
                      <td className="p-6 border-b border-gray-100 dark:border-gray-800 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button onClick={() => handleToggleSubscriber(subscriber)} className="text-gray-400 hover:text-black dark:hover:text-white transition-colors" title="Toggle status"><Edit2 size={16} /></button>
                          <button onClick={() => handleDeleteSubscriber(subscriber)} className="text-gray-400 hover:text-red-600 transition-colors" title="Delete"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {newsletters.length === 0 && (
              <div className="p-12 text-center text-text-secondary dark:text-gray-500"><p>No subscribers found.</p></div>
            )}
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="bg-white dark:bg-neutral-900 shadow-sm border border-gray-200 dark:border-gray-800 animate-fade-in">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-xl font-bold tracking-tight text-black dark:text-white">Inventory</h2>
              <p className="text-xs text-text-secondary dark:text-gray-400 mt-2">Update stock counts for each product.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-neutral-800 text-xs uppercase tracking-widest text-text-secondary dark:text-gray-400">
                    <th className="p-6 font-semibold border-b border-gray-100 dark:border-gray-800">Product</th>
                    <th className="p-6 font-semibold border-b border-gray-100 dark:border-gray-800">SKU</th>
                    <th className="p-6 font-semibold border-b border-gray-100 dark:border-gray-800">Stock</th>
                    <th className="p-6 font-semibold border-b border-gray-100 dark:border-gray-800">Reserved</th>
                    <th className="p-6 font-semibold border-b border-gray-100 dark:border-gray-800">Available</th>
                    <th className="p-6 font-semibold border-b border-gray-100 dark:border-gray-800 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {products.map(product => (
                    <tr key={product._id} className="hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors">
                      <td className="p-6 border-b border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gray-100 dark:bg-neutral-700 flex-shrink-0">
                            <img src={product.images?.[0] || product.carouselImage || ''} alt={product.name} className="w-full h-full object-cover mix-blend-multiply" />
                          </div>
                          <span className="font-medium text-black dark:text-white">{product.name}</span>
                        </div>
                      </td>
                      <td className="p-6 border-b border-gray-100 dark:border-gray-800 text-xs text-text-secondary dark:text-gray-400">
                        {product.sku}
                      </td>
                      <td className="p-6 border-b border-gray-100 dark:border-gray-800">
                        <input
                          type="number"
                          min={0}
                          value={inventoryEdits[product._id] ?? product.stock ?? 0}
                          onChange={(e) => setInventoryEdits(prev => ({ ...prev, [product._id]: e.target.value }))}
                          className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white px-2 py-1 text-xs w-24"
                        />
                      </td>
                      <td className="p-6 border-b border-gray-100 dark:border-gray-800 text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                        {(product as any).reservedStock || 0}
                      </td>
                      <td className="p-6 border-b border-gray-100 dark:border-gray-800 text-xs font-bold text-black dark:text-white">
                        {(product.stock || 0) - ((product as any).reservedStock || 0)}
                      </td>
                      <td className="p-6 border-b border-gray-100 dark:border-gray-800 text-right">
                        <Button onClick={() => handleUpdateInventory(product)} disabled={inventorySaving[product._id]}>
                          {inventorySaving[product._id] ? 'Saving...' : 'Save'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {products.length === 0 && (
              <div className="p-12 text-center text-text-secondary dark:text-gray-500"><p>No products available.</p></div>
            )}
          </div>
        )}

        {activeTab === 'mega-menu' && (
          <div className="bg-white dark:bg-neutral-900 shadow-sm border border-gray-200 dark:border-gray-800 animate-fade-in">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-black dark:text-white">Mega Menu</h2>
                <p className="text-xs text-text-secondary dark:text-gray-400 mt-2">Manage top nav labels, columns, images, and links.</p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={addMegaMenuItem}>Add Top Item</Button>
                <Button onClick={saveMegaMenu} disabled={isMegaMenuSaving}>
                  {isMegaMenuSaving ? 'Saving...' : 'Save Mega Menu'}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)] gap-6 p-6">
              <div className="space-y-6">
                {megaMenu.length === 0 && (
                  <div className="text-sm text-text-secondary dark:text-gray-500">No mega menu items yet.</div>
                )}
                  {megaMenu.map((item, itemIndex) => (
                  <div key={`mega-${itemIndex}`} className="border border-gray-100 dark:border-gray-800 p-6 bg-gray-50 dark:bg-neutral-800">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                        <div>
                          <label className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400">Top Label</label>
                          <input
                            type="text"
                            value={item.label}
                            onChange={(e) => updateMegaMenuItem(itemIndex, { ...item, label: e.target.value })}
                            className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400">Top Link (optional)</label>
                          <input
                            type="text"
                            value={item.href || ''}
                            onChange={(e) => updateMegaMenuItem(itemIndex, { ...item, href: e.target.value })}
                            className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white px-3 py-2 text-sm"
                          />
                        </div>
                          <div>
                            <label className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400">Order</label>
                            <input
                              type="number"
                              value={item.order ?? 0}
                              onChange={(e) => updateMegaMenuItem(itemIndex, { ...item, order: Number(e.target.value || 0) })}
                              className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white px-3 py-2 text-sm"
                            />
                          </div>
                      </div>
                      <Button variant="outline" onClick={() => removeMegaMenuItem(itemIndex)}>Remove</Button>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400">Columns</h3>
                        <Button variant="outline" onClick={() => addMegaMenuColumn(itemIndex)}>Add Column</Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {item.columns.map((column, columnIndex) => (
                          <div key={`mega-col-${columnIndex}`} className="border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-neutral-900">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400">Column {columnIndex + 1}</span>
                              <button
                                onClick={() => removeMegaMenuColumn(itemIndex, columnIndex)}
                                className="text-xs uppercase tracking-widest text-red-500"
                              >
                                Remove
                              </button>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <label className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400">Title</label>
                                <input
                                  type="text"
                                  value={column.title}
                                  onChange={(e) => {
                                    const updated = { ...column, title: e.target.value };
                                    updateMegaMenuItem(itemIndex, {
                                      ...item,
                                      columns: item.columns.map((c, idx) => (idx === columnIndex ? updated : c)),
                                    });
                                  }}
                                  className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white px-3 py-2 text-sm"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400">Order</label>
                                <input
                                  type="number"
                                  value={column.order ?? 0}
                                  onChange={(e) => {
                                    const updated = { ...column, order: Number(e.target.value || 0) };
                                    updateMegaMenuItem(itemIndex, {
                                      ...item,
                                      columns: item.columns.map((c, idx) => (idx === columnIndex ? updated : c)),
                                    });
                                  }}
                                  className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white px-3 py-2 text-sm"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400">Image (optional)</label>
                                <div className="flex flex-col gap-2">
                                  <label className="flex items-center gap-2 border border-dashed border-gray-300 dark:border-gray-700 p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors text-xs">
                                    Upload image
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) uploadMegaMenuImage(itemIndex, columnIndex, file);
                                        e.currentTarget.value = '';
                                      }}
                                    />
                                  </label>
                                  {column.image && (
                                    <div className="relative w-full h-24 border border-gray-200 dark:border-gray-700 overflow-hidden">
                                      <img src={column.image} alt="" className="w-full h-full object-cover" />
                                    </div>
                                  )}
                                  <input
                                    type="text"
                                    value={column.image || ''}
                                    onChange={(e) => {
                                      const updated = { ...column, image: e.target.value };
                                      updateMegaMenuItem(itemIndex, {
                                        ...item,
                                        columns: item.columns.map((c, idx) => (idx === columnIndex ? updated : c)),
                                      });
                                    }}
                                    className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white px-3 py-2 text-xs"
                                    placeholder="Image URL (optional)"
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400">Links</span>
                                  <button
                                    onClick={() => addMegaMenuLink(itemIndex, columnIndex)}
                                    className="text-xs uppercase tracking-widest text-black dark:text-white"
                                  >
                                    Add Link
                                  </button>
                                </div>
                                {column.links.map((link, linkIndex) => (
                                  <div key={`mega-link-${linkIndex}`} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2">
                                    <input
                                      type="text"
                                      value={link.label}
                                      onChange={(e) => {
                                        const updatedLinks = column.links.map((l, idx) =>
                                          idx === linkIndex ? { ...l, label: e.target.value } : l
                                        );
                                        const updated = { ...column, links: updatedLinks };
                                        updateMegaMenuItem(itemIndex, {
                                          ...item,
                                          columns: item.columns.map((c, idx) => (idx === columnIndex ? updated : c)),
                                        });
                                      }}
                                      className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white px-3 py-2 text-xs"
                                      placeholder="Label"
                                    />
                                    <input
                                      type="text"
                                      value={link.href}
                                      onChange={(e) => {
                                        const updatedLinks = column.links.map((l, idx) =>
                                          idx === linkIndex ? { ...l, href: e.target.value } : l
                                        );
                                        const updated = { ...column, links: updatedLinks };
                                        updateMegaMenuItem(itemIndex, {
                                          ...item,
                                          columns: item.columns.map((c, idx) => (idx === columnIndex ? updated : c)),
                                        });
                                      }}
                                      className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white px-3 py-2 text-xs"
                                      placeholder="/path"
                                    />
                                    <button
                                      onClick={() => removeMegaMenuLink(itemIndex, columnIndex, linkIndex)}
                                      className="text-xs uppercase tracking-widest text-red-500"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-neutral-900 p-6 h-fit sticky top-24">
                <h3 className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400 mb-4">Live Preview</h3>
                <div className="border border-gray-100 dark:border-gray-800">
                  <div className="flex flex-wrap gap-6 px-6 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-text-secondary dark:text-gray-400">
                    {orderedMegaMenu.map((item, index) => (
                      <button
                        key={`preview-${item.label}-${index}`}
                        onClick={() => setMegaMenuPreviewIndex(index)}
                        className={`transition-colors ${megaMenuPreviewIndex === index ? 'text-black dark:text-white' : 'hover:text-black dark:hover:text-white'}`}
                      >
                        {item.label || 'Untitled'}
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-gray-100 dark:border-gray-800 px-6 py-6">
                    {orderedMegaMenu.length === 0 ? (
                      <div className="text-sm text-text-secondary dark:text-gray-500">Preview will appear here.</div>
                    ) : (
                      <div
                        className="grid gap-6"
                        style={{ gridTemplateColumns: `repeat(${Math.min(orderedMegaMenu[megaMenuPreviewIndex]?.columns.length || 1, 4)}, minmax(0, 1fr))` }}
                      >
                        {[...(orderedMegaMenu[megaMenuPreviewIndex]?.columns || [])]
                          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                          .map((column, index) => (
                          <div key={`preview-col-${index}`} className="space-y-3">
                            {column.image && (
                              <div className="w-full h-20 bg-gray-100 dark:bg-neutral-800 overflow-hidden">
                                <img src={column.image} alt="" className="w-full h-full object-cover" />
                              </div>
                            )}
                            {column.title && (
                              <div className="text-[11px] font-bold uppercase tracking-widest text-black dark:text-white">
                                {column.title}
                              </div>
                            )}
                            <div className="flex flex-col gap-2 text-xs text-text-secondary dark:text-gray-400">
                              {[...(column.links || [])]
                                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                                .map((link, linkIndex) => (
                                <div key={`preview-link-${linkIndex}`}>{link.label}</div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'footer' && (
          <div className="bg-white dark:bg-neutral-900 shadow-sm border border-gray-200 dark:border-gray-800 animate-fade-in">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-black dark:text-white">Footer</h2>
                <p className="text-xs text-text-secondary dark:text-gray-400 mt-2">Control footer columns, top links, and social icons.</p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={addFooterColumn}>Add Column</Button>
                <Button onClick={saveFooter} disabled={isFooterSaving}>
                  {isFooterSaving ? 'Saving...' : 'Save Footer'}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)] gap-6 p-6">
              <div className="space-y-6">
                <div className="border border-gray-100 dark:border-gray-800 p-6 bg-gray-50 dark:bg-neutral-800">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400">Top Links</h3>
                    <Button variant="outline" onClick={addFooterTopLink}>Add Link</Button>
                  </div>
                  <div className="space-y-3">
                    {footerConfig.topLinks.map((link, index) => (
                      <div key={`footer-top-${index}`} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2">
                        <input
                          type="text"
                          value={link.label}
                          onChange={(e) => updateFooterTopLink(index, { ...link, label: e.target.value })}
                          className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white px-3 py-2 text-xs"
                          placeholder="Label"
                        />
                        <input
                          type="text"
                          value={link.href}
                          onChange={(e) => updateFooterTopLink(index, { ...link, href: e.target.value })}
                          className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white px-3 py-2 text-xs"
                          placeholder="/path"
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={link.order ?? 0}
                            onChange={(e) => updateFooterTopLink(index, { ...link, order: Number(e.target.value || 0) })}
                            className="w-20 border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white px-2 py-2 text-xs"
                            placeholder="Order"
                          />
                          <button
                            onClick={() => removeFooterTopLink(index)}
                            className="text-xs uppercase tracking-widest text-red-500"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                    {footerConfig.topLinks.length === 0 && (
                      <div className="text-xs text-text-secondary dark:text-gray-500 italic">No top links yet.</div>
                    )}
                  </div>
                </div>

                <div className="border border-gray-100 dark:border-gray-800 p-6 bg-gray-50 dark:bg-neutral-800">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400 mb-4">Social Links</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {([
                      { key: 'instagram', label: 'Instagram' },
                      { key: 'facebook', label: 'Facebook' },
                      { key: 'twitter', label: 'Twitter' },
                      { key: 'tiktok', label: 'TikTok' },
                    ] as const).map((item) => (
                      <div key={item.key}>
                        <label className="text-[10px] uppercase font-bold text-gray-400">{item.label} URL</label>
                        <input
                          type="text"
                          value={footerConfig.socialLinks[item.key] || ''}
                          onChange={(e) => setFooterConfig(prev => ({
                            ...prev,
                            socialLinks: { ...prev.socialLinks, [item.key]: e.target.value },
                          }))}
                          className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white px-3 py-2 text-xs"
                          placeholder="https://"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  {footerConfig.columns.map((column, columnIndex) => (
                    <div key={`footer-col-${columnIndex}`} className="border border-gray-100 dark:border-gray-800 p-6 bg-gray-50 dark:bg-neutral-800">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400">Column {columnIndex + 1}</span>
                        <Button variant="outline" onClick={() => removeFooterColumn(columnIndex)}>Remove</Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400">Title</label>
                          <input
                            type="text"
                            value={column.title}
                            onChange={(e) => updateFooterColumn(columnIndex, { ...column, title: e.target.value })}
                            className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400">Order</label>
                          <input
                            type="number"
                            value={column.order ?? 0}
                            onChange={(e) => updateFooterColumn(columnIndex, { ...column, order: Number(e.target.value || 0) })}
                            className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400">Image (optional)</label>
                          <div className="flex flex-col gap-2">
                            <label className="flex items-center gap-2 border border-dashed border-gray-300 dark:border-gray-700 p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors text-xs">
                              Upload image
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) uploadFooterColumnImage(columnIndex, file);
                                  e.currentTarget.value = '';
                                }}
                              />
                            </label>
                            {column.image && (
                              <div className="relative w-full h-24 border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <img src={column.image} alt="" className="w-full h-full object-cover" />
                              </div>
                            )}
                            <input
                              type="text"
                              value={column.image || ''}
                              onChange={(e) => updateFooterColumn(columnIndex, { ...column, image: e.target.value })}
                              className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white px-3 py-2 text-xs"
                              placeholder="Image URL"
                            />
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400">Description</label>
                          <textarea
                            value={column.description || ''}
                            onChange={(e) => updateFooterColumn(columnIndex, { ...column, description: e.target.value })}
                            className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white px-3 py-2 text-sm min-h-[90px]"
                          />
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-4">
                        <button
                          onClick={() => updateFooterColumn(columnIndex, { ...column, showNewsletterForm: !column.showNewsletterForm })}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${column.showNewsletterForm ? 'bg-black dark:bg-white' : 'bg-gray-200 dark:bg-gray-700'}`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white dark:bg-black transition ${column.showNewsletterForm ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                        <span className="text-sm font-medium text-black dark:text-white">Newsletter Form</span>
                      </div>

                      {column.showNewsletterForm && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div>
                            <label className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400">Placeholder</label>
                            <input
                              type="text"
                              value={column.newsletterPlaceholder || ''}
                              onChange={(e) => updateFooterColumn(columnIndex, { ...column, newsletterPlaceholder: e.target.value })}
                              className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white px-3 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400">Button Label (optional)</label>
                            <input
                              type="text"
                              value={column.newsletterButtonLabel || ''}
                              onChange={(e) => updateFooterColumn(columnIndex, { ...column, newsletterButtonLabel: e.target.value })}
                              className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white px-3 py-2 text-sm"
                            />
                          </div>
                        </div>
                      )}

                      <div className="mt-6 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400">Links</span>
                          <button
                            onClick={() => addFooterColumnLink(columnIndex)}
                            className="text-xs uppercase tracking-widest text-black dark:text-white"
                          >
                            Add Link
                          </button>
                        </div>
                        {column.links.map((link, linkIndex) => (
                          <div key={`footer-link-${linkIndex}`} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2">
                            <input
                              type="text"
                              value={link.label}
                              onChange={(e) => {
                                const updatedLinks = column.links.map((l, idx) =>
                                  idx === linkIndex ? { ...l, label: e.target.value } : l
                                );
                                updateFooterColumn(columnIndex, { ...column, links: updatedLinks });
                              }}
                              className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white px-3 py-2 text-xs"
                              placeholder="Label"
                            />
                            <input
                              type="text"
                              value={link.href}
                              onChange={(e) => {
                                const updatedLinks = column.links.map((l, idx) =>
                                  idx === linkIndex ? { ...l, href: e.target.value } : l
                                );
                                updateFooterColumn(columnIndex, { ...column, links: updatedLinks });
                              }}
                              className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white px-3 py-2 text-xs"
                              placeholder="/path"
                            />
                            <button
                              onClick={() => removeFooterColumnLink(columnIndex, linkIndex)}
                              className="text-xs uppercase tracking-widest text-red-500"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {footerConfig.columns.length === 0 && (
                    <div className="text-xs text-text-secondary dark:text-gray-500 italic">No footer columns yet.</div>
                  )}
                </div>
              </div>

              <div className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-neutral-900 p-6 h-fit sticky top-24">
                <h3 className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400 mb-4">Live Preview</h3>
                <div className="border border-gray-100 dark:border-gray-800 p-6">
                  {footerConfig.topLinks.length > 0 && (
                    <div className="flex flex-wrap gap-4 text-[10px] uppercase tracking-widest text-text-secondary dark:text-gray-400 mb-6">
                      {[...footerConfig.topLinks]
                        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                        .map((link, index) => (
                          <span key={`footer-preview-top-${index}`}>{link.label || 'Link'}</span>
                        ))}
                    </div>
                  )}
                  <div
                    className={`grid grid-cols-1 ${
                      footerConfig.columns.length <= 1
                        ? 'md:grid-cols-1'
                        : footerConfig.columns.length === 2
                        ? 'md:grid-cols-2'
                        : footerConfig.columns.length === 3
                        ? 'md:grid-cols-3'
                        : 'md:grid-cols-4'
                    } gap-6`}
                  >
                    {[...footerConfig.columns]
                      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                      .map((column, index) => (
                      <div key={`footer-preview-${index}`} className="space-y-3">
                        {column.image && (
                          <div className="w-full h-16 bg-gray-100 dark:bg-neutral-800 overflow-hidden">
                            <img src={column.image} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="text-[11px] font-bold uppercase tracking-widest text-black dark:text-white">
                          {column.title || 'Untitled'}
                        </div>
                        {column.description && (
                          <p className="text-xs text-text-secondary dark:text-gray-400">{column.description}</p>
                        )}
                        {(column.links || []).length > 0 && (
                          <div className="space-y-1 text-xs text-text-secondary dark:text-gray-400">
                            {(column.links || []).map((link, linkIndex) => (
                              <div key={`footer-preview-link-${linkIndex}`}>{link.label}</div>
                            ))}
                          </div>
                        )}
                        {column.showNewsletterForm && (
                          <div className="border border-gray-200 dark:border-gray-700 p-2 text-[10px] uppercase tracking-widest text-text-secondary dark:text-gray-400">
                            Newsletter Form
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3 mt-6 text-xs uppercase tracking-widest text-text-secondary dark:text-gray-400">
                    {([
                      { key: 'instagram', label: 'Instagram' },
                      { key: 'facebook', label: 'Facebook' },
                      { key: 'twitter', label: 'Twitter' },
                      { key: 'tiktok', label: 'TikTok' },
                    ] as const)
                      .filter((item) => {
                        const value = footerConfig.socialLinks[item.key] || '';
                        return value.trim().length > 0 && value.trim() !== '#';
                      })
                      .map((item) => (
                        <span key={`footer-preview-social-${item.key}`}>{item.label}</span>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Layout Tab */}
        {activeTab === 'layout' && (
          <div className="bg-white dark:bg-neutral-900 shadow-sm border border-gray-200 dark:border-gray-800 animate-fade-in">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-xl font-bold tracking-tight text-black dark:text-white">Homepage Configuration</h2>
              <p className="text-sm text-text-secondary dark:text-gray-400 mt-1">Control hero rotation and curated sections.</p>
            </div>
            <div>
              <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div>
                    <h4 className="font-bold text-sm uppercase tracking-wide mb-1 text-black dark:text-white">Hero Rotator</h4>
                    <p className="text-xs text-text-secondary dark:text-gray-400">Add slides for the homepage hero rotation.</p>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400">Interval (sec)</label>
                      <input
                        type="number"
                        min={2}
                        max={20}
                        value={heroSlideIntervalSeconds}
                        onChange={(e) => setHeroSlideIntervalSeconds(Number(e.target.value || 6))}
                        onBlur={() => saveHeroInterval(heroSlideIntervalSeconds)}
                        className="w-20 border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white px-2 py-1 text-xs"
                      />
                    </div>
                    <label className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400">
                      Upload
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleHeroUpload(file);
                          e.currentTarget.value = '';
                        }}
                      />
                    </label>
                    <button
                      onClick={handleAddHeroSlide}
                      className="text-xs font-bold uppercase tracking-widest text-black dark:text-white border border-gray-200 dark:border-gray-700 px-3 py-2 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                      Add Slide
                    </button>
                    <button
                      onClick={() => saveHeroSlides(heroSlides)}
                      className="text-xs font-bold uppercase tracking-widest text-white bg-black dark:bg-white dark:text-black px-3 py-2 hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                      disabled={isHeroUploadBusy}
                    >
                      {isHeroUploadBusy ? 'Uploading...' : 'Save Slides'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {heroSlides.map((slide, index) => (
                    <div key={`${slide.image}-${index}`} className="border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-neutral-800">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="w-24 h-24 bg-white dark:bg-neutral-700 border border-gray-200 dark:border-gray-600 overflow-hidden">
                          {slide.image ? (
                            <img src={slide.image} alt="Hero slide" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-text-secondary dark:text-gray-400 uppercase">No Image</div>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemoveHeroSlide(index)}
                          className="text-xs uppercase tracking-widest text-red-500 hover:text-red-600"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="space-y-3">
                        <label className="flex items-center gap-2 border border-dashed border-gray-300 dark:border-gray-700 p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors text-xs">
                          Upload image
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const formData = new FormData();
                              formData.append('images', file);
                              const response = await fetch('/api/upload', { method: 'POST', body: formData });
                              if (response.ok) {
                                const data = await response.json();
                                if (data.images?.[0]) {
                                  handleUpdateHeroSlide(index, 'image', data.images[0]);
                                }
                              }
                              e.currentTarget.value = '';
                            }}
                          />
                        </label>
                        <input
                          type="text"
                          placeholder="Headline"
                          value={slide.headline || ''}
                          onChange={(e) => handleUpdateHeroSlide(index, 'headline', e.target.value)}
                          className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white px-3 py-2 text-xs focus:border-black dark:focus:border-white outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Subheadline"
                          value={slide.subheadline || ''}
                          onChange={(e) => handleUpdateHeroSlide(index, 'subheadline', e.target.value)}
                          className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white px-3 py-2 text-xs focus:border-black dark:focus:border-white outline-none"
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder="CTA Label"
                            value={slide.ctaLabel || ''}
                            onChange={(e) => handleUpdateHeroSlide(index, 'ctaLabel', e.target.value)}
                            className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white px-3 py-2 text-xs focus:border-black dark:focus:border-white outline-none"
                          />
                          <input
                            type="text"
                            placeholder="CTA Link"
                            value={slide.ctaLink || ''}
                            onChange={(e) => handleUpdateHeroSlide(index, 'ctaLink', e.target.value)}
                            className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white px-3 py-2 text-xs focus:border-black dark:focus:border-white outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {heroSlides.length === 0 && (
                    <div className="text-xs text-text-secondary dark:text-gray-500 italic">No hero slides configured yet.</div>
                  )}
                </div>
              </div>

              {renderLayoutSetting('newOffers', 'Browse New Offers Section')}
              {renderLayoutSetting('bestOffers', 'Our Best Offers Section')}
              {renderLayoutSetting('productsYouLove', "Products You'll Love Section")}
            </div>
          </div>
        )}

        {/* Comments Tab */}
        {activeTab === 'comments' && (
          <div className="bg-white dark:bg-neutral-900 shadow-sm border border-gray-200 dark:border-gray-800 animate-fade-in">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-black dark:text-white">Product Reviews & Comments</h2>
                <p className="text-sm text-text-secondary dark:text-gray-400 mt-1">Approve, reject, edit, or create reviews.</p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={reviewStatusFilter}
                  onChange={(e) => {
                    setReviewStatusFilter(e.target.value as any);
                    fetchAdminReviews(e.target.value === 'all' ? undefined : e.target.value);
                  }}
                  className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-black text-sm px-3 py-2"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <Button onClick={() => setShowCreateReview(true)} className="flex items-center gap-2 py-3">
                  <Plus size={16} /> Add Review
                </Button>
              </div>
            </div>

            {/* Create Review Form */}
            {showCreateReview && (
              <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-neutral-800">
                <h3 className="text-sm font-bold uppercase tracking-widest mb-4">Create Review</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <select
                    value={createReviewForm.productId}
                    onChange={(e) => setCreateReviewForm(p => ({ ...p, productId: e.target.value }))}
                    className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-black text-sm px-3 py-2"
                  >
                    <option value="">Select Product</option>
                    {products.map((p) => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                  <select
                    value={createReviewForm.rating}
                    onChange={(e) => setCreateReviewForm(p => ({ ...p, rating: Number(e.target.value) }))}
                    className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-black text-sm px-3 py-2"
                  >
                    {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} Star{r !== 1 ? 's' : ''}</option>)}
                  </select>
                  <input
                    placeholder="Reviewer Name"
                    value={createReviewForm.userName}
                    onChange={(e) => setCreateReviewForm(p => ({ ...p, userName: e.target.value }))}
                    className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-black text-sm px-3 py-2"
                  />
                  <input
                    placeholder="Reviewer Email"
                    value={createReviewForm.userEmail}
                    onChange={(e) => setCreateReviewForm(p => ({ ...p, userEmail: e.target.value }))}
                    className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-black text-sm px-3 py-2"
                  />
                  <textarea
                    placeholder="Comment"
                    value={createReviewForm.comment}
                    onChange={(e) => setCreateReviewForm(p => ({ ...p, comment: e.target.value }))}
                    className="sm:col-span-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-black text-sm px-3 py-2 resize-none"
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={async () => {
                      if (!createReviewForm.productId) return;
                      try {
                        await fetch('/api/admin/reviews', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(createReviewForm),
                        });
                        setShowCreateReview(false);
                        setCreateReviewForm({ productId: '', rating: 5, comment: '', userName: '', userEmail: '' });
                        fetchAdminReviews(reviewStatusFilter === 'all' ? undefined : reviewStatusFilter);
                      } catch { /* silent */ }
                    }}
                  >
                    Create
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateReview(false)}>Cancel</Button>
                </div>
              </div>
            )}

            {/* Reviews list */}
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {adminReviews.length === 0 ? (
                <div className="p-12 text-center text-gray-400 text-sm">No reviews found.</div>
              ) : (
                adminReviews.map((review) => (
                  <div key={review._id} className="p-6">
                    {editingReview?._id === review._id ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <input
                            value={editingReview.userName}
                            onChange={(e) => setEditingReview({ ...editingReview, userName: e.target.value })}
                            className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-black text-sm px-3 py-2"
                            placeholder="Name"
                          />
                          <select
                            value={editingReview.rating}
                            onChange={(e) => setEditingReview({ ...editingReview, rating: Number(e.target.value) })}
                            className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-black text-sm px-3 py-2"
                          >
                            {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} Stars</option>)}
                          </select>
                          <select
                            value={editingReview.status}
                            onChange={(e) => setEditingReview({ ...editingReview, status: e.target.value })}
                            className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-black text-sm px-3 py-2"
                          >
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </div>
                        <textarea
                          value={editingReview.comment}
                          onChange={(e) => setEditingReview({ ...editingReview, comment: e.target.value })}
                          className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-black text-sm px-3 py-2 resize-none"
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={async () => {
                              try {
                                await fetch('/api/admin/reviews', {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    reviewId: editingReview._id,
                                    status: editingReview.status,
                                    comment: editingReview.comment,
                                    rating: editingReview.rating,
                                    userName: editingReview.userName,
                                  }),
                                });
                                setEditingReview(null);
                                fetchAdminReviews(reviewStatusFilter === 'all' ? undefined : reviewStatusFilter);
                              } catch { /* silent */ }
                            }}
                          >
                            Save
                          </Button>
                          <Button variant="outline" onClick={() => setEditingReview(null)}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-black dark:text-white">{review.userName}</span>
                            <span className="text-xs text-gray-400">{review.userEmail}</span>
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                              review.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                              review.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                              'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            }`}>
                              {review.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mb-1">
                            {[1, 2, 3, 4, 5].map(s => (
                              <span key={s} className={`text-sm ${s <= review.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}>★</span>
                            ))}
                          </div>
                          {review.comment && <p className="text-sm text-gray-600 dark:text-gray-300">{review.comment}</p>}
                          <p className="text-xs text-gray-400 mt-1">
                            Product: <span className="font-medium text-black dark:text-white">{review.product?.name || 'Unknown'}</span>
                            {' · '}
                            {new Date(review.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {review.status === 'pending' && (
                            <>
                              <Button
                                className="text-xs"
                                onClick={async () => {
                                  await fetch('/api/admin/reviews', {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ reviewId: review._id, status: 'approved' }),
                                  });
                                  fetchAdminReviews(reviewStatusFilter === 'all' ? undefined : reviewStatusFilter);
                                }}
                              >
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                className="text-xs"
                                onClick={async () => {
                                  await fetch('/api/admin/reviews', {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ reviewId: review._id, status: 'rejected' }),
                                  });
                                  fetchAdminReviews(reviewStatusFilter === 'all' ? undefined : reviewStatusFilter);
                                }}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          <button
                            onClick={() => setEditingReview({ ...review })}
                            className="p-2 text-gray-400 hover:text-black dark:hover:text-white"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={async () => {
                              await fetch(`/api/admin/reviews?id=${review._id}`, { method: 'DELETE' });
                              fetchAdminReviews(reviewStatusFilter === 'all' ? undefined : reviewStatusFilter);
                            }}
                            className="p-2 text-gray-400 hover:text-red-500"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Payment Methods Tab */}
        {activeTab === 'payment-methods' && (
          <div className="bg-white dark:bg-neutral-900 shadow-sm border border-gray-200 dark:border-gray-800 animate-fade-in">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-xl font-bold tracking-tight text-black dark:text-white">Payment Methods</h2>
              <p className="text-sm text-text-secondary dark:text-gray-400 mt-1">Configure the text shown when a customer selects JazzCash or Bank Transfer at checkout.</p>
            </div>
            <div className="p-6 space-y-8">
              <div>
                <label className="block text-sm font-bold uppercase tracking-widest text-black dark:text-white mb-2">JazzCash Instructions</label>
                <textarea
                  value={paymentMethodTexts.jazzcash}
                  onChange={(e) => setPaymentMethodTexts(prev => ({ ...prev, jazzcash: e.target.value }))}
                  placeholder="e.g. You can transfer via JazzCash to 03XX-XXXXXXX. Send screenshot at 03XX-XXXXXXX."
                  className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white p-3 text-sm resize-none"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-bold uppercase tracking-widest text-black dark:text-white mb-2">Bank Transfer Instructions</label>
                <textarea
                  value={paymentMethodTexts.bankTransfer}
                  onChange={(e) => setPaymentMethodTexts(prev => ({ ...prev, bankTransfer: e.target.value }))}
                  placeholder="e.g. Bank: HBL, Account: 1234567890, Title: Company Name. Send screenshot at 03XX-XXXXXXX."
                  className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white p-3 text-sm resize-none"
                  rows={4}
                />
              </div>
              <Button onClick={handleSavePaymentMethods} disabled={paymentMethodSaving}>
                {paymentMethodSaving ? 'Saving...' : 'Save Payment Methods'}
              </Button>
            </div>
          </div>
        )}

        {/* WhatsApp Tab */}
        {activeTab === 'whatsapp' && (
          <div className="bg-white dark:bg-neutral-900 shadow-sm border border-gray-200 dark:border-gray-800 animate-fade-in">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-xl font-bold tracking-tight text-black dark:text-white">WhatsApp Contact</h2>
              <p className="text-sm text-text-secondary dark:text-gray-400 mt-1">Set the WhatsApp number that customers can reach you on via the floating icon.</p>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold uppercase tracking-widest text-black dark:text-white mb-2">WhatsApp Number</label>
                <input
                  type="text"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="e.g. 923001234567 (country code without +)"
                  className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white p-3 text-sm max-w-md"
                />
                <p className="text-xs text-text-secondary dark:text-gray-400 mt-2">Enter the full number with country code, without + or spaces. Example: 923001234567</p>
              </div>
              <Button onClick={handleSaveWhatsapp} disabled={whatsappSaving}>
                {whatsappSaving ? 'Saving...' : 'Save WhatsApp Number'}
              </Button>
            </div>
          </div>
        )}

        {/* Q&A Tab */}
        {activeTab === 'qa' && (
          <div className="bg-white dark:bg-neutral-900 shadow-sm border border-gray-200 dark:border-gray-800 animate-fade-in">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-xl font-bold tracking-tight text-black dark:text-white">Product Q&A</h2>
              <p className="text-sm text-text-secondary dark:text-gray-400 mt-1">Add common questions and answers for each product. These appear on the product page.</p>
            </div>

            {/* Add / Edit Form */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-neutral-800">
              <h3 className="text-sm font-bold uppercase tracking-widest text-black dark:text-white mb-4">
                {qaEditing ? 'Edit Q&A' : 'Add New Q&A'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400">Product</label>
                  <select
                    value={qaEditing ? qaEditing.productId : qaForm.productId}
                    onChange={(e) => qaEditing ? setQaEditing({ ...qaEditing, productId: e.target.value }) : setQaForm(prev => ({ ...prev, productId: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white px-3 py-3 text-sm"
                  >
                    <option value="">Select a product</option>
                    {products.map(p => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-4 mb-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400">Question</label>
                  <input
                    type="text"
                    value={qaEditing ? qaEditing.question : qaForm.question}
                    onChange={(e) => qaEditing ? setQaEditing({ ...qaEditing, question: e.target.value }) : setQaForm(prev => ({ ...prev, question: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white px-3 py-3 text-sm"
                    placeholder="e.g. What materials is this made from?"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400">Answer</label>
                  <textarea
                    value={qaEditing ? qaEditing.answer : qaForm.answer}
                    onChange={(e) => qaEditing ? setQaEditing({ ...qaEditing, answer: e.target.value }) : setQaForm(prev => ({ ...prev, answer: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white px-3 py-3 text-sm"
                    rows={3}
                    placeholder="The answer..."
                  />
                </div>
              </div>
              <div className="flex gap-2">
                {qaEditing ? (
                  <>
                    <Button disabled={qaSaving} onClick={async () => {
                      setQaSaving(true);
                      await fetch(`/api/admin/qa/${qaEditing._id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ question: qaEditing.question, answer: qaEditing.answer, productId: qaEditing.productId }),
                      });
                      setQaEditing(null);
                      setQaSaving(false);
                      fetchData();
                    }}>
                      {qaSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button variant="outline" onClick={() => setQaEditing(null)}>Cancel</Button>
                  </>
                ) : (
                  <Button disabled={qaSaving || !qaForm.productId || !qaForm.question || !qaForm.answer} onClick={async () => {
                    setQaSaving(true);
                    await fetch('/api/admin/qa', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(qaForm),
                    });
                    setQaForm({ productId: '', question: '', answer: '' });
                    setQaSaving(false);
                    fetchData();
                  }}>
                    {qaSaving ? 'Adding...' : 'Add Q&A'}
                  </Button>
                )}
              </div>
            </div>

            {/* List */}
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {qaItems.length === 0 && (
                <div className="p-12 text-center text-text-secondary dark:text-gray-500"><p>No Q&A items yet.</p></div>
              )}
              {qaItems.map((qa: any) => (
                <div key={qa._id} className="p-6 flex items-start justify-between gap-4">
                  <div className="flex-grow">
                    <p className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-gray-400 mb-1">
                      {qa.productId?.name || 'Unknown Product'}
                    </p>
                    <p className="text-sm font-semibold text-black dark:text-white mb-1">{qa.question}</p>
                    <p className="text-sm text-text-secondary dark:text-gray-400">{qa.answer}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => setQaEditing({ _id: qa._id, productId: qa.productId?._id || '', question: qa.question, answer: qa.answer })}
                      className="text-text-secondary hover:text-black dark:hover:text-white transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={async () => {
                        if (!window.confirm('Delete this Q&A?')) return;
                        await fetch(`/api/admin/qa/${qa._id}`, { method: 'DELETE' });
                        fetchData();
                      }}
                      className="text-text-secondary hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Export Section */}
        {(activeTab === 'newsletters') && (
          <div className="mt-6 bg-white dark:bg-neutral-900 shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-black dark:text-white mb-4">Export Data</h3>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => exportCSV('orders')} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest border border-gray-200 dark:border-gray-700 px-4 py-2 hover:border-black dark:hover:border-white transition-colors text-black dark:text-white">
                <Download size={14} /> Export Customer Data
              </button>
              <button onClick={() => exportCSV('newsletters')} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest border border-gray-200 dark:border-gray-700 px-4 py-2 hover:border-black dark:hover:border-white transition-colors text-black dark:text-white">
                <Download size={14} /> Export Newsletter Subscribers
              </button>
              <button onClick={() => exportCSV('users')} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest border border-gray-200 dark:border-gray-700 px-4 py-2 hover:border-black dark:hover:border-white transition-colors text-black dark:text-white">
                <Download size={14} /> Export Signup Emails
              </button>
            </div>
          </div>
        )}
      </div>

      <AddProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSave={handleProductModalSave}
        initialData={editingProduct}
        categories={categories}
        brands={brands}
        onCategoryCreated={fetchData}
      />
      <ProductSelectorModal
        isOpen={productSelectorOpen.isOpen}
        onClose={() => setProductSelectorOpen({ isOpen: false, section: null })}
        products={products}
        onSelect={handleAddProductToSection}
        excludeIds={(productSelectorOpen.section ? sectionProducts[productSelectorOpen.section] : []).map(p => p._id)}
      />

      {brandLogoCropState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
          <div className="bg-white dark:bg-neutral-900 p-6 max-w-3xl w-full">
            <div className="relative w-full h-[420px] bg-black">
              <CropperComponent
                image={brandLogoCropState.src}
                crop={brandLogoCrop}
                zoom={brandLogoZoom}
                aspect={brandLogoCropState.aspect}
                onCropChange={setBrandLogoCrop}
                onZoomChange={setBrandLogoZoom}
                onCropComplete={(_: Area, croppedPixels: Area) => setBrandLogoCroppedAreaPixels(croppedPixels)}
              />
            </div>
            <div className="flex items-center justify-between mt-4">
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={brandLogoZoom}
                onChange={(event) => setBrandLogoZoom(Number(event.target.value))}
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setBrandLogoCropState(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    if (!brandLogoCroppedAreaPixels) return;
                    const blob = await getCroppedImg(brandLogoCropState.src, brandLogoCroppedAreaPixels);
                    await brandLogoCropState.onComplete(blob);
                    setBrandLogoCropState(null);
                  }}
                >
                  Use Logo
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
