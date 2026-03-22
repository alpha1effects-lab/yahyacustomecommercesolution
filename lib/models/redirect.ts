import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IRedirect extends Document {
  from: string;
  to: string;
  type: number;
  isActive: boolean;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const redirectSchema = new Schema<IRedirect>(
  {
    from: { type: String, required: true, unique: true, trim: true },
    to: { type: String, required: true, trim: true },
    type: { type: Number, enum: [301, 302], default: 301 },
    isActive: { type: Boolean, default: true },
    note: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Redirect: Model<IRedirect> =
  mongoose.models.Redirect || mongoose.model<IRedirect>('Redirect', redirectSchema);
export default Redirect;
