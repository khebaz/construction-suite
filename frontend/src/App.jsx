import { useState, useEffect, useCallback } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { api, setAuth, loadAuth, getToken, getUser } from "./api";
import {
  SiteReportsPage, EquipmentPage, MaterialsPage, AttendancePage,
  FinancialPage, SafetyPage, DocumentsPage, ReportsPage, SettingsPage, ProjectsPage,
} from "./ModulePages";
import "./App.css";

const T = {
  charcoal: "#1C1F26", surface: "#242830", panel: "#2C3040",
  border: "#363C4E", orange: "#E8621A", orangeDim: "#9E3F0A",
  concrete: "#F2EDE6", muted: "#8B94A8", tarmac: "#3D4A5C",
  green: "#2D7A4F", greenDim: "#1A4A30", amber: "#D4920A",
  amberDim: "#7A5206", red: "#C0392B", text: "#E8EAF0", textSoft: "#A8B0C0",
};

function StatusPill({ status }) {
  const map = {
    in_progress: { label: "In Progress", bg: T.orangeDim, text: T.orange },
    not_started: { label: "Not Started", bg: T.tarmac, text: T.textSoft },
    achieved: { label: "Achieved", bg: T.greenDim, text: T.green },
    pending: { label: "Pending", bg: "#2a2a2a", text: T.muted },
    approved: { label: "Approved", bg: T.greenDim, text: T.green },
    active: { label: "Active", bg: T.orangeDim, text: T.orange },
    completed: { label: "Completed", bg: T.greenDim, text: T.green },
    planning: { label: "Planning", bg: T.tarmac, text: T.textSoft },
    mobilising: { label: "Mobilising", bg: T.amberDim, text: T.amber },
    on_hold: { label: "On Hold", bg: T.amberDim, text: T.amber },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
      textTransform: "uppercase", padding: "2px 8px", borderRadius: 3,
      background: s.bg, color: s.text,
    }}>{s.label}</span>
  );
}

function ChainageBar({ project, sections }) {
  if (!project || !sections?.length) return null;
  const totalKm = project.total_length_km || 1;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: T.muted, fontFamily: "monospace" }}>
          km {project.start_chainage || 0}+000
        </span>
        <span style={{ fontSize: 11, color: T.orange, fontWeight: 700 }}>
          {project.completion_pct}% complete
        </span>
        <span style={{ fontSize: 11, color: T.muted, fontFamily: "monospace" }}>
          km {project.end_chainage || totalKm}+000
        </span>
      </div>
      <div style={{ position: "relative", height: 28, borderRadius: 4, overflow: "hidden",
        background: "#181B22", border: `1px solid ${T.border}` }}>
        {sections.map((s, i) => {
          const secLen = s.length_km || 1;
          const leftPct = sections.slice(0, i).reduce((a, x) => a + (x.length_km || 1), 0) / totalKm * 100;
          const widthPct = secLen / totalKm * 100;
          return (
            <div key={s.id || i} title={`${s.section_name}: ${s.completion_pct}%`} style={{
              position: "absolute", top: 0, bottom: 0,
              left: `${leftPct}%`, width: `${widthPct}%`,
              borderRight: i < sections.length - 1 ? `1px solid #181B22` : "none",
            }}>
              <div style={{
                position: "absolute", top: 0, bottom: 0, left: 0,
                width: `${s.completion_pct}%`,
                background: s.status === "in_progress" ? T.orange : s.status === "completed" ? T.green : T.tarmac,
                opacity: 0.85, transition: "width 1s ease",
              }} />
              <div style={{
                position: "absolute", inset: 0, display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 9, fontWeight: 700, letterSpacing: "0.06em",
                color: s.completion_pct > 40 ? T.charcoal : T.textSoft,
                pointerEvents: "none", zIndex: 1, fontFamily: "monospace",
              }}>{Math.round(s.completion_pct)}%</div>
            </div>
          );
        })}
        {[0, 25, 50, 75, 100].map(p => (
          <div key={p} style={{
            position: "absolute", top: 0, bottom: 0, left: `${p}%`,
            width: 1, background: "rgba(255,255,255,0.08)",
          }} />
        ))}
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
        {sections.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{
              width: 10, height: 10, borderRadius: 2,
              background: s.status === "in_progress" ? T.orange : s.status === "completed" ? T.green : T.tarmac,
              border: `1px solid ${T.border}`,
            }} />
            <span style={{ fontSize: 11, color: T.textSoft }}>
              {s.section_name} <span style={{ color: T.muted }}>(km {s.chainage_start}–{s.chainage_end})</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: T.panel, border: `1px solid ${T.border}`,
      borderRadius: 6, padding: "8px 12px", fontSize: 12,
    }}>
      <div style={{ color: T.muted, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontWeight: 600 }}>
          {p.name}: {p.value}%
        </div>
      ))}
    </div>
  );
};

