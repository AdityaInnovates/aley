"use client";

import { Bot } from "lucide-react";

export default function TypingIndicator() {
  return (
    <div className="flex gap-3 mb-4">
      <div className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-[#6f8bff] to-[#7fd0ff] text-white shadow-[0_10px_26px_rgba(110,150,255,0.35)]">
        <Bot className="h-5 w-5" />
      </div>

      <div className="flex flex-col items-start max-w-[70%]">
        <div className="rounded-2xl px-4 py-3 bg-white/90 border border-[#e7eaf3] shadow-[0_18px_46px_rgba(102,132,214,0.18)]">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-slate-300 animate-bounce" />
            <span className="h-2 w-2 rounded-full bg-slate-300 animate-bounce [animation-delay:120ms]" />
            <span className="h-2 w-2 rounded-full bg-slate-300 animate-bounce [animation-delay:240ms]" />
          </div>
        </div>
      </div>
    </div>
  );
}
