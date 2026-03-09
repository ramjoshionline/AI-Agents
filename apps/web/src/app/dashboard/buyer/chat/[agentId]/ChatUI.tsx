"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";

type Role = "user" | "assistant";

interface Message {
  role: Role;
  content: string;
  streaming?: boolean;
}

export default function ChatUI({
  agentId,
  agentName,
  agentTagline,
  agentVertical,
  hasApiKey,
  userInitial,
}: {
  agentId: string;
  agentName: string;
  agentTagline: string;
  agentVertical: string;
  hasApiKey: boolean;
  userInitial: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text };
    const updatedMessages = [...messages, userMsg];

    setMessages([...updatedMessages, { role: "assistant", content: "", streaming: true }]);
    setInput("");
    setLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const res = await fetch(`/api/buyer/chat/${agentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";
      let hasError = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        if (chunk.includes("[CHAT_ERROR]:")) {
          const errorMsg = chunk.split("[CHAT_ERROR]:")[1].trim();
          setMessages((prev) => {
            const next = [...prev];
            next[next.length - 1] = {
              role: "assistant",
              content: `⚠️ ${errorMsg}`,
              streaming: false,
            };
            return next;
          });
          hasError = true;
          break;
        }

        assistantText += chunk;
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = {
            role: "assistant",
            content: assistantText,
            streaming: true,
          };
          return next;
        });
      }

      if (!hasError) {
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = {
            role: "assistant",
            content: assistantText,
            streaming: false,
          };
          return next;
        });
      }
    } catch (err) {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          role: "assistant",
          content: "⚠️ Connection failed. Please check your network and try again.",
          streaming: false,
        };
        return next;
      });
    } finally {
      setLoading(false);
    }
  }, [agentId, input, loading, messages]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  }

  const isDisabled = loading || !hasApiKey;

  return (
    <div className="flex flex-col h-screen bg-bg">
      {/* Top bar */}
      <div
        className="shrink-0 border-b flex items-center gap-4 px-5 py-3"
        style={{ borderColor: "#1C2D40" }}
      >
        <Link
          href="/dashboard/buyer"
          className="text-dim hover:text-text-main transition-colors text-xs shrink-0"
        >
          ← Dashboard
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full shrink-0 animate-pulse"
              style={{ background: "#2ECC71" }}
            />
            <span className="text-xs font-bold text-white truncate">
              {agentName}
            </span>
            <span
              className="text-xs px-1.5 py-0.5 rounded font-bold shrink-0"
              style={{ background: "rgba(46,204,113,0.12)", color: "#2ECC71" }}
            >
              Live
            </span>
            <span
              className="text-xs px-1.5 py-0.5 rounded shrink-0"
              style={{ background: "rgba(74,101,128,0.15)", color: "#4A6580" }}
            >
              {agentVertical}
            </span>
          </div>
          <p className="text-xs text-dim truncate mt-0.5">{agentTagline}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              disabled={loading}
              className="text-xs text-dim hover:text-red-400 transition-colors border border-border px-3 py-1.5 rounded-lg disabled:opacity-40"
            >
              Clear chat
            </button>
          )}
        </div>
      </div>

      {/* No API key warning */}
      {!hasApiKey && (
        <div
          className="shrink-0 border-b px-5 py-3 text-xs"
          style={{
            background: "rgba(231,76,60,0.08)",
            borderColor: "rgba(231,76,60,0.3)",
            color: "#E74C3C",
          }}
        >
          ⚠️ <strong>ANTHROPIC_API_KEY</strong> is not configured. The platform
          admin needs to add it to the server environment.
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-5"
              style={{ background: "rgba(255,149,0,0.1)", border: "1px solid rgba(255,149,0,0.2)" }}
            >
              🤖
            </div>
            <div className="text-sm font-bold text-white mb-2">
              {agentName} is ready
            </div>
            <p className="text-xs text-dim max-w-xs leading-relaxed mb-6">
              {agentTagline}
            </p>
            <div
              className="rounded-xl border px-5 py-3 text-xs text-dim max-w-sm text-left"
              style={{ borderColor: "#1C2D40", background: "#0C1520" }}
            >
              <div className="text-primary font-bold mb-2">Try asking:</div>
              {[
                "What can you help me with?",
                "Walk me through what you can do",
                "Let's get started",
              ].map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setInput(s);
                    textareaRef.current?.focus();
                  }}
                  disabled={isDisabled}
                  className="block w-full text-left px-3 py-1.5 my-1 rounded-lg border border-border hover:border-primary/30 hover:text-primary transition-colors disabled:opacity-40"
                >
                  &ldquo;{s}&rdquo;
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0 mr-3 mt-0.5"
                  style={{ background: "rgba(255,149,0,0.15)" }}
                >
                  🤖
                </div>
              )}
              <div
                className="max-w-[75%] rounded-2xl px-4 py-3 text-xs leading-relaxed"
                style={
                  msg.role === "user"
                    ? {
                        background: "rgba(59,158,255,0.12)",
                        border: "1px solid rgba(59,158,255,0.25)",
                        color: "#BDD0E0",
                        borderBottomRightRadius: "4px",
                      }
                    : {
                        background: "#111A28",
                        border: "1px solid #1C2D40",
                        color: "#BDD0E0",
                        borderBottomLeftRadius: "4px",
                      }
                }
              >
                <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                {msg.streaming && (
                  <span
                    className="inline-block w-1.5 h-3.5 ml-0.5 animate-pulse"
                    style={{ background: "#FF9500", verticalAlign: "middle" }}
                  />
                )}
              </div>
              {msg.role === "user" && (
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ml-3 mt-0.5"
                  style={{ background: "rgba(59,158,255,0.15)", color: "#3B9EFF" }}
                >
                  {userInitial}
                </div>
              )}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div
        className="shrink-0 border-t px-4 py-4"
        style={{ borderColor: "#1C2D40" }}
      >
        <div
          className="flex items-end gap-3 rounded-xl border px-4 py-3 transition-colors"
          style={{ borderColor: loading ? "rgba(255,149,0,0.4)" : "#1C2D40" }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            disabled={isDisabled}
            placeholder={
              !hasApiKey
                ? "Chat is not available — API key not configured."
                : `Message ${agentName}… (Enter to send, Shift+Enter for newline)`
            }
            rows={1}
            className="flex-1 bg-transparent text-xs text-text-main placeholder-dim outline-none resize-none leading-relaxed disabled:opacity-50"
            style={{ maxHeight: "160px" }}
          />
          <button
            onClick={sendMessage}
            disabled={isDisabled || !input.trim()}
            className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-30"
            style={
              input.trim() && !isDisabled
                ? { background: "#FF9500" }
                : { background: "#1C2D40" }
            }
          >
            {loading ? (
              <div
                className="w-3 h-3 rounded-full border-2 border-transparent animate-spin"
                style={{ borderTopColor: "#FF9500" }}
              />
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke={input.trim() && !isDisabled ? "black" : "#4A6580"}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 12h14M12 5l7 7-7 7"
                />
              </svg>
            )}
          </button>
        </div>
        <p className="text-xs text-dim text-center mt-2">
          Powered by Claude Opus 4.6 · Your conversation is private
        </p>
      </div>
    </div>
  );
}
