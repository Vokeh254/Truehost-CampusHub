"use client";

import { PageShell } from "@/components/dashboard/page-header";
import { trpc } from "@/lib/trpc";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import {
  Users, Building2, ClipboardCheck, Clock,
  BookOpen, FolderOpen, Trophy, Mic2, ArrowRight,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { formatDate, timeAgo } from "@/lib/utils";
import Link from "next/link";

// Shared section header
function SectionHeader({ title, sub, href, linkLabel }: { title: string; sub?: string; href?: string; linkLabel?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
      <div>
        <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>{title}</p>
        {sub && <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "1px" }}>{sub}</p>}
      </div>
      {href && (
        <Link href={href}>
          <Button variant="ghost" size="sm" style={{ fontSize: "11px", color: "var(--accent)" }}>
            {linkLabel ?? "View all"} <ArrowRight style={{ width: "11px", height: "11px" }} />
          </Button>
        </Link>
      )}
    </div>
  );
}

// Status pill
function Pill({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    APPROVED:  { bg: "#e8f8f3", color: "#0d7a56" },
    PENDING:   { bg: "#fef9ec", color: "#92580d" },
    REJECTED:  { bg: "#fdf1f2", color: "#b91c1c" },
    ACTIVE:    { bg: "#e8f8f3", color: "#0d7a56" },
    CONFIRMED: { bg: "#eff8ff", color: "#0369a1" },
  };
  const s = map[status] ?? { bg: "#f0f3fb", color: "#374151" };
  return (
    <span style={{ fontSize: "10px", fontWeight: 500, padding: "2px 7px", borderRadius: "4px", background: s.bg, color: s.color }}>
      {status}
    </span>
  );
}

