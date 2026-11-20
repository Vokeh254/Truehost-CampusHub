"use client";
import { PageShell } from "@/components/dashboard/page-header";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { MessageSquare, CheckCircle, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

function KPI({ label, value, sub, color = "var(--text-primary)" }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ background: "#fff", borderRadius: "8px", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", padding: "8px 12px" }}>
      <p style={{ fontSize: "26px", fontWeight: 700, color, lineHeight: 1.1 }}>{typeof value === "number" ? value.toLocaleString() : value}</p>
      <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>{label}</p>
      {sub && <p style={{ fontSize: "11px", color: "var(--success)", marginTop: "2px" }}>{sub}</p>}
    </div>
  );
}

export default function AdminCommunityPage() {
  const [groupId, setGroupId] = useState("");
  const [page, setPage] = useState(1);

  const { data: groups } = trpc.community.listGroups.useQuery();
  const { data: metrics, refetch } = trpc.community.listMetrics.useQuery({ groupId: groupId || undefined, page, limit: 20 });
  const verifyMetric = trpc.community.verifyMetric.useMutation({ onSuccess: () => refetch() });

  const allGroups = (groups as any[]) ?? [];
  const allMetrics = (metrics as any)?.metrics ?? [];
  const totalMetrics = (metrics as any)?.total ?? 0;

  const nationalGroup = allGroups.find((g: any) => g.isNational);
  const latestNational = nationalGroup ? allMetrics.find((m: any) => m.groupId === nationalGroup.id) : null;

  // Chart: total members per chapter group
  const chartData = allGroups
    .filter((g: any) => !g.isNational)
    .map((g: any) => {
      const latest = allMetrics.find((m: any) => m.groupId === g.id);
      return { name: g.chapter?.institution?.name?.split(" ").slice(0, 2).join(" ") ?? g.name, members: latest?.totalMembers ?? 0 };
    })
    .filter((d: any) => d.members > 0)
    .sort((a: any, b: any) => b.members - a.members)
    .slice(0, 10);

  return (
    <div style={{ padding: "24px 28px" }}>

      {/* Header */}
      <div style={{ marginBottom: "12px" }}>
        <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)" }}>Community Management</h1>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>WhatsApp community growth and engagement tracking</p>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "8px", marginBottom: "12px" }}>
        <KPI label="National Community" value={latestNational?.totalMembers ?? 0}
          sub={latestNational ? `+${latestNational.newMembersAdded} last period` : "No data yet"} />
        <KPI label="WhatsApp Groups" value={allGroups.length} />
        <KPI label="Reports Submitted" value={totalMetrics} />
        <KPI label="Chapter Groups" value={allGroups.filter((g: any) => !g.isNational).length} />
      </div>

      {/* Groups overview */}
      <div style={{ background: "#fff", borderRadius: "8px", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", marginBottom: "14px" }}>
        <div style={{ padding: "10px 16px 8px", borderBottom: "1px solid var(--border)" }}>
          <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>WhatsApp Groups</p>
        </div>
        <div style={{ padding: "10px 18px 14px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "8px" }}>
          {allGroups.length === 0 ? (
            <p style={{ gridColumn: "1/-1", textAlign: "center", padding: "24px 28px", color: "var(--text-muted)", fontSize: "13px" }}>
              No groups configured yet.
            </p>
          ) : allGroups.map((g: any) => {
            const latestMetric = allMetrics.find((m: any) => m.groupId === g.id);
            return (
              <div key={g.id} style={{
                borderRadius: "7px", border: "1px solid var(--border)", padding: "4px 9px",
                background: g.isNational ? "var(--accent-light)" : "var(--bg)",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>{g.name}</p>
                  {g.isNational && (
                    <span style={{ fontSize: "10px", fontWeight: 600, background: "var(--accent)", color: "#fff", padding: "2px 8px", borderRadius: "6px" }}>
                      National
                    </span>
                  )}
                </div>
                {g.chapter?.institution?.name && (
                  <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "10px" }}>{g.chapter.institution.name}</p>
                )}
                {latestMetric ? (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    <div style={{ background: "#fff", borderRadius: "7px", padding: "8px", textAlign: "center" }}>
                      <p style={{ fontSize: "17px", fontWeight: 700, color: "var(--text-primary)" }}>{latestMetric.totalMembers}</p>
                      <p style={{ fontSize: "10px", color: "var(--text-muted)" }}>Members</p>
                    </div>
                    <div style={{ background: "#fff", borderRadius: "7px", padding: "8px", textAlign: "center" }}>
                      <p style={{ fontSize: "17px", fontWeight: 700, color: "var(--success)" }}>+{latestMetric.newMembersAdded}</p>
                      <p style={{ fontSize: "10px", color: "var(--text-muted)" }}>New</p>
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic" }}>No reports yet</p>
                )}
                {g.groupLink && (
                  <a href={g.groupLink} target="_blank" rel="noopener noreferrer"
                    style={{ display: "block", marginTop: "6px", fontSize: "12px", color: "var(--accent)", textDecoration: "none" }}>
                    Join Group →
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div style={{ background: "#fff", borderRadius: "8px", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", marginBottom: "14px", padding: "8px 14px" }}>
          <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "12px" }}>Chapter Community Size (Top 10)</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px" }} />
              <Bar dataKey="members" name="Members" fill="var(--accent)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Reports table */}
      <div style={{ background: "#fff", borderRadius: "8px", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 14px", borderBottom: "1px solid var(--border)" }}>
          <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>Submitted Reports</p>
          <select
            value={groupId}
            onChange={(e) => { setGroupId(e.target.value); setPage(1); }}
            style={{ height: "30px", padding: "0 12px", borderRadius: "8px", border: "1px solid var(--border)", background: "#fff", fontSize: "13px", cursor: "pointer" }}
          >
            <option value="">All groups</option>
            {allGroups.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        {allMetrics.length === 0 ? (
          <div style={{ padding: "32px 24px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
            No community reports submitted yet. Campus Leads can submit reports from their dashboard.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Group","Chapter","Period","Members","New Members","Reported By","Verified",""].map(h => (
                  <th key={h} style={{ padding: "8px 14px", textAlign: "left", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allMetrics.map((m: any) => (
                <tr key={m.id} style={{ borderBottom: "1px solid var(--border)" }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "var(--bg)"}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "transparent"}
                >
                  <td style={{ padding: "8px 12px", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>{m.group.name}</td>
                  <td style={{ padding: "8px 12px", fontSize: "13px", color: "var(--text-secondary)" }}>{m.chapter?.institution?.name ?? "National"}</td>
                  <td style={{ padding: "8px 12px", fontSize: "12px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                    {formatDate(m.periodStart)} – {formatDate(m.periodEnd)}
                  </td>
                  <td style={{ padding: "8px 12px", fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>{m.totalMembers}</td>
                  <td style={{ padding: "8px 12px", fontSize: "14px", fontWeight: 700, color: "var(--success)" }}>+{m.newMembersAdded}</td>
                  <td style={{ padding: "8px 12px", fontSize: "13px", color: "var(--text-secondary)" }}>
                    {m.reportedBy.firstName} {m.reportedBy.lastName}
                  </td>
                  <td style={{ padding: "8px 12px" }}>
                    {m.verifiedAt ? (
                      <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--success)", background: "var(--success-light)", padding: "3px 10px", borderRadius: "6px" }}>Verified</span>
                    ) : (
                      <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", background: "#fafbfd", padding: "3px 10px", borderRadius: "6px", border: "1px solid var(--border)" }}>Pending</span>
                    )}
                  </td>
                  <td style={{ padding: "8px 12px" }}>
                    {!m.verifiedAt && (
                      <Button size="sm" variant="outline" onClick={() => verifyMetric.mutate({ id: m.id })} loading={verifyMetric.isPending}>Verify</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {totalMetrics > 20 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 18px", borderTop: "1px solid var(--border)" }}>
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>{(page-1)*20+1}–{Math.min(page*20,totalMetrics)} of {totalMetrics}</p>
            <div style={{ display: "flex", gap: "8px" }}>
              <Button variant="outline" size="sm" disabled={page===1} onClick={() => setPage(p=>p-1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page*20>=totalMetrics} onClick={() => setPage(p=>p+1)}>Next</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
