import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import {
  STORAGE_KEYS, WISH_CATEGORIES, DEFI_INITIAL, WAY_INITIAL,
  DEFI_WEEKS, BYBIT_STEPS, TYPE_ICONS, C, BYBIT_PROXY_URL, AI_PROXY_URL, pill
} from './constants'

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

function Overview({ wishState, defiPositions, defiHw, wayData, onNavigate }) {
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
    { id: "way", icon: "🚀", label: "ЦЕЛЬ", title: "1M$ Way", subtitle: "Путь к первому миллиону", progress: wayProgress, stat1: { label: "задач", val: `${wayDone}/${wayData.tasks.length}` }, stat2: { label: "сейчас", val: `$${wayData.currentAmount.toLocaleString()}` }, nextTask: wayNextTask?.text || null, color: "#FFD700" },
    { id: "wishes", icon: "✦", label: "ЛИЧНОЕ", title: "Мои хотелки", subtitle: "Цели · Мечты · Планы", progress: wishPct, stat1: { label: "выполнено", val: `${wishDone}/${wishTotal}` }, stat2: { label: "категорий", val: `${WISH_CATEGORIES.length}` }, nextTask: wishNextTask || null, color: "#7C5CFC" },
    { id: "defi", icon: "₿", label: "КРИПТА · DEFI", title: "DeFi Портфель", subtitle: "Командный центр", progress: defiHwPct, stat1: { label: "P&L", val: `${defiPnl >= 0 ? "+" : ""}$${defiPnl.toFixed(0)}` }, stat2: { label: "в работе", val: `$${defiCurrent.toLocaleString()}` }, nextTask: defiNextTask || null, color: "#00E5FF" },
  ];

  return (
    <div style={{ padding: "32px 28px", maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: 11, color: C.muted, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 8 }}>Мастер-дашборд</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: C.text, letterSpacing: "-0.03em", marginBottom: 6 }}>Обзор всех направлений</h1>
        <p style={{ color: C.muted, fontSize: 13 }}>{new Date().toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })}</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 32 }}>
        {[
          { label: "1M$ прогресс", pct: Math.round(wayProgress), color: "#FFD700" },
          { label: "Цели выполнены", pct: wishPct, color: "#7C5CFC" },
          { label: "DeFi учёба", pct: defiHwPct, color: "#00E5FF" },
        ].map(s => (
          <div key={s.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 18px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div style={{ fontSize: 10, color: C.muted, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8, minHeight: 28 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color, letterSpacing: "-0.02em", marginBottom: 8 }}>{s.pct}%</div>
            <div style={{ height: 3, background: C.border, borderRadius: 2, overflow: "hidden" }}>
              <div style={{ width: `${s.pct}%`, height: "100%", background: s.color, borderRadius: 2, transition: "width 0.6s ease" }} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
        {cards.map(card => (
          <button key={card.id} onClick={() => onNavigate(card.id)}
            style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "22px", textAlign: "left", cursor: "pointer", transition: "all 0.25s", position: "relative", overflow: "hidden" }}
            onMouseEnter={e => { e.currentTarget.style.border = `1px solid ${card.color}55`; e.currentTarget.style.boxShadow = `0 0 30px ${card.color}18`; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.border = `1px solid ${C.border}`; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <div style={{ position: "absolute", top: 0, right: 0, width: 80, height: 80, background: `radial-gradient(circle, ${card.color}18 0%, transparent 70%)`, pointerEvents: "none" }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: card.color, letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 700 }}>{card.label}</div>
              <span style={{ fontSize: 18, color: card.color }}>{card.icon}</span>
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 4 }}>{card.title}</div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 14 }}>{card.subtitle}</div>
            <div style={{ height: 4, background: C.border, borderRadius: 2, overflow: "hidden", marginBottom: 14 }}>
              <div style={{ width: `${card.progress}%`, height: "100%", background: card.color, borderRadius: 2, transition: "width 0.6s ease" }} />
            </div>
            <div style={{ minHeight: 52, marginBottom: 14 }}>
              {card.nextTask ? (
                <div style={{ background: card.color + "11", border: `1px solid ${card.color}22`, borderRadius: 8, padding: "7px 10px" }}>
                  <div style={{ fontSize: 9, color: card.color, letterSpacing: "0.1em", marginBottom: 3, textTransform: "uppercase" }}>▶ Следующий шаг</div>
                  <div style={{ fontSize: 11, color: C.text, lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{card.nextTask}</div>
                </div>
              ) : (
                <div style={{ background: card.color + "08", border: `1px solid ${card.color}15`, borderRadius: 8, padding: "7px 10px" }}>
                  <div style={{ fontSize: 9, color: card.color, letterSpacing: "0.1em", marginBottom: 3, textTransform: "uppercase" }}>▶ Следующий шаг</div>
                  <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.4 }}>Все задачи выполнены 🎉</div>
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <div>
                <div style={{ fontSize: 9, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase" }}>{card.stat1.label}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: card.color }}>{card.stat1.val}</div>
              </div>
              <div style={{ width: 1, background: C.border }} />
              <div>
                <div style={{ fontSize: 9, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase" }}>{card.stat2.label}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{card.stat2.val}</div>
              </div>
            </div>
            <div style={{ position: "absolute", bottom: 14, right: 18, fontSize: 11, color: card.color, opacity: 0.6 }}>→</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function WishesDashboard({ wishState, setWishState }) {
  const [addInputs, setAddInputs] = useState({});
  const total = WISH_CATEGORIES.reduce((s, c) => s + c.items.length, 0);
  const done = WISH_CATEGORIES.reduce((s, c) => s + c.items.filter((_, i) => wishState[c.id]?.[i]?.done).length, 0);

  const toggleItem = (catId, idx, text) => {
    setWishState(prev => {
      const next = { ...prev, [catId]: { ...prev[catId], [idx]: { text, done: !prev[catId]?.[idx]?.done } } };
      lsSet(STORAGE_KEYS.wishes, next);
      return next;
    });
  };

  const addItem = (catId, text) => {
    if (!text.trim()) return;
    setWishState(prev => {
      const nextIdx = `new_${Date.now()}`;
      const next = { ...prev, [catId]: { ...prev[catId], [nextIdx]: { text, done: false } } };
      lsSet(STORAGE_KEYS.wishes, next);
      return next;
    });
    setAddInputs(prev => ({ ...prev, [catId]: "" }));
  };

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 11, color: "#7C5CFC", letterSpacing: "0.15em", fontWeight: 700, marginBottom: 2 }}>ЛИЧНОЕ</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: "-0.02em" }}>Мои хотелки</div>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          {[{ label: "всего", val: total, color: C.text }, { label: "выполнено", val: done, color: "#5cfcb8" }, { label: "осталось", val: total - done, color: "#fcb85c" }].map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 10, color: C.muted }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {WISH_CATEGORIES.map(cat => {
          const extraItems = Object.entries(wishState[cat.id] || {}).filter(([k]) => k.startsWith("new_")).map(([k, v]) => ({ key: k, ...v }));
          const allItems = [...cat.items.map((text, i) => ({ key: i, text: wishState[cat.id]?.[i]?.text ?? text, done: wishState[cat.id]?.[i]?.done ?? false })), ...extraItems];
          const pct = allItems.length ? Math.round((allItems.filter(x => x.done).length / allItems.length) * 100) : 0;
          return (
            <div key={cat.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
              <div style={{ height: 3, background: `linear-gradient(90deg, ${cat.color}, ${cat.color}88)` }} />
              <div style={{ padding: "14px 16px 10px", display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 18 }}>{cat.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: cat.color, textTransform: "uppercase", letterSpacing: "0.05em", flex: 1 }}>{cat.title}</span>
                <span style={{ fontSize: 10, color: C.muted, background: C.surface, borderRadius: 100, padding: "2px 8px" }}>{allItems.filter(x => x.done).length}/{allItems.length}</span>
              </div>
              <div style={{ height: 3, background: C.border, margin: "0 16px" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: `linear-gradient(90deg, ${cat.color}, ${cat.color}99)`, transition: "width 0.4s" }} />
              </div>
              <ul style={{ listStyle: "none", padding: "8px 12px 6px" }}>
                {allItems.map(item => (
                  <li key={item.key} onClick={() => toggleItem(cat.id, item.key, item.text)}
                    style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "7px 4px", cursor: "pointer", borderRadius: 8 }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <div style={{ width: 18, height: 18, borderRadius: 5, flexShrink: 0, marginTop: 1, border: item.done ? "none" : `2px solid ${C.border}`, background: item.done ? cat.color + "44" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
                      {item.done && <span style={{ color: cat.color, fontSize: 10, fontWeight: 900 }}>✓</span>}
                    </div>
                    <span style={{ fontSize: 13, color: item.done ? C.muted : C.text, textDecoration: item.done ? "line-through" : "none", lineHeight: 1.4 }}>{item.text}</span>
                  </li>
                ))}
              </ul>
              <div style={{ padding: "4px 12px 12px", display: "flex", gap: 8 }}>
                <input value={addInputs[cat.id] || ""} onChange={e => setAddInputs(p => ({ ...p, [cat.id]: e.target.value }))} onKeyDown={e => e.key === "Enter" && addItem(cat.id, addInputs[cat.id] || "")} placeholder="Добавить..." style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 10px", color: C.text, fontSize: 12, outline: "none" }} />
                <button onClick={() => addItem(cat.id, addInputs[cat.id] || "")} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 12px", color: cat.color, cursor: "pointer", fontSize: 16, lineHeight: 1 }}>+</button>
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
  const [tab, setTab] = useState("portfolio");
  const [openWeek, setOpenWeek] = useState(0);
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
  const [aiNews, setAiNews] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAsked, setAiAsked] = useState(false);
  const [bybit, setBybit] = useState(null);
  const [bybitLoading, setBybitLoading] = useState(false);
  const [bybitError, setBybitError] = useState(null);

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
        setBybit({ totalEquity: parseFloat(account.totalEquity), coins });
      } else { setBybitError(data.retMsg); }
    } catch (e) { setBybitError(e.message); }
    setBybitLoading(false);
  };

  useEffect(() => { fetchBybit(); }, []);

  const toggleHw = (key) => {
    const next = { ...hwChecked, [key]: !hwChecked[key] };
    setHwChecked(next); lsSet(STORAGE_KEYS.hw, next);
  };

  const updatePosition = (id, updates) => setPositions(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));

  const totalAllocated = positions.reduce((s, p) => s + p.allocated, 0);
  const totalCurrent = positions.reduce((s, p) => s + p.current, 0);
  const totalPnl = totalCurrent - totalAllocated;
  const avgApy = positions.filter(p => p.apy > 0).reduce((s, p, _, arr) => s + p.apy / arr.length, 0);
  const defiTotal = DEFI_WEEKS.reduce((s, w) => s + w.tasks.length, 0);
  const hwDone = Object.values(hwChecked).filter(Boolean).length;
  const sentColor = { bull: "#76FF03", bear: "#FF1744", neutral: "#00E5FF" };

  const fetchAI = async () => {
    setAiLoading(true); setAiAsked(true);
    try {
      const res = await fetch(AI_PROXY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: "Топ-5 актуальных тем в DeFi: Aave, Aerodrome, Lombard BTCfi, Pendle, Berachain, Sonic. Кратко." }],
        }),
      });
      const data = await res.json();
      setAiNews(JSON.parse((data.content?.[0]?.text || "[]").replace(/```json|```/g, "").trim()));
    } catch {
      setAiNews([
        { title: "Aave v3 на Base растёт", summary: "TVL превысил $500M, ставки по USDC 8-12%", tag: "Lending", sentiment: "bull" },
        { title: "Aerodrome доминирует на Base", summary: "Крупнейший DEX на Base по объёму", tag: "DEX", sentiment: "bull" },
        { title: "BTCfi набирает обороты", summary: "Lombard и Solv суммарно >$2B TVL", tag: "BTCfi", sentiment: "bull" },
        { title: "Pendle — фиксированная доходность", summary: "PT-USDC ~11% фиксированных", tag: "Yield", sentiment: "neutral" },
        { title: "Berachain PoL механика", summary: "Proof of Liquidity привлекает протоколы", tag: "L1", sentiment: "bull" },
      ]);
    }
    setAiLoading(false);
  };

  return (
    <div style={{ paddingBottom: 40 }}>
      <div style={{ padding: "16px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.border}` }}>
        <div>
          <div style={{ fontSize: 11, color: "#00E5FF", letterSpacing: "0.15em", fontWeight: 700, marginBottom: 2 }}>// DEFI КОМАНДНЫЙ ЦЕНТР</div>
          <div style={{ fontSize: 12, color: C.muted }}>Мой DeFi Портфель</div>
        </div>
        <div style={{ fontFamily: "monospace", fontSize: 13, color: "#00E5FF" }}>{time.toLocaleTimeString("ru-RU")}</div>
      </div>

      <div style={{ padding: "12px 28px", background: "rgba(255,215,0,0.03)", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: bybit ? "#76FF03" : bybitLoading ? "#FFD700" : "#FF1744", boxShadow: `0 0 6px ${bybit ? "#76FF03" : bybitLoading ? "#FFD700" : "#FF1744"}` }} />
          <span style={{ fontSize: 10, color: C.muted, letterSpacing: "0.12em" }}>BYBIT · UNIFIED</span>
        </div>
        {bybitLoading && <span style={{ fontSize: 11, color: "#FFD700" }}>загружаю...</span>}
        {bybitError && <span style={{ fontSize: 11, color: "#FF1744" }}>Ошибка: {bybitError}</span>}
        {bybit && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, color: C.muted }}>Итого:</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#FFD700" }}>${bybit.totalEquity.toFixed(2)}</span>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {bybit.coins.map(c => (
                <div key={c.coin} style={{ background: "rgba(255,215,0,0.06)", border: "1px solid rgba(255,215,0,0.15)", borderRadius: 6, padding: "3px 10px", display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 10, color: "#FFD700", fontWeight: 700 }}>{c.coin}</span>
                  <span style={{ fontSize: 10, color: C.muted }}>${parseFloat(c.usdValue).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <button onClick={fetchBybit} style={{ marginLeft: "auto", background: "transparent", border: `1px solid ${C.border}`, borderRadius: 6, padding: "3px 10px", color: C.muted, fontSize: 10, cursor: "pointer" }}>↻ Обновить</button>
          </>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, padding: "16px 28px", borderBottom: `1px solid ${C.border}` }}>
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
        {[{ id: "portfolio", label: "ПОРТФЕЛЬ" }, { id: "homework", label: "ДОМАШКА" }, { id: "notes", label: "ЗАМЕТКИ" }, { id: "radar", label: "AI РАДАР" }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, maxWidth: 140, background: tab === t.id ? "rgba(0,229,255,0.08)" : "transparent", border: tab === t.id ? "1px solid rgba(0,229,255,0.2)" : `1px solid ${C.border}`, borderRadius: 8, color: tab === t.id ? "#00E5FF" : C.muted, fontSize: 10, padding: "8px 0", cursor: "pointer", letterSpacing: "0.1em" }}>
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

        {tab === "radar" && (
          <div style={{ background: "rgba(0,229,255,0.03)", border: "1px solid rgba(0,229,255,0.12)", borderRadius: 12, padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <span style={{ fontFamily: "monospace", fontSize: 11, color: "#00E5FF", letterSpacing: 2 }}>// AI РАДАР</span>
              <button onClick={fetchAI} disabled={aiLoading} style={{ background: aiLoading ? "rgba(0,229,255,0.05)" : "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.3)", borderRadius: 6, color: "#00E5FF", fontFamily: "monospace", fontSize: 10, padding: "5px 12px", cursor: aiLoading ? "wait" : "pointer" }}>
                {aiLoading ? "СКАНИРУЮ..." : aiAsked ? "ОБНОВИТЬ" : "СКАНИРОВАТЬ"}
              </button>
            </div>
            {!aiAsked && <div style={{ textAlign: "center", padding: "24px 0", color: "rgba(255,255,255,0.2)", fontFamily: "monospace", fontSize: 11 }}>нажми СКАНИРОВАТЬ для AI-анализа рынка</div>}
            {aiNews.map((item, i) => (
              <div key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", padding: "12px 0", display: "flex", gap: 12 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: sentColor[item.sentiment], marginTop: 5, flexShrink: 0, boxShadow: `0 0 6px ${sentColor[item.sentiment]}` }} />
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ color: "#fff", fontSize: 13, fontWeight: 500 }}>{item.title}</span>
                    <span style={{ background: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.15)", borderRadius: 4, padding: "1px 6px", fontSize: 9, color: "#00E5FF", fontFamily: "monospace" }}>{item.tag}</span>
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, lineHeight: 1.5 }}>{item.summary}</div>
                </div>
              </div>
            ))}
          </div>
        )}
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
          <div style={{ fontSize: 11, color: "#FFD700", letterSpacing: "0.15em", fontWeight: 700, marginBottom: 2 }}>🚀 ЦЕЛЬ</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.text, letterSpacing: "-0.02em" }}>1M$ Way</div>
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

