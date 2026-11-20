"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { PageShell, PageHeader, DataTable, THead, Th, TRow, Td, StatusPill, EmptyState, Pagination, TabNav } from "@/components/dashboard/page-header";
import { formatDate, timeAgo } from "@/lib/utils";
import { CheckCircle2, XCircle, Eye } from "lucide-react";
import Link from "next/link";

const TABS = [
  { value: "PENDING", label: "Pending" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "", label: "All" },
];

export default function LeadActivitiesPage() {
  const [status, setStatus] = useState("PENDING");
  const [page, setPage] = useState(1);

  const { data: session } = trpc.auth.me.useQuery();
  const chapterId = (session as any)?.leadAssignments?.[0]?.chapterId;

  const { data, isLoading, refetch } = trpc.activities.list.useQuery(
    { status: (status as any) || undefined, chapterId: chapterId ?? "", page, limit: 25 },
    { enabled: !!chapterId }
  );

  const review = trpc.activities.review.useMutation({ onSuccess: () => refetch() });
  const submissions = (data?.submissions ?? []) as any[];
  const total = data?.total ?? 0;

  return (
    <PageShell>
      <PageHeader title="Chapter Activities" subtitle="Review and approve ambassador submissions" />

      <TabNav tabs={TABS} active={status} onChange={(v) => { setStatus(v); setPage(1); }} />

      <DataTable>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <THead>
            <Th>Activity</Th>
            <Th>Ambassador</Th>
            <Th>Type</Th>
            <Th>Date</Th>
            <Th>Status</Th>
            <Th right>Actions</Th>
          </THead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>Loading…</td></tr>
            ) : submissions.length === 0 ? (
              <tr><td colSpan={6}><EmptyState title="No submissions found" subtitle="Try a different filter" /></td></tr>
            ) : submissions.map((s: any) => (
              <TRow key={s.id}>
                <Td>
                  <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.title}
                  </p>
                  <p style={{ fontSize: "10px", color: "var(--text-muted)" }}>{timeAgo(s.createdAt)}</p>
                </Td>
                <Td>{s.ambassador.user.firstName} {s.ambassador.user.lastName}</Td>
                <Td muted>{s.activityType.name}</Td>
                <Td muted>{formatDate(s.activityDate)}</Td>
                <Td><StatusPill status={s.status} /></Td>
                <Td right>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "4px" }}>
                    <Link href={`/admin/activities/${s.id}`}>
                      <Button variant="ghost" size="icon" title="Review">
                        <Eye style={{ width: "13px", height: "13px" }} />
                      </Button>
                    </Link>
                    {(s.status === "PENDING" || s.status === "UNDER_REVIEW") && (
                      <>
                        <Button variant="ghost" size="icon" style={{ color: "#0d9f6e" }}
                          onClick={() => review.mutate({ id: s.id, status: "APPROVED" })}
                          loading={review.isPending}>
                          <CheckCircle2 style={{ width: "13px", height: "13px" }} />
                        </Button>
                        <Button variant="ghost" size="icon" style={{ color: "#e02d3c" }}
                          onClick={() => { const fb = window.prompt("Feedback:"); if (fb) review.mutate({ id: s.id, status: "REJECTED", reviewFeedback: fb }); }}>
                          <XCircle style={{ width: "13px", height: "13px" }} />
                        </Button>
                      </>
                    )}
                  </div>
                </Td>
              </TRow>
            ))}
          </tbody>
        </table>
      </DataTable>

      <Pagination page={page} total={total} limit={25} onChange={setPage} />
    </PageShell>
  );
}
