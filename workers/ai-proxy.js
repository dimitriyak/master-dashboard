/**
 * Cloudflare Worker: AI Proxy
 * Gemini (основной) + Grok (фолбэк)
 *
 * Secrets: GEMINI_API_KEY, GROK_API_KEY
 */

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent";
const GROK_URL   = "https://api.x.ai/v1/chat/completions";

async function callGemini(env, systemPrompt, userMessage) {
  const res = await fetch(`${GEMINI_URL}?key=${env.GEMINI_API_KEY}`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: userMessage }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Gemini error");
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return text;
}

async function callGrok(env, systemPrompt, userMessage) {
  const res = await fetch(GROK_URL, {
    method:  "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${env.GROK_API_KEY}` },
    body: JSON.stringify({
      model: "grok-3-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userMessage },
      ],
      temperature: 0.3,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Grok error");
  return data.choices?.[0]?.message?.content || "";
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return corsResponse(null, 204);
    if (request.method !== "POST")    return corsResponse(JSON.stringify({ error: "POST only" }), 405);

    try {
      const body         = await request.json();
      const systemPrompt = body.system   || "Ты DeFi-аналитик. Отвечай только валидным JSON без markdown.";
      const userMessage  = body.messages?.findLast(m => m.role === "user")?.content || "";

      let text = "";
      try {
        text = await callGemini(env, systemPrompt, userMessage);
      } catch (geminiErr) {
        // Фолбэк на Grok
        text = await callGrok(env, systemPrompt, userMessage);
      }

      return corsResponse(JSON.stringify({ content: [{ text }] }), 200);

    } catch (e) {
      return corsResponse(JSON.stringify({ error: e.message }), 500);
    }
  },
};

function corsResponse(body, status = 200) {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