const accentByPath = { "/": "#6C63FF", "/way": "#FFD700", "/wishlist": "#7C5CFC", "/defi": "#00E5FF" };

const navItems = [
  { to: "/way", label: "1M$ Way", color: "#FFD700" },
  { to: "/wishlist", label: "Wishlist", color: "#7C5CFC" },
  { to: "/defi", label: "DeFi", color: "#00E5FF" },
];

function Shell({ children, accent }) {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'DM Mono', 'Courier New', monospace", overflowX: "hidden" }}>
      <div style={{ position: "sticky", top: 0, zIndex: 100, background: C.surface, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", padding: "0 16px", height: 48, gap: 8 }}>
        <button onClick={() => navigate("/")} style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg, #7C5CFC, #00E5FF)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, color: "#fff", cursor: "pointer", flexShrink: 0 }}>D</button>
        <div style={{ display: "flex", gap: 2, flex: 1 }}>
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} style={({ isActive }) => ({
              display: "flex", alignItems: "center", padding: "5px 12px", borderRadius: 7,
              background: isActive ? item.color + "18" : "transparent",
              color: isActive ? item.color : "#9090B0",
              fontSize: 11, fontWeight: isActive ? 700 : 500,
              textDecoration: "none", transition: "all 0.2s", whiteSpace: "nowrap",
              letterSpacing: "0.04em", textShadow: isActive ? `0 0 12px ${item.color}88` : "none",
            })}>
              {item.label}
            </NavLink>
          ))}
        </div>
        <div style={{ width: 5, height: 5, borderRadius: "50%", background: accent, boxShadow: `0 0 8px ${accent}`, flexShrink: 0 }} />
      </div>
      <div className="fade-in">{children}</div>
    </div>
  );
}

