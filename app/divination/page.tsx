"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import { sitePath } from "../sitePath";

const OracleDiamondModel = dynamic(() => import("../GemModel3D"), {
  ssr: false,
  loading: () => (
    <div className="oracle-three-loading">
      <span />
      Loading diamond light…
    </div>
  ),
});

type OracleStone = {
  name: string;
  english: string;
  tone: string;
  toneEn: string;
  image: string;
  color: string;
};

const ORACLE_POOL: OracleStone[] = [
  { name: "红宝石", english: "Ruby", tone: "热情与勇气", toneEn: "Passion & courage", image: "/model/references/gemstone--Ruby--1.webp", color: "#b3154a" },
  { name: "石榴石", english: "Garnet Red", tone: "坚定与守护", toneEn: "Steadiness & protection", image: "/model/references/gemstone--Garnet-Red--1.webp", color: "#8f1d36" },
  { name: "红玛瑙", english: "Red Agate", tone: "稳定与行动", toneEn: "Stability & action", image: "/model/references/gemstone--Onyx-Red--1.webp", color: "#b94a3e" },
  { name: "蓝宝石", english: "Sapphire Blue", tone: "清醒与秩序", toneEn: "Clarity & order", image: "/model/references/gemstone--Sapphire-Blue--1.webp", color: "#3154b7" },
  { name: "海蓝宝石", english: "Aquamarine", tone: "平静与表达", toneEn: "Calm & expression", image: "/model/references/gemstone--Aquamarine--1.webp", color: "#4ea7c9" },
  { name: "青金石", english: "Lapis Lazuli", tone: "洞察与诚实", toneEn: "Insight & honesty", image: "/model/references/gemstone--Lapis-Lazuli--1.webp", color: "#21428f" },
  { name: "紫水晶", english: "Amethyst", tone: "沉静与整理", toneEn: "Stillness & sorting", image: "/model/references/gemstone--Amethyst--1.webp", color: "#7b3faf" },
  { name: "紫锂辉石", english: "Kunzite", tone: "柔软与接纳", toneEn: "Softness & acceptance", image: "/model/references/gemstone--Kunzite--1.webp", color: "#b778bc" },
  { name: "祖母绿", english: "Emerald", tone: "生长与修复", toneEn: "Growth & repair", image: "/model/references/gemstone--Emerald--1.webp", color: "#2f8d5c" },
  { name: "橄榄石", english: "Peridot", tone: "更新与轻盈", toneEn: "Renewal & lightness", image: "/model/references/gemstone--Peridot--1.webp", color: "#7ea344" },
  { name: "玉", english: "Jade", tone: "温润与耐心", toneEn: "Gentleness & patience", image: "/model/references/gemstone--Jade--1.webp", color: "#3b8f72" },
  { name: "孔雀石", english: "Malachite", tone: "转变与边界", toneEn: "Change & boundaries", image: "/model/references/gemstone--Malachite--1.webp", color: "#198065" },
  { name: "黄水晶", english: "Citrine", tone: "明亮与选择", toneEn: "Brightness & choice", image: "/model/references/gemstone--Citrine--1.webp", color: "#d39725" },
  { name: "琥珀", english: "Amber", tone: "记忆与温度", toneEn: "Memory & warmth", image: "/model/references/gemstone--Amber--1.webp", color: "#c87824" },
  { name: "月光石", english: "Moonstone", tone: "直觉与缓冲", toneEn: "Intuition & pause", image: "/model/references/gemstone--Moonstone--1.webp", color: "#8b91b5" },
  { name: "黑玛瑙", english: "Onyx Black", tone: "沉稳与保护", toneEn: "Grounding & protection", image: "/model/references/gemstone--Onyx-Black--1.webp", color: "#2f2b34" },
  { name: "拉长石", english: "Labradorite", tone: "灵感与变化", toneEn: "Inspiration & change", image: "/model/references/gemstone--Labradorite--1.webp", color: "#526c77" },
  { name: "坦桑石", english: "Tanzanite", tone: "专注与远望", toneEn: "Focus & distance", image: "/model/references/gemstone--Tanzanite--1.webp", color: "#5a57bb" },
  { name: "钻石", english: "Diamond", tone: "澄澈与决断", toneEn: "Clarity & decision", image: "/model/references/gemstone--Diamond--1.webp", color: "#8a75b7" },
  { name: "珍珠", english: "Pearl", tone: "温柔与沉淀", toneEn: "Tenderness & settling", image: "/model/references/gemstone--Pearl--1.webp", color: "#b98c8d" },
  { name: "玛瑙", english: "Blue Lace Agate", tone: "节奏与安放", toneEn: "Rhythm & placement", image: "/model/references/gemstone--Blue-Lace-Agate--1.webp", color: "#83a9c9" },
];

