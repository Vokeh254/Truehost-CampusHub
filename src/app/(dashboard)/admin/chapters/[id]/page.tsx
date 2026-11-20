"use client";

import { use, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { PageShell, PageHeader, SectionCard, StatusPill, Avatar } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatDate, formatPoints, tierLabel } from "@/lib/utils";
import { Users, ClipboardList, BookOpen, TrendingUp, UserPlus, X } from "lucide-react";
import Link from "next/link";

interface Props { params: Promise<{ id: string }> }

export default function ChapterDetailPage({ params }: Props) {
  const { id } = use(params);
  const { data: chapter, isLoading, refetch } = trpc.chapters.byId.useQuery({ id });
  const { data: perf } = trpc.chapters.performance.useQuery({ id, period: "monthly" });
  const { data: allUsers } = trpc.ambassadors.list.useQuery({ limit: 200 });

  const assignLead = trpc.chapters.assignLead.useMutation({ onSuccess: () => refetch() });
  const revokeLead = trpc.chapters.revokeLead.useMutation({ onSuccess: () => refetch() });

  const [showAssign, setShowAssign] = useState(false);
  const [newLeadUserId, setNewLeadUserId] = useState("");
  const [newLeadRole, setNewLeadRole] = useState<"LEAD" | "DEPUTY_LEAD">("LEAD");

  if (isLoading) return <PageShell><div style={{ height: "200px", borderRadius: "var(--radius)", background: "#e4e8f0" }} /></PageShell>;
  if (!chapter) return <PageShell><p style={{ color: "var(--text-muted)", fontSize: "12px" }}>Chapter not found.</p></PageShell>;

  const ch = chapter as any;
  const p = perf as any;
  const activeLead   = ch.leadAssignments?.find((a: any) => !a.revokedAt && a.role === "LEAD");
  const deputyLead   = ch.leadAssignments?.find((a: any) => !a.revokedAt && a.role === "DEPUTY_LEAD");
  const pastLeads    = ch.leadAssignments?.filter((a: any) => a.revokedAt) ?? [];

  return (
    <PageShell>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "18px" }}>
        <div>
          <h1 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>{ch.institution?.name}</h1>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
            {ch.institution?.county} · {ch.institution?.type} · {ch.institution?.town}
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <StatusPill status={ch.status} />
          <Link href={`/admin/chapters`}><Button variant="outline" size="sm">All Chapters</Button></Link>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px", marginBottom: "16px" }}>
        <StatCard title="Ambassadors"       value={ch._count?.memberships ?? 0}  icon={Users}        iconColor="#3b5bdb" iconBg="#eff3fe" />
        <StatCard title="Referrals (Month)" value={p?.newReferrals ?? 0}         icon={TrendingUp}   iconColor="#0d9f6e" iconBg="#e8f8f3" />
        <StatCard title="Activities (Month)"value={p?.approvedActivities ?? 0}   icon={ClipboardList}iconColor="#0369a1" iconBg="#eff8ff" />
        <StatCard title="Workshops"         value={p?.workshops ?? 0}            icon={BookOpen}     iconColor="#6d28d9" iconBg="#f5f3ff" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "16px" }}>
        {/* Left */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

          {/* Ambassadors */}
          <SectionCard title="Ambassadors" subtitle={`${ch.memberships?.length ?? 0} current members`}>
            {!ch.memberships?.length ? (
              <p style={{ fontSize: "12px", color: "var(--text-muted)", padding: "12px 0" }}>No ambassadors in this chapter yet</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {ch.memberships.map((m: any) => (
                  <div key={m.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Avatar name={`${m.ambassador.user.firstName} ${m.ambassador.user.lastName}`} />
                      <div>
                        <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>
                          {m.ambassador.user.firstName} {m.ambassador.user.lastName}
                        </p>
                        <p style={{ fontSize: "10px", color: "var(--text-muted)" }}>{m.ambassador.user.email}</p>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <StatusPill status={m.ambassador.currentTier} />
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--accent)", minWidth: "50px", textAlign: "right" }}>
                        {formatPoints(m.ambassador.totalPoints)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* WhatsApp */}
          <SectionCard title="WhatsApp Group">
            {ch.whatsappGroupName && (
              <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-primary)", marginBottom: "4px" }}>{ch.whatsappGroupName}</p>
            )}
            {ch.whatsappGroupLink ? (
              <a href={ch.whatsappGroupLink} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: "12px", color: "var(--accent)", textDecoration: "none" }}>
                {ch.whatsappGroupLink}
              </a>
            ) : (
              <p style={{ fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic" }}>No group link set</p>
            )}
          </SectionCard>
        </div>

        {/* Right */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

          {/* Leadership */}
          <SectionCard
            title="Leadership"
            action={
              <Button size="sm" variant="outline" onClick={() => setShowAssign(!showAssign)}>
                <UserPlus style={{ width: "12px", height: "12px" }} /> Assign
              </Button>
            }
          >
            {showAssign && (
              <div style={{ marginBottom: "12px", padding: "12px", background: "var(--accent-light)", borderRadius: "7px" }}>
                <div style={{ marginBottom: "8px" }}>
                  <label style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Ambassador</label>
                  <select value={newLeadUserId} onChange={e => setNewLeadUserId(e.target.value)}
                    style={{ width: "100%", height: "28px", padding: "0 8px", borderRadius: "6px", border: "1px solid var(--border)", fontSize: "12px", background: "#fff", outline: "none" }}>
                    <option value="">Choose…</option>
                    {(allUsers as any)?.ambassadors?.map((a: any) => (
                      <option key={a.user.id} value={a.user.id}>{a.user.firstName} {a.user.lastName}</option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: "8px" }}>
                  <label style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Role</label>
                  <select value={newLeadRole} onChange={e => setNewLeadRole(e.target.value as any)}
                    style={{ width: "100%", height: "28px", padding: "0 8px", borderRadius: "6px", border: "1px solid var(--border)", fontSize: "12px", background: "#fff", outline: "none" }}>
                    <option value="LEAD">Campus Lead</option>
                    <option value="DEPUTY_LEAD">Deputy Lead</option>
                  </select>
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <Button size="sm" onClick={() => { if (newLeadUserId) { assignLead.mutate({ chapterId: ch.id, userId: newLeadUserId, role: newLeadRole }); setShowAssign(false); setNewLeadUserId(""); } }} loading={assignLead.isPending}>Assign</Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowAssign(false)}>Cancel</Button>
                </div>
              </div>
            )}

            {activeLead ? (
              <div style={{ marginBottom: "10px" }}>
                <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "6px" }}>Campus Lead</p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Avatar name={`${activeLead.user.firstName} ${activeLead.user.lastName}`} size={26} />
                    <div>
                      <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>{activeLead.user.firstName} {activeLead.user.lastName}</p>
                      <p style={{ fontSize: "10px", color: "var(--text-muted)" }}>Since {formatDate(activeLead.assignedAt)}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="destructive" onClick={() => revokeLead.mutate({ assignmentId: activeLead.id })} loading={revokeLead.isPending}>Revoke</Button>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic" }}>No Campus Lead assigned</p>
            )}

            {deputyLead && (
              <div style={{ paddingTop: "10px", borderTop: "1px solid var(--border)" }}>
                <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "6px" }}>Deputy Lead</p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Avatar name={`${deputyLead.user.firstName} ${deputyLead.user.lastName}`} size={26} />
                    <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>{deputyLead.user.firstName} {deputyLead.user.lastName}</p>
                  </div>
                  <Button size="sm" variant="destructive" onClick={() => revokeLead.mutate({ assignmentId: deputyLead.id })} loading={revokeLead.isPending}>Revoke</Button>
                </div>
              </div>
            )}

            {pastLeads.length > 0 && (
              <div style={{ paddingTop: "10px", borderTop: "1px solid var(--border)", marginTop: "10px" }}>
                <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "6px" }}>Previous Leads</p>
                {pastLeads.map((a: any) => (
                  <div key={a.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
                    <span style={{ color: "var(--text-secondary)" }}>{a.user.firstName} {a.user.lastName}</span>
                    <span style={{ color: "var(--text-muted)" }}>{formatDate(a.assignedAt)} – {formatDate(a.revokedAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Targets */}
          <SectionCard title="Chapter Targets">
            {[
              { label: "Ambassadors", current: ch._count?.memberships ?? 0, target: ch.targetAmbassadors },
              { label: "Referrals",   current: p?.newReferrals ?? 0,        target: ch.targetReferrals },
              { label: "Workshops",   current: p?.workshops ?? 0,           target: ch.targetWorkshops },
              { label: "Projects",    current: p?.projects ?? 0,            target: ch.targetProjects },
            ].map(({ label, current, target }) => (
              <div key={label} style={{ marginBottom: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
                  <span style={{ color: "var(--text-secondary)" }}>{label}</span>
                  <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{current} / {target ?? "—"}</span>
                </div>
                {target && (
                  <div style={{ height: "5px", borderRadius: "99px", background: "#f0f3fb", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.min((current / target) * 100, 100)}%`, background: "var(--accent)", borderRadius: "99px" }} />
                  </div>
                )}
              </div>
            ))}
          </SectionCard>
        </div>
      </div>
    </PageShell>
  );
}
