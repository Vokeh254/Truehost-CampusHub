"use client";
import { PageShell } from "@/components/dashboard/page-header";

import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, statusColor } from "@/lib/utils";
import { Globe, Mic2, CheckCircle2, FileText, TrendingUp, Users, Bell, Plus, ArrowRight } from "lucide-react";
import Link from "next/link";

function KPI({ label, value, sub, color = "var(--text-primary)" }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ background: "#fff", borderRadius: "8px", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", padding: "8px 12px" }}>
      <p style={{ fontSize: "26px", fontWeight: 700, color, lineHeight: 1.1 }}>{typeof value === "number" ? value.toLocaleString() : value}</p>
      <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>{label}</p>
      {sub && <p style={{ fontSize: "11px", color: "var(--success)", marginTop: "2px" }}>{sub}</p>}
    </div>
  );
}

export default function MediaDashboardPage() {
  const { data: dashboard, isLoading } = trpc.media.dashboard.useQuery();
  const { data: opportunities } = trpc.media.listOpportunities.useQuery({ limit: 8 });
  const { data: followUps, refetch } = trpc.media.followUpsDue.useQuery();
  const markDone = trpc.media.markFollowUpDone.useMutation({ onSuccess: () => refetch() });

  const d = dashboard as any;

  if (isLoading) {
    return (
      <div style={{ padding: "24px 28px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "8px" }}>
          {Array.from({ length: 8 }).map((_, i) => <div key={i} style={{ height: "100px", borderRadius: "8px", background: "#e9ebee" }} />)}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 28px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px" }}>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)" }}>Media & Industry Visibility</h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>Track outreach, podcast appearances and partnerships</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <Link href="/admin/media/organisations"><Button variant="outline"><Globe style={{ width: "15px", height: "15px" }} /> Media Orgs</Button></Link>
          <Link href="/admin/media/opportunities/new"><Button><Plus style={{ width: "15px", height: "15px" }} /> New Opportunity</Button></Link>
        </div>
      </div>

      {/* KPI grid — 4 columns */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "8px", marginBottom: "14px" }}>
        <KPI label="Organisations Tracked" value={d?.totalOrgs ?? 0} />
        <KPI label="Total Outreach" value={d?.totalOpportunities ?? 0} />
        <KPI label="Confirmed Interviews" value={d?.confirmedInterviews ?? 0} color="var(--success)" />
        <KPI label="Published / Completed" value={d?.publishedArticles ?? 0} color="var(--accent)" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "8px", marginBottom: "12px" }}>
        <KPI label="Pitches Sent" value={d?.totalPitched ?? 0} />
        <KPI label="Contacted" value={d?.totalContacted ?? 0} />
        <KPI
          label="Follow-ups Due"
          value={d?.followUpsDue ?? 0}
          color={d?.followUpsDue > 0 ? "var(--danger)" : "var(--text-primary)"}
          sub={d?.followUpsDue > 0 ? "Needs action" : "All clear"}
        />
        <KPI label="Conversion Rate" value={`${(d?.conversionRate ?? 0).toFixed(1)}%`} color="var(--accent)" />
      </div>

      {/* Pipeline status row */}
      {d?.byStatus?.length > 0 && (
        <div style={{ marginBottom: "12px" }}>
          <p style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: "12px" }}>
            Pipeline Status
          </p>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {(d.byStatus as any[]).map((s: any) => (
              <div key={s.status} style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "5px 12px", borderRadius: "6px",
                background: "#fff", border: "1px solid var(--border)",
              }}>
                <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{s.status.replace(/_/g, " ")}</span>
                <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>{s._count.id}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two column bottom */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>

        {/* Recent opportunities */}
        <div style={{ background: "#fff", borderRadius: "8px", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 14px" }}>
            <div>
              <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>Recent Opportunities</p>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "1px" }}>Latest media outreach</p>
            </div>
            <Link href="/admin/media/opportunities">
              <Button variant="ghost" size="sm">View all <ArrowRight style={{ width: "13px", height: "13px" }} /></Button>
            </Link>
          </div>
          <div style={{ padding: "0 24px 20px" }}>
            {!(opportunities as any)?.opportunities?.length ? (
              <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)", fontSize: "13px" }}>
                No opportunities yet
              </div>
            ) : (
              <div>
                {(opportunities as any).opportunities.map((op: any, i: number) => (
                  <div key={op.id} style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    padding: "12px 0",
                    borderTop: i === 0 ? "none" : "1px solid var(--border)",
                  }}>
                    <div style={{ width: "24px", height: "24px", borderRadius: "9px", background: "#f5f3ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Mic2 style={{ width: "14px", height: "14px", color: "#7c3aed" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {op.organisation.name}
                      </p>
                      <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {op.topicProposed}
                      </p>
                    </div>
                    <Badge className={statusColor(op.status)}>
                      {op.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Follow-ups */}
        <div style={{ background: "#fff", borderRadius: "8px", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 14px" }}>
            <div>
              <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>Follow-ups Due</p>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "1px" }}>
                {(followUps as any[])?.length ?? 0} outstanding
              </p>
            </div>
            <Link href="/admin/media/followups">
              <Button variant="ghost" size="sm">View all <ArrowRight style={{ width: "13px", height: "13px" }} /></Button>
            </Link>
          </div>
          <div style={{ padding: "0 24px 20px" }}>
            {!(followUps as any[])?.length ? (
              <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)", fontSize: "13px" }}>
                No follow-ups pending
              </div>
            ) : (
              <div>
                {(followUps as any[]).slice(0, 6).map((f: any, i: number) => (
                  <div key={f.id} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px",
                    padding: "12px 0",
                    borderTop: i === 0 ? "none" : "1px solid var(--border)",
                  }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {f.mediaOpportunity?.organisation?.name ?? f.event?.name ?? "Unknown"}
                      </p>
                      <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                        {f.channel} · Due {formatDate(f.followUpDate)}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => markDone.mutate({ interactionId: f.id })} loading={markDone.isPending}>
                      Done
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
