import { cn } from "@/lib/utils";

function Card({ className, style, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(className)}
      style={{ background: "#fff", borderRadius: "var(--radius)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", ...style }}
      {...props}
    />
  );
}

function CardHeader({ className, style, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center justify-between", className)} style={{ padding: "14px 18px 10px", ...style }} {...props} />;
}

function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn(className)} style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }} {...props} />;
}

function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn(className)} style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "1px" }} {...props} />;
}

function CardContent({ className, style, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(className)} style={{ padding: "0 18px 16px", ...style }} {...props} />;
}

function CardFooter({ className, style, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center", className)} style={{ padding: "10px 18px 14px", borderTop: "1px solid var(--border)", ...style }} {...props} />;
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
