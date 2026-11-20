"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageShell, PageHeader, SectionCard } from "@/components/dashboard/page-header";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";

type F = { title: string; description: string; activityDate: string; participantCount: string; expectedOutcome: string; actualOutcome: string };

export default function SubmitActivityPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState("");
  const [urls, setUrls] = useState<string[]>([""]);

  const { data: profile } = trpc.ambassadors.dashboard.useQuery();
  const { data: activityTypes } = trpc.activities.listTypes.useQuery();
  const submit = trpc.activities.submit.useMutation({ onSuccess: () => router.push("/ambassador/activities") });

  const { register, handleSubmit, formState: { errors } } = useForm<F>();
  const chapterId = (profile as any)?.currentChapter?.id;

  const onSubmit = (data: F) => {
    if (!chapterId || !selectedType) return;
    submit.mutate({
      activityTypeId: selectedType, chapterId,
      title: data.title, description: data.description,
      activityDate: new Date(data.activityDate),
      participantCount: data.participantCount ? Number(data.participantCount) : undefined,
      relevantUrls: urls.filter(Boolean),
      expectedOutcome: data.expectedOutcome || undefined,
      actualOutcome: data.actualOutcome || undefined,
    });
  };

  if (!chapterId && profile) {
    return (
      <PageShell>
        <div style={{ background: "#fff", borderRadius: "var(--radius)", border: "1px solid var(--border)", padding: "32px", textAlign: "center" }}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "6px" }}>Not in a chapter yet</p>
          <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Complete your onboarding and join a chapter before submitting activities.</p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader title="Submit Activity" subtitle="Document your campus activity. Points are awarded after review." />
      <div style={{ maxWidth: "680px" }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          {submit.error && <div style={{ padding: "10px 12px", borderRadius: "7px", background: "var(--danger-light)", color: "var(--danger)", fontSize: "12px", marginBottom: "12px" }}>{submit.error.message}</div>}

          <SectionCard title="Activity Details" style={{ marginBottom: "12px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Activity Type *</label>
                <select value={selectedType} onChange={e => setSelectedType(e.target.value)} style={{ width: "100%", height: "32px", padding: "0 10px", borderRadius: "7px", border: "1px solid var(--border)", fontSize: "12px", background: "#fff", outline: "none" }}>
                  <option value="">Select activity type…</option>
                  {(activityTypes as any[])?.map((t: any) => <option key={t.id} value={t.id}>{t.name} ({t.basePoints} pts)</option>)}
                </select>
              </div>
              <Input label="Activity Title *" placeholder="e.g. Cloud Computing Workshop at JKUAT" {...register("title", { required: "Title is required", minLength: { value: 5, message: "At least 5 characters" } })} error={errors.title?.message} />
              <Textarea label="Description *" placeholder="What happened, who was involved, what was the outcome…" rows={4} {...register("description", { required: "Description is required", minLength: { value: 20, message: "At least 20 characters" } })} error={errors.description?.message} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <Input label="Activity Date *" type="date" {...register("activityDate", { required: "Date is required" })} error={errors.activityDate?.message} />
                <Input label="Number of Participants" type="number" placeholder="e.g. 45" {...register("participantCount")} />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Outcomes" style={{ marginBottom: "12px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <Textarea label="Expected Outcome" placeholder="What did you plan to achieve?" rows={2} {...register("expectedOutcome")} />
              <Textarea label="Actual Outcome" placeholder="What actually happened? What was the impact?" rows={2} {...register("actualOutcome")} />
            </div>
          </SectionCard>

          <SectionCard title="Supporting Links" style={{ marginBottom: "16px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {urls.map((url, i) => (
                <div key={i} style={{ display: "flex", gap: "6px" }}>
                  <input value={url} onChange={e => setUrls(p => p.map((u, idx) => idx === i ? e.target.value : u))} placeholder="https://…"
                    style={{ flex: 1, height: "30px", padding: "0 10px", borderRadius: "6px", border: "1px solid var(--border)", fontSize: "12px", outline: "none" }} />
                  {urls.length > 1 && <button type="button" onClick={() => setUrls(p => p.filter((_, idx) => idx !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X style={{ width: "13px", height: "13px" }} /></button>}
                </div>
              ))}
              <button type="button" onClick={() => setUrls(p => [...p, ""])} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "11px", color: "var(--accent)", textAlign: "left", padding: "0", display: "flex", alignItems: "center", gap: "4px" }}>
                <Plus style={{ width: "11px", height: "11px" }} /> Add link
              </button>
            </div>
          </SectionCard>

          <div style={{ display: "flex", gap: "8px" }}>
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" loading={submit.isPending}>Submit Activity</Button>
          </div>
        </form>
      </div>
    </PageShell>
  );
}
