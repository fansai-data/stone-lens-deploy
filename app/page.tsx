"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import dynamic from "next/dynamic";
import {
  recognizeStone,
  type StoneMatch,
  type StoneRecognitionResult,
} from "./stoneRecognition";
import GemKnowledgeQA from "./GemKnowledgeQA";
import GemOriginMiniMap from "./GemOriginMiniMap";
import MembershipView from "./MembershipView";
import StoneAtlas from "./StoneAtlas";
import BirthstoneStories from "./BirthstoneStories";
import JewelryDesignCarousel from "./JewelryDesignCarousel";
import PwaInstallPrompt from "./PwaInstallPrompt";
import { sitePath } from "./sitePath";
import ImageCropper from "./ImageCropper";
import {
  bilingualCountryName,
  crystalSystemForStone,
  chineseNameForStone,
  countriesForStone,
  domainEnglishNames,
  domainNames,
  hardnessForStone,
} from "./stoneKnowledge";

const GemModel3D = dynamic(() => import("./GemModel3D"), {
  ssr: false,
  loading: () => (
    <div className="three-gem-loading" aria-label="正在加载立体宝石模型">
      <span />
      <small>正在加载 3D 宝石</small>
    </div>
  ),
});

type Stage = "idle" | "ready" | "analyzing" | "result";
type QuerySource = "demo" | "upload" | null;
type LocalUser = { username: string; role: "admin" | "user" };
type LocalAccount = { username: string; passwordHash: string; createdAt: string };
type HistoryEntry = { id: string; time: string; chineseName: string; englishName: string; score: number; thumbnail: string };

/* 优化 */
const heroSlides = [
  { image: sitePath("/showcase/hero-emerald-hd.webp"), name: "祖母绿", english: "Emerald", type: "彩色宝石" },
  { image: sitePath("/showcase/hero-ruby-hd.webp"), name: "红宝石", english: "Ruby", type: "彩色宝石" },
  { image: sitePath("/showcase/hero-sapphire-hd.webp"), name: "蓝宝石", english: "Blue Sapphire", type: "彩色宝石" },
  { image: sitePath("/showcase/hero-jadeite-raw-hd.webp"), name: "翡翠原石", english: "Jadeite Raw", type: "玉石原石" },
  { image: sitePath("/showcase/hero-basalt-hd.webp"), name: "玄武岩", english: "Basalt", type: "常见岩石" },
];

/* 优化 */
const AMETRINE_QUERY_IMAGE = sitePath("/model/references/demo-user-ametrine-7.jpg");
const AMETRINE_REFERENCE_IMAGE = sitePath("/model/references/gemstone--Ametrine--1.webp");
const AMETRINE_DEMO: StoneRecognitionResult = {
  best: { className: "Ametrine", domain: "gemstone", score: 0.987, image: AMETRINE_REFERENCE_IMAGE },
  matches: [
    { className: "Ametrine", domain: "gemstone", score: 0.987, image: AMETRINE_REFERENCE_IMAGE },
    { className: "Amethyst", domain: "gemstone", score: 0.842, image: sitePath("/model/references/gemstone--Amethyst--1.webp") },
    { className: "Citrine", domain: "gemstone", score: 0.819, image: sitePath("/model/references/gemstone--Citrine--1.webp") },
    { className: "Quartz Lemon", domain: "gemstone", score: 0.764, image: sitePath("/model/references/gemstone--Quartz-Lemon--1.webp") },
    { className: "Quartz Smoky", domain: "gemstone", score: 0.711, image: sitePath("/model/references/gemstone--Quartz-Smoky--1.webp") },
  ],
  referenceImage: AMETRINE_REFERENCE_IMAGE,
  referenceNumber: 1,
  referenceCount: 1,
};

/* 优化：比赛静态版在浏览器内保存不可逆密码摘要，不保存明文密码。 */
/* 优化 */
function safeImagePath(path: string) {
  if (!path) return "";
  if (/^(https?:|blob:|data:)/.test(path)) return path;
  if (path.startsWith("/stone-lens-deploy/")) return path;
  if (/^(gemstone|jade_raw|common_rock)--.+\.(webp|jpe?g|png)$/i.test(path)) {
    return sitePath(`/model/references/${path}`);
  }
  return sitePath(path.startsWith("/") ? path : `/${path}`);
}

async function hashLocalPassword(password: string) {
  const bytes = new TextEncoder().encode(password);
  const digest = await window.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, "0")).join("");
}

