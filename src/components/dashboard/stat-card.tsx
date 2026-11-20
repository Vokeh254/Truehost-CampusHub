import { type LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
}

export function StatCard({
  title, value, change, changeType = "neutral",
  icon: Icon, iconColor = "#3b5bdb", iconBg = "#eff3fe",
}: StatCardProps) {
  const changeColor =
    changeType === "positive" ? "#0d9f6e" :
    changeType === "negative" ? "#e02d3c" :
    "var(--text-muted)";

  const Arrow = changeType === "positive" ? "↑" : changeType === "negative" ? "↓" : "";

  return (
    <div style={{
      background: "#fff", borderRadius: "var(--radius)",
      border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)",
      padding: "16px",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "6px", fontWeight: 500 }}>{title}</p>
          <p style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {change && (
            <p style={{ fontSize: "11px", color: changeColor, marginTop: "5px", fontWeight: 500 }}>
              {Arrow && <span style={{ marginRight: "2px" }}>{Arrow}</span>}{change}
            </p>
          )}
        </div>
        <div style={{ width: "36px", height: "36px", borderRadius: "9px", background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon style={{ width: "17px", height: "17px", color: iconColor }} />
        </div>
      </div>
    </div>
  );
}
