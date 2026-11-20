"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { PageShell, PageHeader, SectionCard } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Users, ClipboardList, BookOpen, TrendingUp, Award, FileSpreadsheet } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type ExportType = "ambassadors" | "activities";

export default function LeadReportsPage() {
  const [exportType, setExportType] = useState<ExportType>("activities");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [exporting, setExporting] = useState(false);

  const { data: session } = trpc.auth.me.useQuery();
  const chapterId = (session as any)?.leadAssignments?.[0]?.chapterId;

  const { data: perf }   = trpc.chapters.performance.useQuery({ id: chapterId ?? "", period: "monthly" }, { enabled: !!chapterId });
  const { data: growth } = trpc.community.chapterGrowth.useQuery({ chapterId: chapterId ?? "", months: 6 }, { enabled: !!chapterId });
  const { refetch: fetchExport } = trpc.reports.exportData.useQuery({ type: exportType, chapterId: chapterId ?? undefined, dateFrom: dateFrom ? new Date(dateFrom) : undefined, dateTo: dateTo ? new Date(dateTo) : undefined }, { enabled: false });

  const p = perf as any;
  const growthChart = (growth as any[])?.map((m: any) => ({ month: new Date(m.periodStart).toLocaleString("default", { month: "short" }), members: m.totalMembers, new: m.newMembersAdded })) ?? [];

  const handleCSV = async () => {
    setExporting(true);
    try {
      const { data } = await fetchExport();
      if (!data || !Array.isArray(data) || !data.length) { alert("No data found."); return; }
      const flatten = (obj: any, prefix = ""): Record<string, string> =>
        Object.entries(obj).reduce((acc: Record<string, string>, [k, v]) => { const key = prefix ? `${prefix}_${k}` : k; if (v && typeof v === "object" && !Array.isArray(v) && !(v instanceof Date)) Object.assign(acc, flatten(v, key)); else acc[key] = v == null ? "" : String(v); return acc; }, {});
      const rows = data.map((r: any) => flatten(r));
      const headers = [...new Set(rows.flatMap((r: any) => Object.keys(r)))];
      const csv = [headers.join(","), ...rows.map((row: any) => headers.map(h => { const v = row[h] ?? ""; return v.includes(",") || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v; }).join(","))].join("\n");
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
      const a = document.createElement("a"); a.href = url; a.download = `chapter_${exportType}_${new Date().toISOString().split("T")[0]}.csv`; a.click(); URL.revokeObjectURL(url);
    } finally { setExporting(false); }
  };

  return (
    <PageShell>
      <PageHeader title="Chapter Reports" subtitle="Performance data and exports for your chapter" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px", marginBottom: "16px" }}>
        <StatCard title="Ambassadors"       value={p?.totalAmbassadors ?? 0}  icon={Users}        iconColor="#3b5bdb" iconBg="#eff3fe" />
        <StatCard title="Referrals (Month)" value={p?.newReferrals ?? 0}      icon={TrendingUp}   iconColor="#0d9f6e" iconBg="#e8f8f3" />
        <StatCard title="Workshops Done"    value={p?.workshops ?? 0}         icon={BookOpen}     iconColor="#6d28d9" iconBg="#f5f3ff" />
        <StatCard title="Activities"        value={p?.approvedActivities ?? 0}icon={ClipboardList}iconColor="#0369a1" iconBg="#eff8ff" />
        <StatCard title="Student Projects"  value={p?.projects ?? 0}          icon={Award}        iconColor="#b45309" iconBg="#fef9ec" />
        {p?.latestCommunityMetric && <StatCard title="Community Members" value={p.latestCommunityMetric.totalMembers} icon={Users} iconColor="#0d9f6e" iconBg="#e8f8f3" change={`+${p.latestCommunityMetric.newMembersAdded} this period`} changeType="positive" />}
      </div>

      {growthChart.length > 0 && (
        <div style={{ background: "#fff", borderRadius: "var(--radius)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", padding: "16px 18px", marginBottom: "16px" }}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "14px" }}>Community Growth (6 Months)</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={growthChart} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f3f8" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#8c9ab0" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#8c9ab0" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ border: "1px solid var(--border)", borderRadius: "7px", fontSize: "11px" }} />
              <Line type="monotone" dataKey="members" name="Total" stroke="#3b5bdb" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="new"     name="New"   stroke="#0d9f6e" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <SectionCard title="Export Chapter Data">
        <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
          {(["ambassadors","activities"] as ExportType[]).map(t => (
            <button key={t} onClick={() => setExportType(t)} style={{ padding: "6px 14px", borderRadius: "6px", border: `1px solid ${exportType === t ? "var(--accent)" : "var(--border)"}`, background: exportType === t ? "var(--accent-light)" : "#fff", fontSize: "12px", fontWeight: exportType === t ? 600 : 400, color: exportType === t ? "var(--accent)" : "var(--text-secondary)", cursor: "pointer" }}>
              {t === "ambassadors" ? "Chapter Ambassadors" : "Approved Activities"}
            </button>
          ))}
        </div>
        {exportType === "activities" && (
          <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
            <div>
              <label style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>From</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ height: "30px", padding: "0 10px", borderRadius: "6px", border: "1px solid var(--border)", fontSize: "12px", outline: "none" }} />
            </div>
            <div>
              <label style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>To</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ height: "30px", padding: "0 10px", borderRadius: "6px", border: "1px solid var(--border)", fontSize: "12px", outline: "none" }} />
            </div>
          </div>
        )}
        <Button size="sm" onClick={handleCSV} loading={exporting}><FileSpreadsheet style={{ width: "12px", height: "12px" }} /> Download CSV</Button>
      </SectionCard>
    </PageShell>
  );
}
