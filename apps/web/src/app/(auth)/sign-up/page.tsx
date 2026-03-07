"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Role = "buyer" | "builder";

const ROLE_OPTIONS: {
  value: Role;
  icon: string;
  title: string;
  subtitle: string;
  color: string;
  border: string;
  bg: string;
  points: string[];
}[] = [
  {
    value: "buyer",
    icon: "🏢",
    title: "I'm an SMB Owner",
    subtitle: "I want to subscribe to AI agents for my business",
    color: "#2ECC71",
    border: "rgba(46,204,113,0.35)",
    bg: "rgba(46,204,113,0.07)",
    points: ["Browse marketplace agents", "Subscribe in minutes", "No code or engineers"],
  },
  {
    value: "builder",
    icon: "👩‍💻",
    title: "I'm an Agent Builder",
    subtitle: "I want to list and sell AI agents I've built",
    color: "#3B9EFF",
    border: "rgba(59,158,255,0.35)",
    bg: "rgba(59,158,255,0.07)",
    points: ["List your agents for sale", "Earn 70–75% per subscription", "We handle hosting + payments"],
  },
];

export default function SignUpPage() {
  const router = useRouter();
  const [step, setStep] = useState<"role" | "details">("role");
  const [role, setRole] = useState<Role | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Register
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name, role }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Registration failed.");
      setLoading(false);
      return;
    }

    // Auto sign in
    const signInRes = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (signInRes?.error) {
      setError("Account created, but sign-in failed. Please sign in manually.");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen bg-bg font-mono flex items-center justify-center px-4 py-12">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(255,149,0,0.05) 0%, transparent 70%)",
        }}
      />

      <div className="relative w-full max-w-lg">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-7 h-7 rounded-md bg-primary/20 border border-primary/40 flex items-center justify-center text-primary text-sm font-bold">
            A
          </div>
          <span className="font-bold text-sm text-white">
            Agent<span className="text-primary">Market</span>
          </span>
        </Link>

        <div className="bg-card border border-border rounded-xl p-8">
          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-8">
            {(["role", "details"] as const).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                {i > 0 && <div className="w-8 h-px bg-border" />}
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={
                    step === s || (i === 0 && step === "details")
                      ? { background: "#FF9500", color: "#000" }
                      : { background: "#1C2D40", color: "#4A6580" }
                  }
                >
                  {i + 1}
                </div>
                <span
                  className="text-xs"
                  style={
                    step === s ? { color: "#BDD0E0" } : { color: "#4A6580" }
                  }
                >
                  {s === "role" ? "Choose Role" : "Your Details"}
                </span>
              </div>
            ))}
          </div>

          {/* Step 1: Role selection */}
          {step === "role" && (
            <div>
              <div className="text-center mb-6">
                <h1 className="text-lg font-extrabold text-white mb-1">
                  Create your account
                </h1>
                <p className="text-xs text-dim">How will you use AgentMarket?</p>
              </div>

              <div className="space-y-4 mb-6">
                {ROLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRole(opt.value)}
                    className="w-full text-left rounded-xl p-5 transition-all"
                    style={
                      role === opt.value
                        ? { background: opt.bg, border: `2px solid ${opt.color}` }
                        : { background: "transparent", border: "2px solid #1C2D40" }
                    }
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl shrink-0">{opt.icon}</div>
                      <div className="flex-1">
                        <div
                          className="text-sm font-bold mb-0.5"
                          style={
                            role === opt.value
                              ? { color: opt.color }
                              : { color: "#BDD0E0" }
                          }
                        >
                          {opt.title}
                        </div>
                        <div className="text-xs text-dim mb-3">{opt.subtitle}</div>
                        <div className="flex gap-3 flex-wrap">
                          {opt.points.map((p) => (
                            <span
                              key={p}
                              className="text-xs px-2 py-0.5 rounded"
                              style={{
                                background: `${opt.color}12`,
                                color: opt.color,
                              }}
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                      {/* Radio dot */}
                      <div
                        className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5"
                        style={{
                          borderColor: role === opt.value ? opt.color : "#1C2D40",
                        }}
                      >
                        {role === opt.value && (
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ background: opt.color }}
                          />
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <button
                type="button"
                disabled={!role}
                onClick={() => setStep("details")}
                className="w-full bg-primary text-black font-bold text-sm py-3 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue →
              </button>
            </div>
          )}

          {/* Step 2: Details */}
          {step === "details" && (
            <form onSubmit={handleSubmit}>
              <div className="flex items-center gap-3 mb-6">
                <button
                  type="button"
                  onClick={() => setStep("role")}
                  className="text-dim hover:text-text-main transition-colors text-xs"
                >
                  ← Back
                </button>
                <div className="text-center flex-1">
                  <h1 className="text-lg font-extrabold text-white">
                    Your details
                  </h1>
                  <p className="text-xs text-dim">
                    Signing up as a{" "}
                    <span
                      style={{
                        color:
                          role === "buyer" ? "#2ECC71" : "#3B9EFF",
                      }}
                    >
                      {role}
                    </span>
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {error && (
                  <div className="text-xs text-red bg-red/10 border border-red/20 rounded-lg px-4 py-3">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-xs text-dim mb-1.5 tracking-wide uppercase">
                    Name (optional)
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name or company"
                    className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-xs text-text-main placeholder-dim outline-none focus:border-primary/60 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs text-dim mb-1.5 tracking-wide uppercase">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@company.com"
                    className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-xs text-text-main placeholder-dim outline-none focus:border-primary/60 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs text-dim mb-1.5 tracking-wide uppercase">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="Min. 8 characters"
                    className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-xs text-text-main placeholder-dim outline-none focus:border-primary/60 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-black font-bold text-sm py-3 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Creating account..." : "Create Account"}
                </button>
              </div>
            </form>
          )}

          <p className="text-center text-xs text-dim mt-6">
            Already have an account?{" "}
            <Link href="/sign-in" className="text-primary hover:text-primary/80 transition-colors">
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-dim mt-6">
          <Link href="/" className="hover:text-text-main transition-colors">
            ← Back to homepage
          </Link>
        </p>
      </div>
    </div>
  );
}
