/**
 * Cloudflare Worker: AI Stats
 * Queries Supabase for TG bot token usage stats
 * Secrets: SUPABASE_URL, SUPABASE_KEY
 *
 * GET /stats  → returns token usage aggregated by day + totals
 */

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

function resp(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: CORS });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS")
      return new Response(null, { headers: CORS });

    const url = new URL(request.url);
    if (url.pathname !== "/stats") return resp({ error: "Not found" }, 404);

    try {
      // Fetch all messages with tokens (last 90 days)
      const since = new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString();
      const res = await fetch(
        `${env.SUPABASE_URL}/rest/v1/messages?select=tokens_used,created_at,role&tokens_used=gt.0&created_at=gte.${since}&order=created_at.asc&limit=10000`,
        {
          headers: {
            apikey: env.SUPABASE_KEY,
            Authorization: `Bearer ${env.SUPABASE_KEY}`,
          },
        }
      );

      const messages = await res.json();
      if (!Array.isArray(messages)) return resp({ error: "Supabase error", detail: messages }, 500);

      // Only assistant messages have tokens (user messages = null)
      const assistant = messages.filter(m => m.role === "assistant" && m.tokens_used > 0);

      // Aggregate by day (YYYY-MM-DD)
      const byDay = {};
      for (const m of assistant) {
        const day = m.created_at.slice(0, 10);
        byDay[day] = (byDay[day] || 0) + m.tokens_used;
      }

      const today = new Date().toISOString().slice(0, 10);
      const days7 = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(Date.now() - (6 - i) * 86400000);
        return d.toISOString().slice(0, 10);
      });

      const todayTokens  = byDay[today] || 0;
      const week7Tokens  = days7.reduce((s, d) => s + (byDay[d] || 0), 0);
      const totalTokens  = assistant.reduce((s, m) => s + m.tokens_used, 0);
      const totalMessages = assistant.length;

      // Last 7 days chart data
      const chart = days7.map(d => ({ date: d, tokens: byDay[d] || 0 }));

      // All-time by day sorted (for full chart)
      const allDays = Object.entries(byDay)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, tokens]) => ({ date, tokens }));

      return resp({
        today: todayTokens,
        week7: week7Tokens,
        total: totalTokens,
        totalMessages,
        chart,
        allDays,
        updatedAt: new Date().toISOString(),
        activeModel: "Gemini (Vertex AI)",
      });
    } catch (e) {
      return resp({ error: e.message }, 500);
    }
  },
};
