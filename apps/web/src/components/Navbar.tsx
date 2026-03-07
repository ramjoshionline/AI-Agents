"use client";

import { useState } from "react";
import Link from "next/link";
import AuthButton from "./AuthButton";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-bg/90 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-14">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-md bg-primary/20 border border-primary/40 flex items-center justify-center text-primary text-sm font-bold group-hover:bg-primary/30 transition-colors">
            A
          </div>
          <span className="font-bold text-sm text-white tracking-tight">
            Agent<span className="text-primary">Market</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {[
            { label: "Marketplace", href: "/marketplace" },
            { label: "For Builders", href: "/builders" },
            { label: "How It Works", href: "/#how-it-works" },
            { label: "Pricing", href: "/#pricing" },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-xs text-dim hover:text-text-main transition-colors tracking-wide"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="hidden md:flex items-center gap-3">
          <AuthButton />
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-dim hover:text-text-main"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {mobileOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-card px-6 py-4 flex flex-col gap-4">
          {[
            { label: "Marketplace", href: "/marketplace" },
            { label: "For Builders", href: "/builders" },
            { label: "How It Works", href: "/#how-it-works" },
            { label: "Pricing", href: "/#pricing" },
            { label: "Sign In", href: "/dashboard" },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-xs text-dim hover:text-text-main transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/marketplace"
            className="text-xs bg-primary text-black font-bold px-4 py-2 rounded-md text-center hover:bg-primary/90 transition-colors"
            onClick={() => setMobileOpen(false)}
          >
            Browse Agents
          </Link>
        </div>
      )}
    </nav>
  );
}
