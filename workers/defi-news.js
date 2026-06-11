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
// trackable: true  → APY есть в DeFiLlama, будем сравнивать с рынком
// trackable: false → нет в DeFiLlama (BTCfi rewards, airdrop, gold collateral) — это НОРМАЛЬНО
const USER_PORTFOLIO = [
  { protocol: "Aave V3",         chain: "Base",     asset: "USDC",      allocated: 400, type: "lending", trackable: true,  note: "" },
  { protocol: "Aerodrome",       chain: "Base",     asset: "USDC/WETH", allocated: 400, type: "lp",      trackable: true,  note: "" },
  { protocol: "Lombard",         chain: "Ethereum", asset: "LBTC",      allocated: 300, type: "btcfi",   trackable: true,  note: "BTCfi staking, APY ~0.3% base + нативные BTC rewards" },
  { protocol: "Aave V3",         chain: "Ethereum", asset: "PAXG",      allocated: 300, type: "gold",    trackable: false, note: "PAXG используется как коллатерал, supply APY ~0% (нет заёмщиков)" },
  { protocol: "Sonic/Berachain", chain: "Multi",    asset: "Various",   allocated: 300, type: "new",     trackable: false, note: "Аирдроп/поинты стратегия — reward не в APY, вручную" },
];

// Протоколы для мониторинга APY (конкуренты + наши)
const WATCH_PROJECTS  = [
  "aave-v3", "morpho", "morpho-blue",
  "aerodrome-v1", "aerodrome-slipstream",   // правильные названия
  "compound-v3", "fluid", "fluid-dex", "fluid-lite",
  "spark", "pendle", "rings", "lombard-lbtc", "kamino",  // lombard-lbtc — правильное название
  "velodrome", "uniswap-v3",
];
const WATCH_SYMBOLS   = [
  "USDC", "WBTC", "PAXG", "ETH", "WETH", "LBTC", "USDe", "sUSDe",
  "WETH-USDC", "USDC-WETH", "USDC-ETH", "WBTC-USDC",  // LP пары
];
const WATCH_CHAINS    = ["Base", "Ethereum", "Sonic", "Arbitrum"];

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent";

