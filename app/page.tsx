"use client";

import {
  ChangeEvent,
  CSSProperties,
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
import MembershipView from "./MembershipView";
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
    <div className="three-gem-loading" aria-label="Loading 3D gem model">
      <span />
      <small>Loading 3D model</small>
    </div>
  ),
});

/* 优化：地图、AI 问答、图鉴和生辰石拆分为按需加载模块，减少首页首屏 JS 压力。 */
const GemOriginMiniMap = dynamic(() => import("./GemOriginMiniMap"), {
  ssr: false,
  loading: () => <div className="lazy-module-placeholder">Loading origin map…</div>,
});

const GemKnowledgeQA = dynamic(() => import("./GemKnowledgeQA"), {
  ssr: false,
  loading: () => <div className="lazy-module-placeholder">Loading AI Q&A…</div>,
});

const StoneAtlas = dynamic(() => import("./StoneAtlas"), {
  ssr: false,
  loading: () => <section className="atlas-section"><div className="lazy-section-placeholder">Loading stone atlas…</div></section>,
});

const BirthstoneStories = dynamic(() => import("./BirthstoneStories"), {
  ssr: false,
  loading: () => <section className="birthstone-stories"><div className="lazy-section-placeholder">Loading birthstone stories…</div></section>,
});

type Stage = "idle" | "ready" | "analyzing" | "result";
type QuerySource = "demo" | "upload" | null;
type LocalUser = { username: string; role: "admin" | "user" };
type LocalAccount = { username: string; passwordHash: string; createdAt: string };
type HistoryEntry = { id: string; time: string; chineseName: string; englishName: string; score: number; thumbnail: string };
type Language = "zh" | "en";

