import { useState, useEffect, useCallback, useRef } from 'react'
import { BrowserRouter, Routes, Route, NavLink, useNavigate, useParams, Navigate, useLocation } from 'react-router-dom'
import {
  STORAGE_KEYS, DEFI_INITIAL, WAY_INITIAL, NW_INITIAL,
  DEFI_WEEKS, TYPE_ICONS, protocolIcon, protocolUrl, C, BYBIT_PROXY_URL, AI_PROXY_URL, NEWS_URL, pill,
  SYNC_URL, SYNC_TOKEN, AI_STATS_URL, DEFI_PORTFOLIO_URL, PORTFOLIO_MONITOR_URL, RESOURCES_DEFAULT,
} from './constants'

// ── Design tokens ─────────────────────────────────────────────────────────────
const CARD_SHADOW = "inset 0 1px 0 rgba(255,255,255,0.03), 0 8px 24px rgba(0,0,0,0.35)";

// ── Toast ─────────────────────────────────────────────────────────────────────
let _toastFn = null;
const toast = (msg, color = "#4ADE80") => _toastFn?.(msg, color);

function ToastHost() {
  const [toasts, setToasts] = useState([]);
  useEffect(() => {
    _toastFn = (msg, color) => {
      const id = Date.now();
      setToasts(p => [...p, { id, msg, color }]);
      setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
    };
    return () => { _toastFn = null; };
  }, []);
  return (
    <div className="toast-host" style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8, pointerEvents: "none" }}>
      {toasts.map(t => (
        <div key={t.id} style={{ background: C.surface, border: `1px solid ${t.color}55`, borderRadius: 10, padding: "10px 18px", fontSize: 14, color: C.text, boxShadow: `0 4px 20px rgba(0,0,0,0.4)`, animation: "fadeUp 0.25s ease forwards" }}>
          <span style={{ marginRight: 8, color: t.color }}>●</span>{t.msg}
        </div>
      ))}
    </div>
  );
}

// ── Cloud sync ────────────────────────────────────────────────────────────────
const syncHeaders = { "Content-Type": "application/json", "Authorization": `Bearer ${SYNC_TOKEN}` };

async function cloudGet(key) {
  try {
    const res = await fetch(`${SYNC_URL}/sync/${key}`, { headers: syncHeaders });
    if (!res.ok) return null;
    const { value } = await res.json();
    return value;
  } catch { return null; }
}

async function cloudSet(key, value) {
  try {
    await fetch(`${SYNC_URL}/sync/${key}`, {
      method: "POST",
      headers: syncHeaders,
      body: JSON.stringify(value),
    });
  } catch {}
}

// Debounce helper
function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

function ls(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function lsSet(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }

function Overview({ wishState, defiPositions, defiHw, wayData, nwData, onNavigate }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  const [aiStats, setAiStats] = useState(null);
  const [claudeStats, setClaudeStats] = useState(null);
  const [bybitBalance, setBybitBalance] = useState(() => {
    const h = (() => { try { return JSON.parse(localStorage.getItem("bybit_history")) || []; } catch { return []; } })();
    return h.length ? h[h.length - 1].balance : null;
  });
  const [liveDefiCurrent, setLiveDefiCurrent] = useState(null);
  const [rabbyIdle, setRabbyIdle] = useState(0);
  useEffect(() => {
    fetch(`${AI_STATS_URL}/stats`).then(r => r.json()).then(setAiStats).catch(() => {});
    fetch(`${SYNC_URL}/sync/claude_usage`, { headers: { Authorization: `Bearer ${SYNC_TOKEN}` } })
      .then(r => r.json()).then(d => setClaudeStats(d.value)).catch(() => {});
    fetch(BYBIT_PROXY_URL).then(r => r.json()).then(d => {
      const eq = parseFloat(d?.result?.list?.[0]?.totalEquity);
      if (!isNaN(eq)) setBybitBalance(eq);
    }).catch(() => {});
    // Живой DeFi-тотал прямо из воркера — чтобы не зависеть от кэша current,
    // который обновляется только при заходе на страницу DeFi.
    fetch(DEFI_PORTFOLIO_URL).then(r => r.json()).then(d => {
      if (!Array.isArray(d?.positions)) return;
      const posVal = p => p.usdValue ?? (p.type !== "lp" ? p.balance : 0) ?? 0;
      setLiveDefiCurrent(d.positions.reduce((s, p) => s + posVal(p), 0));
      // Rabby idle: токены кошелька вне DeFi-позиций — как на странице Crypto.
      setRabbyIdle((d.walletTokens || []).reduce((s, t) => s + (t.usdValue ?? 0), 0));
    }).catch(() => {});
  }, []);
  const defiTotal = DEFI_WEEKS.reduce((s, w) => s + w.tasks.length, 0);
  const defiHwDone = Object.values(defiHw).filter(Boolean).length;
  const defiHwPct = Math.round((defiHwDone / defiTotal) * 100);
  const defiCurrent = defiPositions.reduce((s, p) => s + p.current, 0);
  const defiAllocated = defiPositions.reduce((s, p) => s + (p.invested ?? p.allocated ?? 0), 0);
  const defiPnl = defiCurrent - defiAllocated;
  const defiNextTask = (() => { for (const w of DEFI_WEEKS) { const idx = w.tasks.findIndex((_, i) => !defiHw[`${w.week}-${i}`]); if (idx !== -1) { const t = w.tasks[idx]; return typeof t === "string" ? t : t.text; } } return null; })();

  const wayDone = wayData.tasks.filter(t => t.done).length;
  const wayCapital = (() => { const m = (nwData || []).slice().sort((a, b) => a.month.localeCompare(b.month)).at(-1); return m?.nwUsd ?? wayData.currentAmount; })();
  const wayProgress = wayCapital / 1000000 * 100;
  const wayNextTask = wayData.tasks.find(t => !t.done);

  const cards = [
    { id: "defi", icon: "₿", label: "CRYPTO", title: "Crypto", subtitle: "Портфель · P&L · APY", progress: defiHwPct, stat1: { label: "P&L", val: `${defiPnl >= 0 ? "+" : ""}$${defiPnl.toFixed(0)}` }, stat2: bybitBalance != null ? { label: "Bybit", val: `$${Math.round(bybitBalance).toLocaleString()}` } : { label: "в работе", val: `$${defiCurrent.toLocaleString()}` }, nextTask: defiNextTask || null, color: "#00E5FF" },
  ];

  return (
    <div className="page-pad" style={{ maxWidth: 960, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <div style={{ fontSize: 14, color: C.muted }}>
            {now.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })}
            <span style={{ marginLeft: 10, fontFamily: "monospace", color: "#4ADE80" }}>{now.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        </div>
        <h1 className="overview-h1" style={{ fontSize: 30, fontWeight: 700, color: C.text, letterSpacing: "-0.02em", margin: 0 }}>
          {(() => { const h = now.getHours(); return h < 6 ? "Доброй ночи, Дима" : h < 12 ? "Доброе утро, Дима" : h < 18 ? "Добрый день, Дима" : "Добрый вечер, Дима"; })()}
        </h1>
      </div>


      {/* Networth mini-card */}
      {(() => {
        const months = (nwData || []).sort((a, b) => a.month.localeCompare(b.month));
        const latest = months[months.length - 1];
        const prev   = months[months.length - 2];
        if (!latest) return null;
        const delta = prev ? latest.nwUsd - prev.nwUsd : 0;
        const pct   = prev && prev.nwUsd ? ((delta / prev.nwUsd) * 100).toFixed(1) : null;
        const MRU = ["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];
        const fmtM = (m) => { const [y, mo] = m.split("-"); return `${MRU[parseInt(mo)-1]} ${y}`; };
        // sparkline
        const vals = months.map(d => d.nwUsd);
        const minV = Math.min(...vals), maxV = Math.max(...vals);
        const W = 120, H = 28;
        const pts = vals.map((v, i) => {
          const x = vals.length > 1 ? (i / (vals.length - 1)) * W : W / 2;
          const y = H - ((v - minV) / (maxV - minV || 1)) * (H - 6) - 3;
          return `${x},${y}`;
        }).join(" ");
        return (
          <button onClick={() => onNavigate("networth")}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, boxShadow: CARD_SHADOW, padding: "16px 20px", marginBottom: 28, cursor: "pointer", width: "100%", textAlign: "left", transition: "border-color 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(118,255,3,0.35)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
          >
            <div>
              <div style={{ fontSize: 11, color: C.muted, letterSpacing: "0.1em", marginBottom: 4 }}>NETWORTH · {fmtM(latest.month)}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 22, fontWeight: 700, color: "#4ADE80" }}>${Math.round(latest.nwUsd / 1000)}K</span>
                <span style={{ fontSize: 14, color: C.muted }}>₽{(latest.nwRub / 1_000_000).toFixed(2)}M</span>
                {delta !== 0 && pct && (
                  <span style={{ fontSize: 12, color: delta > 0 ? "#4ADE80" : "#FF6450" }}>
                    {delta > 0 ? "+" : ""}${Math.round(delta / 1000)}K ({pct}%)
                  </span>
                )}
              </div>
              {(() => {
                const left = 1_000_000 - latest.nwUsd;
                if (left <= 0) return <div style={{ fontSize: 11, color: "#FFD700", marginTop: 4 }}>🎉 Миллион достигнут!</div>;
                const avgGrowth = prev && delta > 0 ? delta : null;
                const monthsLeft = avgGrowth ? Math.ceil(left / avgGrowth) : null;
                return (
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
                    До $1M: <span style={{ color: C.text }}>${Math.round(left / 1000)}K</span>
                    {monthsLeft && <span style={{ marginLeft: 8, color: "#FFD700" }}>~{monthsLeft} мес</span>}
                  </div>
                );
              })()}
            </div>
            {vals.length >= 2 && (
              <svg width={W} height={H} style={{ flexShrink: 0, overflow: "visible" }}>
                <polyline points={pts} fill="none" stroke="#4ADE80" strokeWidth="1.5" strokeLinejoin="round" opacity="0.8" />
                {vals.map((v, i) => {
                  const x = (i / (vals.length - 1)) * W;
                  const y = H - ((v - minV) / (maxV - minV || 1)) * (H - 6) - 3;
                  return <circle key={i} cx={x} cy={y} r={i === vals.length - 1 ? 3 : 2} fill="#4ADE80" opacity={i === vals.length - 1 ? 1 : 0.5} />;
                })}
              </svg>
            )}
          </button>
        );
      })()}

      {/* Crypto mini-card */}
      {(() => {
        if (!defiPositions.length) return null;
        const defiNow = liveDefiCurrent ?? defiCurrent; // живой тотал, фолбэк на кэш
        const dPnl = defiNow - defiAllocated;
        const pct = defiAllocated ? ((dPnl / defiAllocated) * 100).toFixed(1) : null;
        const cryptoTotal = defiNow + (bybitBalance ?? 0) + rabbyIdle; // общий тотал: DeFi + Bybit + Rabby
        const CC = "#00E5FF";
        return (
          <button onClick={() => onNavigate("defi")}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, boxShadow: CARD_SHADOW, padding: "16px 20px", marginBottom: 28, cursor: "pointer", width: "100%", textAlign: "left", transition: "border-color 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = `${CC}59`}
            onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
          >
            <div>
              <div style={{ fontSize: 11, color: C.muted, letterSpacing: "0.1em", marginBottom: 4 }}>CRYPTO · ПОРТФЕЛЬ</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 22, fontWeight: 700, color: CC }}>${Math.round(cryptoTotal).toLocaleString()}</span>
                {dPnl !== 0 && pct && (
                  <span style={{ fontSize: 12, color: dPnl > 0 ? "#4ADE80" : "#FF6450" }}>
                    DeFi {dPnl > 0 ? "+" : ""}${Math.round(dPnl).toLocaleString()} ({pct}%)
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
                DeFi <span style={{ color: C.text }}>${Math.round(defiNow).toLocaleString()}</span>
                {bybitBalance != null && <span style={{ marginLeft: 8 }}>Bybit <span style={{ color: C.text }}>${Math.round(bybitBalance).toLocaleString()}</span></span>}
                {rabbyIdle >= 1 && <span style={{ marginLeft: 8 }}>Rabby <span style={{ color: C.text }}>${Math.round(rabbyIdle).toLocaleString()}</span></span>}
              </div>
            </div>
            <span style={{ fontSize: 22, flexShrink: 0 }}>₿</span>
          </button>
        );
      })()}

      {/* AI Stats */}
      {(aiStats || claudeStats) && (() => {
        const fmtK = n => n >= 1_000_000 ? `${(n/1_000_000).toFixed(2)}M` : n >= 1000 ? `${(n/1000).toFixed(1)}K` : `${n}`;
        const DAYS = ["Вс","Пн","Вт","Ср","Чт","Пт","Сб"];

        // TG Bot sparkline
        const chart = aiStats?.chart || [];
        const maxBot = Math.max(...chart.map(d => d.tokens), 1);
        const W = 140, H = 26;
        const botPts = chart.map((d, i) => {
          const x = chart.length > 1 ? (i / (chart.length - 1)) * W : W / 2;
          const y = H - (d.tokens / maxBot) * (H - 4) - 2;
          return `${x},${y}`;
        }).join(" ");

        // Claude sparkline (по дням из byDay)
        const claudeDays7 = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(Date.now() - (6 - i) * 86400000);
          return d.toISOString().slice(0, 10);
        });
        const claudeByDay = claudeStats?.byDay || {};
        const claudeChart = claudeDays7.map(d => ({ date: d, tokens: (claudeByDay[d]?.input || 0) + (claudeByDay[d]?.output || 0) }));
        const maxClaude = Math.max(...claudeChart.map(d => d.tokens), 1);
        const claudePts = claudeChart.map((d, i) => {
          const x = claudeChart.length > 1 ? (i / (claudeChart.length - 1)) * W : W / 2;
          const y = H - (d.tokens / maxClaude) * (H - 4) - 2;
          return `${x},${y}`;
        }).join(" ");
        const claudeToday = claudeChart[claudeChart.length - 1]?.tokens || 0;
        const claudeWeek  = claudeChart.reduce((s, d) => s + d.tokens, 0);

        return (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, boxShadow: CARD_SHADOW, padding: "16px 20px", marginBottom: 28 }}>
            <div style={{ fontSize: 11, color: C.muted, letterSpacing: "0.1em", marginBottom: 14 }}>AI ТОКЕНЫ</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

              {/* Claude Code */}
              {claudeStats && (
                <div style={{ borderRight: `1px solid ${C.border}`, paddingRight: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ fontSize: 11, color: "#D97706", fontWeight: 600, letterSpacing: "0.06em" }}>CLAUDE CODE</div>
                    {claudeStats.updatedAt && (() => {
                      const mins = Math.floor((Date.now() - new Date(claudeStats.updatedAt)) / 60000);
                      const label = mins < 1 ? "только что" : mins < 60 ? `${mins}м назад` : `${Math.floor(mins/60)}ч назад`;
                      return <span style={{ fontSize: 10, color: C.muted }}>{label}</span>;
                    })()}
                  </div>
                  <div style={{ display: "flex", gap: 16, alignItems: "baseline", marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: "#D97706" }}>{fmtK(claudeToday)}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>сегодня</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{fmtK(claudeWeek)}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>7 дней</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{fmtK(claudeStats.total)}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>всего</div>
                    </div>
                  </div>
                  <svg width={W} height={H} style={{ overflow: "visible", display: "block" }}>
                    <polyline points={claudePts} fill="none" stroke="#D97706" strokeWidth="1.5" strokeLinejoin="round" opacity="0.8" />
                    {claudeChart.map((d, i) => {
                      const x = (i / (claudeChart.length - 1)) * W;
                      const y = H - (d.tokens / maxClaude) * (H - 4) - 2;
                      return d.tokens > 0 ? <circle key={i} cx={x} cy={y} r="2.5" fill="#D97706" /> : null;
                    })}
                  </svg>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
                    {claudeChart.map((d, i) => <span key={i} style={{ fontSize: 8, color: C.muted }}>{DAYS[new Date(d.date).getDay()]}</span>)}
                  </div>
                </div>
              )}

              {/* TG Bot */}
              {aiStats && (
                <div>
                  <div style={{ fontSize: 11, color: "#7C5CFC", fontWeight: 600, marginBottom: 8, letterSpacing: "0.06em" }}>TG БОТ · {aiStats.activeModel}</div>
                  <div style={{ display: "flex", gap: 16, alignItems: "baseline", marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: "#7C5CFC" }}>{fmtK(aiStats.today)}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>сегодня</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{fmtK(aiStats.week7)}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>7 дней</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{fmtK(aiStats.total)}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>всего</div>
                    </div>
                  </div>
                  <svg width={W} height={H} style={{ overflow: "visible", display: "block" }}>
                    <polyline points={botPts} fill="none" stroke="#7C5CFC" strokeWidth="1.5" strokeLinejoin="round" opacity="0.8" />
                    {chart.map((d, i) => {
                      const x = chart.length > 1 ? (i / (chart.length - 1)) * W : W / 2;
                      const y = H - (d.tokens / maxBot) * (H - 4) - 2;
                      return d.tokens > 0 ? <circle key={i} cx={x} cy={y} r="2.5" fill="#7C5CFC" /> : null;
                    })}
                  </svg>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
                    {chart.map((d, i) => <span key={i} style={{ fontSize: 8, color: C.muted }}>{DAYS[new Date(d.date).getDay()]}</span>)}
                  </div>
                </div>
              )}

            </div>
          </div>
        );
      })()}

      {/* Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {cards.map(card => (
          <button key={card.id} onClick={() => onNavigate(card.id)}
            style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, boxShadow: CARD_SHADOW, padding: "24px", textAlign: "left", cursor: "pointer", transition: "border-color 0.2s, transform 0.2s", position: "relative", overflow: "hidden" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = `${card.color}40`; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            {/* Color accent top bar */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: card.color, opacity: 0.6, borderRadius: "12px 12px 0 0" }} />

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <div style={{ fontSize: 12, color: C.muted }}>{card.subtitle}</div>
              <span style={{ fontSize: 20 }}>{card.icon}</span>
            </div>

            <div style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 16 }}>{card.title}</div>

            {/* Progress */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: C.muted }}>Прогресс</span>
                <span style={{ fontSize: 12, color: card.color, fontWeight: 600 }}>{Math.round(card.progress)}%</span>
              </div>
              <div style={{ height: 4, background: C.border, borderRadius: 2, overflow: "hidden" }}>
                <div style={{ width: `${card.progress}%`, height: "100%", background: card.color, borderRadius: 2, transition: "width 0.6s ease" }} />
              </div>
            </div>

            {/* Next task */}
            {card.nextTask && (
              <div style={{ borderLeft: `2px solid ${card.color}`, paddingLeft: 12, marginBottom: 18 }}>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>Следующий шаг</div>
                <div style={{ fontSize: 14, color: C.text, lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{card.nextTask}</div>
              </div>
            )}

            {/* Stats */}
            <div style={{ display: "flex", gap: 20, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
              <div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 2 }}>{card.stat1.label}</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: card.color }}>{card.stat1.val}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 2 }}>{card.stat2.label}</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: C.text }}>{card.stat2.val}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// Protocol favicon with graceful fallback to the type glyph if the icon fails to load.
