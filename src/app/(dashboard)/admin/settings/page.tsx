"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { PageShell, PageHeader, SectionCard } from "@/components/dashboard/page-header";
import { Plus, Pencil, Save, X } from "lucide-react";

const CATEGORIES = ["Recruitment","Education","Community","Competition","Technical","Engagement","Marketing","Mentorship","Networking","Media","Content"];
const SCORING_WEIGHTS = [["Active Ambassadors","15%"],["New Recruits","15%"],["Community Growth","10%"],["Workshops Organised","15%"],["Verified Activities","15%"],["Student Projects","10%"],["Reporting Consistency","10%"],["Media Engagements","5%"],["Community Engagement","5%"]];

export default function SettingsPage() {
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: "", category: "", basePoints: "10", maxPointsPerMonth: "" });

  const { data: types, refetch } = trpc.activities.listTypes.useQuery();
  const createType = trpc.activities.createType.useMutation({ onSuccess: () => { refetch(); setShowNew(false); setForm({ name: "", category: "", basePoints: "10", maxPointsPerMonth: "" }); } });
  const updateType = trpc.activities.updateType.useMutation({ onSuccess: () => refetch() });

  return (
    <PageShell>
      <PageHeader title="System Settings" subtitle="Configure activity types, points and scoring rules" />

      <SectionCard
        title="Activity Types & Points"
        action={<Button size="sm" onClick={() => setShowNew(!showNew)}><Plus style={{ width: "12px", height: "12px" }} /> Add Type</Button>}
        noPad
        style={{ marginBottom: "14px" }}
      >
        {showNew && (
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", background: "var(--accent-light)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto", gap: "8px", alignItems: "flex-end" }}>
              <div>
                <label style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "3px" }}>Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Campus Hackathon"
                  style={{ width: "100%", height: "30px", padding: "0 8px", borderRadius: "6px", border: "1px solid var(--border)", fontSize: "12px", outline: "none", background: "#fff" }} />
              </div>
              <div>
                <label style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "3px" }}>Category *</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  style={{ width: "100%", height: "30px", padding: "0 6px", borderRadius: "6px", border: "1px solid var(--border)", fontSize: "12px", background: "#fff", outline: "none" }}>
                  <option value="">Select…</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "3px" }}>Pts *</label>
                <input type="number" value={form.basePoints} onChange={e => setForm(f => ({ ...f, basePoints: e.target.value }))}
                  style={{ width: "100%", height: "30px", padding: "0 8px", borderRadius: "6px", border: "1px solid var(--border)", fontSize: "12px", outline: "none", background: "#fff" }} />
              </div>
              <div>
                <label style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "3px" }}>Max/Mo</label>
                <input type="number" value={form.maxPointsPerMonth} onChange={e => setForm(f => ({ ...f, maxPointsPerMonth: e.target.value }))} placeholder="∞"
                  style={{ width: "100%", height: "30px", padding: "0 8px", borderRadius: "6px", border: "1px solid var(--border)", fontSize: "12px", outline: "none", background: "#fff" }} />
              </div>
              <div style={{ display: "flex", gap: "4px" }}>
                <Button size="sm" onClick={() => { if (!form.name || !form.category) return; createType.mutate({ name: form.name, category: form.category, basePoints: Number(form.basePoints), maxPointsPerMonth: form.maxPointsPerMonth ? Number(form.maxPointsPerMonth) : undefined }); }} loading={createType.isPending}>Save</Button>
                <Button size="sm" variant="ghost" onClick={() => setShowNew(false)}><X style={{ width: "12px", height: "12px" }} /></Button>
              </div>
            </div>
          </div>
        )}

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#fafbfd", borderBottom: "1px solid var(--border)" }}>
              {["Name","Category","Points","Max / Month","Status",""].map(h => (
                <th key={h} style={{ padding: "9px 14px", textAlign: h === "" ? "right" : "left", fontSize: "10.5px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(types as any[])?.map((type: any) => <ActivityTypeRow key={type.id} type={type} onUpdate={updateType} />)}
          </tbody>
        </table>
      </SectionCard>

      <SectionCard title="Campus Lead Scoring Weights">
        <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "12px" }}>
          These weights determine how Campus Leads are ranked. All weights sum to 100.
          Adjust via the <code style={{ background: "var(--bg)", padding: "1px 5px", borderRadius: "4px", fontSize: "10px" }}>campus_lead_scoring_weights</code> key in the system settings database.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "8px" }}>
          {SCORING_WEIGHTS.map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderRadius: "7px", background: "var(--bg)" }}>
              <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{k}</span>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--accent)" }}>{v}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </PageShell>
  );
}

function ActivityTypeRow({ type, onUpdate }: { type: any; onUpdate: any }) {
  const [editing, setEditing] = useState(false);
  const [pts, setPts] = useState(String(type.basePoints));
  const [maxPts, setMaxPts] = useState(type.maxPointsPerMonth ? String(type.maxPointsPerMonth) : "");

  return (
    <tr style={{ borderBottom: "1px solid var(--border)" }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#fafbfd")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
    >
      <td style={{ padding: "9px 14px", fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>{type.name}</td>
      <td style={{ padding: "9px 14px", fontSize: "11px", color: "var(--text-muted)" }}>{type.category}</td>
      <td style={{ padding: "9px 14px" }}>
        {editing ? <input type="number" value={pts} onChange={e => setPts(e.target.value)} style={{ width: "60px", height: "26px", padding: "0 6px", borderRadius: "5px", border: "1px solid var(--border)", fontSize: "12px", outline: "none" }} />
          : <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>{type.basePoints} pts</span>}
      </td>
      <td style={{ padding: "9px 14px" }}>
        {editing ? <input type="number" value={maxPts} onChange={e => setMaxPts(e.target.value)} placeholder="∞" style={{ width: "60px", height: "26px", padding: "0 6px", borderRadius: "5px", border: "1px solid var(--border)", fontSize: "12px", outline: "none" }} />
          : <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{type.maxPointsPerMonth ? `${type.maxPointsPerMonth}/mo` : "Unlimited"}</span>}
      </td>
      <td style={{ padding: "9px 14px" }}>
        <span style={{ fontSize: "10px", fontWeight: 500, padding: "2px 7px", borderRadius: "4px", background: type.isActive ? "#e8f8f3" : "#f0f3fb", color: type.isActive ? "#0d7a56" : "#64748b" }}>
          {type.isActive ? "Active" : "Inactive"}
        </span>
      </td>
      <td style={{ padding: "9px 14px", textAlign: "right" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "4px" }}>
          {editing ? (
            <>
              <Button size="sm" onClick={() => { onUpdate.mutate({ id: type.id, basePoints: Number(pts), maxPointsPerMonth: maxPts ? Number(maxPts) : null }); setEditing(false); }} loading={onUpdate.isPending}><Save style={{ width: "11px", height: "11px" }} /></Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}><X style={{ width: "11px", height: "11px" }} /></Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="ghost" onClick={() => setEditing(true)}><Pencil style={{ width: "11px", height: "11px" }} /></Button>
              <Button size="sm" variant="ghost" onClick={() => onUpdate.mutate({ id: type.id, isActive: !type.isActive })}>{type.isActive ? "Disable" : "Enable"}</Button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
