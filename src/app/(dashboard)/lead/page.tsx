"use client";

import { PageShell } from "@/components/dashboard/page-header";
import { trpc } from "@/lib/trpc";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, ClipboardList, BookOpen, TrendingUp, Award, MessageSquare, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { statusColor, formatDate } from "@/lib/utils";
import Link from "next/link";

export default function LeadDashboard() {
  const { data: session } = trpc.auth.me.useQuery();
  const chapterId = (session as any)?.leadAssignments?.[0]?.chapterId;

  const { data: chapter } = trpc.chapters.byId.useQuery(
    { id: chapterId ?? "" }, { enabled: !!chapterId }
  );
  const { data: perf } = trpc.chapters.performance.useQuery(
    { id: chapterId ?? "", period: "monthly" }, { enabled: !!chapterId }
  );
  const { data: pendingActivities, refetch } = trpc.activities.list.useQuery(
    { status: "PENDING", chapterId: chapterId ?? "", limit: 5 }, { enabled: !!chapterId }
  );
  const review = trpc.activities.review.useMutation({ onSuccess: () => refetch() });

  if (!chapterId) {
    return (
      <div style={{ padding: "24px 28px" }}>
        <div style={{ borderRadius: "8px", border: "1px solid #fde68a", background: "#fffbeb", padding: "4px 9px", textAlign: "center" }}>
          <p style={{ fontWeight: 600, color: "#92400e" }}>You are not assigned to a chapter yet.</p>
          <p style={{ fontSize: "13px", color: "#b45309", marginTop: "4px" }}>Contact the administrator to be assigned.</p>
        </div>
      </div>
    );
  }

  const ch = chapter as any;
  const p = perf as any;

  return (
    <div style={{ padding: "24px 28px" }}>

      {/* Header */}
      <div style={{ marginBottom: "12px" }}>
        <h1 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" }}>
          {ch?.institution?.name ?? "Chapter"} Dashboard
        </h1>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>
          {ch?.institution?.county} · Campus Lead View · Monthly Period
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "8px", marginBottom: "14px" }}>
        <StatCard title="Ambassadors" value={p?.totalAmbassadors ?? 0}
          icon={Users} iconColor="#3b5bdb" iconBg="#eff3fe" />
        <StatCard title="Referrals This Month" value={p?.newReferrals ?? 0}
          icon={TrendingUp} iconColor="#059669" iconBg="#ecfdf5" />
        <StatCard title="Workshops Done" value={p?.workshops ?? 0}
          icon={BookOpen} iconColor="#7c3aed" iconBg="#f5f3ff" />
        <StatCard title="Student Projects" value={p?.projects ?? 0}
          icon={Award} iconColor="#b45309" iconBg="#fffbeb" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "8px", marginBottom: "14px" }}>
        <StatCard title="Approved Activities" value={p?.approvedActivities ?? 0}
          icon={ClipboardList} iconColor="#0369a1" iconBg="#e0f2fe" />
        <StatCard
          title="Community Members"
          value={p?.latestCommunityMetric?.totalMembers ?? 0}
          icon={MessageSquare} iconColor="#059669" iconBg="#ecfdf5"
          change={p?.latestCommunityMetric ? `+${p.latestCommunityMetric.newMembersAdded} this period` : "No data yet"}
          changeType="positive" />
      </div>

      {/* Targets progress */}
      {ch?.targetAmbassadors && (
        <Card style={{ marginBottom: "14px" }}>
          <CardHeader><CardTitle>Monthly Chapter Targets</CardTitle></CardHeader>
          <CardContent>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "8px" }}>
              {[
                { label: "Ambassadors", current: p?.totalAmbassadors ?? 0, target: ch.targetAmbassadors, color: "#3b5bdb" },
                { label: "Referrals", current: p?.newReferrals ?? 0, target: ch.targetReferrals ?? 0, color: "#0d9f6e" },
                { label: "Workshops", current: p?.workshops ?? 0, target: ch.targetWorkshops ?? 0, color: "#7c3aed" },
                { label: "Projects", current: p?.projects ?? 0, target: ch.targetProjects ?? 0, color: "#b45309" },
              ].filter(t => t.target > 0).map((t) => {
                const pct = Math.min(Math.round((t.current / t.target) * 100), 100);
                return (
                  <div key={t.label}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "8px" }}>
                      <span style={{ fontWeight: 500, color: "var(--text-secondary)" }}>{t.label}</span>
                      <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{t.current} / {t.target}</span>
                    </div>
                    <div style={{ height: "8px", borderRadius: "6px", background: "#f3f4f6", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: t.color, borderRadius: "6px", transition: "width 0.6s ease" }} />
                    </div>
                    <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>{pct}% of target</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending activities */}
      <Card>
        <CardHeader>
          <CardTitle>
            Pending Activity Reviews
            {(pendingActivities as any)?.total > 0 && (
              <span style={{ marginLeft: "8px", fontSize: "11px", fontWeight: 600, background: "#fffbeb", color: "#b45309", padding: "2px 8px", borderRadius: "6px" }}>
                {(pendingActivities as any).total}
              </span>
            )}
          </CardTitle>
          <Link href="/lead/activities">
            <Button variant="ghost" size="sm">View all <ArrowRight style={{ width: "13px", height: "13px" }} /></Button>
          </Link>
        </CardHeader>
        <CardContent>
          {!(pendingActivities as any)?.submissions?.length ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)", fontSize: "13px" }}>
              No pending submissions
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {(pendingActivities as any).submissions.map((s: any) => (
                <div key={s.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  gap: "8px", padding: "8px 10px", borderRadius: "8px",
                  transition: "background 0.1s",
                }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "var(--bg)"}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "transparent"}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {s.title}
                    </p>
                    <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                      {s.ambassador.user.firstName} {s.ambassador.user.lastName} · {s.activityType.name}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                    <Button variant="ghost" size="sm"
                      style={{ color: "#0d9f6e" }}
                      onClick={() => review.mutate({ id: s.id, status: "APPROVED" })}
                      loading={review.isPending}
                    >
                      <CheckCircle2 style={{ width: "15px", height: "15px" }} />
                    </Button>
                    <Button variant="ghost" size="sm"
                      style={{ color: "#dc2626" }}
                      onClick={() => {
                        const fb = window.prompt("Rejection feedback:");
                        if (fb) review.mutate({ id: s.id, status: "REJECTED", reviewFeedback: fb });
                      }}
                    >
                      <XCircle style={{ width: "15px", height: "15px" }} />
                    </Button>
                    <Link href={`/admin/activities/${s.id}`}>
                      <Button variant="outline" size="sm">Review</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
