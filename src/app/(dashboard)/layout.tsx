import { redirect } from "next/navigation";
import { auth } from "@/server/auth/config";
import { DashboardShell } from "@/components/dashboard/shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const user = session.user as any;

  return (
    <DashboardShell
      userRole={user.systemRole}
      userName={user.name ?? ""}
      userEmail={user.email ?? ""}
    >
      {children}
    </DashboardShell>
  );
}
