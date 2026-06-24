/**
 * Cloudflare Worker: Portfolio Monitor
 * Cron-driven monitoring of the DeFi portfolio → Telegram (@dimitriyakclaude_bot).
 *
 * Crons (wrangler triggers):
 *   - "*\/30 * * * *"  → runAlerts  (liquidation risk, big swings, APY changes, new/removed, depeg)
 *   - "0 6 * * *"      → runDigest  (daily AI summary + 1-3 ideas via ai-proxy)
 *
 * Secrets:  TELEGRAM_BOT_TOKEN
 * Vars:     TELEGRAM_CHAT_ID
 * KV:       STATE (binding) — daily baseline snapshot + per-day alert dedupe
 *
 * Manual trigger / test:  GET ?run=alerts | ?run=digest | ?run=test
 */

const DEFI_URL  = "https://defi-portfolio.dimitriyak.workers.dev";
const BYBIT_URL = "https://bybit-proxy.dimitriyak.workers.dev";
const AI_URL    = "https://ai-proxy.dimitriyak.workers.dev";

// Thresholds
const SWING_PCT      = 5;     // position/total day-over-day change to alert (%)
const APY_DELTA      = 5;     // APY change in percentage points
const AAVE_LIQ_THR   = 0.78;  // WBTC liquidation threshold on Aave V3
const HF_WARN        = 1.6;   // health factor warn / urgent
const HF_URGENT      = 1.25;
const LOOP_LTV_WARN  = 0.85;  // Loopscale loan principal/collateral
const STABLE_DEPEG   = 0.99;  // alert if a stablecoin trades below this

const USDC_ETH = "ethereum:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

async function tfetch(url, opts = {}, ms = 12000) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  try { return await fetch(url, { ...opts, signal: c.signal }); }
  finally { clearTimeout(t); }
}

// Same-account workers are reached via service bindings (public URLs fail with CF error 1042).
async function getPortfolio(env) {
  const d = await env.DEFI.fetch("https://defi-portfolio/").then(r => r.json()).catch(() => null);
  return d && Array.isArray(d.positions) ? d : null;
}

// Tokens Bybit doesn't price (returns $0) — value them via DeFiLlama (key = coingecko id).
const PRICE_FIX = { GRAM: "coingecko:the-open-network" };

// Bybit: total equity (corrected for unpriced tokens) + per-coin map {coin:{amt,usd}}.
async function getBybit(env) {
  const d = await env.BYBIT.fetch("https://bybit-proxy/").then(r => r.json()).catch(() => null);
  const acc = d?.result?.list?.[0];
  if (!acc?.totalEquity) return null;
  let equity = Number(acc.totalEquity) || 0;
  const coins = {};
  for (const c of (acc.coin || [])) {
    let usd = parseFloat(c.usdValue) || 0;
    const amt = parseFloat(c.walletBalance) || 0;
    if (usd < 0.5 && amt > 0 && PRICE_FIX[c.coin]) {
      const pr = await tfetch(`https://coins.llama.fi/prices/current/${PRICE_FIX[c.coin]}`).then(r => r.json()).catch(() => null);
      const p = pr?.coins?.[PRICE_FIX[c.coin]]?.price;
      if (p > 0) { equity += amt * p - usd; usd = amt * p; }
    }
    if (usd >= 1) coins[c.coin] = { amt, usd };
  }
  return { equity, coins };
}

async function getBybitEquity(env) {
  const b = await getBybit(env);
  return b ? b.equity : null;
}

async function sendTelegram(env, html) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return { ok: false, error: "no token/chat" };
  const r = await tfetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: env.TELEGRAM_CHAT_ID, text: html, parse_mode: "HTML", disable_web_page_preview: true,
      ...(env.TELEGRAM_THREAD_ID ? { message_thread_id: Number(env.TELEGRAM_THREAD_ID) } : {}),
    }),
  }).then(r => r.json()).catch(e => ({ ok: false, error: String(e) }));
  return r;
}

