import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgentMarket — AI Agents for SMBs",
  description:
    "The marketplace where small businesses find, subscribe to, and use AI agents. No code. No servers. No engineers needed.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
