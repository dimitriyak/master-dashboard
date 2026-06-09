// ── Constants ────────────────────────────────────────────────────────────────

const RSS_SOURCES = [
  { name: "The Defiant",  url: "https://thedefiant.io/api/feed",        tag: "media" },
  { name: "Bankless",     url: "https://www.bankless.com/rss",          tag: "media" },
  { name: "DeFiLlama",   url: "https://defillama.com/blog/feed.xml",   tag: "data"  },
  { name: "Decrypt",      url: "https://decrypt.co/feed/category/defi", tag: "media" },
];

export const X_ACCOUNTS = [
  { handle: "DefiIgnas",         name: "Ignas DeFi",        focus: "Разборы протоколов, yield стратегии" },
  { handle: "0xngmi",            name: "0xngmi",            focus: "Данные DeFiLlama, аналитика" },
  { handle: "CryptoHayes",       name: "Arthur Hayes",      focus: "Макро, BTC, крупные тренды" },
  { handle: "sassal0x",          name: "sassal",            focus: "DeFi аналитика, Ethereum" },
  { handle: "Route2FI",          name: "Route 2 FI",        focus: "Yield farming, практика" },
  { handle: "DeFi_Made_Here",    name: "DeFi Made Here",    focus: "Обучение, механики" },
  { handle: "SmallCapScientist", name: "SmallCapScientist", focus: "Альфа, возможности" },
];

const NITTER_INSTANCES = [
  "nitter.privacydev.net",
  "nitter.poast.org",
  "nitter.1d4.us",
  "nitter.tiekoetter.com",
];

// Портфель пользователя — обновляй по мере реального входа в позиции
const USER_PORTFOLIO = [
  { protocol: "Aave V3",         chain: "Base",     asset: "USDC",      allocated: 400, type: "lending" },
  { protocol: "Aerodrome",       chain: "Base",     asset: "USDC/WETH", allocated: 400, type: "lp"      },
  { protocol: "Lombard",         chain: "Ethereum", asset: "LBTC",      allocated: 300, type: "btcfi"   },
  { protocol: "Aave V3",         chain: "Ethereum", asset: "PAXG",      allocated: 300, type: "gold"    },
  { protocol: "Sonic/Berachain", chain: "Multi",    asset: "Various",   allocated: 300, type: "new"     },
];

// Протоколы для мониторинга APY (конкуренты + наши)
const WATCH_PROJECTS  = [
  "aave-v3", "morpho", "morpho-blue",
  "aerodrome-v1", "aerodrome-slipstream",   // правильные названия
  "compound-v3", "fluid", "fluid-dex", "fluid-lite",
  "spark", "pendle", "rings", "lombard", "kamino",
  "velodrome", "uniswap-v3",
];
const WATCH_SYMBOLS   = [
  "USDC", "WBTC", "PAXG", "ETH", "WETH", "LBTC", "USDe", "sUSDe",
  "WETH-USDC", "USDC-WETH", "USDC-ETH", "WBTC-USDC",  // LP пары
];
const WATCH_CHAINS    = ["Base", "Ethereum", "Sonic", "Arbitrum"];

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent";
const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

async function fetchWithTimeout(url, ms = 8000) {
  const ctrl = new AbortController();
  const id   = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, {
      signal:  ctrl.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; DeFiBot/1.0)" },
    });
  } finally { clearTimeout(id); }
}

function extractTag(str, tag) {
  const m = str.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, "i"));
  return m ? m[1].trim() : "";
}

function parseItems(xml, limit = 6) {
  const items = [];
  const rx    = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = rx.exec(xml)) !== null && items.length < limit) {
    const raw   = m[1];
    const title = extractTag(raw, "title")
      .replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&#\d+;/g,"");
    const link  = extractTag(raw, "link") || (raw.match(/href="([^"]+)"/) || [])[1] || "";
    const date  = extractTag(raw, "pubDate") || extractTag(raw, "dc:date") || "";
    const desc  = extractTag(raw, "description")
      .replace(/<[^>]+>/g,"").replace(/\s+/g," ").slice(0, 180);
    if (title && link) items.push({ title, link, date, description: desc || null });
  }
  return items;
}

async function fetchNitter(handle) {
  for (const host of NITTER_INSTANCES) {
    try {
      const res = await fetchWithTimeout(`https://${host}/${handle}/rss`, 5000);
      if (!res.ok) continue;
      const xml = await res.text();
      if (!xml.includes("<item>")) continue;
      return parseItems(xml, 4).map(i => ({ ...i, source: `@${handle}`, tag: "x", handle }));
    } catch { /* try next */ }
  }
  return [];
}

// ── DeFiLlama APY fetch ──────────────────────────────────────────────────────

