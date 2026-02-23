/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'https', hostname: '**.r2.cloudflarestorage.com' },
      { protocol: 'https', hostname: '**.cloudflare.com' },
      { protocol: 'https', hostname: '**.supabase.co' }
    ]
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '8mb'
    }
  }
};

export default nextConfig;
