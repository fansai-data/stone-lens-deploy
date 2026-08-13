"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { sitePath } from "../sitePath";

const OracleDiamondModel = dynamic(() => import("../GemModel3D"), {
  ssr: false,
  loading: () => (
    <div className="oracle-three-loading">
      <span />
      正在唤醒钻石光影…
    </div>
  ),
});

type OracleStone = {
  name: string;
  english: string;
  tone: string;
  image: string;
  color: string;
};

const ORACLE_POOL: OracleStone[] = [
  { name: "红宝石", english: "Ruby", tone: "热情与勇气", image: "/model/references/gemstone--Ruby--1.webp", color: "#b3154a" },
  { name: "石榴石", english: "Garnet Red", tone: "坚定与守护", image: "/model/references/gemstone--Garnet-Red--1.webp", color: "#8f1d36" },
  { name: "红玛瑙", english: "Red Agate", tone: "稳定与行动", image: "/model/references/gemstone--Onyx-Red--1.webp", color: "#b94a3e" },
  { name: "蓝宝石", english: "Sapphire Blue", tone: "清醒与秩序", image: "/model/references/gemstone--Sapphire-Blue--1.webp", color: "#3154b7" },
  { name: "海蓝宝石", english: "Aquamarine", tone: "平静与表达", image: "/model/references/gemstone--Aquamarine--1.webp", color: "#4ea7c9" },
  { name: "青金石", english: "Lapis Lazuli", tone: "洞察与诚实", image: "/model/references/gemstone--Lapis-Lazuli--1.webp", color: "#21428f" },
  { name: "紫水晶", english: "Amethyst", tone: "沉静与整理", image: "/model/references/gemstone--Amethyst--1.webp", color: "#7b3faf" },
  { name: "紫锂辉石", english: "Kunzite", tone: "柔软与接纳", image: "/model/references/gemstone--Kunzite--1.webp", color: "#b778bc" },
  { name: "祖母绿", english: "Emerald", tone: "生长与修复", image: "/model/references/gemstone--Emerald--1.webp", color: "#2f8d5c" },
  { name: "橄榄石", english: "Peridot", tone: "更新与轻盈", image: "/model/references/gemstone--Peridot--1.webp", color: "#7ea344" },
  { name: "玉", english: "Jade", tone: "温润与耐心", image: "/model/references/gemstone--Jade--1.webp", color: "#3b8f72" },
  { name: "孔雀石", english: "Malachite", tone: "转变与边界", image: "/model/references/gemstone--Malachite--1.webp", color: "#198065" },
  { name: "黄水晶", english: "Citrine", tone: "明亮与选择", image: "/model/references/gemstone--Citrine--1.webp", color: "#d39725" },
  { name: "琥珀", english: "Amber", tone: "记忆与温度", image: "/model/references/gemstone--Amber--1.webp", color: "#c87824" },
  { name: "月光石", english: "Moonstone", tone: "直觉与缓冲", image: "/model/references/gemstone--Moonstone--1.webp", color: "#8b91b5" },
  { name: "黑玛瑙", english: "Onyx Black", tone: "沉稳与保护", image: "/model/references/gemstone--Onyx-Black--1.webp", color: "#2f2b34" },
  { name: "拉长石", english: "Labradorite", tone: "灵感与变化", image: "/model/references/gemstone--Labradorite--1.webp", color: "#526c77" },
  { name: "坦桑石", english: "Tanzanite", tone: "专注与远望", image: "/model/references/gemstone--Tanzanite--1.webp", color: "#5a57bb" },
  { name: "钻石", english: "Diamond", tone: "澄澈与决断", image: "/model/references/gemstone--Diamond--1.webp", color: "#8a75b7" },
  { name: "珍珠", english: "Pearl", tone: "温柔与沉淀", image: "/model/references/gemstone--Pearl--1.webp", color: "#b98c8d" },
  { name: "玛瑙", english: "Blue Lace Agate", tone: "节奏与安放", image: "/model/references/gemstone--Blue-Lace-Agate--1.webp", color: "#83a9c9" },
];