function ProtocolIcon({ protocol, type, color }) {
  const [failed, setFailed] = useState(false);
  const src = protocolIcon(protocol);
  if (src && !failed) {
    return <img src={src} alt="" width={16} height={16} onError={() => setFailed(true)}
      style={{ width: 16, height: 16, borderRadius: 4, display: "block", objectFit: "contain" }} />;
  }
  return <span style={{ color, fontSize: 14 }}>{TYPE_ICONS[type]}</span>;
}

const fmtDate = (d) => { if (!d) return null; const [y, m, day] = d.split("-"); return `${day}.${m}.${y}`; };
const fmtUsd = (v) => Number.isFinite(v) ? (v < 0 ? `-$${Math.abs(v).toFixed(2)}` : `$${v.toFixed(2)}`) : "$0.00";
const fmtPnl = (v) => Number.isFinite(v) ? `${v >= 0 ? "+" : ""}${Math.abs(v) < 1 ? v.toFixed(2) : v.toFixed(0)}$` : "+0.00$";
const fmtRewardUsd = (v) => Number.isFinite(v) ? (v < 0.01 ? v.toFixed(4) : v.toFixed(2)) : null;

// Distribution as a horizontal bar chart: row per protocol — clickable icon+name → dashboard,
// proportional bar, value. Sorted by portfolio size.
function DistributionChart({ groups }) {
  const bars = (groups || []).filter(g => g.current > 0).sort((a, b) => b.current - a.current);
  if (!bars.length) return null;
  const max = Math.max(...bars.map(b => b.current));
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, boxShadow: CARD_SHADOW, padding: 16, marginBottom: 16 }}>
      <div style={{ fontSize: 10, color: C.muted, letterSpacing: "0.15em", marginBottom: 14 }}>РАСПРЕДЕЛЕНИЕ</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
        {bars.map(g => {
          const w = Math.max(2, Math.round(g.current / max * 100));
          const url = protocolUrl(g.protocol);
          const Label = url ? "a" : "div";
          return (
            <div key={g.protocol} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Label
                {...(url ? { href: url, target: "_blank", rel: "noopener noreferrer" } : {})}
                title={url ? `${g.protocol} — открыть дашборд` : g.protocol}
                style={{ display: "flex", alignItems: "center", gap: 7, width: 132, flexShrink: 0, textDecoration: "none", color: C.text, cursor: url ? "pointer" : "default" }}
              >
                <ProtocolIcon protocol={g.protocol} type={g.items[0].type} color={g.color} />
                <span style={{ fontSize: 12, fontWeight: 500, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{g.protocol}</span>
              </Label>
              <div style={{ flex: 1, height: 2, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ width: `${w}%`, height: "100%", background: g.color, borderRadius: 2 }} />
              </div>
              <span style={{ width: 58, textAlign: "right", flexShrink: 0, fontSize: 12, fontWeight: 600, color: C.muted }}>${g.current.toFixed(0)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// One card per protocol; each pool / loan / debt is a row inside.
function ProtocolCard({ group }) {
  const { protocol, color, status, items, current, pnl, hasPnl, growth, yield_, hasGrowth } = group;
  const pnlColor = (v) => v >= 0 ? "#4ADE80" : "#FF6450";
  const url = protocolUrl(protocol);
  const NameTag = url ? "a" : "div";
  const statusColors = { active: "#4ADE80", pending: "rgba(255,255,255,0.2)", paused: "#FFD700" };

  const rows = [];
  for (const it of items) {
    if (it.subRows?.length) {
      it.subRows.forEach((sr, i) => rows.push({ key: `${it.id}-${i}`, label: sr.label, usd: sr.usd, apy: sr.apy, isDebt: false, live: true }));
    } else {
      const isOnChain = it.liveDollarValue != null;
      const val = isOnChain ? it.liveDollarValue + (it.liveRewards?.aeroEarnedUsd ?? 0) : it.current;
      const isDebt = it.type === "debt";
      const rowPnl = (isOnChain && !isDebt && it.invested > 0) ? val - it.invested : null;
      rows.push({ key: it.id, label: it.asset, usd: val, apy: it.liveApy, invested: it.invested, date: it.date, isDebt, pnl: rowPnl, live: isOnChain, rewards: it.liveRewards });
    }
  }
  rows.sort((a, b) => (b.usd ?? 0) - (a.usd ?? 0));

  return (
    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 14, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, right: 0, width: 60, height: 60, background: `radial-gradient(circle, ${color}15 0%, transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <NameTag
            {...(url ? { href: url, target: "_blank", rel: "noopener noreferrer" } : {})}
            title={url ? `${protocol} — открыть дашборд` : protocol}
            style={{ display: "flex", alignItems: "center", gap: 7, textDecoration: "none", color: "#fff", cursor: url ? "pointer" : "default" }}
          >
            <ProtocolIcon protocol={protocol} type={items[0].type} color={color} />
            <span style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>{protocol}</span>
          </NameTag>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: statusColors[status] }} />
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{fmtUsd(current)}</div>
          {hasPnl && (hasGrowth ? (
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", fontSize: 10, fontFamily: "monospace", marginTop: 1 }}>
              <span style={{ color: pnlColor(growth) }} title="рост токенов">📈 {fmtPnl(growth)}</span>
              <span style={{ color: pnlColor(yield_) }} title="доходность">💰 {fmtPnl(yield_)}</span>
            </div>
          ) : (
            <div style={{ fontSize: 10, fontFamily: "monospace", color: pnlColor(pnl) }} title="доходность">💰 {fmtPnl(pnl)}</div>
          ))}
        </div>
      </div>
      <div>
        {rows.map((r, idx) => (
          <div key={r.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "7px 0", borderTop: idx > 0 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 12, color: "#fff", fontWeight: 600 }}>
                {r.label}
                {r.isDebt && <span style={{ marginLeft: 6, fontSize: 8, color: "#FF6450", fontWeight: 700, letterSpacing: "0.1em" }}>ДОЛГ</span>}
              </div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", fontFamily: "monospace", marginTop: 2 }}>
                {r.apy != null ? `APY ${r.apy.toFixed(2)}%` : "APY —"}
                {r.invested > 0 ? ` · вложено $${r.invested.toFixed(0)}` : ""}
                {r.date ? ` · ${fmtDate(r.date)}` : ""}
              </div>
              {r.rewards?.aeroEarned > 0 && (
                <div style={{ fontSize: 9, color: "#FFD700", fontFamily: "monospace", marginTop: 2 }}>
                  ⚡ {r.rewards.aeroEarned} AERO{r.rewards.aeroEarnedUsd != null ? ` ≈$${fmtRewardUsd(r.rewards.aeroEarnedUsd)}` : ""}
                </div>
              )}
            </div>
            <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: r.isDebt ? "#FF6450" : (r.live ? "#4ADE80" : "#fff") }}>{fmtUsd(r.usd)}</div>
              {r.pnl != null && (
                <div style={{ fontSize: 9, fontFamily: "monospace", color: r.pnl >= 0 ? "#4ADE80" : "#FF6450" }}>{fmtPnl(r.pnl)}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TaskRow({ taskText, taskDesc, isDone, onToggle, isLast }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: isLast ? "none" : `1px solid ${C.border}` }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 0 6px" }}>
        <button onClick={onToggle} style={{ width: 15, height: 15, borderRadius: 4, flexShrink: 0, marginTop: 2, border: isDone ? "none" : `1px solid ${C.border}`, background: isDone ? "#4ADE80" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0 }}>
          {isDone && <span style={{ color: "#000", fontSize: 10, fontWeight: 900 }}>✓</span>}
        </button>
        <div style={{ flex: 1 }}>
          <span onClick={onToggle} style={{ color: isDone ? C.muted : "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: 500, textDecoration: isDone ? "line-through" : "none", lineHeight: 1.4, cursor: "pointer" }}>{taskText}</span>
        </div>
        {taskDesc && (
          <button onClick={() => setOpen(o => !o)} style={{ flexShrink: 0, background: open ? "rgba(0,229,255,0.12)" : "rgba(0,229,255,0.05)", border: "1px solid rgba(0,229,255,0.2)", borderRadius: 5, color: "#00E5FF", fontSize: 10, padding: "3px 8px", cursor: "pointer", letterSpacing: "0.06em", whiteSpace: "nowrap", marginTop: 1 }}>
            {open ? "▲ скрыть" : "▼ как делать"}
          </button>
        )}
      </div>
      {taskDesc && open && (
        <div style={{ marginLeft: 25, marginBottom: 10, padding: "10px 12px", background: "rgba(0,229,255,0.04)", border: "1px solid rgba(0,229,255,0.12)", borderRadius: 8, fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.7 }}>
          {taskDesc}
        </div>
      )}
    </div>
  );
}

// Движение всего крипто-портфеля во времени + атрибуция «из-за чего +/-».
// Данные — дневные снапшоты из portfolio-monitor (KV, бессрочно).
function PortfolioChart({ liveTotal = 0 }) {
  const PERIODS = [
    { key: "7",   label: "Неделя", days: 7 },
    { key: "30",  label: "Месяц",  days: 30 },
    { key: "90",  label: "3 мес",  days: 90 },
    { key: "365", label: "Год",    days: 365 },
  ];
  const [period, setPeriod] = useState("30");
  const [hist, setHist] = useState(null);     // весь массив снапшотов | [] | null(загрузка)
  const [hover, setHover] = useState(null);   // индекс точки под курсором
  const wrapRef = useRef(null);
  const [W, setW] = useState(820);
  const H = 170, PAD = 6;

  useEffect(() => {
    fetch(`${PORTFOLIO_MONITOR_URL}?run=history`)
      .then(r => r.json())
      .then(d => setHist(Array.isArray(d) ? d : []))
      .catch(() => setHist([]));
  }, []);
  useEffect(() => {
    const measure = () => { if (wrapRef.current) setW(wrapRef.current.clientWidth); };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  if (hist == null) return null;

  const days = PERIODS.find(p => p.key === period).days;
  const cutoff = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
  let data = hist.filter(e => e.date >= cutoff);
  // Последнюю точку синхронизируем с живым «крипто итого»: снапшот в KV пишется
  // раз в день и без Rabby idle, поэтому иначе хвост графика расходится с тоталом.
  if (liveTotal > 0 && data.length) {
    const lastIdx = data.length - 1;
    data = data.map((e, i) => i === lastIdx ? { ...e, total: liveTotal } : e);
  }

  const Box = ({ children }) => (
    <div className="page-pad-sm" style={{ paddingTop: 4, paddingBottom: 4 }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px" }}>{children}</div>
    </div>
  );

  const Switcher = () => (
    <div style={{ display: "flex", gap: 4 }}>
      {PERIODS.map(p => (
        <button key={p.key} onClick={() => { setPeriod(p.key); setHover(null); }}
          style={{
            background: period === p.key ? C.surface : "transparent",
            border: `1px solid ${period === p.key ? "#FFD70055" : C.border}`,
            color: period === p.key ? C.text : C.muted,
            borderRadius: 6, padding: "3px 9px", fontSize: 11, cursor: "pointer", fontWeight: 600,
          }}>{p.label}</button>
      ))}
    </div>
  );

  const Header = () => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
      <span style={{ fontSize: 10, color: C.muted, letterSpacing: "0.14em", fontWeight: 600 }}>ДВИЖЕНИЕ ПОРТФЕЛЯ</span>
      <Switcher />
    </div>
  );

  if (data.length < 2) {
    return (
      <Box>
        <Header />
        <div style={{ fontSize: 12, color: C.muted, padding: "16px 0", textAlign: "center" }}>
          Накапливаю историю — снимок пишется раз в день. График появится, когда наберётся минимум 2 дня.
        </div>
      </Box>
    );
  }

  const totals = data.map(e => e.total);
  const minV = Math.min(...totals), maxV = Math.max(...totals);
  const span = maxV - minV || 1;
  const innerW = Math.max(W - PAD * 2, 1);
  const x = i => PAD + (data.length > 1 ? (i / (data.length - 1)) * innerW : innerW / 2);
  const y = v => PAD + (1 - (v - minV) / span) * (H - PAD * 2);
  const linePts = data.map((e, i) => `${x(i)},${y(e.total)}`).join(" ");
  const areaPts = `${PAD},${H - PAD} ${linePts} ${PAD + innerW},${H - PAD}`;

  const first = data[0], last = data[data.length - 1];
  const change = last.total - first.total;
  const up = change >= 0;
  const stroke = up ? "#4ADE80" : "#FF6450";

  // Атрибуция: вклад каждой позиции в изменение тотала за период (last − first).
  const keys = new Set([...Object.keys(first.breakdown || {}), ...Object.keys(last.breakdown || {})]);
  const moves = [...keys].map(k => {
    const a = first.breakdown?.[k], b = last.breakdown?.[k];
    const name = b?.name || a?.name || k;
    return { name, delta: (b?.usd || 0) - (a?.usd || 0) };
  }).filter(m => Math.abs(m.delta) >= 1).sort((m1, m2) => m2.delta - m1.delta);
  const gainers = moves.filter(m => m.delta > 0).slice(0, 3);
  const losers = moves.filter(m => m.delta < 0).slice(-3).reverse();

  const hp = hover != null ? data[hover] : null;

  return (
    <Box>
      <Header />
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 24, fontWeight: 800, color: C.text, lineHeight: 1 }}>
          ${(hp ? hp.total : last.total).toLocaleString("en-US", { maximumFractionDigits: 0 })}
        </span>
        {hp
          ? <span style={{ fontSize: 12, color: C.muted }}>{hp.date}</span>
          : <span style={{ fontSize: 13, fontWeight: 700, color: stroke }}>
              {up ? "+" : "−"}${Math.abs(change).toLocaleString("en-US", { maximumFractionDigits: 0 })} за период
            </span>}
      </div>

      <div ref={wrapRef} style={{ position: "relative" }}>
        <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"
          style={{ display: "block", overflow: "visible" }}
          onMouseLeave={() => setHover(null)}
          onMouseMove={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            const px = (e.clientX - rect.left) / rect.width * W;
            let best = 0, bd = Infinity;
            data.forEach((_, i) => { const d = Math.abs(x(i) - px); if (d < bd) { bd = d; best = i; } });
            setHover(best);
          }}>
          <defs>
            <linearGradient id="pcFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
              <stop offset="100%" stopColor={stroke} stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points={areaPts} fill="url(#pcFill)" />
          <polyline points={linePts} fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          {hp && <line x1={x(hover)} y1={PAD} x2={x(hover)} y2={H - PAD} stroke={C.muted} strokeWidth="1" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />}
          {hp && <circle cx={x(hover)} cy={y(hp.total)} r="3.5" fill={stroke} vectorEffect="non-scaling-stroke" />}
        </svg>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        <span style={{ fontSize: 9, color: C.muted }}>{first.date}</span>
        <span style={{ fontSize: 9, color: C.muted }}>{last.date}</span>
      </div>

      {(gainers.length > 0 || losers.length > 0) && (
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 10, color: C.muted, letterSpacing: "0.12em", fontWeight: 600, marginBottom: 8 }}>ИЗ-ЗА ЧЕГО</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 6 }}>
            {[...gainers, ...losers].map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12 }}>
                <span style={{ color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</span>
                <b style={{ color: m.delta >= 0 ? "#4ADE80" : "#FF6450", flexShrink: 0 }}>
                  {m.delta >= 0 ? "+" : "−"}${Math.abs(m.delta).toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </b>
              </div>
            ))}
          </div>
        </div>
      )}
    </Box>
  );
}

function DefiDashboard({ positions, setPositions, hwChecked, setHwChecked }) {
  const { tab = "portfolio" } = useParams();
  const navigate = useNavigate();
  const [openWeek, setOpenWeek] = useState(() => {
    const first = DEFI_WEEKS.find(w => w.tasks.some((_, i) => !hwChecked[`${w.week}-${i}`]));
    return first ? first.week : DEFI_WEEKS[0].week;
  });
  const NOTES_DEFAULT = [
    { id: 1, tag: "risk",     date: "12.06.2026", text: "Правило: не входить в протокол если последний аудит >1 года назад или TVL <$50M" },
    { id: 2, tag: "risk",     date: "12.06.2026", text: "Ликвидация = Health Factor < 1.0. Без займов — HF = ∞, ликвидации нет" },
    { id: 3, tag: "apy",      date: "12.06.2026", text: "Бенчмарк: Bybit Savings USDC ~6-8%. DeFi должен давать >10% чтобы оправдать риск" },
    { id: 4, tag: "apy",      date: "12.06.2026", text: "APY Aave USDC Base норма: 6-15%. Выше 20% — повышенный спрос на займы, не постоянно" },
    { id: 5, tag: "protocol", date: "12.06.2026", text: "Aave v3: старейший lending, $20B+ TVL, аудиты каждые 6 мес. Самый безопасный для стейблов" },
    { id: 6, tag: "protocol", date: "12.06.2026", text: "Aerodrome: главный DEX на Base. APY = Trading Fees + AERO Emissions. Emissions нестабильны" },
    { id: 7, tag: "protocol", date: "12.06.2026", text: "Morpho: стоит поверх Aave, матчит кредиторов напрямую. APY обычно на 2-5% выше Aave" },
    { id: 8, tag: "risk",     date: "12.06.2026", text: "IL при падении ETH -50% ≈ 5.7% потерь. При APY 40% отбивается за ~2 недели работы LP" },
    { id: 9, tag: "idea",     date: "12.06.2026", text: "Следующий шаг после освоения базы: Pendle PT — фиксированная доходность без риска ставок" },
  ];
  const [notes, setNotes] = useState(() => ls("defi_notes", NOTES_DEFAULT));
  const [courseExpanded, setCourseExpanded] = useState(false);
  const [noteInput, setNoteInput] = useState("");
  const [noteTag, setNoteTag] = useState("general");

  const saveNote = () => {
    const text = noteInput.trim();
    if (!text) return;
    const next = [{ id: Date.now(), text, tag: noteTag, date: new Date().toLocaleDateString("ru-RU") }, ...notes];
    setNotes(next); lsSet("defi_notes", next);
    setNoteInput("");
  };
  const deleteNote = (id) => {
    const next = notes.filter(n => n.id !== id);
    setNotes(next); lsSet("defi_notes", next);
  };
  const [prices, setPrices] = useState(null);
  const [llama, setLlama] = useState({}); // { positionId: apy }

  useEffect(() => {
    // DeFiLlama pool IDs для наших позиций
    const LLAMA_POOLS = [
      { posId: 1, poolId: "7820bd3c-461a-4811-9f0b-1d39c1503c3f" }, // Morpho Steakhouse Prime USDC (Base)
      { posId: 2, poolId: "e8cb4dbb-9e66-4cfa-9c77-407118b128a0" }, // Aerodrome vAMM WETH-USDC (Base)
    ];
    Promise.all(LLAMA_POOLS.map(p =>
      fetch(`https://yields.llama.fi/chart/${p.poolId}`).then(r => r.json()).then(d => {
        const last = Array.isArray(d?.data) ? d.data[d.data.length - 1] : null;
        return [p.posId, last?.apy ?? null];
      }).catch(() => [p.posId, null])
    )).then(entries => {
      const result = {};
      entries.forEach(([id, apy]) => { if (apy != null) result[id] = parseFloat(apy.toFixed(2)); });
      setLlama(result);
    });
    // ETH + BTC price from CoinGecko (free, no key), refresh every 60s
    const fetchPrices = () =>
      fetch("https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin&vs_currencies=usd")
        .then(r => r.json()).then(d => setPrices({ eth: d.ethereum?.usd, btc: d.bitcoin?.usd })).catch(() => {});
    fetchPrices();
    const priceTimer = setInterval(fetchPrices, 60_000);
    return () => clearInterval(priceTimer);
  }, []);

  // Auto-sync Aave positions from blockchain via defi-portfolio worker
  // Maps worker token IDs to dashboard position IDs
  const CHAIN_POS_MAP = {
    "aave-base-usdc": 1, // Aave V3 Base USDC → position id=1
    "aave-eth-usdc":  4, // Aave V3 Ethereum USDC → position id=4 (if added)
    "aave-eth-paxg":  4, // Aave V3 Ethereum PAXG → position id=4
  };

  const [lighterLive, setLighterLive] = useState(null); // { usdValue, apy, principal, pools }

  useEffect(() => {
    // Полностью авто: тянем доли пользователя из его аккаунта Lighter, затем по каждому
    // public-пулу считаем долю в нём. Пересобрал пулы на бирже → дашборд подхватит сам.
    const LIGHTER_ACCOUNT = 729632; // sub-account кошелька 0x2d80…6aeC
    const API = "https://mainnet.zklighter.elliot.ai/api/v1";

    const load = async () => {
      try {
        const acc = await fetch(`${API}/account?by=index&value=${LIGHTER_ACCOUNT}`).then(r => r.json());
        const shares = acc.accounts?.[0]?.shares || [];
        if (!shares.length) { setLighterLive({ usdValue: 0, apy: null, principal: 0, pools: [] }); return; }
        const results = await Promise.allSettled(
          shares.map(s =>
            fetch(`${API}/publicPoolsMetadata?index=${s.public_pool_index + 1}&limit=1`)
              .then(r => r.json())
              .then(data => {
                const pool = data.public_pools?.[0];
                if (!pool) return null;
                const totalAsset = Number(pool.total_asset_value) || 0;
                const totalShares = Number(pool.total_shares) || 0;
                const userShares = Number(s.shares_amount) || 0;
                const equity = totalShares > 0 ? (userShares / totalShares) * totalAsset : 0;
                const apy = pool.annual_percentage_yield > 0 ? Math.round(pool.annual_percentage_yield * 100) / 100 : null;
                return { name: pool.name || `Pool ${s.public_pool_index}`, equity: Math.round(equity * 100) / 100, apy };
              })
          )
        );
        const pools = results.flatMap(r => r.status === "fulfilled" && r.value ? [r.value] : []);
        if (pools.length < shares.length) return; // частичные данные — оставить прежние
        const usdValue = Math.round(pools.reduce((s, p) => s + p.equity, 0) * 100) / 100;
        const principal = Math.round(shares.reduce((s, x) => s + (Number(x.principal_amount) || 0), 0) * 100) / 100;
        const active = pools.filter(p => p.apy != null && p.equity > 0);
        const w = active.reduce((s, p) => s + p.equity, 0);
        const apy = w > 0 ? Math.round(active.reduce((s, p) => s + p.apy * p.equity / w, 0) * 100) / 100 : null;
        setLighterLive({ usdValue, apy, principal, pools });
      } catch (_) {}
    };
    load();
    const t = setInterval(load, 5 * 60_000);
    return () => clearInterval(t);
  }, []);

  const [chainData, setChainData] = useState(null); // { positions, walletTokens, updated }

  useEffect(() => {
    const load = () =>
      fetch(DEFI_PORTFOLIO_URL)
        .then(r => r.json())
        .then(data => {
          // Keep last-known positions for any id missing in this response (transient worker/RPC hiccups
          // shouldn't blank out a position). Same for walletTokens.
          setChainData(prev => {
            if (!data?.positions) return prev || data;
            if (!prev?.positions) return data;
            const newIds = new Set(data.positions.map(p => p.id));
            const carried = prev.positions.filter(p => !newIds.has(p.id));
            const wt = (data.walletTokens?.length ? data.walletTokens : prev.walletTokens) || [];
            return { ...data, positions: [...data.positions, ...carried], walletTokens: wt };
          });
          // Auto-update position `current` values from blockchain balance
          if (data.positions?.length > 0) {
            data.positions.forEach(p => {
              const posId = CHAIN_POS_MAP[p.id];
              // У LP-позиций balance — это кол-во LP-токенов, а доллары в usdValue.
              // Пишем в current именно USD-стоимость, иначе тотал на главной схлопывается.
              const usd = p.usdValue ?? p.balance;
              if (posId && usd > 0) {
                updatePosition(posId, { current: usd, status: "active" });
              }
            });
          }
        })
        .catch(() => {});
    load();
    const t = setInterval(load, 5 * 60_000); // refresh every 5 min
    return () => clearInterval(t);
  }, []);

  const [time, setTime] = useState(new Date());
  const [bybit, setBybit] = useState(null);
  const [bybitLoading, setBybitLoading] = useState(false);
  const [bybitError, setBybitError] = useState(null);
  const [bybitHistory, setBybitHistory] = useState(() => ls("bybit_history", []));

  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);

  const fetchBybit = async () => {
    setBybitLoading(true); setBybitError(null);
    try {
      const res = await fetch(BYBIT_PROXY_URL);
      const data = await res.json();
      if (data.retCode === 0) {
        const account = data.result.list[0];
        // Bybit не оценивает некоторые токены (напр. GRAM = ex-Toncoin) — подставляем рыночную цену.
        const PRICE_FIX = { GRAM: "coingecko:the-open-network" };
        let extra = 0;
        await Promise.all(account.coin.map(async c => {
          const usd = parseFloat(c.usdValue) || 0;
          const bal = parseFloat(c.walletBalance) || 0;
          if (usd < 0.5 && bal > 0 && PRICE_FIX[c.coin]) {
            try {
              const pr = await fetch(`https://coins.llama.fi/prices/current/${PRICE_FIX[c.coin]}`).then(r => r.json());
              const p = pr?.coins?.[PRICE_FIX[c.coin]]?.price;
              if (p > 0) { const real = bal * p; extra += real - usd; c.usdValue = String(real); }
            } catch (_) {}
          }
        }));
        const coins = account.coin
          .filter(c => parseFloat(c.usdValue) >= 1)
          .sort((a, b) => parseFloat(b.usdValue) - parseFloat(a.usdValue));
        const equity = parseFloat(account.totalEquity) + extra;
        setBybit({ totalEquity: equity, coins });
        // Сохраняем снапшот (один в день)
        const today = new Date().toISOString().slice(0, 10);
        setBybitHistory(prev => {
          const filtered = prev.filter(e => e.date !== today);
          const next = [...filtered, { date: today, balance: equity }].slice(-60);
          lsSet("bybit_history", next);
          return next;
        });
      } else { setBybitError(data.retMsg); }
    } catch (e) { setBybitError(e.message); }
    setBybitLoading(false);
  };

  useEffect(() => { fetchBybit(); }, []);

  const toggleHw = (key) => {
    const [weekStr] = key.split("-");
    const weekNum = parseInt(weekStr);
    const next = { ...hwChecked, [key]: !hwChecked[key] };
    setHwChecked(next);
    // Если неделя стала полностью выполненной — авто-раскрыть следующую
    const week = DEFI_WEEKS.find(w => w.week === weekNum);
    if (week && week.tasks.every((_, i) => next[`${weekNum}-${i}`])) {
      const nextWeek = DEFI_WEEKS.find(w => w.week > weekNum);
      if (nextWeek) setTimeout(() => setOpenWeek(nextWeek.week), 300);
    }
  };

  const updatePosition = (id, updates) => setPositions(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));

  // Resolve live chain data for each position once — used for cards, totals, and distribution bar
  const livePosData = positions.map(p => {
    // Lighter: fetch directly from browser (bypasses WAF that blocks CF Workers)
    if (p.matchId === "lighter-public-pools" && lighterLive) {
      const subRows = (lighterLive.pools || []).map(pl => ({ label: pl.name, usd: pl.equity, apy: pl.apy }));
      return { ...p, invested: lighterLive.principal ?? p.invested, liveDollarValue: lighterLive.usdValue, liveApy: lighterLive.apy, liveRewards: null, subRows };
    }
    const chainPos = p.matchId
      ? chainData?.positions?.find(cp => p.matchId.endsWith("-") ? cp.id?.startsWith(p.matchId) : cp.id === p.matchId)
      : chainData?.positions?.find(cp =>
          cp.protocol?.toLowerCase().startsWith(p.protocol?.toLowerCase().split(" ")[0].toLowerCase()) &&
          (cp.chain?.toLowerCase() === p.network?.toLowerCase() || p.network === "Multi")
        );
    const liveDollarValue = chainPos
      ? (chainPos.usdValue ?? (chainPos.type !== "lp" ? chainPos.balance : null))
      : null;
    const liveApy = chainPos?.apy ?? llama[p.id] ?? null;
    const liveRewards = chainPos?.aeroEarned != null ? { aeroEarned: chainPos.aeroEarned, aeroEarnedUsd: chainPos.aeroEarnedUsd } : null;
    // Loopscale: break out each loan as a sub-row
    const subRows = chainPos?.loops
      ? chainPos.loops.map((l, i) => ({ label: l.label || `Заём ${i + 1}`, usd: l.usd ?? l.equity, apy: l.apy ?? null }))
      : null;
    return { ...p, liveDollarValue, liveApy, liveRewards, subRows };
  });

  // Portfolio totals from live on-chain data (fall back to pos.current for manual positions)
  // Claimable rewards (напр. AERO emissions) учитываются в стоимости позиции и в P&L.
  const rewardUsd = p => p.liveRewards?.aeroEarnedUsd ?? 0;
  const effectiveVal = p => p.liveDollarValue != null ? p.liveDollarValue + rewardUsd(p) : (p.type !== "debt" && p.type !== "airdrop" ? (p.current ?? 0) : 0);
  const liveTotal   = livePosData.reduce((s, p) => s + effectiveVal(p), 0);
  // Cost basis on the SAME net basis as liveTotal: debt nets out (borrowed sum reduces invested),
  // so the identity Портфель − Вложено = P&L always holds.
  const investedBasis = p => p.type === "debt"
    ? effectiveVal(p)                                        // debt: current (negative) → cancels in P&L
    : ((p.invested ?? 0) > 0 ? p.invested : effectiveVal(p)); // supply: cost basis (fallback to current)
  const liveInvested = livePosData.reduce((s, p) => s + investedBasis(p), 0);
  const livePnl      = liveTotal - liveInvested;
  const liveAvgApy  = (() => {
    const active = livePosData.filter(p => p.liveApy != null && effectiveVal(p) > 0 && p.type !== "debt");
    const w = active.reduce((s, p) => s + effectiveVal(p), 0);
    return w > 0 ? active.reduce((s, p) => s + p.liveApy * effectiveVal(p) / w, 0) : 0;
  })();

  // Rabby idle balance: untracked wallet tokens (not part of any DeFi position) — avoids double-count.
  const rabbyIdle = (chainData?.walletTokens || []).reduce((s, t) => s + (t.usdValue ?? 0), 0);

  // Group positions by protocol → one card per protocol, sorted by P&L (desc).
  const protocolGroups = (() => {
    const map = new Map();
    for (const p of livePosData) {
      if (!map.has(p.protocol)) map.set(p.protocol, []);
      map.get(p.protocol).push(p);
    }
    return [...map.entries()].map(([protocol, items]) => {
      const current  = items.reduce((s, p) => s + effectiveVal(p), 0);
      const invested = items.filter(p => p.type !== "debt" && (p.invested ?? 0) > 0).reduce((s, p) => s + p.invested, 0);
      let hasPnl = false;
      const pnl = items.reduce((s, p) => {
        if (!p.invested || p.type === "debt") return s;
        const v = p.liveDollarValue != null ? p.liveDollarValue + rewardUsd(p) : (p.type !== "airdrop" ? (p.current ?? 0) : null);
        if (v == null) return s;
        hasPnl = true;
        return s + (v - p.invested);
      }, 0);
      const status = items.some(i => i.status === "active") ? "active" : items[0].status;
      // Split P&L: growth = Σ qty·(priceNow − price0) of underlying tokens (HODL change);
      // yield = total P&L − growth (fees/interest/rewards, net of IL for LP).
      const px = chainData?.prices || {};
      let hasGrowth = false;
      const growth = items.reduce((s, p) => {
        if (!p.costBasis) return s;
        return s + p.costBasis.reduce((g, c) => {
          const now = px[c.t];
          if (!Number.isFinite(now) || !Number.isFinite(c.qty) || !Number.isFinite(c.p0)) return g;
          hasGrowth = true;
          return g + c.qty * (now - c.p0);
        }, 0);
      }, 0);
      const yield_ = pnl - growth;
      return { protocol, color: items[0].color, status, items, current, invested, pnl, hasPnl, growth, yield_, hasGrowth };
    }).sort((a, b) => (b.hasPnl ? b.pnl : -Infinity) - (a.hasPnl ? a.pnl : -Infinity));
  })();

  // Legacy aliases (used in a few spots below, keeps diff small)
  const totalCurrent  = liveTotal;
  const totalPnl      = livePnl;
  const defiTotal = DEFI_WEEKS.reduce((s, w) => s + w.tasks.length, 0);
  const hwDone = Object.values(hwChecked).filter(Boolean).length;

  // P&L snapshot history (one per day, based on live portfolio total)
  const [pnlHistory, setPnlHistory] = useState(() => ls("defi_pnl_history", []));
  useEffect(() => {
    if (liveTotal === 0) return;
    const today = new Date().toISOString().slice(0, 10);
    setPnlHistory(prev => {
      const filtered = prev.filter(e => e.date !== today);
      const next = [...filtered, { date: today, pnl: livePnl, current: liveTotal }].slice(-60);
      lsSet("defi_pnl_history", next);
      return next;
    });
  }, [liveTotal]);

  const pnl7d = (() => {
    if (pnlHistory.length < 2) return null;
    const cutoff = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    const old = [...pnlHistory].reverse().find(e => e.date <= cutoff);
    return old ? totalPnl - old.pnl : null;
  })();
  const pnl30d = (() => {
    if (pnlHistory.length < 2) return null;
    const cutoff = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const old = [...pnlHistory].reverse().find(e => e.date <= cutoff);
    return old ? totalPnl - old.pnl : null;
  })();

  return (
    <div style={{ paddingBottom: 40 }}>
      <div className="page-pad-sm" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.border}` }}>
        <div>
          <div className="display" style={{ fontSize: 17, fontWeight: 700, color: C.text }}>Crypto</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {prices && (
            <>
              <span style={{ fontSize: 12, color: C.muted }}>ETH <b style={{ color: C.text }}>${prices.eth?.toLocaleString()}</b></span>
              <span style={{ fontSize: 12, color: C.muted }}>BTC <b style={{ color: C.text }}>${prices.btc?.toLocaleString()}</b></span>
            </>
          )}
          <div style={{ fontFamily: "monospace", fontSize: 14, color: C.muted }}>{time.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</div>
        </div>
      </div>

      {(bybit || liveTotal > 0) && (
        <div className="page-pad-sm" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 10 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: 10, color: C.muted, letterSpacing: "0.14em", fontWeight: 600 }}>КРИПТО ИТОГО</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#FFD700", lineHeight: 1.1, marginTop: 4 }}>
              ${((bybit?.totalEquity ?? 0) + liveTotal + rabbyIdle).toFixed(0)}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
              {[
                bybit ? ["Bybit", bybit.totalEquity] : null,
                liveTotal > 0 ? ["DeFi", liveTotal] : null,
                rabbyIdle >= 1 ? ["Rabby", rabbyIdle] : null,
              ].filter(Boolean).map(([lbl, v]) => (
                <span key={lbl} style={{ fontSize: 11, color: C.muted, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: "3px 9px" }}>
                  {lbl} <b style={{ color: C.text }}>${v.toFixed(0)}</b>
                </span>
              ))}
            </div>
          </div>

          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: bybit ? "#00E5FF" : bybitLoading ? C.muted : "#FF6450" }} />
                <span style={{ fontSize: 10, color: C.muted, letterSpacing: "0.14em", fontWeight: 600 }}>BYBIT</span>
              </div>
              <button onClick={fetchBybit} style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 6, padding: "2px 8px", color: C.muted, fontSize: 11, cursor: "pointer" }}>↻</button>
            </div>
            {bybitLoading && <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>загружаю...</div>}
            {bybitError && <div style={{ fontSize: 12, color: "#FF6450", marginTop: 6 }}>Ошибка: {bybitError}</div>}
            {bybit && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
                  <span style={{ fontSize: 24, fontWeight: 800, color: "#00E5FF", lineHeight: 1.1 }}>${bybit.totalEquity.toFixed(2)}</span>
                  {bybitHistory.length >= 2 && (() => {
                    const vals = bybitHistory.map(h => h.balance);
                    const minV = Math.min(...vals), maxV = Math.max(...vals);
                    const W = 70, H = 22;
                    const pts = vals.map((v, i) => {
                      const x = (i / (vals.length - 1)) * W;
                      const y = H - ((v - minV) / (maxV - minV || 1)) * (H - 4) - 2;
                      return `${x},${y}`;
                    }).join(" ");
                    const delta = vals[vals.length-1] - vals[vals.length-2];
                    return (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <svg width={W} height={H} style={{ overflow: "visible" }}>
                          <polyline points={pts} fill="none" stroke="#00E5FF" strokeWidth="1.5" strokeLinejoin="round" opacity="0.7" />
                          <circle cx={parseFloat(pts.split(" ").pop().split(",")[0])} cy={parseFloat(pts.split(" ").pop().split(",")[1])} r="2.5" fill="#00E5FF" />
                        </svg>
                        <span style={{ fontSize: 11, color: delta >= 0 ? "#4ADE80" : "#FF6450" }}>
                          {delta >= 0 ? "+" : ""}{delta.toFixed(0)}$
                        </span>
                      </div>
                    );
                  })()}
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                  {bybit.coins.map(c => (
                    <span key={c.coin} style={{ fontSize: 11, color: C.muted, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: "3px 9px" }}>
                      <b style={{ color: "#00E5FF" }}>{c.coin}</b> ${parseFloat(c.usdValue).toFixed(0)}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <PortfolioChart liveTotal={(bybit?.totalEquity ?? 0) + liveTotal + rabbyIdle} />

      <div style={{ padding: "14px 28px 6px" }}>
        <span style={{ fontSize: 11, color: C.muted, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600 }}>DeFi</span>
      </div>

      <div className="page-pad-sm" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 10, borderBottom: `1px solid ${C.border}` }}>
        {[
          { label: "ПОРТФЕЛЬ", val: liveTotal > 0 ? `$${liveTotal.toFixed(0)}` : "—",                                                                          color: C.text },
          { label: "ВЛОЖЕНО",  val: liveInvested > 0 ? `$${liveInvested.toFixed(0)}` : "—",                                                                    color: C.text },
          { label: "P&L",      val: liveInvested > 0 ? `${livePnl >= 0 ? "+" : ""}$${Math.abs(livePnl) < 1 ? livePnl.toFixed(2) : livePnl.toFixed(0)}` : "—", color: liveInvested === 0 ? C.muted : livePnl >= 0 ? "#4ADE80" : "#FF6450" },
          { label: "7Д",       val: pnl7d != null ? `${pnl7d >= 0 ? "+" : ""}$${pnl7d.toFixed(0)}` : "—",                                                      color: pnl7d == null ? C.muted : pnl7d >= 0 ? "#4ADE80" : "#FF6450" },
          { label: "30Д",      val: pnl30d != null ? `${pnl30d >= 0 ? "+" : ""}$${pnl30d.toFixed(0)}` : "—",                                                   color: pnl30d == null ? C.muted : pnl30d >= 0 ? "#4ADE80" : "#FF6450" },
          { label: "СР. APY",  val: liveAvgApy > 0 ? `${liveAvgApy.toFixed(1)}%` : "—",                                                                        color: "#00E5FF" },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px" }}>
            <div style={{ fontSize: 10, color: C.muted, letterSpacing: "0.15em", marginBottom: 5 }}>{label}</div>
            <div style={{ fontSize: 17, fontWeight: 700, color }}>{val}</div>
          </div>
        ))}
      </div>

      <div className="page-pad" style={{ maxWidth: 900, margin: "0 auto" }}>
        <div>
            <DistributionChart groups={protocolGroups} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
              {protocolGroups.map(g => (
                <ProtocolCard key={g.protocol} group={g} />
              ))}
            </div>
            {chainData?.walletTokens?.length > 0 && (
              <div style={{ marginTop: 12, padding: "12px 16px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12 }}>
                <div style={{ fontSize: 9, color: C.muted, letterSpacing: "0.15em", marginBottom: 8 }}>В КОШЕЛЬКЕ (НЕ В РАБОТЕ)</div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {chainData.walletTokens.map(t => {
                    const displayAmt = t.usdValue != null
                      ? `$${t.usdValue.toFixed(2)}`
                      : `$${t.balance.toLocaleString()}`;
                    const subLabel = t.usdValue != null
                      ? `${t.balance.toFixed(4)} ${t.asset} · ${t.chain}`
                      : `${t.asset} · ${t.chain}`;
                    return (
                      <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 5, height: 5, borderRadius: "50%", background: t.color }} />
                        <span style={{ fontSize: 12, color: C.text, fontWeight: 600 }}>{displayAmt}</span>
                        <span style={{ fontSize: 11, color: C.muted }}>{subLabel}</span>
                      </div>
                    );
                  })}
                  <div style={{ fontSize: 10, color: C.muted, alignSelf: "center", marginLeft: "auto" }}>
                    обновлено {chainData.updated ? new Date(chainData.updated).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }) : "—"}
                  </div>
                </div>
              </div>
            )}
          </div>
      </div>
    </div>
  );
}

const WAY_CATS = [
  { id: "Крипто",       color: "#00E5FF" },
  { id: "Бизнес",       color: "#FFD700" },
  { id: "Инвестиции",   color: "#4ADE80" },
  { id: "Инфраструктура", color: "#7C5CFC" },
  { id: "Задача",       color: "#9090B0" },
];

// Список задач к цели $1M — встроен в Networth
function TaskManager({ data, setData }) {
  const [newTask, setNewTask] = useState("");
  const [newCat,  setNewCat]  = useState("Задача");
  const [catFilter, setCatFilter] = useState("all");
  const [sortByImpact, setSortByImpact] = useState(false);
  const tasks = data.tasks || [];
  const done = tasks.filter(t => t.done).length;

  const toggleTask = (id) => setData(d => ({ ...d, tasks: d.tasks.map(t => t.id === id ? { ...t, done: !t.done } : t) }));
  const deleteTask = (id) => setData(d => ({ ...d, tasks: d.tasks.filter(t => t.id !== id) }));
  const addTask = () => {
    if (!newTask.trim()) return;
    setData(d => ({ ...d, tasks: [...(d.tasks || []), { id: `w${Date.now()}`, text: newTask, done: false, priority: "medium", category: newCat }] }));
    setNewTask("");
  };
  const moveTask = (id, dir) => setData(d => {
    const idx = d.tasks.findIndex(t => t.id === id);
    if (idx < 0) return d;
    const next = [...d.tasks];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return d;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    return { ...d, tasks: next };
  });

  const totalImpact = tasks.filter(t => !t.done && t.impact > 0).reduce((s, t) => s + t.impact, 0);

  return (
    <div style={{ marginTop: 28 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <div className="display" style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Задачи к цели</div>
        {totalImpact > 0 && <div style={{ fontSize: 12, color: C.muted }}>потенциал: <b style={{ color: "#4ADE80" }}>+${totalImpact.toLocaleString()}/мес</b></div>}
      </div>

      {/* Add task */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <input value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => e.key === "Enter" && addTask()} placeholder="Добавить задачу..." style={{ flex: 1, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", color: C.text, fontSize: 14, outline: "none" }} />
          <select value={newCat} onChange={e => setNewCat(e.target.value)} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px", color: C.text, fontSize: 12, outline: "none", cursor: "pointer" }}>
            {WAY_CATS.map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
          </select>
          <button onClick={addTask} style={{ background: "#FFD70022", border: "1px solid #FFD700", borderRadius: 10, padding: "10px 18px", color: "#FFD700", cursor: "pointer", fontSize: 14, fontWeight: 700 }}>+</button>
        </div>
        {/* Category filter */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button onClick={() => setCatFilter("all")} style={{ padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: catFilter === "all" ? 700 : 400, background: catFilter === "all" ? "#FFD70022" : "transparent", border: `1px solid ${catFilter === "all" ? "#FFD700" : C.border}`, color: catFilter === "all" ? "#FFD700" : C.muted, cursor: "pointer" }}>Все ({tasks.length})</button>
          <button onClick={() => setSortByImpact(s => !s)} style={{ padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: sortByImpact ? 700 : 400, background: sortByImpact ? "rgba(118,255,3,0.12)" : "transparent", border: `1px solid ${sortByImpact ? "#4ADE80" : C.border}`, color: sortByImpact ? "#4ADE80" : C.muted, cursor: "pointer" }}>$ По эффекту</button>
          {WAY_CATS.map(c => {
            const count = tasks.filter(t => t.category === c.id).length;
            if (!count) return null;
            return (
              <button key={c.id} onClick={() => setCatFilter(catFilter === c.id ? "all" : c.id)} style={{ padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: catFilter === c.id ? 700 : 400, background: catFilter === c.id ? `${c.color}22` : "transparent", border: `1px solid ${catFilter === c.id ? c.color : C.border}`, color: catFilter === c.id ? c.color : C.muted, cursor: "pointer" }}>
                {c.id} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Task list */}
      <div style={{ fontSize: 11, color: C.muted, letterSpacing: "0.08em", marginBottom: 10 }}>{done}/{tasks.length} выполнено</div>
      {tasks.length === 0 && (
        <div style={{ textAlign: "center", padding: 32, color: C.muted, fontSize: 14 }}>Задач пока нет. Добавь первую цель выше.</div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {tasks.filter(t => catFilter === "all" || t.category === catFilter)
          .slice().sort((a, b) => sortByImpact ? (b.impact || 0) - (a.impact || 0) : 0)
          .map(task => {
          const cat = WAY_CATS.find(c => c.id === task.category);
          const catColor = cat?.color || "#9090B0";
          const now = new Date().toISOString().slice(0,10);
          const overdue = !task.done && task.deadline && task.deadline < now;
          const soon = !task.done && task.deadline && task.deadline >= now && task.deadline <= new Date(Date.now()+3*86400000).toISOString().slice(0,10);
          return (
            <div key={task.id} style={{ background: task.done ? "rgba(255,215,0,0.03)" : C.card, border: `1px solid ${overdue ? "#FF645040" : task.done ? "#FFD70018" : C.border}`, borderRadius: 10, padding: "11px 14px", opacity: task.done ? 0.6 : 1, display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={() => toggleTask(task.id)} style={{ width: 18, height: 18, borderRadius: 5, flexShrink: 0, border: `2px solid ${task.done ? "#FFD700" : "#333"}`, background: task.done ? "#FFD700" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {task.done && <span style={{ color: "#000", fontSize: 11, fontWeight: 900 }}>✓</span>}
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 14, color: task.done ? C.muted : C.text, textDecoration: task.done ? "line-through" : "none" }}>{task.text}</span>
                {(task.deadline || task.impact > 0) && (
                  <div style={{ fontSize: 11, color: overdue ? "#FF6450" : soon ? "#FFD700" : C.muted, marginTop: 2, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {task.deadline && <span>{overdue ? "⚠ Просрочено · " : soon ? "⏰ Скоро · " : "📅 "}{task.deadline}</span>}
                    {task.impact > 0 && <span style={{ color: "#4ADE80" }}>+${task.impact.toLocaleString()}/мес</span>}
                  </div>
                )}
              </div>
              <input type="number" placeholder="$" value={task.impact ?? ""} title="Эффект $/мес"
                onChange={e => setData(d => ({ ...d, tasks: d.tasks.map(t => t.id === task.id ? { ...t, impact: e.target.value ? parseFloat(e.target.value) : undefined } : t) }))}
                style={{ width: 52, background: "transparent", border: `1px solid ${C.border}`, borderRadius: 6, color: task.impact > 0 ? "#4ADE80" : C.muted, fontSize: 10, padding: "3px 5px", outline: "none", flexShrink: 0 }} />
              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: `${catColor}18`, color: catColor, border: `1px solid ${catColor}33`, flexShrink: 0 }}>{task.category}</span>
              <input type="date" value={task.deadline || ""} onChange={e => setData(d => ({ ...d, tasks: d.tasks.map(t => t.id === task.id ? { ...t, deadline: e.target.value || undefined } : t) }))}
                style={{ background: "transparent", border: "none", color: C.muted, fontSize: 11, cursor: "pointer", outline: "none", flexShrink: 0, width: 20, opacity: 0.5 }} title="Дедлайн" />
              <div style={{ display: "flex", flexDirection: "column", gap: 1, flexShrink: 0 }}>
                <button onClick={() => moveTask(task.id, -1)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 11, padding: "0 3px", lineHeight: 1, opacity: 0.4 }}>▲</button>
                <button onClick={() => moveTask(task.id, 1)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 11, padding: "0 3px", lineHeight: 1, opacity: 0.4 }}>▼</button>
              </div>
              <button onClick={() => deleteTask(task.id)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 14, padding: "0 2px", lineHeight: 1, opacity: 0.5, flexShrink: 0 }} title="Удалить">×</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function useAccent() {
  const loc = useLocation();
  if (loc.pathname.startsWith("/defi"))    return "#00E5FF";
  if (loc.pathname.startsWith("/way"))     return "#FFD700";
  if (loc.pathname.startsWith("/networth"))return "#4ADE80";
  if (loc.pathname.startsWith("/setup"))   return "#6C63FF";
  return "#00E5FF";
}

function RadarDashboard({ embedded = false }) {
  const TAG_COLORS = { x: "#1DA1F2", media: "#7C5CFC", data: "#4ADE80" };
  const TAG_LABELS = { x: "𝕏 Twitter", media: "Медиа", data: "Данные" };
  const IMPACT_C   = { high: "#FF6450", medium: "#FFD700", low: "#4ADE80" };
  const RISK_C     = { high: "#FF6450", medium: "#FFD700", low: "#4ADE80" };

  const [news,        setNews]        = useState([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsUpdated, setNewsUpdated] = useState(null);
  const [newsFilter,  setNewsFilter]  = useState("all");
  const [brief,       setBrief]       = useState(null);
  const [briefLoading,setBriefLoading]= useState(false);

  const fetchNews = async () => {
    setNewsLoading(true);
    try {
      const res  = await fetch(`${NEWS_URL}/news`);
      const data = await res.json();
      setNews(data.items || []);
      setNewsUpdated(data.updatedAt || null);
    } catch {}
    setNewsLoading(false);
  };

  const fetchBrief = async (refresh = false) => {
    setBriefLoading(true);
    try {
      const res  = await fetch(`${NEWS_URL}/brief${refresh ? "?refresh=1" : ""}`);
      const data = await res.json();
      setBrief(data);
    } catch {}
    setBriefLoading(false);
  };

  useEffect(() => { fetchNews(); fetchBrief(); }, []);

  const filtered  = newsFilter === "all" ? news : news.filter(i => i.tag === newsFilter);
  const timeSince = (d) => {
    if (!d) return "";
    const h = Math.floor((Date.now() - new Date(d).getTime()) / 3600000);
    const days = Math.floor(h / 24);
    if (days > 0) return `${days}д назад`;
    if (h > 0)    return `${h}ч назад`;
    return "только что";
  };

  return (
    <div style={{ paddingBottom: embedded ? 0 : 40 }}>
      {!embedded && (
        <div className="page-pad-sm" style={{ display: "flex", alignItems: "center", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Радар</div>
        </div>
      )}

      <div style={{ padding: embedded ? "0" : "20px 28px", maxWidth: 900, margin: "0 auto" }}>

        {/* ── AI БРИФ ── */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, boxShadow: CARD_SHADOW, padding: 24, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.text, letterSpacing: "0.04em" }}>AI Стратегический бриф</span>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {brief?.generatedAt && <span style={{ fontSize: 11, color: C.muted }}>{new Date(brief.generatedAt).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>}
              <button onClick={() => fetchBrief(true)} disabled={briefLoading}
                style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 6, color: briefLoading ? C.muted : C.text, fontSize: 11, padding: "5px 14px", cursor: briefLoading ? "wait" : "pointer" }}>
                {briefLoading ? "анализирую..." : "↻ обновить"}
              </button>
            </div>
          </div>

          {briefLoading && !brief && (
            <div style={{ textAlign: "center", padding: "32px 0", color: C.muted, fontSize: 14 }}>
              Собираю данные APY + новости...
            </div>
          )}

          {brief && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Summary */}
              {brief.summary && (
                <div style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", lineHeight: 1.7, paddingBottom: 20, borderBottom: `1px solid ${C.border}` }}>
                  {brief.summary}
                </div>
              )}

              {/* Urgent */}
              {brief.urgent?.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>⚠ Срочно</div>
                  {brief.urgent.map((item, i) => (
                    <div key={i} style={{ display: "flex", gap: 12, marginBottom: 8, padding: "12px 16px", background: "rgba(255,100,80,0.06)", border: "1px solid rgba(255,100,80,0.2)", borderRadius: 8 }}>
                      <div style={{ width: 3, background: "#FF6450", borderRadius: 2, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 4 }}>{item.action}</div>
                        <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.6 }}>{item.reason}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* This week */}
              {brief.thisWeek?.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>На этой неделе</div>
                  {brief.thisWeek.map((item, i) => (
                    <div key={i} style={{ display: "flex", gap: 12, marginBottom: 8, padding: "12px 16px", background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, borderRadius: 8 }}>
                      <div style={{ width: 3, background: "#00E5FF", borderRadius: 2, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 4 }}>{item.action}</div>
                        <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.6 }}>{item.reason}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Hold + Opportunities side by side */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {brief.hold?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>Держать</div>
                    {brief.hold.map((item, i) => (
                      <div key={i} style={{ padding: "10px 14px", background: "rgba(255,255,255,0.02)", border: `1px solid ${C.border}`, borderRadius: 8, marginBottom: 8 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 4 }}>{item.position}</div>
                        <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>{item.reason}</div>
                      </div>
                    ))}
                  </div>
                )}
                {brief.opportunities?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>Возможности</div>
                    {brief.opportunities.map((item, i) => {
                      const riskColor = item.risk === "low" ? "#4ADE80" : item.risk === "medium" ? "#FFD700" : "#FF6450";
                      const riskLabel = item.risk === "low" ? "Conservative" : item.risk === "medium" ? "Moderate" : "Aggressive";
                      return (
                        <div key={i} style={{ padding: "10px 14px", background: "rgba(255,255,255,0.02)", border: `1px solid ${C.border}`, borderRadius: 8, marginBottom: 8, borderLeft: `3px solid ${riskColor}` }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{item.protocol}</span>
                            {item.chain && <span style={{ fontSize: 11, color: C.muted }}>{item.chain}</span>}
                            {item.apy && <span style={{ fontSize: 14, fontWeight: 700, color: riskColor }}>{item.apy}</span>}
                            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: riskColor + "18", color: riskColor, border: `1px solid ${riskColor}44`, fontWeight: 600 }}>{riskLabel}</span>
                            {item.tvl && <span style={{ fontSize: 11, color: C.muted }}>TVL {item.tvl}</span>}
                          </div>
                          <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>{item.reason}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Лента новостей ── */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, boxShadow: CARD_SHADOW, padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", gap: 6 }}>
              {["all", "x", "media", "data"].map(f => (
                <button key={f} onClick={() => setNewsFilter(f)}
                  style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, cursor: "pointer", fontWeight: 600, background: newsFilter === f ? (TAG_COLORS[f] || "#00E5FF") + "22" : "transparent", border: `1px solid ${newsFilter === f ? (TAG_COLORS[f] || "#00E5FF") : C.border}`, color: newsFilter === f ? (TAG_COLORS[f] || "#00E5FF") : C.muted }}>
                  {f === "all" ? "Все" : TAG_LABELS[f]}
                </button>
              ))}
            </div>
            <button onClick={fetchNews} disabled={newsLoading}
              style={{ background: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.2)", borderRadius: 6, color: newsLoading ? C.muted : "#00E5FF", fontSize: 11, padding: "4px 10px", cursor: newsLoading ? "wait" : "pointer" }}>
              {newsLoading ? "↻ загрузка..." : "↻ обновить"}
            </button>
          </div>
          {newsLoading && filtered.length === 0 && <div style={{ textAlign: "center", padding: "32px 0", color: C.muted, fontSize: 11 }}>загружаю ленту...</div>}
          {!newsLoading && filtered.length === 0 && <div style={{ textAlign: "center", padding: "32px 0", color: C.muted, fontSize: 11 }}>нет новостей</div>}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {filtered.map((item, i) => (
              <a key={i} href={item.link} target="_blank" rel="noopener noreferrer"
                style={{ display: "flex", gap: 12, padding: "11px 0", borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : "none", textDecoration: "none" }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.72"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              >
                <div style={{ width: 3, borderRadius: 2, background: TAG_COLORS[item.tag] || "#00E5FF", flexShrink: 0, alignSelf: "stretch", minHeight: 16 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.text, lineHeight: 1.4, marginBottom: 3 }}>{item.title}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: TAG_COLORS[item.tag] || "#00E5FF" }}>{item.source}</span>
                    {item.date && <span style={{ fontSize: 10, color: C.muted }}>{timeSince(item.date)}</span>}
                    {item.description && <span style={{ fontSize: 11, color: C.muted, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", maxWidth: 320 }}>{item.description}</span>}
                  </div>
                </div>
                <span style={{ fontSize: 11, color: C.muted, flexShrink: 0, marginTop: 2 }}>↗</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── NETWORTH DASHBOARD ───────────────────────────────────────────────────────
function NetWorthDashboard({ nwData, setNwData, wayData, setWayData }) {
  const [showForm, setShowForm] = useState(false);

  // Auto-detect current month and pre-fill form with last month's values
  const currentMonth = new Date().toISOString().slice(0, 7); // "2026-06"
  const latestMonth  = [...nwData].sort((a, b) => a.month.localeCompare(b.month)).at(-1);
  const missingCurrent = latestMonth && latestMonth.month < currentMonth;
  const prefillFromLatest = (lat) => lat ? {
    month: currentMonth,
    rate:    String(lat.rate),
    kv:      String(lat.assets?.kv      || ""),
    avto:    String(lat.assets?.avto    || ""),
    sklad:   String(lat.assets?.sklad   || ""),
    crypto:  String(lat.assets?.crypto  || ""),
    ipoteka: String(lat.liabilities?.ipoteka || ""),
    credit:  String(lat.liabilities?.credit  || ""),
  } : { month: currentMonth, rate: "", kv: "", avto: "", sklad: "", crypto: "", ipoteka: "", credit: "" };

  const [form, setForm] = useState(() => prefillFromLatest(latestMonth));

  const months = [...nwData].sort((a, b) => a.month.localeCompare(b.month));
  const latest = months[months.length - 1];
  const prev   = months[months.length - 2];
  const nwDelta    = latest && prev ? latest.nwUsd - prev.nwUsd : 0;
  const nwDeltaPct = prev && prev.nwUsd ? ((nwDelta / prev.nwUsd) * 100).toFixed(1) : 0;

  const MONTHS_RU = ["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];
  const fmtMonth = (m) => { const [, mo] = m.split("-"); return `${MONTHS_RU[parseInt(mo)-1]}`; };
  const fmtMonthFull = (m) => { const [y, mo] = m.split("-"); return `${MONTHS_RU[parseInt(mo)-1]} ${y}`; };
  const fmtRub = (n) => `₽${(n/1000000).toFixed(2)}M`;
  const fmtUsd = (n) => `$${Math.round(n/1000)}K`;

  const addMonth = () => {
    const r = parseFloat(form.rate) || 1;
    const cryptoRub = parseFloat(form.crypto || 0) * r;
    const totalAssets = parseFloat(form.kv||0) + parseFloat(form.avto||0) + parseFloat(form.sklad||0) + cryptoRub;
    const totalLiab   = parseFloat(form.ipoteka||0) + parseFloat(form.credit||0);
    const nwRub = Math.round(totalAssets - totalLiab);
    const nwUsd = Math.round(nwRub / r);
    const entry = {
      month: form.month, rate: r, nwRub, nwUsd,
      assets:      { kv: parseFloat(form.kv||0), avto: parseFloat(form.avto||0), sklad: parseFloat(form.sklad||0), crypto: parseFloat(form.crypto||0) },
      liabilities: { ipoteka: parseFloat(form.ipoteka||0), credit: parseFloat(form.credit||0) },
    };
    setNwData([...nwData.filter(d => d.month !== form.month), entry]);
    setShowForm(false);
    // Pre-fill next month with values just saved
    const [y, m] = form.month.split("-").map(Number);
    const nextM = m === 12 ? `${y+1}-01` : `${y}-${String(m+1).padStart(2,"0")}`;
    setForm({ ...form, month: nextM });
  };

  // SVG chart + trend projection
  const W = 600, H = 80;
  const vals = months.map(d => d.nwUsd);

  // Linear regression for trend line
  const avgMonthlyGrowth = months.length >= 2
    ? vals.slice(1).reduce((s, v, i) => s + (v - vals[i]), 0) / (vals.length - 1)
    : 0;

  // Project 6 months ahead
  const PROJ_MONTHS = 6;
  const projVals = Array.from({ length: PROJ_MONTHS }, (_, i) => vals[vals.length - 1] + avgMonthlyGrowth * (i + 1));
  const allVals = [...vals, ...projVals];
  const minV = Math.min(...allVals), maxV = Math.max(...allVals);
  const range = maxV - minV || 1;
  const totalPoints = vals.length + PROJ_MONTHS;

  const pts = vals.map((v, i) => {
    const x = (i / (totalPoints - 1)) * W;
    const y = H - ((v - minV) / range) * (H - 20) - 10;
    return [x, y];
  });
  const projPts = projVals.map((v, i) => {
    const x = ((vals.length + i) / (totalPoints - 1)) * W;
    const y = H - ((v - minV) / range) * (H - 20) - 10;
    return [x, y];
  });
  const polyline = pts.map(p => p.join(",")).join(" ");
  const projPolyline = [pts[pts.length - 1], ...projPts].map(p => p.join(",")).join(" ");
  const area = `${pts[0]?.[0]??0},${H} ${polyline} ${pts[pts.length-1]?.[0]??W},${H}`;

  // Forecast: months to $1M
  const monthsTo1M = avgMonthlyGrowth > 0 ? Math.ceil((1000000 - (latest?.nwUsd || 0)) / avgMonthlyGrowth) : null;
  const forecastDate = monthsTo1M ? (() => { const d = new Date(); d.setMonth(d.getMonth() + monthsTo1M); return d.toLocaleDateString("ru-RU", { month: "long", year: "numeric" }); })() : null;

  const inputStyle = { width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: "7px 10px", color: C.text, fontSize: 12, fontFamily: "inherit", boxSizing: "border-box" };
  const NW_COLOR = "#4ADE80";

  return (
    <div style={{ padding: "24px 20px", maxWidth: 900, margin: "0 auto" }}>
      {/* Missing month banner */}
      {missingCurrent && !showForm && (
        <div style={{ background: "rgba(118,255,3,0.06)", border: "1px solid rgba(118,255,3,0.25)", borderRadius: 10, padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <span style={{ fontSize: 14, color: "#4ADE80" }}>📅 Данные за {(() => { const [y,m] = currentMonth.split("-"); return `${["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"][parseInt(m)-1]} ${y}`; })()} ещё не внесены</span>
          <button onClick={() => setShowForm(true)} style={{ background: "rgba(118,255,3,0.15)", border: "1px solid rgba(118,255,3,0.4)", borderRadius: 6, color: "#4ADE80", fontSize: 12, padding: "6px 14px", cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" }}>
            Заполнить →
          </button>
        </div>
      )}
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: C.muted, letterSpacing: "0.1em", marginBottom: 6 }}>NETWORTH</div>
          <div className="display" style={{ fontSize: 34, fontWeight: 700, color: NW_COLOR, lineHeight: 1.15 }}>{latest ? fmtUsd(latest.nwUsd) : "—"}</div>
          <div style={{ fontSize: 15, color: C.muted, marginTop: 4 }}>{latest ? fmtRub(latest.nwRub) : "—"}</div>
          {nwDelta !== 0 && prev && (
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: nwDelta > 0 ? NW_COLOR : "#FF6450" }}>
                {nwDelta > 0 ? "+" : ""}{fmtUsd(nwDelta)}
              </span>
              <span style={{ fontSize: 12, color: nwDelta > 0 ? NW_COLOR : "#FF6450" }}>({nwDeltaPct}%)</span>
              <span style={{ fontSize: 11, color: C.muted }}>vs {fmtMonthFull(prev.month)}</span>
            </div>
          )}
          {/* Разбивка дельты: крипта / ₽-активы / курс */}
          {prev && latest && (() => {
            const cryptoD = (latest.assets.crypto || 0) - (prev.assets.crypto || 0); // уже в $
            const rubNet = (m) => (m.assets.kv + m.assets.avto + m.assets.sklad) - (m.liabilities.ipoteka + m.liabilities.credit);
            const rubAssetsD = (rubNet(latest) - rubNet(prev)) / latest.rate; // изменение ₽-части в $
            const rateD = rubNet(prev) / latest.rate - rubNet(prev) / prev.rate; // эффект курса
            const fmtD = (n) => `${n >= 0 ? "+" : "−"}$${Math.abs(Math.round(n/100)/10).toFixed(1)}K`;
            const col = (n) => Math.abs(n) < 100 ? C.muted : n > 0 ? NW_COLOR : "#FF6450";
            return (
              <div style={{ marginTop: 6, fontSize: 11, color: C.muted, display: "flex", gap: 12, flexWrap: "wrap" }}>
                <span>крипта <b style={{ color: col(cryptoD) }}>{fmtD(cryptoD)}</b></span>
                <span>₽-активы <b style={{ color: col(rubAssetsD) }}>{fmtD(rubAssetsD)}</b></span>
                <span>курс <b style={{ color: col(rateD) }}>{fmtD(rateD)}</b></span>
              </div>
            );
          })()}
          {/* Цель $1M */}
          {latest && (() => {
            const left = 1_000_000 - latest.nwUsd;
            if (left <= 0) return <div style={{ marginTop: 10, fontSize: 13, color: "#FFD700", fontWeight: 600 }}>🎉 Миллион достигнут!</div>;
            return (
              <div style={{ marginTop: 10, fontSize: 12, color: C.muted }}>
                🎯 До <b style={{ color: "#FFD700" }}>$1M</b> осталось <b style={{ color: C.text }}>${Math.round(left/1000)}K</b>
                {forecastDate && <> · прогноз <b style={{ color: "#FFD700" }}>{forecastDate}</b></>}
              </div>
            );
          })()}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {latest && (
            <button onClick={() => {
              const lines = months.map(m => `${m.month}\t$${Math.round(m.nwUsd/1000)}K\t₽${(m.nwRub/1_000_000).toFixed(2)}M`);
              const text = `Networth summary\n\n${lines.join("\n")}\n\nПоследнее: ${fmtUsd(latest.nwUsd)} · ${fmtRub(latest.nwRub)}`;
              navigator.clipboard.writeText(text).then(() => toast("Сводка скопирована")).catch(() => {});
            }} style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, borderRadius: 8, color: C.muted, fontSize: 12, padding: "8px 14px", cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" }}>
              Копировать
            </button>
          )}
          <button onClick={() => setShowForm(s => !s)}
            style={{ background: `rgba(118,255,3,0.1)`, border: `1px solid rgba(118,255,3,0.3)`, borderRadius: 8, color: NW_COLOR, fontSize: 12, padding: "8px 18px", cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" }}>
            + Добавить месяц
          </button>
        </div>
      </div>

      {/* Add month form */}
      {showForm && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, boxShadow: CARD_SHADOW, padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 16 }}>Новый месяц</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
            {[
              { key: "month",   label: "Месяц (ГГГГ-ММ)", ph: "2026-06" },
              { key: "rate",    label: "Курс $/₽",         ph: "80" },
              { key: "kv",      label: "Квартира ₽",       ph: "18000000" },
              { key: "avto",    label: "Авто ₽",           ph: "5000000" },
              { key: "sklad",   label: "Доля Склад ₽",     ph: "15000000" },
              { key: "crypto",  label: "Крипта $",         ph: "7000" },
              { key: "ipoteka", label: "Ипотека ₽",        ph: "11338000" },
              { key: "credit",  label: "Кредиты ₽",        ph: "100000" },
            ].map(f => (
              <div key={f.key}>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>{f.label}</div>
                <input value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.ph} style={inputStyle} />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button onClick={addMonth}
              style={{ background: "rgba(118,255,3,0.15)", border: "1px solid rgba(118,255,3,0.4)", borderRadius: 8, color: NW_COLOR, fontSize: 12, padding: "8px 22px", cursor: "pointer", fontWeight: 600 }}>
              Сохранить
            </button>
            <button onClick={() => setShowForm(false)}
              style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 8, color: C.muted, fontSize: 12, padding: "8px 18px", cursor: "pointer" }}>
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Chart */}
      {months.length >= 2 && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, boxShadow: CARD_SHADOW, padding: "20px 20px 12px", marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: C.muted, letterSpacing: "0.1em", marginBottom: 12 }}>ДИНАМИКА NETWORTH ($)</div>
          <svg viewBox={`-20 0 ${W + 40} ${H + 28}`} style={{ width: "100%", overflow: "visible" }}>
            <defs>
              <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={NW_COLOR} stopOpacity="0.25" />
                <stop offset="100%" stopColor={NW_COLOR} stopOpacity="0" />
              </linearGradient>
            </defs>
            <polygon points={area} fill="url(#nwGrad)" />
            <polyline points={polyline} fill="none" stroke={NW_COLOR} strokeWidth="2" strokeLinejoin="round" />
            {avgMonthlyGrowth > 0 && (
              <polyline points={projPolyline} fill="none" stroke={NW_COLOR} strokeWidth="1.5" strokeDasharray="5,4" strokeLinejoin="round" opacity="0.4" />
            )}
            {pts.map(([x, y], i) => (
              <g key={i}>
                {i === pts.length - 1 && (
                  <>
                    <circle cx={x} cy={y} r={8} fill={NW_COLOR} opacity="0.15">
                      <animate attributeName="r" values="6;12;6" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.2;0;0.2" dur="2s" repeatCount="indefinite" />
                    </circle>
                  </>
                )}
                <circle cx={x} cy={y} r={i === pts.length - 1 ? 5 : 4} fill={NW_COLOR} />
                <text x={x} y={y - 10} textAnchor="middle" fill={NW_COLOR} fontSize="10" fontWeight="600">
                  {fmtUsd(months[i].nwUsd)}
                </text>
                <text x={x} y={H + 20} textAnchor="middle" fill="#9090B0" fontSize="9">
                  {fmtMonth(months[i].month)}
                </text>
              </g>
            ))}
            {avgMonthlyGrowth > 0 && projPts.length > 0 && (
              <text x={projPts[projPts.length-1][0]} y={projPts[projPts.length-1][1] - 8} textAnchor="middle" fill={NW_COLOR} fontSize="9" opacity="0.5">
                {fmtUsd(projVals[projVals.length-1])}
              </text>
            )}
          </svg>
          {forecastDate && avgMonthlyGrowth > 0 && (
            <div style={{ marginTop: 8, fontSize: 11, color: C.muted, textAlign: "right" }}>
              При темпе <span style={{ color: NW_COLOR }}>+${Math.round(avgMonthlyGrowth/1000)}K/мес</span> → $1M в <span style={{ color: NW_COLOR }}>{forecastDate}</span>
            </div>
          )}
        </div>
      )}

      {/* Assets + Liabilities */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* Assets */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, boxShadow: CARD_SHADOW, padding: 20 }}>
          <div style={{ fontSize: 11, color: C.muted, letterSpacing: "0.1em", marginBottom: 16 }}>АКТИВЫ</div>
          {latest && (() => {
            const rows = [
              { label: "Квартира",     val: latest.assets.kv,                          color: "#00E5FF" },
              { label: "Авто",         val: latest.assets.avto,                         color: "#FFD700" },
              { label: "Доля Склад",   val: latest.assets.sklad,                        color: "#7C5CFC" },
              { label: `Крипта ($${latest.assets.crypto.toLocaleString()})`, val: latest.assets.crypto * latest.rate, color: NW_COLOR },
            ];
            const total = rows.reduce((s, r) => s + r.val, 0);
            return (
              <>
                {rows.map(r => (
                  <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: r.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 14, color: C.muted }}>{r.label}</span>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{fmtRub(r.val)}</span>
                  </div>
                ))}
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10, marginTop: 4, display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, color: C.muted }}>Итого активы</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: NW_COLOR }}>{fmtRub(total)}</span>
                </div>
              </>
            );
          })()}
        </div>

        {/* Liabilities */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, boxShadow: CARD_SHADOW, padding: 20 }}>
          <div style={{ fontSize: 11, color: C.muted, letterSpacing: "0.1em", marginBottom: 16 }}>ОБЯЗАТЕЛЬСТВА</div>
          {latest && (() => {
            const rows = [
              { label: "Ипотека", val: latest.liabilities.ipoteka, color: "#FF6450" },
              { label: "Кредиты", val: latest.liabilities.credit,  color: "#FF9800" },
            ];
            const totalLiab   = rows.reduce((s, r) => s + r.val, 0);
            const totalAssets = latest.assets.kv + latest.assets.avto + latest.assets.sklad + latest.assets.crypto * latest.rate;
            return (
              <>
                {rows.map(r => (
                  <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: r.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 14, color: C.muted }}>{r.label}</span>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#FF6450" }}>−{fmtRub(r.val)}</span>
                  </div>
                ))}
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10, marginTop: 4, display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, color: C.muted }}>Обязательства</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#FF6450" }}>−{fmtRub(totalLiab)}</span>
                </div>
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10, marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 14, color: C.text, fontWeight: 600 }}>Networth</span>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: NW_COLOR }}>{fmtRub(latest.nwRub)}</div>
                    <div style={{ fontSize: 12, color: NW_COLOR, opacity: 0.7 }}>{fmtUsd(latest.nwUsd)}</div>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* History table */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, boxShadow: CARD_SHADOW, padding: 20 }}>
        <div style={{ fontSize: 11, color: C.muted, letterSpacing: "0.1em", marginBottom: 16 }}>ИСТОРИЯ</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr>
                {[
                  { h: "Месяц",      hide: false },
                  { h: "Курс",       hide: true  },
                  { h: "Активы ₽",   hide: true  },
                  { h: "Обяз. ₽",    hide: true  },
                  { h: "NW ₽",       hide: true  },
                  { h: "NW $",       hide: false },
                  { h: "Δ $",        hide: false },
                ].map(({ h, hide }) => (
                  <th key={h} className={hide ? "nw-hide-mobile" : ""} style={{ textAlign: "right", padding: "4px 10px", color: C.muted, fontWeight: 600, fontSize: 11, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...months].reverse().map((m, i, arr) => {
                const prevRow = arr[i + 1];
                const delta = prevRow ? m.nwUsd - prevRow.nwUsd : null;
                const ta = m.assets.kv + m.assets.avto + m.assets.sklad + m.assets.crypto * m.rate;
                const tl = m.liabilities.ipoteka + m.liabilities.credit;
                return (
                  <tr key={m.month} style={{ borderTop: `1px solid ${C.border}` }}>
                    <td style={{ padding: "9px 10px", color: C.text,    textAlign: "right", whiteSpace: "nowrap" }}>{fmtMonthFull(m.month)}</td>
                    <td className="nw-hide-mobile" style={{ padding: "9px 10px", color: C.muted,   textAlign: "right" }}>{m.rate}</td>
                    <td className="nw-hide-mobile" style={{ padding: "9px 10px", color: C.text,    textAlign: "right", whiteSpace: "nowrap" }}>{fmtRub(ta)}</td>
                    <td className="nw-hide-mobile" style={{ padding: "9px 10px", color: "#FF6450", textAlign: "right", whiteSpace: "nowrap" }}>−{fmtRub(tl)}</td>
                    <td className="nw-hide-mobile" style={{ padding: "9px 10px", color: NW_COLOR,  textAlign: "right", fontWeight: 600, whiteSpace: "nowrap" }}>{fmtRub(m.nwRub)}</td>
                    <td style={{ padding: "9px 10px", color: NW_COLOR,  textAlign: "right", fontWeight: 600, whiteSpace: "nowrap" }}>{fmtUsd(m.nwUsd)}</td>
                    <td style={{ padding: "9px 10px", textAlign: "right", whiteSpace: "nowrap",
                      color: delta == null ? C.muted : delta > 0 ? NW_COLOR : "#FF6450" }}>
                      {delta == null ? "—" : `${delta > 0 ? "+" : ""}${fmtUsd(delta)}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Задачи к цели $1M */}
        <TaskManager data={wayData} setData={setWayData} />
      </div>
    </div>
  );
}

