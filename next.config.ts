import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // Build a standalone server bundle (smaller, no node_modules copy)

  // Production optimizations for high-traffic scalability
  poweredByHeader: false, // Don't leak "X-Powered-By: Next.js" header
  compress: true, // Enable gzip compression (default true, but explicit for clarity)

  typescript: {
    ignoreBuildErrors: true, // Tolerant build for iterative dev
  },
  eslint: {
    ignoreDuringBuilds: true, // Don't block production builds on lint (run separately in CI)
  },

  reactStrictMode: false,

  // Image optimization (serves responsive, optimized images via CDN in prod)
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 3600, // 1h cache for optimized images
    remotePatterns: [
      { protocol: "https", hostname: "**" }, // allow any remote image (gifs/banners from advertiser URLs)
    ],
  },

  // HTTP headers for caching, security and performance
  async headers() {
    return [
      {
        // Static assets: aggressive caching (1 year) — CDN-friendly
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // Public images and logo
        source: "/:path*(.png|.jpg|.jpeg|.gif|.webp|.svg|.ico)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
      {
        // Security headers (applied to all routes)
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },

  // Experimental: optimize package bundling for faster cold starts
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion", "recharts"],
  },
};

export default nextConfig;
