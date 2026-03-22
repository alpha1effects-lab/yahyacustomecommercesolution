import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IProductQA extends Document {
  productId: mongoose.Types.ObjectId;
  question: string;
  answer: string;
  order: number;
  createdAt: Date;
}

const productQASchema = new Schema<IProductQA>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    question: { type: String, required: true },
    answer: { type: String, required: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

productQASchema.index({ productId: 1, order: 1 });

export const ProductQA: Model<IProductQA> =
  mongoose.models.ProductQA || mongoose.model<IProductQA>('ProductQA', productQASchema);
export default ProductQA;