const uiCopy = {
  zh: {
    navIdentify: "识别宝石",
    navAtlas: "石种图鉴",
    navBirthstones: "生辰石趣闻",
    navInspiration: "石之启示",
    navHistory: "历史记录",
    menu: "菜单",
    admin: "管理员",
    user: "用户",
    member: "会员",
    login: "登录 / 注册",
    membership: "开通会员",
    heroSlogan: "用镜头，读懂每一颗石头。",
    heroTitleA: "从一颗未知，",
    heroTitleB: "走进整个",
    heroTitleHighlight: "宝石世界",
    heroIntro: "拍下你手中的石头 —— 我们会从 106 种参考样本中，找到最相似的那一颗。",
    opening: "正在打开识别区…",
    startIdentify: "开始识别",
    demo: "查看示例结果",
    scopeGem: "种彩色宝石",
    scopeJade: "种玉石原石",
    scopeRock: "种常见岩石",
    collectionTitle: "探索每一颗石头的身份",
    collectionText: "收藏的宝石、捡到的原石、路边的陌生石头，一拍即知，读懂它的身份与故事。",
    inspirationTitle: "今天适合哪颗石头？",
    inspirationText: "识别之外，也可以选一颗顺眼的石头，获得一句温和的今日灵感。会员可使用 AI 生成专属启示。",
    inspirationCta: "进入石之启示",
    workspaceTitle: "宝石视觉匹配",
    quotaTitle: "免费识别额度",
    quotaLogin: "登录后可用",
    quotaUnlimited: "剩余 ∞ 次",
    quotaLeft: "剩余",
    times: "次",
    reference: "参考样本",
    referenceFailed: "参考图暂时未载入",
    refreshRetry: "请刷新页面后重试",
    referenceEmpty: "识别完成后显示参考样本",
    referenceEmptySub: "当前不会显示类别或相似度",
    uploadTitle: "实物上传",
    preview: "图片预览",
    uploadAction: "拍照或上传图片",
    uploadLocked: "登录后上传识别",
    uploadGuideA: "手机可拍照或从相册选择 · 支持 JPG、PNG、WEBP",
    uploadGuideB: "请尽量上传背景干净、石头主体清晰的照片",
    recrop: "重新框选",
    inlineIdentify: "开始识别",
    inlineSub: "检索最相似的 5 个参考样本",
    recognizing: "正在识别",
    readyStatus: "图片已准备好，请确认后开始识别",
    analyzingStatus: "正在提取图像特征，检索匹配中",
    guestStatus: "访客模式仅可查看示例，登录后可上传识别",
    idleStatus: "将石头放入识别框，拍摄或上传一张清晰照片",
    analyzingSub: "特征提取 · 图库检索 · 结果整理",
    statusSub: "结果仅代表视觉相似性，不构成专业鉴定",
    loadDemo: "载入示例",
    chooseImage: "选择图片",
    loginToIdentify: "登录后识别",
    chooseAgain: "重新选择",
    identifyAnother: "识别另一块石头",
    resultKicker: "MOST SIMILAR CATEGORY",
    realModel: "真实模型检索",
    multiGallery: "多域参考图库",
    category: "类别",
    hardness: "硬度",
    crystal: "晶系",
    origin: "产地",
    noData: "暂无资料",
    otherOriginPrefix: "另",
    otherOriginSuffix: "个代表产地",
    similarity: "视觉相似度",
    similaritySub: "余弦相似度，并非准确率",
    resultNoteTitle: "结果说明",
    resultNote: "StoneLens 展示的是视觉相似结果，适合作为初步识别与收藏参考；相似度不等同于专业鉴定结论，最终材质、真伪和价值仍建议结合实物检测、证书或专业机构意见。",
    rotateModel: "拖动模型可旋转",
    originsTitle: "主要产地 · PRINCIPAL ORIGINS",
    originsHint: "悬停国家查看中英文名称",
    originMapNote: "地图展示该类别的代表性来源地，并非对当前实物产地的判定。",
    top5Title: "Top‑5 相似结果",
    top5Hint: "点击任一结果，可切换上方参考样本、模型与产地",
    top5Explain: "宝石颜色、切工、光照和背景都会影响视觉特征，因此系统展示最接近的 5 个类别，可进行交叉比较。",
    historyTitle: "历史记录",
    historyText: "识别记录自动保存在本设备，方便随时回顾。",
    clearHistory: "清空记录",
    noHistory: "还没有识别记录",
    noHistoryText: "上传并识别一张实物照片后，时间、名称、匹配度和缩略图会出现在这里。",
    loadingAtlas: "石种图鉴靠近视窗后加载，首页更轻快…",
    loadingBirthstones: "生辰石趣闻靠近视窗后加载，滚动时自动出现…",
    footerLab: "视觉相似检索实验室",
    footerText: "本工具根据图片的颜色、纹理和形态进行视觉相似度检索。结果仅供探索与参考，不能代替专业矿物检测、真伪鉴定或价值评估。",
    loginNudgeTitle: "登录后可保存记录并获得更多次数",
    loginNudgeSub: "当前识别不会被登录步骤打断",
    loginErrorInvalid: "用户名或密码不正确，请检查后重试。",
    loginErrorUsernameShort: "用户名至少需要 3 个字符。",
    loginErrorPasswordShort: "密码至少需要 6 个字符。",
    loginErrorPasswordMismatch: "两次输入的密码不一致。",
    loginErrorReserved: "该用户名不可注册，请更换后重试。",
    loginErrorExists: "该用户名已注册，请直接登录。",
  },
  en: {
    navIdentify: "Identify",
    navAtlas: "Stone Atlas",
    navBirthstones: "Birthstones",
    navInspiration: "Stone Inspiration",
    navHistory: "History",
    menu: "Menu",
    admin: "Admin",
    user: "User",
    member: "Member",
    login: "Log in / Sign up",
    membership: "Membership",
    heroSlogan: "Read every stone through your lens.",
    heroTitleA: "From one unknown stone,",
    heroTitleB: "enter the world of",
    heroTitleHighlight: "gemstones",
    heroIntro: "Take a photo of the stone in your hand — StoneLens searches 106 reference categories for the closest visual matches.",
    opening: "Opening the workspace…",
    startIdentify: "Start identifying",
    demo: "View sample result",
    scopeGem: "colored gemstones",
    scopeJade: "jade rough stones",
    scopeRock: "common rocks",
    collectionTitle: "Explore the identity of every stone",
    collectionText: "From a collected gem to a found rough stone or a roadside rock, StoneLens helps you read its visual identity and story.",
    inspirationTitle: "Which stone fits today?",
    inspirationText: "Beyond identification, choose a stone that catches your eye and receive a gentle daily inspiration. Members can generate personalized AI reflections.",
    inspirationCta: "Open Stone Inspiration",
    workspaceTitle: "Gem Visual Matching",
    quotaTitle: "Free quota",
    quotaLogin: "Available after login",
    quotaUnlimited: "Remaining ∞",
    quotaLeft: "Remaining",
    times: "uses",
    reference: "Reference Sample",
    referenceFailed: "Reference image failed to load",
    refreshRetry: "Please refresh and try again",
    referenceEmpty: "Reference sample appears after identification",
    referenceEmptySub: "No category or similarity is shown yet",
    uploadTitle: "Object Upload",
    preview: "Preview",
    uploadAction: "Take or upload a photo",
    uploadLocked: "Log in to upload",
    uploadGuideA: "Use camera or gallery · JPG, PNG, WEBP supported",
    uploadGuideB: "Use a clean background and keep the stone clearly visible",
    recrop: "Crop again",
    inlineIdentify: "Start identifying",
    inlineSub: "Search the 5 closest reference samples",
    recognizing: "Identifying",
    readyStatus: "Image ready. Confirm to start matching",
    analyzingStatus: "Extracting visual features and searching matches",
    guestStatus: "Guest mode can view samples only. Log in to upload",
    idleStatus: "Place a stone in frame, then take or upload a clear photo",
    analyzingSub: "Feature extraction · Gallery search · Result ranking",
    statusSub: "Results indicate visual similarity only, not professional authentication",
    loadDemo: "Load sample",
    chooseImage: "Choose image",
    loginToIdentify: "Log in to identify",
    chooseAgain: "Choose again",
    identifyAnother: "Identify another stone",
    resultKicker: "MOST SIMILAR CATEGORY",
    realModel: "Real model retrieval",
    multiGallery: "Multi-domain gallery",
    category: "Category",
    hardness: "Hardness",
    crystal: "Crystal system",
    origin: "Origin",
    noData: "No data",
    otherOriginPrefix: "+",
    otherOriginSuffix: "more representative origins",
    similarity: "Visual similarity",
    similaritySub: "Cosine similarity, not accuracy",
    resultNoteTitle: "Result note",
    resultNote: "StoneLens shows visual similarity for exploration and collecting reference. Similarity is not a professional authentication conclusion; material, authenticity and value should still be checked with physical testing, certificates or qualified experts.",
    rotateModel: "Drag to rotate the model",
    originsTitle: "Principal Origins",
    originsHint: "Hover countries to view bilingual names",
    originMapNote: "The map shows representative sources for this category, not a determination of the current object's origin.",
    top5Title: "Top‑5 Similar Results",
    top5Hint: "Click any result to switch the reference sample, model and origins above",
    top5Explain: "Color, cut, lighting and background can all affect visual features, so StoneLens shows the five closest categories for cross-comparison.",
    historyTitle: "History",
    historyText: "Recognition records are saved on this device for easy review.",
    clearHistory: "Clear history",
    noHistory: "No records yet",
    noHistoryText: "After you upload and identify a photo, time, name, similarity and thumbnail will appear here.",
    loadingAtlas: "Stone Atlas loads when you scroll near it, keeping the homepage lighter…",
    loadingBirthstones: "Birthstone stories load as you scroll closer…",
    footerLab: "Visual Similarity Lab",
    footerText: "This tool searches visual similarity based on image color, texture and shape. Results are for exploration only and do not replace mineral testing, authentication or valuation.",
    loginNudgeTitle: "Log in to save records and get more uses",
    loginNudgeSub: "The current interaction will not be interrupted",
    loginErrorInvalid: "Incorrect username or password. Please try again.",
    loginErrorUsernameShort: "Username must be at least 3 characters.",
    loginErrorPasswordShort: "Password must be at least 6 characters.",
    loginErrorPasswordMismatch: "The two passwords do not match.",
    loginErrorReserved: "This username cannot be registered. Please choose another one.",
    loginErrorExists: "This username already exists. Please log in instead.",
  },
} as const;

