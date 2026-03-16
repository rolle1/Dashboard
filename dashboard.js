import { useState, useEffect, useCallback } from "react";

// ── SCHEDULE DATA ──────────────────────────────────────────────
const SCHEDULE = [
  { time: "07:00", end: "07:30", label: "Wake Up & Hydrate",        icon: "☀️", block: "MORNING"    },
  { time: "07:30", end: "08:00", label: "Prayer · Meditation · Journal", icon: "🙏", block: "MORNING" },
  { time: "08:00", end: "08:45", label: "Get Ready + Breakfast",    icon: "🍳", block: "MORNING"    },
  { time: "08:45", end: "09:00", label: "Commute",                  icon: "🚗", block: "TRANSIT"    },
  { time: "09:00", end: "13:00", label: "Work — Deep Focus",        icon: "💼", block: "WORK"       },
  { time: "13:00", end: "13:45", label: "Lunch Break",              icon: "🥗", block: "WORK"       },
  { time: "13:45", end: "17:00", label: "Work — Afternoon",         icon: "💼", block: "WORK"       },
  { time: "17:00", end: "17:30", label: "Commute Home",             icon: "🎧", block: "TRANSIT"    },
  { time: "17:30", end: "18:45", label: "GYM",                      icon: "💪", block: "GYM"        },
  { time: "18:45", end: "19:15", label: "Shower + Dinner",          icon: "🍽️", block: "EVENING"   },
  { time: "19:15", end: "20:45", label: "Study Block",              icon: "📚", block: "STUDY"      },
  { time: "20:45", end: "21:30", label: "Meal Prep",                icon: "🥣", block: "PREP"       },
  { time: "21:30", end: "22:15", label: "Wind-Down",                icon: "🌙", block: "WIND"       },
  { time: "22:15", end: "23:59", label: "Sleep",                    icon: "😴", block: "SLEEP"      },
];

const BLOCK_COLORS = {
  MORNING: "#F59E0B", TRANSIT: "#6B7280", WORK: "#3B82F6",
  GYM: "#EF4444", EVENING: "#10B981", STUDY: "#8B5CF6",
  PREP: "#F97316", WIND: "#A78BFA", SLEEP: "#475569",
};

// ── AZ-104 TOPICS ──────────────────────────────────────────────
const AZ_TOPICS = [
  { id: "t1", week: "Wk 1–2", label: "Azure Identity & Governance" },
  { id: "t2", week: "Wk 1–2", label: "Entra ID, RBAC & Policies" },
  { id: "t3", week: "Wk 3–4", label: "Azure Storage Accounts" },
  { id: "t4", week: "Wk 3–4", label: "Virtual Machines & Availability" },
  { id: "t5", week: "Wk 5–6", label: "VNets, NSGs & Peering" },
  { id: "t6", week: "Wk 5–6", label: "Load Balancers & VPN Gateway" },
  { id: "t7", week: "Wk 7",   label: "Azure Monitor & Log Analytics" },
  { id: "t8", week: "Wk 7",   label: "Defender, Backup & Cost Mgmt" },
  { id: "t9", week: "Wk 8",   label: "Practice Exams (×2/day)" },
];

// ── GITHUB PROJECTS ────────────────────────────────────────────
const PROJECTS_DEFAULT = [
  {
    id: "p1", title: "Entra ID + Intune Automation",
    stages: ["Repo created", "Scripts drafted", "Graph API integrated", "README written", "Published"],
    stage: 0,
  },
  {
    id: "p2", title: "Azure Infrastructure with Terraform",
    stages: ["Repo created", "VNet + NSG deployed", "VMs + Bastion added", "GitHub Actions CI/CD", "Monitoring + README"],
    stage: 0,
  },
  {
    id: "p3", title: "Zero Trust / Identity Security Lab",
    stages: ["Repo created", "Terraform base done", "Conditional Access set", "PIM + Defender enabled", "Writeup published"],
    stage: 0,
  },
];

