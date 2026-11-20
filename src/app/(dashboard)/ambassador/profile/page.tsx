"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageShell, PageHeader, SectionCard } from "@/components/dashboard/page-header";

type F = { firstName: string; lastName: string; phone: string; bio: string; linkedinUrl: string; githubUrl: string; twitterUrl: string; course: string; yearOfStudy: string };

export default function ProfilePage() {
  const { data: session, refetch } = trpc.auth.me.useQuery();
  const updateProfile = trpc.auth.updateProfile.useMutation({ onSuccess: () => { refetch(); setSaved(true); setTimeout(() => setSaved(false), 3000); } });
  const [saved, setSaved] = useState(false);

  const s = session as any;
  const p = s?.ambassadorProfile;

  const { register, handleSubmit } = useForm<F>({
    values: {
      firstName: s?.firstName ?? "", lastName: s?.lastName ?? "", phone: s?.phone ?? "",
      bio: p?.bio ?? "", linkedinUrl: p?.linkedinUrl ?? "", githubUrl: p?.githubUrl ?? "",
      twitterUrl: p?.twitterUrl ?? "", course: p?.course ?? "", yearOfStudy: String(p?.yearOfStudy ?? ""),
    },
  });

  const onSubmit = (data: F) => updateProfile.mutate({ ...data, yearOfStudy: data.yearOfStudy ? Number(data.yearOfStudy) : undefined });

  if (!session) return <PageShell><div style={{ height: "200px", borderRadius: "var(--radius)", background: "#e4e8f0" }} /></PageShell>;

  return (
    <PageShell>
      <PageHeader title="My Profile" subtitle="Update your personal details and social links" />
      <div style={{ maxWidth: "560px" }}>
        {saved && <div style={{ padding: "10px 12px", borderRadius: "7px", background: "#e8f8f3", border: "1px solid #a7f3d0", color: "#0d7a56", fontSize: "12px", marginBottom: "12px" }}>Profile updated successfully.</div>}

        <form onSubmit={handleSubmit(onSubmit)}>
          <SectionCard title="Personal Information" style={{ marginBottom: "12px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <Input label="First name" {...register("firstName")} />
                <Input label="Last name" {...register("lastName")} />
              </div>
              <Input label="Phone number" {...register("phone")} />
              <Input label="Course / Programme" placeholder="B.Sc. Computer Science" {...register("course")} />
              <Input label="Year of study" type="number" min="1" max="7" placeholder="3" {...register("yearOfStudy")} />
              <Textarea label="Bio" placeholder="Tell us about yourself and your interests…" rows={3} {...register("bio")} />
            </div>
          </SectionCard>

          <SectionCard title="Social & Professional Links" style={{ marginBottom: "16px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <Input label="LinkedIn URL" placeholder="https://linkedin.com/in/…" {...register("linkedinUrl")} />
              <Input label="GitHub URL" placeholder="https://github.com/…" {...register("githubUrl")} />
              <Input label="Twitter / X URL" placeholder="https://twitter.com/…" {...register("twitterUrl")} />
            </div>
          </SectionCard>

          <Button type="submit" loading={updateProfile.isPending}>Save Changes</Button>
        </form>
      </div>
    </PageShell>
  );
}
