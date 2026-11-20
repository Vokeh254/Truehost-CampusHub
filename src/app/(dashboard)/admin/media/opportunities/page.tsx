"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { PageShell, PageHeader, DataTable, THead, Th, TRow, Td, StatusPill, EmptyState, Pagination, FilterRow, FilterSelect } from "@/components/dashboard/page-header";
import { formatDate } from "@/lib/utils";
import { Plus } from "lucide-react";
import Link from "next/link";

const STATUSES = [{ value: "", label: "All" },{ value: "IDENTIFIED", label: "Identified" },{ value: "CONTACTED", label: "Contacted" },{ value: "PITCH_SUBMITTED", label: "Pitch Submitted" },{ value: "FOLLOW_UP", label: "Follow-up" },{ value: "ACCEPTED", label: "Accepted" },{ value: "SCHEDULED", label: "Scheduled" },{ value: "PUBLISHED", label: "Published" },{ value: "COMPLETED", label: "Completed" },{ value: "REJECTED", label: "Rejected" }];

export default function OpportunitiesPage() {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = trpc.media.listOpportunities.useQuery({ status: (status as any) || undefined, page, limit: 25 });
  const updateStatus = trpc.media.updateOpportunityStatus.useMutation({ onSuccess: () => refetch() });

  const opportunities = (data as any)?.opportunities ?? [];
  const total = (data as any)?.total ?? 0;

  return (
    <PageShell>
      <PageHeader title="Media Opportunities" subtitle={`${total} tracked`}
        action={<Link href="/admin/media/opportunities/new"><Button size="sm"><Plus style={{ width: "12px", height: "12px" }} /> New Opportunity</Button></Link>}
      />
      <FilterRow>
        <FilterSelect value={status} onChange={v => { setStatus(v); setPage(1); }} options={STATUSES} />
      </FilterRow>

      <DataTable>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <THead><Th>Organisation</Th><Th>Topic / Programme</Th><Th>Status</Th><Th>Pitch Sent</Th><Th>Interview</Th><Th right>Est. Reach</Th><Th right>Move To</Th></THead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>Loading…</td></tr>
            ) : opportunities.length === 0 ? (
              <tr><td colSpan={7}><EmptyState title="No opportunities yet" action={<Link href="/admin/media/opportunities/new"><Button size="sm">Add First Opportunity</Button></Link>} /></td></tr>
            ) : opportunities.map((op: any) => (
              <TRow key={op.id}>
                <Td><span style={{ fontWeight: 600, fontSize: "12px", color: "var(--text-primary)" }}>{op.organisation.name}</span></Td>
                <Td><p style={{ fontSize: "12px", color: "var(--text-primary)", maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{op.topicProposed}</p>{op.programmeName && <p style={{ fontSize: "10px", color: "var(--text-muted)" }}>{op.programmeName}</p>}</Td>
                <Td><StatusPill status={op.status} /></Td>
                <Td muted>{op.pitchSentAt ? formatDate(op.pitchSentAt) : "—"}</Td>
                <Td muted>{op.interviewDate ? formatDate(op.interviewDate) : "—"}</Td>
                <Td right muted>{op.estimatedReach ? op.estimatedReach.toLocaleString() : "—"}</Td>
                <Td right>
                  <select value={op.status} onChange={e => updateStatus.mutate({ id: op.id, status: e.target.value as any })}
                    style={{ height: "26px", padding: "0 6px", borderRadius: "5px", border: "1px solid var(--border)", background: "#fff", fontSize: "11px", cursor: "pointer", outline: "none" }}>
                    {STATUSES.filter(s => s.value).map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </Td>
              </TRow>
            ))}
          </tbody>
        </table>
      </DataTable>
      <Pagination page={page} total={total} limit={25} onChange={setPage} />
    </PageShell>
  );
}