/* 优化 */
const heroSlides = [
  { image: sitePath("/showcase/hero-emerald-hd.webp"), name: "祖母绿", english: "Emerald", type: "彩色宝石", typeEn: "Colored Gemstone" },
  { image: sitePath("/showcase/hero-ruby-hd.webp"), name: "红宝石", english: "Ruby", type: "彩色宝石", typeEn: "Colored Gemstone" },
  { image: sitePath("/showcase/hero-sapphire-hd.webp"), name: "蓝宝石", english: "Blue Sapphire", type: "彩色宝石", typeEn: "Colored Gemstone" },
  { image: sitePath("/showcase/hero-jadeite-raw-hd.webp"), name: "翡翠原石", english: "Jadeite Raw", type: "玉石原石", typeEn: "Raw Jade" },
  { image: sitePath("/showcase/hero-basalt-hd.webp"), name: "玄武岩", english: "Basalt", type: "常见岩石", typeEn: "Common Rock" },
];

function englishCrystalSystem(value: string): string {
  return value
    .replaceAll("三方晶系（石英质）", "Trigonal (quartz)")
    .replaceAll("三方晶系（石英）", "Trigonal (quartz)")
    .replaceAll("立方晶系（石榴石）", "Cubic (garnet)")
    .replaceAll("斜方晶系（金绿宝石）", "Orthorhombic (chrysoberyl)")
    .replaceAll("单斜晶系（隐晶质）", "Monoclinic (cryptocrystalline)")
    .replaceAll("单斜晶系（正长石）", "Monoclinic (orthoclase)")
    .replaceAll("单斜晶系（硬玉）", "Monoclinic (jadeite)")
    .replaceAll("单斜晶系（透闪石）", "Monoclinic (tremolite)")
    .replaceAll("单斜晶系（蛇纹石）", "Monoclinic (serpentine)")
    .replaceAll("三方晶系（罕见）", "Trigonal (rare)")
    .replaceAll("非晶质/生物质", "Amorphous / biogenic")
    .replaceAll("非晶质/隐晶质", "Amorphous / cryptocrystalline")
    .replaceAll("隐晶质（含方钠石）", "Cryptocrystalline (sodalite-bearing)")
    .replaceAll("多晶集合体（含斜长石等）", "Polycrystalline aggregate")
    .replaceAll("单斜晶系矿物集合体", "Monoclinic mineral aggregate")
    .replaceAll("多矿物集合体，无单一晶系", "Multi-mineral aggregate; no single crystal system")
    .replaceAll("多晶集合体", "Polycrystalline aggregate")
    .replaceAll("隐晶质", "Cryptocrystalline")
    .replaceAll("非晶质体", "Amorphous")
    .replaceAll("等轴晶系", "Cubic")
    .replaceAll("立方晶系", "Cubic")
    .replaceAll("三方晶系", "Trigonal")
    .replaceAll("六方晶系", "Hexagonal")
    .replaceAll("斜方晶系", "Orthorhombic")
    .replaceAll("单斜晶系", "Monoclinic")
    .replaceAll("三斜晶系", "Triclinic")
    .replaceAll("四方晶系", "Tetragonal");
}

