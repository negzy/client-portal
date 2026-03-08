/** @type {import('next').NextConfig} */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''; // e.g. '/client-portal' for thecredithub.com/client-portal

const nextConfig = {
  reactStrictMode: true,
  ...(basePath && { basePath }),
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

module.exports = nextConfig;