// Net USD value of a position (debt negative). lp positions use usdValue.
const posVal = p => p.usdValue ?? (p.type !== "lp" ? p.balance : 0) ?? 0;
const today = () => new Date().toISOString().slice(0, 10);

function snapshot(data) {
  const pos = {};
  for (const p of data.positions) pos[p.id] = { usd: posVal(p), apy: p.apy ?? null, name: `${p.protocol} ${p.asset}` };
  const total = data.positions.reduce((s, p) => s + posVal(p), 0);
  return { ts: Date.now(), total, pos };
}

// ── Alerts ────────────────────────────────────────────────────────────────────
async function runAlerts(env) {
  const data = await getPortfolio(env);
  if (!data) return { ok: false, error: "no portfolio data" };
  const day = today();
  const bybit = await getBybit(env);
  const cur = snapshot(data);
  cur.bybit = bybit?.coins || {};
  cur.bybitOk = !!bybit && Object.keys(cur.bybit).length > 0;

  let baseline = await env.STATE.get(`baseline:${day}`, "json");
  if (!baseline) {
    await env.STATE.put(`baseline:${day}`, JSON.stringify(cur), { expirationTtl: 172800 });
    return { ok: true, note: "baseline set, no alerts" };
  }

  const sent = new Set((await env.STATE.get(`sent:${day}`, "json")) || []);
  const alerts = [];
  const add = (key, text) => { if (!sent.has(key)) { alerts.push(text); sent.add(key); } };

  // 1) Liquidation risk — Aave health factor
  const wbtc = data.positions.find(p => p.id === "aave-eth-wbtc");
  const debt = data.positions.find(p => p.id === "aave-eth-usdc-debt");
  if (wbtc && debt && Math.abs(posVal(debt)) > 1) {
    const hf = (posVal(wbtc) * AAVE_LIQ_THR) / Math.abs(posVal(debt));
    if (hf < HF_URGENT) add("aave-hf-urgent", `🚨 <b>Aave: риск ликвидации</b>\nHealth factor ${hf.toFixed(2)} — критично. Залог $${posVal(wbtc).toFixed(0)}, долг $${Math.abs(posVal(debt)).toFixed(0)}.`);
    else if (hf < HF_WARN) add("aave-hf-warn", `⚠️ <b>Aave: HF падает</b>\nHealth factor ${hf.toFixed(2)}. Залог $${posVal(wbtc).toFixed(0)}, долг $${Math.abs(posVal(debt)).toFixed(0)}.`);
  }

  // 2) Liquidation risk — Loopscale loops LTV
  const loop = data.positions.find(p => p.id === "loopscale-loops");
  for (const l of (loop?.loops || [])) {
    if (l.collateralUsd > 0 && l.principalUsd > 0) {
      const ltv = l.principalUsd / l.collateralUsd;
      if (ltv >= LOOP_LTV_WARN) add(`loop-ltv-${l.address?.slice(0, 6)}`, `⚠️ <b>Loopscale: высокий LTV</b>\n${l.label || "заём"} LTV ${(ltv * 100).toFixed(0)}% (залог $${l.collateralUsd.toFixed(0)} / долг $${l.principalUsd.toFixed(0)}).`);
    }
  }

  // 3) Swings & APY vs daily baseline; new/removed positions
  for (const [id, c] of Object.entries(cur.pos)) {
    const b = baseline.pos[id];
    if (!b) { add(`new-${id}`, `🆕 <b>Новая позиция</b>\n${c.name}: $${c.usd.toFixed(0)}`); continue; }
    if (Math.abs(b.usd) > 5) {
      const dpct = (c.usd - b.usd) / Math.abs(b.usd) * 100;
      if (Math.abs(dpct) >= SWING_PCT) add(`swing-${id}`, `${dpct >= 0 ? "📈" : "📉"} <b>${c.name}</b>\n${dpct >= 0 ? "+" : ""}${dpct.toFixed(1)}% за день · $${b.usd.toFixed(0)} → $${c.usd.toFixed(0)}`);
    }
    if (b.apy != null && c.apy != null && Math.abs(c.apy - b.apy) >= APY_DELTA)
      add(`apy-${id}`, `📊 <b>${c.name}: APY ${c.apy > b.apy ? "вырос" : "упал"}</b>\n${b.apy.toFixed(1)}% → ${c.apy.toFixed(1)}%`);
  }
  for (const id of Object.keys(baseline.pos)) {
    if (!cur.pos[id]) add(`gone-${id}`, `❎ <b>Позиция закрыта</b>\n${baseline.pos[id].name}`);
  }
  // total swing
  if (Math.abs(baseline.total) > 5) {
    const dpct = (cur.total - baseline.total) / Math.abs(baseline.total) * 100;
    if (Math.abs(dpct) >= SWING_PCT) add("swing-total", `${dpct >= 0 ? "📈" : "📉"} <b>Портфель ${dpct >= 0 ? "+" : ""}${dpct.toFixed(1)}% за день</b>\n$${baseline.total.toFixed(0)} → $${cur.total.toFixed(0)}`);
  }

  // 4) Stablecoin depeg (real USDC price)
  const px = await tfetch(`https://coins.llama.fi/prices/current/${USDC_ETH}`).then(r => r.json()).catch(() => null);
  const usdc = px?.coins?.[USDC_ETH]?.price;
  if (usdc != null && usdc < STABLE_DEPEG) add(`depeg-usdc`, `🚨 <b>USDC депег</b>\nЦена $${usdc.toFixed(4)} — ниже $${STABLE_DEPEG}.`);

  // 5) Bybit монеты: пропала / новая / просадка vs дневной baseline
  const fmtAmt = n => Number(n) >= 1 ? Number(n).toFixed(2) : Number(n).toFixed(6);
  // Только если Bybit реально ответил (есть монеты). Пустой/сбойный ответ
  // НЕ трактуем как «всё продано» — иначе ложные алерты «пропал».
  const bbBase = baseline.bybit, bbCur = cur.bybit || {};
  if (bbBase && cur.bybitOk) {
    for (const [coin, b] of Object.entries(bbBase)) {
      const c = bbCur[coin];
      if (!c) add(`bb-gone-${coin}`, `🔻 <b>Bybit: ${coin} пропал</b>\nБыло ${fmtAmt(b.amt)} (~$${b.usd.toFixed(0)}). Продано / конвертировано / выведено.`);
      else if (b.usd > 50 && b.amt > 0 && (b.amt - c.amt) / b.amt >= 0.25)
        add(`bb-drop-${coin}`, `📉 <b>Bybit: ${coin} уменьшился</b>\n${fmtAmt(b.amt)} → ${fmtAmt(c.amt)} (~-$${(b.usd - c.usd).toFixed(0)}).`);
    }
    for (const coin of Object.keys(bbCur)) {
      if (!bbBase[coin]) add(`bb-new-${coin}`, `🆕 <b>Bybit: новая монета ${coin}</b>\n${fmtAmt(bbCur[coin].amt)} (~$${bbCur[coin].usd.toFixed(0)})`);
    }
  }

  // Persist "last seen" + dedupe set
  await env.STATE.put(`last`, JSON.stringify(cur));
  await env.STATE.put(`sent:${day}`, JSON.stringify([...sent]), { expirationTtl: 172800 });

  if (alerts.length) await sendTelegram(env, alerts.join("\n\n"));
  return { ok: true, alerts: alerts.length };
}

