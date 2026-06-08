/**
 * Cloudflare Worker: AI Proxy
 * Проксирует запросы к Anthropic API, скрывая API ключ от браузера.
 *
 * Деплой:
 *   wrangler deploy workers/ai-proxy.js --name ai-proxy
 *   wrangler secret put ANTHROPIC_API_KEY --name ai-proxy
 */

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return corsResponse(null, 204);
    }

    if (request.method !== "POST") {
      return corsResponse(JSON.stringify({ error: "Method not allowed" }), 405);
    }

    try {
      const body = await request.json();

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: 1000,
          system: "Ты DeFi-аналитик. Отвечай ТОЛЬКО валидным JSON массивом без markdown. Формат: [{\"title\":\"...\",\"summary\":\"...\",\"tag\":\"...\",\"sentiment\":\"bull|bear|neutral\"}]. Строго 5 объектов.",
          messages: body.messages,
        }),
      });

      const data = await res.json();
      return corsResponse(JSON.stringify(data), res.status);
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
