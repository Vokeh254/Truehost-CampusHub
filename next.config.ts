import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium", "bcryptjs"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "campus.truehost.cloud",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
  },
};

export default nextConfig;
