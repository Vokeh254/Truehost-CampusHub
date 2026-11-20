"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { PageShell, PageHeader, DataTable, THead, Th, TRow, Td, StatusPill, Avatar, EmptyState, Pagination, FilterRow, SearchInput } from "@/components/dashboard/page-header";
import { formatPoints, formatDate } from "@/lib/utils";

export default function LeadAmbassadorsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data: session } = trpc.auth.me.useQuery();
  const chapterId = (session as any)?.leadAssignments?.[0]?.chapterId;

  const { data, isLoading } = trpc.ambassadors.list.useQuery(
    { chapterId: chapterId ?? "", search: search || undefined, page, limit: 25 },
    { enabled: !!chapterId }
  );

  const ambassadors = (data?.ambassadors ?? []) as any[];
  const total = data?.total ?? 0;
  const ranked = [...ambassadors].sort((a: any, b: any) => b.totalPoints - a.totalPoints);

  return (
    <PageShell>
      <PageHeader title="Chapter Ambassadors" subtitle={`${total} in your chapter`} />

      <FilterRow>
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search name or email…" />
      </FilterRow>

      <DataTable>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <THead>
            <Th>#</Th>
            <Th>Name</Th>
            <Th>Tier</Th>
            <Th right>Points</Th>
            <Th right>Activities</Th>
            <Th right>Referrals</Th>
            <Th>Joined</Th>
            <Th>Status</Th>
          </THead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>Loading…</td></tr>
            ) : ranked.length === 0 ? (
              <tr><td colSpan={8}><EmptyState title="No ambassadors yet" subtitle="Ambassadors who join this chapter will appear here" /></td></tr>
            ) : ranked.map((amb: any, i: number) => (
              <TRow key={amb.id}>
                <Td muted>{(page - 1) * 25 + i + 1}</Td>
                <Td>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Avatar name={`${amb.user.firstName} ${amb.user.lastName}`} />
                    <div>
                      <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>
                        {amb.user.firstName} {amb.user.lastName}
                      </p>
                      <p style={{ fontSize: "10px", color: "var(--text-muted)" }}>{amb.user.email}</p>
                    </div>
                  </div>
                </Td>
                <Td><StatusPill status={amb.currentTier} /></Td>
                <Td right><span style={{ fontWeight: 700, fontSize: "12px", color: "var(--accent)" }}>{formatPoints(amb.totalPoints)}</span></Td>
                <Td right muted>{amb._count?.submissions ?? 0}</Td>
                <Td right muted>{amb._count?.referralsMade ?? 0}</Td>
                <Td muted>{formatDate(amb.user.createdAt)}</Td>
                <Td><StatusPill status={amb.user.isSuspended ? "SUSPENDED" : "ACTIVE"} /></Td>
              </TRow>
            ))}
          </tbody>
        </table>
      </DataTable>

      <Pagination page={page} total={total} limit={25} onChange={setPage} />
    </PageShell>
  );
}
