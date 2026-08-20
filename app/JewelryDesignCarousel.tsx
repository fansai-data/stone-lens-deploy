"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { chineseNameForStone } from "./stoneKnowledge";
import { sitePath } from "./sitePath";

type JewelryItem = { className: string; image: string };

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

const isJewelryItem = (value: unknown): value is JewelryItem =>
  typeof value === "object" &&
  value !== null &&
  "className" in value &&
  typeof value.className === "string" &&
  "image" in value &&
  typeof value.image === "string";

const loadJewelryItems = async (): Promise<JewelryItem[]> => {
  const response = await fetch(sitePath("/jewelry-design/manifest.json"));
  const manifest: unknown = await response.json();

  if (!Array.isArray(manifest) || !manifest.every(isJewelryItem)) {
    throw new Error("Invalid jewelry manifest");
  }

  return manifest.map((item) => ({ ...item, image: sitePath(item.image) }));
};

/* 优化：展示 Top‑5 相似石种中所有能够匹配到的首饰灵感图，最多五张。 */
export default function JewelryDesignCarousel({ gemNames, language = "zh" }: { gemNames: string[]; language?: "zh" | "en" }) {
  const [items, setItems] = useState<JewelryItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  /* 优化：首饰灵感区改为精品横向滑动，减少页面纵向占用。 */
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadJewelryItems()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoaded(true));
  }, []);

  const matchedItems = useMemo(() => {
    const requested = [...new Set(gemNames.map(normalize))];
    return requested
      .map((name) => items.find((item) => normalize(item.className) === name))
      .filter((item): item is JewelryItem => Boolean(item))
      .slice(0, 5);
  }, [gemNames, items]);

  if (!loaded) return null;
  const isEnglish = language === "en";
  if (!matchedItems.length) {
    return <section className="jewelry-carousel jewelry-empty"><span className="eyebrow">JEWELRY INSPIRATION</span><p>{isEnglish ? "No jewelry image is available for these Top‑5 matches yet" : "Top‑5 相似石种暂无对应首饰图"}</p></section>;
  }

  return (
    <section className="jewelry-carousel" aria-label={isEnglish ? "Top-5 matching jewelry inspiration" : "Top-5 相似石种首饰灵感图"}>
      <div className="jewelry-carousel-heading">
        <div><span className="eyebrow">TOP‑5 JEWELRY INSPIRATION</span><h3>{isEnglish ? "Jewelry Inspiration" : "宝石首饰灵感"}</h3></div>
        <div className="jewelry-carousel-actions">
          <small>{isEnglish ? "Matched to Top‑5 similar stones · Jewelry images are for reference only" : "对应 Top‑5 相似石种 · 首饰示意图仅供参考"}</small>
          <div>
            <button type="button" aria-label={isEnglish ? "Previous jewelry images" : "上一组首饰图"} onClick={() => trackRef.current?.scrollBy({ left: -360, behavior: "smooth" })}>←</button>
            <button type="button" aria-label={isEnglish ? "Next jewelry images" : "下一组首饰图"} onClick={() => trackRef.current?.scrollBy({ left: 360, behavior: "smooth" })}>→</button>
          </div>
        </div>
      </div>
      <div className="jewelry-inspiration-grid" ref={trackRef}>
        {matchedItems.map((item) => {
          const label = isEnglish ? `${item.className} Jewelry` : `${chineseNameForStone(item.className)}首饰 · ${item.className} Jewelry`;
          return (
            <figure key={item.className}>
              <img src={item.image} alt={label} loading="lazy" />
              <figcaption><b>{label}</b></figcaption>
            </figure>
          );
        })}
      </div>
    </section>
  );
}
