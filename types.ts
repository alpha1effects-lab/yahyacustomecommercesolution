export interface SeoFields {
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  robots?: { index?: boolean; follow?: boolean };
  jsonLd?: string;
}

export interface PageSeoData {
  _id?: string;
  pagePath: string;
  displayName: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogType: string;
  robots: { index: boolean; follow: boolean };
  jsonLd: string;
}

export interface Product {
  _id: string;
  sku: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number | null;
  images: string[];
  imageAlts?: string[];
  description?: string;
  category?: {
    _id: string;
    name: string;
    slug: string;
  };
  categories?: {
    _id: string;
    name: string;
    slug: string;
  }[];
  brand?: {
    _id: string;
    name: string;
    slug: string;
  } | null;
  metadata?: Record<string, unknown>;
  stock?: number;
  isActive?: boolean;
  isPublished?: boolean;
  isNewOffer?: boolean;
  isBestOffer?: boolean;
  isFeatured?: boolean;
  carouselImage?: string;
  seo?: SeoFields;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  _id: string;
  orderNumber: string;
  customer: {
    fullName: string;
    email: string;
    phone: string;
    phone2?: string;
    address: string;
    city: string;
    postalCode?: string;
  };
  items: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    total: number;
    image?: string;
  }[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: string;
  status: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  notes?: string;
  createdAt: string;
}

export interface SectionSettings {
  newOffers: { title: string; show: boolean };
  bestOffers: { title: string; show: boolean };
  productsYouLove: { title: string; show: boolean };
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  parent?: string | null;
  attributes?: {
    label: string;
    key: string;
    fieldType: 'text' | 'number' | 'select';
    options?: string[];
  }[];
  seo?: SeoFields;
}

export interface Brand {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  backgroundImage?: string;
  logo?: string;
  isActive?: boolean;
  displayOrder?: number;
  seo?: SeoFields;
}

export interface Announcement {
  _id: string;
  text: string;
  isActive: boolean;
  order: number;
}

export interface Newsletter {
  _id: string;
  email: string;
  isActive: boolean;
  subscribedAt: string;
  unsubscribedAt?: string | null;
  source?: string;
}

export type BlogPostStatus = 'draft' | 'published';

export interface BlogCategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface BlogTag {
  _id: string;
  name: string;
  slug: string;
}

export interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage?: string;
  status: BlogPostStatus;
  category?: BlogCategory | string;
  tags?: BlogTag[] | string[];
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  robots?: { index?: boolean; follow?: boolean };
  readingTimeMinutes?: number;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SiteSettingsData {
  _id?: string;
  heroImage: string;
  heroSlideIntervalSeconds?: number;
  megaMenu?: {
    label: string;
    href?: string;
    order?: number;
    columns: {
      title: string;
      image?: string;
      order?: number;
      links: {
        label: string;
        href: string;
        order?: number;
      }[];
    }[];
  }[];
  heroSlides?: {
    image: string;
    headline?: string;
    subheadline?: string;
    ctaLabel?: string;
    ctaLink?: string;
  }[];
  announcementText?: string;
  sections: SectionSettings;
  newOffersProductIds: string[];
  bestOffersProductIds: string[];
  productsYouLoveProductIds: string[];
  reviews?: {
    name: string;
    rating: number;
    text: string;
    location?: string;
  }[];
  footer?: {
    topLinks: { label: string; href: string; order?: number }[];
    columns: {
      title: string;
      image?: string;
      description?: string;
      order?: number;
      links: { label: string; href: string }[];
      showNewsletterForm?: boolean;
      newsletterPlaceholder?: string;
      newsletterButtonLabel?: string;
    }[];
    socialLinks?: {
      instagram?: string;
      facebook?: string;
      twitter?: string;
      tiktok?: string;
    };
  };
}

export interface Redirect {
  _id: string;
  from: string;
  to: string;
  type: 301 | 302;
  isActive: boolean;
  note?: string;
  createdAt: string;
  updatedAt: string;
}
