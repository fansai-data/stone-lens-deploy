const requestWindows = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 3;

type GemChatMode = "knowledge" | "revelation";

type GemChatPayload = {
  gemName?: string;
  question?: string;
  mode?: GemChatMode;
};

function keepCompleteAnswer(value: string, mode: GemChatMode): string {
  const answer = value.trim().replace(/\n{3,}/g, "\n\n");
  const maxLength = mode === "revelation" ? 96 : 180;
  const minLength = mode === "revelation" ? 52 : 100;
  if (answer.length <= maxLength) return answer;

  const sentenceEnds: number[] = [];
  for (let index = 0; index < Math.min(answer.length, maxLength); index += 1) {
    if (/[。！？]/.test(answer[index])) sentenceEnds.push(index + 1);
  }
  const complete = sentenceEnds.filter((position) => position >= minLength).at(-1);
  if (complete) return answer.slice(0, complete).trim();

  return `${answer.slice(0, maxLength - 1).trim().replace(/[，；、：:,.!?。！？]$/, "")}。`;
}

function clientId(request: Request): string {
  return request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "local";
}

function allowRequest(id: string): boolean {
  const now = Date.now();
  const recent = (requestWindows.get(id) || []).filter((timestamp) => now - timestamp < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS) return false;
  recent.push(now);
  requestWindows.set(id, recent);
  return true;
}

function normalizeRevelationAnswer(answer: string): string {
  const prefix = "什么石头提示您：";
  if (answer.startsWith(prefix)) return answer;
  return `${prefix}${answer.replace(/^什么石头[：:，, ]?/, "").trim()}`;
}

export async function POST(request: Request) {
  /* 优化：复用同一个 AI 接口，通过 mode 区分“石种科普”和“石之启示”，不新增技术栈。 */
  if (!allowRequest(clientId(request))) {
    return Response.json({ error: "提问过于频繁，请一分钟后再试。" }, { status: 429 });
  }

  let payload: GemChatPayload;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "请求格式不正确。" }, { status: 400 });
  }

  const mode: GemChatMode = payload.mode === "revelation" ? "revelation" : "knowledge";
  const gemName = payload.gemName?.trim().slice(0, 80) || "";
  const question = payload.question?.trim().slice(0, 300) || "";

  if (!gemName || (mode === "knowledge" && !question)) {
    return Response.json({ error: "请先完成识别并输入问题。" }, { status: 400 });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "AI 知识服务尚未配置 API Key。" }, { status: 503 });
  }

  const systemPrompt =
    mode === "revelation"
      ? "你是一个温和的石头启发助手。用户会告诉你ta选了一颗石头，并问了一个问题。你的任务是基于这颗石头的名字和用户的提问，写一段约60-80字的启发式文字。必须用“什么石头提示您：”开头；不预测未来，不涉及吉凶、财运、桃花、命运；只做温和叙述，像朋友分享想法；不重复用户的问题；不解释石头物理属性，只做文学化联想；如果问题涉及重大决策，温和提醒用户自己才是决定者。"
      : "你是专业、亲切的宝石学知识助手。围绕给定的匹配类别，用简体中文正面回答用户的具体问题；除非用户询问鉴定，否则不要复述视觉识别原理。正文必须控制在100到180个汉字之间，优先用1到2个短段落；不要写标题、列表、开场白或结尾客套话。必须把最后一句写完整，禁止用省略号表示截断。明确区分视觉匹配与专业鉴定；不确定时直接说明，不虚构产地、价格、功效或真伪结论。";

  const userPrompt =
    mode === "revelation"
      ? `用户选择的石头：${gemName}\n用户想问的事：${question || "没有具体问题，只想获得一句此刻的启发。"}`
      : `当前视觉匹配类别：${gemName}\n用户问题：${question}`;

  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-v4-flash",
        thinking: { type: "disabled" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: mode === "revelation" ? 150 : 260,
        stream: false,
      }),
    });

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      error?: { message?: string };
    };

    if (!response.ok) {
      const message =
        response.status === 402
          ? "AI 服务余额不足，请联系管理员。"
          : response.status === 429
            ? "AI 服务当前繁忙，请稍后重试。"
            : data.error?.message || "AI 服务暂时不可用。";
      return Response.json({ error: message }, { status: response.status });
    }

    const rawAnswer = data.choices?.[0]?.message?.content?.trim();
    if (!rawAnswer) throw new Error("empty response");
    const answer = mode === "revelation" ? normalizeRevelationAnswer(rawAnswer) : rawAnswer;
    return Response.json({ answer: keepCompleteAnswer(answer, mode) });
  } catch {
    return Response.json({ error: "AI 服务连接失败，请稍后重试。" }, { status: 502 });
  }
}
