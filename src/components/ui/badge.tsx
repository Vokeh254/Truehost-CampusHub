import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "outline" | "purple";
}

export type BadgeVariant = BadgeProps["variant"];

const variants: Record<string, { bg: string; color: string; border?: string }> = {
  default:  { bg: "#f0f3fb", color: "#374151" },
  success:  { bg: "#e8f8f3", color: "#0d7a56" },
  warning:  { bg: "#fef9ec", color: "#92580d" },
  danger:   { bg: "#fdf1f2", color: "#b91c1c" },
  info:     { bg: "#eff8ff", color: "#0369a1" },
  outline:  { bg: "#fff", color: "#64748b", border: "1px solid #dde3f0" },
  purple:   { bg: "#f5f3ff", color: "#6d28d9" },
};

export function Badge({ children, className, variant = "default" }: BadgeProps) {
  const v = variants[variant] ?? variants.default;
  return (
    <span
      className={cn(className)}
      style={{
        display: "inline-flex", alignItems: "center",
        padding: "2px 8px", borderRadius: "5px",
        fontSize: "11px", fontWeight: 500,
        background: v.bg, color: v.color,
        border: v.border ?? "none",
        lineHeight: "1.6",
      }}
    >
      {children}
    </span>
  );
}
