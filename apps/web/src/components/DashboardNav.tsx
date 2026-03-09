"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

export default function DashboardNav() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const role = session?.user?.role;

  const navLinks =
    role === "builder"
      ? [
          { label: "Overview", href: "/dashboard/builder" },
          { label: "My Agents", href: "/dashboard/builder/agents" },
          { label: "Earnings", href: "/dashboard/builder/earnings" },
          { label: "Settings", href: "/account/settings" },
        ]
      : [
          { label: "Overview", href: "/dashboard/buyer" },
          { label: "My Agents", href: "/dashboard/buyer/agents" },
          { label: "Activity", href: "/dashboard/buyer/activity" },
          { label: "Settings", href: "/account/settings" },
        ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-bg/95 backdrop-blur-sm h-14 flex items-center px-6">
      <div className="flex items-center justify-between w-full max-w-7xl mx-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mr-8 shrink-0">
          <div className="w-6 h-6 rounded bg-primary/20 border border-primary/40 flex items-center justify-center text-primary text-xs font-bold">
            A
          </div>
          <span className="text-xs font-bold text-white">
            Agent<span className="text-primary">Market</span>
          </span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-1 flex-1">
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs px-3 py-1.5 rounded-md transition-colors"
                style={
                  active
                    ? { background: "rgba(255,149,0,0.12)", color: "#FF9500" }
                    : { color: "#4A6580" }
                }
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Role badge */}
          <div
            className="hidden sm:flex text-xs px-2.5 py-1 rounded-md font-bold uppercase tracking-wider"
            style={
              role === "builder"
                ? { background: "rgba(59,158,255,0.12)", color: "#3B9EFF" }
                : { background: "rgba(46,204,113,0.12)", color: "#2ECC71" }
            }
          >
            {role}
          </div>

          {/* User email */}
          <span className="text-xs text-dim hidden lg:block truncate max-w-32">
            {session?.user?.name || session?.user?.email}
          </span>

          {/* Sign out */}
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-xs text-dim hover:text-text-main transition-colors border border-border px-3 py-1.5 rounded-md hover:border-border/80"
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
}