export default function AdminDashboard() {
  const { data: overview, isLoading } = trpc.reports.adminOverview.useQuery();
  const { data: trends } = trpc.reports.activityTrends.useQuery();
  const { data: pending } = trpc.activities.list.useQuery({ status: "PENDING", limit: 5 });
  const { data: followUps } = trpc.media.followUpsDue.useQuery();
  const { data: topAmbassadors } = trpc.leaderboards.topAmbassadors.useQuery({ limit: 5 });

  const o = overview as any;

  if (isLoading) {
    return (
      <div style={{ padding: "24px 28px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px" }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ height: "90px", borderRadius: "var(--radius)", background: "#e8ecf5" }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 28px" }}>

      {/* Page header */}
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>
          Good morning, Admin
        </h1>
        <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
          Here's what's happening with the Campus Builders programme today.
        </p>
      </div>

      {/* KPI row 1 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px", marginBottom: "12px" }}>
        <StatCard title="Total Ambassadors"   value={o?.totalAmbassadors ?? 0}
          icon={Users}        iconColor="#3b5bdb" iconBg="#eff3fe" />
        <StatCard title="Active Ambassadors"  value={o?.activeAmbassadors ?? 0}
          icon={Users}        iconColor="#0d9f6e" iconBg="#e8f8f3"
          change={o ? `${Math.round((o.activeAmbassadors / Math.max(o.totalAmbassadors,1))*100)}% rate` : ""}
          changeType="positive" />
        <StatCard title="University Chapters" value={o?.totalChapters ?? 0}
          icon={Building2}    iconColor="#7c3aed" iconBg="#f5f3ff" />
        <StatCard title="Pending Approvals"   value={o?.pendingActivities ?? 0}
          icon={Clock}        iconColor="#d97706" iconBg="#fef9ec"
          change={o?.pendingActivities > 0 ? "Needs review" : "All clear"}
          changeType={o?.pendingActivities > 0 ? "negative" : "positive"} />
      </div>

      {/* KPI row 2 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px", marginBottom: "20px" }}>
        <StatCard title="Approved Activities"  value={o?.totalActivities ?? 0}
          icon={ClipboardCheck} iconColor="#0369a1" iconBg="#eff8ff" />
        <StatCard title="Workshops Completed"  value={o?.totalWorkshops ?? 0}
          icon={BookOpen}       iconColor="#3b5bdb" iconBg="#eff3fe" />
        <StatCard title="Student Projects"     value={o?.totalProjects ?? 0}
          icon={FolderOpen}     iconColor="#be185d" iconBg="#fdf2f8" />
        <StatCard title="Verified Referrals"   value={o?.totalReferrals ?? 0}
          icon={Trophy}         iconColor="#b45309" iconBg="#fef9ec" />
      </div>

      {/* Main content grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "16px", marginBottom: "16px" }}>

        {/* Activity trend chart */}
        <div style={{ background: "#fff", borderRadius: "var(--radius)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", padding: "16px 18px" }}>
          <SectionHeader title="Activity Trends" sub="Submissions vs approvals — last 6 months" />
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={trends ?? []} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b5bdb" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#3b5bdb" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gS" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0d9f6e" stopOpacity={0.1} />
                  <stop offset="100%" stopColor="#0d9f6e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f3f8" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#8c9ab0" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#8c9ab0" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ border: "1px solid var(--border)", borderRadius: "8px", fontSize: "11px", boxShadow: "var(--shadow-md)" }}
                cursor={{ stroke: "#e4e8f0", strokeWidth: 1 }}
              />
              <Area type="monotone" dataKey="approved" name="Approved" stroke="#3b5bdb" strokeWidth={1.5} fill="url(#gA)" dot={false} activeDot={{ r: 3 }} />
              <Area type="monotone" dataKey="submitted" name="Submitted" stroke="#0d9f6e" strokeWidth={1.5} fill="url(#gS)" dot={false} activeDot={{ r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top ambassadors */}
        <div style={{ background: "#fff", borderRadius: "var(--radius)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", padding: "16px 18px" }}>
          <SectionHeader title="Top Ambassadors" sub="By verified points" href="/admin/leaderboards" />
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {(topAmbassadors as any[])?.slice(0, 5).map((amb: any, i: number) => (
              <div key={amb.id} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ width: "16px", fontSize: "11px", fontWeight: 700, color: i < 3 ? "#3b5bdb" : "var(--text-muted)", flexShrink: 0, textAlign: "center" }}>
                  {i + 1}
                </span>
                <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: "#eff3fe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, color: "#3b5bdb", flexShrink: 0 }}>
                  {amb.user.firstName[0]}{amb.user.lastName[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {amb.user.firstName} {amb.user.lastName}
                  </p>
                  <p style={{ fontSize: "10px", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {amb.memberships?.[0]?.chapter?.institution?.name ?? amb.institution?.name}
                  </p>
                </div>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)", flexShrink: 0 }}>
                  {amb.totalPoints.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

        {/* Pending approvals */}
        <div style={{ background: "#fff", borderRadius: "var(--radius)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", padding: "16px 18px" }}>
          <SectionHeader title="Pending Activity Approvals" sub={`${o?.pendingActivities ?? 0} submissions waiting`} href="/admin/activities" />
          {!(pending as any)?.submissions?.length ? (
            <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text-muted)", fontSize: "12px" }}>
              No pending submissions
            </div>
          ) : (
            <div>
              {(pending as any).submissions.map((s: any, i: number) => (
                <Link key={s.id} href={`/admin/activities/${s.id}`} style={{ textDecoration: "none" }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    padding: "9px 0",
                    borderTop: i === 0 ? "none" : "1px solid var(--border)",
                    cursor: "pointer",
                  }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.8")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {s.title}
                      </p>
                      <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "1px" }}>
                        {s.ambassador.user.firstName} {s.ambassador.user.lastName} · {s.activityType.name}
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                      <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{timeAgo(s.createdAt)}</span>
                      <Pill status="PENDING" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Media follow-ups */}
          <div style={{ background: "#fff", borderRadius: "var(--radius)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", padding: "16px 18px" }}>
            <SectionHeader title="Media Follow-ups Due" sub={`${(followUps as any[])?.length ?? 0} outstanding`} href="/admin/media/followups" />
            {!(followUps as any[])?.length ? (
              <p style={{ textAlign: "center", padding: "16px 0", fontSize: "12px", color: "var(--text-muted)" }}>No follow-ups pending</p>
            ) : (
              <div>
                {(followUps as any[]).slice(0, 3).map((f: any, i: number) => (
                  <div key={f.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", padding: "9px 0", borderTop: i === 0 ? "none" : "1px solid var(--border)" }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {f.mediaOpportunity?.organisation?.name ?? f.event?.name ?? "Unknown"}
                      </p>
                      <p style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                        {f.channel} · {formatDate(f.followUpDate)}
                      </p>
                    </div>
                    <span style={{ fontSize: "10px", fontWeight: 500, padding: "2px 7px", borderRadius: "4px", background: "#fdf1f2", color: "#e02d3c", flexShrink: 0 }}>
                      Overdue
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "10px" }}>
            {[
              { label: "Certificates", value: o?.totalCertificates ?? 0 },
              { label: "Media Orgs",   value: o?.totalMediaOrgs ?? 0 },
              { label: "Community",    value: o?.nationalCommunitySize ?? 0 },
            ].map(s => (
              <div key={s.label} style={{
                background: "#fff", borderRadius: "var(--radius)",
                border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)",
                padding: "12px 14px", textAlign: "center",
              }}>
                <p style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>
                  {s.value.toLocaleString()}
                </p>
                <p style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "4px" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
