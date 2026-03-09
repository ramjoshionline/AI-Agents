import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/sign-in");
  }

  const role = session.user.role;

  if (role === "admin") {
    redirect("/dashboard/admin");
  }

  if (role === "builder") {
    redirect("/dashboard/builder");
  }

  redirect("/dashboard/buyer");
}