// Человекочитаемые имена протоколов
const PROTOCOL_NAMES = {
  "aave-v3":              "Aave V3",
  "aerodrome-v1":         "Aerodrome V1",
  "aerodrome-slipstream": "Aerodrome Slipstream",
  "morpho-blue":          "Morpho Blue",
  "uniswap-v3":           "Uniswap V3",
  "lombard-lbtc":         "Lombard",
  "compound-v3":          "Compound V3",
  "fluid-dex":            "Fluid DEX",
  "fluid-lending":        "Fluid Lending",
  "spark":                "Spark",
  "pendle":               "Pendle",
  "velodrome":            "Velodrome",
  "kamino":               "Kamino",
};
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

    // 1. Конкретные позиции портфеля — всегда включаем (только trackable)
    // PAXG и Sonic/Berachain исключены — у них нет APY в DeFiLlama, это нормально
    const PORTFOLIO_POOLS = [
      { project: "aave-v3",              chain: "Base",     symbol: "USDC"      },
      { project: "aave-v3",              chain: "Base",     symbol: "WETH"      },
      { project: "aerodrome-slipstream", chain: "Base",     symbol: "WETH-USDC" },
      { project: "aerodrome-v1",         chain: "Base",     symbol: "WETH-USDC" },
      { project: "lombard-lbtc",         chain: "Ethereum", symbol: "LBTC"      }, // lombard-lbtc — правильное имя
      { project: "morpho-blue",          chain: "Base",     symbol: null        },
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

    // 2. Возможности — TVL > $3M (фильтруем мусорные пулы) и APY до 150%
    const opportunities = pools
      .filter(p =>
        WATCH_CHAINS.includes(p.chain) &&
        WATCH_PROJECTS.includes(p.project) &&
        WATCH_SYMBOLS.some(s => p.symbol?.toUpperCase().includes(s)) &&
        (p.tvlUsd || 0) > 3_000_000 &&
        (p.apy || 0) < 150 &&
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

function buildFallbackSummary(apyData) {
  const top = apyData.filter(a => a.apy > 20).sort((a,b) => b.apy - a.apy).slice(0,2);
  const stable = apyData.filter(a => ["aave-v3","morpho-blue"].includes(a.project) && a.apy > 0).sort((a,b) => b.apy - a.apy)[0];
  const topStr = top.map(a => `${PROTOCOL_NAMES[a.project]||a.project} ${a.apy}%`).join(", ");
  const stableStr = stable ? `${PROTOCOL_NAMES[stable.project]||stable.project} ${stable.chain} предлагает ${stable.apy}% для ${stable.symbol}` : "";
  return `Рынок DeFi: высокодоходные LP-пулы показывают ${topStr}. ${stableStr ? `Stable lending: ${stableStr}.` : ""}`.trim();
}

async function generateBrief(newsItems, apyData, env) {
  // Разбиваем портфель на trackable и manual
  const trackablePositions = USER_PORTFOLIO.filter(p => p.trackable);
  const manualPositions    = USER_PORTFOLIO.filter(p => !p.trackable);

  const portfolioTrackableCtx = trackablePositions
    .map(p => `- ${p.protocol} на ${p.chain}: $${p.allocated} в ${p.asset}`)
    .join("\n");

  const portfolioManualCtx = manualPositions
    .map(p => `- ${p.protocol} на ${p.chain}: $${p.allocated} в ${p.asset} [${p.note}]`)
    .join("\n");

  const apyCtx = apyData.length > 0
    ? apyData.slice(0, 20)
        .map(a => `- ${a.project} (${a.chain}) ${a.symbol}: ${a.apy}% APY, TVL ${a.tvlUsd}`)
        .join("\n")
    : "Данные APY временно недоступны";

  const newsCtx = newsItems.slice(0, 12)
    .map(n => `- ${n.source}: ${n.title}`)
    .join("\n");

  // ── Вся категоризация В КОДЕ — AI пишет только summary, reason-тексты, urgent ──

  const aaveBaseUsdc  = apyData.find(a => a.project === "aave-v3"              && a.chain === "Base"     && a.symbol === "USDC");
  const slipstream    = apyData.find(a => a.project === "aerodrome-slipstream" && a.chain === "Base"     && a.symbol === "WETH-USDC");
  const aeroV1        = apyData.find(a => a.project === "aerodrome-v1"         && a.chain === "Base"     && a.symbol === "WETH-USDC");
  const lombardPool   = apyData.find(a => a.project === "lombard-lbtc");

  // thisWeek: только LP→LP апгрейды с >2x разницей APY на той же платформе
  const codeThisWeek = [];
  if (slipstream && aeroV1 && slipstream.apy > aeroV1.apy * 2) {
    codeThisWeek.push({
      action: `Перевести $400 из Aerodrome v1 (USDC/WETH, ${aeroV1.apy}% APY) в Aerodrome Slipstream (WETH-USDC, ${slipstream.apy}% APY)`,
      reason: `LP→LP апгрейд на той же платформе: ${(slipstream.apy / aeroV1.apy).toFixed(1)}x разница в APY. Важно: APY нестабилен (зависит от объёма торгов), есть риск impermanent loss при движении цены ETH±20%.`,
      impact: "high",
    });
  }

  // hold: зафиксировано в коде, AI только уточняет reason
  const codeHold = [
    { position: `Aave V3 Base (USDC, ${aaveBaseUsdc?.apy ?? 3.11}% APY)`,   reasonHint: "Lending, стабильный APY, нет impermanent loss. Держим как безрисковую базу стейблкоинов." },
    { position: "Aave V3 Ethereum (PAXG, ~0% APY)",                          reasonHint: "PAXG как коллатерал — APY ~0% это норма, не риск." },
    { position: `Lombard Ethereum (LBTC, ${lombardPool?.apy ?? 0.33}% base APY)`, reasonHint: "BTCfi: base APY низкий намеренно, реальный доход = Bitcoin staking rewards + Lombard points." },
    { position: "Sonic/Berachain Multi (Various)",                            reasonHint: "Аирдроп/поинты стратегия — доход вне APY, оценивать отдельно." },
  ];

  // opportunities: три уровня риска — профессиональный подход
  const CONSERVATIVE_PROJECTS = ["aave-v3", "morpho-blue", "compound-v3", "spark", "fluid-protocol", "ethena"];
  const MODERATE_PROJECTS      = ["aerodrome-v1", "velodrome-v2", "curve-dex", "convex-finance", "pendle", "lombard-lbtc"];
  const AGGRESSIVE_PROJECTS    = ["aerodrome-slipstream", "uniswap-v3", "kodiak", "dolomite"];

  const conservative = apyData
    .filter(a => CONSERVATIVE_PROJECTS.includes(a.project) && a.apy >= 4 && a.apy < 25
      && parseFloat(a.tvlUsd.replace(/[$MBK]/g, "") || 0) >= 10)
    .sort((a, b) => b.apy - a.apy).slice(0, 2)
    .map(a => ({
      protocol: PROTOCOL_NAMES[a.project] || a.project,
      chain: a.chain, apy: `${a.apy}%`, tvl: a.tvlUsd, risk: "low",
      reasonHint: `Lending/стейблы ${a.apy}% APY, TVL ${a.tvlUsd}. Нет impermanent loss, проверенный протокол. Подходит как база портфеля.`,
    }));

  const moderate = apyData
    .filter(a => MODERATE_PROJECTS.includes(a.project) && a.apy >= 15 && a.apy < 60
      && parseFloat(a.tvlUsd.replace(/[$MBK]/g, "") || 0) >= 3)
    .sort((a, b) => b.apy - a.apy).slice(0, 2)
    .map(a => ({
      protocol: PROTOCOL_NAMES[a.project] || a.project,
      chain: a.chain, apy: `${a.apy}%`, tvl: a.tvlUsd, risk: "medium",
      reasonHint: `${a.apy}% APY, TVL ${a.tvlUsd}. Умеренный риск: есть impermanent loss или токен-наград, но TVL даёт уверенность.`,
    }));

  const aggressive = apyData
    .filter(a => AGGRESSIVE_PROJECTS.includes(a.project) && a.apy >= 40 && a.apy < 150
      && parseFloat(a.tvlUsd.replace(/[$MBK]/g, "") || 0) >= 5)
    .sort((a, b) => b.apy - a.apy).slice(0, 2)
    .map(a => ({
      protocol: PROTOCOL_NAMES[a.project] || a.project,
      chain: a.chain, apy: `${a.apy}%`, tvl: a.tvlUsd, risk: "high",
      reasonHint: `LP ${a.apy}% APY, TVL ${a.tvlUsd}. Высокий APY за счёт emissions + fees. Нестабилен, есть IL при движении цены ±20%.`,
    }));

  const codeOpportunities = [...conservative, ...moderate, ...aggressive];

  // AI пишет ТОЛЬКО summary и ищет urgent в новостях — структура генерируется кодом
  const topNews = newsCtx || "нет новостей";
  const prompt = `Задача: проанализируй DeFi-новости и рынок, верни JSON с двумя полями.

Новости: ${topNews}
Рынок APY: ${apyCtx}

Ответь строго в этом формате (без markdown, без пояснений):
{"summary":"ТЕКСТ — 2 предложения: общее состояние DeFi рынка + главный тренд из новостей","urgent":[]}

Правило для urgent: добавляй объект {"action":"...","reason":"...","impact":"high"} ТОЛЬКО если в новостях есть exploit, депег стейблкоина или критическое регулирование. В остальных случаях urgent остаётся пустым массивом.`;

  // Финальный JSON собирается из кода + AI (только summary и urgent)
  const codeBrief = {
    thisWeek:     codeThisWeek,
    hold:         codeHold.map(h => ({ position: h.position, reason: h.reasonHint })),
    opportunities: codeOpportunities.map(o => ({ protocol: o.protocol, chain: o.chain, apy: o.apy, risk: o.risk, reason: o.reasonHint })),
    generatedAt:  new Date().toISOString(),
  };

  try {
    const aiRes = await fetch(`${GEMINI_URL}?key=${env.GEMINI_API_KEY}`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: "Отвечай ТОЛЬКО валидным JSON без markdown." }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 512 },
      }),
    });
    const data = await aiRes.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const aiPart = JSON.parse(text.replace(/```json|```/g, "").trim());
    const summary = (aiPart.summary && !aiPart.summary.includes("ТЕКСТ"))
      ? aiPart.summary
      : buildFallbackSummary(apyData);
    return {
      summary,
      urgent: Array.isArray(aiPart.urgent) ? aiPart.urgent : [],
      ...codeBrief,
    };
  } catch (e) {
    return {
      summary:  buildFallbackSummary(apyData),
      urgent:   [],
      ...codeBrief,
      error:    e.message,
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
