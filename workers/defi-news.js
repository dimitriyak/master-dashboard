const RSS_SOURCES = [
  { name: "The Defiant",  url: "https://thedefiant.io/api/feed",              tag: "media"  },
  { name: "Bankless",     url: "https://www.bankless.com/rss",                tag: "media"  },
  { name: "DeFiLlama",   url: "https://defillama.com/blog/feed.xml",         tag: "data"   },
  { name: "Decrypt",      url: "https://decrypt.co/feed/category/defi",       tag: "media"  },
];

export const X_ACCOUNTS = [
  { handle: "DefiIgnas",         name: "Ignas DeFi",          focus: "Разборы протоколов, стратегии доходности" },
  { handle: "0xngmi",            name: "0xngmi",              focus: "Данные DeFiLlama, аналитика рынка" },
  { handle: "CryptoHayes",       name: "Arthur Hayes",        focus: "Макро, крупные тренды, BTC" },
  { handle: "sassal0x",          name: "sassal",              focus: "DeFi аналитика, Ethereum" },
  { handle: "Route2FI",          name: "Route 2 FI",          focus: "Yield farming, практические стратегии" },
  { handle: "DeFi_Made_Here",    name: "DeFi Made Here",      focus: "Обучение, разбор механик" },
  { handle: "SmallCapScientist", name: "SmallCapScientist",   focus: "Альфа, новые возможности" },
];

const NITTER_INSTANCES = [
  "nitter.privacydev.net",
  "nitter.poast.org",
  "nitter.1d4.us",
  "nitter.tiekoetter.com",
];

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

// ── XML parser ──────────────────────────────────────────────────────────────
function extractTag(str, tag) {
  const m = str.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, "i"));
  return m ? m[1].trim() : "";
}

function parseItems(xml, limit = 6) {
  const items = [];
  const rx = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = rx.exec(xml)) !== null && items.length < limit) {
    const raw = m[1];
    const title = extractTag(raw, "title").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#\d+;/g, "");
    const link  = extractTag(raw, "link") || (raw.match(/href="([^"]+)"/) || [])[1] || "";
    const date  = extractTag(raw, "pubDate") || extractTag(raw, "dc:date") || "";
    const desc  = extractTag(raw, "description").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").slice(0, 180);
    if (title && link) items.push({ title, link, date, description: desc || null });
  }
  return items;
}

// ── Fetch with timeout ───────────────────────────────────────────────────────
async function fetchWithTimeout(url, ms = 7000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; DeFiNewsBot/1.0)" },
    });
    return res;
  } finally {
    clearTimeout(id);
  }
}

// ── Nitter RSS ───────────────────────────────────────────────────────────────
async function fetchNitter(handle) {
  for (const host of NITTER_INSTANCES) {
    try {
      const res = await fetchWithTimeout(`https://${host}/${handle}/rss`, 5000);
      if (!res.ok) continue;
      const xml = await res.text();
      if (!xml.includes("<item>")) continue;
      return parseItems(xml, 4).map(i => ({
        ...i,
        source: `@${handle}`,
        tag: "x",
        handle,
      }));
    } catch { /* try next */ }
  }
  return [];
}

// ── Build feed ───────────────────────────────────────────────────────────────
async function buildFeed() {
  const allItems = [];

  // RSS sources (parallel)
  const rssResults = await Promise.allSettled(
    RSS_SOURCES.map(async (src) => {
      const res = await fetchWithTimeout(src.url);
      if (!res.ok) return [];
      const xml = await res.text();
      return parseItems(xml, 6).map(i => ({ ...i, source: src.name, tag: src.tag }));
    })
  );
  for (const r of rssResults) {
    if (r.status === "fulfilled") allItems.push(...r.value);
  }

  // X via Nitter (parallel, first 5 accounts)
  const xResults = await Promise.allSettled(
    X_ACCOUNTS.slice(0, 5).map(acc => fetchNitter(acc.handle))
  );
  for (const r of xResults) {
    if (r.status === "fulfilled") allItems.push(...r.value);
  }

  // Sort newest first
  allItems.sort((a, b) => {
    const da = a.date ? new Date(a.date).getTime() : 0;
    const db = b.date ? new Date(b.date).getTime() : 0;
    return db - da;
  });

  return {
    items: allItems.slice(0, 40),
    accounts: X_ACCOUNTS,
    updatedAt: new Date().toISOString(),
    sources: RSS_SOURCES.map(s => s.name),
  };
}

// ── Worker entry ─────────────────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS });
    }

    if (url.pathname === "/accounts") {
      return new Response(JSON.stringify(X_ACCOUNTS), { headers: CORS });
    }

    if (url.pathname === "/news" || url.pathname === "/") {
      // Try KV cache
      if (env.NEWS_CACHE) {
        const cached = await env.NEWS_CACHE.get("feed");
        if (cached) {
          return new Response(cached, {
            headers: { ...CORS, "X-Cache": "HIT" },
          });
        }
      }

      // Fetch fresh
      const feed = await buildFeed();
      const json = JSON.stringify(feed);

      // Store in KV (2h TTL)
      if (env.NEWS_CACHE) {
        await env.NEWS_CACHE.put("feed", json, { expirationTtl: 7200 });
      }

      return new Response(json, {
        headers: { ...CORS, "X-Cache": "MISS" },
      });
    }

    return new Response("DeFi News Aggregator", { headers: CORS });
  },

  // Cron: refresh cache every 2 hours
  async scheduled(event, env, ctx) {
    const feed = await buildFeed();
    if (env.NEWS_CACHE) {
      await env.NEWS_CACHE.put("feed", JSON.stringify(feed), { expirationTtl: 7200 });
    }
  },
};
