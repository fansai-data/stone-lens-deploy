/* StoneLens Next.js config — cache bust v2 */
import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  ...(process.env.NEXT_OUTPUT === "export" ? { output: "export", trailingSlash: true } : {}),
  ...(process.env.NEXT_PUBLIC_BASE_PATH
    ? { basePath: process.env.NEXT_PUBLIC_BASE_PATH, assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH }
    : {}),
};

export default nextConfig;

initOpenNextCloudflareForDev();
