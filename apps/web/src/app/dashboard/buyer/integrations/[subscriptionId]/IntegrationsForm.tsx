"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// ─── Integration definitions ─────────────────────────────────────────────────

interface Field {
  key: string;
  label: string;
  placeholder: string;
  type?: "text" | "password" | "url" | "tel";
  hint?: string;
}

interface IntegrationDef {
  id: string;
  label: string;
  icon: string;
  description: string;
  docsUrl: string;
  fields: Field[];
}

const INTEGRATION_DEFS: IntegrationDef[] = [
  {
    id: "slack",
    label: "Slack",
    icon: "💬",
    description: "Receive agent alerts and escalations in a Slack channel.",
    docsUrl: "https://api.slack.com/messaging/webhooks",
    fields: [
      {
        key: "webhookUrl",
        label: "Incoming Webhook URL",
        placeholder: "https://hooks.slack.com/services/T.../B.../...",
        type: "url",
        hint: "Create an Incoming Webhook in your Slack App settings and paste the URL here.",
      },
    ],
  },
  {
    id: "calendly",
    label: "Calendly",
    icon: "📅",
    description: "Let the agent book appointments directly to your Calendly calendar.",
    docsUrl: "https://calendly.com",
    fields: [
      {
        key: "schedulingUrl",
        label: "Scheduling Link",
        placeholder: "https://calendly.com/your-name/30min",
        type: "url",
        hint: "Share your Calendly booking page URL so the agent can direct leads there.",
      },
    ],
  },
  {
    id: "twilio_sms",
    label: "Twilio SMS",
    icon: "📱",
    description: "Send automated SMS reminders and follow-ups through your Twilio account.",
    docsUrl: "https://console.twilio.com",
    fields: [
      {
        key: "accountSid",
        label: "Account SID",
        placeholder: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        type: "text",
        hint: "Found on your Twilio Console dashboard.",
      },
      {
        key: "authToken",
        label: "Auth Token",
        placeholder: "your_auth_token",
        type: "password",
        hint: "Keep this secret — it authenticates all Twilio API calls.",
      },
      {
        key: "phoneNumber",
        label: "From Phone Number",
        placeholder: "+15551234567",
        type: "tel",
        hint: "Your Twilio phone number in E.164 format.",
      },
    ],
  },
  {
    id: "webhook",
    label: "Custom Webhook",
    icon: "🔌",
    description: "POST agent events to any URL — connect your own backend or Zapier/Make.",
    docsUrl: "https://zapier.com/help/create/code-webhooks/trigger-zaps-from-webhooks",
    fields: [
      {
        key: "url",
        label: "Webhook URL",
        placeholder: "https://your-server.com/agent-events",
        type: "url",
        hint: "The agent will POST JSON payloads here for every key event.",
      },
      {
        key: "secret",
        label: "Signing Secret (optional)",
        placeholder: "whsec_...",
        type: "password",
        hint: "If set, payloads will include an HMAC-SHA256 signature header for verification.",
      },
    ],
  },
  {
    id: "hubspot",
    label: "HubSpot",
    icon: "🟠",
    description: "Sync leads and contacts captured by the agent into your HubSpot CRM.",
    docsUrl: "https://app.hubspot.com/api-key",
    fields: [
      {
        key: "apiKey",
        label: "Private App Token",
        placeholder: "pat-na1-...",
        type: "password",
        hint: "Create a Private App in HubSpot → Settings → Integrations → Private Apps.",
      },
    ],
  },
  {
    id: "gmail",
    label: "Email Notifications",
    icon: "📧",
    description: "Receive email summaries and escalations from the agent.",
    docsUrl: "",
    fields: [
      {
        key: "notificationEmail",
        label: "Notification Email",
        placeholder: "you@yourcompany.com",
        type: "text",
        hint: "The agent will send summaries and urgent alerts to this address.",
      },
    ],
  },
  {
    id: "google_calendar",
    label: "Google Calendar",
    icon: "🗓️",
    description: "Surface your calendar availability so the agent can schedule accurately.",
    docsUrl: "https://calendar.google.com/calendar/r/settings/exportimport",
    fields: [
      {
        key: "calendarId",
        label: "Calendar ID",
        placeholder: "yourname@gmail.com",
        type: "text",
        hint: "Your Google Calendar ID — found in Calendar Settings → Integrate Calendar.",
      },
    ],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

type ConfigShape = Record<string, Record<string, string>>;

export default function IntegrationsForm({
  subscriptionId,
  agentTools,
  initialConfig,
}: {
  subscriptionId: string;
  agentTools: string[];
  initialConfig: ConfigShape;
}) {
  const router = useRouter();
  const [config, setConfig] = useState<ConfigShape>(initialConfig);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only show integrations the agent actually uses
  const relevantDefs = INTEGRATION_DEFS.filter((def) =>
    agentTools.includes(def.id)
  );

  function setField(integrationId: string, fieldKey: string, value: string) {
    setSaved(false);
    setConfig((prev) => ({
      ...prev,
      [integrationId]: {
        ...(prev[integrationId] ?? {}),
        [fieldKey]: value,
      },
    }));
  }

  function isConnected(def: IntegrationDef): boolean {
    const cfg = config[def.id];
    if (!cfg) return false;
    // Connected if the first required field has a value
    return !!cfg[def.fields[0].key]?.trim();
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/buyer/integrations/${subscriptionId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ config }),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSaved(true);
      router.refresh();
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (relevantDefs.length === 0) {
    return (
      <div
        className="rounded-xl border-2 border-dashed p-10 text-center"
        style={{ borderColor: "#1C2D40" }}
      >
        <div className="text-3xl mb-3">🔌</div>
        <div className="text-sm font-bold text-white mb-1">
          No integrations required
        </div>
        <p className="text-xs text-dim">
          This agent works standalone — no external tools to connect.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {relevantDefs.map((def) => {
        const connected = isConnected(def);
        return (
          <div
            key={def.id}
            className="bg-card border rounded-xl p-5 transition-colors"
            style={{
              borderColor: connected
                ? "rgba(46,204,113,0.3)"
                : "#1C2D40",
            }}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{def.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">
                      {def.label}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded font-bold"
                      style={
                        connected
                          ? {
                              background: "rgba(46,204,113,0.12)",
                              color: "#2ECC71",
                            }
                          : {
                              background: "rgba(74,101,128,0.15)",
                              color: "#4A6580",
                            }
                      }
                    >
                      {connected ? "Connected" : "Not connected"}
                    </span>
                  </div>
                  <p className="text-xs text-dim mt-0.5">{def.description}</p>
                </div>
              </div>
              {def.docsUrl && (
                <a
                  href={def.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-dim hover:text-primary transition-colors shrink-0"
                >
                  Docs ↗
                </a>
              )}
            </div>

            {/* Fields */}
            <div className="space-y-3">
              {def.fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-xs font-medium text-dim mb-1">
                    {field.label}
                  </label>
                  <input
                    type={field.type ?? "text"}
                    value={config[def.id]?.[field.key] ?? ""}
                    onChange={(e) =>
                      setField(def.id, field.key, e.target.value)
                    }
                    placeholder={field.placeholder}
                    className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-xs text-text-main placeholder-dim outline-none focus:border-primary/40 transition-colors font-mono"
                  />
                  {field.hint && (
                    <p className="text-xs text-dim mt-1 leading-relaxed">
                      {field.hint}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Save bar */}
      <div className="flex items-center justify-between pt-2">
        <div className="text-xs text-dim">
          {saved && (
            <span style={{ color: "#2ECC71" }}>
              ✓ Integrations saved
            </span>
          )}
          {error && <span style={{ color: "#E74C3C" }}>{error}</span>}
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-xs font-bold px-5 py-2.5 rounded-lg transition-all disabled:opacity-40"
          style={{ background: "#FF9500", color: "black" }}
        >
          {saving ? "Saving…" : "Save Integrations"}
        </button>
      </div>
    </div>
  );
}
