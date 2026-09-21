/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: "X-DNS-Prefetch-Control",   value: "on" },
  { key: "X-Frame-Options",          value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options",   value: "nosniff" },
  { key: "Referrer-Policy",          value: "strict-origin-when-cross-origin" },
  // Block geolocation globally. Camera and microphone are NOT blocked here because
  // the meeting page embeds Jitsi via iframe and needs them — browsers always ask
  // the user for permission before granting access regardless of this header.
  { key: "Permissions-Policy",       value: "geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        // Allow Jitsi Meet iframe only on the meeting page
        source: "/dashboard/bus-groups/:groupId/meeting",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-src https://meet.jit.si https://8x8.vc;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
