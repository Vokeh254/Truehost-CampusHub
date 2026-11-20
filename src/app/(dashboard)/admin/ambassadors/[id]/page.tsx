"use client";

import { use, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { PageShell, PageHeader, SectionCard, StatusPill, Avatar } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatDate, formatPoints, tierLabel, timeAgo } from "@/lib/utils";
import { Award, ClipboardList, Users, Trophy, AlertTriangle, CheckCircle } from "lucide-react";
import Link from "next/link";

interface Props { params: Promise<{ id: string }> }

export default function AmbassadorDetailPage({ params }: Props) {
  const { id } = use(params);
  const { data: profile, isLoading, refetch } = trpc.ambassadors.byId.useQuery({ id });
  const suspend   = trpc.ambassadors.suspend.useMutation({ onSuccess: () => refetch() });
  const unsuspend = trpc.ambassadors.unsuspend.useMutation({ onSuccess: () => refetch() });
  const [reason, setReason] = useState("");
  const [showSuspend, setShowSuspend] = useState(false);

  if (isLoading) return <PageShell><div style={{ height: "200px", borderRadius: "var(--radius)", background: "#e4e8f0" }} /></PageShell>;
  if (!profile) return <PageShell><p style={{ color: "var(--text-muted)", fontSize: "12px" }}>Ambassador not found.</p></PageShell>;

  const p = profile as any;
  const currentChapter = p.memberships?.find((m: any) => !m.leftAt)?.chapter;

  return (
    <PageShell>
      {/* Profile hero */}
      <div style={{ background: "#fff", borderRadius: "var(--radius)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", padding: "20px", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
          <Avatar name={`${p.user.firstName} ${p.user.lastName}`} size={48} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
              <h1 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>{p.user.firstName} {p.user.lastName}</h1>
              <StatusPill status={p.currentTier} />
              {p.user.isSuspended && <StatusPill status="SUSPENDED" />}
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>{p.user.email}</p>
            {p.user.phone && <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>{p.user.phone}</p>}
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
              {p.institution?.name} {currentChapter ? `· ${currentChapter.institution?.name}` : ""}
            </p>
            {p.course && <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{p.course}{p.yearOfStudy ? ` · Year ${p.yearOfStudy}` : ""}</p>}
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <p style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>{formatPoints(p.totalPoints)}</p>
            <p style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>verified points</p>
            <p style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "4px" }}>Joined {formatDate(p.user.createdAt)}</p>
            {p.user.lastLoginAt && <p style={{ fontSize: "10px", color: "var(--text-muted)" }}>Last seen {timeAgo(p.user.lastLoginAt)}</p>}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px", marginBottom: "16px" }}>
        <StatCard title="Approved Activities" value={p._count?.submissions ?? 0} icon={ClipboardList} iconColor="#3b5bdb" iconBg="#eff3fe" />
        <StatCard title="Verified Referrals"  value={p._count?.referralsMade ?? 0} icon={Users}        iconColor="#0d9f6e" iconBg="#e8f8f3" />
        <StatCard title="Student Projects"    value={p._count?.projects ?? 0}      icon={Trophy}       iconColor="#6d28d9" iconBg="#f5f3ff" />
        <StatCard title="Certificates"        value={p.certificates?.length ?? 0}  icon={Award}        iconColor="#b45309" iconBg="#fef9ec" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "16px" }}>
        {/* Main */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

          {/* Tier achievements */}
          <SectionCard title="Tier Achievements">
            {!p.tierAchievements?.length ? (
              <p style={{ fontSize: "12px", color: "var(--text-muted)", padding: "12px 0" }}>No milestones reached yet</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {p.tierAchievements.map((a: any) => (
                  <div key={a.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "30px", height: "30px", borderRadius: "7px", background: "#fef9ec", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Award style={{ width: "14px", height: "14px", color: "#b45309" }} />
                      </div>
                      <div>
                        <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>{a.milestone?.name}</p>
                        <p style={{ fontSize: "10px", color: "var(--text-muted)" }}>{formatDate(a.achievedAt)}</p>
                      </div>
                    </div>
                    {a.certificate && (
                      <a href={a.certificate.verifyUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "11px", color: "var(--accent)", textDecoration: "none" }}>View Certificate</a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Chapter history */}
          <SectionCard title="Chapter History">
            {!p.memberships?.length ? (
              <p style={{ fontSize: "12px", color: "var(--text-muted)", padding: "12px 0" }}>Not part of any chapter</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {p.memberships.map((m: any) => (
                  <div key={m.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderRadius: "7px", background: "var(--bg)" }}>
                    <div>
                      <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>{m.chapter?.institution?.name}</p>
                      <p style={{ fontSize: "10px", color: "var(--text-muted)" }}>Joined {formatDate(m.joinedAt)}</p>
                    </div>
                    <StatusPill status={m.leftAt ? "INACTIVE" : "ACTIVE"} />
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

          {/* Admin actions */}
          <SectionCard title="Admin Actions">
            {p.user.isSuspended ? (
              <Button variant="success" style={{ width: "100%" }}
                onClick={() => unsuspend.mutate({ userId: p.user.id })} loading={unsuspend.isPending}>
                <CheckCircle style={{ width: "13px", height: "13px" }} /> Reinstate Account
              </Button>
            ) : showSuspend ? (
              <div>
                <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for suspension (required)…" rows={3}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "7px", border: "1px solid var(--border)", fontSize: "12px", resize: "none", outline: "none", marginBottom: "8px" }} />
                <div style={{ display: "flex", gap: "6px" }}>
                  <Button variant="destructive" size="sm" style={{ flex: 1 }}
                    onClick={() => { if (reason.length >= 10) { suspend.mutate({ userId: p.user.id, reason }); setShowSuspend(false); } }}
                    loading={suspend.isPending}>Confirm Suspension</Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowSuspend(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" style={{ width: "100%", color: "#e02d3c", borderColor: "#fca5a5" }}
                onClick={() => setShowSuspend(true)}>
                <AlertTriangle style={{ width: "13px", height: "13px" }} /> Suspend Account
              </Button>
            )}
          </SectionCard>

          {/* Certificates */}
          {p.certificates?.length > 0 && (
            <SectionCard title="Certificates">
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {p.certificates.map((cert: any) => (
                  <div key={cert.id} style={{ padding: "8px 10px", borderRadius: "7px", background: "var(--bg)" }}>
                    <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-primary)" }}>{cert.template?.tier?.replace(/_/g, " ") ?? "Certificate"}</p>
                    <p style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "1px" }}>{formatDate(cert.issuedAt)}</p>
                    <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                      {cert.pdfUrl && <a href={cert.pdfUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "10px", color: "var(--accent)", textDecoration: "none" }}>Download PDF</a>}
                      <a href={cert.verifyUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "10px", color: "var(--accent)", textDecoration: "none" }}>Verify</a>
                    </div>
                    {cert.isRevoked && <p style={{ fontSize: "10px", color: "#b91c1c", marginTop: "4px" }}>Revoked</p>}
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Profile links */}
          {(p.linkedinUrl || p.githubUrl || p.twitterUrl) && (
            <SectionCard title="Social Links">
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {p.linkedinUrl && <a href={p.linkedinUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "12px", color: "var(--accent)", textDecoration: "none" }}>LinkedIn</a>}
                {p.githubUrl && <a href={p.githubUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "12px", color: "var(--accent)", textDecoration: "none" }}>GitHub</a>}
                {p.twitterUrl && <a href={p.twitterUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "12px", color: "var(--accent)", textDecoration: "none" }}>Twitter / X</a>}
              </div>
            </SectionCard>
          )}
        </div>
      </div>
    </PageShell>
  );
}
