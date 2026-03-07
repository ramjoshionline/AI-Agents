import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-bg font-mono text-text-main">
      <Navbar />

      <div className="pt-20 flex items-center justify-center min-h-screen">
        <div className="max-w-md w-full mx-auto px-6 text-center">
          <div className="text-4xl mb-6">🔐</div>

          <div
            className="rounded-xl p-8 border"
            style={{
              background: "#0D1420",
              borderColor: "#1C2D40",
            }}
          >
            <div className="text-xs text-primary tracking-widest uppercase mb-3">
              Coming in M2
            </div>
            <h1 className="text-xl font-extrabold text-white mb-3">
              Authentication
            </h1>
            <p className="text-xs text-dim leading-relaxed mb-6">
              Buyer and builder dashboards are being built in Milestone 2.
              This will include role-based sign-up, sign-in, and dedicated
              dashboard views for each user type.
            </p>

            <div className="space-y-3 text-left mb-6">
              {[
                { icon: "🏢", label: "Buyer Dashboard", desc: "Activity log, metrics, settings, override inbox" },
                { icon: "👩‍💻", label: "Builder Dashboard", desc: "Agent management, earnings, subscriber analytics" },
                { icon: "🔒", label: "Role-based Auth", desc: "Register as buyer, builder, or admin" },
              ].map(({ icon, label, desc }) => (
                <div
                  key={label}
                  className="flex items-start gap-3 p-3 rounded-lg"
                  style={{ background: "#111A28" }}
                >
                  <span className="text-lg shrink-0">{icon}</span>
                  <div>
                    <div className="text-xs font-bold text-white">{label}</div>
                    <div className="text-xs text-dim mt-0.5">{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <Link
              href="/"
              className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors font-bold"
            >
              ← Back to homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
