import mongoose, { Schema, Model, Document } from 'mongoose';
import { slugify } from '@/lib/utils/blogUtils';

export interface IBlogCategory extends Document {
  name: string;
  slug: string;
  description?: string;
}

const blogCategorySchema = new Schema<IBlogCategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

blogCategorySchema.pre('validate', function (this: IBlogCategory) {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name);
  }
});

export const BlogCategory: Model<IBlogCategory> =
  mongoose.models.BlogCategory || mongoose.model<IBlogCategory>('BlogCategory', blogCategorySchema);

export default BlogCategory;
