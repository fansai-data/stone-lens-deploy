"use client";

import { useEffect, useMemo, useState } from "react";
import { chineseNameForStone } from "./stoneKnowledge";

type JewelryItem = { className: string; image: string };

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

/* 优化：展示 Top‑5 相似石种中所有能够匹配到的首饰灵感图，最多五张。 */
export default function JewelryDesignCarousel({ gemNames }: { gemNames: string[] }) {
  const [items, setItems] = useState<JewelryItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/jewelry-design/manifest.json")
      .then((response) => response.json())
      .then((next: JewelryItem[]) => setItems(next))
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
  if (!matchedItems.length) {
    return <section className="jewelry-carousel jewelry-empty"><span className="eyebrow">JEWELRY INSPIRATION</span><p>Top‑5 相似石种暂无对应首饰图</p></section>;
  }

  return (
    <section className="jewelry-carousel" aria-label="Top-5 相似石种首饰灵感图">
      <div className="jewelry-carousel-heading">
        <div><span className="eyebrow">TOP‑5 JEWELRY INSPIRATION</span><h3>宝石首饰灵感</h3></div>
        <small>对应 Top‑5 相似石种 · 首饰示意图仅供参考</small>
      </div>
      <div className="jewelry-inspiration-grid">
        {matchedItems.map((item) => {
          const label = `${chineseNameForStone(item.className)}首饰 · ${item.className} Jewelry`;
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
