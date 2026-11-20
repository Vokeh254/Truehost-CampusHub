"use client";

import { trpc } from "@/lib/trpc";
import { PageShell, PageHeader, DataTable, THead, Th, TRow, Td, StatusPill, EmptyState } from "@/components/dashboard/page-header";
import { formatPoints } from "@/lib/utils";

export default function ReferralsOverviewPage() {
  const { data: overview } = trpc.reports.adminOverview.useQuery();
  const { data: chapters } = trpc.leaderboards.topChapters.useQuery({ limit: 50 });

  const o = overview as any;

  return (
    <PageShell>
      <PageHeader
        title="Referrals Overview"
        subtitle={`${o?.totalReferrals ?? 0} verified referrals nationwide`}
      />

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px", marginBottom: "16px" }}>
        {[
          { label: "Verified Referrals", value: o?.totalReferrals ?? 0, color: "#0d9f6e", bg: "#e8f8f3" },
          { label: "Active Chapters",    value: o?.totalChapters ?? 0,  color: "var(--accent)", bg: "#eff3fe" },
          { label: "Total Ambassadors",  value: o?.totalAmbassadors ?? 0, color: "#6d28d9", bg: "#f5f3ff" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: "var(--radius)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", padding: "16px" }}>
            <p style={{ fontSize: "22px", fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value.toLocaleString()}</p>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Chapter breakdown */}
      <DataTable>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <THead>
            <Th>Chapter</Th>
            <Th>Type</Th>
            <Th>County</Th>
            <Th right>Members</Th>
            <Th right>Activities</Th>
            <Th right>Workshops</Th>
            <Th right>Total Points</Th>
          </THead>
          <tbody>
            {!(chapters as any[])?.length ? (
              <tr><td colSpan={7}><EmptyState title="No chapter data yet" /></td></tr>
            ) : (chapters as any[]).map((ch: any) => (
              <TRow key={ch.id}>
                <Td><span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>{ch.institution.name}</span></Td>
                <Td><StatusPill status={ch.institution.type} /></Td>
                <Td muted>{ch.institution.county}</Td>
                <Td right><span style={{ fontWeight: 600 }}>{ch.memberCount}</span></Td>
                <Td right muted>{ch._count?.activities ?? 0}</Td>
                <Td right muted>{ch._count?.workshops ?? 0}</Td>
                <Td right><span style={{ fontWeight: 700, color: "var(--accent)" }}>{formatPoints(ch.totalPoints)}</span></Td>
              </TRow>
            ))}
          </tbody>
        </table>
      </DataTable>
    </PageShell>
  );
}