function makeHistoryThumbnail(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const source = new Image();
    source.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 180;
      canvas.height = 180;
      const context = canvas.getContext("2d");
      if (!context) return reject(new Error("thumbnail unavailable"));
      const scale = Math.max(180 / source.width, 180 / source.height);
      const width = source.width * scale;
      const height = source.height * scale;
      context.drawImage(source, (180 - width) / 2, (180 - height) / 2, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.72));
    };
    source.onerror = () => reject(new Error("thumbnail unavailable"));
    source.src = url;
  });
}

function profileFor(match: StoneMatch) {
  const name = match.className.toLowerCase();
  const isRaw = match.domain !== "gemstone";
  let modelCut: "emerald" | "brilliant" | "cabochon" | "rough" = isRaw ? "rough" : "brilliant";
  if (/emerald|aquamarine|beryl|morganite|goshenite/.test(name)) modelCut = "emerald";
  if (/pearl|opal|jade|turquoise|malachite|lapis|moonstone|cat|coral/.test(name)) modelCut = "cabochon";

  /* 优化：玉石模型统一使用柔和浅绿色，和宝石、普通岩石形成清楚区分。 */
  let modelColor = match.domain === "jade_raw" ? "#3f8f64" : isRaw ? "#786d5d" : "#7b3faf";
  /* 优化：玉石使用上方专属色，不再被通用宝石配色覆盖。 */
  if (match.domain !== "jade_raw") {
    if (/ruby|garnet|almandine|pyrope|carnelian|red/.test(name)) modelColor = "#a71332";
    else if (/emerald|peridot|jade|malachite|green|tsavorite|hiddenite/.test(name)) modelColor = "#15966a";
    else if (/sapphire|lapis|iolite|kyanite|blue|benitoite|sodalite/.test(name)) modelColor = "#2455b9";
    else if (/amethyst|purple|tanzanite/.test(name)) modelColor = "#7651bb";
    else if (/citrine|golden|yellow|amber|sunstone|pyrite/.test(name)) modelColor = "#d99a2b";
    else if (/rose|pink|morganite|rhodo/.test(name)) modelColor = "#d8789c";
    else if (/onyx.black|smoky|basalt|shale|chert/.test(name)) modelColor = "#353942";
    else if (/agate|chalcedony|quartzite/.test(name)) modelColor = "#c46f46";
  }

  return {
    category: chineseNameForStone(match.className),
    english: match.className,
    domain: match.domain,
    className: match.className,
    modelCut,
    modelColor,
    hardness: hardnessForStone(match.domain, match.className),
    crystalSystem: crystalSystemForStone(match.domain, match.className),
    origins: countriesForStone(match.domain, match.className),
  };
}

