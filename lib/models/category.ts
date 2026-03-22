import mongoose, { Schema, Model, Document } from 'mongoose';

interface CategoryAttribute {
  label: string;
  key: string;
  fieldType: 'text' | 'number' | 'select';
  options?: string[];
}

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  parent?: mongoose.Types.ObjectId | null;
  attributes: CategoryAttribute[];
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

const attributeSchema = new Schema<CategoryAttribute>(
  {
    label: { type: String, required: true },
    key: { type: String, required: true },
    fieldType: { type: String, enum: ['text', 'number', 'select'], default: 'text' },
    options: [{ type: String }],
  },
  { _id: false }
);

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: '' },
    parent: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    attributes: [attributeSchema],
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

categorySchema.pre('save', function (this: ICategory) {
  if (!this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
});

export const Category: Model<ICategory> = mongoose.models.Category || mongoose.model<ICategory>('Category', categorySchema);
export default Category;
