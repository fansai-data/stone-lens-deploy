"use client";

import { useMutation } from "@tanstack/react-query";
import { FormEvent, useRef, useState } from "react";
import { chineseNameForStone } from "./stoneKnowledge";
import { sitePath } from "./sitePath";

/* 优化：静态页面调用同一套服务器端 AI 接口，密钥不会暴露在浏览器中。 */
const gemChatEndpoint = process.env.NEXT_PUBLIC_GEM_CHAT_API || sitePath("/api/gem-chat");

/* 优化：给 AI 问答提供低门槛快捷问题，用户无需自己组织提问。 */
const quickQuestions = [
  "这种石头日常佩戴或收藏时怎么保养？",
  "它适合做成什么类型的首饰？",
  "普通用户可以从哪些外观特征初步辨别它？",
  "它常见的主要产地和颜色特点是什么？",
];

const quickQuestionsEn = [
  "How should I care for this stone in daily wear or collecting?",
  "What type of jewelry is it suitable for?",
  "What visual features can beginners use to recognize it?",
  "What are its common origins and color characteristics?",
];

type GemChatRequest = {
  gemName: string;
  question: string;
  language?: "zh" | "en";
};

type GemChatSuccess = {
  answer: string;
};

type GemChatFailure = {
  error: string;
};

async function askGemKnowledge(input: GemChatRequest): Promise<string> {
  const response = await fetch(gemChatEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = (await response.json()) as GemChatSuccess | GemChatFailure;

  if (!response.ok) throw new Error((data as GemChatFailure).error);
  return (data as GemChatSuccess).answer;
}

export default function GemKnowledgeQA({
  currentGemName,
  isMember,
  onOpenMembership,
  language = "zh",
}: {
  currentGemName?: string;
  isMember: boolean;
  onOpenMembership: () => void;
  language?: "zh" | "en";
}) {
  const [question, setQuestion] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const requestTimes = useRef<number[]>([]);
  const questionMutation = useMutation({ mutationFn: askGemKnowledge });
  const isEnglish = language === "en";
  const prompts = isEnglish ? quickQuestionsEn : quickQuestions;
  const currentStoneLabel = currentGemName ? (isEnglish ? currentGemName : `${chineseNameForStone(currentGemName)} · ${currentGemName}`) : (isEnglish ? "the recognition result" : "识别结果");

  const ask = (event: FormEvent) => {
    event.preventDefault();
    setValidationError(null);
    questionMutation.reset();
    if (!isMember) return;
    if (!currentGemName) {
      setValidationError(isEnglish ? "Please complete one stone identification before asking AI." : "请先完成一次石头识别，再向 AI 提问。");
      return;
    }
    const trimmed = question.trim();
    if (!trimmed) {
      setValidationError(isEnglish ? "Please enter a question first." : "请输入你想了解的问题。");
      return;
    }
    const now = Date.now();
    requestTimes.current = requestTimes.current.filter((timestamp) => now - timestamp < 60_000);
    if (requestTimes.current.length >= 3) {
      setValidationError(isEnglish ? "You can ask up to 3 questions per minute. Please try again later." : "每分钟最多提问 3 次，请稍后再试。");
      return;
    }
    requestTimes.current.push(now);
    questionMutation.mutate({ gemName: currentGemName, question: trimmed, language });
  };

  const error = validationError ?? questionMutation.error?.message;
  const answer = questionMutation.data;
  const loading = questionMutation.isPending;

  return (
    <section className={`gem-qa ${isMember ? "" : "is-locked"}`} aria-label={isEnglish ? "AI gem knowledge Q&A" : "AI 宝石知识问答"}>
      <div className="gem-qa-intro">
        <div><span className="eyebrow">AI GEMOLOGY ASSISTANT</span><h3>{isEnglish ? `Learn more about ${currentStoneLabel}` : `继续了解 ${currentStoneLabel}`}</h3></div>
        {/* 优化：保留模型与限流说明，不向用户展示内部回答长度约束。 */}
        <small>{isEnglish ? "DeepSeek V4 Flash · up to 3 questions per minute" : "DeepSeek V4 Flash · 每分钟最多 3 次"}</small>
      </div>
      {!isMember && (
        <div className="gem-qa-member-notice">
          <div><b>{isEnglish ? "Members only" : "该功能为会员专属"}</b><span>{isEnglish ? "Unlock membership to use AI gem Q&A" : "开通会员后可使用 AI 宝石知识问答"}</span></div>
          <button className="secondary-button" onClick={onOpenMembership}>{isEnglish ? "View membership" : "查看会员权益"}</button>
        </div>
      )}
      <div className="gem-qa-prompts" aria-label={isEnglish ? "Quick questions" : "快捷提问"}>
        {prompts.map((prompt) => (
          <button
            type="button"
            key={prompt}
            onClick={() => {
              /* 优化：快捷问题只填入输入框，不自动发送，避免误触造成 API 请求。 */
              setQuestion(prompt);
              setValidationError(null);
              questionMutation.reset();
            }}
            disabled={!isMember}
          >
            {prompt}
          </button>
        ))}
      </div>
      <form onSubmit={ask}>
        <input
          value={question}
          maxLength={300}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder={isEnglish ? "Example: What should I know before wearing this stone?" : "例如：这种宝石日常佩戴时需要注意什么？"}
          aria-label={isEnglish ? "Ask AI a question" : "向 AI 提问"}
          disabled={!isMember}
        />
        <button className="primary-button" disabled={!isMember || loading}>
          {loading ? (
            <span className="ai-typing-dots" aria-label={isEnglish ? "AI is thinking" : "AI 正在思考"}>
              <i /><i /><i />
            </span>
          ) : (
            isEnglish ? "Ask AI" : "询问 AI"
          )}
        </button>
      </form>
      {loading && (
        <div className="gem-qa-answer gem-qa-loading" aria-live="polite">
          <b>{isEnglish ? "DeepSeek V4 Flash is thinking" : "DeepSeek V4 Flash 正在思考"}</b>
          <p className="ai-thinking-text">
            <span>{isEnglish ? "Searching gem knowledge" : "正在检索宝石知识库"}</span>
            <span className="ai-typing-dots inline">
              <i /><i /><i />
            </span>
          </p>
        </div>
      )}
      {!loading && (answer || error) && (
        <div className={`gem-qa-answer ${error ? "error" : ""}`} aria-live="polite">
          <b>{error ? (isEnglish ? "Unable to answer right now" : "暂时无法回答") : "DeepSeek V4 Flash"}</b>
          <p>{error || answer}</p>
        </div>
      )}
      <small className="gem-qa-note">{isEnglish ? "AI content is for knowledge exploration only. It does not judge authenticity, value or medical effects." : "AI 内容用于知识探索，不提供真伪、价值或医学功效判断。"}</small>
    </section>
  );
}
