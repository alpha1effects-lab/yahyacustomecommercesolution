import mongoose, { Schema, Model, Document } from 'mongoose';

export interface ISiteSettings extends Document {
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
  heroSlides: {
    image: string;
    headline?: string;
    subheadline?: string;
    ctaLabel?: string;
    ctaLink?: string;
  }[];
  announcementText: string;
  sections: {
    newOffers: { title: string; show: boolean };
    bestOffers: { title: string; show: boolean };
    productsYouLove: { title: string; show: boolean };
  };
  newOffersProductIds: mongoose.Types.ObjectId[];
  bestOffersProductIds: mongoose.Types.ObjectId[];
  productsYouLoveProductIds: mongoose.Types.ObjectId[];
  reviews: {
    name: string;
    rating: number;
    text: string;
    location?: string;
  }[];
  footer?: {
    topLinks: { label: string; href: string }[];
    columns: {
      title: string;
      image?: string;
      description?: string;
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
  whatsappNumber?: string;
  paymentMethodTexts?: {
    jazzcash?: string;
    bankTransfer?: string;
  };
  robotsTxt?: string;
  deliverySettings?: {
    type: 'flat' | 'free_above_threshold' | 'always_free';
    flatFee: number;
    freeAboveAmount: number;
  };
  defaultSeo?: {
    titleSuffix?: string;
    defaultDescription?: string;
    defaultOgImage?: string;
  };
  seoTemplates?: {
    product?: string;
    category?: string;
    brand?: string;
    blog?: string;
  };
}

const siteSettingsSchema = new Schema<ISiteSettings>({
  heroImage: { type: String, default: 'https://images.unsplash.com/photo-1613918108466-292b78a8ef95?q=80&w=2574&auto=format&fit=crop' },
  heroSlideIntervalSeconds: { type: Number, default: 6, min: 2, max: 20 },
  megaMenu: [
    {
      label: { type: String, required: true },
      href: { type: String, default: '' },
      order: { type: Number, default: 0 },
      columns: [
        {
          title: { type: String, default: '' },
          image: { type: String, default: '' },
          order: { type: Number, default: 0 },
          links: [
            {
              label: { type: String, required: true },
              href: { type: String, required: true },
              order: { type: Number, default: 0 },
            },
          ],
        },
      ],
    },
  ],
  heroSlides: [
    {
      image: { type: String, required: true },
      headline: { type: String, default: '' },
      subheadline: { type: String, default: '' },
      ctaLabel: { type: String, default: '' },
      ctaLink: { type: String, default: '' },
    },
  ],
  announcementText: { type: String, default: '' },
  sections: {
    newOffers: { title: { type: String, default: 'Browse New Offers' }, show: { type: Boolean, default: true } },
    bestOffers: { title: { type: String, default: 'Our Best Offers' }, show: { type: Boolean, default: true } },
    productsYouLove: { title: { type: String, default: "Products You'll Love" }, show: { type: Boolean, default: true } },
  },
  newOffersProductIds: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
  bestOffersProductIds: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
  productsYouLoveProductIds: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
  reviews: [
    {
      name: { type: String, required: true },
      rating: { type: Number, min: 1, max: 5, default: 5 },
      text: { type: String, required: true },
      location: { type: String, default: '' },
    },
  ],
  footer: {
    topLinks: [
      {
        label: { type: String, default: 'Search' },
        href: { type: String, default: '#' },
        order: { type: Number, default: 0 },
      },
      {
        label: { type: String, default: 'About Us' },
        href: { type: String, default: '#' },
        order: { type: Number, default: 1 },
      },
      {
        label: { type: String, default: 'Contact' },
        href: { type: String, default: '#' },
        order: { type: Number, default: 2 },
      },
      {
        label: { type: String, default: 'Shipping Policy' },
        href: { type: String, default: '#' },
        order: { type: Number, default: 3 },
      },
      {
        label: { type: String, default: 'Terms of Service' },
        href: { type: String, default: '#' },
        order: { type: Number, default: 4 },
      },
    ],
    columns: [
      {
        title: { type: String, default: 'About' },
        image: { type: String, default: '' },
        description: { type: String, default: 'Your one-stop shop for premium art supplies and craft materials.' },
        order: { type: Number, default: 0 },
        links: [
          {
            label: { type: String, default: '' },
            href: { type: String, default: '' },
          },
        ],
        showNewsletterForm: { type: Boolean, default: false },
        newsletterPlaceholder: { type: String, default: '' },
        newsletterButtonLabel: { type: String, default: '' },
      },
      {
        title: { type: String, default: "Let's Talk" },
        image: { type: String, default: '' },
        description: { type: String, default: '' },
        order: { type: Number, default: 1 },
        links: [
          { label: { type: String, default: 'hello@example.com' }, href: { type: String, default: 'mailto:hello@example.com' } },
          { label: { type: String, default: '+1 (555) 000-0000' }, href: { type: String, default: 'tel:+15550000000' } },
          { label: { type: String, default: 'Mon - Fri: 9am - 5pm EST' }, href: { type: String, default: '#' } },
        ],
        showNewsletterForm: { type: Boolean, default: false },
        newsletterPlaceholder: { type: String, default: '' },
        newsletterButtonLabel: { type: String, default: '' },
      },
      {
        title: { type: String, default: 'Newsletter' },
        image: { type: String, default: '' },
        description: { type: String, default: 'Subscribe to receive updates, access to exclusive deals, and more.' },
        order: { type: Number, default: 2 },
        links: [
          { label: { type: String, default: '' }, href: { type: String, default: '' } },
        ],
        showNewsletterForm: { type: Boolean, default: true },
        newsletterPlaceholder: { type: String, default: 'Enter your email' },
        newsletterButtonLabel: { type: String, default: '' },
      },
    ],
    socialLinks: {
      instagram: { type: String, default: '' },
      facebook: { type: String, default: '' },
      twitter: { type: String, default: '' },
      tiktok: { type: String, default: '' },
    },
  },
  whatsappNumber: { type: String, default: '' },
  paymentMethodTexts: {
    jazzcash: { type: String, default: '' },
    bankTransfer: { type: String, default: '' },
  },
  robotsTxt: { type: String, default: '' },
  deliverySettings: {
    type: {
      type: String,
      enum: ['flat', 'free_above_threshold', 'always_free'],
      default: 'flat',
    },
    flatFee: { type: Number, default: 0 },
    freeAboveAmount: { type: Number, default: 0 },
  },
  defaultSeo: {
    titleSuffix: { type: String, default: '' },
    defaultDescription: { type: String, default: '' },
    defaultOgImage: { type: String, default: '' },
  },
  seoTemplates: {
    product: { type: String, default: '{{name}} | Buy Online in Pakistan' },
    category: { type: String, default: '{{name}} — Shop the Best Collection' },
    brand: { type: String, default: '{{name}} — Official Store' },
    blog: { type: String, default: '{{title}} — Blog' },
  },
});

export const SiteSettings: Model<ISiteSettings> = mongoose.models.SiteSettings || mongoose.model<ISiteSettings>('SiteSettings', siteSettingsSchema);
export default SiteSettings;