const SETUP = {
  projects: [
    { name: "flow", desc: "Групповая дисциплина · спринты", stack: "TS core + React + Supabase", deploy: "Cloudflare Pages", color: "#4ADE80", live: "flowsprints.pages.dev" },
    { name: "master-dashboard", desc: "Этот дашборд · 1M$ · DeFi", stack: "React + Vite + Workers", deploy: "Cloudflare Pages", color: "#00E5FF", live: null },
    { name: "tg-bot", desc: "AI-ассистент в Telegram", stack: "Python · Vertex · DeepSeek", deploy: "Google Cloud Run", color: "#7C5CFC", live: "@dimitriyakclaude_bot" },
  ],
  models: [
    { name: "Gemini 2.5 Flash", via: "Vertex AI", tag: "по умолчанию", ok: true },
    { name: "Gemini 2.5 Pro", via: "Vertex AI", tag: "vertex-pro", ok: true },
    { name: "DeepSeek V3", via: "API", tag: "deepseek", ok: true },
  ],
  skills: [
    { cmd: "/secrets-scan", desc: "поиск утёкших ключей в файлах и git-истории" },
    { cmd: "/deploy-check", desc: "деплой + самопроверка по логам, починка если упало" },
  ],
  layers: [
    { icon: "📄", name: "CLAUDE.md", desc: "глобальный + по проекту — грузится каждую сессию" },
    { icon: "🧠", name: "Память", desc: "5 фактов: проекты, правила, безопасность" },
    { icon: "⚡", name: "Скиллы", desc: "2 своих процедуры" },
    { icon: "🪝", name: "Хук", desc: "SessionStart — сводка проектов на старте" },
  ],
  security: [
    "GitHub → OAuth/Keychain",
    "Cloudflare → OAuth",
    "DeepSeek, Gemini, Telegram → ротированы",
    "Grok, dboard2026 → убраны/ротированы",
    "Секреты вычищены из файлов и remote",
  ],
};

