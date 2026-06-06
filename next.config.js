/** @type {import('next').NextConfig} */
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  importScripts: ["/push-sw.js"],
  disable: process.env.NODE_ENV === "development",
  // Exclude Next.js internal files that return 404 on Vercel, preventing
  // Workbox bad-precaching-response errors that block SW installation.
  buildExcludes: [
    /app-build-manifest\.json$/,
    /middleware-manifest\.json$/,
    /react-loadable-manifest\.json$/,
  ],
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
