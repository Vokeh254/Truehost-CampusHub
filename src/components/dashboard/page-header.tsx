import { type ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "18px" }}>
      <div>
        <h1 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.3 }}>{title}</h1>
        {subtitle && (
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>{subtitle}</p>
        )}
      </div>
      {action && <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>{action}</div>}
    </div>
  );
}

/** Standard page container — 24px 28px padding, light bg */
export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div style={{ padding: "24px 28px", background: "var(--bg)", minHeight: "100%" }}>
      {children}
    </div>
  );
}

/** Reusable section card matching dashboard style */
export function SectionCard({
  title, subtitle, action, children, noPad, style,
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  noPad?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{
      background: "#fff", borderRadius: "var(--radius)",
      border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", ...style,
    }}>
      {title && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px 10px" }}>
          <div>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>{title}</p>
            {subtitle && <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "1px" }}>{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div style={noPad ? {} : { padding: title ? "0 18px 16px" : "16px 18px" }}>
        {children}
      </div>
    </div>
  );
}

/** Status pill — no emojis, consistent with dashboard */
export function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    APPROVED:              { bg: "#e8f8f3", color: "#0d7a56" },
    ACTIVE:                { bg: "#e8f8f3", color: "#0d7a56" },
    COMPLETED:             { bg: "#e8f8f3", color: "#0d7a56" },
    VERIFIED:              { bg: "#e8f8f3", color: "#0d7a56" },
    CONFIRMED:             { bg: "#eff8ff", color: "#0369a1" },
    PENDING:               { bg: "#fef9ec", color: "#92580d" },
    PENDING_SETUP:         { bg: "#fef9ec", color: "#92580d" },
    UNDER_REVIEW:          { bg: "#eff8ff", color: "#0369a1" },
    DRAFT:                 { bg: "#f0f3fb", color: "#64748b" },
    REJECTED:              { bg: "#fdf1f2", color: "#b91c1c" },
    REQUIRES_CORRECTION:   { bg: "#fff3ec", color: "#c2410c" },
    INACTIVE:              { bg: "#f4f6f8", color: "#94a3b8" },
    SUSPENDED:             { bg: "#fdf1f2", color: "#b91c1c" },
    DISCOVERED:            { bg: "#f0f3fb", color: "#64748b" },
    CONTACTED:             { bg: "#eff8ff", color: "#0369a1" },
    APPLICATION_SUBMITTED: { bg: "#f5f3ff", color: "#6d28d9" },
    FOLLOW_UP_REQUIRED:    { bg: "#fef9ec", color: "#92580d" },
    ATTENDED:              { bg: "#e8f8f3", color: "#0d7a56" },
    PUBLISHED:             { bg: "#f5f3ff", color: "#6d28d9" },
    IDENTIFIED:            { bg: "#f0f3fb", color: "#64748b" },
    PITCH_SUBMITTED:       { bg: "#eff8ff", color: "#0369a1" },
    ACCEPTED:              { bg: "#e8f8f3", color: "#0d7a56" },
    SCHEDULED:             { bg: "#eff8ff", color: "#0369a1" },
    NATIONAL_CLOUD_FELLOW: { bg: "#fef9ec", color: "#92580d" },
    CHAPTER_LEAD_ACHIEVEMENT: { bg: "#f5f3ff", color: "#6d28d9" },
    CAMPUS_AMBASSADOR:     { bg: "#eff3fe", color: "#3b5bdb" },
    UNIVERSITY:            { bg: "#eff3fe", color: "#3b5bdb" },
    TVET:                  { bg: "#f5f3ff", color: "#6d28d9" },
  };
  const s = map[status] ?? { bg: "#f0f3fb", color: "#64748b" };
  return (
    <span style={{
      fontSize: "10px", fontWeight: 500, padding: "2px 7px", borderRadius: "4px",
      background: s.bg, color: s.color, whiteSpace: "nowrap",
    }}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

/** Consistent table wrapper */
export function DataTable({ children }: { children: ReactNode }) {
  return (
    <div style={{ background: "#fff", borderRadius: "var(--radius)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
      {children}
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr style={{ background: "#fafbfd", borderBottom: "1px solid var(--border)" }}>
        {children}
      </tr>
    </thead>
  );
}

export function Th({ children, right }: { children: ReactNode; right?: boolean }) {
  return (
    <th style={{
      padding: "9px 14px", textAlign: right ? "right" : "left",
      fontSize: "10.5px", fontWeight: 600, textTransform: "uppercase",
      letterSpacing: "0.05em", color: "var(--text-muted)",
    }}>
      {children}
    </th>
  );
}

export function Td({ children, right, muted, mono }: { children: ReactNode; right?: boolean; muted?: boolean; mono?: boolean }) {
  return (
    <td style={{
      padding: "9px 14px", fontSize: "12px",
      color: muted ? "var(--text-muted)" : "var(--text-primary)",
      textAlign: right ? "right" : "left",
      fontFamily: mono ? "monospace" : "inherit",
      verticalAlign: "middle",
    }}>
      {children}
    </td>
  );
}

export function TRow({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <tr
      style={{ borderBottom: "1px solid var(--border)", cursor: onClick ? "pointer" : "default" }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#fafbfd")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

/** Avatar initials */
export function Avatar({ name, size = 26, color = "#3b5bdb", bg = "#eff3fe" }: { name: string; size?: number; color?: string; bg?: string }) {
  const initials = name.split(" ").map(w => w[0] ?? "").join("").slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: `${size}px`, height: `${size}px`, borderRadius: "50%",
      background: bg, color, flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: `${Math.round(size * 0.38)}px`, fontWeight: 700,
    }}>
      {initials}
    </div>
  );
}

/** Empty state */
export function EmptyState({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div style={{ padding: "48px 24px", textAlign: "center" }}>
      <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>{title}</p>
      {subtitle && <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "16px" }}>{subtitle}</p>}
      {action}
    </div>
  );
}

/** Pagination */
export function Pagination({
  page, total, limit, onChange,
}: { page: number; total: number; limit: number; onChange: (p: number) => void }) {
  if (total <= limit) return null;
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "16px" }}>
      <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
        {start}–{end} of {total.toLocaleString()}
      </p>
      <div style={{ display: "flex", gap: "6px" }}>
        <button
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
          style={paginationBtn(page === 1)}
        >
          Previous
        </button>
        <button
          disabled={end >= total}
          onClick={() => onChange(page + 1)}
          style={paginationBtn(end >= total)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

function paginationBtn(disabled: boolean): React.CSSProperties {
  return {
    height: "28px", padding: "0 10px", borderRadius: "6px",
    border: "1px solid var(--border)", background: disabled ? "#f8fafc" : "#fff",
    fontSize: "11px", color: disabled ? "var(--text-muted)" : "var(--text-primary)",
    cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1,
  };
}

/** Filter row wrapper */
export function FilterRow({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "14px", flexWrap: "wrap" }}>
      {children}
    </div>
  );
}

