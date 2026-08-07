/**
 * AI 宝石知识问答云函数
 *
 * 接收前端 POST { gemName, question }，调用 DeepSeek V4 Flash API，
 * 返回 { answer } 或 { error }。
 *
 * 路由映射: cloud-functions/api/gem-chat.js -> /api/gem-chat
 * 环境变量: DEEPSEEK_API_KEY (在 EdgeOne Pages 控制台配置)
 */

const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";
const DEEPSEEK_MODEL = "deepseek-v4-flash";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=UTF-8" },
  });
}

export async function onRequestPost(context) {
  try {
    const { gemName, question } = await context.request.json();

    if (!gemName || !question) {
      return jsonResponse({ error: "缺少宝石名称或问题。" }, 400);
    }

    const apiKey = context.env?.DEEPSEEK_API_KEY || process.env?.DEEPSEEK_API_KEY;
    if (!apiKey) {
      console.error("DEEPSEEK_API_KEY is not configured");
      return jsonResponse({ error: "AI 服务尚未配置，请联系管理员。" }, 500);
    }

    const systemPrompt = [
      "你是一位专业的宝石学助手，精通各类彩色宝石、玉石和矿物的知识。",
      `用户当前识别的宝石是「${gemName}」。`,
      "请用中文简洁地回答用户关于这种宝石的问题，可涵盖物理特性、产地、保养建议、文化寓意等。",
      "回答控制在 300 字以内，语言通俗易懂。",
      "重要：不提供真伪鉴定、价值评估或医学功效判断。",
    ].join("");

    const response = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`DeepSeek API error ${response.status}: ${errorText}`);
      return jsonResponse({ error: "AI 服务暂时不可用，请稍后重试。" }, 502);
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content?.trim();

    if (!answer) {
      return jsonResponse({ error: "AI 暂时没有返回答案。" }, 502);
    }

    return jsonResponse({ answer });
  } catch (error) {
    console.error("gem-chat error:", error);
    return jsonResponse({ error: "提问失败，请稍后重试。" }, 500);
  }
}

export function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