// ── HELPERS ────────────────────────────────────────────────────
function toMins(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function getCurrentBlock(now) {
  const mins = now.getHours() * 60 + now.getMinutes();
  return SCHEDULE.find(s => mins >= toMins(s.time) && mins < toMins(s.end)) || SCHEDULE[SCHEDULE.length - 1];
}
function fmtTime(d) {
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
}
function fmtDate(d) {
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}
function blockPct(block, now) {
  const cur = now.getHours() * 60 + now.getMinutes();
  const s = toMins(block.time), e = toMins(block.end);
  if (e <= s) return 100;
  return Math.min(100, Math.max(0, ((cur - s) / (e - s)) * 100));
}

// ── DEFAULT STATE ──────────────────────────────────────────────
const DEFAULT_STATE = {
  gymStreak: 0,
  lastGymDate: null,
  gymLog: [],
  az104: {},
  examDate: "",
  projects: PROJECTS_DEFAULT,
};

// ── STYLES ────────────────────────────────────────────────────
const S = {
  bg:       "#07070E",
  surface:  "#0E0E1A",
  card:     "#12121F",
  border:   "#1E1E35",
  purple:   "#9333EA",
  purpleL:  "#A855F7",
  purpleDim:"#2D1B69",
  text:     "#E2E8F0",
  muted:    "#4B5563",
  dim:      "#94A3B8",
};

const cardStyle = {
  background: S.card,
  border: `1px solid ${S.border}`,
  borderRadius: 16,
  padding: "20px 22px",
};

export default function Dashboard() {
  const [now, setNow] = useState(new Date());
  const [data, setData] = useState(DEFAULT_STATE);
  const [loaded, setLoaded] = useState(false);
  const [gymFeedback, setGymFeedback] = useState("");

  // ── LOAD ──
  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get("edwin-dashboard");
        if (res?.value) {
          const saved = JSON.parse(res.value);
          setData({ ...DEFAULT_STATE, ...saved, projects: saved.projects || PROJECTS_DEFAULT });
        }
      } catch (_) {}
      setLoaded(true);
    })();
  }, []);

  // ── SAVE ──
  const save = useCallback(async (next) => {
    setData(next);
    try { await window.storage.set("edwin-dashboard", JSON.stringify(next)); } catch (_) {}
  }, []);

  // ── CLOCK ──
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!loaded) return (
    <div style={{ background: S.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ color: S.purple, fontFamily: "monospace", fontSize: 14 }}>loading dashboard…</span>
    </div>
  );

  const block = getCurrentBlock(now);
  const pct   = blockPct(block, now);
  const bColor = BLOCK_COLORS[block.block] || S.purple;

  // ── GYM CHECK-IN ──
  function gymCheckIn() {
    const today = now.toDateString();
    if (data.lastGymDate === today) {
      setGymFeedback("Already checked in today 💪");
      setTimeout(() => setGymFeedback(""), 2500);
      return;
    }
    const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
    const streak = data.lastGymDate === yesterday.toDateString() ? data.gymStreak + 1 : 1;
    save({ ...data, gymStreak: streak, lastGymDate: today, gymLog: [today, ...(data.gymLog || [])].slice(0, 30) });
    setGymFeedback(`Day ${streak} 🔥 Streak locked in!`);
    setTimeout(() => setGymFeedback(""), 3000);
  }

  // ── AZ TOGGLE ──
  function toggleTopic(id) {
    const az = { ...data.az104, [id]: !data.az104[id] };
    save({ ...data, az104: az });
  }

  const azDone = Object.values(data.az104).filter(Boolean).length;
  const azPct  = Math.round((azDone / AZ_TOPICS.length) * 100);

  // ── EXAM DAYS LEFT ──
  let daysLeft = null;
  if (data.examDate) {
    const diff = Math.ceil((new Date(data.examDate) - now) / 86400000);
    daysLeft = diff;
  }

  // ── PROJECT ADVANCE ──
  function advanceProject(id) {
    const projects = data.projects.map(p =>
      p.id === id && p.stage < p.stages.length - 1 ? { ...p, stage: p.stage + 1 } : p
    );
    save({ ...data, projects });
  }
  function regressProject(id) {
    const projects = data.projects.map(p =>
      p.id === id && p.stage > 0 ? { ...p, stage: p.stage - 1 } : p
    );
    save({ ...data, projects });
  }

  const checkedToday = data.lastGymDate === now.toDateString();

  return (
    <div style={{ background: S.bg, minHeight: "100vh", padding: "28px 20px", fontFamily: "'Syne', sans-serif", color: S.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #07070E; } ::-webkit-scrollbar-thumb { background: #2D1B69; border-radius: 2px; }
        .glow { box-shadow: 0 0 24px rgba(147,51,234,0.15), 0 0 1px rgba(147,51,234,0.4); }
        .btn { cursor: pointer; border: none; font-family: 'Syne', sans-serif; font-weight: 600; transition: all 0.15s; }
        .btn:hover { filter: brightness(1.15); transform: translateY(-1px); }
        .btn:active { transform: translateY(0); }
        .topic-row { display: flex; align-items: center; gap: 10px; padding: 7px 10px; border-radius: 8px; cursor: pointer; transition: background 0.1s; }
        .topic-row:hover { background: rgba(147,51,234,0.08); }
        .sched-row { display: flex; align-items: center; gap: 10px; padding: 6px 8px; border-radius: 8px; transition: background 0.1s; }
        .sched-row.active-row { background: rgba(147,51,234,0.12); border: 1px solid rgba(147,51,234,0.25); }
        .proj-stage { height: 6px; border-radius: 3px; flex: 1; transition: background 0.3s; }
        .fade-in { animation: fadeUp 0.4s ease both; }
        @keyframes fadeUp { from { opacity:0; transform: translateY(12px); } to { opacity:1; transform: translateY(0); } }
        .pulse { animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
      `}</style>

      <div style={{ maxWidth: 960, margin: "0 auto" }}>

        {/* ── TOP BAR ── */}
        <div className="fade-in" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: S.muted, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 6 }}>
              edwin.obiorah / dashboard
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1 }}>
              Good {now.getHours() < 12 ? "Morning" : now.getHours() < 17 ? "Afternoon" : "Evening"},<br />
              <span style={{ color: S.purpleL }}>Edwin.</span>
            </h1>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 500, color: S.text, letterSpacing: "0.03em" }}>{fmtTime(now)}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: S.muted, marginTop: 4 }}>{fmtDate(now)}</div>
          </div>
        </div>

        {/* ── CURRENT BLOCK HERO ── */}
        <div className="fade-in glow" style={{ ...cardStyle, marginBottom: 20, borderColor: bColor + "44", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${bColor}18, ${bColor}08)`, transition: "width 1s linear", borderRadius: 16 }} />
          <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: bColor, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 6 }}>
                ● NOW ACTIVE
              </div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{block.icon} {block.label}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: S.muted, marginTop: 4 }}>
                {block.time} – {block.end}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 32, fontWeight: 300, color: bColor }}>{Math.round(pct)}%</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: S.muted }}>block complete</div>
            </div>
          </div>
          <div style={{ marginTop: 14, height: 3, background: S.border, borderRadius: 2 }}>
            <div style={{ height: "100%", width: `${pct}%`, background: bColor, borderRadius: 2, transition: "width 1s linear" }} />
          </div>
        </div>

        {/* ── 2 COL GRID ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>

          {/* ── GYM STREAK ── */}
          <div className="fade-in" style={{ ...cardStyle, animationDelay: "0.1s" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: S.muted, textTransform: "uppercase", letterSpacing: "0.15em" }}>Gym Streak</span>
              <span style={{ fontSize: 10, background: checkedToday ? "#14532D" : S.purpleDim, color: checkedToday ? "#4ADE80" : S.purpleL, padding: "3px 10px", borderRadius: 20, fontFamily: "'JetBrains Mono', monospace" }}>
                {checkedToday ? "✓ checked in" : "not checked in"}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 56, fontWeight: 800, color: "#EF4444", lineHeight: 1 }}>{data.gymStreak}</span>
              <span style={{ color: S.muted, fontSize: 14 }}>days</span>
            </div>
            <div style={{ color: S.muted, fontSize: 12, fontFamily: "'JetBrains Mono', monospace", marginBottom: 16 }}>
              {data.lastGymDate ? `last: ${new Date(data.lastGymDate).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}` : "no sessions yet"}
            </div>

            {/* Last 7 days dots */}
            <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
              {Array.from({ length: 7 }).map((_, i) => {
                const d = new Date(now); d.setDate(d.getDate() - (6 - i));
                const hit = (data.gymLog || []).includes(d.toDateString());
                return <div key={i} style={{ flex: 1, height: 6, borderRadius: 3, background: hit ? "#EF4444" : S.border }} />;
              })}
            </div>

            <button className="btn" onClick={gymCheckIn} style={{
              width: "100%", padding: "11px", borderRadius: 10, fontSize: 13,
              background: checkedToday ? S.border : "linear-gradient(135deg, #7C3AED, #DC2626)",
              color: checkedToday ? S.muted : "#fff",
            }}>
              {checkedToday ? "✓ Session Logged" : "💪 Log Today's Session"}
            </button>
            {gymFeedback && <div style={{ marginTop: 8, textAlign: "center", fontSize: 12, color: "#4ADE80", fontFamily: "'JetBrains Mono', monospace" }}>{gymFeedback}</div>}
          </div>

          {/* ── AZ-104 PROGRESS ── */}
          <div className="fade-in" style={{ ...cardStyle, animationDelay: "0.15s" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: S.muted, textTransform: "uppercase", letterSpacing: "0.15em" }}>AZ-104 Progress</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: S.purpleL, fontWeight: 600 }}>{azPct}%</span>
            </div>

            {/* Exam date input */}
            <div style={{ display: "flex", gap: 6, marginBottom: 12, alignItems: "center" }}>
              <span style={{ fontSize: 11, color: S.muted, fontFamily: "'JetBrains Mono', monospace", whiteSpace: "nowrap" }}>exam date:</span>
              <input
                type="date"
                value={data.examDate || ""}
                onChange={e => save({ ...data, examDate: e.target.value })}
                style={{ flex: 1, background: S.surface, border: `1px solid ${S.border}`, color: S.text, borderRadius: 6, padding: "4px 8px", fontSize: 11, fontFamily: "'JetBrains Mono', monospace", outline: "none" }}
              />
              {daysLeft !== null && (
                <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: daysLeft <= 14 ? "#F97316" : "#4ADE80", whiteSpace: "nowrap" }}>
                  {daysLeft}d left
                </span>
              )}
            </div>

            <div style={{ height: 4, background: S.border, borderRadius: 2, marginBottom: 12 }}>
              <div style={{ height: "100%", width: `${azPct}%`, background: "linear-gradient(90deg, #7C3AED, #A855F7)", borderRadius: 2, transition: "width 0.4s ease" }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 1, maxHeight: 210, overflowY: "auto" }}>
              {AZ_TOPICS.map(t => (
                <div key={t.id} className="topic-row" onClick={() => toggleTopic(t.id)}>
                  <div style={{
                    width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                    border: `1.5px solid ${data.az104[t.id] ? S.purple : S.border}`,
                    background: data.az104[t.id] ? S.purple : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#fff", transition: "all 0.15s"
                  }}>
                    {data.az104[t.id] ? "✓" : ""}
                  </div>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: S.muted, width: 46, flexShrink: 0 }}>{t.week}</span>
                  <span style={{ fontSize: 12, color: data.az104[t.id] ? S.muted : S.text, textDecoration: data.az104[t.id] ? "line-through" : "none", transition: "color 0.15s" }}>{t.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── GITHUB PROJECTS ── */}
        <div className="fade-in" style={{ ...cardStyle, marginBottom: 16, animationDelay: "0.2s" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: S.muted, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 16 }}>GitHub Projects</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {data.projects.map(p => {
              const pPct = Math.round((p.stage / (p.stages.length - 1)) * 100);
              const done = p.stage === p.stages.length - 1;
              return (
                <div key={p.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: done ? "#4ADE80" : S.text }}>{done ? "✓ " : ""}{p.title}</span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: S.purple, marginLeft: 10 }}>
                        → {p.stages[p.stage]}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn" onClick={() => regressProject(p.id)} style={{ background: S.surface, border: `1px solid ${S.border}`, color: S.muted, borderRadius: 6, padding: "4px 10px", fontSize: 12 }}>−</button>
                      <button className="btn" onClick={() => advanceProject(p.id)} disabled={done} style={{ background: done ? S.border : S.purpleDim, border: `1px solid ${done ? S.border : S.purple}`, color: done ? S.muted : S.purpleL, borderRadius: 6, padding: "4px 10px", fontSize: 12 }}>+</button>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {p.stages.map((st, i) => (
                      <div key={i} title={st} className="proj-stage" style={{
                        background: i <= p.stage ? (done ? "#16A34A" : S.purple) : S.border
                      }} />
                    ))}
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: S.muted, marginTop: 4 }}>
                    {p.stage}/{p.stages.length - 1} stages · {pPct}% complete
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── TODAY'S FULL SCHEDULE ── */}
        <div className="fade-in" style={{ ...cardStyle, animationDelay: "0.25s" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: S.muted, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 14 }}>Today's Schedule</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
            {SCHEDULE.map((s, i) => {
              const isActive = block === s;
              const past = toMins(s.end) < now.getHours() * 60 + now.getMinutes();
              const c = BLOCK_COLORS[s.block] || S.purple;
              return (
                <div key={i} className={`sched-row ${isActive ? "active-row" : ""}`}>
                  <div style={{ width: 3, height: 28, borderRadius: 2, background: past ? S.border : isActive ? c : c + "55", flexShrink: 0, transition: "background 0.3s" }} />
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: S.muted, width: 44, flexShrink: 0 }}>{s.time}</div>
                  <div style={{ fontSize: 11, color: past ? S.muted : isActive ? S.text : S.dim, fontWeight: isActive ? 600 : 400 }}>
                    {isActive && <span className="pulse" style={{ color: c, marginRight: 4 }}>●</span>}
                    {s.icon} {s.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 20, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: S.muted }}>
          edwin.obiorah · personal os · data saved locally
        </div>
      </div>
    </div>
  );
}
