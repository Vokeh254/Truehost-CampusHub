"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { PageShell, PageHeader, DataTable, THead, Th, TRow, Td, StatusPill, EmptyState, Pagination, FilterRow } from "@/components/dashboard/page-header";
import { formatDate } from "@/lib/utils";
import { Plus, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function LeadEventsPage() {
  const [upcoming, setUpcoming] = useState(true);
  const [page, setPage] = useState(1);

  const { data: session } = trpc.auth.me.useQuery();
  const chapterId = (session as any)?.leadAssignments?.[0]?.chapterId;

  const { data, isLoading } = trpc.events.list.useQuery({ chapterId: chapterId ?? undefined, upcoming: upcoming || undefined, page, limit: 25 });

  const events = (data?.events ?? []) as any[];
  const total = data?.total ?? 0;

  return (
    <PageShell>
      <PageHeader title="Events & Opportunities" subtitle={`${total} events tracked`}
        action={<Link href="/admin/events/new"><Button size="sm"><Plus style={{ width: "12px", height: "12px" }} /> Add Event</Button></Link>}
      />
      <FilterRow>
        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text-secondary)", cursor: "pointer" }}>
          <input type="checkbox" checked={upcoming} onChange={e => { setUpcoming(e.target.checked); setPage(1); }} />
          Upcoming only
        </label>
      </FilterRow>

      <DataTable>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <THead>
            <Th>Event</Th><Th>Organiser</Th><Th>Date</Th><Th>Location</Th><Th>Status</Th><Th right>Actions</Th>
          </THead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>Loading…</td></tr>
            ) : events.length === 0 ? (
              <tr><td colSpan={6}><EmptyState title="No events found" /></td></tr>
            ) : events.map((ev: any) => (
              <TRow key={ev.id}>
                <Td><p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>{ev.name}</p><p style={{ fontSize: "10px", color: "var(--text-muted)" }}>{ev.category.replace(/_/g, " ")}</p></Td>
                <Td muted>{ev.organiser}</Td>
                <Td muted>{formatDate(ev.eventDate)}</Td>
                <Td muted>{ev.isOnline ? "Online" : ev.location}</Td>
                <Td><StatusPill status={ev.status} /></Td>
                <Td right>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "4px" }}>
                    <Link href={`/admin/events/${ev.id}`}><Button variant="outline" size="sm">View</Button></Link>
                    {ev.website && <a href={ev.website} target="_blank" rel="noopener noreferrer"><Button variant="ghost" size="icon"><ExternalLink style={{ width: "12px", height: "12px" }} /></Button></a>}
                  </div>
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
