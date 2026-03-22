import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper to convert File to Buffer
async function fileToBuffer(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// Helper to upload to Cloudinary
async function uploadToCloudinary(
  buffer: Buffer,
  resourceType: 'image' | 'video',
  fileName: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `craft-store/${resourceType}s`,
        resource_type: resourceType,
        public_id: fileName,
        ...(resourceType === 'image' && {
          transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }],
        }),
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result?.secure_url || '');
      }
    );
    uploadStream.end(buffer);
  });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Handle multiple images
    const images: string[] = [];
    const imageFiles = formData.getAll('images') as File[];
    
    // Validate image count
    if (imageFiles.length > 7) {
      return NextResponse.json({ error: 'Maximum 7 images allowed' }, { status: 400 });
    }

    // Validate and upload images
    for (const file of imageFiles) {
      if (!file || file.size === 0) continue;
      
      // Validate size (2MB = 2 * 1024 * 1024 bytes)
      if (file.size > 2 * 1024 * 1024) {
        return NextResponse.json({ error: `Image ${file.name} exceeds 2MB limit` }, { status: 400 });
      }

      // Validate type
      if (!file.type.startsWith('image/')) {
        return NextResponse.json({ error: `${file.name} is not a valid image` }, { status: 400 });
      }

      const buffer = await fileToBuffer(file);
      const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      const url = await uploadToCloudinary(buffer, 'image', fileName);
      images.push(url);
    }

    // Handle video
    let videoUrl = '';
    const videoFile = formData.get('video') as File | null;
    
    if (videoFile && videoFile.size > 0) {
      // Validate video size (30MB)
      if (videoFile.size > 30 * 1024 * 1024) {
        return NextResponse.json({ error: 'Video exceeds 30MB limit' }, { status: 400 });
      }

      // Validate type
      if (!videoFile.type.startsWith('video/')) {
        return NextResponse.json({ error: 'Invalid video file' }, { status: 400 });
      }

      const buffer = await fileToBuffer(videoFile);
      const fileName = `${Date.now()}_${videoFile.name.replace(/\s+/g, '_')}`;
      
      // Upload with duration validation (2 min = 120 seconds)
      videoUrl = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'craft-store/videos',
            resource_type: 'video',
            public_id: fileName,
            duration: { max: 120 }, // 2 minutes max
          },
          (error, result) => {
            if (error) {
              if (error.message?.includes('duration')) {
                reject(new Error('Video duration exceeds 2 minutes'));
              } else {
                reject(error);
              }
            } else {
              resolve(result?.secure_url || '');
            }
          }
        );
        uploadStream.end(buffer);
      });
    }

    return NextResponse.json({
      success: true,
      images,
      video: videoUrl,
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
