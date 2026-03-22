import mongoose, { Schema, Model, Document } from 'mongoose';

export interface INewsletter extends Document {
  email: string;
  isActive: boolean;
  subscribedAt: Date;
  unsubscribedAt?: Date | null;
  source: 'website' | 'checkout' | 'admin' | 'import';
}

const newsletterSchema = new Schema<INewsletter>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    isActive: { type: Boolean, default: true },
    subscribedAt: { type: Date, default: Date.now },
    unsubscribedAt: { type: Date, default: null },
    source: { type: String, default: 'website', enum: ['website', 'checkout', 'admin', 'import'] },
  },
  { timestamps: true }
);

newsletterSchema.index({ isActive: 1 });
newsletterSchema.index({ subscribedAt: -1 });

export const Newsletter: Model<INewsletter> =
  mongoose.models.Newsletter || mongoose.model<INewsletter>('Newsletter', newsletterSchema);
export default Newsletter;