export default function Home() {
  const [stage, setStage] = useState<Stage>("idle");
  const [queryImage, setQueryImage] = useState<string | null>(null);
  /* 优化：保留上传原图，允许识别前随时重新框选。 */
  const [originalQueryImage, setOriginalQueryImage] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [querySource, setQuerySource] = useState<QuerySource>(null);
  const [freeScans, setFreeScans] = useState(10);
  const [quotaReady, setQuotaReady] = useState(false);
  const [recognition, setRecognition] = useState<StoneRecognitionResult | null>(null);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  const [showMembership, setShowMembership] = useState(false);
  /* 优化：演示会员状态保存在当前设备，刷新页面后仍然有效。 */
  const [deviceMember, setDeviceMember] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const [referenceImageError, setReferenceImageError] = useState(false);
  const [openingIdentify, setOpeningIdentify] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [currentUser, setCurrentUser] = useState<LocalUser | null>(null);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showBackTop, setShowBackTop] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHeroIndex((value) => (value + 1) % heroSlides.length);
    }, 5200);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const storedQuota = window.localStorage.getItem("stonelens-free-scans");
    const storedUsername = window.localStorage.getItem("stonelens-current-user") || window.localStorage.getItem("stonelens-demo-user");
    const storedUser = storedUsername
      ? { username: storedUsername, role: storedUsername === "admin" ? "admin" : "user" } as LocalUser
      : null;
    const userQuota = storedUser?.role === "user"
      ? window.localStorage.getItem(`stonelens-free-scans-${storedUser.username}`) || window.localStorage.getItem("stonelens-user-free-scans")
      : window.localStorage.getItem("stonelens-free-scans");
    if (userQuota ?? storedQuota) {
      const parsed = Number(userQuota ?? storedQuota);
      if (Number.isFinite(parsed)) setFreeScans(Math.max(0, Math.min(10, parsed)));
    }
    setCurrentUser(storedUser);
    window.localStorage.removeItem("stonelens-demo-user");
    /* 优化：会员状态绑定已登录账号；访客不读取旧的设备级会员标记。 */
    setDeviceMember(storedUser?.role === "user" && window.localStorage.getItem(`stonelens-membership-active-${storedUser.username}`) === "true");
    window.localStorage.removeItem("stonelens-membership-active");
    try {
      setHistory(JSON.parse(window.localStorage.getItem("stonelens-history") || "[]"));
    } catch {
      setHistory([]);
    }
    setQuotaReady(true);
  }, []);

  useEffect(() => {
    if (!quotaReady || !currentUser || currentUser.role === "admin" || deviceMember) return;
    const key = currentUser.role === "user" ? `stonelens-free-scans-${currentUser.username}` : "stonelens-free-scans";
    window.localStorage.setItem(key, String(freeScans));
  }, [currentUser, deviceMember, freeScans, quotaReady]);

  useEffect(() => {
    const onScroll = () => setShowBackTop(window.scrollY > window.innerHeight * 0.9);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register(sitePath("/sw.js")).catch(() => undefined);
    }
    return () => {
      if (queryImage?.startsWith("blob:")) URL.revokeObjectURL(queryImage);
    };
  }, [queryImage]);

  const resultVisible = stage === "result" && recognition !== null;
  /* 优化 */
  /* 优化：访客永远不是会员；管理员或已开通会员的登录用户才拥有会员权限。 */
  const isMember = currentUser?.role === "admin" || (currentUser?.role === "user" && deviceMember);
  const hasUnlimitedScans = Boolean(currentUser) && isMember;
  const recognizedProfile = useMemo(
    () => (recognition ? profileFor(recognition.best) : null),
    [recognition],
  );
  const statusCopy = useMemo(() => {
    if (recognitionError) return recognitionError;
    if (stage === "ready") return "图片已准备好，请确认后开始识别";
    if (stage === "analyzing") return "正在提取图像特征，检索匹配中";
    if (!currentUser) return "访客模式仅可查看示例，登录后可上传识别";
    return "将石头放入识别框，拍摄或上传一张清晰照片";
  }, [currentUser, stage, recognitionError]);

  const chooseDemo = () => {
    if (queryImage?.startsWith("blob:")) URL.revokeObjectURL(queryImage);
    /* 优化 */
    setQueryImage(AMETRINE_QUERY_IMAGE);
    setOriginalQueryImage(null);
    setCropOpen(false);
    setQuerySource("demo");
    setRecognition(AMETRINE_DEMO);
    setRecognitionError(null);
    setReferenceImageError(false);
    setStage("result");
    window.setTimeout(() => {
      document.getElementById("identify")?.scrollIntoView({ behavior: "smooth" });
      if (!currentUser) setShowLoginPrompt(true);
    }, 50);
  };

  const openIdentifyArea = () => {
    if (openingIdentify) return;
    setOpeningIdentify(true);
    window.setTimeout(() => {
      document.getElementById("identify")?.scrollIntoView({ behavior: "smooth", block: "start" });
      setOpeningIdentify(false);
      /* 优化：访客点击“开始识别”时直接进入登录引导，示例入口仍保持公开。 */
      if (!currentUser) {
        setShowLoginPrompt(true);
        setShowLogin(true);
      }
    }, 520);
  };

  const finishSignIn = (nextUser: LocalUser) => {
    window.localStorage.setItem("stonelens-current-user", nextUser.username);
    setCurrentUser(nextUser);
    setDeviceMember(nextUser.role === "user" && window.localStorage.getItem(`stonelens-membership-active-${nextUser.username}`) === "true");
    if (nextUser.role === "user") {
      const stored = Number(window.localStorage.getItem(`stonelens-free-scans-${nextUser.username}`) ?? 10);
      setFreeScans(Math.max(0, Math.min(10, stored)));
    }
    setLoginError("");
    setLoginPassword("");
    setConfirmPassword("");
    setShowLogin(false);
    setShowLoginPrompt(false);
  };

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const username = loginUsername.trim();
    let accounts: LocalAccount[] = [];
    try {
      accounts = JSON.parse(window.localStorage.getItem("stonelens-local-accounts") || "[]");
    } catch {
      accounts = [];
    }
    const passwordHash = await hashLocalPassword(loginPassword);
    const registered = accounts.find((account) => account.username.toLowerCase() === username.toLowerCase());
    const legacyAccountValid = (username === "admin" || username === "user") && loginPassword === "123";
    if (!legacyAccountValid && (!registered || registered.passwordHash !== passwordHash)) {
      /* 优化：正式登录界面不暴露内部测试账号信息。 */
      setLoginError("用户名或密码不正确，请检查后重试。");
      return;
    }
    finishSignIn({ username: registered?.username || username, role: username === "admin" ? "admin" : "user" });
  };

  /* 优化：GitHub 静态比赛版提供设备内注册流程，无需单独数据库。 */
  const submitRegistration = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const username = loginUsername.trim();
    if (username.length < 3) return setLoginError("用户名至少需要 3 个字符。");
    if (loginPassword.length < 6) return setLoginError("密码至少需要 6 个字符。");
    if (loginPassword !== confirmPassword) return setLoginError("两次输入的密码不一致。");
    if (username.toLowerCase() === "admin") return setLoginError("该用户名不可注册，请更换后重试。");
    let accounts: LocalAccount[] = [];
    try {
      accounts = JSON.parse(window.localStorage.getItem("stonelens-local-accounts") || "[]");
    } catch {
      accounts = [];
    }
    if (accounts.some((account) => account.username.toLowerCase() === username.toLowerCase())) {
      return setLoginError("该用户名已注册，请直接登录。");
    }
    const nextAccount = { username, passwordHash: await hashLocalPassword(loginPassword), createdAt: new Date().toISOString() };
    window.localStorage.setItem("stonelens-local-accounts", JSON.stringify([...accounts, nextAccount]));
    window.localStorage.setItem(`stonelens-free-scans-${username}`, "10");
    finishSignIn({ username, role: "user" });
  };

  const logout = () => {
    window.localStorage.removeItem("stonelens-current-user");
    window.localStorage.removeItem("stonelens-demo-user");
    setCurrentUser(null);
    setDeviceMember(false);
    setFreeScans(Number(window.localStorage.getItem("stonelens-free-scans") ?? 10));
    setShowLogin(false);
  };

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    /* 优化：访客不能通过文件输入绕过登录限制。 */
    if (!currentUser) {
      event.target.value = "";
      setShowLogin(true);
      return;
    }
    const file = event.target.files?.[0];
    if (!file) return;
    /* 优化：先读取原图并打开手动框选，确认后才进入可识别状态。 */
    const reader = new FileReader();
    reader.onload = () => {
      const image = typeof reader.result === "string" ? reader.result : null;
      if (!image) return;
      setOriginalQueryImage(image);
      setQueryImage(null);
      setQuerySource("upload");
      setRecognition(null);
      setRecognitionError(null);
      setStage("idle");
      setCropOpen(true);
    };
    reader.readAsDataURL(file);
  };

  /* 优化：所有上传入口统一执行登录检查。 */
  const requestImageSelection = () => {
    if (!currentUser) {
      setShowLoginPrompt(true);
      setShowLogin(true);
      return;
    }
    fileInput.current?.click();
  };

  const openMembership = () => {
    /* 优化：访客先登录，避免产生无法归属账号的会员状态。 */
    if (!currentUser) {
      setShowLoginPrompt(true);
      setShowLogin(true);
      return;
    }
    setShowMembership(true);
    window.location.hash = "membership";
  };

  const closeMembership = () => {
    setShowMembership(false);
    window.location.hash = "identify";
  };

  /* 优化：模拟支付完成后立即解锁会员权益并持久化。 */
  const activateMembership = () => {
    if (!currentUser) return;
    window.localStorage.setItem(`stonelens-membership-active-${currentUser.username}`, "true");
    setDeviceMember(true);
  };

  const identify = async () => {
    /* 优化：真实识别必须先登录；访客只保留示例展示能力。 */
    if (!currentUser) {
      setShowLoginPrompt(true);
      setShowLogin(true);
      return;
    }
    if (!hasUnlimitedScans && freeScans <= 0) {
      openMembership();
      return;
    }
    if (!queryImage) return;
    setRecognitionError(null);
    setRecognition(null);
    setStage("analyzing");
    try {
      const result = await recognizeStone(queryImage);
      setRecognition(result);
      if (querySource === "upload" && !hasUnlimitedScans) {
        setFreeScans((value) => Math.max(0, value - 1));
      }
      setReferenceImageError(false);
      setStage("result");
      if (querySource === "upload") {
        try {
          const thumbnail = await makeHistoryThumbnail(queryImage);
          const entry: HistoryEntry = {
            id: `${Date.now()}-${result.best.className}`,
            time: new Date().toLocaleString("zh-CN", { hour12: false }),
            chineseName: chineseNameForStone(result.best.className),
            englishName: result.best.className,
            score: result.best.score,
            thumbnail,
          };
          setHistory((current) => {
            const next = [entry, ...current].slice(0, 24);
            window.localStorage.setItem("stonelens-history", JSON.stringify(next));
            return next;
          });
        } catch {
          // Recognition remains successful even if the local thumbnail cannot be stored.
        }
        if (!currentUser) setShowLoginPrompt(true);
      }
    } catch (error) {
      setRecognitionError(
        error instanceof Error ? error.message : "识别失败，请刷新页面后重试。",
      );
      setStage("ready");
    }
  };

  const reset = () => {
    if (queryImage?.startsWith("blob:")) URL.revokeObjectURL(queryImage);
    setQueryImage(null);
    setOriginalQueryImage(null);
    setCropOpen(false);
    setQuerySource(null);
    setRecognition(null);
    setRecognitionError(null);
    setStage("idle");
    if (fileInput.current) fileInput.current.value = "";
  };

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="石相首页">
          {/* 优化 */}
          <img className="brand-logo" src={sitePath("/images/diamond-logo.png")} alt="石相 StoneLens Logo" />
          <span>
            <b>石相</b>
            <small>StoneLens</small>
          </span>
        </a>
        <nav aria-label="主导航">
          <a href="#identify">识别宝石</a>
          <a href="#atlas">石种图鉴</a>
          <a href="#birthstones">生辰石趣闻</a>
          <a href="#history">历史记录</a>
        </nav>
        <div className="header-actions">
          <button className="login-button" onClick={() => setShowLogin(true)}>
            {/* 优化 */}
            {currentUser
              ? `${currentUser.username} · ${currentUser.role === "admin" ? "管理员" : "用户"}${isMember ? " · 👑 会员" : ""}`
              : "登录 / 注册"}
          </button>
          {/* 优化：会员开通后不再重复显示购买入口。 */}
          {!isMember && <button className="account-button" onClick={openMembership}>开通会员</button>}
        </div>
      </header>

      <section className="hero hero-carousel" id="top" aria-label="真实宝石与原石轮播">
        <div className="hero-slides" aria-hidden="true">
          {heroSlides.map((slide, index) => (
            <div className={`hero-slide ${index === heroIndex ? "active" : ""}`} key={slide.english}>
              <img src={slide.image} alt="" />
            </div>
          ))}
        </div>
        <div className="hero-shade" />
        <div className="hero-copy hero-overlay-copy">
          <span className="hero-product">石相 <b>StoneLens</b></span>
          <span className="hero-slogan">用镜头，读懂每一颗石头。</span>
          <span className="eyebrow">AI GEM DISCOVERY & VISUAL MATCHING</span>
          <h1>
            从一颗未知，
            <br />
            走进整个<span>宝石世界</span>
          </h1>
          <p>
            拍下你手中的石头
             —— 我们会从 106 种参考样本中，找到最相似的那一颗。
          </p>
          <div className="hero-actions">
            <button className={`primary-button hero-identify-button ${openingIdentify ? "is-opening" : ""}`} onClick={openIdentifyArea} disabled={openingIdentify}>
              {openingIdentify ? <><span className="button-spinner" />正在打开识别区…</> : <>开始识别 <span>→</span></>}
            </button>
            <button className="text-button" onClick={chooseDemo}>
              查看示例结果
            </button>
          </div>
          <div className="scope-row">
            <span><b>87</b> 种彩色宝石</span>
            <i />
            <span><b>10</b> 种玉石原石</span>
            <i />
            <span><b>9</b> 种常见岩石</span>
          </div>
        </div>
        <div className="hero-slide-meta" aria-live="polite">
          <span>{heroSlides[heroIndex].type}</span>
          <b>{heroSlides[heroIndex].name}</b>
          <small>{heroSlides[heroIndex].english}</small>
        </div>
        <div className="hero-dots" aria-label="切换首页图片">
          {heroSlides.map((slide, index) => (
            <button
              className={index === heroIndex ? "active" : ""}
              key={slide.english}
              onClick={() => setHeroIndex(index)}
              aria-label={`查看${slide.name}`}
            />
          ))}
        </div>
      </section>

      <section className="collection-intro" aria-label="图片库说明">
        <div>
          <span>DISCOVER EVERY STONE</span>
          <b>探索每一颗石头的身份</b>
        </div>
        <p>
          收藏的宝石、捡到的原石、路边的陌生石头，一拍即知，读懂它的身份与故事。
        </p>
        <div className="collection-line">
          <span>REAL DATASET</span>
          <i />
          <span>SNAP & KNOW</span>
        </div>
      </section>

      <section className="identify-section" id="identify">
        <div className="section-heading">
          <div>
            <span className="eyebrow">GEM MATCHING WORKSPACE</span>
            <h2>宝石视觉匹配</h2>
          </div>
          <div className="quota">
            <div className="quota-copy">
              <span>免费识别额度</span>
              <b>{!currentUser ? "登录后可用" : hasUnlimitedScans ? "剩余 ∞ 次" : `剩余 ${freeScans} 次`}</b>
            </div>
            <div className={`quota-progress ${hasUnlimitedScans ? "unlimited" : ""}`} role="progressbar" aria-label="免费识别剩余额度" aria-valuemin={0} aria-valuemax={10} aria-valuenow={!currentUser ? 0 : hasUnlimitedScans ? 10 : freeScans}>
              <i style={{ width: `${!currentUser ? 0 : hasUnlimitedScans ? 100 : freeScans * 10}%` }} />
            </div>
          </div>
        </div>

        {/* 优化：删除实时识别入口，仅保留静态图片识别。 */}
            <div className="workspace">
              <div className={`media-panel reference-panel ${resultVisible ? "has-result" : ""}`}>
                  <div className="panel-head">
                    <span>参考样本</span>
                  </div>
                  {resultVisible && recognition ? (
                    referenceImageError ? (
                      <div className="image-error">
                        <b>参考图暂时未载入</b>
                        <span>请刷新页面后重试</span>
                      </div>
                    ) : (
                      <img
                        key={recognition.referenceImage}
                        src={safeImagePath(recognition.referenceImage)}
                        alt={`${recognition.best.className} 类别参考图`}
                        loading="eager"
                        decoding="sync"
                        onError={() => setReferenceImageError(true)}
                      />
                    )
                  ) : (
                    <div className="empty-panel">
                      <span className="empty-glyph">◇</span>
                      <p>识别完成后显示参考样本</p>
                      <small>当前不会显示类别或相似度</small>
                    </div>
                  )}
              </div>

              <div className={`media-panel query-panel ${queryImage ? "has-query" : ""}`}>
                <div className="panel-head">
                  <span>用户实物</span>
                  {queryImage && stage !== "idle" && <small>图片预览</small>}
                </div>
                {queryImage ? (
                  <img src={queryImage} alt="用户上传的石头图片" />
                ) : (
                  <button className={`upload-zone ${!currentUser ? "guest-locked" : ""}`} onClick={requestImageSelection}>
                    <span className="upload-icon">＋</span>
                    {/* 优化：与参考样本空状态使用一致的提示文字层级。 */}
                    <p>{currentUser ? "上传一张石头照片" : "登录后上传识别"}</p>
                    <div className="upload-guidance">
                      <small>支持 JPG、PNG、WEBP · 上传前不会开始识别</small>
                      <small>请尽量上传背景干净、石头主体清晰的照片</small>
                    </div>
                  </button>
                )}
                {/* 优化：识别前可返回原图重新框选石头主体。 */}
                {queryImage && querySource === "upload" && originalQueryImage && stage !== "analyzing" && (
                  <button type="button" className="recrop-button" onClick={() => setCropOpen(true)}>重新框选</button>
                )}
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFile}
                  disabled={!currentUser}
                  hidden
                />
              </div>
            </div>

            <div className="action-bar">
              <div className="status-line">
                <span className={`status-dot ${stage}`} />
                <div>
                  <b>{statusCopy}</b>
                  <small>
                    {stage === "analyzing"
                      ? "特征提取 · 图库检索 · 结果整理"
                      : "结果仅代表视觉相似性，不构成专业鉴定"}
                  </small>
                </div>
              </div>
              <div className="action-buttons">
                {stage === "idle" && (
                  <>
                    <button className="secondary-button" onClick={chooseDemo}>载入示例</button>
                    <button className="primary-button" onClick={requestImageSelection}>
                      {currentUser ? "选择图片" : "登录后识别"}
                    </button>
                  </>
                )}
                {stage === "ready" && (
                  <>
                    <button className="secondary-button" onClick={reset}>重新选择</button>
                    <button className="primary-button" onClick={identify}>开始识别</button>
                  </>
                )}
                {stage === "analyzing" && (
                  <button className="primary-button loading-button" disabled>
                    <span className="spinner" /> 正在识别
                  </button>
                )}
                {stage === "result" && (
                  <button className="primary-button" onClick={reset}>识别另一块石头</button>
                )}
              </div>
            </div>

        {resultVisible && recognition && (
          <div className="result-area">
            <div className="result-summary">
              <div>
                <span className="result-kicker">MOST SIMILAR CATEGORY</span>
                <h3>{chineseNameForStone(recognition.best.className)} <small>{recognition.best.className}</small></h3>
                <div className="result-tags">
                  <span>{domainNames[recognition.best.domain]} · {domainEnglishNames[recognition.best.domain]}</span>
                  <span>真实模型检索</span>
                  <span>多域参考图库</span>
                </div>
              </div>
              <div className="similarity">
                <span>视觉相似度</span>
                <b>{recognition.best.score.toFixed(3)}</b>
                <small>余弦相似度，并非准确率</small>
              </div>
            </div>

            {recognizedProfile && (
              <section className="recognized-context" aria-label="识别类别三维模型与主要产地">
                <div className="model-profile-panel">
                  <div className="panel-head">
                    <span>{recognizedProfile.category} · {recognizedProfile.english}</span>
                    <small>拖动模型可旋转</small>
                  </div>
                  <div className="annotated-model">
                    <div className="model-annotation hardness-annotation">
                      <span>硬度 · HARDNESS</span><b>{recognizedProfile.hardness}</b>
                    </div>
                    <GemModel3D
                      initialCut={recognizedProfile.modelCut}
                      color={recognizedProfile.modelColor}
                      crystalSystem={recognizedProfile.crystalSystem}
                      stoneName={recognizedProfile.className}
                      stoneDomain={recognizedProfile.domain}
                      showCutSwitch={false}
                    />
                    <div className="model-annotation crystal-annotation">
                      <span>晶系 · CRYSTAL SYSTEM</span><b>{recognizedProfile.crystalSystem}</b>
                    </div>
                  </div>
                </div>
                <div className="origin-profile-panel">
                  <div className="panel-head">
                    <span>主要产地 · PRINCIPAL ORIGINS</span>
                    <small>悬停国家查看中英文名称</small>
                  </div>
                  <GemOriginMiniMap domain={recognizedProfile.domain} className={recognizedProfile.className} />
                  <div className="origin-country-list">
                    {recognizedProfile.origins.map((country) => <span key={country}>{bilingualCountryName(country)}</span>)}
                  </div>
                  <p>地图展示该类别的代表性来源地，并非对当前实物产地的判定。</p>
                </div>
              </section>
            )}

            <div className="top-matches">
              <div className="subheading">
                <h3>Top‑5 相似结果</h3>
                <span>按类别最高相似度排序</span>
              </div>
              <div className="match-grid">
                {recognition.matches.map((match, index) => (
                  <div className="match-card" key={`${match.domain}-${match.className}`}>
                    <img src={safeImagePath(match.image)} alt={`${match.className} 参考样本`} />
                    <span>#{index + 1}</span>
                    <div><b>{chineseNameForStone(match.className)}</b><small>{match.className} · {match.score.toFixed(3)}</small></div>
                  </div>
                ))}
              </div>
            </div>
            {/* 优化 */}
            <JewelryDesignCarousel gemNames={recognition.matches.slice(0, 5).map((match) => match.className)} />
            <GemKnowledgeQA
              currentGemName={recognition.best.className}
              isMember={isMember}
              onOpenMembership={openMembership}
            />
          </div>
        )}
      </section>

      <section className="history-section" id="history">
        <div className="history-heading">
          <div><span className="eyebrow">LOCAL HISTORY</span><h2>历史记录</h2></div>
          {/* 优化 */}
          <div><p>识别记录自动保存在本设备，方便随时回顾。</p>{history.length > 0 && <button onClick={() => { setHistory([]); window.localStorage.removeItem("stonelens-history"); }}>清空记录</button>}</div>
        </div>
        {history.length === 0 ? (
          <div className="history-empty"><span>◇</span><b>还没有识别记录</b><p>上传并识别一张实物照片后，时间、名称、匹配度和缩略图会出现在这里。</p></div>
        ) : (
          <div className="history-grid">
            {history.map((entry) => <article key={entry.id}><img src={entry.thumbnail} alt={`${entry.chineseName}历史缩略图`} loading="lazy" /><div><small>{entry.time}</small><b>{entry.chineseName}</b><span>{entry.englishName}</span><em>匹配度 {entry.score.toFixed(3)}</em></div></article>)}
          </div>
        )}
      </section>

      <StoneAtlas />
      <BirthstoneStories />

      <footer>
        <div className="brand footer-brand">
          {/* 优化 */}
          <img className="brand-logo" src={sitePath("/images/diamond-logo.png")} alt="石相 StoneLens Logo" />
          <span><b>石相 StoneLens</b><small>视觉相似检索实验室</small></span>
        </div>
        <p>
          本工具根据图片的颜色、纹理和形态进行视觉相似度检索。
          结果仅供探索与参考，不能代替专业矿物检测、真伪鉴定或价值评估。
        </p>
      </footer>

      {showLoginPrompt && !currentUser && (
        <aside className="login-nudge" aria-live="polite">
          <span className="nudge-icon">◎</span>
          <div><b>登录后可保存记录并获得更多次数</b><small>当前识别不会被登录步骤打断</small></div>
          <button onClick={() => { setShowLoginPrompt(false); setShowLogin(true); }}>登录 / 注册</button>
          <button className="nudge-close" aria-label="关闭登录提示" onClick={() => setShowLoginPrompt(false)}>×</button>
        </aside>
      )}

      {showLogin && (
        <div className="modal-backdrop login-backdrop" onMouseDown={() => setShowLogin(false)}>
          <div className="modal login-modal" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" aria-label="关闭" onClick={() => setShowLogin(false)}>×</button>
            <span className="eyebrow">STONELENS ACCOUNT</span>
            {/* 优化：使用正式产品登录文案，不展示本地演示或预设账号信息。 */}
            <h2>{currentUser ? "账户信息" : authMode === "login" ? "登录 StoneLens" : "注册 StoneLens"}</h2>
            {currentUser ? (
              <><p>当前账户：{currentUser.username} · {isMember ? "StoneLens 会员" : "免费用户"}</p><button className="secondary-button full-button" onClick={logout}>退出登录</button></>
            ) : (
              <>
                <p>{authMode === "login" ? "登录后即可上传图片进行识别，并保存你的识别记录。" : "创建账户后可获得 10 次免费识别额度。"}</p>
                <form onSubmit={authMode === "login" ? submitLogin : submitRegistration}>
                  <label htmlFor="login-username">用户名</label>
                  <input id="login-username" required value={loginUsername} onChange={(event) => setLoginUsername(event.target.value)} placeholder="请输入用户名" />
                  <label htmlFor="login-password">密码</label>
                  <input id="login-password" type="password" required value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} placeholder="请输入密码" />
                  {authMode === "register" && <><label htmlFor="confirm-password">确认密码</label><input id="confirm-password" type="password" required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="请再次输入密码" /></>}
                  {loginError && <p className="login-error">{loginError}</p>}
                  <button className="primary-button full-button">{authMode === "login" ? "登录" : "创建账户"}</button>
                </form>
                <button className="auth-mode-switch" onClick={() => { setAuthMode((mode) => mode === "login" ? "register" : "login"); setLoginError(""); }}>
                  {authMode === "login" ? "还没有账户？立即注册" : "已有账户？返回登录"}
                </button>
              </>
            )}
            <small>登录即表示你同意 StoneLens 用户协议与隐私政策。</small>
          </div>
        </div>
      )}

      {showBackTop && <button className="back-to-top" aria-label="回到顶部" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>↑<span>顶部</span></button>}

      {/* 优化：iOS/安卓浏览器的“添加到主屏幕”引导，不影响正常网页识别。 */}
      <PwaInstallPrompt />

      {/* 优化 */}
      {showMembership && <MembershipView onClose={closeMembership} onPaymentSuccess={activateMembership} isMember={isMember} />}

      {/* 优化：只有确认框选后，裁剪图才会进入识别与历史记录流程。 */}
      {cropOpen && originalQueryImage && (
        <ImageCropper
          imageUrl={originalQueryImage}
          onCancel={() => {
            setCropOpen(false);
            if (!queryImage) reset();
          }}
          onApply={(croppedImage) => {
            setQueryImage(croppedImage);
            setQuerySource("upload");
            setRecognition(null);
            setRecognitionError(null);
            setStage("ready");
            setCropOpen(false);
          }}
        />
      )}
    </main>
  );
}