const navItems = [
  { icon: "\u25C9", label: "Dashboard", key: "dashboard" },
  { icon: "\uD83D\uDCCD", label: "Projects", key: "projects" },
  { icon: "\uD83D\uDCCB", label: "Site Reports", key: "site-reports" },
  { icon: "\uD83D\uDE9C", label: "Equipment", key: "equipment" },
  { icon: "\uD83D\uDCE6", label: "Materials", key: "materials" },
  { icon: "\uD83D\uDC77", label: "Attendance", key: "attendance" },
  { icon: "\uD83D\uDCB0", label: "Financial", key: "financial" },
  { icon: "\uD83D\uDDD1\uFE0F", label: "Safety", key: "safety" },
  { icon: "\uD83D\uDCC4", label: "Documents", key: "documents" },
  { icon: "\uD83D\uDCCA", label: "Reports", key: "reports" },
  { icon: "\u2699\uFE0F", label: "Settings", key: "settings" },
];

const roleTabs = {
  administrator:   ["dashboard","projects","site-reports","equipment","materials","attendance","financial","safety","documents","reports","settings"],
  project_manager: ["dashboard","projects","site-reports","equipment","materials","attendance","financial","safety","documents","reports"],
  site_engineer:   ["dashboard","projects","site-reports","equipment","materials","attendance","safety","documents","reports"],
  foreman:         ["dashboard","projects","attendance","safety","reports"],
  storekeeper:     ["dashboard","materials","reports"],
  equipment_manager: ["dashboard","equipment","reports"],
  accountant:      ["dashboard","financial","reports"],
  client:          ["dashboard","projects","reports"],
};

