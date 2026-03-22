import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Review from '@/lib/models/review';
import { auth } from '@/lib/auth';

// GET reviews for a product (public - only approved ones)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get('productId');

  if (!productId) {
    return NextResponse.json({ error: 'productId is required' }, { status: 400 });
  }

  try {
    await connectDB();
    const reviews = await Review.find({ product: productId, status: 'approved' })
      .sort({ createdAt: -1 })
      .lean();

    const stats = await Review.aggregate([
      { $match: { product: require('mongoose').Types.ObjectId.createFromHexString(productId), status: 'approved' } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          stars1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
          stars2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
          stars3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
          stars4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
          stars5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
        },
      },
    ]);

    return NextResponse.json({
      reviews: JSON.parse(JSON.stringify(reviews)),
      stats: stats[0] || { avgRating: 0, totalReviews: 0, stars1: 0, stars2: 0, stars3: 0, stars4: 0, stars5: 0 },
    });
  } catch (error) {
    console.error('[reviews] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST a new review (authenticated user only)
export async function POST(req: NextRequest) {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session?.user as any;

  if (!user?.userId || user.role !== 'user') {
    return NextResponse.json({ error: 'Login required' }, { status: 401 });
  }

  try {
    const { productId, rating, comment } = await req.json();

    if (!productId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Valid productId and rating (1-5) are required' }, { status: 400 });
    }

    await connectDB();

    // Check if user already reviewed this product
    const existing = await Review.findOne({ product: productId, user: user.userId });
    if (existing) {
      return NextResponse.json({ error: 'You have already reviewed this product' }, { status: 409 });
    }

    const review = await Review.create({
      product: productId,
      user: user.userId,
      userName: user.name || 'Anonymous',
      userEmail: user.email,
      rating,
      comment: comment || '',
      status: 'pending',
    });

    return NextResponse.json(JSON.parse(JSON.stringify(review)), { status: 201 });
  } catch (error) {
    console.error('[reviews] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