const INITIAL_ORACLE_STONES = ORACLE_POOL.slice(0, 3);

const ORACLE_QUESTION_EXAMPLES = [
  "今天有点累，想听一句轻一点的话",
  "最近想开始新计划，可以给我一点灵感吗",
  "我想整理一下自己的状态",
  "给我一句适合今天的提醒",
];

const ORACLE_QUESTION_EXAMPLES_EN = [
  "I feel a little tired today. Give me something gentle.",
  "I want to start a new plan. Can I have some inspiration?",
  "I want to sort out my current state.",
  "Give me a reminder for today.",
];

function getOracleMemberSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  const username = window.localStorage.getItem("stonelens-current-user") || "";
  if (username === "admin") return true;
  return Boolean(username && window.localStorage.getItem(`stonelens-membership-active-${username}`) === "true");
}

function subscribeOracleMemberStatus(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function pickThree(): OracleStone[] {
  const shuffled = [...ORACLE_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

function localFallback(stone: OracleStone, question: string, language: "zh" | "en"): string {
  if (language === "en") {
    const suffix = question.trim()
      ? "Turn the question into one small action you can take today: name one concern, then name one thing you still want to keep. Clarity does not have to arrive all at once."
      : "Give yourself ten quiet minutes today and choose one small thing that is easy to begin. This is not about forcing change, but gently returning attention to what you can hold.";
    return `${stone.english} brings ${stone.toneEn.toLowerCase()} into your palm, like a quiet light that asks you to notice what is truly moving inside you. ${suffix}`;
  }
  const suffix = question.trim()
    ? "先把问题拆成一个今天能完成的小动作，比如写下最担心的一点，再写下最想保留的一点。答案不必立刻被命名，清晰会在行动里慢慢出现。"
    : "今天可以先给自己留出十分钟安静时间，整理一件最容易开始的小事。不是逼自己马上改变，而是把注意力重新收回到可掌控的地方。";
  return `${stone.name}把${stone.tone}放在掌心，像一束不急不躁的光，提醒您先看见此刻真正牵动自己的部分。${suffix}`;
}

export default function DivinationPage() {
  const [stones, setStones] = useState<OracleStone[]>(INITIAL_ORACLE_STONES);
  const [selected, setSelected] = useState<OracleStone | null>(INITIAL_ORACLE_STONES[0] ?? null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [shownAnswer, setShownAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [isShuffling, setIsShuffling] = useState(false);
  const [language, setLanguage] = useState<"zh" | "en">("zh");
  /* 优化：石之启示作为会员专属功能，复用主站本地会员状态，并避免 effect 内同步 setState 导致 CI lint 失败。 */
  const isMember = useSyncExternalStore(subscribeOracleMemberStatus, getOracleMemberSnapshot, () => false);

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
    if (!answer) {
      const clearTimer = window.setTimeout(() => setShownAnswer(""), 0);
      return () => window.clearTimeout(clearTimer);
    }
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setShownAnswer(answer.slice(0, index));
      if (index >= answer.length) window.clearInterval(timer);
    }, 28);
    return () => window.clearInterval(timer);
  }, [answer]);

  const selectedLabel = useMemo(() => {
    if (!selected) return language === "en" ? "Choose a stone" : "请选择一颗石头";
    return language === "en" ? selected.english : `${selected.name} · ${selected.english}`;
  }, [language, selected]);

  const refreshStones = () => {
    /* 优化：换一组石头时增加轻微淡出淡入，避免图片突然跳变。 */
    setIsShuffling(true);
    window.setTimeout(() => {
      const next = pickThree();
      setStones(next);
      setSelected(next[0] ?? null);
      setAnswer("");
      setNotice("");
      window.setTimeout(() => setIsShuffling(false), 90);
    }, 150);
  };

  const askOracle = async () => {
    if (!selected || loading) return;
    if (!isMember) {
      setNotice(language === "en" ? "Stone Inspiration is a member-only feature. Unlock membership to use AI inspiration." : "石之启示为会员专属，开通会员后即可使用 AI 灵感问答。");
      return;
    }
    setLoading(true);
    setAnswer("");
    setNotice("");
    try {
      const response = await fetch(sitePath("/api/gem-chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gemName: language === "en" ? selected.english : `${selected.name} / ${selected.english}`,
          question,
          mode: "revelation",
          language,
        }),
      });
      const data = (await response.json()) as { answer?: string; error?: string };
      if (!response.ok || !data.answer) throw new Error(data.error || (language === "en" ? "AI did not respond yet" : "AI 暂时没有回应"));
      setAnswer(data.answer);
    } catch {
      /* 优化：本地没有 API Key 时也能预览完整交互效果，正式部署仍优先调用后端 AI。 */
      setNotice(language === "en" ? "Local preview is using a fallback inspiration. The deployed site will call DeepSeek after API configuration." : "本地预览已使用备用启示文案；部署环境配置 API 后会自动调用 DeepSeek。");
      setAnswer(localFallback(selected, question, language));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="divination-page">
      <nav className="divination-nav" aria-label={language === "en" ? "Stone Inspiration navigation" : "石之启示导航"}>
        <a className="divination-brand" href={sitePath("/")}>
          <img src={sitePath("/images/diamond-logo.png")} alt="" />
          <span>{language === "en" ? "StoneLens" : "石相 StoneLens"}</span>
        </a>
        <div>
          <a href={sitePath("/#identify")}>{language === "en" ? "Identify" : "识别宝石"}</a>
          <a href={sitePath("/#birthstones")}>{language === "en" ? "Birthstones" : "生辰石趣闻"}</a>
          <button
            type="button"
            className="language-toggle divination-language-toggle"
            onClick={() => setLanguage((value) => value === "zh" ? "en" : "zh")}
            aria-label={language === "en" ? "Switch to Chinese" : "切换到英文"}
          >
            <span className={language === "zh" ? "active" : ""}>{language === "en" ? "ZH" : "中"}</span>
            <i />
            <span className={language === "en" ? "active" : ""}>EN</span>
          </button>
        </div>
      </nav>

      <section className="oracle-hero">
        <span className="eyebrow">STONE INSPIRATION</span>
        <h1>{language === "en" ? "Stone Inspiration" : "石之启示"}</h1>
        <p>{language === "en" ? "Members only · Choose a stone that catches your eye and receive a gentle inspiration for today." : "会员专属 · 选一颗顺眼的石头，获得一句今日灵感。"}</p>
      </section>

      <section className="oracle-card" aria-label={language === "en" ? "Stone Inspiration interaction" : "石之启示互动区"}>
        <div className="oracle-card-head">
          <div>
            <span className="eyebrow">CHOOSE A STONE</span>
            <h2>{language === "en" ? "Choose one from these three stones" : "从这三颗石头里，选一颗"}</h2>
          </div>
          <div className="oracle-card-diamond" aria-label={language === "en" ? "Rotatable diamond decoration model" : "可旋转钻石装饰模型"}>
            <OracleDiamondModel
              compact
              initialCut="brilliant"
              color="#d9d2ff"
              crystalSystem={language === "en" ? "Cubic" : "立方晶系"}
              stoneName="Diamond"
              stoneDomain="gemstone"
              showCutSwitch={false}
              turntable
            />
          </div>
          <button type="button" className="oracle-refresh" onClick={refreshStones}>{language === "en" ? "↻ Refresh stones" : "🔄 换一组灵感石"}</button>
        </div>

        {!isMember && (
          <div className="oracle-member-gate">
            <span>{language === "en" ? "Members only" : "会员专属功能"}</span>
            <p>{language === "en" ? "Unlock membership to generate AI stone inspiration. This page can still be previewed." : "开通会员后可使用 AI 生成石头灵感；当前页面仍可作为功能预览。"}</p>
            <a href={sitePath("/#membership")}>{language === "en" ? "Open membership" : "开通会员"}</a>
          </div>
        )}

        <div className="oracle-compact-layout">
          <div className="oracle-left-panel">
            <div className={`oracle-stone-grid ${isShuffling ? "is-shuffling" : ""}`}>
              {stones.map((stone) => (
                <button
                  type="button"
                  key={stone.english}
                  className={`oracle-stone-card ${selected?.english === stone.english ? "selected" : ""}`}
                  onClick={() => {
                    setSelected(stone);
                    setAnswer("");
                    setNotice("");
                  }}
                  style={{ "--stone-color": stone.color } as CSSProperties}
                >
                  <img src={sitePath(stone.image)} alt={language === "en" ? stone.english : `${stone.name} ${stone.english}`} />
                  <span>{language === "en" ? stone.english : stone.name}</span>
                  <small>{language === "en" ? stone.toneEn : stone.english}</small>
                  <b>{language === "en" ? stone.toneEn : stone.tone}</b>
                  {selected?.english === stone.english && <em>{language === "en" ? "Selected" : "已选择"}</em>}
                </button>
              ))}
            </div>

            <div className="oracle-question-panel">
              <label>
                <span>{language === "en" ? "What would you like to ask? (optional)" : "📝 你想问什么？（选填）"}</span>
                <p className="oracle-input-guide">{language === "en" ? "This does not predict the future. It turns a stone’s color, name and mood into a gentle reminder." : "这里不是预测未来，而是把石头的颜色、名字与气质，变成一段轻轻的提醒。"}</p>
                <div className="oracle-question-examples" aria-label={language === "en" ? "Question examples" : "问题示例"}>
                  {(language === "en" ? ORACLE_QUESTION_EXAMPLES_EN : ORACLE_QUESTION_EXAMPLES).slice(0, 3).map((example) => (
                    <button
                      type="button"
                      key={example}
                      onClick={() => {
                        setQuestion(example);
                        setAnswer("");
                        setNotice("");
                      }}
                    >
                      {example}
                    </button>
                  ))}
                </div>
                <input
                  value={question}
                  maxLength={120}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder={language === "en" ? "Write a question, or tap an example above" : "写一句你想问的话，或点上方示例"}
                  disabled={!isMember}
                />
              </label>
              <button type="button" className="oracle-submit" onClick={askOracle} disabled={!isMember || !selected || loading}>
                {loading ? (language === "en" ? "Listening to the stone…" : "正在聆听石头…") : (language === "en" ? "✨ Get inspiration" : "✨ 获得启示")}
              </button>
            </div>
          </div>

          <div className="oracle-result" aria-live="polite">
            <span>{selectedLabel}</span>
            {notice && <small>{notice}</small>}
            <p className={shownAnswer ? "is-visible" : ""}>
              {shownAnswer || (language === "en" ? "Choose a stone and tap the button. Its gentle inspiration will appear here letter by letter." : "选择石头后点击按钮，这里会逐字浮现它给你的启发。")}
            </p>
            <div className="oracle-result-actions">
              <button type="button" onClick={askOracle} disabled={!isMember || !selected || loading}>
                {loading ? (language === "en" ? "Generating…" : "生成中…") : (language === "en" ? "Another line" : "再来一句")}
              </button>
              <a href={sitePath("/#identify")}>{language === "en" ? "Back to identification" : "返回识别宝石"}</a>
            </div>
            <small className="oracle-disclaimer">{language === "en" ? "For inspiration only. Not decision-making advice." : "内容仅作灵感参考，不作为决策建议。"}</small>
          </div>
        </div>
      </section>
    </main>
  );
}