// ── History (daily snapshot for charts) ───────────────────────────────────────
// One entry per day in KV: `hist:YYYY-MM-DD` (no TTL — kept forever).
// Index `hist:index` holds the sorted list of dates so we can read a range
// without relying on KV list(). Breakdown lets the UI explain "из-за чего +/-".
async function recordHistory(env, { data, bybit }) {
  const day = today();
  const breakdown = {};
  for (const p of data.positions) {
    const usd = posVal(p);
    if (Math.abs(usd) >= 1) breakdown[`defi:${p.id}`] = { name: `${p.protocol} ${p.asset}`, usd };
  }
  for (const [coin, c] of Object.entries(bybit?.coins || {}))
    breakdown[`bybit:${coin}`] = { name: `Bybit ${coin}`, usd: c.usd };

  const defiTotal = data.positions.reduce((s, p) => s + posVal(p), 0);
  const total = defiTotal + (bybit?.equity || 0);
  const entry = { date: day, total, defi: defiTotal, bybit: bybit?.equity || 0, breakdown };

  await env.STATE.put(`hist:${day}`, JSON.stringify(entry)); // no expiration
  const index = (await env.STATE.get("hist:index", "json")) || [];
  if (!index.includes(day)) { index.push(day); index.sort(); await env.STATE.put("hist:index", JSON.stringify(index)); }
  return entry;
}

