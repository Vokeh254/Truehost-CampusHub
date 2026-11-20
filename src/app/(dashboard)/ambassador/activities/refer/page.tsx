"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageShell, PageHeader, DataTable, THead, Th, TRow, Td, StatusPill, EmptyState, Pagination, SectionCard } from "@/components/dashboard/page-header";
import { formatDate } from "@/lib/utils";
import { Plus, X } from "lucide-react";

type F = { studentName: string; studentEmail: string; studentPhone: string; institution: string };

export default function ReferStudentPage() {
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);

  const { data: referrals, refetch } = trpc.activities.referrals.useQuery({ page, limit: 20 });
  const submitReferral = trpc.activities.submitReferral.useMutation({ onSuccess: () => { refetch(); setShowForm(false); reset(); } });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<F>();
  const onSubmit = (data: F) => submitReferral.mutate({ studentName: data.studentName, studentEmail: data.studentEmail, studentPhone: data.studentPhone || undefined, institution: data.institution });

  const items = (referrals?.referrals ?? []) as any[];
  const total = referrals?.total ?? 0;
  const verified = items.filter((r: any) => r.verificationStatus === "VERIFIED").length;
  const pending  = items.filter((r: any) => r.verificationStatus === "PENDING").length;

  return (
    <PageShell>
      <PageHeader
        title="Student Referrals"
        subtitle="Refer students to your campus chapter"
        action={<Button size="sm" onClick={() => setShowForm(!showForm)}><Plus style={{ width: "12px", height: "12px" }} /> Refer a Student</Button>}
      />

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "10px", marginBottom: "14px" }}>
        {[
          { label: "Total Referred", value: total, color: "var(--text-primary)" },
          { label: "Verified",       value: verified, color: "#0d9f6e" },
          { label: "Pending",        value: pending,  color: "#d97706" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: "var(--radius)", border: "1px solid var(--border)", padding: "14px 16px" }}>
            <p style={{ fontSize: "20px", fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</p>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "3px" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <SectionCard style={{ marginBottom: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>New Referral</p>
            <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X style={{ width: "14px", height: "14px" }} /></button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)}>
            {submitReferral.error && <div style={{ padding: "8px 12px", borderRadius: "7px", background: "var(--danger-light)", color: "var(--danger)", fontSize: "12px", marginBottom: "10px" }}>{submitReferral.error.message}</div>}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
              <Input label="Student Full Name *" placeholder="e.g. Brian Otieno" {...register("studentName", { required: true })} error={errors.studentName ? "Required" : undefined} />
              <Input label="Student Email *" type="email" placeholder="student@university.ac.ke" {...register("studentEmail", { required: true })} error={errors.studentEmail ? "Required" : undefined} />
              <Input label="Phone Number" placeholder="+254 7XX XXX XXX" {...register("studentPhone")} />
              <Input label="Institution *" placeholder="e.g. JKUAT" {...register("institution", { required: true })} error={errors.institution ? "Required" : undefined} />
            </div>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "10px" }}>Each verified referral earns points. Duplicate emails are detected automatically.</p>
            <div style={{ display: "flex", gap: "8px" }}>
              <Button type="submit" size="sm" loading={submitReferral.isPending}>Submit Referral</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </SectionCard>
      )}

      <DataTable>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <THead>
            <Th>Student</Th><Th>Institution</Th><Th>Referred On</Th><Th>Status</Th><Th>Verified</Th>
          </THead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={5}><EmptyState title="No referrals yet" subtitle="Refer your fellow students and earn points when they verify" /></td></tr>
            ) : items.map((r: any) => (
              <TRow key={r.id}>
                <Td><p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>{r.studentName}</p><p style={{ fontSize: "10px", color: "var(--text-muted)" }}>{r.studentEmail}</p></Td>
                <Td muted>{r.institution}</Td>
                <Td muted>{formatDate(r.createdAt)}</Td>
                <Td><StatusPill status={r.verificationStatus} /></Td>
                <Td muted>{r.verifiedAt ? formatDate(r.verifiedAt) : "—"}</Td>
              </TRow>
            ))}
          </tbody>
        </table>
      </DataTable>
      <Pagination page={page} total={total} limit={20} onChange={setPage} />
    </PageShell>
  );
}
