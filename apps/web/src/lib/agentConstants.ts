export const VERTICALS = [
  "Dental Practices",
  "Law Firms",
  "Real Estate",
  "E-commerce",
  "Restaurants",
  "Healthcare",
  "Accounting",
  "Fitness & Wellness",
  "Insurance",
  "Education",
  "Construction",
  "Property Management",
  "Automotive",
  "Salon & Beauty",
  "Financial Services",
];

export const TOOLS: {
  id: string;
  name: string;
  icon: string;
  category: string;
  desc: string;
}[] = [
  {
    id: "google_calendar",
    name: "Google Calendar",
    icon: "📅",
    category: "Scheduling",
    desc: "Read and create calendar events",
  },
  {
    id: "calendly",
    name: "Calendly",
    icon: "🗓️",
    category: "Scheduling",
    desc: "Book appointments via Calendly",
  },
  {
    id: "gmail",
    name: "Gmail",
    icon: "📧",
    category: "Email",
    desc: "Send and read emails",
  },
  {
    id: "outlook",
    name: "Outlook",
    icon: "📨",
    category: "Email",
    desc: "Send and read Outlook emails",
  },
  {
    id: "hubspot",
    name: "HubSpot CRM",
    icon: "🏷️",
    category: "CRM",
    desc: "Log leads and update contact records",
  },
  {
    id: "salesforce",
    name: "Salesforce",
    icon: "☁️",
    category: "CRM",
    desc: "Sync leads and opportunities",
  },
  {
    id: "quickbooks",
    name: "QuickBooks",
    icon: "💰",
    category: "Accounting",
    desc: "Create invoices and log payments",
  },
  {
    id: "twilio_sms",
    name: "Twilio SMS",
    icon: "💬",
    category: "Messaging",
    desc: "Send and receive SMS messages",
  },
  {
    id: "slack",
    name: "Slack",
    icon: "⚡",
    category: "Messaging",
    desc: "Post messages to Slack channels",
  },
  {
    id: "stripe",
    name: "Stripe",
    icon: "💳",
    category: "Payments",
    desc: "Check subscription status and invoices",
  },
  {
    id: "webhook",
    name: "Custom Webhook",
    icon: "🔌",
    category: "Custom",
    desc: "Call any REST API endpoint",
  },
];

export const PRICING_MODELS = [
  {
    id: "flat",
    label: "Flat Monthly",
    icon: "📦",
    desc: "One fixed price per month. Easiest to sell — buyers know exactly what they pay.",
  },
  {
    id: "usage",
    label: "Usage-Based",
    icon: "⚡",
    desc: "Buyers pay per conversation or action. Good for low-volume, high-value use cases.",
  },
  {
    id: "tiered",
    label: "Tiered",
    icon: "📊",
    desc: "Starter / Pro / Enterprise tiers. More revenue potential for power users.",
  },
];

export const TRIAL_OPTIONS = [
  { days: 0, label: "No free trial" },
  { days: 7, label: "7-day free trial" },
  { days: 14, label: "14-day free trial" },
  { days: 30, label: "30-day free trial" },
];

export const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; desc: string }
> = {
  draft: {
    label: "Draft",
    color: "#4A6580",
    bg: "rgba(74,101,128,0.15)",
    desc: "Not submitted. Only you can see this.",
  },
  review: {
    label: "Under Review",
    color: "#FF9500",
    bg: "rgba(255,149,0,0.12)",
    desc: "Submitted. We're reviewing it — usually within 48h.",
  },
  live: {
    label: "Live",
    color: "#2ECC71",
    bg: "rgba(46,204,113,0.12)",
    desc: "Approved and visible in the marketplace.",
  },
  rejected: {
    label: "Rejected",
    color: "#E74C3C",
    bg: "rgba(231,76,60,0.12)",
    desc: "Needs changes before it can go live.",
  },
};