async function getHistory(env, days = 0) {
  let index = (await env.STATE.get("hist:index", "json")) || [];
  if (days > 0) index = index.slice(-days);
  const entries = await Promise.all(index.map(d => env.STATE.get(`hist:${d}`, "json")));
  return entries.filter(Boolean);
}

// ── Gas / fees spent (on-chain tx fees for the main EVM wallet) ────────────────
// Считаем gasUsed×gasPrice по всем исходящим транзакциям кошелька на каждой сети
// (платим газ только за свои tx). Источники keyless: Blockscout + Routescan.
// Тяжёлый запрос → кешируем в KV `gas:cache`, пересчёт раз в день из дайджеста.
const GAS_WALLET = "0x2d80f9bef9da5bc0c011d7239d31997528216aec";
const GAS_SOURCES = [
  { chain: "Base",      token: "ETH",  price: "coingecko:ethereum",       api: "https://base.blockscout.com/api" },
  { chain: "Ethereum",  token: "ETH",  price: "coingecko:ethereum",       api: "https://eth.blockscout.com/api" },
  { chain: "Arbitrum",  token: "ETH",  price: "coingecko:ethereum",       api: "https://arbitrum.blockscout.com/api" },
  { chain: "Berachain", token: "BERA", price: "coingecko:berachain-bera", api: "https://api.routescan.io/v2/network/mainnet/evm/80094/etherscan/api" },
];

async function priceOf(id) {
  const r = await tfetch(`https://coins.llama.fi/prices/current/${id}`).then(r => r.json()).catch(() => null);
  return r?.coins?.[id]?.price || 0;
}

async function chainGas(src) {
  const url = `${src.api}?module=account&action=txlist&address=${GAS_WALLET}&page=1&offset=10000&sort=asc`;
  const d = await tfetch(url, {}, 15000).then(r => r.json()).catch(() => null);
  const list = Array.isArray(d?.result) ? d.result : [];
  let wei = 0n, txs = 0;
  for (const t of list) {
    if ((t.from || "").toLowerCase() !== GAS_WALLET) continue;     // газ платит только отправитель
    wei += BigInt(t.gasUsed || "0") * BigInt(t.gasPrice || "0");
    txs++;
  }
  const native = Number(wei / 1_000_000_000n) / 1e9;               // wei → токен без потери точности
  return { chain: src.chain, token: src.token, native, txs, capped: list.length >= 10000, priceId: src.price };
}

async function computeGas(env) {
  const parts = await Promise.all(GAS_SOURCES.map(s =>
    chainGas(s).catch(() => ({ chain: s.chain, token: s.token, native: 0, txs: 0, capped: false, priceId: s.price }))));
  const priceCache = {};
  for (const p of parts) {
    if (priceCache[p.priceId] == null) priceCache[p.priceId] = await priceOf(p.priceId);
    p.usd = p.native * priceCache[p.priceId];
    delete p.priceId;
  }
  const result = {
    ts: Date.now(),
    totalUsd: parts.reduce((s, p) => s + p.usd, 0),
    totalTxs: parts.reduce((s, p) => s + p.txs, 0),
    byChain: parts,
    note: "USD по текущим ценам нативного токена",
  };
  await env.STATE.put("gas:cache", JSON.stringify(result));
  return result;
}

