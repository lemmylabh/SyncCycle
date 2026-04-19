"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie } from "recharts";
import {
  UserCheck, Activity, BookOpen, Timer, Heart, LogOut, Globe, UserPlus,
  Smartphone, Monitor, Tablet, Moon, Thermometer, Utensils, MessageCircle,
  X,
} from "lucide-react";

// ─── Traffic interfaces ───────────────────────────────────────────────────────
interface Summary {
  activeUsers: number; newUsers: number; totalUsers: number; sessions: number;
  pageViews: number; engagementRate: number; bounceRate: number;
  avgSessionDuration: number; sessionsPerUser: number;
}
interface TrendPoint { date: string; users: number; sessions: number; views: number; }
interface PageRow { path: string; views: number; users: number; }
interface DeviceRow { device: string; sessions: number; users: number; }
interface AnalyticsData { summary: Summary; trend: TrendPoint[]; pages: PageRow[]; devices: DeviceRow[]; }

// ─── Product interfaces ───────────────────────────────────────────────────────
interface ProductFeatureRow {
  key: string; label: string; entries: number; users: number;
  adoptionPct: number; avgPerUser: number; avgMessagesPerSession?: number;
}
interface ProductUserRow {
  id: string; displayName: string; role: "primary" | "partner";
  accountCreated: string; lastSignIn: string | null; totalLogs: number;
}
interface ProductData {
  totalUsers: number; partnerAccounts: number; onboardingCompleted: number; totalEntries: number;
  activeUsers: number; avgEntriesPerUser: number;
  features: ProductFeatureRow[];
  trend: { date: string; entries: number; loggers: number; fiona: number }[];
  users: ProductUserRow[];
}
interface ProductUserDetail {
  features: { key: string; label: string; entries: number; avgMessagesPerSession?: number }[];
  totalEntries: number; daysActive: number; onboardingCompleted: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const P = { sand: "#eae0cc", almond: "#c9ada1", sage: "#a0a083", olive: "#798478", granite: "#4d6a6d" };
const PALETTE = [P.granite, P.olive, P.sage, P.almond, P.sand, P.granite, P.almond];

const DEVICE_COLORS: Record<string, string> = { desktop: P.granite, mobile: P.almond, tablet: P.sage };
const DEVICE_ICONS: Record<string, React.ReactNode> = {
  desktop: <Monitor size={12} />, mobile: <Smartphone size={12} />, tablet: <Tablet size={12} />,
};

const FEATURE_ICONS: Record<string, React.ReactNode> = {
  mood: <Heart size={14} />, workout: <Activity size={14} />, nutrition: <Utensils size={14} />,
  sleep: <Moon size={14} />, symptoms: <Thermometer size={14} />,
  journal: <BookOpen size={14} />, fiona: <MessageCircle size={14} />,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number) { return n >= 1000 ? (n / 1000).toFixed(1) + "k" : String(n); }
function fmtDuration(s: number) { const m = Math.floor(s / 60), r = Math.round(s % 60); return m > 0 ? `${m}m ${r}s` : `${r}s`; }
function fmtPct(n: number) { return (n * 100).toFixed(1) + "%"; }
function fmtDate(iso: string) { return new Date(iso).toLocaleDateString("en", { month: "short", day: "numeric", year: "2-digit" }); }
function fmtDateShort(iso: string) { return new Date(iso).toLocaleDateString("en", { month: "short", day: "numeric" }); }

// ─── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, iconColor, iconBg }: {
  icon: React.ReactNode; label: string; value: string; sub?: string; iconColor: string; iconBg: string;
}) {
  return (
    <div className="bg-[var(--card-bg)] card-glass rounded-2xl border border-[var(--border)] p-4 flex flex-col gap-3">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: iconBg + "22", color: iconColor }}>
        {icon}
      </div>
      <div>
        <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">{label}</p>
        <p className="text-white text-2xl font-bold">{value}</p>
        {sub && <p className="text-gray-500 text-xs mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Skeletons ────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="flex justify-center px-4 py-5">
      <div className="w-full space-y-4 animate-pulse" style={{ maxWidth: "1100px" }}>
        <div className="h-6 w-32 bg-white/10 rounded" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-28 bg-white/5 rounded-2xl border border-white/5" />)}
        </div>
        <div className="h-64 bg-white/5 rounded-2xl border border-white/5" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-64 bg-white/5 rounded-2xl border border-white/5" />
          <div className="h-64 bg-white/5 rounded-2xl border border-white/5" />
        </div>
      </div>
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-28 bg-white/5 rounded-2xl border border-white/5" />)}
      </div>
      <div className="h-60 bg-white/5 rounded-2xl border border-white/5" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-96 bg-white/5 rounded-2xl border border-white/5" />
        <div className="h-96 bg-white/5 rounded-2xl border border-white/5" />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<"traffic" | "product">("traffic");

  const [productData, setProductData] = useState<ProductData | null>(null);
  const [productError, setProductError] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ProductUserRow | null>(null);
  const [userDetail, setUserDetail] = useState<ProductUserDetail | null>(null);
  const [userDetailLoading, setUserDetailLoading] = useState(false);
  const [userSort, setUserSort] = useState<{ col: "logs" | "created" | "signin"; dir: "asc" | "desc" }>({ col: "logs", dir: "desc" });

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((d) => (d.error ? setError(true) : setData(d)))
      .catch(() => setError(true));
  }, []);

  useEffect(() => {
    if (tab === "product" && !productData && !productError) {
      fetch("/api/analytics/product")
        .then((r) => r.json())
        .then((d) => (d.error ? setProductError(true) : setProductData(d)))
        .catch(() => setProductError(true));
    }
  }, [tab, productData, productError]);

  function openUser(user: ProductUserRow) {
    setSelectedUser(user);
    setUserDetail(null);
    setUserDetailLoading(true);
    fetch(`/api/analytics/product/user/${user.id}`)
      .then((r) => r.json())
      .then((d) => setUserDetail(d.error ? null : d))
      .catch(() => {})
      .finally(() => setUserDetailLoading(false));
  }

  if (!data && !error && tab === "traffic") return <Skeleton />;

  const totalDeviceSessions = data?.devices.reduce((a, d) => a + d.sessions, 0) ?? 0;
  const devicesWithFill = data?.devices.map((d) => ({ ...d, fill: DEVICE_COLORS[d.device] ?? "#6b7280" })) ?? [];
  const maxPageViews = Math.max(...(data?.pages.map((p) => p.views) ?? [1]), 1);

  return (
    <div className="flex justify-center px-4 py-5">
      <div className="w-full space-y-5" style={{ maxWidth: "1100px" }}>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-white text-xl font-bold tracking-tight">Analytics</h1>
            <p className="text-gray-500 text-xs mt-0.5">
              {tab === "traffic" ? "Admin — last 30 days · Google Analytics" : "Admin · Supabase · user activity"}
            </p>
          </div>
          <div className="flex items-center bg-white/5 rounded-xl p-1 gap-1">
            {(["traffic", "product"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="px-4 py-1.5 rounded-lg text-xs font-medium transition-all capitalize"
                style={tab === t ? { background: P.granite, color: "#fff" } : { color: "#6b7280" }}
              >
                {t === "traffic" ? "Traffic" : "Product"}
              </button>
            ))}
          </div>
        </div>

        {/* ── Product Tab ── */}
        {tab === "product" && (
          <>
            {!productData && !productError && <ProductSkeleton />}

            {productError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
                <p className="text-red-400 text-sm font-medium">Failed to load product analytics.</p>
                <p className="text-gray-500 text-xs mt-1">Check Supabase service role credentials and try again.</p>
              </div>
            )}

            {productData && (
              <>
                {/* KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <StatCard
                    icon={<Activity size={15} />} label="Total Entries"
                    value={fmt(productData.totalEntries)} sub="last 30 days"
                    iconColor={P.granite} iconBg={P.granite}
                  />
                  <StatCard
                    icon={<UserCheck size={15} />} label="Active Users"
                    value={fmt(productData.activeUsers)} sub="logged anything"
                    iconColor={P.olive} iconBg={P.olive}
                  />
                  <StatCard
                    icon={<BookOpen size={15} />} label="Avg Logs / User"
                    value={String(productData.avgEntriesPerUser)} sub="per active user"
                    iconColor={P.sage} iconBg={P.sage}
                  />
                  <StatCard
                    icon={<Globe size={15} />} label="Total Users"
                    value={fmt(productData.totalUsers)}
                    sub={`${productData.totalUsers - productData.partnerAccounts} primary · ${productData.partnerAccounts} partner`}
                    iconColor={P.almond} iconBg={P.almond}
                  />
                  <StatCard
                    icon={<UserCheck size={15} />} label="Onboarding Done"
                    value={fmt(productData.onboardingCompleted)}
                    sub={`${productData.totalUsers > 0 ? Math.round((productData.onboardingCompleted / productData.totalUsers) * 100) : 0}% of users`}
                    iconColor={P.sand} iconBg={P.sand}
                  />
                </div>

                {/* Daily Activity Trend */}
                <div className="bg-[var(--card-bg)] card-glass rounded-2xl border border-[var(--border)] p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Last 30 Days</p>
                      <h2 className="text-white text-sm font-semibold">Daily Activity</h2>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full inline-block" style={{ background: P.granite }} /> entries</span>
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full inline-block" style={{ background: P.sand }} /> loggers</span>
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full inline-block" style={{ background: P.sage }} /> fiona</span>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={240} style={{ outline: "none" }}>
                    <LineChart data={productData.trend} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 10 }} interval={4} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 10 }} width={30} />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null;
                          return (
                            <div className="bg-[#0f0f13] border border-white/10 rounded-xl px-3 py-2 text-xs text-white space-y-1">
                              <p className="text-gray-400 mb-1">{label}</p>
                              {payload.map((p) => (
                                <div key={String(p.dataKey)} className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                                  <span className="text-gray-300 capitalize">{String(p.dataKey)}:</span>
                                  <span className="font-semibold">{p.value}</span>
                                </div>
                              ))}
                            </div>
                          );
                        }}
                      />
                      <Line type="monotone" dataKey="entries" stroke={P.granite} strokeWidth={2} dot={false} activeDot={{ r: 5, fill: P.granite }} />
                      <Line type="monotone" dataKey="loggers" stroke={P.sand} strokeWidth={2} dot={false} activeDot={{ r: 5, fill: P.sand }} />
                      <Line type="monotone" dataKey="fiona" stroke={P.sage} strokeWidth={2} dot={false} activeDot={{ r: 5, fill: P.sage }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Feature Breakdown + Users Table */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  {/* Feature Breakdown */}
                  <div className="bg-[var(--card-bg)] card-glass rounded-2xl border border-[var(--border)] p-5">
                    <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Features</p>
                    <h2 className="text-white text-sm font-semibold mb-4">Usage Breakdown</h2>
                    <div className="space-y-4">
                      {productData.features.map((f, i) => {
                        const color = PALETTE[i % PALETTE.length];
                        return (
                          <div key={f.key}>
                            <div className="flex items-center gap-2 mb-1.5">
                              <span style={{ color }}>{FEATURE_ICONS[f.key]}</span>
                              <span className="text-gray-300 text-xs flex-1">{f.label}</span>
                              <span className="text-white text-xs font-semibold">{fmt(f.entries)}</span>
                              <span className="text-gray-600 text-[10px] w-14 text-right">{f.users} users</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${f.adoptionPct}%`, background: color }} />
                              </div>
                              <span className="text-gray-500 text-[10px] w-8 text-right">{f.adoptionPct}%</span>
                            </div>
                            <p className="text-gray-600 text-[10px] mt-0.5">
                              {f.key === "fiona"
                                ? `avg ${f.avgMessagesPerSession ?? 0} msg/session · ${f.avgPerUser} sessions/user`
                                : `avg ${f.avgPerUser} logs/user`}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Users Table */}
                  {(() => {
                    const COLS = "grid-cols-[36px_1fr_68px_44px_76px_76px]";
                    const sorted = [...productData.users].sort((a, b) => {
                      const dir = userSort.dir === "desc" ? -1 : 1;
                      if (userSort.col === "logs") return (b.totalLogs - a.totalLogs) * dir * -1;
                      if (userSort.col === "created") return (new Date(a.accountCreated).getTime() - new Date(b.accountCreated).getTime()) * dir;
                      const aT = a.lastSignIn ? new Date(a.lastSignIn).getTime() : 0;
                      const bT = b.lastSignIn ? new Date(b.lastSignIn).getTime() : 0;
                      return (aT - bT) * dir;
                    });
                    const logsByRank = [...productData.users].sort((a, b) => b.totalLogs - a.totalLogs);
                    const rankMap = new Map(logsByRank.map((u, i) => [u.id, i]));
                    const SortBtn = ({ col, label }: { col: typeof userSort.col; label: string }) => (
                      <button
                        onClick={() => setUserSort(s => s.col === col ? { col, dir: s.dir === "desc" ? "asc" : "desc" } : { col, dir: "desc" })}
                        className={`flex items-center gap-0.5 uppercase tracking-wider text-[10px] font-medium transition-colors ${userSort.col === col ? "text-gray-300" : "text-gray-600 hover:text-gray-400"}`}
                      >
                        {label}
                        <span className="text-[8px] ml-0.5 opacity-60">
                          {userSort.col === col ? (userSort.dir === "desc" ? "▼" : "▲") : "⇅"}
                        </span>
                      </button>
                    );
                    return (
                      <div className="bg-[var(--card-bg)] card-glass rounded-2xl border border-[var(--border)] flex flex-col overflow-hidden">
                        <div className="px-5 pt-5 pb-3 flex-shrink-0">
                          <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Users</p>
                          <h2 className="text-white text-sm font-semibold">All Accounts</h2>
                        </div>
                        {/* Column headers — outside scroll, never overlaps */}
                        <div className={`grid ${COLS} px-5 pb-2 border-b border-white/5 flex-shrink-0 items-center gap-1`}>
                          <span className="text-gray-600 uppercase tracking-wider text-[10px] font-medium">#</span>
                          <span className="text-gray-600 uppercase tracking-wider text-[10px] font-medium">Name</span>
                          <span className="text-gray-600 uppercase tracking-wider text-[10px] font-medium">Role</span>
                          <SortBtn col="logs" label="Logs" />
                          <SortBtn col="created" label="Created" />
                          <SortBtn col="signin" label="Last In" />
                        </div>
                        {/* Scrollable rows */}
                        <div className="overflow-y-auto max-h-[420px]">
                          {sorted.map((u) => {
                            const rank = rankMap.get(u.id) ?? 0;
                            const medal = rank === 0 ? "🥇" : rank === 1 ? "🥈" : rank === 2 ? "🥉" : null;
                            return (
                              <div
                                key={u.id}
                                onClick={() => openUser(u)}
                                className={`grid ${COLS} px-5 py-2.5 border-t border-white/5 cursor-pointer hover:bg-white/5 transition-colors items-center gap-1 text-xs`}
                              >
                                <span className="text-gray-600">{rank + 1}</span>
                                <span className="text-gray-200 truncate flex items-center gap-1.5 min-w-0" title={u.displayName}>
                                  {medal && <span className="text-sm leading-none flex-shrink-0">{medal}</span>}
                                  <span className="truncate">{u.displayName}</span>
                                </span>
                                <span>
                                  {u.role === "partner" ? (
                                    <span className="px-1.5 py-0.5 rounded-md text-[10px] font-medium" style={{ background: P.almond + "22", color: P.almond }}>Partner</span>
                                  ) : (
                                    <span className="px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-white/5 text-gray-500">Primary</span>
                                  )}
                                </span>
                                <span className="text-white font-semibold">{u.totalLogs}</span>
                                <span className="text-gray-500">{fmtDate(u.accountCreated)}</span>
                                <span className="text-gray-500">{u.lastSignIn ? fmtDateShort(u.lastSignIn) : "—"}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                </div>
              </>
            )}
          </>
        )}

        {/* ── Traffic Tab ── */}
        {tab === "traffic" && (
          <>
            {error ? (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
                <p className="text-red-400 text-sm font-medium">Failed to load analytics data.</p>
                <p className="text-gray-500 text-xs mt-1">Check your GA credentials and try again.</p>
              </div>
            ) : data && (
              <>
                {/* KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatCard icon={<UserCheck size={15} />} label="Active Users" value={fmt(data.summary.activeUsers)} sub={`${fmt(data.summary.newUsers)} new`} iconColor={P.granite} iconBg={P.granite} />
                  <StatCard icon={<Activity size={15} />} label="Sessions" value={fmt(data.summary.sessions)} sub={`${data.summary.sessionsPerUser.toFixed(1)} per user`} iconColor={P.olive} iconBg={P.olive} />
                  <StatCard icon={<BookOpen size={15} />} label="Page Views" value={fmt(data.summary.pageViews)} sub={`${(data.summary.pageViews / Math.max(data.summary.sessions, 1)).toFixed(1)} per session`} iconColor={P.sage} iconBg={P.sage} />
                  <StatCard icon={<Timer size={15} />} label="Avg Duration" value={fmtDuration(data.summary.avgSessionDuration)} sub="per session" iconColor={P.almond} iconBg={P.almond} />
                  <StatCard icon={<Heart size={15} />} label="Engagement" value={fmtPct(data.summary.engagementRate)} sub="of sessions" iconColor={P.sand} iconBg={P.sand} />
                  <StatCard icon={<LogOut size={15} />} label="Bounce Rate" value={fmtPct(data.summary.bounceRate)} sub="of sessions" iconColor={P.granite} iconBg={P.granite} />
                  <StatCard icon={<Globe size={15} />} label="Total Users" value={fmt(data.summary.totalUsers)} sub="all time" iconColor={P.olive} iconBg={P.olive} />
                  <StatCard icon={<UserPlus size={15} />} label="New Users" value={fmt(data.summary.newUsers)} sub={`${fmtPct(data.summary.newUsers / Math.max(data.summary.totalUsers, 1))} of total`} iconColor={P.sage} iconBg={P.sage} />
                </div>

                {/* 7-Day Trend */}
                <div className="bg-[var(--card-bg)] card-glass rounded-2xl border border-[var(--border)] p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Last 7 Days</p>
                      <h2 className="text-white text-sm font-semibold">Traffic Trend</h2>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full inline-block" style={{ background: P.sand }} /> views</span>
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full inline-block" style={{ background: P.sage }} /> sessions</span>
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full inline-block" style={{ background: P.granite }} /> users</span>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={260} style={{ outline: "none" }}>
                    <LineChart data={data.trend.slice(-7)} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 10 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 10 }} width={30} />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null;
                          return (
                            <div className="bg-[#0f0f13] border border-white/10 rounded-xl px-3 py-2 text-xs text-white space-y-1">
                              <p className="text-gray-400 mb-1">{label}</p>
                              {payload.map((p) => (
                                <div key={String(p.dataKey)} className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                                  <span className="text-gray-300 capitalize">{String(p.dataKey)}:</span>
                                  <span className="font-semibold">{p.value}</span>
                                </div>
                              ))}
                            </div>
                          );
                        }}
                      />
                      <Line type="monotone" dataKey="views" stroke={P.sand} strokeWidth={2} dot={{ fill: "#0f0f13", stroke: P.sand, strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="sessions" stroke={P.sage} strokeWidth={2} dot={{ fill: "#0f0f13", stroke: P.sage, strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="users" stroke={P.granite} strokeWidth={2} dot={{ fill: "#0f0f13", stroke: P.granite, strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Bottom row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  {/* Top Pages */}
                  <div className="bg-[var(--card-bg)] card-glass rounded-2xl border border-[var(--border)] p-5">
                    <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Top Pages</p>
                    <h2 className="text-white text-sm font-semibold mb-4">By Page Views</h2>
                    <div className="space-y-2">
                      {data.pages.map((page) => (
                        <div key={page.path} className="flex items-center gap-3">
                          <p className="text-gray-400 text-xs truncate w-40 flex-shrink-0" title={page.path}>
                            {page.path === "/" ? "/ (home)" : page.path}
                          </p>
                          <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ background: P.granite, width: `${(page.views / maxPageViews) * 100}%` }} />
                          </div>
                          <p className="text-white text-xs font-medium w-8 text-right flex-shrink-0">{page.views}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Device Breakdown */}
                  <div className="bg-[var(--card-bg)] card-glass rounded-2xl border border-[var(--border)] p-5">
                    <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Devices</p>
                    <h2 className="text-white text-sm font-semibold mb-2">Session Breakdown</h2>
                    <div className="flex items-center gap-4">
                      <ResponsiveContainer width={140} height={140}>
                        <PieChart>
                          <Pie data={devicesWithFill} dataKey="sessions" nameKey="device" cx="50%" cy="50%" innerRadius={42} outerRadius={62} strokeWidth={0} />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (!active || !payload?.length) return null;
                              return (
                                <div className="bg-[#0f0f13] border border-white/10 rounded-xl px-3 py-2 text-xs text-white">
                                  <p className="capitalize">{payload[0]?.name}</p>
                                  <p className="font-semibold">{payload[0]?.value} sessions</p>
                                </div>
                              );
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-col gap-3 flex-1">
                        {data.devices.map((d) => (
                          <div key={d.device} className="flex items-center gap-2">
                            <span style={{ color: DEVICE_COLORS[d.device] ?? "#6b7280" }}>{DEVICE_ICONS[d.device] ?? <Monitor size={12} />}</span>
                            <div className="flex-1">
                              <div className="flex justify-between mb-1">
                                <span className="text-gray-300 text-xs capitalize">{d.device}</span>
                                <span className="text-white text-xs font-semibold">
                                  {totalDeviceSessions > 0 ? Math.round((d.sessions / totalDeviceSessions) * 100) : 0}%
                                </span>
                              </div>
                              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${totalDeviceSessions > 0 ? (d.sessions / totalDeviceSessions) * 100 : 0}%`, background: DEVICE_COLORS[d.device] ?? P.olive }} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {(() => {
                      const totalViews = data.trend.reduce((a, t) => a + t.views, 0);
                      const avgViews = data.trend.length ? Math.round(totalViews / data.trend.length) : 0;
                      const peakViews = Math.max(...data.trend.map((t) => t.views), 0);
                      return (
                        <div className="mt-4 grid grid-cols-3 gap-2">
                          {[{ label: "Total Views", value: fmt(totalViews) }, { label: "Daily Avg", value: fmt(avgViews) }, { label: "Peak Day", value: fmt(peakViews) }].map(({ label, value }) => (
                            <div key={label} className="bg-white/5 rounded-xl p-2.5 text-center">
                              <p className="text-white text-sm font-bold">{value}</p>
                              <p className="text-gray-500 text-[10px] mt-0.5">{label}</p>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                </div>
              </>
            )}
          </>
        )}

      </div>

      {/* Per-User Modal */}
      {selectedUser && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedUser(null); }}
        >
          <div className="bg-[#0a0a0e] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-white/8">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 text-white text-sm font-semibold">
                  {selectedUser.displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{selectedUser.displayName}</p>
                  <p className="text-gray-500 text-xs">all time</p>
                </div>
                {selectedUser.role === "partner" && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-medium" style={{ background: P.almond + "22", color: P.almond }}>Partner</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {userDetail && (
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${userDetail.onboardingCompleted ? "bg-emerald-500/15 text-emerald-400" : "bg-white/5 text-gray-500"}`}>
                    {userDetail.onboardingCompleted ? "✓ Onboarded" : "Not Onboarded"}
                  </span>
                )}
                <button onClick={() => setSelectedUser(null)} className="text-gray-500 hover:text-white transition-colors p-1">
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="p-5">
              {userDetailLoading && (
                <div className="space-y-2 animate-pulse">
                  {Array.from({ length: 7 }).map((_, i) => <div key={i} className="h-8 bg-white/5 rounded-xl" />)}
                </div>
              )}
              {!userDetailLoading && userDetail && (
                <>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-white/5 rounded-xl p-3 text-center">
                      <p className="text-white text-lg font-bold">{userDetail.totalEntries}</p>
                      <p className="text-gray-500 text-[10px] mt-0.5">Total Entries</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 text-center">
                      <p className="text-white text-lg font-bold">{userDetail.daysActive}</p>
                      <p className="text-gray-500 text-[10px] mt-0.5">Days Logged</p>
                    </div>
                  </div>
                  <div className="space-y-0">
                    {userDetail.features.map((f, i) => (
                      <div key={f.key} className="flex items-center gap-3 py-2.5 border-t border-white/5">
                        <span style={{ color: PALETTE[i % PALETTE.length] }}>{FEATURE_ICONS[f.key]}</span>
                        <span className="text-gray-400 text-xs flex-1">{f.label}</span>
                        <span className="text-white text-xs font-semibold">{f.entries}</span>
                        {f.key === "fiona" && (f.avgMessagesPerSession ?? 0) > 0 && (
                          <span className="text-gray-600 text-[10px]">avg {f.avgMessagesPerSession} msg</span>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
              {!userDetailLoading && !userDetail && (
                <p className="text-gray-500 text-xs text-center py-8">No data available.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
