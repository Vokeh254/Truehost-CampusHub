"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { PageShell, PageHeader, EmptyState } from "@/components/dashboard/page-header";
import { Award, Plus, Eye, X } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { AmbassadorTier } from "@prisma/client";

const DEFAULT_HTML = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:Georgia,serif;margin:0}.cert{width:1122px;height:793px;border:14px solid #3b5bdb;padding:60px;box-sizing:border-box;text-align:center;position:relative;background:#fff}.logo{font-size:14px;font-weight:bold;color:#3b5bdb;letter-spacing:3px;text-transform:uppercase}.title{font-size:40px;font-weight:bold;color:#1e2a3b;margin:14px 0}.subtitle{font-size:16px;color:#6b7280}.recipient{font-size:30px;font-weight:bold;color:#3b5bdb;border-bottom:2px solid #3b5bdb;display:inline-block;padding:0 48px 8px;margin:18px 0}.inst{font-size:14px;color:#374151;margin:8px 0}.achieve{font-size:18px;font-weight:bold;color:#374151;margin:14px 0}.tier{font-size:24px;font-weight:bold;color:#b45309;margin:6px 0}.date{font-size:12px;color:#9ca3af;margin:18px 0 6px}.sig-block{display:flex;justify-content:center;gap:80px;margin-top:32px}.sig{text-align:center}.sig-name{font-size:14px;font-weight:bold;color:#111827;border-top:2px solid #374151;padding-top:8px;min-width:160px}.sig-title{font-size:11px;color:#6b7280;margin-top:3px}.cert-id{font-size:10px;color:#9ca3af;position:absolute;bottom:24px;left:60px;font-family:monospace}.qr{position:absolute;bottom:20px;right:60px}.qr img{width:68px;height:68px}</style></head><body><div class="cert"><div class="logo">Truehost Cloud Campus Builders</div><div class="title">Certificate of Achievement</div><div class="subtitle">This is to certify that</div><div class="recipient">{{recipientName}}</div><div class="inst">of {{institution}}</div><div class="achieve">has successfully achieved the status of</div><div class="tier">{{achievement}}</div><div class="date">Issued on {{issuedDate}}</div><div class="sig-block"><div class="sig"><div class="sig-name">{{signatoryName}}</div><div class="sig-title">{{signatoryTitle}}</div></div></div><div class="cert-id">ID: {{certificateCode}}</div><div class="qr"><img src="{{qrCodeUrl}}" alt="QR"/></div></div></body></html>`;

export default function CertificatesPage() {
  const { data: templates, refetch } = trpc.certificates.listTemplates.useQuery();
  const createTemplate = trpc.certificates.createTemplate.useMutation({ onSuccess: () => { refetch(); setShowForm(false); } });
  const updateTemplate = trpc.certificates.updateTemplate.useMutation({ onSuccess: () => refetch() });

  const [showForm, setShowForm] = useState(false);
  const [tier, setTier] = useState("");
  const [form, setForm] = useState({ name: "", signatoryName: "Community Manager", signatoryTitle: "Truehost Cloud Kenya", htmlTemplate: DEFAULT_HTML });

  const tmplList = (templates as any[]) ?? [];

  const preview = (tmpl: any) => {
    const html = tmpl.htmlTemplate.replace(/{{recipientName}}/g, "Amani Kamau").replace(/{{institution}}/g, "University of Nairobi").replace(/{{achievement}}/g, tmpl.tier?.replace(/_/g, " ") ?? tmpl.name).replace(/{{issuedDate}}/g, new Date().toLocaleDateString("en-KE", { year: "numeric", month: "long", day: "numeric" })).replace(/{{certificateCode}}/g, "PREVIEW-001").replace(/{{qrCodeUrl}}/g, "").replace(/{{signatoryName}}/g, (tmpl.signatureConfig as any)?.signatoryName ?? "").replace(/{{signatoryTitle}}/g, (tmpl.signatureConfig as any)?.title ?? "");
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); }
  };

  return (
    <PageShell>
      <PageHeader title="Certificate Templates" subtitle="Manage certificate designs and digital badges"
        action={<Button size="sm" onClick={() => setShowForm(!showForm)}><Plus style={{ width: "12px", height: "12px" }} /> New Template</Button>}
      />

      {showForm && (
        <div style={{ background: "#fff", borderRadius: "var(--radius)", border: "1px solid var(--border)", padding: "16px 18px", marginBottom: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>New Certificate Template</p>
            <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X style={{ width: "14px", height: "14px" }} /></button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
            <div><label style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "3px" }}>Template Name *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Campus Ambassador Certificate" style={{ width: "100%", height: "30px", padding: "0 10px", borderRadius: "6px", border: "1px solid var(--border)", fontSize: "12px", outline: "none" }} /></div>
            <div><label style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "3px" }}>Achievement Tier</label>
              <select value={tier} onChange={e => setTier(e.target.value)} style={{ width: "100%", height: "30px", padding: "0 8px", borderRadius: "6px", border: "1px solid var(--border)", fontSize: "12px", background: "#fff", outline: "none" }}>
                <option value="">Not tier-specific</option>
                <option value="CAMPUS_AMBASSADOR">Campus Ambassador</option>
                <option value="CHAPTER_LEAD_ACHIEVEMENT">Chapter Lead Achievement</option>
                <option value="NATIONAL_CLOUD_FELLOW">National Cloud Fellow</option>
              </select>
            </div>
            <div><label style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "3px" }}>Signatory Name</label><input value={form.signatoryName} onChange={e => setForm(f => ({ ...f, signatoryName: e.target.value }))} style={{ width: "100%", height: "30px", padding: "0 10px", borderRadius: "6px", border: "1px solid var(--border)", fontSize: "12px", outline: "none" }} /></div>
            <div><label style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "3px" }}>Signatory Title</label><input value={form.signatoryTitle} onChange={e => setForm(f => ({ ...f, signatoryTitle: e.target.value }))} style={{ width: "100%", height: "30px", padding: "0 10px", borderRadius: "6px", border: "1px solid var(--border)", fontSize: "12px", outline: "none" }} /></div>
          </div>
          <div style={{ marginBottom: "12px" }}>
            <label style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "3px" }}>HTML Template <span style={{ fontWeight: 400, textTransform: "none" }}>— vars: {`{{recipientName}} {{institution}} {{achievement}} {{issuedDate}} {{certificateCode}} {{qrCodeUrl}} {{signatoryName}} {{signatoryTitle}}`}</span></label>
            <textarea value={form.htmlTemplate} onChange={e => setForm(f => ({ ...f, htmlTemplate: e.target.value }))} rows={6} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid var(--border)", fontSize: "10px", fontFamily: "monospace", resize: "vertical", outline: "none" }} />
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <Button size="sm" onClick={() => { if (!form.name) return; createTemplate.mutate({ name: form.name, tier: tier ? (tier as AmbassadorTier) : undefined, htmlTemplate: form.htmlTemplate, signatureConfig: { signatoryName: form.signatoryName, title: form.signatoryTitle } }); }} loading={createTemplate.isPending}>Save Template</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {tmplList.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: "var(--radius)", border: "2px dashed var(--border)", padding: "60px 24px" }}>
          <EmptyState title="No certificate templates yet" subtitle="Create a template to start issuing certificates automatically when ambassadors reach milestones" action={<Button size="sm" onClick={() => setShowForm(true)}>Create First Template</Button>} />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: "12px" }}>
          {tmplList.map((tmpl: any) => (
            <div key={tmpl.id} style={{ background: "#fff", borderRadius: "var(--radius)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", padding: "16px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "12px" }}>
                <div style={{ width: "34px", height: "34px", borderRadius: "8px", background: "#fef9ec", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Award style={{ width: "16px", height: "16px", color: "#b45309" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>{tmpl.name}</p>
                  {tmpl.tier && <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "1px" }}>{tmpl.tier.replace(/_/g, " ")}</p>}
                </div>
                <span style={{ fontSize: "10px", fontWeight: 500, padding: "2px 7px", borderRadius: "4px", background: tmpl.isActive ? "#e8f8f3" : "#f0f3fb", color: tmpl.isActive ? "#0d7a56" : "#64748b" }}>
                  {tmpl.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "12px" }}>Created {formatDate(tmpl.createdAt)}</p>
              <div style={{ display: "flex", gap: "6px" }}>
                <Button variant="outline" size="sm" onClick={() => preview(tmpl)} style={{ flex: 1 }}><Eye style={{ width: "12px", height: "12px" }} /> Preview</Button>
                <Button variant="ghost" size="sm" onClick={() => updateTemplate.mutate({ id: tmpl.id, isActive: !tmpl.isActive })} style={{ flex: 1 }}>{tmpl.isActive ? "Disable" : "Enable"}</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