function englishHardness(value: string): string {
  return value
    .replaceAll("暂无可靠统一数值", "No reliable unified value")
    .replaceAll("随组成矿物而变化", "Varies by mineral composition")
    .replaceAll("方向相关", "direction-dependent")
    .replaceAll("莫氏约", "Mohs approx. ")
    .replaceAll("莫氏", "Mohs");
}

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
  /* 优化：Top-5 结果可手动切换，主参考图、3D 模型和产地信息跟随当前选中项变化。 */
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);
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
  /* 优化：移动端顶部导航改为折叠菜单，避免功能入口在小屏幕拥挤。 */
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  /* 优化：石种图鉴与生辰石故事滚动到附近再加载，减轻首页首屏 JS 压力。 */
  const [shouldLoadAtlas, setShouldLoadAtlas] = useState(false);
  const [shouldLoadBirthstones, setShouldLoadBirthstones] = useState(false);
  /* 优化：首页右上角新增中英切换，先覆盖核心识别展示路径。 */
  const [language, setLanguage] = useState<Language>("zh");
  const atlasLazyRef = useRef<HTMLElement>(null);
  const birthstonesLazyRef = useRef<HTMLElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const copy = uiCopy[language];
  const stoneLabel = (className: string) => language === "en" ? className : chineseNameForStone(className);
  const countryLabel = (country: string) => language === "en" ? country : bilingualCountryName(country);
  const crystalLabel = (value: string) => language === "en" ? englishCrystalSystem(value) : value;
  const hardnessLabel = (value: string) => language === "en" ? englishHardness(value) : value;
  const domainLabel = (domain: StoneMatch["domain"]) => language === "en" ? domainEnglishNames[domain] : domainNames[domain];

  useEffect(() => {
    const storedLanguage = window.localStorage.getItem("stonelens-language");
    if (storedLanguage !== "zh" && storedLanguage !== "en") return;
    const animationFrame = window.requestAnimationFrame(() => setLanguage(storedLanguage));
    return () => window.cancelAnimationFrame(animationFrame);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("stonelens-language", language);
    document.documentElement.lang = language === "en" ? "en" : "zh-CN";
  }, [language]);

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
    const parsedQuota = userQuota ?? storedQuota;
    let storedHistory: HistoryEntry[] = [];
    try {
      storedHistory = JSON.parse(window.localStorage.getItem("stonelens-history") || "[]");
    } catch {
      storedHistory = [];
    }
    window.localStorage.removeItem("stonelens-demo-user");
    window.localStorage.removeItem("stonelens-membership-active");
    const animationFrame = window.requestAnimationFrame(() => {
      if (parsedQuota) {
        const parsed = Number(parsedQuota);
        if (Number.isFinite(parsed)) setFreeScans(Math.max(0, Math.min(10, parsed)));
      }
      setCurrentUser(storedUser);
      setDeviceMember(storedUser?.role === "user" && window.localStorage.getItem(`stonelens-membership-active-${storedUser.username}`) === "true");
      setHistory(storedHistory);
      setQuotaReady(true);
    });
    return () => window.cancelAnimationFrame(animationFrame);
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
    const lazyTargets: Array<{
      node: HTMLElement | null;
      load: () => void;
    }> = [
      { node: atlasLazyRef.current, load: () => setShouldLoadAtlas(true) },
      { node: birthstonesLazyRef.current, load: () => setShouldLoadBirthstones(true) },
    ];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const target = lazyTargets.find((item) => item.node === entry.target);
          target?.load();
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "520px 0px" },
    );
    lazyTargets.forEach((target) => {
      if (target.node) observer.observe(target.node);
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    /* 优化：避免根据 window.location.hash 直接生成首屏状态，修复服务端与客户端 HTML 不一致导致的 Hydration 报错。 */
    const loadByHash = () => {
      if (window.location.hash === "#atlas") setShouldLoadAtlas(true);
      if (window.location.hash === "#birthstones") setShouldLoadBirthstones(true);
    };
    loadByHash();
    window.addEventListener("hashchange", loadByHash);
    return () => window.removeEventListener("hashchange", loadByHash);
  }, []);

  useEffect(() => {
    /* 优化：本地开发时注销旧 service worker，避免 localhost 资源缓存导致页面反复闪烁；生产环境仍保留 PWA 缓存。 */
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "development") {
      navigator.serviceWorker.getRegistrations()
        .then((registrations) => registrations.forEach((registration) => registration.unregister()))
        .catch(() => undefined);
    } else if ("serviceWorker" in navigator) {
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
  /* 优化：识别后默认展示第 1 名，用户点击 Top-5 其他结果时切换当前展示对象。 */
  const activeMatch = recognition?.matches[activeMatchIndex] ?? recognition?.best ?? null;
  const activeReferenceImage = activeMatch?.image || recognition?.referenceImage || "";
  const recognizedProfile = useMemo(
    () => (activeMatch ? profileFor(activeMatch) : null),
    [activeMatch],
  );
  const statusCopy = useMemo(() => {
    if (recognitionError) return recognitionError;
    if (stage === "ready") return copy.readyStatus;
    if (stage === "analyzing") return copy.analyzingStatus;
    if (!currentUser) return copy.guestStatus;
    return copy.idleStatus;
  }, [copy, currentUser, stage, recognitionError]);
  /* 优化：给识别工作台增加轻量流程进度，让上传、框选、检索、结果展示的状态更直观。 */
  const workflowSteps = useMemo(() => {
    const hasImage = Boolean(queryImage);
    return [
      { label: language === "en" ? "Upload" : "上传图片", english: "Upload", state: hasImage || resultVisible ? "done" : "active" },
      { label: language === "en" ? "Crop Subject" : "框选主体", english: "Crop", state: cropOpen ? "active" : hasImage || resultVisible ? "done" : "idle" },
      { label: language === "en" ? "AI Match" : "AI 快速识别", english: "Match", state: stage === "analyzing" ? "active" : resultVisible ? "done" : "idle" },
      { label: language === "en" ? "Result" : "查看结果", english: "Result", state: resultVisible ? "active" : "idle" },
    ];
  }, [cropOpen, language, queryImage, resultVisible, stage]);

  const chooseDemo = () => {
    if (queryImage?.startsWith("blob:")) URL.revokeObjectURL(queryImage);
    /* 优化 */
    setQueryImage(AMETRINE_QUERY_IMAGE);
    setOriginalQueryImage(null);
    setCropOpen(false);
    setQuerySource("demo");
    setRecognition(AMETRINE_DEMO);
    setActiveMatchIndex(0);
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
      setLoginError(copy.loginErrorInvalid);
      return;
    }
    finishSignIn({ username: registered?.username || username, role: username === "admin" ? "admin" : "user" });
  };

  /* 优化：GitHub 静态比赛版提供设备内注册流程，无需单独数据库。 */
  const submitRegistration = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const username = loginUsername.trim();
    if (username.length < 3) return setLoginError(copy.loginErrorUsernameShort);
    if (loginPassword.length < 6) return setLoginError(copy.loginErrorPasswordShort);
    if (loginPassword !== confirmPassword) return setLoginError(copy.loginErrorPasswordMismatch);
    if (username.toLowerCase() === "admin") return setLoginError(copy.loginErrorReserved);
    let accounts: LocalAccount[] = [];
    try {
      accounts = JSON.parse(window.localStorage.getItem("stonelens-local-accounts") || "[]");
    } catch {
      accounts = [];
    }
    if (accounts.some((account) => account.username.toLowerCase() === username.toLowerCase())) {
      return setLoginError(copy.loginErrorExists);
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
      setActiveMatchIndex(0);
      if (querySource === "upload" && !hasUnlimitedScans) {
        setFreeScans((value) => Math.max(0, value - 1));
      }
      setReferenceImageError(false);
      setStage("result");
      window.setTimeout(() => {
        document.getElementById("result-area")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
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
        error instanceof Error ? error.message : (language === "en" ? "Recognition failed. Please refresh and try again." : "识别失败，请刷新页面后重试。"),
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
    setActiveMatchIndex(0);
    setRecognitionError(null);
    setStage("idle");
    if (fileInput.current) fileInput.current.value = "";
  };

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label={language === "en" ? "StoneLens home" : "石相首页"}>
          {/* 优化 */}
          <img className="brand-logo" src={sitePath("/images/diamond-logo.png")} alt={language === "en" ? "StoneLens logo" : "石相 StoneLens Logo"} />
          <span>
            <b>{language === "en" ? "StoneLens" : "石相"}</b>
            <small>StoneLens</small>
          </span>
        </a>
        <nav aria-label={language === "en" ? "Main navigation" : "主导航"}>
          <a href="#identify">{copy.navIdentify}</a>
          <a href="#atlas">{copy.navAtlas}</a>
          <a href="#birthstones">{copy.navBirthstones}</a>
          <a href={sitePath("/divination")}>{copy.navInspiration}</a>
          <a href="#history">{copy.navHistory}</a>
        </nav>
        <button
          className={`mobile-menu-button ${mobileMenuOpen ? "active" : ""}`}
          type="button"
          onClick={() => setMobileMenuOpen((open) => !open)}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-nav-panel"
        >
          <span className="mobile-menu-icon" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="mobile-menu-label">{copy.menu}</span>
        </button>
        <div className="header-actions">
          <button
            className="language-toggle"
            type="button"
            onClick={() => setLanguage((value) => (value === "zh" ? "en" : "zh"))}
            aria-label={language === "en" ? "Switch to Chinese" : "切换到英文"}
          >
            <span className={language === "zh" ? "active" : ""}>{language === "en" ? "ZH" : "中"}</span>
            <i />
            <span className={language === "en" ? "active" : ""}>EN</span>
          </button>
          <button className="login-button" onClick={() => setShowLogin(true)}>
            {/* 优化 */}
            {currentUser
              ? `${currentUser.username} · ${currentUser.role === "admin" ? copy.admin : copy.user}${isMember ? ` · 👑 ${copy.member}` : ""}`
              : copy.login}
          </button>
          {/* 优化：会员开通后不再重复显示购买入口。 */}
          {!isMember && <button className="account-button" onClick={openMembership}>{copy.membership}</button>}
        </div>
        <div className={`mobile-nav-panel ${mobileMenuOpen ? "open" : ""}`} id="mobile-nav-panel">
          <a href="#identify" onClick={() => setMobileMenuOpen(false)}>{copy.navIdentify}</a>
          <a href="#atlas" onClick={() => setMobileMenuOpen(false)}>{copy.navAtlas}</a>
          <a href="#birthstones" onClick={() => setMobileMenuOpen(false)}>{copy.navBirthstones}</a>
          <a href={sitePath("/divination")} onClick={() => setMobileMenuOpen(false)}>{copy.navInspiration}</a>
          <a href="#history" onClick={() => setMobileMenuOpen(false)}>{copy.navHistory}</a>
          {!isMember && <button onClick={() => { setMobileMenuOpen(false); openMembership(); }}>{copy.membership}</button>}
        </div>
      </header>

      <section className="hero hero-carousel" id="top" aria-label={language === "en" ? "Real gemstone and rough stone carousel" : "真实宝石与原石轮播"}>
        <div className="hero-slides" aria-hidden="true">
          {heroSlides.map((slide, index) => (
            <div className={`hero-slide ${index === heroIndex ? "active" : ""}`} key={slide.english}>
              <img src={slide.image} alt="" />
            </div>
          ))}
        </div>
        <div className="hero-shade" />
        <div className="hero-copy hero-overlay-copy">
          <span className="hero-product">{language === "en" ? "StoneLens" : "石相"} <b>StoneLens</b></span>
          <span className="hero-slogan">{copy.heroSlogan}</span>
          <span className="eyebrow">AI GEM DISCOVERY & VISUAL MATCHING</span>
          <h1>
            {copy.heroTitleA}
            <br />
            {copy.heroTitleB}<span>{copy.heroTitleHighlight}</span>
          </h1>
          <p>{copy.heroIntro}</p>
          <div className="hero-actions">
            <button className={`primary-button hero-identify-button ${openingIdentify ? "is-opening" : ""}`} onClick={openIdentifyArea} disabled={openingIdentify}>
              {openingIdentify ? <><span className="button-spinner" />{copy.opening}</> : <>{copy.startIdentify} <span>→</span></>}
            </button>
            <button className="text-button" onClick={chooseDemo}>
              {copy.demo}
            </button>
          </div>
          <div className="scope-row">
            <span><b>87</b> {copy.scopeGem}</span>
            <i />
            <span><b>10</b> {copy.scopeJade}</span>
            <i />
            <span><b>9</b> {copy.scopeRock}</span>
          </div>
        </div>
        <div className="hero-slide-meta" aria-live="polite">
          <span>{language === "en" ? heroSlides[heroIndex].typeEn : heroSlides[heroIndex].type}</span>
          <b>{language === "en" ? heroSlides[heroIndex].english : heroSlides[heroIndex].name}</b>
          <small>{language === "en" ? heroSlides[heroIndex].typeEn : heroSlides[heroIndex].english}</small>
        </div>
        <div className="hero-dots" aria-label={language === "en" ? "Switch homepage image" : "切换首页图片"}>
          {heroSlides.map((slide, index) => (
            <button
              className={index === heroIndex ? "active" : ""}
              key={slide.english}
              onClick={() => setHeroIndex(index)}
              aria-label={language === "en" ? `View ${slide.english}` : `查看${slide.name}`}
            />
          ))}
        </div>
      </section>

      <section className="collection-intro" aria-label={language === "en" ? "Gallery summary" : "图片库说明"}>
        <div>
          <span>DISCOVER EVERY STONE</span>
          <b>{copy.collectionTitle}</b>
        </div>
        <p>{copy.collectionText}</p>
        <div className="collection-line">
          <span>REAL DATASET</span>
          <i />
          <span>SNAP & KNOW</span>
        </div>
      </section>

      {/* 优化：在首页加入轻量会员功能入口，让“石之启示”与主站识别路径自然衔接。 */}
      <section className="inspiration-entry" aria-label={language === "en" ? "Stone Inspiration entry" : "石之启示入口"}>
        <div>
          <span>MEMBER INSPIRATION</span>
          <h2>{copy.inspirationTitle}</h2>
          <p>{copy.inspirationText}</p>
        </div>
        <a href={sitePath("/divination")}>{copy.inspirationCta}</a>
      </section>

      <section className="identify-section" id="identify">
        <div className="section-heading">
          <div>
            <span className="eyebrow">GEM MATCHING WORKSPACE</span>
            <h2>{copy.workspaceTitle}</h2>
          </div>
          <div className="quota">
            <div className="quota-copy">
              <span>{copy.quotaTitle}</span>
              <b>{!currentUser ? copy.quotaLogin : hasUnlimitedScans ? copy.quotaUnlimited : `${copy.quotaLeft} ${freeScans} ${copy.times}`}</b>
            </div>
            <div className={`quota-progress ${hasUnlimitedScans ? "unlimited" : ""}`} role="progressbar" aria-label={language === "en" ? "Remaining free recognition quota" : "免费识别剩余额度"} aria-valuemin={0} aria-valuemax={10} aria-valuenow={!currentUser ? 0 : hasUnlimitedScans ? 10 : freeScans}>
              <i style={{ width: `${!currentUser ? 0 : hasUnlimitedScans ? 100 : freeScans * 10}%` }} />
            </div>
          </div>
        </div>

        {/* 优化：删除实时识别入口，仅保留静态图片识别。 */}
            <div className="workspace">
              <div className={`media-panel reference-panel ${resultVisible ? "has-result" : ""}`}>
                  <div className="panel-head">
                    <span>{copy.reference}</span>
                  </div>
                  {resultVisible && recognition ? (
                    referenceImageError ? (
                      <div className="image-error">
                        <b>{copy.referenceFailed}</b>
                        <span>{copy.refreshRetry}</span>
                      </div>
                    ) : (
                      <img
                        key={activeReferenceImage}
                        src={safeImagePath(activeReferenceImage)}
                        alt={language === "en" ? `${activeMatch?.className || recognition.best.className} reference sample` : `${activeMatch?.className || recognition.best.className} 类别参考图`}
                        loading="eager"
                        decoding="sync"
                        onError={() => setReferenceImageError(true)}
                      />
                    )
                  ) : (
                    <div className="empty-panel">
                      <span className="empty-glyph">◇</span>
                      <p>{copy.referenceEmpty}</p>
                      <small>{copy.referenceEmptySub}</small>
                    </div>
                  )}
              </div>

              <div className={`media-panel query-panel ${queryImage ? "has-query" : ""}`}>
                <div className="panel-head">
                  <span>{copy.uploadTitle}</span>
                  {queryImage && stage !== "idle" && <small>{copy.preview}</small>}
                </div>
                {queryImage ? (
                  <img src={queryImage} alt={language === "en" ? "Uploaded stone image" : "用户上传的石头图片"} />
                ) : (
                  <button className={`upload-zone ${!currentUser ? "guest-locked" : ""}`} onClick={requestImageSelection}>
                    <span className="upload-icon">＋</span>
                    {/* 优化：与参考样本空状态使用一致的提示文字层级。 */}
                    <p>{currentUser ? copy.uploadAction : copy.uploadLocked}</p>
                    <div className="upload-guidance">
                      <small>{copy.uploadGuideA}</small>
                      <small>{copy.uploadGuideB}</small>
                    </div>
                  </button>
                )}
                {/* 优化：识别前可返回原图重新框选石头主体。 */}
                {queryImage && querySource === "upload" && originalQueryImage && stage !== "analyzing" && (
                  <button type="button" className="recrop-button" onClick={() => setCropOpen(true)}>{copy.recrop}</button>
                )}
                {/* 优化：上传完成后在实物图框内直接显示开始识别按钮，移动端无需继续下翻寻找操作区。 */}
                {queryImage && stage === "ready" && (
                  <button type="button" className="inline-recognize-button" onClick={identify}>
                    {copy.inlineIdentify}
                    <span>{copy.inlineSub}</span>
                  </button>
                )}
                {queryImage && stage === "analyzing" && (
                  <button type="button" className="inline-recognize-button is-loading" disabled>
                    <span className="spinner" /> {copy.recognizing}
                  </button>
                )}
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/*"
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
                      ? copy.analyzingSub
                      : copy.statusSub}
                  </small>
                </div>
              </div>
              <div className="scan-flow" aria-label={language === "en" ? "Recognition progress" : "识别流程进度"}>
                {workflowSteps.map((step, index) => (
                  <div className={`scan-flow-step ${step.state}`} key={step.label}>
                    <span>{index + 1}</span>
                    <div><b>{step.label}</b><small>{step.english}</small></div>
                  </div>
                ))}
              </div>
              <div className="action-buttons">
                {stage === "idle" && (
                  <>
                    <button className="secondary-button" onClick={chooseDemo}>{copy.loadDemo}</button>
                    <button className="primary-button" onClick={requestImageSelection}>
                      {currentUser ? copy.chooseImage : copy.loginToIdentify}
                    </button>
                  </>
                )}
                {stage === "ready" && (
                  <>
                    <button className="secondary-button" onClick={reset}>{copy.chooseAgain}</button>
                    <button className="primary-button" onClick={identify}>{copy.startIdentify}</button>
                  </>
                )}
                {stage === "analyzing" && (
                  <button className="primary-button loading-button" disabled>
                    <span className="spinner" /> {copy.recognizing}
                  </button>
                )}
                {stage === "result" && (
                  <button className="primary-button" onClick={reset}>{copy.identifyAnother}</button>
                )}
              </div>
            </div>

        {resultVisible && recognition && (
          <div className="result-area" id="result-area">
            <div className="result-summary">
              <div>
                <span className="result-kicker">{copy.resultKicker}</span>
                <h3>
                  {stoneLabel(activeMatch?.className || recognition.best.className)}
                  <small>{language === "en" ? domainEnglishNames[activeMatch?.domain || recognition.best.domain] : activeMatch?.className || recognition.best.className}</small>
                </h3>
                <div className="result-tags">
                  <span>{domainLabel(activeMatch?.domain || recognition.best.domain)}</span>
                  <span>{copy.realModel}</span>
                  <span>{copy.multiGallery}</span>
                </div>
                {recognizedProfile && (
                  <div className="result-fact-strip" aria-label={language === "en" ? "Recognition summary" : "当前识别结果摘要"}>
                    <div><span>{copy.category}</span><b>{domainLabel(recognizedProfile.domain)}</b><small>{language === "en" ? "Stone category" : domainEnglishNames[recognizedProfile.domain]}</small></div>
                    <div><span>{copy.hardness}</span><b>{hardnessLabel(recognizedProfile.hardness)}</b><small>Mohs hardness</small></div>
                    <div><span>{copy.crystal}</span><b>{crystalLabel(recognizedProfile.crystalSystem)}</b><small>Crystal system</small></div>
                    <div><span>{copy.origin}</span><b>{recognizedProfile.origins[0] ? countryLabel(recognizedProfile.origins[0]) : copy.noData}</b><small>{recognizedProfile.origins.length > 1 ? `${copy.otherOriginPrefix} ${recognizedProfile.origins.length - 1} ${copy.otherOriginSuffix}` : "Principal origin"}</small></div>
                  </div>
                )}
              </div>
              <div className="similarity">
                <span>{copy.similarity} · Top {activeMatchIndex + 1}</span>
                <b>{(activeMatch?.score ?? recognition.best.score).toFixed(3)}</b>
                <small>{copy.similaritySub}</small>
              </div>
            </div>

            {/* 优化：明确视觉匹配边界，避免用户把相似度误解为专业鉴定结论。 */}
            <div className="match-context-note">
              <b>{copy.resultNoteTitle}</b>
              <p>{copy.resultNote}</p>
            </div>

            {recognizedProfile && (
              <section className="recognized-context" aria-label={language === "en" ? "Recognized category 3D model and principal origins" : "识别类别三维模型与主要产地"}>
                <div className="model-profile-panel">
                  <div className="panel-head">
                    <span>{language === "en" ? recognizedProfile.english : `${recognizedProfile.category} · ${recognizedProfile.english}`}</span>
                    <small>{copy.rotateModel}</small>
                  </div>
                  <div className="annotated-model">
                    <div className="model-annotation hardness-annotation">
                      <span>{language === "en" ? "HARDNESS" : "硬度 · HARDNESS"}</span><b>{hardnessLabel(recognizedProfile.hardness)}</b>
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
                      <span>{language === "en" ? "CRYSTAL SYSTEM" : "晶系 · CRYSTAL SYSTEM"}</span><b>{crystalLabel(recognizedProfile.crystalSystem)}</b>
                    </div>
                  </div>
                </div>
                <div className="origin-profile-panel">
                  <div className="panel-head">
                    <span>{copy.originsTitle}</span>
                    <small>{copy.originsHint}</small>
                  </div>
                  <GemOriginMiniMap domain={recognizedProfile.domain} className={recognizedProfile.className} language={language} />
                  <div className="origin-country-list">
                    {recognizedProfile.origins.map((country) => <span key={country}>{countryLabel(country)}</span>)}
                  </div>
                  <p>{copy.originMapNote}</p>
                </div>
              </section>
            )}

            <div className="top-matches">
              <div className="subheading">
                <h3>{copy.top5Title}</h3>
                <span>{copy.top5Hint}</span>
              </div>
              {/* 优化：解释 Top-5 出现的原因，降低用户看到相近类别时的困惑。 */}
              <p className="top-match-explainer">
                {copy.top5Explain}
              </p>
              <div className="match-grid">
                {recognition.matches.map((match, index) => (
                  <button
                    type="button"
                    className={`match-card ${index === activeMatchIndex ? "active" : ""}`}
                    key={`${match.domain}-${match.className}`}
                    onClick={() => {
                      /* 优化：切换 Top-5 选中项时重置参考图错误状态，避免上一张加载失败影响下一张。 */
                      setActiveMatchIndex(index);
                      setReferenceImageError(false);
                    }}
                    aria-pressed={index === activeMatchIndex}
                  >
                    <img src={safeImagePath(match.image)} alt={`${match.className} ${copy.reference}`} />
                    <span>#{index + 1}</span>
                    <div>
                      <b>{language === "en" ? match.className : chineseNameForStone(match.className)}</b>
                      <small>{match.className} · {match.score.toFixed(3)}</small>
                      <i
                        className="match-score-bar"
                        aria-hidden="true"
                        style={{ "--score": `${Math.max(8, Math.min(100, match.score * 100))}%` } as CSSProperties}
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>
            {/* 优化 */}
            <JewelryDesignCarousel gemNames={recognition.matches.slice(0, 5).map((match) => match.className)} language={language} />
            <GemKnowledgeQA
              currentGemName={activeMatch?.className || recognition.best.className}
              isMember={isMember}
              onOpenMembership={openMembership}
              language={language}
            />
          </div>
        )}
      </section>

      <section className="history-section" id="history">
        <div className="history-heading">
          <div><span className="eyebrow">LOCAL HISTORY</span><h2>{copy.historyTitle}</h2></div>
          {/* 优化 */}
          <div><p>{copy.historyText}</p>{history.length > 0 && <button onClick={() => { setHistory([]); window.localStorage.removeItem("stonelens-history"); }}>{copy.clearHistory}</button>}</div>
        </div>
        {history.length === 0 ? (
          <div className="history-empty"><span>◇</span><b>{copy.noHistory}</b><p>{copy.noHistoryText}</p></div>
        ) : (
          <div className="history-grid">
            {history.map((entry) => <article key={entry.id}><img src={entry.thumbnail} alt={`${entry.englishName} history thumbnail`} loading="lazy" /><div><small>{entry.time}</small><b>{language === "en" ? entry.englishName : entry.chineseName}</b><span>{language === "en" ? "" : entry.englishName}</span><em>{language === "en" ? "Similarity" : "匹配度"} {entry.score.toFixed(3)}</em></div></article>)}
          </div>
        )}
      </section>

      {shouldLoadAtlas ? (
        <StoneAtlas language={language} />
      ) : (
        <section className="atlas-section lazy-section-shell" id="atlas" ref={atlasLazyRef}>
          <div className="lazy-section-placeholder">{copy.loadingAtlas}</div>
        </section>
      )}
      {shouldLoadBirthstones ? (
        <BirthstoneStories language={language} />
      ) : (
        <section className="birthstone-stories lazy-section-shell" id="birthstones" ref={birthstonesLazyRef}>
          <div className="lazy-section-placeholder">{copy.loadingBirthstones}</div>
        </section>
      )}

      <footer>
        <div className="brand footer-brand">
          {/* 优化 */}
          <img className="brand-logo" src={sitePath("/images/diamond-logo.png")} alt={language === "en" ? "StoneLens logo" : "石相 StoneLens Logo"} />
          <span><b>{language === "en" ? "StoneLens" : "石相 StoneLens"}</b><small>{copy.footerLab}</small></span>
        </div>
        <p>{copy.footerText}</p>
      </footer>

      {showLoginPrompt && !currentUser && (
        <aside className="login-nudge" aria-live="polite">
          <span className="nudge-icon">◎</span>
          <div><b>{copy.loginNudgeTitle}</b><small>{copy.loginNudgeSub}</small></div>
          <button onClick={() => { setShowLoginPrompt(false); setShowLogin(true); }}>{copy.login}</button>
          <button className="nudge-close" aria-label={language === "en" ? "Close login prompt" : "关闭登录提示"} onClick={() => setShowLoginPrompt(false)}>×</button>
        </aside>
      )}

      {showLogin && (
        <div className="modal-backdrop login-backdrop" onMouseDown={() => setShowLogin(false)}>
          <div className="modal login-modal" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" aria-label={language === "en" ? "Close" : "关闭"} onClick={() => setShowLogin(false)}>×</button>
            <span className="eyebrow">STONELENS ACCOUNT</span>
            {/* 优化：使用正式产品登录文案，不展示本地演示或预设账号信息。 */}
            <h2>{currentUser ? (language === "en" ? "Account" : "账户信息") : authMode === "login" ? (language === "en" ? "Log in to StoneLens" : "登录 StoneLens") : (language === "en" ? "Create a StoneLens account" : "注册 StoneLens")}</h2>
            {currentUser ? (
              <><p>{language === "en" ? "Current account" : "当前账户"}{language === "en" ? ": " : "："}{currentUser.username} · {isMember ? (language === "en" ? "StoneLens Member" : "StoneLens 会员") : (language === "en" ? "Free user" : "免费用户")}</p><button className="secondary-button full-button" onClick={logout}>{language === "en" ? "Log out" : "退出登录"}</button></>
            ) : (
              <>
                <p>{authMode === "login" ? (language === "en" ? "Log in to upload images and save recognition records." : "登录后即可上传图片进行识别，并保存你的识别记录。") : (language === "en" ? "Create an account to receive 10 free recognitions." : "创建账户后可获得 10 次免费识别额度。")}</p>
                <form onSubmit={authMode === "login" ? submitLogin : submitRegistration}>
                  <label htmlFor="login-username">{language === "en" ? "Username" : "用户名"}</label>
                  <input id="login-username" required value={loginUsername} onChange={(event) => setLoginUsername(event.target.value)} placeholder={language === "en" ? "Enter username" : "请输入用户名"} />
                  <label htmlFor="login-password">{language === "en" ? "Password" : "密码"}</label>
                  <input id="login-password" type="password" required value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} placeholder={language === "en" ? "Enter password" : "请输入密码"} />
                  {authMode === "register" && <><label htmlFor="confirm-password">{language === "en" ? "Confirm password" : "确认密码"}</label><input id="confirm-password" type="password" required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder={language === "en" ? "Enter password again" : "请再次输入密码"} /></>}
                  {loginError && <p className="login-error">{loginError}</p>}
                  <button className="primary-button full-button">{authMode === "login" ? (language === "en" ? "Log in" : "登录") : (language === "en" ? "Create account" : "创建账户")}</button>
                </form>
                <button className="auth-mode-switch" onClick={() => { setAuthMode((mode) => mode === "login" ? "register" : "login"); setLoginError(""); }}>
                  {authMode === "login" ? (language === "en" ? "No account yet? Sign up" : "还没有账户？立即注册") : (language === "en" ? "Already have an account? Log in" : "已有账户？返回登录")}
                </button>
              </>
            )}
            <small>{language === "en" ? "By logging in, you agree to the StoneLens terms and privacy policy." : "登录即表示你同意 StoneLens 用户协议与隐私政策。"}</small>
          </div>
        </div>
      )}

      {showBackTop && <button className="back-to-top" aria-label={language === "en" ? "Back to top" : "回到顶部"} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>↑<span>{language === "en" ? "Top" : "顶部"}</span></button>}

      {/* 优化：iOS/安卓浏览器的“添加到主屏幕”引导，不影响正常网页识别。 */}
      <PwaInstallPrompt language={language} />

      {/* 优化 */}
      {showMembership && <MembershipView onClose={closeMembership} onPaymentSuccess={activateMembership} isMember={isMember} language={language} />}

      {/* 优化：只有确认框选后，裁剪图才会进入识别与历史记录流程。 */}
      {cropOpen && originalQueryImage && (
        <ImageCropper
          imageUrl={originalQueryImage}
          language={language}
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
            /* 优化：移动端框选完成后自动定位到实物图与开始识别按钮附近，避免用户继续下翻寻找操作。 */
            window.setTimeout(() => {
              if (window.innerWidth <= 720) {
                document.querySelector(".query-panel")?.scrollIntoView({ behavior: "smooth", block: "center" });
              }
            }, 160);
          }}
        />
      )}
    </main>
  );
}
