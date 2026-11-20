"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { PageShell, PageHeader, StatusPill, EmptyState, Pagination, TabNav } from "@/components/dashboard/page-header";
import { formatDate, timeAgo } from "@/lib/utils";
import { Plus } from "lucide-react";
import Link from "next/link";

const TABS = [
  { value: "", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "REQUIRES_CORRECTION", label: "Needs Correction" },
];

export default function MyActivitiesPage() {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = trpc.activities.mySubmissions.useQuery({
    status: (status as any) || undefined,
    page, limit: 15,
  });

  const submissions = (data?.submissions ?? []) as any[];
  const total = data?.total ?? 0;

  return (
    <PageShell>
      <PageHeader
        title="My Activities"
        subtitle={`${total} submissions`}
        action={
          <>
            <Link href="/ambassador/activities/refer">
              <Button variant="outline" size="sm">Refer a Student</Button>
            </Link>
            <Link href="/ambassador/activities/submit">
              <Button size="sm"><Plus style={{ width: "12px", height: "12px" }} /> Submit Activity</Button>
            </Link>
          </>
        }
      />

      <TabNav tabs={TABS} active={status} onChange={(v) => { setStatus(v); setPage(1); }} />

      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {Array.from({ length: 5 }).map((_, i) => <div key={i} style={{ height: "60px", borderRadius: "var(--radius)", background: "#e4e8f0" }} />)}
        </div>
      ) : submissions.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: "var(--radius)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
          <EmptyState
            title="No activities yet"
            subtitle="Submit your first activity to start earning points"
            action={<Link href="/ambassador/activities/submit"><Button size="sm">Submit Activity</Button></Link>}
          />
        </div>
      ) : (
        <div style={{ background: "#fff", borderRadius: "var(--radius)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
          {submissions.map((s: any, i: number) => (
            <div
              key={s.id}
              style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "11px 16px",
                borderTop: i === 0 ? "none" : "1px solid var(--border)",
                background: "#fff", transition: "background 0.1s",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#fafbfd")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "#fff")}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>{s.title}</p>
                  <StatusPill status={s.status} />
                  {s.pointsTransaction && (
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#0d9f6e" }}>
                      +{s.pointsTransaction.points} pts
                    </span>
                  )}
                </div>
                <p style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>
                  {s.activityType.name} · {formatDate(s.activityDate)}
                </p>
                {s.status === "REQUIRES_CORRECTION" && (
                  <p style={{ fontSize: "10px", color: "#c2410c", marginTop: "3px" }}>
                    This submission needs correction. Check notifications for reviewer feedback.
                  </p>
                )}
              </div>
              <span style={{ fontSize: "10px", color: "var(--text-muted)", flexShrink: 0 }}>
                {timeAgo(s.createdAt)}
              </span>
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} total={total} limit={15} onChange={setPage} />
    </PageShell>
  );
}