function Sidebar({ user, activeTab, onTabChange, onLogout, company }) {
  const myTabs = roleTabs[user?.role] || ["dashboard"];
  const visibleNav = navItems.filter(n => myTabs.includes(n.key));

  return (
    <div style={{
      width: 220, flexShrink: 0, background: T.charcoal,
      borderRight: `1px solid ${T.border}`,
      display: "flex", flexDirection: "column",
      height: "100vh", position: "sticky", top: 0,
    }}>
      <div style={{ padding: "20px 20px 16px", borderBottom: `1px solid ${T.border}` }}>
        <div onClick={() => onTabChange("dashboard")} style={{
          cursor: "pointer", fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 15, fontWeight: 800, letterSpacing: "0.12em",
          textTransform: "uppercase", color: T.orange, lineHeight: 1.1, display: "flex", alignItems: "center", gap: 8,
        }}>
          {company?.logo ? (
            <img src={company.logo} alt="" style={{ height: 28, borderRadius: 3 }} />
          ) : null}
          <div>
            {company?.company_name?.toUpperCase() || "CONSTRUCT"}<br />
            <span style={{ color: T.concrete, fontSize: 13 }}>MANAGER</span>
          </div>
        </div>
        <div style={{ fontSize: 10, color: T.muted, marginTop: 4, letterSpacing: "0.06em" }}>
          {company?.email || "DIRD \u00B7 BOTSWANA"} {company?.phone ? `\u00B7 ${company.phone}` : ""}
        </div>
      </div>

      <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
        {visibleNav.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <div key={item.key} onClick={() => onTabChange(item.key)} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "9px 12px", borderRadius: 6, marginBottom: 2,
              cursor: "pointer",
              background: isActive ? T.surface : "transparent",
              borderLeft: isActive ? `3px solid ${T.orange}` : "3px solid transparent",
            }}>
              <span style={{ fontSize: 14 }}>{item.icon}</span>
              <span style={{
                fontSize: 13, fontWeight: isActive ? 600 : 400,
                color: isActive ? T.text : T.muted,
                fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.04em",
              }}>{item.label}</span>
            </div>
          );
        })}
      </nav>

      <div style={{
        padding: "12px 16px", borderTop: `1px solid ${T.border}`,
        display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
      }} onClick={onLogout}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%", background: T.orange,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0,
        }}>
          {user?.full_name?.split(" ").map(w => w[0]).join("").slice(0, 2) || "?"}
        </div>
        <div>
          <div style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>{user?.full_name}</div>
          <div style={{ fontSize: 10, color: T.muted }}>{user?.role?.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}</div>
        </div>
      </div>
    </div>
  );
}



function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.login(email, password);
      setAuth(data.access_token, { full_name: data.full_name, email: data.email, role: data.role, user_id: data.user_id });
      onLogin();
    } catch (err) {
      setError("Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: T.charcoal, color: T.text, fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800&family=Inter:wght@400;500;600;700&display=swap');`}</style>
      <form onSubmit={handleSubmit} style={{
        background: T.surface, padding: 40, borderRadius: 12,
        border: `1px solid ${T.border}`, width: 380,
      }}>
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800,
          letterSpacing: "0.1em", textTransform: "uppercase", color: T.orange, marginBottom: 4,
        }}>CONSTRUCT MANAGER</div>
        <div style={{ fontSize: 12, color: T.muted, marginBottom: 24 }}>DIRD \u00B7 Botswana \u2014 Sign In</div>
        {error && <div style={{ color: T.red, fontSize: 12, marginBottom: 12 }}>{error}</div>}
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
          style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: `1px solid ${T.border}`,
            background: T.charcoal, color: T.text, fontSize: 13, marginBottom: 12, outline: "none" }} />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
          style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: `1px solid ${T.border}`,
            background: T.charcoal, color: T.text, fontSize: 13, marginBottom: 20, outline: "none" }} />
        <button type="submit" disabled={loading} style={{
          width: "100%", padding: "10px", borderRadius: 6, border: "none",
          background: loading ? T.border : T.orange, color: "#fff",
          fontSize: 13, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
        }}>{loading ? "Signing in..." : "Sign In"}</button>
        <div style={{ fontSize: 11, color: T.muted, marginTop: 16, textAlign: "center", lineHeight: 1.6 }}>
          Demo: admin@construction.bw / Admin@1234
        </div>
      </form>
    </div>
  );
}

