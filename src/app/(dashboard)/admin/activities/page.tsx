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
  { value: "REQUIRES_CORRECTION", label: "Needs Correction" },
  { value: "", label: "All" },
];

export default function ActivitiesPage() {
  const [status, setStatus] = useState("PENDING");
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = trpc.activities.list.useQuery({
    status: (status as any) || undefined, page, limit: 25,
  });

  const review = trpc.activities.review.useMutation({ onSuccess: () => refetch() });
  const submissions = (data?.submissions ?? []) as any[];
  const total = data?.total ?? 0;

  return (
    <PageShell>
      <PageHeader
        title="Activity Submissions"
        subtitle={`${total} submissions`}
        action={
          <Link href="/admin/activities/types">
            <Button variant="outline" size="sm">Activity Types</Button>
          </Link>
        }
      />

      <TabNav
        tabs={TABS}
        active={status}
        onChange={(v) => { setStatus(v); setPage(1); }}
      />

      <DataTable>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <THead>
            <Th>Activity</Th>
            <Th>Ambassador</Th>
            <Th>Institution</Th>
            <Th>Type</Th>
            <Th>Date</Th>
            <Th>Status</Th>
            <Th right>Actions</Th>
          </THead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>Loading…</td></tr>
            ) : submissions.length === 0 ? (
              <tr><td colSpan={7}><EmptyState title="No submissions found" subtitle="Try a different status filter" /></td></tr>
            ) : submissions.map((s: any) => (
              <TRow key={s.id}>
                <Td>
                  <Link href={`/admin/activities/${s.id}`} style={{ textDecoration: "none" }}>
                    <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--accent)", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {s.title}
                    </p>
                  </Link>
                  <p style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "1px" }}>{timeAgo(s.createdAt)}</p>
                </Td>
                <Td>{s.ambassador.user.firstName} {s.ambassador.user.lastName}</Td>
                <Td muted>{s.chapter?.institution?.name}</Td>
                <Td muted>{s.activityType.name}</Td>
                <Td muted>{formatDate(s.activityDate)}</Td>
                <Td><StatusPill status={s.status} /></Td>
                <Td right>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "4px" }}>
                    <Link href={`/admin/activities/${s.id}`}>
                      <Button variant="ghost" size="icon" title="View">
                        <Eye style={{ width: "13px", height: "13px" }} />
                      </Button>
                    </Link>
                    {(s.status === "PENDING" || s.status === "UNDER_REVIEW") && (
                      <>
                        <Button
                          variant="ghost" size="icon" title="Approve"
                          style={{ color: "#0d9f6e" }}
                          onClick={() => review.mutate({ id: s.id, status: "APPROVED" })}
                          loading={review.isPending}
                        >
                          <CheckCircle2 style={{ width: "13px", height: "13px" }} />
                        </Button>
                        <Button
                          variant="ghost" size="icon" title="Reject"
                          style={{ color: "#e02d3c" }}
                          onClick={() => { const fb = window.prompt("Rejection reason:"); if (fb) review.mutate({ id: s.id, status: "REJECTED", reviewFeedback: fb }); }}
                        >
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
