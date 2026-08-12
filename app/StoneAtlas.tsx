"use client";

import { useEffect, useMemo, useState } from "react";
import {
  bilingualCountryName,
  chineseNameForStone,
  countriesForStone,
  hardnessForStone,
} from "./stoneKnowledge";
import type { StoneDomain } from "./stoneRecognition";
import { sitePath } from "./sitePath";

type GalleryMetadata = {
  references: Record<string, string[]>;
};

type AtlasItem = {
  className: string;
  domain: StoneDomain;
  image: string;
};

const loadGalleryMetadata = async (): Promise<GalleryMetadata> => {
  const response = await fetch(sitePath("/model/gallery-metadata.json"));
  const metadata: unknown = await response.json();

  if (
    typeof metadata !== "object" ||
    metadata === null ||
    !("references" in metadata) ||
    typeof metadata.references !== "object" ||
    metadata.references === null ||
    !Object.values(metadata.references).every(
      (images) => Array.isArray(images) && images.every((image) => typeof image === "string"),
    )
  ) {
    throw new Error("Invalid gallery metadata");
  }

  return { references: metadata.references as Record<string, string[]> };
};

const categories: Array<{
  domain: StoneDomain;
  count: number;
  name: string;
  english: string;
  description: string;
  cover: string;
}> = [
  /* 优化：三个主分类各自使用用户提供的视觉封面。 */
  { domain: "gemstone", count: 87, name: "彩色宝石", english: "COLORED GEMSTONES", description: "从钻石、红蓝宝石到小众彩宝", cover: sitePath("/atlas-covers/gemstones-cover.webp") },
  { domain: "jade_raw", count: 10, name: "玉石原石", english: "RAW JADE", description: "保留皮壳、纹理与天然形态", cover: sitePath("/atlas-covers/jade-raw-cover.webp") },
  { domain: "common_rock", count: 9, name: "普通岩石", english: "COMMON ROCKS", description: "帮助排除外观相近的普通石头", cover: sitePath("/atlas-covers/common-rock-cover.webp") },
];

export default function StoneAtlas() {
  const [items, setItems] = useState<AtlasItem[]>([]);
  const [activeDomain, setActiveDomain] = useState<StoneDomain | null>(null);
  /* 优化：展开图鉴后支持按中英文快速搜索，方便在 106 个类别中定位石种。 */
  const [atlasQuery, setAtlasQuery] = useState("");

  useEffect(() => {
    loadGalleryMetadata()
      .then((metadata) => {
        const next = Object.entries(metadata.references).map(([key, images]) => {
          const separator = key.indexOf("::");
          const domain = key.slice(0, separator) as StoneDomain;
          const className = key.slice(separator + 2);
          return {
            className,
            domain,
            image: images[0].replace("/model/references/", sitePath("/atlas-thumbs/")),
          };
        });
        setItems(next);
      })
      .catch(() => setItems([]));
  }, []);

  const visibleItems = useMemo(
    () => activeDomain ? items.filter((item) => item.domain === activeDomain) : [],
    [activeDomain, items],
  );
  const filteredItems = useMemo(() => {
    const query = atlasQuery.trim().toLowerCase();
    if (!query) return visibleItems;
    return visibleItems.filter((item) => {
      const chinese = chineseNameForStone(item.className).toLowerCase();
      const english = item.className.toLowerCase();
      return chinese.includes(query) || english.includes(query);
    });
  }, [atlasQuery, visibleItems]);
  const activeCategory = categories.find((category) => category.domain === activeDomain);

  /* 优化：详情底部也可一键收起，并平滑回到图鉴标题。 */
  const collapseAtlas = () => {
    setActiveDomain(null);
    window.setTimeout(() => document.getElementById("atlas")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };

  return (
    <section className="atlas-section" id="atlas">
      <div className="atlas-heading">
        <div>
          <span className="eyebrow">STONE ATLAS</span>
          <h2>石种图鉴</h2>
        </div>
        {/* 优化 */}
        <p>覆盖 87 种宝石、10 种玉石原石和 9 种岩石；AI 快速识别，上传图片即可识别。</p>
      </div>

      <div className="atlas-category-grid">
        {categories.map((category) => (
          <button
            className={`atlas-category-card ${activeDomain === category.domain ? "active" : ""}`}
            key={category.domain}
            onClick={() => {
              setAtlasQuery("");
              setActiveDomain((current) => current === category.domain ? null : category.domain);
            }}
            aria-expanded={activeDomain === category.domain}
          >
            {/* 优化：封面图位于文字下方，CSS 渐变遮罩保证信息可读。 */}
            <img className="atlas-category-cover" src={category.cover} alt="" aria-hidden="true" />
            <span>{category.english}</span>
            <b><strong>{category.count}</strong> 种 {category.name}</b>
            <small>{category.description}</small>
            <i>{activeDomain === category.domain ? "收起详情 −" : "展开图鉴 +"}</i>
          </button>
        ))}
      </div>

      {activeDomain && (
        <div className="atlas-details">
          <div className="atlas-details-head">
            <div><span>{activeCategory?.english}</span><h3>{activeCategory?.name}</h3></div>
            <b>{atlasQuery ? `${filteredItems.length} / ${visibleItems.length} 个类别` : `${visibleItems.length} 个类别`}</b>
          </div>
          <div className="atlas-search-row">
            <label>
              <span>快速查找 · QUICK SEARCH</span>
              <input
                value={atlasQuery}
                onChange={(event) => setAtlasQuery(event.target.value)}
                placeholder="输入中文或英文，例如：红宝石 / Ruby / Quartz"
              />
            </label>
            {atlasQuery && <button type="button" onClick={() => setAtlasQuery("")}>清除</button>}
          </div>
          <div className="atlas-stone-grid">
            {filteredItems.map((item) => (
              <article key={`${item.domain}-${item.className}`}>
                <img src={item.image} alt={`${chineseNameForStone(item.className)} ${item.className}`} loading="lazy" decoding="async" />
                <div><b>{chineseNameForStone(item.className)}</b><small>{item.className}</small></div>
                {/* 优化：图鉴卡片悬停时显示硬度和主要产地，增强 106 类图鉴的知识属性。 */}
                <aside className="atlas-stone-hover">
                  <span>硬度 · HARDNESS</span>
                  <b>{hardnessForStone(item.domain, item.className)}</b>
                  <span>主要产地 · ORIGINS</span>
                  <p>
                    {countriesForStone(item.domain, item.className)
                      /* 优化：图鉴悬停层只展示 1–2 个代表产地，避免信息过密压住图片。 */
                      .slice(0, 2)
                      .map((country) => bilingualCountryName(country))
                      .join(" / ") || "暂无产地资料"}
                  </p>
                </aside>
              </article>
            ))}
          </div>
          {filteredItems.length === 0 && (
            <div className="atlas-empty-result">
              <b>没有找到对应石种</b>
              <p>可以尝试输入更短的关键词，例如 Ruby、Quartz、玉、岩石。</p>
            </div>
          )}
          {/* 优化 */}
          <button className="atlas-collapse-button" onClick={collapseAtlas}>收起详情 ↑</button>
        </div>
      )}
    </section>
  );
}
