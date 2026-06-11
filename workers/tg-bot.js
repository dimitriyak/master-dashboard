/**
 * Telegram Bot Worker
 * Secrets: TG_TOKEN, SYNC_TOKEN
 * KV:      USER_DATA (shared with data-sync)
 *
 * Webhook: POST /webhook
 * Setup:   GET  /setup  → registers webhook with Telegram
 */

const TG = (token) => `https://api.telegram.org/bot${token}`;

async function sendMessage(token, chatId, text, extra = {}) {
  await fetch(`${TG(token)}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", ...extra }),
  });
}

function fmtRub(n) { return `₽${(n / 1_000_000).toFixed(2)}M`; }
function fmtUsd(n) { return `$${Math.round(n / 1000)}K`; }

const MONTHS_RU = ["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];
const fmtMonth = (m) => { const [y, mo] = m.split("-"); return `${MONTHS_RU[parseInt(mo)-1]} ${y}`; };

async function getKV(env, key) {
  try { return await env.USER_DATA.get(key, { type: "json" }); } catch { return null; }
}

async function handleCommand(cmd, chatId, env) {
  const token = env.TG_TOKEN;

  // ── /start ────────────────────────────────────────────────────────────────
  if (cmd === "/start" || cmd === "/help") {
    return sendMessage(token, chatId,
      `👋 <b>Dashboard Bot</b>\n\n` +
      `Команды:\n` +
      `/status — общий обзор\n` +
      `/nw — Net Worth\n` +
      `/hw — Crypto домашка\n` +
      `/way — 1M$ Way\n` +
      `/wishes — Wishlist прогресс`,
      { reply_markup: { inline_keyboard: [
        [{ text: "📊 Статус", callback_data: "/status" }, { text: "💰 Net Worth", callback_data: "/nw" }],
        [{ text: "📚 Домашка", callback_data: "/hw" },    { text: "🚀 1M$ Way",  callback_data: "/way" }],
      ]}}
    );
  }

  // ── /status ───────────────────────────────────────────────────────────────
  if (cmd === "/status") {
    const [nwData, hwData, wishData, wayData] = await Promise.all([
      getKV(env, "networth_v1"),
      getKV(env, "defi_hw"),
      getKV(env, "wishlist_state"),
      getKV(env, "way-to-1m-v1"),
    ]);

    // NW
    const nwMonths = (nwData || []).sort((a, b) => a.month.localeCompare(b.month));
    const latest = nwMonths[nwMonths.length - 1];
    const prevNw = nwMonths[nwMonths.length - 2];
    const nwDelta = latest && prevNw ? latest.nwUsd - prevNw.nwUsd : 0;
    const nwLine = latest
      ? `💰 <b>Net Worth:</b> ${fmtUsd(latest.nwUsd)} ${fmtRub(latest.nwRub)}` +
        (nwDelta !== 0 ? ` <i>(${nwDelta > 0 ? "+" : ""}${fmtUsd(nwDelta)})</i>` : "")
      : "💰 <b>Net Worth:</b> нет данных";

    // HW
    const hw = hwData || {};
    const hwKeys = Object.keys(hw).filter(k => hw[k]);
    const hwLine = `📚 <b>Домашка:</b> ${hwKeys.length} задач выполнено`;

    // Wishes
    const wish = wishData || {};
    const wishDone = Object.values(wish).filter(Boolean).length;
    const wishTotal = 28;
    const wishLine = `✦ <b>Wishlist:</b> ${wishDone}/${wishTotal} целей`;

    // Way
    const way = wayData || {};
    const wayAmt = way.currentAmount || 0;
    const wayLine = `🚀 <b>1M$ Way:</b> $${wayAmt.toLocaleString()}`;

    const text = [
      `📊 <b>Dashboard — ${new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}</b>`,
      "",
      nwLine,
      hwLine,
      wishLine,
      wayLine,
    ].join("\n");

    return sendMessage(token, chatId, text, { reply_markup: { inline_keyboard: [
      [{ text: "💰 Подробнее NW", callback_data: "/nw" }, { text: "📚 Домашка", callback_data: "/hw" }],
    ]}});
  }

  // ── /nw ──────────────────────────────────────────────────────────────────
  if (cmd === "/nw") {
    const nwData = await getKV(env, "networth_v1");
    const months = (nwData || []).sort((a, b) => a.month.localeCompare(b.month));
    if (months.length === 0) return sendMessage(token, chatId, "Нет данных по Net Worth.");

    const latest = months[months.length - 1];
    const prev   = months[months.length - 2];
    const delta  = prev ? latest.nwUsd - prev.nwUsd : 0;
    const pct    = prev ? ((delta / prev.nwUsd) * 100).toFixed(1) : 0;

    const ta = latest.assets.kv + latest.assets.avto + latest.assets.sklad + latest.assets.crypto * latest.rate;
    const tl = latest.liabilities.ipoteka + latest.liabilities.credit;

    const lines = [
      `💰 <b>Net Worth — ${fmtMonth(latest.month)}</b>`,
      "",
      `<b>${fmtUsd(latest.nwUsd)}</b>  |  ${fmtRub(latest.nwRub)}`,
      delta !== 0 ? `Δ ${delta > 0 ? "+" : ""}${fmtUsd(delta)} (${pct}%) vs ${fmtMonth(prev.month)}` : "",
      "",
      `<b>Активы:</b>  ${fmtRub(ta)}`,
      `  • Квартира    ${fmtRub(latest.assets.kv)}`,
      `  • Авто        ${fmtRub(latest.assets.avto)}`,
      `  • Склад       ${fmtRub(latest.assets.sklad)}`,
      `  • Крипта      $${latest.assets.crypto.toLocaleString()}`,
      "",
      `<b>Обязательства:</b>  −${fmtRub(tl)}`,
      `  • Ипотека     ${fmtRub(latest.liabilities.ipoteka)}`,
      `  • Кредиты     ${fmtRub(latest.liabilities.credit)}`,
      "",
      `Курс: ${latest.rate} ₽/$`,
    ].filter(l => l !== "").join("\n");

    // Mini chart (text sparkline)
    const sparkVals = months.map(m => m.nwUsd);
    const sparkMin = Math.min(...sparkVals);
    const sparkMax = Math.max(...sparkVals);
    const bars = ["▁","▂","▃","▄","▅","▆","▇","█"];
    const spark = sparkVals.map(v => {
      const idx = Math.round(((v - sparkMin) / (sparkMax - sparkMin || 1)) * (bars.length - 1));
      return bars[idx];
    }).join("");
    const sparkLine = `\n📈 ${spark}  ${months.map(m => MONTHS_RU[parseInt(m.month.split("-")[1])-1]).join(" ")}`;

    return sendMessage(token, chatId, lines + sparkLine);
  }

  // ── /hw ──────────────────────────────────────────────────────────────────
  if (cmd === "/hw") {
    const hwData = await getKV(env, "defi_hw");
    const hw = hwData || {};

    // Compute week-by-week progress (weeks from app)
    const WEEKS = [
      { week: 0, title: "Подготовка",     total: 1 },
      { week: 1, title: "Фундамент",      total: 11 },
      { week: 2, title: "Lending $400",   total: 5 },
      { week: 3, title: "LP $400",        total: 6 },
      { week: 4, title: "BTCfi $300",     total: 5 },
      { week: 5, title: "Золото $300",    total: 4 },
      { week: 6, title: "Новые протоколы",total: 6 },
      { week: 7, title: "Pendle $300",    total: 5 },
    ];

    const lines = [`📚 <b>Crypto Домашка</b>`, ""];
    let nextTask = null;

    for (const w of WEEKS) {
      const done = Array.from({ length: w.total }, (_, i) => hw[`${w.week}-${i}`]).filter(Boolean).length;
      const pct = Math.round((done / w.total) * 100);
      const bar = done === w.total ? "✅" : done === 0 ? "⬜" : "🟡";
      lines.push(`${bar} W${w.week} ${w.title}  <i>${done}/${w.total}</i>`);
      if (!nextTask && done < w.total) {
        const nextIdx = Array.from({ length: w.total }, (_, i) => i).find(i => !hw[`${w.week}-${i}`]);
        nextTask = { week: w.week, title: w.title, idx: nextIdx };
      }
    }

    const totalDone = Object.values(hw).filter(Boolean).length;
    const totalAll  = WEEKS.reduce((s, w) => s + w.total, 0);
    lines.push("", `<b>Итого:</b> ${totalDone}/${totalAll} задач`);

    if (nextTask) {
      lines.push(`\n⏭ <b>Следующий раздел:</b> W${nextTask.week} ${nextTask.title}`);
    }

    return sendMessage(token, chatId, lines.join("\n"));
  }

  // ── /way ─────────────────────────────────────────────────────────────────
  if (cmd === "/way") {
    const wayData = await getKV(env, "way-to-1m-v1");
    const way = wayData || {};
    const amt = way.currentAmount || 0;
    const milestones = way.milestones || [];
    const pct = Math.round((amt / 1_000_000) * 100);

    const lines = [
      `🚀 <b>1M$ Way</b>`,
      "",
      `Текущий капитал: <b>$${amt.toLocaleString()}</b>`,
      `Прогресс: ${pct}% к $1,000,000`,
      "",
      "<b>Вехи:</b>",
    ];
    for (const m of milestones) {
      const reached = m.reached || amt >= m.amount;
      lines.push(`${reached ? "✅" : "⬜"} ${m.label}`);
    }

    const tasks = (way.tasks || []).filter(t => !t.done);
    if (tasks.length > 0) {
      lines.push(`\n⏭ <b>Следующая задача:</b>\n${tasks[0].text}`);
    }

    return sendMessage(token, chatId, lines.join("\n"));
  }

  // ── /wishes ──────────────────────────────────────────────────────────────
  if (cmd === "/wishes") {
    const wishData = await getKV(env, "wishlist_state");
    const wish = wishData || {};
    const done = Object.values(wish).filter(Boolean).length;
    const total = 28;
    const pct = Math.round((done / total) * 100);
    const bar = "█".repeat(Math.round(pct / 10)) + "░".repeat(10 - Math.round(pct / 10));
    return sendMessage(token, chatId,
      `✦ <b>Wishlist</b>\n\n${bar} ${pct}%\n${done} из ${total} целей выполнено`
    );
  }

  // Unknown
  return sendMessage(token, chatId, "Неизвестная команда. Напиши /help");
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Setup webhook
    if (url.pathname === "/setup" && request.method === "GET") {
      const webhookUrl = `https://tg-bot.dimitriyak.workers.dev/webhook`;
      const res = await fetch(`${TG(env.TG_TOKEN)}/setWebhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: webhookUrl, allowed_updates: ["message", "callback_query"] }),
      });
      const data = await res.json();
      return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
    }

    // Webhook handler
    if (url.pathname === "/webhook" && request.method === "POST") {
      const update = await request.json();
      let chatId, text;

      if (update.message) {
        chatId = update.message.chat.id;
        text   = (update.message.text || "").trim();
      } else if (update.callback_query) {
        chatId = update.callback_query.message.chat.id;
        text   = update.callback_query.data;
        // Answer callback to remove loading spinner
        fetch(`${TG(env.TG_TOKEN)}/answerCallbackQuery`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ callback_query_id: update.callback_query.id }),
        });
      }

      if (chatId && text) {
        const cmd = text.split(" ")[0].toLowerCase();
        await handleCommand(cmd, chatId, env);
      }

      return new Response("ok");
    }

    return new Response("Not found", { status: 404 });
  },
};
