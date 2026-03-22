import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IBrand extends Document {
  name: string;
  slug: string;
  description?: string;
  backgroundImage?: string;
  logo?: string;
  isActive: boolean;
  displayOrder: number;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    canonicalUrl?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    robots?: { index?: boolean; follow?: boolean };
  };
}

const brandSchema = new Schema<IBrand>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: '' },
    backgroundImage: { type: String, default: '' },
    logo: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
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

brandSchema.pre('save', function (next) {
  if (!this.slug || this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  // next();
});

export const Brand: Model<IBrand> = mongoose.models.Brand || mongoose.model<IBrand>('Brand', brandSchema);
export default Brand;
