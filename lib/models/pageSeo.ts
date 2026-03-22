import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IPageSeo extends Document {
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

const pageSeoSchema = new Schema<IPageSeo>(
  {
    pagePath: { type: String, required: true, unique: true },
    displayName: { type: String, required: true },
    metaTitle: { type: String, default: '' },
    metaDescription: { type: String, default: '' },
    metaKeywords: { type: String, default: '' },
    canonicalUrl: { type: String, default: '' },
    ogTitle: { type: String, default: '' },
    ogDescription: { type: String, default: '' },
    ogImage: { type: String, default: '' },
    ogType: { type: String, default: 'website' },
    robots: {
      index: { type: Boolean, default: true },
      follow: { type: Boolean, default: true },
    },
    jsonLd: { type: String, default: '' },
  },
  { timestamps: true }
);

export const PageSeo: Model<IPageSeo> =
  mongoose.models.PageSeo || mongoose.model<IPageSeo>('PageSeo', pageSeoSchema);
export default PageSeo;
