"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { PageShell, PageHeader, StatusPill, SearchInput, FilterRow, EmptyState, Pagination } from "@/components/dashboard/page-header";
import { Plus, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function ChaptersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = trpc.chapters.list.useQuery({ page, limit: 20 });
  const chapters = (data?.chapters ?? []) as any[];
  const total = data?.total ?? 0;

  const filtered = search
    ? chapters.filter((c: any) => c.institution.name.toLowerCase().includes(search.toLowerCase()))
    : chapters;

  return (
    <PageShell>
      <PageHeader
        title="Chapters"
        subtitle={`${total} chapters across Kenya`}
        action={
          <>
            <Link href="/admin/chapters/institutions">
              <Button variant="outline" size="sm">Institutions</Button>
            </Link>
            <Link href="/admin/chapters/new">
              <Button size="sm"><Plus style={{ width: "12px", height: "12px" }} /> New Chapter</Button>
            </Link>
          </>
        }
      />

      <FilterRow>
        <SearchInput value={search} onChange={setSearch} placeholder="Search institutions…" />
      </FilterRow>

      {isLoading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px,1fr))", gap: "12px" }}>
          {Array.from({ length: 6 }).map((_, i) => <div key={i} style={{ height: "140px", borderRadius: "var(--radius)", background: "#e4e8f0" }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No chapters found" subtitle="Try a different search" />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px,1fr))", gap: "12px" }}>
          {filtered.map((chapter: any) => {
            const activeLead = chapter.leadAssignments?.find((a: any) => !a.revokedAt && a.role === "LEAD");
            return (
              <Link key={chapter.id} href={`/admin/chapters/${chapter.id}`} style={{ textDecoration: "none" }}>
                <div
                  style={{
                    background: "#fff", borderRadius: "var(--radius)",
                    border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)",
                    padding: "16px", cursor: "pointer", transition: "box-shadow 0.15s, border-color 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-md)";
                    (e.currentTarget as HTMLElement).style.borderColor = "#b0c0e8";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-sm)";
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                  }}
                >
                  {/* Header row */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "10px" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.3 }}>
                        {chapter.institution.name}
                      </p>
                      <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "1px" }}>
                        {chapter.institution.county} · {chapter.institution.type}
                      </p>
                    </div>
                    <ChevronRight style={{ width: "14px", height: "14px", color: "var(--text-muted)", flexShrink: 0, marginTop: "2px" }} />
                  </div>

                  {/* Status */}
                  <div style={{ marginBottom: "12px" }}>
                    <StatusPill status={chapter.status} />
                  </div>

                  {/* Stats row */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "6px" }}>
                    {[
                      { label: "Ambassadors", value: chapter._count?.memberships ?? 0 },
                      { label: "Activities",  value: chapter._count?.activities ?? 0 },
                      { label: "Workshops",   value: chapter._count?.workshops ?? 0 },
                    ].map(s => (
                      <div key={s.label} style={{ background: "var(--bg)", borderRadius: "6px", padding: "7px", textAlign: "center" }}>
                        <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>{s.value}</p>
                        <p style={{ fontSize: "9px", color: "var(--text-muted)", marginTop: "2px" }}>{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Lead */}
                  {activeLead && (
                    <p style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "10px", paddingTop: "10px", borderTop: "1px solid var(--border)" }}>
                      Lead: {activeLead.user.firstName} {activeLead.user.lastName}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <Pagination page={page} total={total} limit={20} onChange={setPage} />
    </PageShell>
  );
}
