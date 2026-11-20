import { cn } from "@/lib/utils";
import { forwardRef } from "react";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, label, id, ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
          {label}
        </label>
      )}
      <textarea
        id={id}
        ref={ref}
        className={cn(className)}
        style={{
          width: "100%", minHeight: "72px", padding: "8px 10px",
          borderRadius: "7px", border: `1px solid ${error ? "#fca5a5" : "var(--border)"}`,
          background: "#fff", fontSize: "12px", color: "var(--text-primary)",
          outline: "none", transition: "border-color 0.15s", resize: "vertical",
          lineHeight: 1.5,
        }}
        onFocus={(e) => (e.target.style.borderColor = "#3b5bdb")}
        onBlur={(e) => (e.target.style.borderColor = error ? "#fca5a5" : "var(--border)")}
        {...props}
      />
      {error && <p style={{ fontSize: "11px", color: "#e02d3c", marginTop: "2px" }}>{error}</p>}
    </div>
  )
);
Textarea.displayName = "Textarea";
export { Textarea };
