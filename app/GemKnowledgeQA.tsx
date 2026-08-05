"use client";

import { FormEvent, useRef, useState } from "react";
import { chineseNameForStone } from "./stoneKnowledge";

/* 优化 */
export default function GemKnowledgeQA({
  currentGemName,
  isMember,
  onOpenMembership,
}: {
  currentGemName?: string;
  isMember: boolean;
  onOpenMembership: () => void;
}) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const requestTimes = useRef<number[]>([]);

  const ask = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!isMember) return;
    if (!currentGemName) {
      setError("请先完成一次石头识别，再向 AI 提问。");
      return;
    }
    const trimmed = question.trim();
    if (!trimmed) {
      setError("请输入你想了解的问题。");
      return;
    }
    const now = Date.now();
    requestTimes.current = requestTimes.current.filter((timestamp) => now - timestamp < 60_000);
    if (requestTimes.current.length >= 3) {
      setError("每分钟最多提问 3 次，请稍后再试。");
      return;
    }
    requestTimes.current.push(now);
    setLoading(true);
    try {
      const response = await fetch("/api/gem-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gemName: currentGemName, question: trimmed }),
      });
      const data = (await response.json()) as { answer?: string; error?: string };
      if (!response.ok || !data.answer) throw new Error(data.error || "AI 暂时没有返回答案。");
      setAnswer(data.answer);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "提问失败，请稍后重试。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={`gem-qa ${isMember ? "" : "is-locked"}`} aria-label="AI 宝石知识问答">
      <div className="gem-qa-intro">
        <div><span className="eyebrow">AI GEMOLOGY ASSISTANT</span><h3>继续了解 {currentGemName ? `${chineseNameForStone(currentGemName)} · ${currentGemName}` : "识别结果"}</h3></div>
        {/* 优化：保留模型与限流说明，不向用户展示内部回答长度约束。 */}
        <small>DeepSeek V4 Flash · 每分钟最多 3 次</small>
      </div>
      {!isMember && (
        <div className="gem-qa-member-notice">
          <div><b>该功能为会员专属</b><span>开通会员后可使用 AI 宝石知识问答</span></div>
          <button className="secondary-button" onClick={onOpenMembership}>查看会员权益</button>
        </div>
      )}
      <form onSubmit={ask}>
        <input
          value={question}
          maxLength={300}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="例如：这种宝石日常佩戴时需要注意什么？"
          aria-label="向 AI 提问"
          disabled={!isMember}
        />
        <button className="primary-button" disabled={!isMember || loading}>
          {loading ? "正在回答…" : "询问 AI"}
        </button>
      </form>
      {(answer || error) && (
        <div className={`gem-qa-answer ${error ? "error" : ""}`} aria-live="polite">
          <b>{error ? "暂时无法回答" : "DeepSeek V4 Flash"}</b>
          <p>{error || answer}</p>
        </div>
      )}
      <small className="gem-qa-note">AI 内容用于知识探索，不提供真伪、价值或医学功效判断。</small>
    </section>
  );
}
