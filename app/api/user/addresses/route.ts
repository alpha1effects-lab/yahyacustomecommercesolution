import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/user';

export async function GET() {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session?.user as any;

  if (!user?.userId || user.role !== 'user') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const dbUser = await User.findById(user.userId).select('addresses').lean();
    return NextResponse.json(dbUser?.addresses || []);
  } catch (error) {
    console.error('[user/addresses] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session?.user as any;

  if (!user?.userId || user.role !== 'user') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { label, fullName, phone, address, city, postalCode, isDefault } = body;

    if (!fullName || !phone || !address || !city) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectDB();
    const dbUser = await User.findById(user.userId);
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (isDefault) {
      dbUser.addresses.forEach((addr: any) => (addr.isDefault = false));
    }

    dbUser.addresses.push({
      label: label || 'Home',
      fullName,
      phone,
      address,
      city,
      postalCode: postalCode || '',
      isDefault: isDefault || dbUser.addresses.length === 0,
    });

    await dbUser.save();
    return NextResponse.json(dbUser.addresses, { status: 201 });
  } catch (error) {
    console.error('[user/addresses] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session?.user as any;

  if (!user?.userId || user.role !== 'user') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { addressId, label, fullName, phone, address, city, postalCode, isDefault } = body;

    if (!addressId) {
      return NextResponse.json({ error: 'Address ID required' }, { status: 400 });
    }

    await connectDB();
    const dbUser = await User.findById(user.userId);
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const addr = (dbUser.addresses as any).id(addressId);
    if (!addr) return NextResponse.json({ error: 'Address not found' }, { status: 404 });

    if (isDefault) {
      dbUser.addresses.forEach((a: any) => (a.isDefault = false));
    }

    if (label !== undefined) addr.label = label;
    if (fullName !== undefined) addr.fullName = fullName;
    if (phone !== undefined) addr.phone = phone;
    if (address !== undefined) addr.address = address;
    if (city !== undefined) addr.city = city;
    if (postalCode !== undefined) addr.postalCode = postalCode;
    if (isDefault !== undefined) addr.isDefault = isDefault;

    await dbUser.save();
    return NextResponse.json(dbUser.addresses);
  } catch (error) {
    console.error('[user/addresses] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session?.user as any;

  if (!user?.userId || user.role !== 'user') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const addressId = searchParams.get('id');

    if (!addressId) {
      return NextResponse.json({ error: 'Address ID required' }, { status: 400 });
    }

    await connectDB();
    const dbUser = await User.findById(user.userId);
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const addr = (dbUser.addresses as any).id(addressId);
    if (!addr) return NextResponse.json({ error: 'Address not found' }, { status: 404 });

    const wasDefault = addr.isDefault;
    addr.deleteOne();

    if (wasDefault && dbUser.addresses.length > 0) {
      dbUser.addresses[0].isDefault = true;
    }

    await dbUser.save();
    return NextResponse.json(dbUser.addresses);
  } catch (error) {
    console.error('[user/addresses] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
