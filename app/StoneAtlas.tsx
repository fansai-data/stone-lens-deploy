"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  englishDescription: string;
  cover: string;
}> = [
  /* 优化：三个主分类各自使用用户提供的视觉封面。 */
  { domain: "gemstone", count: 87, name: "彩色宝石", english: "COLORED GEMSTONES", description: "从钻石、红蓝宝石到小众彩宝", englishDescription: "From diamonds and classic sapphires to niche colored gems", cover: sitePath("/atlas-covers/gemstones-cover.webp") },
  { domain: "jade_raw", count: 10, name: "玉石原石", english: "RAW JADE", description: "保留皮壳、纹理与天然形态", englishDescription: "Rough jade with natural skin, texture and raw form", cover: sitePath("/atlas-covers/jade-raw-cover.webp") },
  { domain: "common_rock", count: 9, name: "普通岩石", english: "COMMON ROCKS", description: "帮助排除外观相近的普通石头", englishDescription: "Common rocks used as negative samples for comparison", cover: sitePath("/atlas-covers/common-rock-cover.webp") },
];

const englishHardness = (value: string) => value
  .replaceAll("暂无可靠统一数值", "No reliable unified value")
  .replaceAll("随组成矿物而变化", "Varies by mineral composition")
  .replaceAll("方向相关", "direction-dependent")
  .replaceAll("莫氏约", "Mohs approx. ")
  .replaceAll("莫氏", "Mohs");

