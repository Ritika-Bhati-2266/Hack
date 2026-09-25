import type { NextConfig } from "next";

// Single-service deploy (Render, Docker): Next.js server and the Express
// backend run in the same container. The browser only ever talks to the
// Next.js origin; Next's server proxies /api/* to the backend over
// localhost, so there's no CORS and no NEXT_PUBLIC_API_URL to configure.
// Override BACKEND_INTERNAL_URL if the backend ever runs as a separate
// service reachable at a different internal address.
const BACKEND_INTERNAL_URL =
  process.env.BACKEND_INTERNAL_URL || "http://localhost:3001";

const nextConfig: NextConfig = {
  // Dev on LAN (phone/other laptop via 10.173.13.9:3000): Next blocks
  // cross-origin dev assets (HMR/fonts) by default — allow the LAN host.
  allowedDevOrigins: ['10.173.13.9'],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_INTERNAL_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;