// ── Daily AI digest ─────────────────────────────────────────────────────────
async function runDigest(env) {
  const [data, bybit] = await Promise.all([getPortfolio(env), getBybit(env)]);
  if (!data) return { ok: false, error: "no portfolio data" };
  await recordHistory(env, { data, bybit }).catch(() => {});
  await computeGas(env).catch(() => {});

  const lines = data.positions
    .filter(p => Math.abs(posVal(p)) >= 1)
    .sort((a, b) => posVal(b) - posVal(a))
    .map(p => `${p.protocol} ${p.asset}: $${posVal(p).toFixed(0)}${p.apy != null ? ` (APY ${p.apy.toFixed(1)}%)` : ""}`);
  const defiTotal = data.positions.reduce((s, p) => s + posVal(p), 0);
  const bybitEq = bybit?.equity || 0;
  const grand = defiTotal + bybitEq;

  const summary = [
    `Портфель пользователя на сегодня (${today()}):`,
    `Итого крипто: $${grand.toFixed(0)} (DeFi $${defiTotal.toFixed(0)}${bybitEq ? `, Bybit $${bybitEq.toFixed(0)}` : ""}).`,
    `Позиции:`, ...lines,
  ].join("\n");

  const ai = await env.AIPROXY.fetch("https://ai-proxy/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system: "Ты опытный DeFi-портфельный аналитик. Отвечай по-русски, кратко, по делу. Без воды и без markdown-заголовков. Формат: 1) краткая оценка портфеля (1-2 строки), 2) 1-3 конкретные идеи/рекомендации или риски (буллетами через •). Не выдумывай данные, опирайся только на присланное.",
      messages: [{ role: "user", content: summary + "\n\nДай оценку и идеи." }],
    }),
  }).then(r => r.json()).catch(() => null);

  const text = ai?.content?.[0]?.text || "AI недоступен.";
  const msg = `🧠 <b>Дайджест портфеля</b> · ${today()}\n💰 Итого: <b>$${grand.toFixed(0)}</b> (DeFi $${defiTotal.toFixed(0)}${bybitEq ? ` · Bybit $${bybitEq.toFixed(0)}` : ""})\n\n${escapeHtml(text)}`;
  const res = await sendTelegram(env, msg);
  return { ok: res.ok, sent: true };
}

function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export default {
  async scheduled(event, env) {
    if (event.cron === "0 6 * * *") await runDigest(env);
    else await runAlerts(env);
  },
  async fetch(req, env) {
    const run = new URL(req.url).searchParams.get("run");
    if (run === "debug") {
      try {
        const r = await env.DEFI.fetch("https://defi-portfolio/");
        const txt = await r.text();
        return json({ status: r.status, len: txt.length, head: txt.slice(0, 120) });
      } catch (e) { return json({ err: String(e) }); }
    }
    if (run === "test") return json(await sendTelegram(env, "✅ <b>Portfolio Monitor</b> подключён. Тестовое сообщение."));
    if (run === "digest") return json(await runDigest(env));
    if (run === "alerts") return json(await runAlerts(env));
    if (run === "history") {
      const days = Number(new URL(req.url).searchParams.get("days")) || 0;
      return json(await getHistory(env, days), 200, true);
    }
    if (run === "snapshot") { // ручной снимок «сейчас» (для бэкфилла/теста)
      const [data, bybit] = await Promise.all([getPortfolio(env), getBybit(env)]);
      if (!data) return json({ ok: false, error: "no portfolio data" });
      return json(await recordHistory(env, { data, bybit }));
    }
    if (run === "gas") {
      const fresh = new URL(req.url).searchParams.get("fresh");
      let g = fresh ? null : await env.STATE.get("gas:cache", "json");
      if (!g) g = await computeGas(env);
      return json(g, 200, true);
    }
    return json({ ok: true, hint: "use ?run=test | ?run=alerts | ?run=digest | ?run=history[&days=N] | ?run=snapshot | ?run=gas[&fresh=1]" });
  },
};

function json(data, status = 200, cors = false) {
  const headers = { "Content-Type": "application/json" };
  if (cors) headers["Access-Control-Allow-Origin"] = "*";
  return new Response(JSON.stringify(data, null, 2), { status, headers });
}
