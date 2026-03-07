"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="w-16 h-6 bg-card rounded animate-pulse" />;
  }

  if (!session) {
    return (
      <>
        <Link
          href="/sign-in"
          className="text-xs text-dim hover:text-text-main transition-colors px-3 py-1.5"
        >
          Sign In
        </Link>
        <Link
          href="/sign-up"
          className="text-xs bg-primary text-black font-bold px-4 py-1.5 rounded-md hover:bg-primary/90 transition-colors"
        >
          Get Started
        </Link>
      </>
    );
  }

  return (
    <>
      <Link
        href="/dashboard"
        className="text-xs text-text-main hover:text-white transition-colors truncate max-w-24"
      >
        {session.user.name || session.user.email?.split("@")[0]}
      </Link>
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="text-xs border border-border text-dim hover:text-text-main hover:border-border/80 transition-colors px-3 py-1.5 rounded-md"
      >
        Sign Out
      </button>
    </>
  );
}
