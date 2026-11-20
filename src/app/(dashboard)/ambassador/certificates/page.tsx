"use client";

import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { PageShell, PageHeader, EmptyState } from "@/components/dashboard/page-header";
import { Award, Download, ExternalLink } from "lucide-react";
import { formatDate } from "@/lib/utils";

const TIER_COLORS: Record<string, { bg: string; border: string; color: string }> = {
  CAMPUS_AMBASSADOR:        { bg: "#eff3fe", border: "#c7d4f8", color: "#3b5bdb" },
  CHAPTER_LEAD_ACHIEVEMENT: { bg: "#f5f3ff", border: "#ddd6fe", color: "#6d28d9" },
  NATIONAL_CLOUD_FELLOW:    { bg: "#fef9ec", border: "#fde68a", color: "#92580d" },
};

export default function MyCertificatesPage() {
  const { data: certificates, isLoading } = trpc.certificates.mine.useQuery();
  const certs = (certificates ?? []) as any[];

  if (isLoading) {
    return (
      <PageShell>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: "12px" }}>
          {Array.from({ length: 2 }).map((_, i) => <div key={i} style={{ height: "160px", borderRadius: "var(--radius)", background: "#e4e8f0" }} />)}
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="My Certificates"
        subtitle={`${certs.length} certificate${certs.length !== 1 ? "s" : ""} earned`}
      />

      {certs.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: "var(--radius)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
          <EmptyState
            title="No certificates yet"
            subtitle="Complete milestones to earn certificates automatically"
          />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: "12px" }}>
          {certs.map((cert: any) => {
            const tc = TIER_COLORS[cert.template?.tier] ?? { bg: "#f0f3fb", border: "var(--border)", color: "#3b5bdb" };
            return (
              <div key={cert.id} style={{
                background: "#fff", borderRadius: "var(--radius)",
                border: `1px solid ${cert.isRevoked ? "#fca5a5" : tc.border}`,
                boxShadow: "var(--shadow-sm)", padding: "16px",
                opacity: cert.isRevoked ? 0.75 : 1,
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "12px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "9px", background: tc.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Award style={{ width: "17px", height: "17px", color: tc.color }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>{cert.template?.name}</p>
                    {cert.template?.tier && (
                      <p style={{ fontSize: "11px", color: tc.color, marginTop: "1px", fontWeight: 500 }}>
                        {cert.template.tier.replace(/_/g, " ")}
                      </p>
                    )}
                    {cert.isRevoked && (
                      <span style={{ fontSize: "10px", fontWeight: 500, color: "#b91c1c", background: "#fdf1f2", padding: "1px 7px", borderRadius: "4px", display: "inline-block", marginTop: "4px" }}>
                        Revoked
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", marginBottom: "12px" }}>
                  <div>
                    <p style={{ fontSize: "9px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)" }}>Issued</p>
                    <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", marginTop: "2px" }}>{formatDate(cert.issuedAt)}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: "9px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)" }}>ID</p>
                    <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-primary)", fontFamily: "monospace", marginTop: "2px" }}>{cert.certificateCode}</p>
                  </div>
                </div>

                {!cert.isRevoked && (
                  <div style={{ display: "flex", gap: "6px" }}>
                    {cert.pdfUrl && (
                      <a href={cert.pdfUrl} download target="_blank" rel="noopener noreferrer" style={{ flex: 1, textDecoration: "none" }}>
                        <Button variant="outline" size="sm" style={{ width: "100%" }}>
                          <Download style={{ width: "12px", height: "12px" }} /> PDF
                        </Button>
                      </a>
                    )}
                    <a href={cert.verifyUrl} target="_blank" rel="noopener noreferrer" style={{ flex: 1, textDecoration: "none" }}>
                      <Button variant="outline" size="sm" style={{ width: "100%" }}>
                        <ExternalLink style={{ width: "12px", height: "12px" }} /> Verify
                      </Button>
                    </a>
                  </div>
                )}
                {!cert.pdfUrl && !cert.isRevoked && (
                  <p style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "8px" }}>PDF is being generated…</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
