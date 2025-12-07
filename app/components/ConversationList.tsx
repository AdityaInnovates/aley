"use client";

import {
  Book,
  BookDashed,
  Clock3,
  LogOut,
  MessageCircle,
  MoreVertical,
  Plus,
  Settings,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Conversation {
  id: string;
  title: string;
  lastMessageAt: string;
  preview?: {
    content: string;
    role: string;
  } | null;
}

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation?: (id: string) => void;
  onNewConversation: () => void;
  isLoading?: boolean;
  userName?: string;
  onSignOut?: () => void;
}

export default function ConversationList({
  conversations,
  activeConversationId,
  onSelectConversation,
  onDeleteConversation,
  onNewConversation,
  isLoading = false,
  userName = "Alex M.",
  onSignOut,
}: ConversationListProps) {
  var router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this conversation?")) {
      setDeletingId(id);
      await onDeleteConversation?.(id);
      setDeletingId(null);
      setMenuOpenId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInHours < 48) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
      });
    }
  };

  const initials = userName ? userName.charAt(0).toUpperCase() : "A";

  return (
    <div className="h-full w-full flex flex-col bg-gradient-to-b from-white/95 via-[#f6f8ff]/85 to-white/80 border-r border-white shadow-[0_22px_60px_rgba(99,127,201,0.2)] backdrop-blur-2xl rounded-r-[32px] overflow-hidden">
      <div className="flex items-center gap-3 px-6 pt-7 pb-6 border-b border-white/70">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6f8bff] to-[#7fd0ff] text-white shadow-[0_10px_30px_rgba(110,150,255,0.35)]">
          <MessageCircle className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-semibold text-[#1d2942]">Aley</span>
          <span className="text-sm text-slate-500">Pro Assistant</span>
        </div>
      </div>

      <div className="px-6 pt-5">
        <button
          onClick={onNewConversation}
          className="w-full bg-gradient-to-r from-[#4d8bfd] to-[#71b6ff] text-white h-12 rounded-2xl hover:opacity-95 transition shadow-[0_16px_40px_rgba(84,137,255,0.35)] flex items-center justify-center gap-2 font-semibold"
        >
          <Plus className="h-5 w-5" />
          New Chat
        </button>
      </div>

      <div className="px-6 pt-6 pb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
        Recent
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {isLoading ? (
          <div className="p-4 text-center text-slate-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6f8bff] mx-auto"></div>
            <p className="mt-2 text-sm">Loading...</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center text-slate-500">
            <MessageCircle className="h-12 w-12 mx-auto mb-2 text-slate-400" />
            <p className="text-sm">No conversations yet</p>
            <p className="text-xs mt-1">Start a new chat to begin</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => {
              const isActive = activeConversationId === conv.id;
              return (
                <div
                  key={conv.id}
                  onClick={() => onSelectConversation(conv.id)}
                  className={`group relative cursor-pointer rounded-2xl border border-transparent px-4 py-3 transition shadow-none hover:shadow-[0_16px_40px_rgba(121,152,219,0.18)] ${
                    isActive
                      ? "bg-white border-[#dfe7ff] shadow-[0_18px_46px_rgba(95,136,214,0.25)]"
                      : "bg-white/70 border-white hover:bg-white"
                  } ${
                    deletingId === conv.id
                      ? "opacity-50 pointer-events-none"
                      : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#edf1ff] to-[#f8fbff] text-[#6f8bff]">
                        <Clock3 className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-[#1f2a44] truncate">
                          {conv.title}
                        </h3>
                        {conv.preview && (
                          <p className="text-sm text-slate-500 truncate">
                            {conv.preview.role === "user" ? "You: " : "AI: "}
                            {conv.preview.content}
                          </p>
                        )}
                        <p className="text-xs text-slate-400 mt-1">
                          {formatDate(conv.lastMessageAt)}
                        </p>
                      </div>
                    </div>

                    {onDeleteConversation && (
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenId(
                              menuOpenId === conv.id ? null : conv.id
                            );
                          }}
                          className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {menuOpenId === conv.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMenuOpenId(null);
                              }}
                            />
                            <div className="absolute right-0 mt-2 w-32 bg-white rounded-xl shadow-lg border border-slate-100 z-20">
                              <button
                                onClick={(e) => handleDelete(e, conv.id)}
                                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-2"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="px-6 pb-5 space-y-3">
        <button
          onClick={() => {
            router.push("/library");
          }}
          className="flex w-full items-center gap-3 text-slate-500 hover:text-slate-700 transition"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white border border-slate-100 shadow-sm">
            <Book className="h-5 w-5" />
          </div>
          <span className="text-sm font-semibold">Library</span>
        </button>
        <button
          onClick={() => {
            router.push("/settings");
          }}
          className="flex w-full items-center gap-3 text-slate-500 hover:text-slate-700 transition"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white border border-slate-100 shadow-sm">
            <Settings className="h-5 w-5" />
          </div>
          <span className="text-sm font-semibold">Settings</span>
        </button>

        <div className="flex items-center justify-between rounded-2xl bg-white/90 border border-white shadow-[0_14px_30px_rgba(109,132,205,0.18)] px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fdebd3] text-[#d8893b] font-semibold">
              {initials}
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1f2a44]">{userName}</p>
              <p className="text-xs text-slate-500">Free Plan</p>
            </div>
          </div>

          <button
            onClick={() => onSignOut?.()}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-slate-100 text-slate-500 hover:text-slate-700 transition shadow-sm"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
