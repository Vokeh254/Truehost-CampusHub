"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageShell, PageHeader, DataTable, THead, Th, TRow, Td, StatusPill, EmptyState } from "@/components/dashboard/page-header";
import { Plus, X } from "lucide-react";

const COUNTIES = ["Nairobi","Mombasa","Kisumu","Nakuru","Kiambu","Machakos","Meru","Nyeri","Kakamega","Kisii","Kilifi","Uasin Gishu","Muranga","Siaya","Homabay","Migori","Bungoma","Trans Nzoia","Kericho","Nandi","Laikipia","Nyamira","Kirinyaga","Embu","Tharaka Nithi","Marsabit","Garissa","Turkana","Baringo","Narok","Vihiga","Lamu","Tana River","Taita Taveta","Kwale","Kajiado","Makueni","Kitui","Other"];

type F = { name: string; shortName: string; county: string; town: string; region: string; website: string };

export default function InstitutionsPage() {
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState("UNIVERSITY");
  const [county, setCounty] = useState("");
  const { data: institutions, refetch } = trpc.chapters.listInstitutions.useQuery();
  const create = trpc.chapters.createInstitution.useMutation({ onSuccess: () => { refetch(); setShowForm(false); reset(); } });
  const { register, handleSubmit, reset, formState: { errors } } = useForm<F>();

  const onSubmit = (data: F) => create.mutate({ name: data.name, shortName: data.shortName || undefined, type: type as any, county, town: data.town, region: data.region || undefined, website: data.website || undefined });

  return (
    <PageShell>
      <PageHeader title="Institutions" subtitle={`${(institutions as any[])?.length ?? 0} registered`}
        action={<Button size="sm" onClick={() => setShowForm(!showForm)}><Plus style={{ width: "12px", height: "12px" }} /> Add Institution</Button>}
      />

      {showForm && (
        <div style={{ background: "#fff", borderRadius: "var(--radius)", border: "1px solid var(--border)", padding: "16px 18px", marginBottom: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>New Institution</p>
            <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X style={{ width: "14px", height: "14px" }} /></button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)}>
            {create.error && <div style={{ padding: "8px 12px", borderRadius: "7px", background: "var(--danger-light)", color: "var(--danger)", fontSize: "12px", marginBottom: "12px" }}>{create.error.message}</div>}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "10px", marginBottom: "10px" }}>
              <Input label="Full Name *" placeholder="University of Nairobi" {...register("name", { required: true })} error={errors.name ? "Required" : undefined} />
              <Input label="Short Name" placeholder="UoN" {...register("shortName")} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "10px", marginBottom: "12px" }}>
              <div>
                <label style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Type *</label>
                <select value={type} onChange={e => setType(e.target.value)} style={{ width: "100%", height: "32px", padding: "0 8px", borderRadius: "7px", border: "1px solid var(--border)", fontSize: "12px", background: "#fff", outline: "none" }}>
                  <option value="UNIVERSITY">University</option>
                  <option value="TVET">TVET</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>County *</label>
                <select value={county} onChange={e => setCounty(e.target.value)} style={{ width: "100%", height: "32px", padding: "0 8px", borderRadius: "7px", border: "1px solid var(--border)", fontSize: "12px", background: "#fff", outline: "none" }}>
                  <option value="">Select…</option>
                  {COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <Input label="Town *" placeholder="Nairobi" {...register("town", { required: true })} error={errors.town ? "Required" : undefined} />
              <Input label="Website" placeholder="https://…" {...register("website")} />
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <Button type="submit" size="sm" loading={create.isPending}>Save Institution</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      <DataTable>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <THead>
            <Th>Name</Th><Th>Type</Th><Th>County</Th><Th>Town</Th><Th>Website</Th>
          </THead>
          <tbody>
            {!(institutions as any[])?.length ? (
              <tr><td colSpan={5}><EmptyState title="No institutions yet" /></td></tr>
            ) : (institutions as any[]).map((inst: any) => (
              <TRow key={inst.id}>
                <Td><span style={{ fontWeight: 600, fontSize: "12px", color: "var(--text-primary)" }}>{inst.name}{inst.shortName && <span style={{ color: "var(--text-muted)", fontWeight: 400, marginLeft: "5px" }}>({inst.shortName})</span>}</span></Td>
                <Td><StatusPill status={inst.type} /></Td>
                <Td muted>{inst.county}</Td>
                <Td muted>{inst.town}</Td>
                <Td>{inst.website ? <a href={inst.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: "11px", color: "var(--accent)", textDecoration: "none" }}>{inst.website.replace(/^https?:\/\//, "")}</a> : <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>—</span>}</Td>
              </TRow>
            ))}
          </tbody>
        </table>
      </DataTable>
    </PageShell>
  );
}
