export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import SettingsClient from "./SettingsClient";

export default async function AccountSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/sign-in?next=/account/settings");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, role: true, notifPrefs: true },
  });
  if (!user) redirect("/sign-in");

  const notifPrefs = JSON.parse(user.notifPrefs ?? "{}");

  return (
    <div className="min-h-screen bg-bg font-mono text-text-main">
      <Navbar />
      <div className="max-w-2xl mx-auto px-6 pt-24 pb-16">
        <div className="mb-8">
          <div className="text-xs text-primary tracking-widest uppercase mb-2">Account</div>
          <h1 className="text-xl font-extrabold text-white">Settings</h1>
          <p className="text-xs text-dim mt-1">Manage your profile, password, and notification preferences.</p>
        </div>
        <SettingsClient
          name={user.name ?? ""}
          email={user.email}
          role={user.role}
          notifPrefs={notifPrefs}
        />
      </div>
    </div>
  );
}
