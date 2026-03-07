/**
 * Seed script — creates demo live agents for marketplace testing.
 * Run with: cd apps/web && npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
 * Or add "prisma.seed" to package.json and run: npx prisma db seed
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import path from "path";

// .env.local isn't loaded by ts-node; set the DB path explicitly
process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  `file:${path.resolve(__dirname, "dev.db")}`;

const prisma = new PrismaClient();

const DEMO_AGENTS = [
  {
    name: "Dental Receptionist AI",
    tagline: "Books appointments, handles insurance queries, and follows up with no-shows — 24/7.",
    description: `A fully-trained dental receptionist AI that handles every front-desk task automatically.

What it does:
• Books, reschedules, and cancels appointments via Google Calendar or Calendly
• Answers common insurance pre-authorization questions
• Sends SMS appointment reminders and follow-ups with Twilio
• Handles patient FAQ (hours, location, accepted insurance, parking)
• Escalates urgent concerns to your front desk team via Slack

Who it's for: Dental practices that miss leads after hours or spend too much time on routine calls. Fully HIPAA-aware — never stores or repeats sensitive health information.`,
    vertical: "Dental Practices",
    systemPrompt: "[SYSTEM PROMPT PROTECTED — BUILDER IP]",
    tools: JSON.stringify(["google_calendar", "twilio_sms", "slack", "webhook"]),
    pricingModel: "flat",
    priceMonthly: 19900,
    trialDays: 14,
    status: "live",
  },
  {
    name: "Real Estate Lead Qualifier",
    tagline: "Qualifies buyer and seller leads, books viewings, and syncs to your CRM automatically.",
    description: `Stop wasting time on unqualified leads. This agent handles your entire lead funnel end-to-end.

What it does:
• Runs a smart qualification conversation (budget, timeline, location, pre-approval status)
• Books property viewings and consultations via Calendly
• Creates and updates contact records in HubSpot or Salesforce
• Sends personalised follow-up sequences over SMS and email
• Flags hot leads to your team immediately via Slack

Who it's for: Real estate agents and brokerages receiving high inbound volume who need to prioritise their time on serious buyers and sellers.`,
    vertical: "Real Estate",
    systemPrompt: "[SYSTEM PROMPT PROTECTED — BUILDER IP]",
    tools: JSON.stringify(["calendly", "hubspot", "twilio_sms", "gmail", "slack"]),
    pricingModel: "flat",
    priceMonthly: 24900,
    trialDays: 14,
    status: "live",
  },
  {
    name: "E-commerce Support Agent",
    tagline: "Handles order status, returns, product questions, and escalations — in real time.",
    description: `Give your customers instant, accurate support without hiring more agents.

What it does:
• Answers order status questions by querying your system via webhook
• Handles returns and refund requests end-to-end
• Answers product questions (specs, compatibility, availability)
• Processes exchange requests
• Escalates complex complaints to your team via Slack with full context

Who it's for: E-commerce stores with high support volume who want to reduce first-response time to under 60 seconds and free up their team for complex issues.`,
    vertical: "E-commerce",
    systemPrompt: "[SYSTEM PROMPT PROTECTED — BUILDER IP]",
    tools: JSON.stringify(["webhook", "slack", "gmail"]),
    pricingModel: "flat",
    priceMonthly: 9900,
    trialDays: 7,
    status: "live",
  },
  {
    name: "Law Firm Intake Agent",
    tagline: "Conducts client intake, screens case eligibility, and books consultations.",
    description: `Turn website visitors into qualified consultations automatically — 24 hours a day.

What it does:
• Conducts a professional intake interview (matter type, jurisdiction, key facts)
• Screens case eligibility based on your practice areas
• Books consultations via Calendly with the right attorney
• Logs every intake to your CRM with a summary
• Sends confirmation and preparation emails to new clients

Who it's for: Law firms that lose leads to voicemail or slow follow-up. Designed to be professional, thorough, and always on. Ethical-wall aware — does not provide legal advice.`,
    vertical: "Law Firms",
    systemPrompt: "[SYSTEM PROMPT PROTECTED — BUILDER IP]",
    tools: JSON.stringify(["calendly", "hubspot", "gmail"]),
    pricingModel: "flat",
    priceMonthly: 34900,
    trialDays: 0,
    status: "live",
  },
  {
    name: "Restaurant Reservations AI",
    tagline: "Takes reservations via chat or SMS, manages waitlists, and sends reminders.",
    description: `A reservation agent that never puts guests on hold and never misses a booking.

What it does:
• Takes reservations for any party size and time via web chat or SMS
• Manages waitlists automatically during peak hours
• Sends confirmation and reminder texts 24h and 2h before the reservation
• Handles special requests (allergies, accessibility, high chairs)
• Connects to Google Calendar for real-time availability

Who it's for: Restaurants, bars, and hospitality businesses who want to reduce no-shows, fill tables efficiently, and free their staff from answering the phone.`,
    vertical: "Restaurants",
    systemPrompt: "[SYSTEM PROMPT PROTECTED — BUILDER IP]",
    tools: JSON.stringify(["google_calendar", "twilio_sms"]),
    pricingModel: "flat",
    priceMonthly: 7900,
    trialDays: 30,
    status: "live",
  },
];

async function main() {
  console.log("🌱  Seeding demo agents…");

  // Create or find a demo builder account
  const hashedPassword = await bcrypt.hash("Demo1234!", 10);
  const builder = await prisma.user.upsert({
    where: { email: "demo-builder@agentmarket.dev" },
    update: {},
    create: {
      email: "demo-builder@agentmarket.dev",
      password: hashedPassword,
      name: "Demo Builder",
      role: "builder",
    },
  });

  console.log(`   Builder: ${builder.email} (id: ${builder.id})`);

  // Only seed if no live agents exist yet
  const existingLive = await prisma.agent.count({ where: { status: "live" } });
  if (existingLive > 0) {
    console.log(`   ↩  ${existingLive} live agents already exist — skipping.`);
    return;
  }

  for (const data of DEMO_AGENTS) {
    const agent = await prisma.agent.create({
      data: { ...data, builderId: builder.id },
    });
    console.log(`   ✓  ${agent.name}`);
  }

  console.log(`✅  Seeded ${DEMO_AGENTS.length} demo agents.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
