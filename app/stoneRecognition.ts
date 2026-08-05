import { sitePath } from "./sitePath";

export type StoneDomain = "gemstone" | "jade_raw" | "common_rock";

export type StoneMatch = {
  className: string;
  domain: StoneDomain;
  score: number;
  image: string;
};

export type StoneRecognitionResult = {
  best: StoneMatch;
  matches: StoneMatch[];
  referenceImage: string;
  referenceNumber: number;
  referenceCount: number;
};

type GalleryMetadata = {
  count: number;
  dimension: number;
  quantization_scale: number;
  domains: StoneDomain[];
  classes: string[];
  domain_ids: number[];
  class_ids: number[];
  references: Record<string, string[]>;
};

type OrtModule = {
  env: { wasm: { wasmPaths: string; numThreads: number } };
  InferenceSession: {
    create(path: string, options: Record<string, unknown>): Promise<OrtSession>;
  };
  Tensor: new (
    type: "float32",
    data: Float32Array,
    dims: number[],
  ) => unknown;
};

type OrtSession = {
  run(feeds: Record<string, unknown>): Promise<Record<string, { data: Float32Array }>>;
};

type RecognitionAssets = {
  ort: OrtModule;
  session: OrtSession;
  metadata: GalleryMetadata;
  vectors: Uint8Array;
  scales: Float32Array;
};

let assetsPromise: Promise<RecognitionAssets> | null = null;

async function loadAssets(): Promise<RecognitionAssets> {
  if (!assetsPromise) {
    assetsPromise = (async () => {
      // This ESM bundle is served locally with the site so recognition also
      // works without a third-party CDN at inference time.
      const runtimePath = sitePath("/ort/ort.wasm.bundle.min.mjs");
      const runtimeImport = new Function(
        "path",
        "return import(path)",
      ) as (path: string) => Promise<OrtModule>;
      const ort = await runtimeImport(runtimePath);
      ort.env.wasm.wasmPaths = sitePath("/ort/");
      ort.env.wasm.numThreads = globalThis.crossOriginIsolated
        ? Math.min(4, navigator.hardwareConcurrency || 1)
        : 1;

      const [session, metadataResponse, vectorResponse, scaleResponse] = await Promise.all([
        ort.InferenceSession.create(sitePath("/model/stonelens-mobilenetv2-features.onnx"), {
          executionProviders: ["wasm"],
          graphOptimizationLevel: "all",
        }),
        fetch(sitePath("/model/gallery-metadata.json")),
        fetch(sitePath("/model/gallery-u8.bin")),
        fetch(sitePath("/model/gallery-scales-f32.bin")),
      ]);
      if (!metadataResponse.ok || !vectorResponse.ok || !scaleResponse.ok) {
        throw new Error("识别资源下载失败，请检查网络后重试。");
      }
      const metadata = (await metadataResponse.json()) as GalleryMetadata;
      const vectors = new Uint8Array(await vectorResponse.arrayBuffer());
      const scales = new Float32Array(await scaleResponse.arrayBuffer());
      if (
        vectors.length !== metadata.count * metadata.dimension ||
        scales.length !== metadata.count
      ) {
        throw new Error("识别索引不完整，请刷新页面后重试。");
      }
      return { ort, session, metadata, vectors, scales };
    })().catch((error) => {
      assetsPromise = null;
      throw error;
    });
  }
  return assetsPromise;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("无法读取这张图片，请换一张后重试。"));
    image.src = url;
  });
}

async function preprocess(url: string): Promise<Float32Array> {
  const image = await loadImage(url);
  const canvas = document.createElement("canvas");
  canvas.width = 224;
  canvas.height = 224;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("当前浏览器无法处理图片画布。");
  context.drawImage(image, 0, 0, 224, 224);
  const pixels = context.getImageData(0, 0, 224, 224).data;
  const plane = 224 * 224;
  const tensor = new Float32Array(plane * 3);
  const means = [0.485, 0.456, 0.406];
  const standardDeviations = [0.229, 0.224, 0.225];
  for (let pixel = 0; pixel < plane; pixel += 1) {
    const rgbaOffset = pixel * 4;
    tensor[pixel] = (pixels[rgbaOffset] / 255 - means[0]) / standardDeviations[0];
    tensor[plane + pixel] =
      (pixels[rgbaOffset + 1] / 255 - means[1]) / standardDeviations[1];
    tensor[plane * 2 + pixel] =
      (pixels[rgbaOffset + 2] / 255 - means[2]) / standardDeviations[2];
  }
  return tensor;
}

function nextReference(key: string, references: string[]) {
  if (references.length <= 1) {
    return { image: sitePath(references[0] || ""), number: references.length ? 1 : 0 };
  }
  const storageKey = `stonelens-reference-${key}`;
  const previous = Number.parseInt(localStorage.getItem(storageKey) || "-1", 10);
  const index = (Number.isFinite(previous) ? previous + 1 : 0) % references.length;
  localStorage.setItem(storageKey, String(index));
  return { image: sitePath(references[index]), number: index + 1 };
}

function searchGallery(
  embedding: Float32Array,
  metadata: GalleryMetadata,
  vectors: Uint8Array,
  scales: Float32Array,
): StoneRecognitionResult {
  const bestByCategory = new Map<string, number>();
  const dimension = metadata.dimension;
  for (let row = 0; row < metadata.count; row += 1) {
    const offset = row * dimension;
    let dot = 0;
    for (let feature = 0; feature < dimension; feature += 1) {
      dot += embedding[feature] * vectors[offset + feature];
    }
    const score = (dot * scales[row]) / metadata.quantization_scale;
    const domain = metadata.domains[metadata.domain_ids[row]];
    const className = metadata.classes[metadata.class_ids[row]];
    const key = `${domain}::${className}`;
    if (score > (bestByCategory.get(key) ?? Number.NEGATIVE_INFINITY)) {
      bestByCategory.set(key, score);
    }
  }

  const matches = [...bestByCategory.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)
    .map(([key, score]) => {
      const separator = key.indexOf("::");
      const domain = key.slice(0, separator) as StoneDomain;
      const className = key.slice(separator + 2);
      return {
        className,
        domain,
        score,
        image: sitePath(metadata.references[key]?.[0] || ""),
      };
    });
  if (!matches.length) throw new Error("图库中没有可用的匹配结果。");
  const best = matches[0];
  const bestKey = `${best.domain}::${best.className}`;
  const bestReferences = metadata.references[bestKey] || [best.image];
  const selectedReference = nextReference(bestKey, bestReferences);
  return {
    best,
    matches,
    referenceImage: selectedReference.image,
    referenceNumber: selectedReference.number,
    referenceCount: bestReferences.length,
  };
}

export async function recognizeStone(imageUrl: string): Promise<StoneRecognitionResult> {
  const input = await preprocess(imageUrl);
  const assets = await loadAssets();
  const tensor = new assets.ort.Tensor("float32", input, [1, 3, 224, 224]);
  const output = await assets.session.run({ image: tensor });
  const embedding = output.embedding?.data;
  if (!embedding || embedding.length !== assets.metadata.dimension) {
    throw new Error("模型没有返回有效的特征向量。");
  }
  return searchGallery(embedding, assets.metadata, assets.vectors, assets.scales);
}
