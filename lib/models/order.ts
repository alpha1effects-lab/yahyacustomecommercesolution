import mongoose, { Schema, Model, Document } from 'mongoose';

interface OrderItem {
  productId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  total: number;
  image?: string;
}

export interface IOrder extends Document {
  orderNumber: string;
  customer: {
    fullName: string;
    email: string;
    phone: string;
    phone2?: string;
    address: string;
    city: string;
    postalCode?: string;
  };
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: string;
  status: string;
  statusHistory: { status: string; note?: string; updatedAt: Date }[];
  notes?: string;
  trackingNumber?: string;
  estimatedDelivery?: Date;
  createdAt: Date;
}

const orderItemSchema = new Schema<OrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    total: { type: Number, required: true },
    image: String,
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    customer: {
      fullName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      phone2: { type: String, default: '' },
      address: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, default: '' },
    },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, default: 0 },
    total: { type: Number, required: true },
    paymentMethod: { type: String, default: 'Cash on Delivery' },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'out-for-delivery', 'delivered', 'cancelled'],
      default: 'pending',
    },
    statusHistory: [
      {
        status: String,
        note: String,
        updatedAt: { type: Date, default: Date.now },
      },
    ],
    notes: { type: String, default: '' },
    trackingNumber: { type: String, default: '' },
    estimatedDelivery: { type: Date, default: null },
  },
  { timestamps: true }
);

orderSchema.statics.generateOrderNumber = function () {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 5).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

orderSchema.statics.findByOrderNumber = function (orderNumber: string) {
  return this.findOne({ orderNumber: orderNumber.toUpperCase() });
};

export const Order: Model<IOrder> = mongoose.models.Order || mongoose.model<IOrder>('Order', orderSchema);
export default Order;