function DashboardShell({ children, user, activeTab, onTabChange, onLogout, company }) {
  return (
    <div style={{
      display: "flex", minHeight: "100vh",
      background: T.charcoal, color: T.text,
      fontFamily: "'Inter', system-ui, sans-serif", fontSize: 13,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 2px; }
      `}</style>
      <Sidebar user={user} activeTab={activeTab} onTabChange={onTabChange} onLogout={onLogout} company={company} />
      <div style={{ flex: 1, overflowY: "auto" }}>
        {children}
      </div>
    </div>
  );
}

function AdminDashboardView({ onNavigate }) {
  const [project, setProject] = useState(null);
  const [sections, setSections] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [projects, setProjects] = useState([]);
  const [moduleData, setModuleData] = useState({});
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [projList, stats, siteReports, equipment, materials, attendance, financial, safety, documents, reports] = await Promise.all([
        api.getProjects(), api.getProjectStats(),
        api.siteReports.list(), api.equipment.list(), api.materials.list(),
        api.attendance.list(), api.financial.list(), api.safety.list(),
        api.documents.list(), api.reports.list(),
      ]);
      setProjects(projList);
      setModuleData({
        "site-reports": Array.isArray(siteReports) ? siteReports.slice(0, 3) : [],
        "equipment": Array.isArray(equipment) ? equipment.slice(0, 3) : [],
        "materials": Array.isArray(materials) ? materials.slice(0, 3) : [],
        "attendance": Array.isArray(attendance) ? attendance.slice(0, 3) : [],
        "financial": Array.isArray(financial) ? financial.slice(0, 3) : [],
        "safety": Array.isArray(safety) ? safety.slice(0, 3) : [],
        "documents": Array.isArray(documents) ? documents.slice(0, 3) : [],
        "reports": Array.isArray(reports) ? reports.slice(0, 3) : [],
      });
      if (projList.length > 0) {
        const p = projList[0];
        const [detail, secs, mstones] = await Promise.all([
          api.getProject(p.id),
          api.getSections(p.id),
          api.getMilestones(p.id),
        ]);
        setProject({ ...detail, ...stats, daysRemaining: Math.ceil((new Date(detail.planned_end) - new Date()) / (1000 * 60 * 60 * 24)) });
        setSections(secs);
        setMilestones(mstones);
      }
    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return <div style={{ padding: 40, color: T.muted, textAlign: "center" }}>Loading admin dashboard...</div>;

  if (!project) return (
    <div style={{ padding: 40, color: T.muted, textAlign: "center" }}>
      No projects found. Create one from the Projects page first.
    </div>
  );

  const totalKm = project.total_length_km || 1;
  const progressData = [
    { week: "Wk 1", planned: 3, actual: project.completion_pct > 10 ? 2 : 0 },
    { week: "Wk 2", planned: 6, actual: project.completion_pct > 15 ? 5 : 0 },
    { week: "Wk 3", planned: 10, actual: project.completion_pct > 15 ? 8 : 0 },
    { week: "Wk 4", planned: 15, actual: project.completion_pct > 15 ? 12 : 0 },
    { week: "Wk 5", planned: 20, actual: project.completion_pct > 12 ? 17 : 0 },
    { week: "Wk 6", planned: 26, actual: Math.round(project.completion_pct * 0.7) },
  ];

  const kpis = [
    { label: "Contract Value", value: project.contract_value ? `BWP ${(project.contract_value / 1e6).toFixed(1)}M` : "N/A", sub: project.project_number || "", accent: T.orange },
    { label: "Road Completed", value: `${(totalKm * project.completion_pct / 100).toFixed(1)} km`, sub: `of ${totalKm} km total`, accent: T.green },
    { label: "Days Remaining", value: String(project.daysRemaining || "?"), sub: `Est. ${new Date(project.planned_end).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`, accent: T.amber },
    { label: "Status", value: project.status?.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase()), sub: `${project.active_projects || 1} active project(s)`, accent: T.tarmac },
  ];

  const alerts = [];
  if (project.completion_pct < 10) alerts.push({ type: "info", msg: "Project recently started. Tracking progress from next report." });
  sections.filter(s => s.status === "not_started").forEach(s => {
    if (alerts.length < 3) alerts.push({ type: "warning", msg: `${s.section_name} — not yet started.` });
  });

  return (
    <div style={{ padding: "28px 28px 40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif", fontSize: 26, fontWeight: 800,
            letterSpacing: "0.04em", textTransform: "uppercase", color: T.text, lineHeight: 1,
          }}>Project Dashboard</div>
          <div style={{ fontSize: 12, color: T.muted, marginTop: 5 }}>
            {project.name} \u00B7 {project.district || project.location}
          </div>
        </div>
        <StatusPill status={project.status} />
      </div>

      {alerts.length > 0 && (
        <div style={{ background: T.surface, border: `1px solid ${T.amberDim}`, borderRadius: 8, padding: "12px 16px", marginBottom: 20 }}>
          {alerts.map((a, i) => (
            <div key={i} style={{
              display: "flex", gap: 10, alignItems: "center",
              paddingBottom: i < alerts.length - 1 ? 10 : 0,
              marginBottom: i < alerts.length - 1 ? 10 : 0,
              borderBottom: i < alerts.length - 1 ? `1px solid ${T.border}` : "none",
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                background: a.type === "warning" ? T.amberDim : T.tarmac,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
              }}>{a.type === "warning" ? "\u26A0" : "\u2139"}</div>
              <span style={{ fontSize: 12, color: a.type === "warning" ? T.amber : T.textSoft }}>{a.msg}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
        {kpis.map((k, i) => (
          <div key={i} style={{
            background: T.surface, borderRadius: 8, border: `1px solid ${T.border}`,
            padding: "16px 18px", borderTop: `3px solid ${k.accent}`,
          }}>
            <div style={{ fontSize: 11, color: T.muted, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 }}>{k.label}</div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 30, fontWeight: 800, color: k.accent, lineHeight: 1 }}>{k.value}</div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 5 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ background: T.surface, borderRadius: 8, border: `1px solid ${T.border}`, padding: "18px 20px", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 700,
              letterSpacing: "0.06em", textTransform: "uppercase", color: T.text,
            }}>Road Progress — Chainage View</div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
              {project.project_number} · {totalKm} km total
            </div>
          </div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, color: T.orange }}>
            {Math.round(project.completion_pct)}% <span style={{ fontSize: 13, color: T.muted, fontWeight: 400 }}>overall</span>
          </div>
        </div>
        <ChainageBar project={project} sections={sections} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, marginBottom: 20 }}>
        <div style={{ background: T.surface, borderRadius: 8, border: `1px solid ${T.border}`, padding: "18px 20px" }}>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 700,
            letterSpacing: "0.06em", textTransform: "uppercase", color: T.text, marginBottom: 16,
          }}>Weekly Progress (% Complete)</div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={progressData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="plannedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={T.tarmac} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={T.tarmac} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={T.orange} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={T.orange} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={T.border} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="week" tick={{ fill: T.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: T.muted, fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="planned" name="Planned" stroke={T.tarmac} strokeWidth={2} fill="url(#plannedGrad)" strokeDasharray="5 3" />
              <Area type="monotone" dataKey="actual" name="Actual" stroke={T.orange} strokeWidth={2.5} fill="url(#actualGrad)" />
            </AreaChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 20, height: 2, background: T.tarmac, borderTop: "2px dashed" + T.tarmac }} />
              <span style={{ fontSize: 11, color: T.muted }}>Planned</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 20, height: 2, background: T.orange }} />
              <span style={{ fontSize: 11, color: T.muted }}>Actual</span>
            </div>
          </div>
        </div>

        <div style={{ background: T.surface, borderRadius: 8, border: `1px solid ${T.border}`, padding: "18px 20px" }}>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 700,
            letterSpacing: "0.06em", textTransform: "uppercase", color: T.text, marginBottom: 16,
          }}>Section Status</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sections.slice(0, 5).map((s, i) => (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 11, color: T.textSoft }}>{s.section_name?.split("—")[0]?.trim() || s.section_name}</span>
                  <span style={{ fontSize: 11, color: s.completion_pct > 0 ? T.orange : T.muted, fontWeight: 600 }}>
                    {Math.round(s.completion_pct)}%
                  </span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: T.border }}>
                  <div style={{
                    height: "100%", borderRadius: 3,
                    width: `${s.completion_pct}%`,
                    background: s.completion_pct > 0 ? T.orange : T.tarmac,
                    transition: "width 1s ease",
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ background: T.surface, borderRadius: 8, border: `1px solid ${T.border}`, padding: "18px 20px" }}>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 700,
            letterSpacing: "0.06em", textTransform: "uppercase", color: T.text, marginBottom: 16,
          }}>Milestones</div>
          {milestones.slice(0, 6).map((m, i) => (
            <div key={m.id || i} style={{
              display: "flex", alignItems: "center", gap: 12,
              paddingBottom: 12, marginBottom: 12,
              borderBottom: i < Math.min(milestones.length, 6) - 1 ? `1px solid ${T.border}` : "none",
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                background: m.status === "achieved" ? T.greenDim : m.status === "in_progress" ? T.orangeDim : T.surface,
                border: `2px solid ${m.status === "achieved" ? T.green : m.status === "in_progress" ? T.orange : T.border}`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12,
              }}>
                {m.status === "achieved" ? "\u2713" : m.status === "in_progress" ? "\u25CF" : "\u25CB"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.title}</div>
                <div style={{ fontSize: 11, color: T.muted }}>Due {new Date(m.due_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</div>
              </div>
              <StatusPill status={m.status} />
            </div>
          ))}
        </div>

        <div style={{ background: T.surface, borderRadius: 8, border: `1px solid ${T.border}`, padding: "18px 20px" }}>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 700,
            letterSpacing: "0.06em", textTransform: "uppercase", color: T.text, marginBottom: 16,
          }}>All Projects</div>
          {projects.map((p, i) => (
            <div key={p.id} style={{
              paddingBottom: 12, marginBottom: 12,
              borderBottom: i < projects.length - 1 ? `1px solid ${T.border}` : "none",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{p.name}</span>
                <StatusPill status={p.status} />
              </div>
              <div style={{ display: "flex", gap: 16 }}>
                <span style={{ fontSize: 11, color: T.muted }}>{p.project_number}</span>
                <span style={{ fontSize: 11, color: T.muted }}>{p.location}</span>
                <span style={{ fontSize: 11, color: T.orange, fontWeight: 600 }}>{Math.round(p.completion_pct)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 700,
          letterSpacing: "0.06em", textTransform: "uppercase", color: T.text, marginBottom: 14,
        }}>Module Overview <span style={{ color: T.muted, fontWeight: 400 }}>— Recent Records</span></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {[
            { key: "site-reports", icon: "📋", label: "Site Reports", fields: ["report_date","weather","status"] },
            { key: "equipment", icon: "🚜", label: "Equipment", fields: ["name","equipment_type","status"] },
            { key: "materials", icon: "📦", label: "Materials", fields: ["name","category","quantity"] },
            { key: "attendance", icon: "👷", label: "Attendance", fields: ["worker_name","date","hours_worked"] },
            { key: "financial", icon: "💰", label: "Financial", fields: ["description","category","amount"] },
            { key: "safety", icon: "🛡️", label: "Safety", fields: ["incident_type","severity","location"] },
            { key: "documents", icon: "📄", label: "Documents", fields: ["name","doc_type","tags"] },
            { key: "reports", icon: "📊", label: "Reports", fields: ["name","report_type","status"] },
          ].map(mod => {
            const items = moduleData[mod.key] || [];
            return (
              <div key={mod.key} style={{
                background: T.surface, borderRadius: 8, border: `1px solid ${T.border}`,
                padding: 14, display: "flex", flexDirection: "column",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.text, display: "flex", alignItems: "center", gap: 5 }}>
                    {mod.icon} {mod.label}
                  </div>
                  <span style={{ fontSize: 10, color: T.muted }}>{items.length} / {moduleData[mod.key]?.length || 0}</span>
                </div>
                {items.length === 0 ? (
                  <div style={{ fontSize: 11, color: T.muted, padding: "6px 0" }}>No records</div>
                ) : items.slice(0, 3).map((item, i) => (
                  <div key={item.id || i} style={{
                    padding: "6px 0", borderTop: i > 0 ? `1px solid ${T.border}` : "none",
                    fontSize: 11, color: T.textSoft, lineHeight: 1.4,
                  }}>
                    {mod.fields.map(f => {
                      const val = item[f];
                      if (f === "amount") return <div key={f} style={{ fontWeight: 600, color: T.text }}>{val ? `BWP ${Number(val).toLocaleString()}` : "—"}</div>;
                      if (f === "report_date" || f === "date") return <div key={f}>{val ? new Date(val).toLocaleDateString("en-GB") : "—"}</div>;
                      if (f === "quantity") return <div key={f}>{val != null ? `${Number(val).toFixed(1)} ${item.unit || ""}` : "—"}</div>;
                      if (f === "hours_worked") return <div key={f}>{val != null ? `${val.toFixed(1)} hrs` : "—"}</div>;
                      if (val && typeof val === "string" && val.length > 28) return <div key={f}>{val.slice(0, 28)}...</div>;
                      if (f === "status") return <span key={f} style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "1px 5px", borderRadius: 2, background: T.tarmac, color: T.textSoft }}>{val || "—"}</span>;
                      return <div key={f}>{val || "—"}</div>;
                    })}
                  </div>
                ))}
                <div style={{ marginTop: "auto", paddingTop: 8, textAlign: "right" }}>
                  <span onClick={() => onNavigate?.(mod.key)} style={{
                    fontSize: 10, color: T.orange, cursor: "pointer", fontWeight: 600, letterSpacing: "0.04em",
                  }}>View All →</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StaffDashboardView({ user }) {
  const [projects, setProjects] = useState([]);
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const roleLabel = user?.role?.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

  const loadData = useCallback(async () => {
    try {
      const [projList, reports] = await Promise.all([api.getProjects(), api.siteReports.list()]);
      setProjects(Array.isArray(projList) ? projList : []);
      setRecentReports(Array.isArray(reports) ? reports.slice(0, 5) : []);
    } catch (_) {} finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const cardBase = { background: T.surface, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 };
  const btn = { padding: "8px 18px", borderRadius: 6, border: "none", background: T.orange, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 };

  if (loading) return <div style={{ padding: 40, color: T.muted, textAlign: "center" }}>Loading dashboard...</div>;

  return (
    <div style={{ padding: "28px 28px 40px" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif", fontSize: 26, fontWeight: 800,
          letterSpacing: "0.04em", textTransform: "uppercase", color: T.text, lineHeight: 1,
        }}>Good {new Date().getHours() < 12 ? "Morning" : "Afternoon"}, {user?.full_name?.split(" ")[0]}</div>
        <div style={{ fontSize: 12, color: T.muted, marginTop: 5 }}>
          {roleLabel} Dashboard — {projects.length} active project{projects.length !== 1 ? "s" : ""}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}>
        <div style={{ ...cardBase, borderTop: `3px solid ${T.orange}` }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>📋 Submit Site Report</div>
          <div style={{ fontSize: 11, color: T.muted, marginBottom: 14 }}>Record daily site progress, weather, and observations</div>
          <button onClick={() => document.querySelector("[data-tab='site-reports']")?.click() || alert("Go to Site Reports tab")} style={btn}>+ New Report</button>
        </div>
        <div style={{ ...cardBase, borderTop: `3px solid ${T.green}` }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>👷 Log Attendance</div>
          <div style={{ fontSize: 11, color: T.muted, marginBottom: 14 }}>Record daily crew attendance and labour hours</div>
          <button onClick={() => alert("Go to Attendance tab")} style={btn}>+ Log Today</button>
        </div>
        <div style={{ ...cardBase, borderTop: `3px solid ${T.red}` }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>⚠️ Report Safety Issue</div>
          <div style={{ fontSize: 11, color: T.muted, marginBottom: 14 }}>Report hazards, near misses, or incidents on site</div>
          <button onClick={() => alert("Go to Safety tab")} style={btn}>+ New Report</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={cardBase}>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 700,
            letterSpacing: "0.06em", textTransform: "uppercase", color: T.text, marginBottom: 14,
          }}>Recent Site Reports</div>
          {recentReports.length === 0 ? (
            <div style={{ fontSize: 12, color: T.muted }}>No reports yet.</div>
          ) : recentReports.map((r, i) => (
            <div key={r.id || i} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "8px 0", borderBottom: i < recentReports.length - 1 ? `1px solid ${T.border}` : "none",
            }}>
              <div>
                <div style={{ fontSize: 12, color: T.text, fontWeight: 500 }}>{r.title || r.report_type}</div>
                <div style={{ fontSize: 11, color: T.muted }}>{r.location ? r.location + " · " : ""}{new Date(r.report_date || r.created_at).toLocaleDateString("en-GB")}</div>
              </div>
              <StatusPill status={r.status || "draft"} />
            </div>
          ))}
        </div>

        <div style={cardBase}>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 700,
            letterSpacing: "0.06em", textTransform: "uppercase", color: T.text, marginBottom: 14,
          }}>Active Projects</div>
          {projects.length === 0 ? (
            <div style={{ fontSize: 12, color: T.muted }}>No active projects.</div>
          ) : projects.map((p, i) => (
            <div key={p.id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "8px 0", borderBottom: i < projects.length - 1 ? `1px solid ${T.border}` : "none",
            }}>
              <div>
                <div style={{ fontSize: 12, color: T.text, fontWeight: 500 }}>{p.name}</div>
                <div style={{ fontSize: 11, color: T.muted }}>{p.project_number} · {p.location}</div>
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.orange }}>{Math.round(p.completion_pct)}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DashboardPage({ user, onNavigate }) {
  const adminRoles = ["administrator", "project_manager", "accountant"];
  const isAdmin = adminRoles.includes(user?.role);
  if (isAdmin) return <AdminDashboardView onNavigate={onNavigate} />;
  return <StaffDashboardView user={user} />;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [company, setCompany] = useState(null);

  useEffect(() => {
    const saved = loadAuth();
    if (saved) setUser(saved);
  }, []);

  const loadCompany = useCallback(async () => {
    try { setCompany(await api.getCompanySettings()); } catch (_) {}
  }, []);

  useEffect(() => {
    if (user) loadCompany();
  }, [user, loadCompany]);

  if (!user) return <LoginPage onLogin={() => setUser(getUser())} />;

  const handleTabChange = (tab) => {
    const allowed = roleTabs[user?.role] || ["dashboard"];
    setActiveTab(allowed.includes(tab) ? tab : "dashboard");
  };
  const handleLogout = () => { setAuth(null, null); setUser(null); };

  const pages = {
    "dashboard": <DashboardPage user={user} onNavigate={handleTabChange} />,
    "projects": <ProjectsPage />,
    "site-reports": <SiteReportsPage />,
    "equipment": <EquipmentPage />,
    "materials": <MaterialsPage />,
    "attendance": <AttendancePage />,
    "financial": <FinancialPage company={company} />,
    "safety": <SafetyPage />,
    "documents": <DocumentsPage company={company} />,
    "reports": <ReportsPage company={company} />,
    "settings": <SettingsPage user={user} onCompanyUpdate={loadCompany} company={company} />,
  };

  return (
    <DashboardShell user={user} activeTab={activeTab} onTabChange={handleTabChange} onLogout={handleLogout} company={company}>
      {pages[activeTab] || <DashboardPage />}
    </DashboardShell>
  );
}
