"use client";

import { use, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { PageShell, PageHeader, SectionCard, StatusPill } from "@/components/dashboard/page-header";
import { formatDate, formatDateTime } from "@/lib/utils";
import { CheckCircle2, XCircle, AlertCircle, ExternalLink, FileText, Image } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props { params: Promise<{ id: string }> }

export default function ActivityDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const [feedback, setFeedback] = useState("");
  const [points, setPoints] = useState("");

  const { data: submission, isLoading, refetch } = trpc.activities.byId.useQuery({ id });
  const review = trpc.activities.review.useMutation({ onSuccess: () => refetch() });

  if (isLoading) return <PageShell><div style={{ height: "200px", borderRadius: "var(--radius)", background: "#e4e8f0" }} /></PageShell>;
  if (!submission) return <PageShell><p style={{ color: "var(--text-muted)", fontSize: "12px" }}>Submission not found.</p></PageShell>;

  const s = submission as any;
  const canReview = s.status === "PENDING" || s.status === "UNDER_REVIEW";

  const decide = (status: "APPROVED" | "REJECTED" | "REQUIRES_CORRECTION") => {
    review.mutate({ id: s.id, status, reviewFeedback: feedback || undefined, pointsAwarded: points ? Number(points) : undefined });
  };

  return (
    <PageShell>
      <PageHeader
        title={s.title}
        subtitle={`${s.activityType.name} · ${s.activityType.category}`}
        action={<StatusPill status={s.status} />}
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "16px" }}>
        {/* Main */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

          {/* Details */}
          <SectionCard title="Activity Details">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
              {[
                { label: "Ambassador", value: `${s.ambassador.user.firstName} ${s.ambassador.user.lastName}` },
                { label: "Email", value: s.ambassador.user.email },
                { label: "Institution", value: s.chapter?.institution?.name },
                { label: "County", value: s.chapter?.institution?.county },
                { label: "Activity Date", value: formatDate(s.activityDate) },
                { label: "Participants", value: s.participantCount ?? "Not specified" },
                { label: "Base Points", value: `${s.activityType.basePoints} pts` },
                { label: "Submitted", value: s.submittedAt ? formatDateTime(s.submittedAt) : "—" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: "2px" }}>{label}</p>
                  <p style={{ fontSize: "12px", color: "var(--text-primary)" }}>{value}</p>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: "12px" }}>
              <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: "6px" }}>Description</p>
              <p style={{ fontSize: "12px", color: "var(--text-primary)", background: "var(--bg)", borderRadius: "7px", padding: "10px 12px", lineHeight: 1.6 }}>{s.description}</p>
            </div>

            {s.expectedOutcome && (
              <div style={{ marginBottom: "10px" }}>
                <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: "4px" }}>Expected Outcome</p>
                <p style={{ fontSize: "12px", color: "var(--text-primary)" }}>{s.expectedOutcome}</p>
              </div>
            )}
            {s.actualOutcome && (
              <div style={{ marginBottom: "10px" }}>
                <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: "4px" }}>Actual Outcome</p>
                <p style={{ fontSize: "12px", color: "var(--text-primary)" }}>{s.actualOutcome}</p>
              </div>
            )}

            {s.relevantUrls?.length > 0 && (
              <div>
                <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: "6px" }}>Supporting Links</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  {s.relevantUrls.map((url: string, i: number) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--accent)", textDecoration: "none" }}>
                      <ExternalLink style={{ width: "11px", height: "11px" }} />{url}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>

          {/* Evidence */}
          {s.evidence?.length > 0 && (
            <SectionCard title={`Evidence (${s.evidence.length} file${s.evidence.length > 1 ? "s" : ""})`}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: "8px" }}>
                {s.evidence.map((ev: any) => (
                  <a key={ev.id} href={ev.fileUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: "10px",
                      padding: "10px 12px", borderRadius: "7px",
                      border: "1px solid var(--border)", background: "var(--bg)",
                      transition: "border-color 0.15s",
                    }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "var(--accent)")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "var(--border)")}
                    >
                      {ev.fileType?.startsWith("image") ? (
                        <Image style={{ width: "14px", height: "14px", color: "var(--accent)", flexShrink: 0 }} />
                      ) : (
                        <FileText style={{ width: "14px", height: "14px", color: "var(--text-muted)", flexShrink: 0 }} />
                      )}
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.fileName}</p>
                        {ev.fileSize && <p style={{ fontSize: "10px", color: "var(--text-muted)" }}>{(ev.fileSize / 1024 / 1024).toFixed(2)} MB</p>}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Previous review */}
          {s.reviewedBy && (
            <SectionCard title="Previous Review">
              <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                Reviewed by <strong>{s.reviewedBy.firstName} {s.reviewedBy.lastName}</strong> on {formatDate(s.reviewedAt)}
              </p>
              {s.reviewFeedback && (
                <p style={{ fontSize: "12px", color: "var(--text-primary)", background: "var(--bg)", borderRadius: "7px", padding: "10px 12px", marginTop: "8px", lineHeight: 1.6 }}>
                  {s.reviewFeedback}
                </p>
              )}
              {s.pointsAwarded != null && (
                <p style={{ fontSize: "12px", fontWeight: 600, color: "#0d9f6e", marginTop: "6px" }}>Points awarded: {s.pointsAwarded}</p>
              )}
            </SectionCard>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

          {/* Review form */}
          {canReview && (
            <SectionCard title="Review Decision">
              <div style={{ marginBottom: "10px" }}>
                <label style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                  Feedback / Comments
                </label>
                <textarea
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Optional feedback for the ambassador…"
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "7px", border: "1px solid var(--border)", fontSize: "12px", resize: "vertical", outline: "none", lineHeight: 1.5 }}
                />
              </div>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                  Points to award <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(base: {s.activityType.basePoints})</span>
                </label>
                <input
                  type="number"
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                  placeholder={String(s.activityType.basePoints)}
                  style={{ width: "100%", height: "32px", padding: "0 10px", borderRadius: "7px", border: "1px solid var(--border)", fontSize: "12px", outline: "none" }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <Button onClick={() => decide("APPROVED")} loading={review.isPending}>
                  <CheckCircle2 style={{ width: "13px", height: "13px" }} /> Approve
                </Button>
                <Button variant="outline" onClick={() => decide("REQUIRES_CORRECTION")} loading={review.isPending}>
                  <AlertCircle style={{ width: "13px", height: "13px" }} /> Needs Correction
                </Button>
                <Button variant="destructive" onClick={() => decide("REJECTED")} loading={review.isPending}>
                  <XCircle style={{ width: "13px", height: "13px" }} /> Reject
                </Button>
              </div>
            </SectionCard>
          )}

          {/* Quick info */}
          <SectionCard title="Quick Info">
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[
                { label: "Activity Type", value: s.activityType.name },
                { label: "Category", value: s.activityType.category },
                { label: "Points Value", value: `${s.activityType.basePoints} pts` },
                { label: "Current Status", value: <StatusPill status={s.status} /> },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{label}</span>
                  <span style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-primary)" }}>{value as any}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </PageShell>
  );
}
