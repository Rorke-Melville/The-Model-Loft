import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/The-Model-Loft",
  assetPrefix: "/The-Model-Loft/",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;