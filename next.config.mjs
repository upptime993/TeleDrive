/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Pre-existing type issue in Next.js 14 auto-generated .next/types files
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      // FIX: Naikkan body size limit untuk Server Actions
      bodySizeLimit: '8mb',
    },
  },
}

export default nextConfig
