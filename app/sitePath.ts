/* 优化：让同一套前端同时兼容根域名部署和 GitHub Pages 的项目子路径。 */
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "");

export const sitePath = (path: string) => {
  if (/^https?:\/\//.test(path)) return path;
  return `${basePath}${path.startsWith("/") ? path : `/${path}`}`;
};

export const isStaticDemo = process.env.NEXT_PUBLIC_STATIC_DEMO === "true";
