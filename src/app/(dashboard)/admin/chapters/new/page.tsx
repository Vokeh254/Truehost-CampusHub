"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageShell, PageHeader, SectionCard } from "@/components/dashboard/page-header";
import { useRouter } from "next/navigation";

type F = { whatsappGroupLink: string; whatsappGroupName: string; targetAmbassadors: string; targetReferrals: string; targetWorkshops: string; targetProjects: string };

export default function NewChapterPage() {
  const router = useRouter();
  const [institutionId, setInstitutionId] = useState("");
  const [status, setStatus] = useState("ACTIVE");

  const { data: institutions } = trpc.chapters.listInstitutions.useQuery();
  const create = trpc.chapters.create.useMutation({ onSuccess: (ch: any) => router.push(`/admin/chapters/${ch.id}`) });
  const { register, handleSubmit } = useForm<F>();

  const onSubmit = (data: F) => {
    if (!institutionId) return;
    create.mutate({ institutionId, status: status as any, whatsappGroupLink: data.whatsappGroupLink || undefined, whatsappGroupName: data.whatsappGroupName || undefined, targetAmbassadors: data.targetAmbassadors ? Number(data.targetAmbassadors) : undefined, targetReferrals: data.targetReferrals ? Number(data.targetReferrals) : undefined, targetWorkshops: data.targetWorkshops ? Number(data.targetWorkshops) : undefined, targetProjects: data.targetProjects ? Number(data.targetProjects) : undefined });
  };

  return (
    <PageShell>
      <PageHeader title="Create Chapter" subtitle="Set up a new university or TVET chapter" />
      <div style={{ maxWidth: "560px" }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          {create.error && <div style={{ padding: "10px 12px", borderRadius: "7px", background: "var(--danger-light)", color: "var(--danger)", fontSize: "12px", marginBottom: "14px" }}>{create.error.message}</div>}

          <SectionCard title="Institution" style={{ marginBottom: "12px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Institution *</label>
                <select value={institutionId} onChange={e => setInstitutionId(e.target.value)} style={{ width: "100%", height: "32px", padding: "0 10px", borderRadius: "7px", border: "1px solid var(--border)", fontSize: "12px", background: "#fff", outline: "none" }}>
                  <option value="">Select institution…</option>
                  {(institutions as any[])?.map((i: any) => <option key={i.id} value={i.id}>{i.name} — {i.type}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Status</label>
                <select value={status} onChange={e => setStatus(e.target.value)} style={{ width: "100%", height: "32px", padding: "0 10px", borderRadius: "7px", border: "1px solid var(--border)", fontSize: "12px", background: "#fff", outline: "none" }}>
                  <option value="ACTIVE">Active</option>
                  <option value="PENDING_SETUP">Pending Setup</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="WhatsApp" style={{ marginBottom: "12px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <Input label="Group Name" placeholder="e.g. JKUAT Campus Builders" {...register("whatsappGroupName")} />
              <Input label="Group Invite Link" placeholder="https://chat.whatsapp.com/…" {...register("whatsappGroupLink")} />
            </div>
          </SectionCard>

          <SectionCard title="Targets (optional)" style={{ marginBottom: "16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <Input label="Target Ambassadors" type="number" placeholder="20" {...register("targetAmbassadors")} />
              <Input label="Target Referrals"   type="number" placeholder="100" {...register("targetReferrals")} />
              <Input label="Target Workshops"   type="number" placeholder="4" {...register("targetWorkshops")} />
              <Input label="Target Projects"    type="number" placeholder="5" {...register("targetProjects")} />
            </div>
          </SectionCard>

          <div style={{ display: "flex", gap: "8px" }}>
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" loading={create.isPending}>Create Chapter</Button>
          </div>
        </form>
      </div>
    </PageShell>
  );
}
