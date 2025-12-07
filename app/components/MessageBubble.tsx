"use client";

import { User, Bot } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  isStreaming?: boolean;
}

export default function MessageBubble({
  role,
  content,
  timestamp,
  isStreaming = false,
}: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"} mb-4`}>
      <div
        className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-[0_10px_26px_rgba(110,150,255,0.35)] ${
          isUser
            ? "bg-[#fce7cf] text-[#d4893b]"
            : "bg-gradient-to-br from-[#6f8bff] to-[#7fd0ff] text-white"
        }`}
      >
        {isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
      </div>

      <div className={`flex flex-col ${isUser ? "items-end" : "items-start"} max-w-[80%]`}>
        <div
          className={`rounded-3xl px-5 py-4 text-[15px] leading-relaxed shadow-[0_18px_46px_rgba(102,132,214,0.18)] ${
            isUser
              ? "bg-white text-[#1f2a44] border border-white"
              : "bg-white/90 text-[#1f2a44] border border-[#e7eaf3]"
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words">{content}</p>
          ) : (
            <div className="prose prose-sm max-w-none prose-pre:bg-[#0f172a] prose-pre:text-gray-100 prose-p:my-0 prose-p:leading-relaxed prose-strong:text-[#1f2a44]">
              <ReactMarkdown>{content}</ReactMarkdown>
              {isStreaming && (
                <span className="inline-flex items-center ml-1">
                  <span className="w-1 h-4 bg-gradient-to-b from-[#6f8bff] via-[#7fd0ff] to-[#c6dcff] animate-pulse rounded-full"></span>
                </span>
              )}
            </div>
          )}
        </div>
        {timestamp && (
          <span className="text-[11px] uppercase tracking-[0.12em] text-slate-400 mt-2 px-1">
            {new Date(timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
      </div>
    </div>
  );
}
