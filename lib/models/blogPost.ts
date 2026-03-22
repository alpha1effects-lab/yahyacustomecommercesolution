import mongoose, { Schema, Model, Document } from 'mongoose';
import { estimateReadingTimeFromHtml, slugify } from '@/lib/utils/blogUtils';
import '@/lib/models/blogCategory';
import '@/lib/models/blogTag';

export type BlogPostStatus = 'draft' | 'published';

export interface IBlogPost extends Document {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage?: string;
  status: BlogPostStatus;
  category: mongoose.Types.ObjectId;
  tags: mongoose.Types.ObjectId[];
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  robots?: { index?: boolean; follow?: boolean };
  readingTimeMinutes?: number;
  publishedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const blogPostSchema = new Schema<IBlogPost>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    content: { type: String, default: '' },
    excerpt: { type: String, default: '' },
    featuredImage: { type: String, default: '' },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    category: { type: Schema.Types.ObjectId, ref: 'BlogCategory' },
    tags: [{ type: Schema.Types.ObjectId, ref: 'BlogTag' }],
    metaTitle: { type: String, default: '' },
    metaDescription: { type: String, default: '' },
    ogImage: { type: String, default: '' },
    canonicalUrl: { type: String, default: '' },
    ogTitle: { type: String, default: '' },
    ogDescription: { type: String, default: '' },
    robots: {
      index: { type: Boolean, default: true },
      follow: { type: Boolean, default: true },
    },
    readingTimeMinutes: { type: Number, default: 0 },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

blogPostSchema.pre('validate', function (this: IBlogPost) {
  if (!this.slug && this.title) {
    this.slug = slugify(this.title);
  }

  const readingTime = estimateReadingTimeFromHtml(this.content || '');
  this.readingTimeMinutes = readingTime.minutes;

  if (this.status === 'published') {
    if (!this.title) {
      throw new Error('Title is required for published posts.');
    }
    if (!this.content) {
      throw new Error('Content is required for published posts.');
    }
    if (!this.category) {
      throw new Error('Category is required for published posts.');
    }
    if (!this.publishedAt) {
      this.publishedAt = new Date();
    }
  }
});

export const BlogPost: Model<IBlogPost> =
  mongoose.models.BlogPost || mongoose.model<IBlogPost>('BlogPost', blogPostSchema);

export default BlogPost;
