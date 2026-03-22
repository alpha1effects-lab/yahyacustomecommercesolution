import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/lib/models/order';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderNumber = searchParams.get('orderNumber');
  const email = searchParams.get('email');

  if (!orderNumber || !email) {
    return NextResponse.json({ error: 'Missing order number or email' }, { status: 400 });
  }

  await dbConnect();
  const order = await (Order as any).findByOrderNumber
    ? await (Order as any).findByOrderNumber(orderNumber)
    : await Order.findOne({ orderNumber: orderNumber.toUpperCase() });

  if (order && order.customer?.email !== email) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  return NextResponse.json({
    _id: order._id,
    orderNumber: order.orderNumber,
    status: order.status,
    total: order.total,
    createdAt: order.createdAt,
    trackingNumber: order.trackingNumber || '',
    estimatedDelivery: order.estimatedDelivery || '',
    items: order.items,
  });
}