export default function StoneAtlas({ language = "zh" }: { language?: "zh" | "en" }) {
  const isEnglish = language === "en";
  const [items, setItems] = useState<AtlasItem[]>([]);
  const [activeDomain, setActiveDomain] = useState<StoneDomain | null>(null);
  /* 优化：展开图鉴后支持按中英文快速搜索，方便在 106 个类别中定位石种。 */
  const [atlasQuery, setAtlasQuery] = useState("");
  /* 优化：图鉴数据滚动到模块附近才加载，避免首页首屏立刻请求 106 类元数据。 */
  const [atlasVisible, setAtlasVisible] = useState(false);
  /* 优化：图鉴详情分页渲染，每次最多显示 24 个，降低一次性渲染压力。 */
  const [visibleLimit, setVisibleLimit] = useState(24);
  const atlasRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = atlasRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAtlasVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "420px 0px" },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!atlasVisible) return;
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
  }, [atlasVisible]);

  const visibleItems = useMemo(
    () => activeDomain ? items.filter((item) => item.domain === activeDomain) : [],
    [activeDomain, items],
  );
  const filteredItems = useMemo(() => {
    const query = atlasQuery.trim().toLowerCase();
    if (!query) return visibleItems;
    return visibleItems.filter((item) => {
      const chinese = isEnglish ? "" : chineseNameForStone(item.className).toLowerCase();
      const english = item.className.toLowerCase();
      return chinese.includes(query) || english.includes(query);
    });
  }, [atlasQuery, isEnglish, visibleItems]);
  const displayedItems = useMemo(
    () => filteredItems.slice(0, visibleLimit),
    [filteredItems, visibleLimit],
  );
  const activeCategory = categories.find((category) => category.domain === activeDomain);

  /* 优化：详情底部也可一键收起，并平滑回到图鉴标题。 */
  const collapseAtlas = () => {
    setActiveDomain(null);
    window.setTimeout(() => document.getElementById("atlas")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };

  return (
    <section className="atlas-section" id="atlas" ref={atlasRef}>
      <div className="atlas-heading">
        <div>
          <span className="eyebrow">STONE ATLAS</span>
          <h2>{isEnglish ? "Stone Atlas" : "石种图鉴"}</h2>
        </div>
        {/* 优化 */}
        <p>{isEnglish ? "Browse 87 gemstone categories, 10 raw jade categories and 9 common rock categories. Upload an image to start visual matching." : "覆盖 87 种宝石、10 种玉石原石和 9 种岩石；AI 快速识别，上传图片即可识别。"}</p>
      </div>

      <div className="atlas-category-grid">
        {categories.map((category) => (
          <button
            className={`atlas-category-card ${activeDomain === category.domain ? "active" : ""}`}
            key={category.domain}
            onClick={() => {
              setAtlasQuery("");
              setVisibleLimit(24);
              setActiveDomain((current) => current === category.domain ? null : category.domain);
            }}
            aria-expanded={activeDomain === category.domain}
          >
            {/* 优化：封面图位于文字下方，CSS 渐变遮罩保证信息可读。 */}
            <img className="atlas-category-cover" src={category.cover} alt="" aria-hidden="true" />
            <span>{category.english}</span>
            <b><strong>{category.count}</strong> {isEnglish ? category.english.toLowerCase() : `种 ${category.name}`}</b>
            <small>{isEnglish ? category.englishDescription : category.description}</small>
            <i>{activeDomain === category.domain ? (isEnglish ? "Collapse −" : "收起详情 −") : (isEnglish ? "Open atlas +" : "展开图鉴 +")}</i>
          </button>
        ))}
      </div>

      {activeDomain && (
        <div className="atlas-details">
          <div className="atlas-details-head">
            <div><span>{activeCategory?.english}</span><h3>{isEnglish ? activeCategory?.english.replaceAll("_", " ") : activeCategory?.name}</h3></div>
            <b>{atlasQuery ? `${filteredItems.length} / ${visibleItems.length} ${isEnglish ? "categories" : "个类别"}` : `${visibleItems.length} ${isEnglish ? "categories" : "个类别"}`}</b>
          </div>
          <div className="atlas-search-row">
            <label>
              <span>{isEnglish ? "QUICK SEARCH" : "快速查找 · QUICK SEARCH"}</span>
              <input
                value={atlasQuery}
                onChange={(event) => {
                  /* 优化：搜索词变化时回到首批 24 个，避免上一次“加载更多”造成瞬时渲染过多。 */
                  setVisibleLimit(24);
                  setAtlasQuery(event.target.value);
                }}
                placeholder={isEnglish ? "Search in English, e.g. Ruby / Quartz / Jade" : "输入中文或英文，例如：红宝石 / Ruby / Quartz"}
              />
            </label>
            {atlasQuery && <button type="button" onClick={() => { setVisibleLimit(24); setAtlasQuery(""); }}>{isEnglish ? "Clear" : "清除"}</button>}
          </div>
          <div className="atlas-stone-grid">
            {displayedItems.map((item) => (
              <article key={`${item.domain}-${item.className}`}>
                <img src={item.image} alt={`${item.className} reference`} loading="lazy" decoding="async" />
                <div><b>{isEnglish ? item.className : chineseNameForStone(item.className)}</b><small>{isEnglish ? "" : item.className}</small></div>
                {/* 优化：图鉴卡片悬停时显示硬度和主要产地，增强 106 类图鉴的知识属性。 */}
                <aside className="atlas-stone-hover">
                  <span>{isEnglish ? "HARDNESS" : "硬度 · HARDNESS"}</span>
                  <b>{isEnglish ? englishHardness(hardnessForStone(item.domain, item.className)) : hardnessForStone(item.domain, item.className)}</b>
                  <span>{isEnglish ? "ORIGINS" : "主要产地 · ORIGINS"}</span>
                  <p>
                    {countriesForStone(item.domain, item.className)
                      /* 优化：图鉴悬停层只展示 1–2 个代表产地，避免信息过密压住图片。 */
                      .slice(0, 2)
                      .map((country) => isEnglish ? country : bilingualCountryName(country))
                      .join(" / ") || (isEnglish ? "Origin data unavailable" : "暂无产地资料")}
                  </p>
                </aside>
              </article>
            ))}
          </div>
          {filteredItems.length === 0 && (
            <div className="atlas-empty-result">
              <b>{isEnglish ? "No matching stone found" : "没有找到对应石种"}</b>
              <p>{isEnglish ? "Try a shorter keyword, such as Ruby, Quartz, Jade or Rock." : "可以尝试输入更短的关键词，例如 Ruby、Quartz、玉、岩石。"}</p>
            </div>
          )}
          {displayedItems.length < filteredItems.length && (
            <button className="atlas-load-more-button" onClick={() => setVisibleLimit((current) => current + 24)}>
              {isEnglish ? "Load more" : "加载更多"} · {displayedItems.length} / {filteredItems.length}
            </button>
          )}
          {/* 优化 */}
          <button className="atlas-collapse-button" onClick={collapseAtlas}>{isEnglish ? "Collapse ↑" : "收起详情 ↑"}</button>
        </div>
      )}
    </section>
  );
}
