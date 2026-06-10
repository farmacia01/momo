/** @type {import('next').NextConfig} */
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  importScripts: ["/push-sw.js"],
  disable: process.env.NODE_ENV === "development",
  exclude: [
    // App Router internal files — not served as public URLs, cause bad-precaching-response 404
    /app-build-manifest\.json$/,
    /middleware-manifest\.json$/,
    /middleware-build-manifest\.js$/,
    /interception-route-rewrite-manifest\.js$/,
  ],
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/wlnlmmvlhjazqifyetse\.supabase\.co\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'supabase-api',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 // 24 hours
        }
      }
    }
  ]
});

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizeCss: false,
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "recharts",
      "date-fns",
    ],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 dias
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
};

module.exports = withPWA(nextConfig);
