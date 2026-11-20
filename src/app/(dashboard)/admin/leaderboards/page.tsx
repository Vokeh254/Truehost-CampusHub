"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { PageShell, PageHeader, SectionCard, StatusPill, TabNav, Avatar, EmptyState } from "@/components/dashboard/page-header";
import { formatPoints } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type Tab = "ambassadors" | "chapters" | "community" | "workshops";

const TABS = [
  { value: "ambassadors", label: "Top Ambassadors" },
  { value: "chapters",    label: "Best Chapters" },
  { value: "community",   label: "Community Growth" },
  { value: "workshops",   label: "Most Workshops" },
];

export default function LeaderboardsPage() {
  const [tab, setTab] = useState<Tab>("ambassadors");

  const { data: topAmbassadors } = trpc.leaderboards.topAmbassadors.useQuery({ limit: 20 });
  const { data: topChapters }    = trpc.leaderboards.topChapters.useQuery({ limit: 20 });
  const { data: communityGrowth }= trpc.leaderboards.communityGrowth.useQuery({ limit: 20 });
  const { data: mostWorkshops }  = trpc.leaderboards.mostWorkshops.useQuery({ period: "monthly", limit: 20 });

  const rankColor = (i: number) => i === 0 ? "#b45309" : i === 1 ? "#6b7280" : i === 2 ? "#c2410c" : "var(--text-muted)";

  return (
    <PageShell>
      <PageHeader title="National Leaderboards" subtitle="Rankings based on verified data only" />

      <TabNav tabs={TABS} active={tab} onChange={(v) => setTab(v as Tab)} />

      <SectionCard
        title={
          tab === "ambassadors" ? "Top 20 Ambassadors — All Time" :
          tab === "chapters"    ? "Best Performing Chapters" :
          tab === "community"   ? "Highest Community Growth — This Month" :
          "Most Workshops — This Month"
        }
      >
        {tab === "ambassadors" && (
          <div>
            {!(topAmbassadors as any[])?.length
              ? <EmptyState title="No data yet" />
              : (topAmbassadors as any[]).map((amb: any, i: number) => (
                <div key={amb.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 0", borderBottom: i < (topAmbassadors as any[]).length - 1 ? "1px solid var(--border)" : "none" }}>
                  <span style={{ width: "20px", fontSize: "12px", fontWeight: 700, color: rankColor(i), textAlign: "center", flexShrink: 0 }}>{i + 1}</span>
                  <Avatar name={`${amb.user.firstName} ${amb.user.lastName}`} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>{amb.user.firstName} {amb.user.lastName}</p>
                    <p style={{ fontSize: "10px", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {amb.memberships?.[0]?.chapter?.institution?.name ?? amb.institution?.name}
                    </p>
                  </div>
                  <StatusPill status={amb.currentTier} />
                  <div style={{ textAlign: "right", minWidth: "50px" }}>
                    <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>{formatPoints(amb.totalPoints)}</p>
                    <p style={{ fontSize: "9px", color: "var(--text-muted)" }}>points</p>
                  </div>
                </div>
              ))}
          </div>
        )}

        {tab === "chapters" && (
          <div>
            {!(topChapters as any[])?.length
              ? <EmptyState title="No chapter data yet" />
              : (topChapters as any[]).map((ch: any, i: number) => (
                <div key={ch.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 0", borderBottom: i < (topChapters as any[]).length - 1 ? "1px solid var(--border)" : "none" }}>
                  <span style={{ width: "20px", fontSize: "12px", fontWeight: 700, color: rankColor(i), textAlign: "center", flexShrink: 0 }}>{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>{ch.institution.name}</p>
                    <p style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                      {ch.memberCount} ambassadors · {ch._count?.activities ?? 0} activities · {ch._count?.workshops ?? 0} workshops
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>{formatPoints(ch.totalPoints)}</p>
                    <p style={{ fontSize: "9px", color: "var(--text-muted)" }}>points</p>
                  </div>
                </div>
              ))}
          </div>
        )}

        {tab === "community" && (
          <div>
            {!(communityGrowth as any[])?.length
              ? <EmptyState title="No community metrics yet" subtitle="Campus Leads need to submit monthly reports" />
              : (communityGrowth as any[]).map((item: any, i: number) => (
                <div key={item.chapterId} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 0", borderBottom: i < (communityGrowth as any[]).length - 1 ? "1px solid var(--border)" : "none" }}>
                  <span style={{ width: "20px", fontSize: "12px", fontWeight: 700, color: rankColor(i), textAlign: "center", flexShrink: 0 }}>{i + 1}</span>
                  <p style={{ flex: 1, fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>
                    {item.chapter?.institution?.name ?? "Unknown Chapter"}
                  </p>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: "13px", fontWeight: 700, color: "#0d9f6e" }}>+{item.newMembersThisMonth}</p>
                    <p style={{ fontSize: "9px", color: "var(--text-muted)" }}>new members</p>
                  </div>
                </div>
              ))}
          </div>
        )}

        {tab === "workshops" && (
          <div>
            {!(mostWorkshops as any[])?.length
              ? <EmptyState title="No workshops recorded this month" />
              : (mostWorkshops as any[]).map((item: any, i: number) => (
                <div key={item.chapterId} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 0", borderBottom: i < (mostWorkshops as any[]).length - 1 ? "1px solid var(--border)" : "none" }}>
                  <span style={{ width: "20px", fontSize: "12px", fontWeight: 700, color: rankColor(i), textAlign: "center", flexShrink: 0 }}>{i + 1}</span>
                  <p style={{ flex: 1, fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>
                    {item.chapter?.institution?.name ?? "Unknown Chapter"}
                  </p>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--accent)" }}>{item.workshopCount}</p>
                    <p style={{ fontSize: "9px", color: "var(--text-muted)" }}>workshops</p>
                  </div>
                </div>
              ))}
          </div>
        )}
      </SectionCard>
    </PageShell>
  );
}
