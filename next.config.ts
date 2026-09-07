import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async headers() {
    return [
      {
        source: "/admin/manga",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-src 'self' https://reader.graywood.no;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