function AppInner() {
  const [wishState, setWishState] = useState(() => ls(STORAGE_KEYS.wishes, {}));
  const [defiPositions, setDefiPositions] = useState(() => ls(STORAGE_KEYS.defi, null) || DEFI_INITIAL);
  useEffect(() => { lsSet(STORAGE_KEYS.defi, defiPositions); }, [defiPositions]);
  const [hwChecked, setHwChecked] = useState(() => ls(STORAGE_KEYS.hw, {}));
  const [wayData, setWayData] = useState(() => ls(STORAGE_KEYS.way, WAY_INITIAL));
  useEffect(() => { lsSet(STORAGE_KEYS.way, wayData); }, [wayData]);

  const navigate = useNavigate();
  const path = window.location.pathname;
  const accent = accentByPath[path] || "#6C63FF";

  return (
    <Shell accent={accent}>
      <Routes>
        <Route path="/" element={<Overview wishState={wishState} defiPositions={defiPositions} defiHw={hwChecked} wayData={wayData} onNavigate={(id) => navigate(id === "home" ? "/" : `/${id === "wishes" ? "wishlist" : id}`)} />} />
        <Route path="/way" element={<WayDashboard data={wayData} setData={setWayData} />} />
        <Route path="/wishlist" element={<WishesDashboard wishState={wishState} setWishState={setWishState} />} />
        <Route path="/defi" element={<DefiDashboard positions={defiPositions} setPositions={setDefiPositions} hwChecked={hwChecked} setHwChecked={setHwChecked} />} />
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
