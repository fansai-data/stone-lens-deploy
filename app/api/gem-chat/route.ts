const requestWindows = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 3;

/* 优化：允许 GitHub Pages 静态前端安全复用此服务器端 AI 接口。 */
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://justice060407.github.io",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Vary": "Origin",
};

function json(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  Object.entries(CORS_HEADERS).forEach(([name, value]) => headers.set(name, value));
  return Response.json(data, { ...init, headers });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

function keepCompleteAnswer(value: string): string {
  const answer = value.trim().replace(/\n{3,}/g, "\n\n");
  if (answer.length <= 180) return answer;
  const sentenceEnds: number[] = [];
  for (let index = 0; index < Math.min(answer.length, 180); index += 1) {
    if (/[。！？!?]/.test(answer[index])) sentenceEnds.push(index + 1);
  }
  const complete = sentenceEnds.filter((position) => position >= 100).at(-1);
  if (complete) return answer.slice(0, complete).trim();
  const clause = answer.slice(0, 179).search(/[，；、,:：;][^，；、,:：;]*$/);
  const end = clause >= 100 ? clause : 179;
  return `${answer.slice(0, end).trim().replace(/[，；、,:：;]$/, "")}。`;
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

async function deepSeekApiKey(): Promise<string | undefined> {
  if (typeof process !== "undefined" && process.env?.DEEPSEEK_API_KEY) {
    return process.env.DEEPSEEK_API_KEY;
  }
  try {
    const runtime = await import("cloudflare:workers");
    return (runtime.env as unknown as { DEEPSEEK_API_KEY?: string }).DEEPSEEK_API_KEY;
  } catch {
    return undefined;
  }
}

export async function POST(request: Request) {
  if (!allowRequest(clientId(request))) {
    return json({ error: "提问过于频繁，请一分钟后再试。" }, { status: 429 });
  }

  let payload: { gemName?: string; question?: string };
  try {
    payload = await request.json();
  } catch {
    return json({ error: "请求格式不正确。" }, { status: 400 });
  }
  const gemName = payload.gemName?.trim().slice(0, 80) || "";
  const question = payload.question?.trim().slice(0, 300) || "";
  if (!gemName || !question) {
    return json({ error: "请先完成识别并输入问题。" }, { status: 400 });
  }

  const apiKey = await deepSeekApiKey();
  if (!apiKey) {
    return json(
      { error: "AI 知识服务尚未配置 API Key。" },
      { status: 503 },
    );
  }

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
          {
            role: "system",
            content:
              "你是专业、亲切的宝石学知识助手。围绕给定的匹配类别，用简体中文正面回答用户提出的具体问题；除非用户询问鉴定，否则不要复述视觉识别原理。正文必须控制在100至180个汉字之间，优先用2至3个短段落；不要写标题、列表、开场白或结尾客套话。必须把最后一句写完整，禁止用省略号表示截断。明确区分视觉匹配与专业鉴定；不确定时直接说明，不虚构产地、价格、功效或真伪结论。",
          },
          {
            role: "user",
            content: `当前视觉匹配类别：${gemName}\n用户问题：${question}`,
          },
        ],
        max_tokens: 260,
        stream: false,
      }),
    });
    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      error?: { message?: string };
    };
    if (!response.ok) {
      const message = response.status === 402
        ? "AI 服务余额不足，请联系管理员。"
        : response.status === 429
          ? "AI 服务当前繁忙，请稍后重试。"
          : data.error?.message || "AI 服务暂时不可用。";
      return json({ error: message }, { status: response.status });
    }
    const answer = data.choices?.[0]?.message?.content?.trim();
    if (!answer) throw new Error("empty response");
    return json({ answer: keepCompleteAnswer(answer) });
  } catch {
    return json({ error: "AI 服务连接失败，请稍后重试。" }, { status: 502 });
  }
}
