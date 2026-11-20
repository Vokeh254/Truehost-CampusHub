"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageShell, PageHeader, DataTable, THead, Th, TRow, Td, EmptyState, Pagination, FilterRow, SearchInput, FilterSelect } from "@/components/dashboard/page-header";
import { Plus, X, ExternalLink } from "lucide-react";
import { Mic2 } from "lucide-react";

const TYPES = [{ value: "", label: "All types" },{ value: "PODCAST", label: "Podcast" },{ value: "ONLINE_PUBLICATION", label: "Online Publication" },{ value: "NEWSPAPER", label: "Newspaper" },{ value: "RADIO", label: "Radio" },{ value: "TELEVISION", label: "Television" },{ value: "TECH_BLOG", label: "Tech Blog" },{ value: "NEWSLETTER", label: "Newsletter" },{ value: "OTHER", label: "Other" }];

export default function MediaOrgsPage() {
  const [showForm, setShowForm] = useState(false);
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [mediaType, setMediaType] = useState("PODCAST");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({ name: "", website: "", audience: "", estimatedReach: "" });

  const { data, refetch } = trpc.media.listOrgs.useQuery({ type: (typeFilter as any) || undefined, search: search || undefined, page, limit: 25 });
  const createOrg = trpc.media.createOrg.useMutation({ onSuccess: () => { refetch(); setShowForm(false); setForm({ name: "", website: "", audience: "", estimatedReach: "" }); } });

  const orgs = (data as any)?.orgs ?? [];
  const total = (data as any)?.total ?? 0;

  return (
    <PageShell>
      <PageHeader title="Media Organisations" subtitle={`${total} tracked`}
        action={<Button size="sm" onClick={() => setShowForm(!showForm)}><Plus style={{ width: "12px", height: "12px" }} /> Add Organisation</Button>}
      />

      {showForm && (
        <div style={{ background: "#fff", borderRadius: "var(--radius)", border: "1px solid var(--border)", padding: "16px 18px", marginBottom: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>New Organisation</p>
            <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X style={{ width: "14px", height: "14px" }} /></button>
          </div>
          {createOrg.error && <div style={{ padding: "8px 12px", borderRadius: "7px", background: "var(--danger-light)", color: "var(--danger)", fontSize: "12px", marginBottom: "10px" }}>{createOrg.error.message}</div>}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "10px", marginBottom: "12px" }}>
            <Input label="Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. TechTrendsKE" />
            <div>
              <label style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Type *</label>
              <select value={mediaType} onChange={e => setMediaType(e.target.value)} style={{ width: "100%", height: "32px", padding: "0 8px", borderRadius: "7px", border: "1px solid var(--border)", fontSize: "12px", background: "#fff", outline: "none" }}>
                {TYPES.filter(t => t.value).map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <Input label="Website" value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://…" />
            <Input label="Est. Reach" type="number" value={form.estimatedReach} onChange={e => setForm(f => ({ ...f, estimatedReach: e.target.value }))} placeholder="15000" />
          </div>
          <Input label="Target Audience" value={form.audience} onChange={e => setForm(f => ({ ...f, audience: e.target.value }))} placeholder="e.g. Kenyan tech entrepreneurs" />
          <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
            <Button size="sm" onClick={() => { if (!form.name) return; createOrg.mutate({ name: form.name, type: mediaType as any, website: form.website || undefined, audience: form.audience || undefined, estimatedReach: form.estimatedReach ? Number(form.estimatedReach) : undefined }); }} loading={createOrg.isPending}>Save</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <FilterRow>
        <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search by name…" />
        <FilterSelect value={typeFilter} onChange={v => { setTypeFilter(v); setPage(1); }} options={TYPES} />
      </FilterRow>

      <DataTable>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <THead><Th>Organisation</Th><Th>Type</Th><Th>Audience</Th><Th right>Est. Reach</Th><Th right>Contacts</Th><Th right>Opportunities</Th><Th right>Links</Th></THead>
          <tbody>
            {orgs.length === 0 ? (
              <tr><td colSpan={7}><EmptyState title="No media organisations yet" /></td></tr>
            ) : orgs.map((org: any) => (
              <TRow key={org.id}>
                <Td><span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>{org.name}</span></Td>
                <Td muted>{org.type.replace(/_/g, " ")}</Td>
                <Td muted>{org.audience ?? "—"}</Td>
                <Td right muted>{org.estimatedReach ? org.estimatedReach.toLocaleString() : "—"}</Td>
                <Td right muted>{org._count?.contacts ?? 0}</Td>
                <Td right muted>{org._count?.opportunities ?? 0}</Td>
                <Td right>{org.website ? <a href={org.website} target="_blank" rel="noopener noreferrer"><Button variant="ghost" size="icon"><ExternalLink style={{ width: "12px", height: "12px" }} /></Button></a> : null}</Td>
              </TRow>
            ))}
          </tbody>
        </table>
      </DataTable>
      <Pagination page={page} total={total} limit={25} onChange={setPage} />
    </PageShell>
  );
}
