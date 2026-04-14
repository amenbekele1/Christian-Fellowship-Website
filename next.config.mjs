/** @type {import('next').NextConfig} */
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
        // Allow Jitsi Meet iframe only on the meeting page
        source: "/dashboard/bus-groups/:groupId/meeting",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-src https://meet.jit.si;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
