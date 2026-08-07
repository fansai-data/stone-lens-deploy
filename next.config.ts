/* StoneLens Next.js config — cache bust v2 */
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* 优化：生成标准 Next.js 产物，由 EdgeOne Pages 自动识别页面和 API 路由。 */
  /* 优化：GitHub Pages 使用静态导出和项目子路径；EdgeOne 主分支仍保持原有 API 路由。 */
  poweredByHeader: false,
  ...(process.env.NEXT_OUTPUT === "export" ? { output: "export", trailingSlash: true } : {}),
  ...(process.env.NEXT_PUBLIC_BASE_PATH
    ? { basePath: process.env.NEXT_PUBLIC_BASE_PATH, assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH }
    : {}),
};

export default nextConfig;
