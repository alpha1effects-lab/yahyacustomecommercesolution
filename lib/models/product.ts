import mongoose, { Schema, Model, Document } from 'mongoose';
import '@/lib/models/category';
import '@/lib/models/brand';
import { generateSkuFromName, slugifyProductName } from '@/lib/utils/productUtils';

export interface IProduct extends Document {
  sku: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number | null;
  stock: number;
  reservedStock: number;
  category: mongoose.Types.ObjectId;
  categories: mongoose.Types.ObjectId[];
  brand?: mongoose.Types.ObjectId | null;
  metadata: Map<string, unknown>;
  images: string[];
  imageAlts: string[];
  isActive: boolean;
  isPublished: boolean;
  isNewOffer: boolean;
  isBestOffer: boolean;
  isFeatured: boolean;
  carouselImage: string;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    canonicalUrl?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    robots?: { index?: boolean; follow?: boolean };
  };
  createdAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    sku: { type: String, required: true, unique: true, trim: true },
    name: { type: String, trim: true },
    slug: { type: String, unique: true, sparse: true, lowercase: true },
    description: { type: String, default: '' },
    price: { type: Number, min: 0 },
    originalPrice: { type: Number, default: null, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    reservedStock: { type: Number, default: 0, min: 0 },
    category: { type: Schema.Types.ObjectId, ref: 'Category' },
    categories: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
    brand: { type: Schema.Types.ObjectId, ref: 'Brand', default: null },
    metadata: { type: Map, of: Schema.Types.Mixed, default: new Map() },
    images: [{ type: String }],
    imageAlts: [{ type: String }],
    isActive: { type: Boolean, default: true },
    isPublished: { type: Boolean, default: true },
    isNewOffer: { type: Boolean, default: false },
    isBestOffer: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    carouselImage: { type: String, default: '' },
    seo: {
      metaTitle: { type: String, default: '' },
      metaDescription: { type: String, default: '' },
      canonicalUrl: { type: String, default: '' },
      ogTitle: { type: String, default: '' },
      ogDescription: { type: String, default: '' },
      ogImage: { type: String, default: '' },
      robots: {
        index: { type: Boolean, default: true },
        follow: { type: Boolean, default: true },
      },
    },
  },
  { timestamps: true }
);

const isGenericSlug = (value?: string | null) => {
  if (!value) return true;
  if (/^[a-f0-9]{24}$/i.test(value)) return true;
  if (/-\d{8,}$/.test(value)) return true;
  return false;
};

const ensureSlugOnRead = async (doc: IProduct | null, ProductModel: Model<IProduct>) => {
  if (!doc || !doc.name || (!isGenericSlug(doc.slug) && doc.slug)) return;
  const baseSlug = slugifyProductName(doc.name) || 'product';
  let candidate = baseSlug;
  let suffix = 1;

  while (await ProductModel.exists({ slug: candidate, _id: { $ne: doc._id } })) {
    suffix += 1;
    candidate = `${baseSlug}-${suffix}`;
  }

  await ProductModel.updateOne({ _id: doc._id }, { $set: { slug: candidate } });
};

// @ts-ignore - mongoose pre validate hook
productSchema.pre('validate', async function (next: (err?: Error) => void) {
  if (!this.sku) {
    this.sku = generateSkuFromName(this.name || 'SKU');
  }

  if (this.name && (!this.slug || isGenericSlug(this.slug))) {
    const baseSlug = slugifyProductName(this.name) || 'product';
    let candidate = baseSlug;
    let suffix = 1;
    const ProductModel = this.constructor as Model<IProduct>;

    while (await ProductModel.exists({ slug: candidate, _id: { $ne: this._id } })) {
      suffix += 1;
      candidate = `${baseSlug}-${suffix}`;
    }

    this.slug = candidate;
  }

  if (this.isPublished) {
    if (!this.name) {
      return next(new Error('Product name is required for published products.'));
    }
    if (this.price == null) {
      return next(new Error('Price is required for published products.'));
    }
    if (!this.category) {
      return next(new Error('Category is required for published products.'));
    }
    if (!this.images || this.images.length === 0) {
      return next(new Error('At least one product image is required for published products.'));
    }
  }
  next();
});

productSchema.post('findOne', async function (doc: IProduct | null) {
  const ProductModel = this.model as Model<IProduct>;
  await ensureSlugOnRead(doc, ProductModel);
});

productSchema.post('find', async function (docs: IProduct[]) {
  const ProductModel = this.model as Model<IProduct>;
  await Promise.all(docs.map((doc) => ensureSlugOnRead(doc, ProductModel)));
});

productSchema.virtual('formattedPrice').get(function () {
  return '$' + this.price.toFixed(2);
});

productSchema.methods.getMetadataObject = function () {
  const obj: Record<string, unknown> = {};
  if (this.metadata) {
    this.metadata.forEach((value: unknown, key: string) => {
      obj[key] = value;
    });
  }
  return obj;
};

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

export const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>('Product', productSchema);
export default Product;
