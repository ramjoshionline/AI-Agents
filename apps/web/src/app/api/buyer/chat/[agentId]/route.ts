import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// POST /api/buyer/chat/[agentId] — subscription-gated streaming chat
export async function POST(
  req: NextRequest,
  { params }: { params: { agentId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "buyer") {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY not configured on the server." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // Verify buyer has an active or trialing subscription to this agent
  const subscription = await prisma.subscription.findFirst({
    where: {
      buyerId: session.user.id,
      agentId: params.agentId,
      status: { in: ["active", "trialing"] },
    },
  });

  if (!subscription) {
    return new Response("No active subscription", { status: 403 });
  }

  const agent = await prisma.agent.findUnique({
    where: { id: params.agentId },
    select: { systemPrompt: true, status: true },
  });

  if (!agent || agent.status !== "live") {
    return new Response("Agent not found", { status: 404 });
  }

  let messages: Anthropic.MessageParam[];
  try {
    const body = await req.json();
    messages = body.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error("messages must be a non-empty array");
    }
  } catch {
    return new Response("Invalid request body", { status: 400 });
  }

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = anthropic.messages.stream({
          model: "claude-opus-4-6",
          max_tokens: 4096,
          system: agent.systemPrompt,
          messages,
        });

        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch (err) {
        const message =
          err instanceof Anthropic.APIError
            ? `Claude API error (${err.status}): ${err.message}`
            : "An unexpected error occurred.";
        controller.enqueue(encoder.encode(`\n\n[CHAT_ERROR]: ${message}`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
