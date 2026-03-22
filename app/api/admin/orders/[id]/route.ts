import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Order from '@/lib/models/order';
import Product from '@/lib/models/product';

async function getAdminSession() {
  const session = await auth();
  if (!session || (session.user as any)?.role !== 'admin') {
    return null;
  }
  return session;
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const { id } = await params;
  const body = await request.json();
  const order = await Order.findById(id);
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const previousStatus = order.status;

  if (body.status && body.status !== order.status) {
    order.status = body.status;
    order.statusHistory = order.statusHistory || [];
    order.statusHistory.push({ status: body.status, note: body.note || '', updatedAt: new Date() });

    // Stock reservation logic
    if (body.status === 'confirmed' && previousStatus === 'pending') {
      // Confirmed: deduct from actual stock and release reservation
      for (const item of order.items) {
        if (item.productId) {
          await Product.findByIdAndUpdate(item.productId, {
            $inc: { stock: -item.quantity, reservedStock: -item.quantity },
          });
        }
      }
    } else if (body.status === 'cancelled' && previousStatus !== 'cancelled') {
      // Cancelled: release reservation (if was pending) or restore stock (if was confirmed+)
      if (previousStatus === 'pending') {
        for (const item of order.items) {
          if (item.productId) {
            await Product.findByIdAndUpdate(item.productId, {
              $inc: { reservedStock: -item.quantity },
            });
          }
        }
      } else {
        // Was already confirmed/processing/shipped - restore actual stock
        for (const item of order.items) {
          if (item.productId) {
            await Product.findByIdAndUpdate(item.productId, {
              $inc: { stock: item.quantity },
            });
          }
        }
      }
    }
  }

  if (typeof body.trackingNumber === 'string') order.trackingNumber = body.trackingNumber;
  if (body.estimatedDelivery) order.estimatedDelivery = new Date(body.estimatedDelivery);
  if (typeof body.notes === 'string') order.notes = body.notes;

  await order.save();
  return NextResponse.json(order);
}
