import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import SiteSettings from '@/lib/models/siteSettings';
import Product from '@/lib/models/product';

async function getAdminSession() {
  const session = await auth();
  if (!session || (session.user as any)?.role !== 'admin') {
    return null;
  }
  return session;
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  let settings: any = await SiteSettings.findOne().lean();
  if (!settings) {
    const created = await SiteSettings.create({});
    settings = created.toObject();
  }

  // Populate products for sections
  let newOffersProducts: any[] = [];
  let bestOffersProducts: any[] = [];
  let productsYouLoveProducts: any[] = [];

  if (settings.newOffersProductIds?.length) {
    newOffersProducts = await Product.find({ _id: { $in: settings.newOffersProductIds } }).lean();
  }
  if (settings.bestOffersProductIds?.length) {
    bestOffersProducts = await Product.find({ _id: { $in: settings.bestOffersProductIds } }).lean();
  }
  if (settings.productsYouLoveProductIds?.length) {
    productsYouLoveProducts = await Product.find({ _id: { $in: settings.productsYouLoveProductIds } }).lean();
  }

  return NextResponse.json({
    ...settings,
    newOffersProducts,
    bestOffersProducts,
    productsYouLoveProducts,
  });
}

export async function PUT(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const body = await request.json();

  let settings = await SiteSettings.findOne();
  if (!settings) {
    settings = new SiteSettings({});
  }

  if (body.sections) settings.sections = body.sections;
  if (body.heroImage) settings.heroImage = body.heroImage;
  if (body.heroSlides) settings.heroSlides = body.heroSlides;
  if (body.heroSlideIntervalSeconds) settings.heroSlideIntervalSeconds = body.heroSlideIntervalSeconds;
  if (body.megaMenu) settings.megaMenu = body.megaMenu;
  if (body.announcementText) settings.announcementText = body.announcementText;
  if (body.newOffersProductIds) settings.newOffersProductIds = body.newOffersProductIds;
  if (body.bestOffersProductIds) settings.bestOffersProductIds = body.bestOffersProductIds;
  if (body.productsYouLoveProductIds) settings.productsYouLoveProductIds = body.productsYouLoveProductIds;
  if (body.reviews) settings.reviews = body.reviews;
  if (body.footer) settings.footer = body.footer;
  if (body.whatsappNumber !== undefined) settings.whatsappNumber = body.whatsappNumber;
  if (body.paymentMethodTexts !== undefined) settings.paymentMethodTexts = body.paymentMethodTexts;

  await settings.save();
  return NextResponse.json(settings);
}
