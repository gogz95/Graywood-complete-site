import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.DOCKER_BUILD === "1" ? "standalone" : undefined,
  serverExternalPackages: ["exifr", "sharp", "archiver"],
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
