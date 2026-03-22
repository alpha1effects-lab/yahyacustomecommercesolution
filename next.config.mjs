/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone", 
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
    ],
  },
  // WhatsApp webhook and Agent API routes are now handled natively by Next.js
  // See: /app/api/whatsapp/webhook/route.ts and /app/api/agent/*/route.ts
};

export default nextConfig;