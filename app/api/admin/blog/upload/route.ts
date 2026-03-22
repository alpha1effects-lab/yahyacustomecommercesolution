import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { uploadToCloudinary } from '@/lib/cloudinary';

async function getAdminSession() {
  const session = await auth();
  if (!session || (session.user as any)?.role !== 'admin') {
    return null;
  }
  return session;
}

async function fileToBuffer(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  if (!file || file.size === 0) {
    return NextResponse.json({ error: 'File is required' }, { status: 400 });
  }
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Only images are supported' }, { status: 400 });
  }

  const buffer = await fileToBuffer(file);
  const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
  const result = await uploadToCloudinary(buffer, {
    folder: 'craft-store/blog',
    public_id: fileName,
    transformation: [{ width: 1600, height: 1600, crop: 'limit', quality: 'auto' }],
  });

  return NextResponse.json({ url: result.secure_url, publicId: result.public_id });
}
