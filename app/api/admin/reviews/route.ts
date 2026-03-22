import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Review from '@/lib/models/review';
import { auth } from '@/lib/auth';

async function requireAdmin() {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session?.user as any;
  return user?.role === 'admin';
}

// GET all reviews for admin
export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const productId = searchParams.get('productId');

  try {
    await connectDB();
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (productId) filter.product = productId;

    const reviews = await Review.find(filter)
      .populate('product', 'name slug images')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(JSON.parse(JSON.stringify(reviews)));
  } catch (error) {
    console.error('[admin/reviews] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST - admin create a review for a product
export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { productId, rating, comment, userName, userEmail, status: reviewStatus } = await req.json();

    if (!productId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Valid productId and rating (1-5) required' }, { status: 400 });
    }

    await connectDB();
    const review = await Review.create({
      product: productId,
      userName: userName || 'Admin',
      userEmail: userEmail || 'admin@example.com',
      rating,
      comment: comment || '',
      status: reviewStatus || 'approved',
    });

    return NextResponse.json(JSON.parse(JSON.stringify(review)), { status: 201 });
  } catch (error) {
    console.error('[admin/reviews] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PUT - update review (approve, reject, edit)
export async function PUT(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { reviewId, status: newStatus, comment, rating, userName } = await req.json();

    if (!reviewId) {
      return NextResponse.json({ error: 'reviewId required' }, { status: 400 });
    }

    await connectDB();
    const update: Record<string, unknown> = {};
    if (newStatus) update.status = newStatus;
    if (comment !== undefined) update.comment = comment;
    if (rating) update.rating = rating;
    if (userName) update.userName = userName;

    const review = await Review.findByIdAndUpdate(reviewId, update, { new: true })
      .populate('product', 'name slug images')
      .lean();

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    return NextResponse.json(JSON.parse(JSON.stringify(review)));
  } catch (error) {
    console.error('[admin/reviews] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE a review
export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const reviewId = searchParams.get('id');

    if (!reviewId) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    await connectDB();
    await Review.findByIdAndDelete(reviewId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[admin/reviews] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
