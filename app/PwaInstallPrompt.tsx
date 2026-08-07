"use client";

import { useEffect, useState } from "react";

type DeferredInstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isAppleMobile() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<DeferredInstallPrompt | null>(null);
  const [platform, setPlatform] = useState<"ios" | "android" | null>(null);
  const [hidden, setHidden] = useState(true);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    /* 优化：仅在可安装的移动浏览器中展示提示，不打断桌面端浏览。 */
    if (isStandalone()) return;
    const dismissed = window.localStorage.getItem("stonelens-pwa-prompt-dismissed") === "true";
    if (isAppleMobile()) {
      if (dismissed) return;
      const animationFrame = window.requestAnimationFrame(() => {
        setPlatform("ios");
        setHidden(false);
      });
      return () => window.cancelAnimationFrame(animationFrame);
    }

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      if (!dismissed) {
        setDeferredPrompt(event as DeferredInstallPrompt);
        setPlatform("android");
        setHidden(false);
      }
    };
    const onInstalled = () => {
      setHidden(true);
      setDeferredPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    window.localStorage.setItem("stonelens-pwa-prompt-dismissed", "true");
    setHidden(true);
  };

  const install = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setInstalling(false);
    setHidden(true);
    setDeferredPrompt(null);
  };

  if (hidden || !platform) return null;

  return (
    <aside className="pwa-install-prompt" aria-live="polite">
      <span className="pwa-install-icon" aria-hidden="true">◇</span>
      <div>
        <b>将 StoneLens 添加到主屏幕</b>
        {platform === "ios" ? (
          <small>在 Safari 点击“分享”，再选择“添加到主屏幕”，即可像 App 一样打开。</small>
        ) : (
          <small>安装后可从手机桌面快速打开，获得更沉浸的全屏体验。</small>
        )}
      </div>
      {platform === "android" && (
        <button className="pwa-install-action" onClick={install} disabled={installing}>
          {installing ? "正在添加…" : "添加"}
        </button>
      )}
      <button className="pwa-install-close" aria-label="关闭安装提示" onClick={dismiss}>×</button>
    </aside>
  );
}
