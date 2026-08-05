"use client";

import { useEffect, useRef } from "react";
import type { StoneDomain } from "./stoneRecognition";
import { bilingualCountryName, countriesForStone } from "./stoneKnowledge";

type Chart = { setOption(option: unknown, options?: unknown): void; resize(): void; clear(): void; dispose(): void };
type ECharts = { init(element: HTMLElement, theme?: unknown, options?: unknown): Chart; registerMap(name: string, geo: unknown): void };

/* 优化：使用对称容器边距自动适配世界地图，避免 center、zoom 与布局参数叠加偏移。 */
const INITIAL_GEO_VIEW = {
  left: "4%",
  right: "4%",
  top: "5%",
  bottom: "5%",
  center: null,
  zoom: 1,
  aspectScale: 0.75,
  roam: true,
};

/* 优化：产地高亮配置 - 去掉白色背景框 */
/* 优化：产地区域保持静态柔和高亮，不再运行呼吸动画。 */
const originRegion = (name: string) => ({
  name,
  selected: true,
  label: {
    show: true,
    position: "top",
    distance: 8,
    color: "#553066",
    fontSize: 10,
    fontWeight: "600",
    backgroundColor: "transparent", // 关键：去掉白色背景
    textShadowColor: "rgba(255,255,255,0.9)",
    textShadowBlur: 4,
    padding: [2, 4],
  },
  itemStyle: {
    areaColor: "#b9698b",
    borderColor: "rgba(123,63,175,.48)",
    borderWidth: 1.1,
    shadowBlur: 4,
    shadowColor: "rgba(123,63,175,.12)",
  },
  emphasis: {
    itemStyle: { areaColor: "#8f4969", shadowBlur: 18, shadowColor: "rgba(123,63,175,.62)" },
    label: { show: true, position: "top", backgroundColor: "transparent" },
  },
});

async function ensureECharts(): Promise<ECharts> {
  const browserWindow = window as Window & { echarts?: ECharts };
  if (!browserWindow.echarts) {
    await new Promise<void>((resolve, reject) => {
      const source = "https://cdn.jsdelivr.net/npm/echarts@5.6.0/dist/echarts.min.js";
      const existing = document.querySelector<HTMLScriptElement>(`script[src="${source}"]`);
      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(), { once: true });
        return;
      }
      const script = document.createElement("script");
      script.src = source;
      script.onload = () => resolve();
      script.onerror = () => reject();
      document.head.appendChild(script);
    });
  }
  if (!browserWindow.echarts) throw new Error("ECharts unavailable");
  return browserWindow.echarts;
}

export default function GemOriginMiniMap({ domain, className }: { domain: StoneDomain; className: string }) {
  const root = useRef<HTMLDivElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const baseOptionRef = useRef<unknown>(null);

  useEffect(() => {
    if (!root.current) return;
    let chart: Chart | null = null;
    let resizeHandler: (() => void) | null = null;
    let active = true;
    const countries = countriesForStone(domain, className);

    Promise.all([
      ensureECharts(),
      fetch("/maps/world.geojson").then((response) => response.json()),
    ]).then(([echarts, geoJson]) => {
      if (!active || !root.current) return;
      echarts.registerMap("stonelens-gem-origin", geoJson);
      chart = echarts.init(root.current, undefined, { renderer: "canvas" });
      chartRef.current = chart;

      /* 优化：初始显示和重置共用同一个完整配置，确保位置完全一致。 */
      const baseOption = {
        tooltip: {
          trigger: "item",
          formatter: (params: { name?: string }) => params.name ? bilingualCountryName(params.name) : "",
        },
        geo: {
          map: "stonelens-gem-origin",
          ...INITIAL_GEO_VIEW,
          animationDurationUpdate: 450,
          animationEasingUpdate: "cubicOut",
          itemStyle: {
            areaColor: "#f2efeb",
            borderColor: "#d7d0c8",
            borderWidth: 0.8,
          },
          emphasis: {
            itemStyle: { areaColor: "#ead8df" },
            label: { show: true, position: "top", backgroundColor: "transparent" }
          },
          regions: countries.map((name) => originRegion(name)),
        },
      };
      baseOptionRef.current = baseOption;
      chart.setOption(baseOption);

      resizeHandler = () => chart?.resize();
      window.addEventListener("resize", resizeHandler);

      // 优化：延迟执行 resize 确保容器已完全渲染
      setTimeout(() => chart?.resize(), 100);

    }).catch(() => undefined);

    return () => {
      active = false;
      if (resizeHandler) window.removeEventListener("resize", resizeHandler);
      chart?.dispose();
      chartRef.current = null;
    };
  }, [className, domain]);

  /* 优化：先清除漫游变换，再恢复与初始状态相同的完整配置。 */
  const resetView = () => {
    const chart = chartRef.current;
    if (!chart || !baseOptionRef.current) return;
    chart.clear();
    chart.resize();
    chart.setOption(baseOptionRef.current);
  };

  return (
    <div className="gem-origin-map-shell">
      <div className="gem-origin-mini-map" ref={root} aria-label={`${className} 主要产地地图`} />
      <button className="map-reset-button" onClick={resetView}>重置视角</button>
    </div>
  );
}
