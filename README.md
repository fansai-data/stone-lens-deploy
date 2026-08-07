# 石相 StoneLens — Cloudflare Workers 部署版

这是 StoneLens 的轻量网站部署仓库。它保留浏览器端 ONNX 识别模型、5521 条参考特征索引、参考图片、3D 模型、产地地图、PWA 与 DeepSeek 问答接口，不包含训练数据集、PyTorch 训练模型和离线训练脚本。

## 技术栈

- Next.js + React
- OpenNext for Cloudflare
- TanStack React Query
- pnpm

生产域名为 `https://stone.xinyingapp.com`。DeepSeek 密钥通过 Cloudflare Worker Secret 注入，不要将真实密钥写入仓库。

## 本地运行

```bash
pnpm install
pnpm dev
```

## Cloudflare 验证与部署

```bash
pnpm cf-typegen
pnpm preview
pnpm run deploy
pnpm exec wrangler secret put DEEPSEEK_API_KEY
```

## 保留的识别资源

网页真实识别依赖以下运行时资源：

- `public/model/stonelens-mobilenetv2-features.onnx`
- `public/model/gallery-u8.bin`
- `public/model/gallery-scales-f32.bin`
- `public/model/gallery-metadata.json`
- `public/model/references/`
- `public/ort/`

完整训练数据、原始 PyTorch 模型和后端离线工具保存在 `stone_web_demo` 源码仓库中。
