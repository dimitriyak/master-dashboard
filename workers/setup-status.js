/**
 * Cloudflare Worker: Setup Status
 * Агрегатор живого статуса для раздела /setup на дашборде.
 * Secrets: DEEPSEEK_API_KEY, TG_TOKEN
 * Кэш 60с, чтобы не дёргать апи на каждый рендер.
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

async function deepseekBalance(env) {
  try {
    const r = await fetch("https://api.deepseek.com/user/balance", {
      headers: { Authorization: `Bearer ${env.DEEPSEEK_API_KEY}` },
      signal: AbortSignal.timeout(4000),
    });
    if (!r.ok) return null;
    const d = await r.json();
    const b = d.balance_infos?.[0];
    return b ? `${b.total_balance} ${b.currency}` : null;
  } catch { return null; }
}

async function botAlive(env) {
  try {
    const r = await fetch(`https://api.telegram.org/bot${env.TG_TOKEN}/getMe`, { signal: AbortSignal.timeout(4000) });
    const d = await r.json();
    return d.ok ? d.result.username : null;
  } catch { return null; }
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

    const [dsBalance, botUser] = await Promise.all([
      deepseekBalance(env),
      botAlive(env),
    ]);

    const body = {
      updatedAt: new Date().toISOString(),
      bot: { name: botUser, ok: !!botUser },
      deepseek: { balance: dsBalance, ok: !!dsBalance },
    };

    return new Response(JSON.stringify(body), {
      headers: { "Content-Type": "application/json", "Cache-Control": "max-age=60", ...CORS },
    });
  },
};
