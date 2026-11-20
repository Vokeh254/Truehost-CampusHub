"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageShell, PageHeader, SectionCard } from "@/components/dashboard/page-header";
import { formatDate } from "@/lib/utils";
import { Plus, X } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type FormValues = { totalMembers: string; newMembersAdded: string; membersLeft: string; activeMembers: string; announcementsShared: string; eventsPromoted: string; periodStart: string; periodEnd: string; evidenceUrl: string; notes: string };

export default function LeadCommunityPage() {
  const [showForm, setShowForm] = useState(false);
  const [groupId, setGroupId] = useState("");
  const [form, setForm] = useState<FormValues>({ totalMembers: "", newMembersAdded: "", membersLeft: "", activeMembers: "", announcementsShared: "0", eventsPromoted: "0", periodStart: "", periodEnd: "", evidenceUrl: "", notes: "" });

  const { data: session } = trpc.auth.me.useQuery();
  const chapterId = (session as any)?.leadAssignments?.[0]?.chapterId;

  const { data: groups }  = trpc.community.listGroups.useQuery();
  const { data: growthData } = trpc.community.chapterGrowth.useQuery({ chapterId: chapterId ?? "", months: 6 }, { enabled: !!chapterId });
  const { data: metrics, refetch } = trpc.community.listMetrics.useQuery({ chapterId: chapterId ?? "", limit: 12 }, { enabled: !!chapterId });
  const submitMetrics = trpc.community.submitMetrics.useMutation({ onSuccess: () => { refetch(); setShowForm(false); } });

  const chapterGroups = (groups as any[])?.filter((g: any) => g.chapterId === chapterId || g.isNational) ?? [];
  const chartData = (growthData as any[])?.map((m: any) => ({ month: new Date(m.periodStart).toLocaleString("default", { month: "short" }), members: m.totalMembers, new: m.newMembersAdded })) ?? [];
  const allMetrics = (metrics as any)?.metrics ?? [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupId || !chapterId) return;
    submitMetrics.mutate({ groupId, chapterId, periodStart: new Date(form.periodStart), periodEnd: new Date(form.periodEnd), totalMembers: Number(form.totalMembers), newMembersAdded: Number(form.newMembersAdded), membersLeft: Number(form.membersLeft), activeMembers: form.activeMembers ? Number(form.activeMembers) : undefined, announcementsShared: Number(form.announcementsShared), eventsPromoted: Number(form.eventsPromoted), evidenceUrl: form.evidenceUrl || undefined, notes: form.notes || undefined });
  };

  return (
    <PageShell>
      <PageHeader title="Community Tracking" subtitle="WhatsApp group growth and engagement metrics"
        action={<Button size="sm" onClick={() => setShowForm(!showForm)}><Plus style={{ width: "12px", height: "12px" }} /> Submit Report</Button>}
      />

      {chartData.length > 0 && (
        <div style={{ background: "#fff", borderRadius: "var(--radius)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", padding: "16px 18px", marginBottom: "14px" }}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "14px" }}>Community Growth — Last 6 Months</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f3f8" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#8c9ab0" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#8c9ab0" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ border: "1px solid var(--border)", borderRadius: "7px", fontSize: "11px" }} />
              <Line type="monotone" dataKey="members" name="Total" stroke="#3b5bdb" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="new"     name="New"   stroke="#0d9f6e" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {showForm && (
        <SectionCard style={{ marginBottom: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>Submit Community Report</p>
            <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X style={{ width: "14px", height: "14px" }} /></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
              <div>
                <label style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>WhatsApp Group *</label>
                <select value={groupId} onChange={e => setGroupId(e.target.value)} style={{ width: "100%", height: "32px", padding: "0 10px", borderRadius: "7px", border: "1px solid var(--border)", fontSize: "12px", background: "#fff", outline: "none" }}>
                  <option value="">Select group…</option>
                  {chapterGroups.map((g: any) => <option key={g.id} value={g.id}>{g.name}{g.isNational ? " (National)" : ""}</option>)}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <Input label="Period Start *" type="date" value={form.periodStart} onChange={e => setForm(f => ({ ...f, periodStart: e.target.value }))} />
                <Input label="Period End *" type="date" value={form.periodEnd} onChange={e => setForm(f => ({ ...f, periodEnd: e.target.value }))} />
              </div>
              <Input label="Total Members *" type="number" value={form.totalMembers} onChange={e => setForm(f => ({ ...f, totalMembers: e.target.value }))} />
              <Input label="New Members Added *" type="number" value={form.newMembersAdded} onChange={e => setForm(f => ({ ...f, newMembersAdded: e.target.value }))} />
              <Input label="Members Left" type="number" value={form.membersLeft} onChange={e => setForm(f => ({ ...f, membersLeft: e.target.value }))} />
              <Input label="Active Members (approx.)" type="number" value={form.activeMembers} onChange={e => setForm(f => ({ ...f, activeMembers: e.target.value }))} />
              <Input label="Announcements Shared" type="number" value={form.announcementsShared} onChange={e => setForm(f => ({ ...f, announcementsShared: e.target.value }))} />
              <Input label="Events Promoted" type="number" value={form.eventsPromoted} onChange={e => setForm(f => ({ ...f, eventsPromoted: e.target.value }))} />
            </div>
            <Input label="Evidence URL (screenshot/link)" placeholder="https://…" value={form.evidenceUrl} onChange={e => setForm(f => ({ ...f, evidenceUrl: e.target.value }))} />
            <div style={{ marginTop: "8px" }}><Textarea label="Notes" placeholder="Context or additional observations…" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
            <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
              <Button type="submit" size="sm" loading={submitMetrics.isPending}>Submit Report</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </SectionCard>
      )}

      <SectionCard title="Recent Reports">
        {allMetrics.length === 0 ? (
          <p style={{ fontSize: "12px", color: "var(--text-muted)", padding: "16px 0", textAlign: "center" }}>No reports submitted yet</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {allMetrics.map((m: any) => (
              <div key={m.id} style={{ padding: "12px", borderRadius: "7px", background: "var(--bg)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>{m.group.name}</p>
                  <p style={{ fontSize: "10px", color: "var(--text-muted)" }}>{formatDate(m.periodStart)} – {formatDate(m.periodEnd)}</p>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "8px" }}>
                  {[{ label: "Total", value: m.totalMembers, color: "#3b5bdb" }, { label: "New", value: `+${m.newMembersAdded}`, color: "#0d9f6e" }, { label: "Active", value: m.activeMembers ?? "—", color: "var(--text-primary)" }].map(s => (
                    <div key={s.label} style={{ background: "#fff", borderRadius: "6px", padding: "6px 10px", textAlign: "center" }}>
                      <p style={{ fontSize: "15px", fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</p>
                      <p style={{ fontSize: "9px", color: "var(--text-muted)", marginTop: "2px" }}>{s.label}</p>
                    </div>
                  ))}
                </div>
                {m.verifiedAt && <p style={{ fontSize: "10px", color: "#0d9f6e", marginTop: "6px" }}>Verified</p>}
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </PageShell>
  );
}
