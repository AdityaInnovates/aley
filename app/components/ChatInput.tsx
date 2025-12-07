"use client";

import { useState } from "react";
import { Send, Loader2, Plus, Mic } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export default function ChatInput({
  onSend,
  disabled = false,
  isLoading = false,
}: ChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled && !isLoading) {
      onSend(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="pt-2 pb-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="h-12 w-12 rounded-full bg-white border border-white shadow-[0_12px_30px_rgba(93,126,208,0.18)] text-slate-500 hover:text-slate-700 transition flex items-center justify-center"
          disabled
          aria-label="Voice"
        >
          <Mic className="h-5 w-5" />
        </button>

        <button
          type="button"
          className="h-12 w-12 rounded-full bg-white border border-white shadow-[0_12px_30px_rgba(93,126,208,0.18)] text-slate-500 hover:text-slate-700 transition flex items-center justify-center"
          disabled
          aria-label="Add"
        >
          <Plus className="h-5 w-5" />
        </button>

        <div className="flex-1">
          <div className="flex items-center gap-3 bg-white/90 backdrop-blur border border-[#e4e8f3] shadow-[0_20px_60px_rgba(96,125,204,0.18)] rounded-full px-4 py-2">
            {/* <span
              style={{ width: "-webkit-fill-available" }}
              className="flex items-center justify-center"
            > */}
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Aley anything..."
              disabled={disabled || isLoading}
              rows={1}
              className="flex-1 justify-center items-center resize-none bg-transparent border-0 focus:outline-none text-sm text-[#1f2a44] placeholder:text-slate-400 disabled:cursor-not-allowed"
              style={{
                minHeight: "44px",
                maxHeight: "140px",
                padding: "16px 0" /* horizontal padding only */,
                resize: "none",
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = `${Math.min(target.scrollHeight, 140)}px`;
              }}
            />
            {/* </span> */}
            <button
              type="submit"
              disabled={!message.trim() || disabled || isLoading}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#4d8bfd] to-[#6cc7ff] text-white shadow-[0_14px_34px_rgba(84,137,255,0.35)] disabled:opacity-60 disabled:cursor-not-allowed transition hover:scale-[1.02]"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