/** Inline select filter */
export function FilterSelect({
  value, onChange, options,
}: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        height: "30px", padding: "0 10px", borderRadius: "6px",
        border: "1px solid var(--border)", background: "#fff",
        fontSize: "12px", color: "var(--text-primary)", cursor: "pointer",
        outline: "none",
      }}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

/** Search input */
export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div style={{ position: "relative" }}>
      <svg style={{ position: "absolute", left: "9px", top: "50%", transform: "translateY(-50%)", width: "13px", height: "13px", color: "var(--text-muted)" }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Search..."}
        style={{
          height: "30px", paddingLeft: "28px", paddingRight: "10px", borderRadius: "6px",
          border: "1px solid var(--border)", background: "#fff",
          fontSize: "12px", color: "var(--text-primary)", outline: "none",
          minWidth: "180px",
        }}
      />
    </div>
  );
}

/** Tab nav bar */
export function TabNav({ tabs, active, onChange }: {
  tabs: { value: string; label: string }[];
  active: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", gap: "0", borderBottom: "1px solid var(--border)", marginBottom: "16px" }}>
      {tabs.map(t => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          style={{
            padding: "9px 16px", border: "none", background: "none", cursor: "pointer",
            fontSize: "12px", fontWeight: active === t.value ? 600 : 400,
            color: active === t.value ? "var(--accent)" : "var(--text-muted)",
            borderBottom: `2px solid ${active === t.value ? "var(--accent)" : "transparent"}`,
            marginBottom: "-1px", whiteSpace: "nowrap",
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
