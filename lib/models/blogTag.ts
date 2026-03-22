import mongoose, { Schema, Model, Document } from 'mongoose';
import { slugify } from '@/lib/utils/blogUtils';

export interface IBlogTag extends Document {
  name: string;
  slug: string;
}

const blogTagSchema = new Schema<IBlogTag>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
  },
  { timestamps: true }
);

blogTagSchema.pre('validate', function (this: IBlogTag) {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name);
  }
});

export const BlogTag: Model<IBlogTag> =
  mongoose.models.BlogTag || mongoose.model<IBlogTag>('BlogTag', blogTagSchema);

export default BlogTag;
