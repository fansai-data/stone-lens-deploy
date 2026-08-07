import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "./providers";
import { sitePath } from "./sitePath";

export const metadata: Metadata = {
  /* 优化 */
  title: "石相 StoneLens — AI 宝石发现与视觉匹配",
  description:
    "拍下手中的宝石、玉石原石或陌生石头，探索最相似的宝石家族、参考样本与典型属性。",
  manifest: sitePath("/manifest.webmanifest"),
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "石相",
  },
  metadataBase: new URL("https://stone.xinyingapp.com"),
  icons: {
    icon: sitePath("/images/diamond-logo.png"),
    shortcut: sitePath("/images/diamond-logo.png"),
    apple: sitePath("/apple-touch-icon.png"),
  },
  openGraph: {
    title: "石相 StoneLens",
    description: "从一颗未知，走进整个宝石世界。",
    type: "website",
    locale: "zh_CN",
    images: [{ url: "/og-white.png", width: 1200, height: 630, alt: "石相 StoneLens 宝石世界" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "石相 StoneLens",
    description: "从一颗未知，走进整个宝石世界。",
    images: ["/og-white.png"],
  },
};

/* 优化：Next.js 标准构建将移动端主题色放在 viewport 配置中。 */
export const viewport: Viewport = {
  themeColor: "#7b3faf",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
