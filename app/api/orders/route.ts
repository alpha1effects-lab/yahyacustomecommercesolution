import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/lib/models/order';
import Product from '@/lib/models/product';

export async function POST(request: Request) {
  await dbConnect();
  const body = await request.json();

  const orderNumber = (Order as any).generateOrderNumber
    ? (Order as any).generateOrderNumber()
    : `ORD-${Date.now().toString(36).toUpperCase()}`;

  const order = await Order.create({
    orderNumber,
    items: body.items,
    customer: body.customer,
    subtotal: body.subtotal,
    deliveryFee: body.deliveryFee,
    total: body.total,
    paymentMethod: body.paymentMethod || 'Cash on Delivery',
    notes: body.notes || '',
    status: 'pending',
    statusHistory: [{ status: 'pending', note: 'Order placed', updatedAt: new Date() }],
  });

  // Reserve inventory (don't deduct yet - deduct on confirmation)
  for (const item of body.items) {
    if (item.productId) {
      const product = await Product.findById(item.productId);
      if (product) {
        const availableStock = product.stock - (product.reservedStock || 0);
        if (availableStock < item.quantity) {
          return NextResponse.json(
            { error: `Insufficient stock for ${item.name}. Available: ${availableStock}` },
            { status: 400 }
          );
        }
      }
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { reservedStock: item.quantity },
      });
    }
  }

  return NextResponse.json(order, { status: 201 });
}
