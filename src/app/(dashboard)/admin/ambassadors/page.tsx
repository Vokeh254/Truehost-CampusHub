"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { PageShell, PageHeader, DataTable, THead, Th, TRow, Td, StatusPill, Avatar, EmptyState, Pagination, FilterRow, SearchInput, FilterSelect } from "@/components/dashboard/page-header";
import { formatPoints, formatDate } from "@/lib/utils";
import Link from "next/link";

const TIER_LABELS: Record<string, string> = {
  CAMPUS_AMBASSADOR:        "Campus Ambassador",
  CHAPTER_LEAD_ACHIEVEMENT: "Chapter Lead Achievement",
  NATIONAL_CLOUD_FELLOW:    "National Cloud Fellow",
};

export default function AmbassadorsPage() {
  const [search, setSearch] = useState("");
  const [tier, setTier] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = trpc.ambassadors.list.useQuery({
    search: search || undefined,
    tier: (tier as any) || undefined,
    page, limit: 25,
  });

  const ambassadors = (data?.ambassadors ?? []) as any[];
  const total = data?.total ?? 0;

  return (
    <PageShell>
      <PageHeader
        title="Ambassadors"
        subtitle={`${total} registered`}
        action={<></>}
      />

      <FilterRow>
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search name or email…" />
        <FilterSelect
          value={tier}
          onChange={(v) => { setTier(v); setPage(1); }}
          options={[
            { value: "", label: "All tiers" },
            { value: "CAMPUS_AMBASSADOR", label: "Campus Ambassador" },
            { value: "CHAPTER_LEAD_ACHIEVEMENT", label: "Chapter Lead Achievement" },
            { value: "NATIONAL_CLOUD_FELLOW", label: "National Cloud Fellow" },
          ]}
        />
      </FilterRow>

      <DataTable>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <THead>
            <Th>Name</Th>
            <Th>Institution</Th>
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
            ) : ambassadors.length === 0 ? (
              <tr><td colSpan={8}><EmptyState title="No ambassadors found" subtitle="Try a different filter" /></td></tr>
            ) : ambassadors.map((amb: any) => (
              <TRow key={amb.id}>
                <Td>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Avatar name={`${amb.user.firstName} ${amb.user.lastName}`} />
                    <div>
                      <Link href={`/admin/ambassadors/${amb.id}`} style={{ textDecoration: "none" }}>
                        <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--accent)" }}>
                          {amb.user.firstName} {amb.user.lastName}
                        </p>
                      </Link>
                      <p style={{ fontSize: "10px", color: "var(--text-muted)" }}>{amb.user.email}</p>
                    </div>
                  </div>
                </Td>
                <Td muted>{amb.memberships?.[0]?.chapter?.institution?.name ?? amb.institution?.name}</Td>
                <Td><StatusPill status={amb.currentTier} /></Td>
                <Td right><span style={{ fontWeight: 700, fontSize: "12px" }}>{formatPoints(amb.totalPoints)}</span></Td>
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
