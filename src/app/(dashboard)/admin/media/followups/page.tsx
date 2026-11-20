"use client";

import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { PageShell, PageHeader, EmptyState } from "@/components/dashboard/page-header";
import { formatDate, timeAgo } from "@/lib/utils";
import { CheckCheck } from "lucide-react";

export default function FollowupsPage() {
  const { data: followUps, refetch, isLoading } = trpc.media.followUpsDue.useQuery();
  const markDone = trpc.media.markFollowUpDone.useMutation({ onSuccess: () => refetch() });

  const items = (followUps ?? []) as any[];
  const overdue  = items.filter((f: any) => new Date(f.followUpDate) < new Date());
  const upcoming = items.filter((f: any) => new Date(f.followUpDate) >= new Date());

  return (
    <PageShell>
      <PageHeader
        title="Follow-ups"
        subtitle={`${overdue.length} overdue · ${upcoming.length} due soon`}
        action={
          items.length === 0 ? undefined :
          <Button variant="outline" size="sm">
            {items.length} pending
          </Button>
        }
      />

      {items.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: "var(--radius)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
          <EmptyState title="All caught up" subtitle="No follow-ups pending" />
        </div>
      ) : (
        <>
          {overdue.length > 0 && (
            <div style={{ marginBottom: "14px" }}>
              <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "#b91c1c", marginBottom: "8px" }}>Overdue ({overdue.length})</p>
              <div style={{ background: "#fff", borderRadius: "var(--radius)", border: "1px solid #fca5a5", boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
                {overdue.map((f: any, i: number) => <FollowUpRow key={f.id} item={f} isOverdue onDone={() => markDone.mutate({ interactionId: f.id })} loading={markDone.isPending} last={i === overdue.length - 1} />)}
              </div>
            </div>
          )}
          {upcoming.length > 0 && (
            <div>
              <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: "8px" }}>Due Soon ({upcoming.length})</p>
              <div style={{ background: "#fff", borderRadius: "var(--radius)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
                {upcoming.map((f: any, i: number) => <FollowUpRow key={f.id} item={f} isOverdue={false} onDone={() => markDone.mutate({ interactionId: f.id })} loading={markDone.isPending} last={i === upcoming.length - 1} />)}
              </div>
            </div>
          )}
        </>
      )}
    </PageShell>
  );
}

function FollowUpRow({ item, isOverdue, onDone, loading, last }: { item: any; isOverdue: boolean; onDone: () => void; loading: boolean; last: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", padding: "12px 18px", borderBottom: last ? "none" : "1px solid var(--border)" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {item.mediaOpportunity?.organisation?.name ?? item.event?.name ?? "Unknown"}
        </p>
        <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "1px" }}>
          {item.channel} · {item.interactionType.replace(/_/g, " ")} · Due {formatDate(item.followUpDate)}
        </p>
        {item.summary && <p style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.summary}</p>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
        <span style={{ fontSize: "10px", fontWeight: 500, padding: "2px 7px", borderRadius: "4px", background: isOverdue ? "#fdf1f2" : "#fef9ec", color: isOverdue ? "#b91c1c" : "#92580d" }}>
          {isOverdue ? "Overdue" : "Due soon"}
        </span>
        <Button size="sm" variant={isOverdue ? "default" : "outline"} onClick={onDone} loading={loading}>
          <CheckCheck style={{ width: "12px", height: "12px" }} /> Done
        </Button>
      </div>
    </div>
  );
}
