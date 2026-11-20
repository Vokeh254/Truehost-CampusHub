"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { PageShell, PageHeader, SectionCard } from "@/components/dashboard/page-header";
import { FileSpreadsheet, BarChart3 } from "lucide-react";

type ExportType = "ambassadors" | "activities" | "workshops" | "referrals" | "chapters";

const TYPES: { value: ExportType; label: string; desc: string }[] = [
  { value: "ambassadors", label: "Ambassador Registry",  desc: "All ambassadors with profiles, tiers and points" },
  { value: "activities",  label: "Approved Activities",  desc: "All verified activity submissions" },
  { value: "workshops",   label: "Workshops",            desc: "All completed workshop records" },
  { value: "referrals",   label: "Referrals",            desc: "Student referral records" },
  { value: "chapters",    label: "Chapter Overview",     desc: "Chapter membership and performance summary" },
];

export default function ReportsPage() {
  const [exportType, setExportType] = useState<ExportType>("ambassadors");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [exporting, setExporting] = useState(false);

  const { data: overview } = trpc.reports.adminOverview.useQuery();
  const { data: chapters } = trpc.chapters.list.useQuery({ limit: 200 });
  const { refetch: fetchExport } = trpc.reports.exportData.useQuery({ type: exportType, chapterId: chapterId || undefined, dateFrom: dateFrom ? new Date(dateFrom) : undefined, dateTo: dateTo ? new Date(dateTo) : undefined }, { enabled: false });

  const o = overview as any;

  const handleCSV = async () => {
    setExporting(true);
    try {
      const { data } = await fetchExport();
      if (!data || !Array.isArray(data) || !data.length) { alert("No data for selected filters."); return; }
      const flatten = (obj: any, prefix = ""): Record<string, string> =>
        Object.entries(obj).reduce((acc: Record<string, string>, [k, v]) => {
          const key = prefix ? `${prefix}_${k}` : k;
          if (v && typeof v === "object" && !Array.isArray(v) && !(v instanceof Date)) Object.assign(acc, flatten(v, key));
          else acc[key] = v == null ? "" : String(v);
          return acc;
        }, {});
      const rows = data.map((r: any) => flatten(r));
      const headers = [...new Set(rows.flatMap((r: any) => Object.keys(r)))];
      const csv = [headers.join(","), ...rows.map((row: any) => headers.map(h => { const v = row[h] ?? ""; return v.includes(",") || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v; }).join(","))].join("\n");
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
      const a = document.createElement("a"); a.href = url; a.download = `truehost_${exportType}_${new Date().toISOString().split("T")[0]}.csv`; a.click(); URL.revokeObjectURL(url);
    } finally { setExporting(false); }
  };

  return (
    <PageShell>
      <PageHeader title="Reports & Exports" subtitle="Generate and download data reports" />

      {/* Quick stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "10px", marginBottom: "16px" }}>
        {[
          ["Total Ambassadors", o?.totalAmbassadors], ["Active Ambassadors", o?.activeAmbassadors],
          ["University Chapters", o?.totalChapters],  ["Approved Activities", o?.totalActivities],
          ["Workshops Completed", o?.totalWorkshops],  ["Verified Referrals", o?.totalReferrals],
          ["Student Projects", o?.totalProjects],      ["Certificates Issued", o?.totalCertificates],
          ["Events Tracked", o?.totalEvents],
        ].map(([label, value]) => (
          <div key={label as string} style={{ background: "#fff", borderRadius: "var(--radius)", border: "1px solid var(--border)", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{label}</span>
            <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>{(value as number)?.toLocaleString() ?? "—"}</span>
          </div>
        ))}
      </div>

      <SectionCard title="Export Data">
        {/* Type selector */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: "8px", marginBottom: "16px" }}>
          {TYPES.map(t => (
            <button key={t.value} onClick={() => setExportType(t.value)} style={{
              textAlign: "left", padding: "10px 12px", borderRadius: "7px", cursor: "pointer",
              border: `1px solid ${exportType === t.value ? "var(--accent)" : "var(--border)"}`,
              background: exportType === t.value ? "var(--accent-light)" : "#fff",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                <BarChart3 style={{ width: "12px", height: "12px", color: exportType === t.value ? "var(--accent)" : "var(--text-muted)" }} />
                <p style={{ fontSize: "12px", fontWeight: 600, color: exportType === t.value ? "var(--accent)" : "var(--text-primary)" }}>{t.label}</p>
              </div>
              <p style={{ fontSize: "10px", color: "var(--text-muted)" }}>{t.desc}</p>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "14px" }}>
          <div>
            <label style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Chapter</label>
            <select value={chapterId} onChange={e => setChapterId(e.target.value)} style={{ height: "30px", padding: "0 10px", borderRadius: "6px", border: "1px solid var(--border)", background: "#fff", fontSize: "12px", outline: "none", minWidth: "200px" }}>
              <option value="">All chapters</option>
              {(chapters as any)?.chapters?.map((c: any) => <option key={c.id} value={c.id}>{c.institution.name}</option>)}
            </select>
          </div>
          {(exportType === "activities" || exportType === "workshops") && (
            <>
              <div>
                <label style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>From</label>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ height: "30px", padding: "0 10px", borderRadius: "6px", border: "1px solid var(--border)", fontSize: "12px", outline: "none" }} />
              </div>
              <div>
                <label style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>To</label>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ height: "30px", padding: "0 10px", borderRadius: "6px", border: "1px solid var(--border)", fontSize: "12px", outline: "none" }} />
              </div>
            </>
          )}
        </div>

        <Button onClick={handleCSV} loading={exporting}>
          <FileSpreadsheet style={{ width: "13px", height: "13px" }} /> Download CSV
        </Button>
        <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "8px" }}>Open CSV in Excel or Google Sheets for Excel format.</p>
      </SectionCard>
    </PageShell>
  );
}