function SetupCard({ title, accent, children }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, boxShadow: CARD_SHADOW, padding: 18 }}>
      <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, color: accent, marginBottom: 14 }}>{title}</div>
      {children}
    </div>
  );
}

const SETUP_STATUS_URL = "https://setup-status.dimitriyak.workers.dev";
const SETUP_SERVICES = [
  { name: "tg-bot (Cloud Run)", url: "https://tg-bot-247961408308.europe-west3.run.app/" },
  { name: "flow (сайт)", url: "https://flowsprints.pages.dev/" },
  { name: "ai-proxy", url: "https://ai-proxy.dimitriyak.workers.dev" },
  { name: "defi-news", url: "https://defi-news.dimitriyak.workers.dev" },
  { name: "data-sync", url: "https://data-sync.dimitriyak.workers.dev" },
];
const SETUP_LINKS = [
  { label: "Бот", href: "https://t.me/dimitriyakclaude_bot", color: "#7C5CFC" },
  { label: "flow", href: "https://github.com/dimitriyak/flow", color: "#4ADE80" },
  { label: "dashboard", href: "https://github.com/dimitriyak/master-dashboard", color: "#00E5FF" },
  { label: "tg-bot", href: "https://github.com/dimitriyak/tg-bot", color: "#FFD700" },
];

