"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { PageShell, PageHeader, DataTable, THead, Th, TRow, Td, StatusPill, EmptyState, Pagination, FilterRow, FilterSelect } from "@/components/dashboard/page-header";
import { formatDate } from "@/lib/utils";
import { Plus, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function EventsPage() {
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [upcoming, setUpcoming] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading } = trpc.events.list.useQuery({ status: (status as any) || undefined, category: (category as any) || undefined, upcoming: upcoming || undefined, page, limit: 25 });
  const { data: pipeline } = trpc.events.pipeline.useQuery({ assignedToMe: false });

  const events = (data?.events ?? []) as any[];
  const total = data?.total ?? 0;
  const pipelineData = (pipeline ?? []) as any[];

  const PIPELINE_ORDER = ["DISCOVERED","CONTACTED","APPLICATION_SUBMITTED","FOLLOW_UP_REQUIRED","CONFIRMED","ATTENDED","COMPLETED"];
  const PIPELINE_COLORS: Record<string, string> = { DISCOVERED:"#8c9ab0", CONTACTED:"#3b5bdb", APPLICATION_SUBMITTED:"#6d28d9", FOLLOW_UP_REQUIRED:"#d97706", CONFIRMED:"#0d9f6e", ATTENDED:"#059669", COMPLETED:"#374151" };

  return (
    <PageShell>
      <PageHeader title="Events & Opportunities" subtitle={`${total} tracked`}
        action={<Link href="/admin/events/new"><Button size="sm"><Plus style={{ width: "12px", height: "12px" }} /> Add Event</Button></Link>}
      />

      {/* Pipeline pills */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "14px", flexWrap: "wrap" }}>
        {PIPELINE_ORDER.map(s => {
          const count = pipelineData.find((p: any) => p.status === s)?._count ?? 0;
          const color = PIPELINE_COLORS[s] ?? "#8c9ab0";
          const active = status === s;
          return (
            <button key={s} onClick={() => setStatus(active ? "" : s)} style={{
              display: "flex", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: "5px",
              border: `1px solid ${active ? color : "var(--border)"}`,
              background: active ? color + "15" : "#fff", cursor: "pointer",
              fontSize: "11px", fontWeight: 500, color: "var(--text-secondary)",
            }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: color }} />
              {s.replace(/_/g, " ")}
              <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{count}</span>
            </button>
          );
        })}
      </div>

      <FilterRow>
        <FilterSelect value={category} onChange={v => { setCategory(v); setPage(1); }} options={[
          { value: "", label: "All categories" },
          { value: "TECH_CONFERENCE", label: "Tech Conference" },
          { value: "UNIVERSITY_WORKSHOP", label: "University Workshop" },
          { value: "HACKATHON", label: "Hackathon" },
          { value: "DEVELOPER_MEETUP", label: "Developer Meetup" },
          { value: "CAREER_FAIR", label: "Career Fair" },
          { value: "STARTUP_EVENT", label: "Startup Event" },
          { value: "WEBINAR", label: "Webinar" },
          { value: "COMPETITION", label: "Competition" },
        ]} />
        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text-secondary)", cursor: "pointer" }}>
          <input type="checkbox" checked={upcoming} onChange={e => { setUpcoming(e.target.checked); setPage(1); }} />
          Upcoming only
        </label>
        {(status || category) && <button onClick={() => { setStatus(""); setCategory(""); }} style={{ fontSize: "11px", color: "var(--accent)", background: "none", border: "none", cursor: "pointer" }}>Clear filters</button>}
      </FilterRow>

      <DataTable>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <THead>
            <Th>Event</Th><Th>Organiser</Th><Th>Category</Th><Th>Date</Th><Th>Location</Th><Th>Status</Th><Th>Flags</Th><Th right>Actions</Th>
          </THead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>Loading…</td></tr>
            ) : events.length === 0 ? (
              <tr><td colSpan={8}><EmptyState title="No events found" action={<Link href="/admin/events/new"><Button size="sm">Add First Event</Button></Link>} /></td></tr>
            ) : events.map((ev: any) => (
              <TRow key={ev.id}>
                <Td><Link href={`/admin/events/${ev.id}`} style={{ textDecoration: "none" }}><span style={{ fontSize: "12px", fontWeight: 600, color: "var(--accent)" }}>{ev.name}</span></Link></Td>
                <Td muted>{ev.organiser}</Td>
                <Td muted>{ev.category.replace(/_/g, " ")}</Td>
                <Td muted>{formatDate(ev.eventDate)}</Td>
                <Td muted>{ev.isOnline ? "Online" : ev.location}</Td>
                <Td><StatusPill status={ev.status} /></Td>
                <Td>
                  <div style={{ display: "flex", gap: "3px" }}>
                    {ev.speakerOpportunity && <span style={{ fontSize: "9px", padding: "1px 5px", borderRadius: "3px", background: "#f5f3ff", color: "#6d28d9" }}>Speaker</span>}
                    {ev.sponsorshipOpportunity && <span style={{ fontSize: "9px", padding: "1px 5px", borderRadius: "3px", background: "#fef9ec", color: "#92580d" }}>Sponsor</span>}
                    {ev.partnershipOpportunity && <span style={{ fontSize: "9px", padding: "1px 5px", borderRadius: "3px", background: "#eff3fe", color: "#3b5bdb" }}>Partner</span>}
                  </div>
                </Td>
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
