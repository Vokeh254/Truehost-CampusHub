"use client";

import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { PageShell, PageHeader, EmptyState } from "@/components/dashboard/page-header";
import { timeAgo } from "@/lib/utils";
import { CheckCheck, Bell } from "lucide-react";

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  SUBMISSION_APPROVED:            { bg: "#e8f8f3", color: "#0d7a56" },
  SUBMISSION_REJECTED:            { bg: "#fdf1f2", color: "#b91c1c" },
  SUBMISSION_RECEIVED:            { bg: "#eff3fe", color: "#3b5bdb" },
  MILESTONE_ACHIEVED:             { bg: "#fef9ec", color: "#92580d" },
  CERTIFICATE_ISSUED:             { bg: "#f5f3ff", color: "#6d28d9" },
  SUBMISSION_CORRECTION_REQUIRED: { bg: "#fff3ec", color: "#c2410c" },
  NEW_OPPORTUNITY:                { bg: "#e8f8f3", color: "#0d7a56" },
  EVENT_REMINDER:                 { bg: "#eff3fe", color: "#3b5bdb" },
  SYSTEM_ANNOUNCEMENT:            { bg: "#f0f3fb", color: "#64748b" },
};

export default function NotificationsPage() {
  const { data, refetch } = trpc.notifications.list.useQuery({ limit: 50 });
  const markRead = trpc.notifications.markRead.useMutation({ onSuccess: () => refetch() });
  const markAll  = trpc.notifications.markAllRead.useMutation({ onSuccess: () => refetch() });

  const notifications = (data?.notifications ?? []) as any[];
  const unreadCount   = data?.unreadCount ?? 0;

  return (
    <PageShell>
      <PageHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
        action={
          unreadCount > 0 ? (
            <Button variant="outline" size="sm" onClick={() => markAll.mutate()} loading={markAll.isPending}>
              <CheckCheck style={{ width: "12px", height: "12px" }} /> Mark all read
            </Button>
          ) : undefined
        }
      />

      {notifications.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: "var(--radius)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
          <EmptyState title="No notifications yet" subtitle="Activity approvals, milestones and announcements will appear here" />
        </div>
      ) : (
        <div style={{ background: "#fff", borderRadius: "var(--radius)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
          {notifications.map((n: any, i: number) => {
            const tc = TYPE_COLORS[n.type] ?? { bg: "#f0f3fb", color: "#64748b" };
            return (
              <div
                key={n.id}
                onClick={() => { if (!n.isRead) markRead.mutate({ id: n.id }); }}
                style={{
                  display: "flex", alignItems: "flex-start", gap: "12px",
                  padding: "12px 16px",
                  borderTop: i === 0 ? "none" : "1px solid var(--border)",
                  background: n.isRead ? "#fff" : "#fafbff",
                  cursor: n.isRead ? "default" : "pointer",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => { if (!n.isRead) (e.currentTarget as HTMLElement).style.background = "#f0f3fb"; }}
                onMouseLeave={(e) => { if (!n.isRead) (e.currentTarget as HTMLElement).style.background = "#fafbff"; }}
              >
                {/* Type dot */}
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: n.isRead ? "transparent" : "var(--accent)", flexShrink: 0, marginTop: "5px" }} />

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "baseline" }}>
                    <p style={{ fontSize: "12px", fontWeight: n.isRead ? 400 : 600, color: "var(--text-primary)" }}>{n.title}</p>
                    <span style={{ fontSize: "10px", color: "var(--text-muted)", flexShrink: 0 }}>{timeAgo(n.createdAt)}</span>
                  </div>
                  <p style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>{n.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