function Dot({ ok }) {
  const color = ok === null ? C.muted : ok ? "#4ADE80" : "#FF6450";
  return <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0, boxShadow: ok ? `0 0 6px ${color}` : "none" }} />;
}

// ── Платные ресурсы ────────────────────────────────────────────────────────────
const fmtTok = n => n >= 1_000_000 ? `${(n/1_000_000).toFixed(2)}M` : n >= 1000 ? `${(n/1000).toFixed(1)}K` : `${n ?? 0}`;

// Живой usage AI-токенов: Claude Code (подписка) + TG-бот (Gemini/DeepSeek).
function UsageStrip() {
  const [aiStats, setAiStats] = useState(null);
  const [claude, setClaude] = useState(null);
  useEffect(() => {
    const load = () => {
      fetch(`${AI_STATS_URL}/stats`).then(r => r.json()).then(setAiStats).catch(() => {});
      fetch(`${SYNC_URL}/sync/claude_usage`, { headers: { Authorization: `Bearer ${SYNC_TOKEN}` } })
        .then(r => r.json()).then(d => setClaude(d.value)).catch(() => {});
    };
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, []);

  const days7 = Array.from({ length: 7 }, (_, i) => new Date(Date.now() - (6 - i) * 86400000).toISOString().slice(0, 10));
  const byDay = claude?.byDay || {};
  const claudeChart = days7.map(d => ({ date: d, tokens: (byDay[d]?.input || 0) + (byDay[d]?.output || 0) }));
  const claudeToday = claudeChart.at(-1)?.tokens || 0;
  const claudeWeek = claudeChart.reduce((s, d) => s + d.tokens, 0);

  const Spark = ({ data, color }) => {
    const W = 150, H = 30, max = Math.max(...data.map(d => d.tokens), 1);
    const pts = data.map((d, i) => `${data.length > 1 ? (i / (data.length - 1)) * W : W / 2},${H - (d.tokens / max) * (H - 4) - 2}`).join(" ");
    return (
      <svg width={W} height={H} style={{ overflow: "visible", display: "block", width: "100%", maxWidth: W }} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" opacity="0.85" />
        {data.map((d, i) => d.tokens > 0 ? <circle key={i} cx={data.length > 1 ? (i / (data.length - 1)) * W : W / 2} cy={H - (d.tokens / max) * (H - 4) - 2} r="2.5" fill={color} /> : null)}
      </svg>
    );
  };

  const Tile = ({ accent, label, sub, today, week, total, chart, est }) => (
    <div style={{ flex: "1 1 240px", background: "rgba(255,255,255,0.02)", border: `1px solid ${C.border}`, borderRadius: 12, padding: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: accent, boxShadow: `0 0 6px ${accent}` }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: accent, letterSpacing: "0.05em" }}>{label}</span>
        <span style={{ fontSize: 10, color: C.muted, marginLeft: "auto" }}>{sub}</span>
      </div>
      <div style={{ display: "flex", gap: 16, alignItems: "baseline", marginBottom: 10 }}>
        <div><div style={{ fontSize: 22, fontWeight: 700, color: accent }}>{fmtTok(today)}</div><div style={{ fontSize: 10, color: C.muted }}>сегодня</div></div>
        <div><div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{fmtTok(week)}</div><div style={{ fontSize: 10, color: C.muted }}>7 дней</div></div>
        <div><div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{fmtTok(total)}</div><div style={{ fontSize: 10, color: C.muted }}>всего {est}</div></div>
      </div>
      {chart && <Spark data={chart} color={accent} />}
    </div>
  );

  if (!claude && !aiStats) return null;
  // грубая оценка $ для метрящихся токенов бота (Gemini Flash ~$0.25/1M)
  const botCost = aiStats?.total ? aiStats.total * 0.00000025 : 0;
  return (
    <SetupCard title="AI токены · live" accent="#D97706">
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        {claude && <Tile accent="#D97706" label="CLAUDE CODE" sub="подписка"
          today={claudeToday} week={claudeWeek} total={claude.total} chart={claudeChart}
          est={<span style={{ color: "#4ADE80" }}>· в подписке</span>} />}
        {aiStats && <Tile accent="#7C5CFC" label="TG БОТ" sub={aiStats.activeModel}
          today={aiStats.today} week={aiStats.week7} total={aiStats.total}
          chart={(aiStats.chart || []).map(d => ({ date: d.date, tokens: d.tokens }))}
          est={botCost > 0 ? <span style={{ color: C.muted }}>≈${botCost.toFixed(2)}</span> : null} />}
      </div>
      <div style={{ fontSize: 11, color: C.muted, marginTop: 10 }}>обновляется каждую минуту · токены Claude покрыты подпиской (flat), бот — оценка по Gemini Flash</div>
    </SetupCard>
  );
}

