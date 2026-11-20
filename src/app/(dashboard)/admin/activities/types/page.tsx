"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { PageShell, PageHeader, SectionCard } from "@/components/dashboard/page-header";
import { Plus, Pencil, Save, X } from "lucide-react";

const CATEGORIES = ["Recruitment","Education","Community","Competition","Technical","Engagement","Marketing","Mentorship","Networking","Media","Content"];

type FormValues = { name: string; category: string; basePoints: string; maxPointsPerMonth: string };

export default function ActivityTypesPage() {
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState<FormValues>({ name: "", category: "", basePoints: "10", maxPointsPerMonth: "" });

  const { data: types, refetch } = trpc.activities.listTypes.useQuery();
  const createType = trpc.activities.createType.useMutation({ onSuccess: () => { refetch(); setShowNew(false); setForm({ name: "", category: "", basePoints: "10", maxPointsPerMonth: "" }); } });
  const updateType = trpc.activities.updateType.useMutation({ onSuccess: () => refetch() });

  const handleCreate = () => {
    if (!form.name || !form.category) return;
    createType.mutate({ name: form.name, category: form.category, basePoints: Number(form.basePoints), maxPointsPerMonth: form.maxPointsPerMonth ? Number(form.maxPointsPerMonth) : undefined });
  };

  return (
    <PageShell>
      <PageHeader
        title="Activity Types"
        subtitle="Configure categories and point values"
        action={
          <Button size="sm" onClick={() => setShowNew(!showNew)}>
            <Plus style={{ width: "12px", height: "12px" }} /> Add Type
          </Button>
        }
      />

      {showNew && (
        <div style={{ background: "#fff", borderRadius: "var(--radius)", border: "1px solid var(--border)", padding: "16px 18px", marginBottom: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>New Activity Type</p>
            <button onClick={() => setShowNew(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X style={{ width: "14px", height: "14px" }} /></button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "10px", marginBottom: "12px" }}>
            <div>
              <label style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Campus Hackathon"
                style={{ width: "100%", height: "30px", padding: "0 10px", borderRadius: "6px", border: "1px solid var(--border)", fontSize: "12px", outline: "none" }} />
            </div>
            <div>
              <label style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Category *</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                style={{ width: "100%", height: "30px", padding: "0 8px", borderRadius: "6px", border: "1px solid var(--border)", fontSize: "12px", background: "#fff", outline: "none" }}>
                <option value="">Select…</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Base Points *</label>
              <input type="number" value={form.basePoints} onChange={e => setForm(f => ({ ...f, basePoints: e.target.value }))} placeholder="30"
                style={{ width: "100%", height: "30px", padding: "0 10px", borderRadius: "6px", border: "1px solid var(--border)", fontSize: "12px", outline: "none" }} />
            </div>
            <div>
              <label style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Max / Month</label>
              <input type="number" value={form.maxPointsPerMonth} onChange={e => setForm(f => ({ ...f, maxPointsPerMonth: e.target.value }))} placeholder="Unlimited"
                style={{ width: "100%", height: "30px", padding: "0 10px", borderRadius: "6px", border: "1px solid var(--border)", fontSize: "12px", outline: "none" }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <Button size="sm" onClick={handleCreate} loading={createType.isPending}>Save</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowNew(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <SectionCard noPad>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#fafbfd", borderBottom: "1px solid var(--border)" }}>
              {["Name","Category","Base Points","Max / Month","Status",""].map(h => (
                <th key={h} style={{ padding: "9px 14px", textAlign: "left", fontSize: "10.5px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(types as any[])?.map((type: any) => (
              <ActivityTypeRow key={type.id} type={type} onUpdate={updateType} />
            ))}
          </tbody>
        </table>
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
      <td style={{ padding: "9px 14px" }}>
        <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>{type.name}</p>
      </td>
      <td style={{ padding: "9px 14px", fontSize: "11px", color: "var(--text-muted)" }}>{type.category}</td>
      <td style={{ padding: "9px 14px" }}>
        {editing ? (
          <input type="number" value={pts} onChange={e => setPts(e.target.value)}
            style={{ width: "70px", height: "26px", padding: "0 8px", borderRadius: "5px", border: "1px solid var(--border)", fontSize: "12px", textAlign: "center", outline: "none" }} />
        ) : (
          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>{type.basePoints} pts</span>
        )}
      </td>
      <td style={{ padding: "9px 14px" }}>
        {editing ? (
          <input type="number" value={maxPts} onChange={e => setMaxPts(e.target.value)} placeholder="∞"
            style={{ width: "70px", height: "26px", padding: "0 8px", borderRadius: "5px", border: "1px solid var(--border)", fontSize: "12px", textAlign: "center", outline: "none" }} />
        ) : (
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{type.maxPointsPerMonth ? `${type.maxPointsPerMonth} / mo` : "Unlimited"}</span>
        )}
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
              <Button size="sm" onClick={() => { onUpdate.mutate({ id: type.id, basePoints: Number(pts), maxPointsPerMonth: maxPts ? Number(maxPts) : null }); setEditing(false); }} loading={onUpdate.isPending}>
                <Save style={{ width: "11px", height: "11px" }} /> Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
                <Pencil style={{ width: "11px", height: "11px" }} /> Edit
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onUpdate.mutate({ id: type.id, isActive: !type.isActive })}>
                {type.isActive ? "Disable" : "Enable"}
              </Button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
