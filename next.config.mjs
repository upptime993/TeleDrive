/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      // FIX: Naikkan body size limit untuk Server Actions
      bodySizeLimit: '8mb',
    },
  },
}

export default nextConfig