async function fetchAPYs() {
  try {
    const res  = await fetchWithTimeout("https://yields.llama.fi/pools", 12000);
    if (!res.ok) return [];
    const data = await res.json();
    const pools = data.data;

    // 1. Конкретные позиции портфеля — всегда включаем
    const PORTFOLIO_POOLS = [
      { project: "aave-v3",              chain: "Base",     symbol: "USDC"      },
      { project: "aave-v3",              chain: "Base",     symbol: "WETH"      },
      { project: "aave-v3",              chain: "Ethereum", symbol: "PAXG"      },
      { project: "aerodrome-slipstream", chain: "Base",     symbol: "WETH-USDC" },
      { project: "aerodrome-v1",         chain: "Base",     symbol: "WETH-USDC" },
      { project: "morpho-blue",          chain: "Base",     symbol: null        }, // любой символ
      { project: "morpho-blue",          chain: "Ethereum", symbol: null        },
    ];

    const portfolioPools = [];
    for (const target of PORTFOLIO_POOLS) {
      const matches = pools.filter(p =>
        p.project === target.project &&
        p.chain   === target.chain &&
        (target.symbol === null || p.symbol?.toUpperCase().includes(target.symbol))
      ).sort((a, b) => (b.tvlUsd || 0) - (a.tvlUsd || 0)).slice(0, 3);
      portfolioPools.push(...matches);
    }

    // 2. Возможности — разумный TVL (>$500K) и APY до 200%
    const opportunities = pools
      .filter(p =>
        WATCH_CHAINS.includes(p.chain) &&
        WATCH_PROJECTS.includes(p.project) &&
        WATCH_SYMBOLS.some(s => p.symbol?.toUpperCase().includes(s)) &&
        (p.tvlUsd || 0) > 500_000 &&
        (p.apy || 0) < 200 &&
        (p.apy || 0) > 3
      )
      .sort((a, b) => (b.apy || 0) - (a.apy || 0))
      .slice(0, 15);

    // Объединяем, убираем дубли
    const seen = new Set();
    const result = [...portfolioPools, ...opportunities].filter(p => {
      const key = `${p.project}-${p.chain}-${p.symbol}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return result.slice(0, 30).map(p => ({
      project: p.project,
      chain:   p.chain,
      symbol:  p.symbol,
      apy:     parseFloat((p.apy || 0).toFixed(2)),
      tvlUsd:  p.tvlUsd ? `$${(p.tvlUsd / 1e6).toFixed(1)}M` : "$0",
    }));
  } catch { return []; }
}

// ── News feed build ──────────────────────────────────────────────────────────

async function buildFeed() {
  const allItems = [];

  const rssResults = await Promise.allSettled(
    RSS_SOURCES.map(async src => {
      const res = await fetchWithTimeout(src.url);
      if (!res.ok) return [];
      const xml = await res.text();
      return parseItems(xml, 6).map(i => ({ ...i, source: src.name, tag: src.tag }));
    })
  );
  for (const r of rssResults) if (r.status === "fulfilled") allItems.push(...r.value);

  const xResults = await Promise.allSettled(
    X_ACCOUNTS.slice(0, 5).map(acc => fetchNitter(acc.handle))
  );
  for (const r of xResults) if (r.status === "fulfilled") allItems.push(...r.value);

  allItems.sort((a, b) => {
    const da = a.date ? new Date(a.date).getTime() : 0;
    const db = b.date ? new Date(b.date).getTime() : 0;
    return db - da;
  });

  return {
    items:      allItems.slice(0, 40),
    accounts:   X_ACCOUNTS,
    updatedAt:  new Date().toISOString(),
    sources:    RSS_SOURCES.map(s => s.name),
  };
}

// ── AI Brief generation ──────────────────────────────────────────────────────

async function generateBrief(newsItems, apyData, env) {
  const portfolioCtx = USER_PORTFOLIO
    .map(p => `- ${p.protocol} на ${p.chain}: $${p.allocated} в ${p.asset}`)
    .join("\n");

  const apyCtx = apyData.length > 0
    ? apyData.slice(0, 20)
        .map(a => `- ${a.project} (${a.chain}) ${a.symbol}: ${a.apy}% APY${a.tvlUsd ? ` TVL ${a.tvlUsd}` : ""}`)
        .join("\n")
    : "Данные APY временно недоступны";

  const newsCtx = newsItems.slice(0, 12)
    .map(n => `- ${n.source}: ${n.title}`)
    .join("\n");

  const prompt = `Ты персональный DeFi советник. Твоя задача — дать конкретные, actionable рекомендации по портфелю на основе актуальных данных.

МОЙ ПОРТФЕЛЬ (план, пока не все позиции открыты):
${portfolioCtx}

АКТУАЛЬНЫЕ APY НА РЫНКЕ ПРЯМО СЕЙЧАС:
${apyCtx}

ПОСЛЕДНИЕ НОВОСТИ DeFi:
${newsCtx}

Правила ответа:
- Только конкретика: протоколы, цифры, суммы
- Никакой воды и очевидных вещей
- Если данных APY нет — не придумывай, скажи "проверь вручную"
- Учитывай что портфель в процессе формирования (позиции ещё не открыты)

Верни ТОЛЬКО валидный JSON без markdown:
{
  "summary": "1-2 предложения общей картины рынка прямо сейчас",
  "urgent": [
    {"action": "конкретное действие", "reason": "почему важно сейчас", "impact": "high|medium|low"}
  ],
  "thisWeek": [
    {"action": "что сделать на этой неделе", "reason": "обоснование с цифрами", "impact": "high|medium|low"}
  ],
  "hold": [
    {"position": "название позиции", "reason": "почему держать"}
  ],
  "opportunities": [
    {"protocol": "название", "chain": "сеть", "apy": "X%", "reason": "почему интересно", "risk": "low|medium|high"}
  ],
  "generatedAt": "${new Date().toISOString()}"
}`;

  try {
    const aiRes = await fetch(`${GEMINI_URL}?key=${env.GEMINI_API_KEY}`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: "Ты персональный DeFi советник. Отвечай ТОЛЬКО валидным JSON без markdown и без пояснений." }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
      }),
    });
    const data = await aiRes.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch (e) {
    return {
      summary:      "Не удалось получить анализ — попробуй обновить вручную",
      urgent:       [],
      thisWeek:     [],
      hold:         [],
      opportunities:[],
      generatedAt:  new Date().toISOString(),
      error:        e.message,
    };
  }
}

// ── Main cron job ────────────────────────────────────────────────────────────

async function runDailyJob(env) {
  const [feed, apyData] = await Promise.all([buildFeed(), fetchAPYs()]);

  // Cache feed
  if (env.NEWS_CACHE) {
    await env.NEWS_CACHE.put("feed", JSON.stringify(feed), { expirationTtl: 7200 });
  }

  // Cache APYs
  if (env.NEWS_CACHE) {
    await env.NEWS_CACHE.put("apys", JSON.stringify({ data: apyData, updatedAt: new Date().toISOString() }), { expirationTtl: 7200 });
  }

  // Generate and cache AI brief
  const brief = await generateBrief(feed.items, apyData, env);
  if (env.NEWS_CACHE) {
    await env.NEWS_CACHE.put("brief", JSON.stringify(brief), { expirationTtl: 86400 }); // 24h
  }

  return { feed, apyData, brief };
}

// ── Worker entry ─────────────────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });

    // GET /news
    if (url.pathname === "/news" || url.pathname === "/") {
      const cached = await env.NEWS_CACHE?.get("feed");
      if (cached) return new Response(cached, { headers: { ...CORS, "X-Cache": "HIT" } });
      const feed = await buildFeed();
      await env.NEWS_CACHE?.put("feed", JSON.stringify(feed), { expirationTtl: 7200 });
      return new Response(JSON.stringify(feed), { headers: { ...CORS, "X-Cache": "MISS" } });
    }

    // GET /apys
    if (url.pathname === "/apys") {
      const forceRefresh = url.searchParams.get("refresh") === "1";
      if (!forceRefresh && env.NEWS_CACHE) {
        const cached = await env.NEWS_CACHE.get("apys");
        if (cached) return new Response(cached, { headers: { ...CORS, "X-Cache": "HIT" } });
      }
      const data = await fetchAPYs();
      const payload = JSON.stringify({ data, updatedAt: new Date().toISOString() });
      await env.NEWS_CACHE?.put("apys", payload, { expirationTtl: 7200 });
      return new Response(payload, { headers: { ...CORS, "X-Cache": "MISS" } });
    }

    // GET /brief  — ?refresh=1 принудительно обновляет
    if (url.pathname === "/brief") {
      const forceRefresh = url.searchParams.get("refresh") === "1";
      if (!forceRefresh && env.NEWS_CACHE) {
        const cached = await env.NEWS_CACHE.get("brief");
        if (cached) return new Response(cached, { headers: { ...CORS, "X-Cache": "HIT" } });
      }
      // Fresh generation
      const [feedRaw, apyRaw] = await Promise.all([
        env.NEWS_CACHE?.get("feed"),
        env.NEWS_CACHE?.get("apys"),
      ]);
      const newsItems = feedRaw  ? JSON.parse(feedRaw).items  : (await buildFeed()).items;
      const apyData   = apyRaw   ? JSON.parse(apyRaw).data    : await fetchAPYs();
      const brief     = await generateBrief(newsItems, apyData, env);
      await env.NEWS_CACHE?.put("brief", JSON.stringify(brief), { expirationTtl: 86400 });
      return new Response(JSON.stringify(brief), { headers: { ...CORS, "X-Cache": "MISS" } });
    }

    // GET /accounts
    if (url.pathname === "/accounts") {
      return new Response(JSON.stringify(X_ACCOUNTS), { headers: CORS });
    }

    return new Response("DeFi News + Strategy Worker", { headers: CORS });
  },

  // Cron: every day at 8:00 UTC
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runDailyJob(env));
  },
};
