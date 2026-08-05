# 石相 StoneLens — EdgeOne 部署版

这是 StoneLens 的轻量网站部署仓库。它保留浏览器端 ONNX 识别模型、5521 条参考特征索引、参考图片、3D 模型、产地地图、PWA 与 DeepSeek 问答接口，不包含训练数据集、PyTorch 训练模型和离线训练脚本。

## EdgeOne Pages 配置

- 框架：Next.js
- Node.js：22
- 安装命令：`npm ci`
- 构建命令：`npm run build`
- 根目录：`/`
- 生产分支：`main`
- 加速区域：全球可用区（含中国大陆）

在项目环境变量中添加加密变量 `DEEPSEEK_API_KEY`，不要将真实密钥写入仓库。
首次部署获得项目域名后，可选填 `NEXT_PUBLIC_SITE_URL=https://你的项目域名`，用于生成正确的社交分享预览地址。

## 本地运行

```bash
npm ci
npm run dev
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
