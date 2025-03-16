import type { NextConfig } from "next";
import withPWA from 'next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['cgrpulazuyzmdwvrirrn.supabase.co'], // Allow images from Supabase storage
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cgrpulazuyzmdwvrirrn.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  }
};

// Wrap the Next.js config with PWA
const withPWAConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
});

// Apply the PWA wrapper to the Next.js config
export default withPWAConfig(nextConfig);