// Срок до даты: дни и цвет (красный <7, жёлтый <30, иначе серо-зелёный).
function renewInfo(dateStr) {
  if (!dateStr) return null;
  const target = new Date(dateStr + "T00:00:00");
  if (isNaN(target)) return null;
  const days = Math.ceil((target - new Date(new Date().toISOString().slice(0, 10) + "T00:00:00")) / 86400000);
  const color = days < 0 ? "#FF6450" : days <= 7 ? "#FF6450" : days <= 30 ? "#FFD700" : "#4ADE80";
  const dd = target.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  const label = days < 0 ? `просрочено ${dd}` : days === 0 ? `сегодня ${dd}` : `${dd} · ${days} дн`;
  return { color, label, days };
}

// Стоимость всех платных ресурсов/мес + сроки продления/сгорания и оплаченный объём (% использовано).
// Суммы/даты/лимиты редактируются и синхронизируются (ключ resources_cost).
function ResourcesCard() {
  const [cfg, setCfg] = useState(RESOURCES_DEFAULT);
  const [edit, setEdit] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [live, setLive] = useState({}); // { claude: tokensTotal, vertex: tokensTotal }

  useEffect(() => {
    cloudGet("resources_cost").then(v => {
      if (v?.items) {
        // мерж: новые ресурсы из дефолта добавляем, сохранённые поля берём из облака
        const saved = new Map(v.items.map(i => [i.id, i]));
        setCfg({ rub: v.rub ?? RESOURCES_DEFAULT.rub, items: RESOURCES_DEFAULT.items.map(d => ({ ...d, ...(saved.get(d.id) || {}) })) });
      }
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  // живой usage токенов: Claude (подписка) и бот через Vertex
  useEffect(() => {
    const load = () => {
      fetch(`${SYNC_URL}/sync/claude_usage`, { headers: { Authorization: `Bearer ${SYNC_TOKEN}` } })
        .then(r => r.json()).then(d => setLive(p => ({ ...p, claude: d.value?.total }))).catch(() => {});
      fetch(`${AI_STATS_URL}/stats`).then(r => r.json()).then(d => setLive(p => ({ ...p, vertex: d.total }))).catch(() => {});
    };
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, []);

  const save = (next) => { setCfg(next); cloudSet("resources_cost", { rub: next.rub, items: next.items.map(({ id, usd, renews, limit, unit, used }) => ({ id, usd, renews, limit, unit, used })) }); };
  const setField = (id, patch) => save({ ...cfg, items: cfg.items.map(i => i.id === id ? { ...i, ...patch } : i) });
  const setRub = (rub) => save({ ...cfg, rub });

  const totalUsd = cfg.items.reduce((s, i) => s + (Number(i.usd) || 0), 0);
  const groups = [...new Set(cfg.items.map(i => i.group))];
  const liveDot = { claude: "#D97706", deepseek: "#25BCFE" };

  // использовано для %: живой usage где есть, иначе ручное поле used
  const usedOf = (it) => {
    const liveVal = it.unit === "tok" ? live[it.id] : undefined;
    return Number(liveVal != null ? liveVal : it.used) || 0;
  };

  return (
    <SetupCard title="Платные ресурсы · стоимость, сроки, лимиты" accent="#FFD700">
      {/* Итог */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 4 }}>
        <span style={{ fontSize: 28, fontWeight: 800, color: "#FFD700" }}>${totalUsd.toFixed(0)}</span>
        <span style={{ fontSize: 14, color: C.muted }}>≈ ₽{Math.round(totalUsd * (Number(cfg.rub) || 0)).toLocaleString("ru-RU")} / мес</span>
        <button onClick={() => setEdit(e => !e)} style={{ marginLeft: "auto", background: edit ? "rgba(118,255,3,0.1)" : "transparent", border: `1px solid ${edit ? "#4ADE80" : C.border}`, borderRadius: 8, color: edit ? "#4ADE80" : C.muted, fontSize: 12, fontWeight: 600, padding: "5px 12px", cursor: "pointer" }}>
          {edit ? "✓ Готово" : "✎ Править"}
        </button>
      </div>
      <div style={{ fontSize: 11, color: C.muted, marginBottom: 16 }}>
        точный биллинг GCP/Cloudflare недоступен из браузера — суммы/даты/лимиты вводятся вручную · токены Claude и бота (Vertex) подтягиваются живьём{edit && <> · курс ₽/$ <input type="number" value={cfg.rub} onChange={e => setRub(parseFloat(e.target.value) || 0)} style={{ width: 48, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontSize: 11, padding: "2px 6px", marginLeft: 4 }} /></>}
      </div>

      {groups.map(g => {
        const items = cfg.items.filter(i => i.group === g);
        const sub = items.reduce((s, i) => s + (Number(i.usd) || 0), 0);
        return (
          <div key={g} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 10, color: C.muted, letterSpacing: "0.12em", textTransform: "uppercase" }}>{g}</span>
              <span style={{ fontSize: 11, color: C.muted }}>${sub.toFixed(0)}/мес</span>
            </div>
            {items.map(it => {
              const ren = renewInfo(it.renews);
              const lim = Number(it.limit) || 0;
              const used = usedOf(it);
              const isTok = it.unit === "tok";
              const pct = lim > 0 ? Math.min(100, Math.round((used / lim) * 100)) : null;
              const pctColor = pct == null ? C.muted : pct >= 90 ? "#FF6450" : pct >= 70 ? "#FFD700" : "#4ADE80";
              const liveUsed = isTok && live[it.id] != null;
              return (
                <div key={it.id} title={it.note || ""} style={{ padding: "8px 0", borderTop: `1px solid ${C.border}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: it.color, flexShrink: 0 }} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 13, color: C.text, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                        {it.name}
                        {it.live && <span title="есть живые данные usage" style={{ width: 5, height: 5, borderRadius: "50%", background: liveDot[it.live] || "#4ADE80", boxShadow: `0 0 5px ${liveDot[it.live] || "#4ADE80"}` }} />}
                      </div>
                      <div style={{ fontSize: 10, color: C.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.plan}</div>
                    </div>
                    {!edit && ren && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: ren.color, background: ren.color + "1A", border: `1px solid ${ren.color}44`, borderRadius: 100, padding: "2px 8px", flexShrink: 0 }}>{ren.label}</span>
                    )}
                    {edit ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
                        <span style={{ fontSize: 12, color: C.muted }}>$</span>
                        <input type="number" value={it.usd} onChange={e => setField(it.id, { usd: parseFloat(e.target.value) || 0 })}
                          style={{ width: 56, background: C.surface, border: `1px solid ${it.color}55`, borderRadius: 6, color: C.text, fontSize: 13, padding: "3px 6px", textAlign: "right" }} />
                      </div>
                    ) : (
                      <span style={{ fontSize: 14, fontWeight: 700, color: (Number(it.usd) || 0) > 0 ? C.text : C.muted, flexShrink: 0 }}>
                        {(Number(it.usd) || 0) > 0 ? `$${it.usd}` : "—"}
                      </span>
                    )}
                  </div>

                  {/* Прогресс-бар оплаченного объёма */}
                  {!edit && pct != null && (
                    <div style={{ marginTop: 6, marginLeft: 18 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.muted, marginBottom: 3 }}>
                        <span>{isTok ? `${fmtTok(used)} / ${fmtTok(lim)} ток` : `$${used} / $${lim}`}{liveUsed && <span style={{ color: "#4ADE80" }}> · live</span>}</span>
                        <span style={{ color: pctColor, fontWeight: 700 }}>{pct}%</span>
                      </div>
                      <div style={{ height: 5, borderRadius: 3, background: C.border, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: pctColor }} />
                      </div>
                    </div>
                  )}

                  {/* Поля редактирования: дата + лимит + (used если нет live) */}
                  {edit && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6, marginLeft: 18, alignItems: "center" }}>
                      <label style={{ fontSize: 10, color: C.muted, display: "flex", alignItems: "center", gap: 4 }}>
                        срок
                        <input type="date" value={it.renews || ""} onChange={e => setField(it.id, { renews: e.target.value })}
                          style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontSize: 11, padding: "2px 6px" }} />
                      </label>
                      <label style={{ fontSize: 10, color: C.muted, display: "flex", alignItems: "center", gap: 4 }}>
                        объём
                        <input type="number" value={it.limit || 0} onChange={e => setField(it.id, { limit: parseFloat(e.target.value) || 0 })}
                          style={{ width: 80, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontSize: 11, padding: "2px 6px", textAlign: "right" }} />
                        <select value={it.unit || "$"} onChange={e => setField(it.id, { unit: e.target.value })}
                          style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontSize: 11, padding: "2px 4px" }}>
                          <option value="$">$</option>
                          <option value="tok">ток</option>
                        </select>
                      </label>
                      {!liveUsed && (
                        <label style={{ fontSize: 10, color: C.muted, display: "flex", alignItems: "center", gap: 4 }}>
                          исп.
                          <input type="number" value={it.used || 0} onChange={e => setField(it.id, { used: parseFloat(e.target.value) || 0 })}
                            style={{ width: 80, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontSize: 11, padding: "2px 6px", textAlign: "right" }} />
                        </label>
                      )}
                      {liveUsed && <span style={{ fontSize: 10, color: "#4ADE80" }}>исп. — live {fmtTok(used)}</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </SetupCard>
  );
}

function SetupDashboard() {
  const [status, setStatus] = useState(null);
  const [svc, setSvc] = useState(() => Object.fromEntries(SETUP_SERVICES.map(s => [s.name, null])));
  const [svcMs, setSvcMs] = useState({});

  useEffect(() => {
    const refresh = () => {
      fetch(SETUP_STATUS_URL).then(r => r.json()).then(setStatus).catch(() => setStatus({ error: true }));
      SETUP_SERVICES.forEach(s => {
        const t0 = Date.now();
        fetch(s.url, { mode: "no-cors" })
          .then(() => { setSvc(p => ({ ...p, [s.name]: true })); setSvcMs(p => ({ ...p, [s.name]: Date.now() - t0 })); })
          .catch(() => setSvc(p => ({ ...p, [s.name]: false })));
      });
    };
    refresh();
    const id = setInterval(refresh, 30000);
    return () => clearInterval(id);
  }, []);

  const dsLow = status?.deepseek?.balance && parseFloat(status.deepseek.balance) < 1;

  const exportData = () => {
    const data = {};
    Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
      try { data[key] = JSON.parse(localStorage.getItem(storageKey)); } catch {}
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dashboard-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ maxWidth: 920, margin: "0 auto", padding: "24px 20px 60px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <span style={{ fontSize: 22 }}>🤖</span>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>Claude Code · Setup</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
        <div style={{ fontSize: 14, color: C.muted }}>Как устроена моя работа с AI по всем проектам</div>
      </div>

      <div className="setup-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14, marginBottom: 14 }}>
        <SetupCard title="Живой статус" accent="#4ADE80">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Dot ok={status ? status?.bot?.ok : null} />
            <span style={{ fontSize: 14, color: C.text, flex: 1 }}>Telegram-бот</span>
            <span style={{ fontSize: 12, color: C.muted }}>{status?.bot?.name ? `@${status.bot.name}` : "…"}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Dot ok={status ? status?.deepseek?.ok : null} />
            <span style={{ fontSize: 14, color: C.text, flex: 1 }}>DeepSeek баланс {dsLow && <span title="Низкий баланс — пополни">⚠️</span>}</span>
            <span style={{ fontSize: 12, color: dsLow ? "#FF6450" : "#4ADE80", fontWeight: 600 }}>{status?.deepseek?.balance || "…"}</span>
          </div>
          {SETUP_SERVICES.map(s => (
            <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Dot ok={svc[s.name]} />
              <span style={{ fontSize: 14, color: C.text, flex: 1 }}>{s.name}</span>
              {svcMs[s.name] != null && <span style={{ fontSize: 11, color: svcMs[s.name] < 500 ? "#4ADE80" : svcMs[s.name] < 1500 ? "#FFD700" : "#FF6450" }}>{svcMs[s.name]}ms</span>}
              <span style={{ fontSize: 11, color: C.muted }}>worker</span>
            </div>
          ))}
          <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
            {status?.updatedAt ? `обновлено ${new Date(status.updatedAt).toLocaleTimeString("ru")}` : "загрузка…"}
          </div>
        </SetupCard>

        <UsageStrip />
        <ResourcesCard />
        <ChangelogCard />
      </div>
    </div>
  );
}

function ChangelogCard() {
  const [commits, setCommits] = useState(null);
  useEffect(() => {
    const since = new Date(Date.now() - 7 * 86400000).toISOString();
    fetch(`https://api.github.com/repos/dimitriyak/master-dashboard/commits?since=${since}&per_page=20`, {
      headers: { Accept: "application/vnd.github+json" }
    }).then(r => r.json()).then(data => {
      if (Array.isArray(data)) setCommits(data.map(c => ({
        sha: c.sha?.slice(0, 7),
        msg: c.commit?.message?.split("\n")[0],
        date: new Date(c.commit?.author?.date).toLocaleDateString("ru-RU", { day: "numeric", month: "short" }),
      })));
      else setCommits([]);
    }).catch(() => setCommits([]));
  }, []);
  const SkeletonRow = () => (
    <div style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
      <div style={{ width: 40, height: 10, borderRadius: 3, background: C.border, animation: "pulse 1.2s ease-in-out infinite", flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ height: 10, borderRadius: 3, background: C.border, animation: "pulse 1.2s ease-in-out infinite", marginBottom: 4 }} />
        <div style={{ height: 8, width: "40%", borderRadius: 3, background: C.border, animation: "pulse 1.2s ease-in-out infinite" }} />
      </div>
    </div>
  );
  return (
    <SetupCard title="Changelog · 7 дней" accent="#FF9800">
      {commits === null ? (
        [0,1,2,3].map(i => <SkeletonRow key={i} />)
      ) : commits.length === 0 ? (
        <div style={{ fontSize: 12, color: C.muted }}>Нет коммитов за 7 дней</div>
      ) : commits.map(c => (
        <div key={c.sha} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
          <span style={{ fontSize: 10, color: "#FF9800", fontFamily: "monospace", marginTop: 2, flexShrink: 0 }}>{c.sha}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: C.text, lineHeight: 1.4 }}>{c.msg}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{c.date}</div>
          </div>
        </div>
      ))}
    </SetupCard>
  );
}

const AI_PROJECTS = [
  { repo: "dimitriyak/flow",             label: "flow",             color: "#4ADE80", desc: "Спринты · групповая дисциплина" },
  { repo: "dimitriyak/master-dashboard", label: "master-dashboard", color: "#00E5FF", desc: "Личный дашборд" },
  { repo: "dimitriyak/tg-bot",           label: "tg-bot",           color: "#7C5CFC", desc: "Telegram AI-ассистент" },
];

const GH_CACHE_TTL = 15 * 60 * 1000; // 15 min
async function fetchGhProject(repo) {
  const cacheKey = `gh_cache_${repo.replace("/", "_")}`;
  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey));
    if (cached && Date.now() - cached.ts < GH_CACHE_TTL) return cached.data;
  } catch {}
  const since = new Date(Date.now() - 7 * 86400000).toISOString();
  const [repoRes, commitsRes] = await Promise.all([
    fetch(`https://api.github.com/repos/${repo}`, { headers: { Accept: "application/vnd.github+json" } }),
    fetch(`https://api.github.com/repos/${repo}/commits?since=${since}&per_page=100`, { headers: { Accept: "application/vnd.github+json" } }),
  ]);
  const repoData    = repoRes.ok    ? await repoRes.json()    : null;
  const commitsData = commitsRes.ok ? await commitsRes.json() : [];
  const data = {
    commits7d:   Array.isArray(commitsData) ? commitsData.length : 0,
    openIssues:  repoData?.open_issues_count ?? null,
    lastPush:    repoData?.pushed_at ?? null,
    description: repoData?.description ?? null,
  };
  try { localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data })); } catch {}
  return data;
}

const navItems = [
  { to: "/defi",      label: "Crypto",    color: "#00E5FF" },
  { to: "/networth",  label: "Networth",  color: "#4ADE80" },
  { to: "/setup",     label: "Setup",     color: "#6C63FF" },
];

const SHORTCUTS_HELP = [
  { key: "g h", desc: "Главная" },
  { key: "g d", desc: "Crypto" },
  { key: "g n", desc: "Networth" },
];

function Shell({ children, accent, syncStatus }) {
  const navigate = useNavigate();
  const [showHelp, setShowHelp] = useState(false);
  useEffect(() => {
    const down = (e) => { if (e.key === "?" && e.target.tagName !== "INPUT" && e.target.tagName !== "TEXTAREA") setShowHelp(p => !p); if (e.key === "Escape") setShowHelp(false); };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, []);
  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'DM Mono', 'Courier New', monospace", overflowX: "hidden" }}>
      <div style={{ position: "sticky", top: 0, zIndex: 100, background: C.surface, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", padding: "0 20px", height: 52, gap: 10 }}>
        <button onClick={() => navigate("/")} style={{ width: 30, height: 30, borderRadius: 8, background: "#0D1117", border: "1px solid rgba(0,229,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: "#00E5FF", cursor: "pointer", flexShrink: 0, fontFamily: "system-ui, sans-serif" }}>d</button>
        <div className="nav-scroll" style={{ gap: 2 }}>
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} end={item.to !== "/defi"} style={({ isActive }) => {
              const loc = window.location.pathname;
              const active = isActive || (item.to === "/defi" && loc.startsWith("/defi"));
              return {
                display: "flex", alignItems: "center", padding: "6px 14px", borderRadius: 8,
                background: active ? `${item.color}14` : "transparent",
                color: active ? item.color : "#9090B0",
                fontSize: 14, fontWeight: active ? 600 : 400,
                textDecoration: "none", transition: "all 0.15s", whiteSpace: "nowrap",
              };
            }}>
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>
      <div className="fade-in">{children}</div>
    </div>
  );
}

// Debounced cloud savers (created once outside component)
const saveWishes   = debounce((v) => cloudSet(STORAGE_KEYS.wishes,   v), 2000);
const saveDefi     = debounce((v) => cloudSet(STORAGE_KEYS.defi,     v), 2000);
const saveHw       = debounce((v) => cloudSet(STORAGE_KEYS.hw,       v), 2000);
const saveWay      = debounce((v) => cloudSet(STORAGE_KEYS.way,      v), 2000);
const saveNw       = debounce((v) => cloudSet(STORAGE_KEYS.networth, v), 2000);

// Sync saved positions to DEFI_INITIAL: keep user edits for ids that still exist,
// append newly-added positions, and drop positions removed from DEFI_INITIAL.
function mergeDefiPositions(saved) {
  if (!Array.isArray(saved)) return DEFI_INITIAL;
  const byId = new Map(DEFI_INITIAL.map(p => [p.id, p]));
  // Positions whose cost basis is fixed (not user-editable) — always trust DEFI_INITIAL.
  const LOCKED_INVESTED = new Set(["hl-"]);
  const kept = saved.filter(p => byId.has(p.id)).map(p => {
    const def = byId.get(p.id);
    return def?.matchId && LOCKED_INVESTED.has(def.matchId) ? { ...p, invested: def.invested } : p;
  });
  const keptIds = new Set(kept.map(p => p.id));
  const missing = DEFI_INITIAL.filter(p => !keptIds.has(p.id));
  return [...kept, ...missing];
}

function AppInner() {
  const [wishState,     setWishStateRaw]     = useState(() => ls(STORAGE_KEYS.wishes,   {}));
  const [defiPositions, setDefiPositionsRaw] = useState(() => mergeDefiPositions(ls(STORAGE_KEYS.defi, null)));
  const [hwChecked,     setHwCheckedRaw]     = useState(() => ls(STORAGE_KEYS.hw,      {}));
  const [wayData,       setWayDataRaw]       = useState(() => ls(STORAGE_KEYS.way,     WAY_INITIAL));
  const [nwData,        setNwDataRaw]        = useState(() => ls(STORAGE_KEYS.networth, NW_INITIAL));
  const [syncStatus,    setSyncStatus]       = useState("idle"); // idle | loading | synced | error

  // Wrapped setters: save to localStorage + debounce cloud sync
  const setWishState     = (v) => { const next = typeof v === "function" ? v(wishState)     : v; lsSet(STORAGE_KEYS.wishes,   next); setWishStateRaw(next);     saveWishes(next); };
  const setDefiPositions = (v) => { const next = typeof v === "function" ? v(defiPositions) : v; lsSet(STORAGE_KEYS.defi,     next); setDefiPositionsRaw(next); saveDefi(next); };
  const setHwChecked     = (v) => { const next = typeof v === "function" ? v(hwChecked)     : v; lsSet(STORAGE_KEYS.hw,       next); setHwCheckedRaw(next);     saveHw(next); };
  const setWayData       = (v) => { const next = typeof v === "function" ? v(wayData)       : v; lsSet(STORAGE_KEYS.way,      next); setWayDataRaw(next);       saveWay(next); };
  const setNwData        = (v) => { const next = typeof v === "function" ? v(nwData)        : v; lsSet(STORAGE_KEYS.networth, next); setNwDataRaw(next);        saveNw(next); };

  // Merge saved wayData with new tasks from WAY_INITIAL (add tasks that don't exist yet)
  const mergeWayTasks = (saved) => {
    if (!saved) return WAY_INITIAL;
    const existingIds = new Set((saved.tasks || []).map(t => t.id));
    const newTasks = WAY_INITIAL.tasks.filter(t => !existingIds.has(t.id));
    const amount = saved.currentAmount || 0;
    return {
      ...WAY_INITIAL,
      ...saved,
      tasks: [...(saved.tasks || []), ...newTasks],
      // Recalculate milestones based on actual amount
      milestones: (saved.milestones || WAY_INITIAL.milestones).map(m => ({ ...m, reached: amount >= m.amount })),
    };
  };

  // On mount: load from cloud and merge (cloud wins if newer)
  useEffect(() => {
    setSyncStatus("loading");
    Promise.all([
      cloudGet(STORAGE_KEYS.wishes),
      cloudGet(STORAGE_KEYS.defi),
      cloudGet(STORAGE_KEYS.hw),
      cloudGet(STORAGE_KEYS.way),
      cloudGet(STORAGE_KEYS.networth),
    ]).then(([wishes, defi, hw, way, nw]) => {
      if (wishes) { lsSet(STORAGE_KEYS.wishes,   wishes); setWishStateRaw(wishes); }
      if (defi)   { const merged = mergeDefiPositions(defi); lsSet(STORAGE_KEYS.defi, merged); setDefiPositionsRaw(merged); }
      if (hw)     { lsSet(STORAGE_KEYS.hw,        hw);     setHwCheckedRaw(hw); }
      if (way)    { const merged = mergeWayTasks(way); lsSet(STORAGE_KEYS.way, merged); setWayDataRaw(merged); }
      if (nw)     { lsSet(STORAGE_KEYS.networth,  nw);     setNwDataRaw(nw); }
      setSyncStatus("synced");
    }).catch(() => setSyncStatus("error"));
  }, []);

  const navigate = useNavigate();
  const accent = useAccent();

  // Keyboard shortcuts: g then h/d/w/n
  useEffect(() => {
    let g = false, timer;
    const down = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (g) {
        const map = { h: "/", d: "/defi", n: "/networth" };
        if (map[e.key]) { navigate(map[e.key]); g = false; clearTimeout(timer); }
      }
      if (e.key === "g") { g = true; timer = setTimeout(() => { g = false; }, 1500); }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, [navigate]);

  return (
    <Shell accent={accent} syncStatus={syncStatus}>
      <Routes>
        <Route path="/" element={<Overview wishState={wishState} defiPositions={defiPositions} defiHw={hwChecked} wayData={wayData} nwData={nwData} onNavigate={(id) => {
                const map = { home: "/", defi: "/defi", way: "/way", networth: "/networth" };
                navigate(map[id] ?? `/${id}`);
              }} />} />
        <Route path="/way" element={<Navigate to="/networth" replace />} />
        <Route path="/defi" element={<Navigate to="/defi/portfolio" replace />} />
        <Route path="/defi/:tab" element={<DefiDashboard positions={defiPositions} setPositions={setDefiPositions} hwChecked={hwChecked} setHwChecked={setHwChecked} />} />
        <Route path="/networth" element={<NetWorthDashboard nwData={nwData} setNwData={setNwData} wayData={wayData} setWayData={setWayData} />} />
        <Route path="/setup" element={<SetupDashboard />} />
      </Routes>
    </Shell>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
      <ToastHost />
    </BrowserRouter>
  );
}
