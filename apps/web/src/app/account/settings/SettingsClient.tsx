"use client";

import { useState } from "react";

type NotifPrefs = {
  emailNewSub?: boolean;
  emailCancellation?: boolean;
  emailPayment?: boolean;
};

type Props = {
  name: string;
  email: string;
  role: string;
  notifPrefs: NotifPrefs;
};

function StatusMsg({ msg }: { msg: { text: string; ok: boolean } | null }) {
  if (!msg) return null;
  return (
    <p
      className="text-xs mt-2 font-medium"
      style={{ color: msg.ok ? "#2ECC71" : "#E74C3C" }}
    >
      {msg.ok ? "✓ " : "✗ "}{msg.text}
    </p>
  );
}

export default function SettingsClient({ name: initName, email, role, notifPrefs: initPrefs }: Props) {
  // Profile
  const [name, setName] = useState(initName);
  const [profileMsg, setProfileMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);

  // Password
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwMsg, setPwMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [pwSaving, setPwSaving] = useState(false);

  // Notifications
  const [prefs, setPrefs] = useState<NotifPrefs>(initPrefs);
  const [notifMsg, setNotifMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [notifSaving, setNotifSaving] = useState(false);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) setProfileMsg({ text: data.error ?? "Failed to save", ok: false });
      else setProfileMsg({ text: "Name updated", ok: true });
    } catch {
      setProfileMsg({ text: "Network error", ok: false });
    } finally {
      setProfileSaving(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(null);
    if (next !== confirm) {
      setPwMsg({ text: "Passwords do not match", ok: false });
      return;
    }
    if (next.length < 8) {
      setPwMsg({ text: "Password must be at least 8 characters", ok: false });
      return;
    }
    setPwSaving(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current, next }),
      });
      const data = await res.json();
      if (!res.ok) setPwMsg({ text: data.error ?? "Failed to update", ok: false });
      else {
        setPwMsg({ text: "Password updated successfully", ok: true });
        setCurrent(""); setNext(""); setConfirm("");
      }
    } catch {
      setPwMsg({ text: "Network error", ok: false });
    } finally {
      setPwSaving(false);
    }
  }

  async function saveNotifs(key: keyof NotifPrefs, val: boolean) {
    const updated = { ...prefs, [key]: val };
    setPrefs(updated);
    setNotifSaving(true);
    setNotifMsg(null);
    try {
      const res = await fetch("/api/account/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (!res.ok) setNotifMsg({ text: "Failed to save", ok: false });
      else setNotifMsg({ text: "Preferences saved", ok: true });
    } catch {
      setNotifMsg({ text: "Network error", ok: false });
    } finally {
      setNotifSaving(false);
    }
  }

  const inputCls =
    "w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-xs text-text-main placeholder:text-dim focus:outline-none focus:border-primary/50 transition-colors";

  const NOTIF_OPTIONS: { key: keyof NotifPrefs; label: string; desc: string }[] = role === "builder"
    ? [
        { key: "emailNewSub", label: "New subscriber", desc: "Email when someone subscribes to one of your agents" },
        { key: "emailCancellation", label: "Cancellation", desc: "Email when a subscriber cancels" },
        { key: "emailPayment", label: "Payment received", desc: "Email for each successful monthly payment" },
      ]
    : [
        { key: "emailPayment", label: "Payment receipts", desc: "Email confirmation after each billing cycle" },
        { key: "emailCancellation", label: "Subscription changes", desc: "Email when your subscription status changes" },
      ];

  return (
    <div className="space-y-8">
      {/* Profile */}
      <section className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-sm font-bold text-white mb-1">Profile</h2>
        <p className="text-xs text-dim mb-5">Your public name and sign-in email.</p>
        <form onSubmit={saveProfile} className="space-y-4">
          <div>
            <label className="block text-xs text-dim mb-1.5">Display name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
              maxLength={80}
              required
            />
          </div>
          <div>
            <label className="block text-xs text-dim mb-1.5">Email address</label>
            <input
              type="email"
              value={email}
              disabled
              className={`${inputCls} opacity-40 cursor-not-allowed`}
            />
            <p className="text-xs text-dim mt-1">Email cannot be changed.</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={profileSaving}
              className="text-xs font-bold px-5 py-2 rounded-lg transition-colors disabled:opacity-50"
              style={{ background: "rgba(59,158,255,0.15)", color: "#3B9EFF" }}
            >
              {profileSaving ? "Saving…" : "Save Name"}
            </button>
            <StatusMsg msg={profileMsg} />
          </div>
        </form>
      </section>

      {/* Password */}
      <section className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-sm font-bold text-white mb-1">Password</h2>
        <p className="text-xs text-dim mb-5">Change your sign-in password.</p>
        <form onSubmit={savePassword} className="space-y-4">
          <div>
            <label className="block text-xs text-dim mb-1.5">Current password</label>
            <input
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              className={inputCls}
              required
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="block text-xs text-dim mb-1.5">New password</label>
            <input
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              className={inputCls}
              required
              autoComplete="new-password"
              minLength={8}
            />
          </div>
          <div>
            <label className="block text-xs text-dim mb-1.5">Confirm new password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={inputCls}
              required
              autoComplete="new-password"
            />
          </div>
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={pwSaving}
              className="text-xs font-bold px-5 py-2 rounded-lg transition-colors disabled:opacity-50"
              style={{ background: "rgba(59,158,255,0.15)", color: "#3B9EFF" }}
            >
              {pwSaving ? "Updating…" : "Update Password"}
            </button>
            <StatusMsg msg={pwMsg} />
          </div>
        </form>
      </section>

      {/* Notifications */}
      <section className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-sm font-bold text-white mb-1">Email Notifications</h2>
        <p className="text-xs text-dim mb-5">Choose which emails you receive.</p>
        <div className="space-y-4">
          {NOTIF_OPTIONS.map(({ key, label, desc }) => (
            <label key={key} className="flex items-start gap-3 cursor-pointer group">
              <div className="mt-0.5 shrink-0">
                <button
                  type="button"
                  role="switch"
                  aria-checked={!!prefs[key]}
                  onClick={() => saveNotifs(key, !prefs[key])}
                  disabled={notifSaving}
                  className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50"
                  style={{
                    background: prefs[key] ? "#3B9EFF" : "rgba(74,101,128,0.3)",
                  }}
                >
                  <span
                    className="inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform"
                    style={{ transform: prefs[key] ? "translateX(18px)" : "translateX(2px)" }}
                  />
                </button>
              </div>
              <div>
                <div className="text-xs font-bold text-white">{label}</div>
                <div className="text-xs text-dim">{desc}</div>
              </div>
            </label>
          ))}
        </div>
        <StatusMsg msg={notifMsg} />
      </section>

      {/* Danger zone */}
      <section className="bg-card border border-border rounded-xl p-6" style={{ borderColor: "rgba(231,76,60,0.2)" }}>
        <h2 className="text-sm font-bold text-white mb-1">Account</h2>
        <p className="text-xs text-dim mb-4">
          Role:{" "}
          <span className="font-bold" style={{ color: "#3B9EFF" }}>
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </span>
        </p>
        <p className="text-xs text-dim">
          To close your account or transfer ownership, contact{" "}
          <span className="text-primary">support@agentsmarket.ai</span>.
        </p>
      </section>
    </div>
  );
}
