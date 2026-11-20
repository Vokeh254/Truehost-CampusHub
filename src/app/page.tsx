import { redirect } from "next/navigation";
import { auth } from "@/server/auth/config";

export default async function HomePage() {
  const session = await auth();

  if (!session) redirect("/login");

  const role = (session.user as any).systemRole;
  if (role === "SUPER_ADMIN") redirect("/admin");
  if (role === "CAMPUS_LEAD") redirect("/lead");
  redirect("/ambassador");
}