const INITIAL_ORACLE_STONES = ORACLE_POOL.slice(0, 3);

const ORACLE_QUESTION_EXAMPLES = [
  "我最近有点犹豫，想听一句提醒",
  "我想重新开始一件事，可以给我一点灵感吗",
  "我现在需要更勇敢还是更安静",
  "今天适合把注意力放在哪里",
];

function pickThree(): OracleStone[] {
  const shuffled = [...ORACLE_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

function localFallback(stone: OracleStone, question: string): string {
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
    if (!selected) return "请选择一颗石头";
    return `${selected.name} · ${selected.english}`;
  }, [selected]);

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
    setLoading(true);
    setAnswer("");
    setNotice("");
    try {
      const response = await fetch(sitePath("/api/gem-chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gemName: `${selected.name} / ${selected.english}`,
          question,
          mode: "revelation",
        }),
      });
      const data = (await response.json()) as { answer?: string; error?: string };
      if (!response.ok || !data.answer) throw new Error(data.error || "AI 暂时没有回应");
      setAnswer(data.answer);
    } catch {
      /* 优化：本地没有 API Key 时也能预览完整交互效果，正式部署仍优先调用后端 AI。 */
      setNotice("本地预览已使用备用启示文案；部署环境配置 API 后会自动调用 DeepSeek。");
      setAnswer(localFallback(selected, question));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="divination-page">
      <nav className="divination-nav" aria-label="石之启示导航">
        <a className="divination-brand" href={sitePath("/")}>
          <img src={sitePath("/images/diamond-logo.png")} alt="" />
          <span>石相 StoneLens</span>
        </a>
        <div>
          <a href={sitePath("/#identify")}>识别宝石</a>
          <a href={sitePath("/#birthstones")}>生辰石趣闻</a>
        </div>
      </nav>

      <section className="oracle-hero">
        <span className="eyebrow">STONE INSPIRATION</span>
        <h1>石之启示</h1>
        <p>选一颗与你此刻心境相连的石头，让它给你一句轻轻的提醒。这里不是预测未来，而是把石头的颜色、名字与气质，变成一段可收藏的灵感。</p>
      </section>

      <section className="oracle-card" aria-label="石之启示互动区">
        <div className="oracle-card-head">
          <div>
            <span className="eyebrow">CHOOSE A STONE</span>
            <h2>从这三颗石头里，选一颗</h2>
          </div>
          <div className="oracle-card-diamond" aria-label="可旋转钻石装饰模型">
            <OracleDiamondModel
              compact
              initialCut="brilliant"
              color="#d9d2ff"
              crystalSystem="立方晶系"
              stoneName="Diamond"
              stoneDomain="gemstone"
              showCutSwitch={false}
              turntable
            />
          </div>
          <button type="button" className="oracle-refresh" onClick={refreshStones}>🔄 换一组灵感石</button>
        </div>

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
              <img src={sitePath(stone.image)} alt={`${stone.name} ${stone.english}`} />
              <span>{stone.name}</span>
              <small>{stone.english}</small>
              <b>{stone.tone}</b>
            </button>
          ))}
        </div>

        <div className="oracle-question-panel">
          <label>
            <span>📝 你想问什么？（选填）</span>
            <div className="oracle-question-examples" aria-label="问题示例">
              {ORACLE_QUESTION_EXAMPLES.map((example) => (
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
              placeholder="例如：我最近有点犹豫，想听一句提醒"
            />
          </label>
          <button type="button" className="oracle-submit" onClick={askOracle} disabled={!selected || loading}>
            {loading ? "正在聆听石头…" : "✨ 获得启示"}
          </button>
        </div>

        <div className="oracle-result" aria-live="polite">
          <span>{selectedLabel}</span>
          {notice && <small>{notice}</small>}
          <p className={shownAnswer ? "is-visible" : ""}>
            {shownAnswer || "选择石头后点击按钮，这里会逐字浮现它给你的启发。"}
          </p>
        </div>
      </section>
    </main>
  );
}
