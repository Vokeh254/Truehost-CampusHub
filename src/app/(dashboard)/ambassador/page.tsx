"use client";

import { PageShell } from "@/components/dashboard/page-header";
import { trpc } from "@/lib/trpc";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Trophy, Award, ClipboardList, TrendingUp, Star } from "lucide-react";
import { formatPoints, formatDate } from "@/lib/utils";
import Link from "next/link";

const TIER_LABELS: Record<string, string> = {
  CAMPUS_AMBASSADOR:        "Campus Ambassador",
  CHAPTER_LEAD_ACHIEVEMENT: "Chapter Lead Achievement",
  NATIONAL_CLOUD_FELLOW:    "National Cloud Fellow",
};

const TIER_NEXT: Record<string, number> = {
  CAMPUS_AMBASSADOR:        100,
  CHAPTER_LEAD_ACHIEVEMENT: 300,
  NATIONAL_CLOUD_FELLOW:    300,
};

export default function AmbassadorDashboard() {
  const { data, isLoading } = trpc.ambassadors.dashboard.useQuery();
  const { data: notifData } = trpc.notifications.list.useQuery({ limit: 6 });

  // Loading skeleton
  if (isLoading) {
    return (
      <div style={{ padding: "24px 28px" }}>
        <div style={{ height: "18px", width: "200px", borderRadius: "4px", background: "#e4e8f0", marginBottom: "20px" }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px", marginBottom: "16px" }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ height: "90px", borderRadius: "var(--radius)", background: "#e4e8f0" }} />
          ))}
        </div>
        <div style={{ height: "100px", borderRadius: "var(--radius)", background: "#e4e8f0" }} />
      </div>
    );
  }

  // Safely unwrap — guard every nested field
  const d = data as any;
  const profile = d?.profile;
  const user = profile?.user;
  const institution = profile?.institution;

  // If the ambassador profile isn't set up yet show a prompt
  if (!profile || !user) {
    return (
      <div style={{ padding: "24px 28px" }}>
        <div style={{
          background: "#fff", borderRadius: "var(--radius)", border: "1px solid var(--border)",
          padding: "32px", textAlign: "center",
        }}>
          <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "6px" }}>
            Profile not set up
          </p>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "16px" }}>
            Your ambassador profile is being configured. Please contact your Campus Lead or the administrator.
          </p>
          <Link href="/ambassador/profile">
            <Button>Complete Profile</Button>
          </Link>
        </div>
      </div>
    );
  }

  const tier = profile.currentTier ?? "CAMPUS_AMBASSADOR";
  const tierLabel = TIER_LABELS[tier] ?? tier;
  const nextPts = TIER_NEXT[tier] ?? 300;
  const progress = Math.min((profile.totalPoints / nextPts) * 100, 100);
  const isTopTier = tier === "NATIONAL_CLOUD_FELLOW";

  const nationalRank: number = d?.nationalRank ?? 0;
  const chapterRank: number = d?.chapterRank ?? 0;
  const pendingSubmissions: number = d?.pendingSubmissions ?? 0;
  const certificates = profile?.certificates ?? [];
  const tierAchievements = profile?.tierAchievements ?? [];
  const notifications = (notifData as any)?.notifications ?? [];

  return (
    <div style={{ padding: "24px 28px" }}>

      {/* Page header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "18px" }}>
        <div>
          <h1 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>
            Welcome back, {user.firstName}
          </h1>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
            {institution?.name ?? ""}
          </p>
        </div>
        <Link href="/ambassador/activities/submit">
          <Button>Submit Activity</Button>
        </Link>
      </div>

      {/* Tier progress banner */}
      <div style={{
        background: "linear-gradient(135deg, #3b5bdb 0%, #2f4ac4 100%)",
        borderRadius: "var(--radius)", padding: "16px 20px",
        display: "flex", alignItems: "center", gap: "20px",
        marginBottom: "16px",
      }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: "10px", fontWeight: 600, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>
            Current Tier
          </p>
          <p style={{ fontSize: "16px", fontWeight: 700, color: "#fff" }}>{tierLabel}</p>
          <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.65)", marginTop: "2px" }}>
            {formatPoints(profile.totalPoints)} verified points
          </p>
          {!isTopTier && (
            <div style={{ marginTop: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "rgba(255,255,255,0.55)", marginBottom: "4px" }}>
                <span>Progress to next tier</span>
                <span>{formatPoints(profile.totalPoints)} / {formatPoints(nextPts)} pts</span>
              </div>
              <div style={{ height: "5px", borderRadius: "99px", background: "rgba(255,255,255,0.2)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${progress}%`, background: "rgba(255,255,255,0.9)", borderRadius: "99px", transition: "width 0.6s ease" }} />
              </div>
            </div>
          )}
        </div>
        <Star style={{ width: "36px", height: "36px", color: "rgba(255,255,255,0.2)", flexShrink: 0 }} />
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px", marginBottom: "16px" }}>
        <StatCard
          title="National Rank"
          value={nationalRank > 0 ? `#${nationalRank}` : "—"}
          icon={Trophy}
          iconColor="#b45309"
          iconBg="#fef9ec"
        />
        <StatCard
          title="Chapter Rank"
          value={chapterRank > 0 ? `#${chapterRank}` : "—"}
          icon={TrendingUp}
          iconColor="#3b5bdb"
          iconBg="#eff3fe"
        />
        <StatCard
          title="Pending Approvals"
          value={pendingSubmissions}
          icon={ClipboardList}
          iconColor="#d97706"
          iconBg="#fef9ec"
          change={pendingSubmissions > 0 ? "Awaiting review" : "All reviewed"}
          changeType={pendingSubmissions > 0 ? "negative" : "positive"}
        />
        <StatCard
          title="Certificates"
          value={certificates.length}
          icon={Award}
          iconColor="#7c3aed"
          iconBg="#f5f3ff"
        />
      </div>

      {/* Bottom two panels */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

        {/* Achievements */}
        <div style={{ background: "#fff", borderRadius: "var(--radius)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", padding: "16px 18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>Achievements</p>
            <Link href="/ambassador/activities" style={{ fontSize: "11px", color: "var(--accent)", textDecoration: "none" }}>View all</Link>
          </div>

          {tierAchievements.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text-muted)", fontSize: "12px" }}>
              No milestones reached yet. Keep submitting activities.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {tierAchievements.slice(0, 4).map((a: any) => (
                <div key={a.id} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "30px", height: "30px", borderRadius: "7px", background: "#fef9ec", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Award style={{ width: "14px", height: "14px", color: "#b45309" }} />
                  </div>
                  <div>
                    <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>{a.milestone?.name}</p>
                    <p style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "1px" }}>{formatDate(a.achievedAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div style={{ background: "#fff", borderRadius: "var(--radius)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", padding: "16px 18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>Notifications</p>
            <Link href="/notifications" style={{ fontSize: "11px", color: "var(--accent)", textDecoration: "none" }}>View all</Link>
          </div>

          {notifications.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text-muted)", fontSize: "12px" }}>
              No notifications
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {notifications.map((n: any) => (
                <div key={n.id} style={{
                  padding: "8px 10px", borderRadius: "7px",
                  background: n.isRead ? "transparent" : "var(--accent-light)",
                }}>
                  <p style={{ fontSize: "12px", fontWeight: n.isRead ? 400 : 600, color: "var(--text-primary)" }}>
                    {n.title}
                  </p>
                  <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "1px" }}>{n.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
