import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, NavLink, useNavigate, useParams, Navigate, useLocation } from 'react-router-dom'
import {
  STORAGE_KEYS, WISH_CATEGORIES, DEFI_INITIAL, WAY_INITIAL, NW_INITIAL,
  DEFI_WEEKS, BYBIT_STEPS, TYPE_ICONS, C, BYBIT_PROXY_URL, AI_PROXY_URL, NEWS_URL, X_ACCOUNTS, pill,
  SYNC_URL, SYNC_TOKEN,
} from './constants'

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

function InstructionBlock({ color }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop: 8 }}>
      <button onClick={e => { e.stopPropagation(); setOpen(o => !o); }} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
        <span style={{ fontSize: 10, color, letterSpacing: "0.06em", opacity: 0.8 }}>{open ? "▼" : "▶"} Инструкция: создать Bybit API ключ</span>
      </button>
      {open && (
        <div style={{ marginTop: 8, background: color + "08", border: `1px solid ${color}22`, borderRadius: 8, padding: "12px 14px" }}>
          {BYBIT_STEPS.map((item, idx) => (
            <div key={item.step} style={{ display: "flex", gap: 10, marginBottom: idx < BYBIT_STEPS.length - 1 ? 10 : 0 }}>
              <div style={{ width: 18, height: 18, borderRadius: "50%", background: color + "22", border: `1px solid ${color}44`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color, fontWeight: 700 }}>{item.step}</div>
              <div>
                <div style={{ fontSize: 12, color: "#E8E8F4", lineHeight: 1.4 }}>{item.text}</div>
                {item.note && <div style={{ fontSize: 10, color, marginTop: 2, opacity: 0.75 }}>{item.note}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Overview({ wishState, defiPositions, defiHw, wayData, nwData, onNavigate }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  const wishTotal = WISH_CATEGORIES.reduce((s, c) => s + c.items.length, 0);
  const wishDone = WISH_CATEGORIES.reduce((s, c) => s + c.items.filter((_, i) => wishState[c.id]?.[i]?.done).length, 0);
  const wishPct = Math.round((wishDone / wishTotal) * 100);
  const wishNextTask = (() => { for (const cat of WISH_CATEGORIES) { const idx = cat.items.findIndex((_, i) => !wishState[cat.id]?.[i]?.done); if (idx !== -1) return cat.items[idx]; } return null; })();

  const defiTotal = DEFI_WEEKS.reduce((s, w) => s + w.tasks.length, 0);
  const defiHwDone = Object.values(defiHw).filter(Boolean).length;
  const defiHwPct = Math.round((defiHwDone / defiTotal) * 100);
  const defiCurrent = defiPositions.reduce((s, p) => s + p.current, 0);
  const defiAllocated = defiPositions.reduce((s, p) => s + p.allocated, 0);
  const defiPnl = defiCurrent - defiAllocated;
  const defiNextTask = (() => { for (const w of DEFI_WEEKS) { const idx = w.tasks.findIndex((_, i) => !defiHw[`${w.week}-${i}`]); if (idx !== -1) { const t = w.tasks[idx]; return typeof t === "string" ? t : t.text; } } return null; })();

  const wayDone = wayData.tasks.filter(t => t.done).length;
  const wayProgress = wayData.currentAmount / 1000000 * 100;
  const wayNextTask = wayData.tasks.find(t => !t.done);

  const cards = [
    { id: "defi", icon: "₿", label: "CRYPTO", title: "Crypto", subtitle: "Portfolio · Homework · Radar", progress: defiHwPct, stat1: { label: "P&L", val: `${defiPnl >= 0 ? "+" : ""}$${defiPnl.toFixed(0)}` }, stat2: { label: "в работе", val: `$${defiCurrent.toLocaleString()}` }, nextTask: defiNextTask || null, color: "#00E5FF" },
    { id: "way", icon: "🚀", label: "ЦЕЛЬ", title: "1M$ Way", subtitle: "Путь к первому миллиону", progress: wayProgress, stat1: { label: "задач", val: `${wayDone}/${wayData.tasks.length}` }, stat2: { label: "сейчас", val: `$${wayData.currentAmount.toLocaleString()}` }, nextTask: wayNextTask?.text || null, color: "#FFD700" },
    { id: "wishes", icon: "✦", label: "ЛИЧНОЕ", title: "Wishlist", subtitle: "Цели · Мечты · Планы", progress: wishPct, stat1: { label: "выполнено", val: `${wishDone}/${wishTotal}` }, stat2: { label: "категорий", val: `${WISH_CATEGORIES.length}` }, nextTask: wishNextTask || null, color: "#7C5CFC" },
  ];

  return (
    <div style={{ padding: "40px 28px", maxWidth: 960, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 6 }}>
          {now.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })}
          <span style={{ marginLeft: 10, fontFamily: "monospace", color: "#00E5FF" }}>{now.toLocaleTimeString("ru-RU")}</span>
        </div>
        <h1 style={{ fontSize: 30, fontWeight: 700, color: C.text, letterSpacing: "-0.02em", margin: 0 }}>Dashboard</h1>
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
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 20px", marginBottom: 28, cursor: "pointer", width: "100%", textAlign: "left", transition: "border-color 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(118,255,3,0.35)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
          >
            <div>
              <div style={{ fontSize: 10, color: C.muted, letterSpacing: "0.1em", marginBottom: 4 }}>NETWORTH · {fmtM(latest.month)}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                <span style={{ fontSize: 22, fontWeight: 700, color: "#76FF03" }}>${Math.round(latest.nwUsd / 1000)}K</span>
                <span style={{ fontSize: 13, color: C.muted }}>₽{(latest.nwRub / 1_000_000).toFixed(2)}M</span>
                {delta !== 0 && pct && (
                  <span style={{ fontSize: 12, color: delta > 0 ? "#76FF03" : "#FF6450" }}>
                    {delta > 0 ? "+" : ""}${Math.round(delta / 1000)}K ({pct}%)
                  </span>
                )}
              </div>
            </div>
            {vals.length >= 2 && (
              <svg width={W} height={H} style={{ flexShrink: 0, overflow: "visible" }}>
                <polyline points={pts} fill="none" stroke="#76FF03" strokeWidth="1.5" strokeLinejoin="round" opacity="0.8" />
                {vals.map((v, i) => {
                  const x = (i / (vals.length - 1)) * W;
                  const y = H - ((v - minV) / (maxV - minV || 1)) * (H - 6) - 3;
                  return <circle key={i} cx={x} cy={y} r={i === vals.length - 1 ? 3 : 2} fill="#76FF03" opacity={i === vals.length - 1 ? 1 : 0.5} />;
                })}
              </svg>
            )}
          </button>
        );
      })()}

      {/* Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {cards.map(card => (
          <button key={card.id} onClick={() => onNavigate(card.id)}
            style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "24px", textAlign: "left", cursor: "pointer", transition: "border-color 0.2s, transform 0.2s", position: "relative", overflow: "hidden" }}
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
                <div style={{ fontSize: 13, color: C.text, lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{card.nextTask}</div>
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

function WishesDashboard({ wishState, setWishState }) {
  const [addState, setAddState] = useState({}); // { [catId]: { open, text, imageUrl } }
  const [imgErrors, setImgErrors] = useState({});

  const total = WISH_CATEGORIES.reduce((s, c) => s + c.items.length, 0);
  const done  = WISH_CATEGORIES.reduce((s, c) => s + c.items.filter((_, i) => wishState[c.id]?.[i]?.done).length, 0);

  const getAdd = (catId) => addState[catId] || { open: false, text: "", imageUrl: "" };
  const setAdd = (catId, patch) => setAddState(p => ({ ...p, [catId]: { ...getAdd(catId), ...patch } }));

  const toggleItem = (catId, idx, text) => {
    setWishState(prev => ({
      ...prev,
      [catId]: { ...prev[catId], [idx]: { ...(prev[catId]?.[idx] || { text }), done: !prev[catId]?.[idx]?.done } },
    }));
  };

  const addItem = (catId) => {
    const { text, imageUrl } = getAdd(catId);
    if (!text.trim()) return;
    const key = `new_${Date.now()}`;
    setWishState(prev => ({
      ...prev,
      [catId]: { ...prev[catId], [key]: { text: text.trim(), done: false, ...(imageUrl.trim() ? { image: imageUrl.trim() } : {}) } },
    }));
    setAdd(catId, { open: false, text: "", imageUrl: "" });
  };

  const deleteItem = (catId, key) => {
    setWishState(prev => {
      const next = { ...prev[catId] };
      delete next[key];
      return { ...prev, [catId]: next };
    });
  };

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>Wishlist</div>
        <div style={{ display: "flex", gap: 20 }}>
          {[{ label: "всего", val: total, color: C.text }, { label: "выполнено", val: done, color: "#5cfcb8" }, { label: "осталось", val: total - done, color: "#fcb85c" }].map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 10, color: C.muted }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 16 }}>
        {WISH_CATEGORIES.map(cat => {
          const extraItems = Object.entries(wishState[cat.id] || {})
            .filter(([k]) => k.startsWith("new_"))
            .map(([k, v]) => ({ key: k, ...v }));
          const allItems = [
            ...cat.items.map((text, i) => ({ key: i, text: wishState[cat.id]?.[i]?.text ?? text, done: wishState[cat.id]?.[i]?.done ?? false, image: wishState[cat.id]?.[i]?.image })),
            ...extraItems,
          ];
          const pct = allItems.length ? Math.round((allItems.filter(x => x.done).length / allItems.length) * 100) : 0;
          const { open: addOpen, text: addText, imageUrl: addImg } = getAdd(cat.id);

          return (
            <div key={cat.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
              {/* Top accent line */}
              <div style={{ height: 3, background: `linear-gradient(90deg, ${cat.color}, ${cat.color}55)` }} />

              {/* Header */}
              <div style={{ padding: "14px 16px 10px", display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 18 }}>{cat.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: cat.color, textTransform: "uppercase", letterSpacing: "0.05em", flex: 1 }}>{cat.title}</span>
                <span style={{ fontSize: 10, color: C.muted, background: C.surface, borderRadius: 100, padding: "2px 8px" }}>{allItems.filter(x => x.done).length}/{allItems.length}</span>
              </div>

              {/* Progress bar */}
              <div style={{ height: 3, background: C.border }}>
                <div style={{ width: `${pct}%`, height: "100%", background: `linear-gradient(90deg, ${cat.color}, ${cat.color}88)`, transition: "width 0.4s" }} />
              </div>

              {/* Items */}
              <ul style={{ listStyle: "none", padding: "8px 12px 4px", margin: 0 }}>
                {allItems.map(item => {
                  const imgKey = `${cat.id}-${item.key}`;
                  const imgFailed = imgErrors[imgKey];
                  return (
                    <li key={item.key}
                      style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "7px 4px", borderRadius: 8, cursor: "pointer" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      {/* Checkbox */}
                      <div onClick={() => toggleItem(cat.id, item.key, item.text)}
                        style={{ width: 18, height: 18, borderRadius: 5, flexShrink: 0, marginTop: item.image && !imgFailed ? 4 : 1,
                          border: item.done ? "none" : `2px solid ${C.border}`,
                          background: item.done ? cat.color + "44" : "transparent",
                          display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
                        {item.done && <span style={{ color: cat.color, fontSize: 10, fontWeight: 900 }}>✓</span>}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {item.image && !imgFailed && (
                          <img
                            src={item.image} alt={item.text}
                            onError={() => setImgErrors(p => ({ ...p, [imgKey]: true }))}
                            onClick={() => toggleItem(cat.id, item.key, item.text)}
                            style={{ width: "100%", maxHeight: 140, objectFit: "cover", borderRadius: 8, marginBottom: 6, opacity: item.done ? 0.4 : 1, transition: "opacity 0.2s" }}
                          />
                        )}
                        <span onClick={() => toggleItem(cat.id, item.key, item.text)}
                          style={{ fontSize: 13, color: item.done ? C.muted : C.text, textDecoration: item.done ? "line-through" : "none", lineHeight: 1.4, display: "block" }}>
                          {item.text}
                        </span>
                      </div>

                      {/* Delete (только для добавленных вручную) */}
                      {String(item.key).startsWith("new_") && (
                        <button onClick={(e) => { e.stopPropagation(); deleteItem(cat.id, item.key); }}
                          style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 14, padding: "0 2px", lineHeight: 1, flexShrink: 0, opacity: 0.5 }}
                          onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                          onMouseLeave={e => e.currentTarget.style.opacity = "0.5"}
                        >×</button>
                      )}
                    </li>
                  );
                })}
              </ul>

              {/* Add form */}
              <div style={{ padding: "4px 12px 12px" }}>
                {!addOpen ? (
                  <button onClick={() => setAdd(cat.id, { open: true })}
                    style={{ width: "100%", background: "transparent", border: `1px dashed ${C.border}`, borderRadius: 8, padding: "7px", color: C.muted, fontSize: 12, cursor: "pointer", textAlign: "left" }}>
                    + Добавить цель
                  </button>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <input
                      autoFocus
                      value={addText}
                      onChange={e => setAdd(cat.id, { text: e.target.value })}
                      onKeyDown={e => e.key === "Enter" && addItem(cat.id)}
                      placeholder="Название цели..."
                      style={{ background: C.surface, border: `1px solid ${cat.color}55`, borderRadius: 8, padding: "7px 10px", color: C.text, fontSize: 13, outline: "none", fontFamily: "inherit" }}
                    />
                    <input
                      value={addImg}
                      onChange={e => setAdd(cat.id, { imageUrl: e.target.value })}
                      placeholder="URL картинки (необязательно)"
                      style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 10px", color: C.text, fontSize: 12, outline: "none", fontFamily: "inherit" }}
                    />
                    {addImg.trim() && (
                      <img src={addImg.trim()} alt="preview"
                        onError={e => e.target.style.display = "none"}
                        style={{ width: "100%", maxHeight: 100, objectFit: "cover", borderRadius: 8, opacity: 0.7 }}
                      />
                    )}
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => addItem(cat.id)}
                        style={{ flex: 1, background: cat.color + "18", border: `1px solid ${cat.color}44`, borderRadius: 8, padding: "7px", color: cat.color, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
                        Добавить
                      </button>
                      <button onClick={() => setAdd(cat.id, { open: false, text: "", imageUrl: "" })}
                        style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 8, padding: "7px 12px", color: C.muted, fontSize: 12, cursor: "pointer" }}>
                        Отмена
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PositionCard({ pos, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(pos.current);
  const [apy, setApy] = useState(pos.apy);
  const pnl = pos.current - pos.allocated;
  const pnlPct = ((pnl / pos.allocated) * 100).toFixed(1);
  const statusColors = { active: "#76FF03", pending: "rgba(255,255,255,0.2)", paused: "#FFD600" };
  const save = () => { onUpdate(pos.id, { current: parseFloat(val) || pos.current, apy: parseFloat(apy) || 0, status: "active" }); setEditing(false); };
  return (
    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 14, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, right: 0, width: 60, height: 60, background: `radial-gradient(circle, ${pos.color}15 0%, transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ color: pos.color, fontSize: 14 }}>{TYPE_ICONS[pos.type]}</span>
            <span style={{ color: "#fff", fontWeight: 600, fontSize: 13 }}>{pos.protocol}</span>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: statusColors[pos.status] }} />
          </div>
          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, marginTop: 2, fontFamily: "monospace" }}>{pos.network} · {pos.asset}</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 10 }}>
        {[{ label: "Цель", val: `$${pos.allocated}` }, { label: "Текущее", val: `$${pos.current}` }, { label: "APY", val: pos.apy ? `${pos.apy}%` : "—" }].map(({ label, val: v }) => (
          <div key={label} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 7, padding: "7px 8px" }}>
            <div style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ color: pos.current === 0 ? C.muted : pnl >= 0 ? "#76FF03" : "#FF1744", fontSize: 11, fontFamily: "monospace" }}>{pos.current === 0 ? "—" : `${pnl >= 0 ? "+" : ""}${pnl.toFixed(0)}$ (${pnlPct}%)`}</div>
        <button onClick={() => setEditing(!editing)} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, color: "rgba(255,255,255,0.4)", fontSize: 9, padding: "3px 9px", cursor: "pointer" }}>
          {editing ? "ОТМЕНА" : "ОБНОВИТЬ"}
        </button>
      </div>
      {editing && (
        <div style={{ marginTop: 10, padding: 10, background: "rgba(0,0,0,0.3)", borderRadius: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
          <input type="number" value={val} onChange={e => setVal(e.target.value)} placeholder="Сумма $" style={{ flex: 1, minWidth: 90, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "#fff", padding: "5px 8px", fontSize: 11, outline: "none" }} />
          <input type="number" value={apy} onChange={e => setApy(e.target.value)} placeholder="APY %" style={{ flex: 1, minWidth: 70, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "#fff", padding: "5px 8px", fontSize: 11, outline: "none" }} />
          <button onClick={save} style={{ background: "rgba(118,255,3,0.12)", border: "1px solid #76FF03", borderRadius: 6, color: "#76FF03", fontSize: 9, padding: "5px 12px", cursor: "pointer" }}>СОХРАНИТЬ</button>
        </div>
      )}
    </div>
  );
}

function TaskRow({ taskText, taskDesc, isDone, onToggle, isLast, showLegacy }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: isLast ? "none" : `1px solid ${C.border}` }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 0 6px" }}>
        <button onClick={onToggle} style={{ width: 15, height: 15, borderRadius: 4, flexShrink: 0, marginTop: 2, border: isDone ? "none" : `1px solid ${C.border}`, background: isDone ? "#76FF03" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0 }}>
          {isDone && <span style={{ color: "#000", fontSize: 9, fontWeight: 900 }}>✓</span>}
        </button>
        <div style={{ flex: 1 }}>
          <span onClick={onToggle} style={{ color: isDone ? C.muted : "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: 500, textDecoration: isDone ? "line-through" : "none", lineHeight: 1.4, cursor: "pointer" }}>{taskText}</span>
          {showLegacy && <InstructionBlock color="#00E5FF" />}
        </div>
        {taskDesc && (
          <button onClick={() => setOpen(o => !o)} style={{ flexShrink: 0, background: open ? "rgba(0,229,255,0.12)" : "rgba(0,229,255,0.05)", border: "1px solid rgba(0,229,255,0.2)", borderRadius: 5, color: "#00E5FF", fontSize: 9, padding: "3px 8px", cursor: "pointer", letterSpacing: "0.06em", whiteSpace: "nowrap", marginTop: 1 }}>
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

function DefiDashboard({ positions, setPositions, hwChecked, setHwChecked }) {
  const { tab = "portfolio" } = useParams();
  const navigate = useNavigate();
  const [openWeek, setOpenWeek] = useState(() => {
    const first = DEFI_WEEKS.find(w => w.tasks.some((_, i) => !hwChecked[`${w.week}-${i}`]));
    return first ? first.week : DEFI_WEEKS[0].week;
  });
  const [notes, setNotes] = useState(() => ls("defi_notes", []));
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
        const coins = account.coin
          .filter(c => parseFloat(c.usdValue) >= 1)
          .sort((a, b) => parseFloat(b.usdValue) - parseFloat(a.usdValue));
        const equity = parseFloat(account.totalEquity);
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

  const totalAllocated = positions.reduce((s, p) => s + p.allocated, 0);
  const totalCurrent = positions.reduce((s, p) => s + p.current, 0);
  const totalPnl = totalCurrent - totalAllocated;
  const avgApy = positions.filter(p => p.apy > 0).reduce((s, p, _, arr) => s + p.apy / arr.length, 0);
  const defiTotal = DEFI_WEEKS.reduce((s, w) => s + w.tasks.length, 0);
  const hwDone = Object.values(hwChecked).filter(Boolean).length;

  return (
    <div style={{ paddingBottom: 40 }}>
      <div style={{ padding: "16px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.border}` }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>Crypto</div>
        </div>
        <div style={{ fontFamily: "monospace", fontSize: 13, color: "#00E5FF" }}>{time.toLocaleTimeString("ru-RU")}</div>
      </div>

      <div style={{ padding: "10px 28px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: bybit ? "#00E5FF" : bybitLoading ? C.muted : "#FF6450", flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: C.muted }}>Bybit</span>
        </div>
        {bybitLoading && <span style={{ fontSize: 12, color: C.muted }}>загружаю...</span>}
        {bybitError && <span style={{ fontSize: 12, color: "#FF6450" }}>Ошибка: {bybitError}</span>}
        {bybit && (
          <>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#00E5FF" }}>${bybit.totalEquity.toFixed(2)}</span>
            {/* Sparkline */}
            {bybitHistory.length >= 2 && (() => {
              const vals = bybitHistory.map(h => h.balance);
              const minV = Math.min(...vals), maxV = Math.max(...vals);
              const W = 80, H = 24;
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
                  <span style={{ fontSize: 11, color: delta >= 0 ? "#76FF03" : "#FF6450" }}>
                    {delta >= 0 ? "+" : ""}{delta.toFixed(0)}$
                  </span>
                </div>
              );
            })()}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {bybit.coins.map(c => (
                <div key={c.coin} style={{ background: "rgba(0,229,255,0.06)", border: `1px solid ${C.border}`, borderRadius: 6, padding: "2px 10px", display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "#00E5FF", fontWeight: 600 }}>{c.coin}</span>
                  <span style={{ fontSize: 12, color: C.muted }}>${parseFloat(c.usdValue).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <button onClick={fetchBybit} style={{ marginLeft: "auto", background: "transparent", border: `1px solid ${C.border}`, borderRadius: 6, padding: "3px 10px", color: C.muted, fontSize: 12, cursor: "pointer" }}>↻</button>
          </>
        )}
      </div>

      <div style={{ padding: "14px 28px 6px", borderTop: `1px solid ${C.border}` }}>
        <span style={{ fontSize: 10, color: C.muted, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600 }}>DeFi</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, padding: "10px 28px", borderBottom: `1px solid ${C.border}` }}>
        {[
          { label: "БЮДЖЕТ", val: `$${totalAllocated.toLocaleString()}`, color: C.text },
          { label: "ТЕКУЩЕЕ", val: `$${totalCurrent.toLocaleString()}`, color: "#00E5FF" },
          { label: "P&L", val: totalCurrent === 0 ? "$0" : `${totalPnl >= 0 ? "+" : ""}$${totalPnl.toFixed(0)}`, color: totalCurrent === 0 ? C.muted : totalPnl >= 0 ? "#76FF03" : "#FF1744" },
          { label: "СР. APY", val: avgApy > 0 ? `${avgApy.toFixed(1)}%` : "—", color: "#D4AF37" },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontSize: 9, color: C.muted, letterSpacing: "0.15em", marginBottom: 5 }}>{label}</div>
            <div style={{ fontSize: 17, fontWeight: 700, color }}>{val}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 4, padding: "12px 28px", borderBottom: `1px solid ${C.border}` }}>
        {[{ id: "portfolio", label: "Portfolio" }, { id: "homework", label: "Homework" }, { id: "notes", label: "Notes" }, { id: "radar", label: "Radar" }].map(t => (
          <button key={t.id} onClick={() => navigate(`/defi/${t.id}`)} style={{ background: tab === t.id ? "rgba(0,229,255,0.08)" : "transparent", border: "none", borderBottom: tab === t.id ? "2px solid #00E5FF" : "2px solid transparent", color: tab === t.id ? "#00E5FF" : C.muted, fontSize: 13, padding: "8px 18px 10px", cursor: "pointer", borderRadius: 0, transition: "all 0.15s" }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "24px 28px", maxWidth: 900, margin: "0 auto" }}>
        {tab === "portfolio" && (
          <div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 9, color: C.muted, letterSpacing: "0.15em", marginBottom: 10 }}>РАСПРЕДЕЛЕНИЕ</div>
              <div style={{ display: "flex", height: 6, borderRadius: 3, overflow: "hidden", gap: 1 }}>
                {positions.map(p => <div key={p.id} style={{ flex: p.allocated, background: p.color, opacity: 0.8 }} />)}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", marginTop: 10 }}>
                {positions.map(p => (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: p.color }} />
                    <span style={{ fontSize: 10, color: C.muted }}>{p.protocol} ${p.allocated}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 12 }}>
              {positions.map(p => <PositionCard key={p.id} pos={p} onUpdate={updatePosition} />)}
            </div>
          </div>
        )}

        {tab === "homework" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ fontSize: 9, color: C.muted, letterSpacing: "0.15em" }}>ОБЩИЙ ПРОГРЕСС</span>
              <span style={{ fontSize: 9, color: "#76FF03", fontFamily: "monospace" }}>{hwDone}/{defiTotal}</span>
            </div>
            <div style={{ height: 4, background: C.border, borderRadius: 2, overflow: "hidden", marginBottom: 20 }}>
              <div style={{ height: "100%", width: `${Math.round((hwDone / defiTotal) * 100)}%`, background: "linear-gradient(90deg, #00E5FF, #76FF03)", borderRadius: 2, transition: "width 0.4s" }} />
            </div>
            {DEFI_WEEKS.map(w => {
              const done = w.tasks.filter((_, i) => hwChecked[`${w.week}-${i}`]).length;
              const isOpen = openWeek === w.week;
              return (
                <div key={w.week} style={{ marginBottom: 6, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
                  <button onClick={() => setOpenWeek(isOpen ? null : w.week)} style={{ width: "100%", background: isOpen ? "rgba(0,229,255,0.05)" : C.card, border: "none", padding: "11px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontFamily: "monospace", fontSize: 10, color: "#00E5FF" }}>W{w.week}</span>
                      <span style={{ color: C.text, fontSize: 13 }}>{w.title}</span>
                    </div>
                    <span style={{ fontFamily: "monospace", fontSize: 10, color: done === w.tasks.length ? "#76FF03" : C.muted }}>{done}/{w.tasks.length}</span>
                  </button>
                  {isOpen && (
                    <div style={{ padding: "8px 16px 12px" }}>
                      {w.tasks.map((task, i) => {
                        const key = `${w.week}-${i}`;
                        const isDone = hwChecked[key];
                        const taskText = typeof task === "string" ? task : task.text;
                        const taskDesc = typeof task === "object" ? task.description : null;
                        return (
                          <TaskRow key={i} taskText={taskText} taskDesc={taskDesc} isDone={isDone} onToggle={() => toggleHw(key)} isLast={i === w.tasks.length - 1} showLegacy={w.week === 0 && i === 0} />
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === "notes" && (() => {
          const NOTE_TAGS = [
            { id: "general", label: "Общее", color: "#00E5FF" },
            { id: "apy", label: "APY / ставки", color: "#76FF03" },
            { id: "protocol", label: "Протокол", color: "#7C5CFC" },
            { id: "risk", label: "Риск", color: "#FF1744" },
            { id: "idea", label: "Идея", color: "#FFD700" },
          ];
          const tagColor = (id) => NOTE_TAGS.find(t => t.id === id)?.color || "#00E5FF";
          return (
            <div>
              {/* Инпут */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginBottom: 20 }}>
                <div style={{ fontSize: 9, color: C.muted, letterSpacing: "0.15em", marginBottom: 10 }}>НОВАЯ ЗАМЕТКА</div>
                <textarea
                  value={noteInput}
                  onChange={e => setNoteInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) saveNote(); }}
                  placeholder="Запиши APY, наблюдение, идею или ссылку... (Cmd+Enter чтобы сохранить)"
                  rows={3}
                  style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", color: C.text, fontSize: 12, lineHeight: 1.6, outline: "none", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }}
                />
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                  {NOTE_TAGS.map(t => (
                    <button key={t.id} onClick={() => setNoteTag(t.id)} style={{ padding: "3px 10px", borderRadius: 20, fontSize: 10, cursor: "pointer", fontWeight: 600, background: noteTag === t.id ? t.color + "22" : "transparent", border: `1px solid ${noteTag === t.id ? t.color : C.border}`, color: noteTag === t.id ? t.color : C.muted, transition: "all 0.15s" }}>
                      {t.label}
                    </button>
                  ))}
                  <button onClick={saveNote} style={{ marginLeft: "auto", padding: "5px 16px", borderRadius: 8, background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.3)", color: "#00E5FF", fontSize: 11, fontWeight: 700, cursor: "pointer", letterSpacing: "0.05em" }}>
                    + Сохранить
                  </button>
                </div>
              </div>

              {/* Список */}
              {notes.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: C.muted, fontSize: 12 }}>Заметок пока нет — сохрани первую выше</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {notes.map(note => (
                    <div key={note.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: tagColor(note.tag) + "18", color: tagColor(note.tag), border: `1px solid ${tagColor(note.tag)}30` }}>
                            {NOTE_TAGS.find(t => t.id === note.tag)?.label || note.tag}
                          </span>
                          <span style={{ fontSize: 9, color: C.muted }}>{note.date}</span>
                        </div>
                        <div style={{ fontSize: 12, color: C.text, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{note.text}</div>
                      </div>
                      <button onClick={() => deleteNote(note.id)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 14, padding: "0 2px", lineHeight: 1, flexShrink: 0 }} title="Удалить">×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {tab === "radar" && <RadarDashboard embedded />}
      </div>
    </div>
  );
}

function WayDashboard({ data, setData }) {
  const [newTask, setNewTask] = useState("");
  const [newLog, setNewLog] = useState("");
  const [editAmount, setEditAmount] = useState(false);
  const [amountVal, setAmountVal] = useState(data.currentAmount);
  const pct = Math.round(data.currentAmount / 1000000 * 100 * 100) / 100;
  const done = data.tasks.filter(t => t.done).length;

  const toggleTask = (id) => setData(d => ({ ...d, tasks: d.tasks.map(t => t.id === id ? { ...t, done: !t.done } : t) }));
  const addTask = () => {
    if (!newTask.trim()) return;
    setData(d => ({ ...d, tasks: [...d.tasks, { id: `w${Date.now()}`, text: newTask, done: false, priority: "medium", category: "Задача" }] }));
    setNewTask("");
  };
  const addLog = () => {
    if (!newLog.trim()) return;
    setData(d => ({ ...d, log: [{ id: Date.now(), text: newLog, date: new Date().toLocaleDateString("ru-RU") }, ...d.log] }));
    setNewLog("");
  };
  const saveAmount = () => {
    const val = parseFloat(amountVal) || 0;
    setData(d => ({ ...d, currentAmount: val, milestones: d.milestones.map(m => ({ ...m, reached: val >= m.amount })) }));
    setEditAmount(false);
  };

  return (
    <div style={{ paddingBottom: 40 }}>
      <div style={{ padding: "16px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.border}` }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>1M$ Way</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>ТЕКУЩИЙ КАПИТАЛ</div>
          {editAmount ? (
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input type="number" value={amountVal} onChange={e => setAmountVal(e.target.value)} style={{ width: 120, background: C.card, border: "1px solid #FFD700", borderRadius: 6, padding: "5px 10px", color: C.text, fontSize: 14, outline: "none" }} onKeyDown={e => e.key === "Enter" && saveAmount()} />
              <button onClick={saveAmount} style={{ background: "#FFD70022", border: "1px solid #FFD700", borderRadius: 6, padding: "5px 10px", color: "#FFD700", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>OK</button>
              <button onClick={() => setEditAmount(false)} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: "5px 8px", color: C.muted, cursor: "pointer" }}>✕</button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: "#FFD700" }}>${data.currentAmount.toLocaleString()}</span>
              <button onClick={() => { setEditAmount(true); setAmountVal(data.currentAmount); }} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: "4px 10px", color: C.muted, cursor: "pointer", fontSize: 11 }}>Обновить</button>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: "24px 28px", maxWidth: 900, margin: "0 auto" }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px", marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Прогресс к $1,000,000</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#FFD700" }}>{pct}%</span>
          </div>
          <div style={{ height: 10, background: C.border, borderRadius: 5, overflow: "hidden", marginBottom: 16 }}>
            <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", background: "linear-gradient(90deg, #FFD700, #FF6B35)", borderRadius: 5, transition: "width 0.6s ease" }} />
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {data.milestones.map(m => (
              <div key={m.id} style={{ ...pill(m.reached ? "#FFD700" : C.muted, m.label, true), opacity: m.reached ? 1 : 0.5 }}>
                {m.reached ? "✓ " : ""}{m.label}
              </div>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 14 }}>Задачи <span style={{ color: C.muted, fontWeight: 400 }}>({done}/{data.tasks.length})</span></div>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <input value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => e.key === "Enter" && addTask()} placeholder="Добавить задачу..." style={{ flex: 1, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", color: C.text, fontSize: 13, outline: "none" }} />
            <button onClick={addTask} style={{ background: "#FFD70022", border: "1px solid #FFD700", borderRadius: 10, padding: "10px 18px", color: "#FFD700", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>+</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {data.tasks.map(task => (
              <div key={task.id} style={{ background: task.done ? "#1A1A10" : C.card, border: `1px solid ${task.done ? "#FFD70022" : C.border}`, borderRadius: 10, padding: "12px 14px", opacity: task.done ? 0.65 : 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button onClick={() => toggleTask(task.id)} style={{ width: 18, height: 18, borderRadius: 5, flexShrink: 0, border: `2px solid ${task.done ? "#FFD700" : "#333"}`, background: task.done ? "#FFD700" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {task.done && <span style={{ color: "#000", fontSize: 10, fontWeight: 900 }}>✓</span>}
                  </button>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13, color: task.done ? C.muted : C.text, textDecoration: task.done ? "line-through" : "none" }}>{task.text}</span>
                      <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 10, background: "#FFD70011", color: "#FFD700", border: "1px solid #FFD70033" }}>{task.category}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 12 }}>Журнал побед</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <input value={newLog} onChange={e => setNewLog(e.target.value)} onKeyDown={e => e.key === "Enter" && addLog()} placeholder="Запиши победу или важное событие..." style={{ flex: 1, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", color: C.text, fontSize: 13, outline: "none" }} />
            <button onClick={addLog} style={{ background: "#FFD70022", border: "1px solid #FFD700", borderRadius: 10, padding: "10px 18px", color: "#FFD700", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>+</button>
          </div>
          {data.log.length === 0 ? (
            <div style={{ textAlign: "center", padding: 32, color: C.muted, fontSize: 13 }}>Пока пусто. Первая победа уже близко 🏆</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {data.log.map(e => (
                <div key={e.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", display: "flex", gap: 14 }}>
                  <span style={{ fontSize: 10, color: C.muted, whiteSpace: "nowrap", flexShrink: 0, marginTop: 2 }}>{e.date}</span>
                  <span style={{ fontSize: 13, color: C.text }}>{e.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function useAccent() {
  const loc = useLocation();
  if (loc.pathname.startsWith("/defi"))    return "#00E5FF";
  if (loc.pathname.startsWith("/way"))     return "#FFD700";
  if (loc.pathname.startsWith("/wishlist"))return "#7C5CFC";
  return "#00E5FF";
}

function RadarDashboard({ embedded = false }) {
  const TAG_COLORS = { x: "#1DA1F2", media: "#7C5CFC", data: "#76FF03" };
  const TAG_LABELS = { x: "𝕏 Twitter", media: "Медиа", data: "Данные" };
  const IMPACT_C   = { high: "#FF1744", medium: "#FFD700", low: "#76FF03" };
  const RISK_C     = { high: "#FF1744", medium: "#FFD700", low: "#76FF03" };

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
        <div style={{ padding: "16px 28px", display: "flex", alignItems: "center", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Радар</div>
        </div>
      )}

      <div style={{ padding: embedded ? "0" : "20px 28px", maxWidth: 900, margin: "0 auto" }}>

        {/* ── AI БРИФ ── */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.text, letterSpacing: "0.04em" }}>AI Стратегический бриф</span>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {brief?.generatedAt && <span style={{ fontSize: 11, color: C.muted }}>{new Date(brief.generatedAt).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>}
              <button onClick={() => fetchBrief(true)} disabled={briefLoading}
                style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 6, color: briefLoading ? C.muted : C.text, fontSize: 11, padding: "5px 14px", cursor: briefLoading ? "wait" : "pointer" }}>
                {briefLoading ? "анализирую..." : "↻ обновить"}
              </button>
            </div>
          </div>

          {briefLoading && !brief && (
            <div style={{ textAlign: "center", padding: "32px 0", color: C.muted, fontSize: 13 }}>
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
                        <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>{item.reason}</div>
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
                        <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>{item.reason}</div>
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
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>{item.position}</div>
                        <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>{item.reason}</div>
                      </div>
                    ))}
                  </div>
                )}
                {brief.opportunities?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>Возможности</div>
                    {brief.opportunities.map((item, i) => {
                      const riskColor = item.risk === "low" ? "#76FF03" : item.risk === "medium" ? "#FFD700" : "#FF6450";
                      const riskLabel = item.risk === "low" ? "Conservative" : item.risk === "medium" ? "Moderate" : "Aggressive";
                      return (
                        <div key={i} style={{ padding: "10px 14px", background: "rgba(255,255,255,0.02)", border: `1px solid ${C.border}`, borderRadius: 8, marginBottom: 8, borderLeft: `3px solid ${riskColor}` }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{item.protocol}</span>
                            {item.chain && <span style={{ fontSize: 10, color: C.muted }}>{item.chain}</span>}
                            {item.apy && <span style={{ fontSize: 13, fontWeight: 700, color: riskColor }}>{item.apy}</span>}
                            <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: riskColor + "18", color: riskColor, border: `1px solid ${riskColor}44`, fontWeight: 600 }}>{riskLabel}</span>
                            {item.tvl && <span style={{ fontSize: 10, color: C.muted }}>TVL {item.tvl}</span>}
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

        {/* ── Следим за ── */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 9, color: C.muted, letterSpacing: "0.15em", marginBottom: 12 }}>𝕏 СЛЕДИМ ЗА</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {X_ACCOUNTS.map(acc => (
              <a key={acc.handle} href={`https://x.com/${acc.handle}`} target="_blank" rel="noopener noreferrer"
                style={{ background: "rgba(29,161,242,0.06)", border: "1px solid rgba(29,161,242,0.18)", borderRadius: 8, padding: "7px 12px", textDecoration: "none", display: "flex", flexDirection: "column", gap: 2, minWidth: 130 }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(29,161,242,0.13)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(29,161,242,0.06)"}
              >
                <span style={{ fontSize: 11, fontWeight: 700, color: "#1DA1F2" }}>@{acc.handle}</span>
                <span style={{ fontSize: 9, color: C.muted, lineHeight: 1.4 }}>{acc.focus}</span>
              </a>
            ))}
          </div>
        </div>

        {/* ── Лента новостей ── */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", gap: 6 }}>
              {["all", "x", "media", "data"].map(f => (
                <button key={f} onClick={() => setNewsFilter(f)}
                  style={{ padding: "3px 10px", borderRadius: 20, fontSize: 10, cursor: "pointer", fontWeight: 600, background: newsFilter === f ? (TAG_COLORS[f] || "#00E5FF") + "22" : "transparent", border: `1px solid ${newsFilter === f ? (TAG_COLORS[f] || "#00E5FF") : C.border}`, color: newsFilter === f ? (TAG_COLORS[f] || "#00E5FF") : C.muted }}>
                  {f === "all" ? "Все" : TAG_LABELS[f]}
                </button>
              ))}
            </div>
            <button onClick={fetchNews} disabled={newsLoading}
              style={{ background: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.2)", borderRadius: 6, color: newsLoading ? C.muted : "#00E5FF", fontSize: 10, padding: "4px 10px", cursor: newsLoading ? "wait" : "pointer" }}>
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
                    <span style={{ fontSize: 9, fontWeight: 700, color: TAG_COLORS[item.tag] || "#00E5FF" }}>{item.source}</span>
                    {item.date && <span style={{ fontSize: 9, color: C.muted }}>{timeSince(item.date)}</span>}
                    {item.description && <span style={{ fontSize: 10, color: C.muted, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", maxWidth: 320 }}>{item.description}</span>}
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
function NetWorthDashboard({ nwData, setNwData }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ month: "", rate: "", kv: "", avto: "", sklad: "", crypto: "", ipoteka: "", credit: "" });

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
    setForm({ month: "", rate: "", kv: "", avto: "", sklad: "", crypto: "", ipoteka: "", credit: "" });
  };

  // SVG chart
  const W = 600, H = 80;
  const vals = months.map(d => d.nwUsd);
  const minV = Math.min(...vals), maxV = Math.max(...vals);
  const range = maxV - minV || 1;
  const pts = vals.map((v, i) => {
    const x = months.length > 1 ? (i / (months.length - 1)) * W : W / 2;
    const y = H - ((v - minV) / range) * (H - 20) - 10;
    return [x, y];
  });
  const polyline = pts.map(p => p.join(",")).join(" ");
  const area = `${pts[0]?.[0]??0},${H} ${polyline} ${pts[pts.length-1]?.[0]??W},${H}`;

  const inputStyle = { width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: "7px 10px", color: C.text, fontSize: 12, fontFamily: "inherit", boxSizing: "border-box" };
  const NW_COLOR = "#76FF03";

  return (
    <div style={{ padding: "24px 20px", maxWidth: 900, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: C.muted, letterSpacing: "0.1em", marginBottom: 6 }}>NETWORTH</div>
          <div style={{ fontSize: 36, fontWeight: 700, color: NW_COLOR, lineHeight: 1 }}>{latest ? fmtUsd(latest.nwUsd) : "—"}</div>
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
        </div>
        <button onClick={() => setShowForm(s => !s)}
          style={{ background: `rgba(118,255,3,0.1)`, border: `1px solid rgba(118,255,3,0.3)`, borderRadius: 8, color: NW_COLOR, fontSize: 12, padding: "8px 18px", cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" }}>
          + Добавить месяц
        </button>
      </div>

      {/* Add month form */}
      {showForm && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 16 }}>Новый месяц</div>
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
                <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>{f.label}</div>
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
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 20px 12px", marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: C.muted, letterSpacing: "0.1em", marginBottom: 12 }}>ДИНАМИКА NETWORTH ($)</div>
          <svg viewBox={`-20 0 ${W + 40} ${H + 28}`} style={{ width: "100%", overflow: "visible" }}>
            <defs>
              <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={NW_COLOR} stopOpacity="0.25" />
                <stop offset="100%" stopColor={NW_COLOR} stopOpacity="0" />
              </linearGradient>
            </defs>
            <polygon points={area} fill="url(#nwGrad)" />
            <polyline points={polyline} fill="none" stroke={NW_COLOR} strokeWidth="2" strokeLinejoin="round" />
            {pts.map(([x, y], i) => (
              <g key={i}>
                <circle cx={x} cy={y} r={4} fill={NW_COLOR} />
                <text x={x} y={y - 10} textAnchor="middle" fill={NW_COLOR} fontSize="10" fontWeight="600">
                  {fmtUsd(months[i].nwUsd)}
                </text>
                <text x={x} y={H + 20} textAnchor="middle" fill="#9090B0" fontSize="9">
                  {fmtMonth(months[i].month)}
                </text>
              </g>
            ))}
          </svg>
        </div>
      )}

      {/* Assets + Liabilities */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* Assets */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 10, color: C.muted, letterSpacing: "0.1em", marginBottom: 16 }}>АКТИВЫ</div>
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
                      <span style={{ fontSize: 13, color: C.muted }}>{r.label}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{fmtRub(r.val)}</span>
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
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 10, color: C.muted, letterSpacing: "0.1em", marginBottom: 16 }}>ОБЯЗАТЕЛЬСТВА</div>
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
                      <span style={{ fontSize: 13, color: C.muted }}>{r.label}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#FF6450" }}>−{fmtRub(r.val)}</span>
                  </div>
                ))}
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10, marginTop: 4, display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, color: C.muted }}>Обязательства</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#FF6450" }}>−{fmtRub(totalLiab)}</span>
                </div>
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10, marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>Networth</span>
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
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
        <div style={{ fontSize: 10, color: C.muted, letterSpacing: "0.1em", marginBottom: 16 }}>ИСТОРИЯ</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr>
                {["Месяц","Курс","Активы ₽","Обяз. ₽","NW ₽","NW $","Δ $"].map(h => (
                  <th key={h} style={{ textAlign: "right", padding: "4px 10px", color: C.muted, fontWeight: 600, fontSize: 10, whiteSpace: "nowrap" }}>{h}</th>
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
                    <td style={{ padding: "9px 10px", color: C.muted,   textAlign: "right" }}>{m.rate}</td>
                    <td style={{ padding: "9px 10px", color: C.text,    textAlign: "right", whiteSpace: "nowrap" }}>{fmtRub(ta)}</td>
                    <td style={{ padding: "9px 10px", color: "#FF6450", textAlign: "right", whiteSpace: "nowrap" }}>−{fmtRub(tl)}</td>
                    <td style={{ padding: "9px 10px", color: NW_COLOR,  textAlign: "right", fontWeight: 600, whiteSpace: "nowrap" }}>{fmtRub(m.nwRub)}</td>
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
      </div>
    </div>
  );
}

const SETUP = {
  projects: [
    { name: "flow", desc: "Групповая дисциплина · спринты", stack: "TS core + React + Supabase", deploy: "Cloudflare Pages", color: "#76FF03", live: "flowsprints.pages.dev" },
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
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18 }}>
      <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, color: accent, marginBottom: 14 }}>{title}</div>
      {children}
    </div>
  );
}

function SetupDashboard() {
  return (
    <div style={{ maxWidth: 920, margin: "0 auto", padding: "24px 20px 60px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <span style={{ fontSize: 22 }}>🤖</span>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>Claude Code · Setup</div>
      </div>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>Как устроена моя работа с AI по всем проектам</div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
        <SetupCard title="Проекты" accent="#00E5FF">
          {SETUP.projects.map(p => (
            <div key={p.name} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{p.name}</span>
              </div>
              <div style={{ fontSize: 12, color: C.muted, marginLeft: 16, marginTop: 2 }}>{p.desc}</div>
              <div style={{ fontSize: 11, color: C.muted, marginLeft: 16, marginTop: 3, opacity: 0.8 }}>{p.stack} · {p.deploy}</div>
              {p.live && <div style={{ fontSize: 11, color: p.color, marginLeft: 16, marginTop: 2 }}>{p.live}</div>}
            </div>
          ))}
        </SetupCard>

        <SetupCard title="AI-модели (бот)" accent="#7C5CFC">
          {SETUP.models.map(m => (
            <div key={m.name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ color: "#76FF03", fontSize: 13 }}>✓</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{m.name}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{m.via} · {m.tag}</div>
              </div>
            </div>
          ))}
        </SetupCard>

        <SetupCard title="4 слоя памяти" accent="#FFD700">
          {SETUP.layers.map(l => (
            <div key={l.name} style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 15 }}>{l.icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{l.name}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{l.desc}</div>
              </div>
            </div>
          ))}
        </SetupCard>

        <SetupCard title="Скиллы" accent="#00E5FF">
          {SETUP.skills.map(s => (
            <div key={s.cmd} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#00E5FF", fontFamily: "'DM Mono', monospace" }}>{s.cmd}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{s.desc}</div>
            </div>
          ))}
        </SetupCard>

        <SetupCard title="Безопасность" accent="#76FF03">
          {SETUP.security.map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "flex-start" }}>
              <span style={{ color: "#76FF03", fontSize: 13, lineHeight: "16px" }}>✓</span>
              <span style={{ fontSize: 12, color: C.text, lineHeight: "16px" }}>{s}</span>
            </div>
          ))}
        </SetupCard>

        <SetupCard title="Инфраструктура" accent="#FF9F45">
          {[["☁️", "Cloudflare", "Pages + Workers"], ["🗄️", "Supabase", "БД · auth · edge"], ["🚀", "Google Cloud Run", "tg-bot 24/7"], ["📝", "Obsidian", "общая база знаний"]].map(([ic, n, d]) => (
            <div key={n} style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 15 }}>{ic}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{n}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{d}</div>
              </div>
            </div>
          ))}
        </SetupCard>
      </div>
    </div>
  );
}

const navItems = [
  { to: "/defi",      label: "Crypto",    color: "#00E5FF" },
  { to: "/way",       label: "1M$ Way",   color: "#FFD700" },
  { to: "/wishlist",  label: "Wishlist",  color: "#7C5CFC" },
  { to: "/networth",  label: "Networth", color: "#76FF03" },
  { to: "/setup",     label: "Setup",     color: "#6C63FF" },
];

function Shell({ children, accent, syncStatus }) {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'DM Mono', 'Courier New', monospace", overflowX: "hidden" }}>
      <div style={{ position: "sticky", top: 0, zIndex: 100, background: C.surface, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", padding: "0 20px", height: 52, gap: 10 }}>
        <button onClick={() => navigate("/")} style={{ width: 30, height: 30, borderRadius: 8, background: "#0D1117", border: "1px solid rgba(0,229,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: "#00E5FF", cursor: "pointer", flexShrink: 0, fontFamily: "system-ui, sans-serif" }}>d</button>
        <div style={{ display: "flex", gap: 2, flex: 1 }}>
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} end={item.to !== "/defi"} style={({ isActive }) => {
              const loc = window.location.pathname;
              const active = isActive || (item.to === "/defi" && loc.startsWith("/defi"));
              return {
                display: "flex", alignItems: "center", padding: "6px 14px", borderRadius: 8,
                background: active ? "rgba(0,229,255,0.08)" : "transparent",
                color: active ? "#00E5FF" : "#9090B0",
                fontSize: 13, fontWeight: active ? 600 : 400,
                textDecoration: "none", transition: "all 0.15s", whiteSpace: "nowrap",
              };
            }}>
              {item.label}
            </NavLink>
          ))}
        </div>
        <div title={syncStatus === "synced" ? "Данные синхронизированы" : syncStatus === "loading" ? "Синхронизация..." : syncStatus === "error" ? "Ошибка синхронизации" : ""}
          style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, transition: "background 0.3s",
            background: syncStatus === "synced" ? "#00E5FF" : syncStatus === "loading" ? "#FFD700" : syncStatus === "error" ? "#FF6450" : C.border,
          }} />
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

function AppInner() {
  const [wishState,     setWishStateRaw]     = useState(() => ls(STORAGE_KEYS.wishes,   {}));
  const [defiPositions, setDefiPositionsRaw] = useState(() => ls(STORAGE_KEYS.defi,    null) || DEFI_INITIAL);
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
      if (defi)   { lsSet(STORAGE_KEYS.defi,     defi);   setDefiPositionsRaw(defi); }
      if (hw)     { lsSet(STORAGE_KEYS.hw,        hw);     setHwCheckedRaw(hw); }
      if (way)    { lsSet(STORAGE_KEYS.way,       way);    setWayDataRaw(way); }
      if (nw)     { lsSet(STORAGE_KEYS.networth,  nw);     setNwDataRaw(nw); }
      setSyncStatus("synced");
    }).catch(() => setSyncStatus("error"));
  }, []);

  const navigate = useNavigate();
  const accent = useAccent();

  return (
    <Shell accent={accent} syncStatus={syncStatus}>
      <Routes>
        <Route path="/" element={<Overview wishState={wishState} defiPositions={defiPositions} defiHw={hwChecked} wayData={wayData} nwData={nwData} onNavigate={(id) => navigate(id === "home" ? "/" : `/${id === "wishes" ? "wishlist" : id}`)} />} />
        <Route path="/way" element={<WayDashboard data={wayData} setData={setWayData} />} />
        <Route path="/wishlist" element={<WishesDashboard wishState={wishState} setWishState={setWishState} />} />
        <Route path="/defi" element={<Navigate to="/defi/portfolio" replace />} />
        <Route path="/defi/:tab" element={<DefiDashboard positions={defiPositions} setPositions={setDefiPositions} hwChecked={hwChecked} setHwChecked={setHwChecked} />} />
        <Route path="/networth" element={<NetWorthDashboard nwData={nwData} setNwData={setNwData} />} />
        <Route path="/setup" element={<SetupDashboard />} />
      </Routes>
    </Shell>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}
