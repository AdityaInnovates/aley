"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  CalendarClock,
  ChevronDown,
  Code2,
  Filter,
  Loader2,
  MessageCircle,
  Mic,
  Palette,
  Search,
  Sparkles,
  Utensils,
} from "lucide-react";
import { useAuth } from "../components/AuthProvider";

type SortOption = "newest" | "oldest" | "relevance";

type LibraryConversation = {
  id: string;
  title: string;
  messageCount: number;
  lastMessageAt: string;
  createdAt: string;
  lastMessage?: {
    content: string;
    role: string;
    createdAt: string;
  } | null;
};

type PaginationInfo = {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasMore: boolean;
};

const FILTER_PRESETS = [
  { key: "all", label: "All Chats", query: "" },
  { key: "drafting", label: "Drafting", query: "draft" },
  { key: "coding", label: "Coding", query: "code dev" },
  { key: "brainstorming", label: "Brainstorming", query: "idea brainstorm" },
  { key: "archived", label: "Archived", query: "archived" },
];

const ICON_PALETTE = [
  { bg: "from-[#e9eeff] to-white", icon: Code2 },
  { bg: "from-[#f8eaff] to-white", icon: Palette },
  { bg: "from-[#e6fff5] to-white", icon: BookOpen },
  { bg: "from-[#fff2e0] to-white", icon: Utensils },
  { bg: "from-[#e5f5ff] to-white", icon: MessageCircle },
];

const formatRelative = (value: string) => {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const buildSearchScore = (conversation: LibraryConversation, query: string) => {
  const haystack = `${conversation.title} ${conversation.lastMessage?.content || ""}`.toLowerCase();
  const tokens = query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  if (!tokens.length) return 0;

  return tokens.reduce((score, token) => {
    return haystack.includes(token) ? score + 1 : score;
  }, 0);
};

export default function LibraryPage() {
  const router = useRouter();
  const {
    user,
    token,
    isAuthenticated,
    isLoading: authLoading,
    logout,
  } = useAuth();

  const [conversations, setConversations] = useState<LibraryConversation[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasMore: false,
  });
  const [searchInput, setSearchInput] = useState("");
  const [activeFilter, setActiveFilter] = useState(FILTER_PRESETS[0].key);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const presetQuery = useMemo(
    () => FILTER_PRESETS.find((preset) => preset.key === activeFilter)?.query || "",
    [activeFilter]
  );

  const composedSearch = useMemo(() => {
    const pieces = [searchInput.trim(), presetQuery.trim()].filter(Boolean);
    return pieces.join(" ").trim();
  }, [presetQuery, searchInput]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  const fetchConversations = useCallback(
    async (page = 1, append = false) => {
      if (!token) return;
      setError("");
      if (append) {
        setLoadingMore(true);
      } else {
      setLoading(true);
    }

    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "8");

      if (composedSearch) {
        params.set("search", composedSearch);
      }

      const sortParam = sortBy === "oldest" ? "oldest" : "newest";
      params.set("sortBy", sortParam);

      const response = await fetch(`/api/chat/history?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to load conversations");
      }

      const nextPage = data.pagination as PaginationInfo;
      const incoming: LibraryConversation[] = data.conversations || [];

      const sorted =
        sortBy === "relevance" && composedSearch
          ? [...incoming].sort(
              (a, b) => buildSearchScore(b, composedSearch) - buildSearchScore(a, composedSearch)
            )
          : incoming;

      setConversations((prev) =>
        append ? [...prev, ...sorted.filter((item) => !prev.find((p) => p.id === item.id))] : sorted
      );
      setPagination(nextPage);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unable to load conversations");
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
    },
    [composedSearch, sortBy, token]
  );

  useEffect(() => {
    if (!token || !isAuthenticated) return;

    const debounce = setTimeout(() => {
      fetchConversations(1, false);
    }, 320);

    return () => clearTimeout(debounce);
  }, [composedSearch, fetchConversations, isAuthenticated, sortBy, token]);

  const handleLoadMore = () => {
    if (!pagination.hasMore) return;
    fetchConversations(pagination.currentPage + 1, true);
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setActiveFilter("all");
    setSortBy("newest");
  };

  const hasActiveFilters =
    activeFilter !== "all" || Boolean(searchInput.trim()) || sortBy !== "newest";

  const renderIcon = (title: string, index: number) => {
    const lowered = title.toLowerCase();
    const themedIndex = lowered.includes("code")
      ? 0
      : lowered.includes("design") || lowered.includes("color")
        ? 1
        : lowered.includes("note") || lowered.includes("draft")
          ? 2
          : lowered.includes("meal") || lowered.includes("recipe")
            ? 3
            : index;
    const visual = ICON_PALETTE[themedIndex % ICON_PALETTE.length];
    const Icon = visual.icon;
    return (
      <div
        className={`h-11 w-11 rounded-xl bg-gradient-to-br ${visual.bg} flex items-center justify-center text-[#5c6fd7]`}
      >
        <Icon className="h-5 w-5" />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#eef1ff] via-white to-[#e7f3ff] py-12 px-4 md:px-8 flex justify-center">
      <div className="w-full max-w-5xl">
        <header className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm uppercase tracking-[0.15em] text-slate-400">Library</p>
            <h1 className="text-3xl font-semibold text-[#1f2b4d] mt-2">All conversations</h1>
          </div>
          <button
            onClick={() => router.push("/settings")}
            className="h-11 w-11 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500 hover:text-slate-700"
            aria-label="Profile"
          >
            {user?.name ? (
              <span className="font-semibold text-sm">
                {user.name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
            ) : (
              <Sparkles className="h-5 w-5" />
            )}
          </button>
        </header>

        <div className="rounded-[32px] bg-gradient-to-br from-white/95 via-[#f6f9ff]/90 to-white shadow-[0_30px_80px_rgba(116,139,197,0.22)] border border-white/80 p-6 md:p-8">
          <div className="flex flex-col gap-4 md:gap-5">
            <div className="flex flex-col md:flex-row gap-3 md:items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full h-12 rounded-2xl pl-11 pr-12 bg-white/80 border border-slate-100 shadow-inner focus:outline-none focus:ring-2 focus:ring-[#7ca9ff]/50 text-[#1f2b4d]"
                />
                <Mic className="absolute right-4 top-3.5 h-5 w-5 text-slate-400" />
              </div>
              <button
                onClick={handleClearFilters}
                className="h-12 px-4 rounded-2xl bg-white border border-slate-100 text-sm font-semibold text-slate-500 hover:text-slate-700 flex items-center gap-2 self-start md:self-auto"
              >
                <Filter className="h-4 w-4" />
                Clear
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {FILTER_PRESETS.map((preset) => {
                const isActive = activeFilter === preset.key;
                return (
                  <button
                    key={preset.key}
                    onClick={() => setActiveFilter(preset.key)}
                    className={`px-4 h-10 rounded-full border text-sm font-semibold transition ${
                      isActive
                        ? "bg-gradient-to-r from-[#5f8bff] to-[#7bc8ff] text-white border-transparent shadow-[0_14px_30px_rgba(90,140,255,0.28)]"
                        : "bg-white/80 border-slate-200 text-slate-600 hover:text-slate-800"
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-4">
            <div className="flex items-center justify-between text-sm text-slate-500">
              <div className="flex items-center gap-2 font-semibold text-[#1f2b4d]">
                <BookOpen className="h-4 w-4 text-[#5f8bff]" />
                <span>Results</span>
                {!loading && (
                  <span className="text-slate-400">
                    • {pagination.totalCount} conversation
                    {pagination.totalCount === 1 ? "" : "s"} found
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {(["newest", "oldest", "relevance"] as SortOption[]).map((option) => {
                  const isActive = sortBy === option;
                  return (
                    <button
                      key={option}
                      onClick={() => setSortBy(option)}
                      className={`px-3 h-9 rounded-full text-xs font-semibold capitalize transition ${
                        isActive
                          ? "bg-white text-[#1f2b4d] shadow-[0_10px_20px_rgba(118,143,207,0.15)] border border-slate-100"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              {loading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-8 w-8 text-[#6b8dff] animate-spin" />
                </div>
              ) : error ? (
                <div className="rounded-2xl border border-red-100 bg-red-50 text-red-700 p-4 text-sm flex items-center justify-between">
                  <span>{error}</span>
                  <button
                    onClick={() => fetchConversations(1, false)}
                    className="text-red-600 underline font-semibold"
                  >
                    Retry
                  </button>
                </div>
              ) : conversations.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-white/70 p-10 text-center text-slate-500">
                  <Sparkles className="h-7 w-7 mx-auto mb-2 text-[#6b8dff]" />
                  <p className="font-semibold text-[#1f2b4d]">No conversations yet</p>
                  <p className="text-sm mt-1">Start chatting to see them appear here.</p>
                  <button
                    onClick={() => router.push("/chat")}
                    className="mt-4 inline-flex items-center gap-2 px-4 h-10 rounded-full bg-gradient-to-r from-[#5f8bff] to-[#7bc8ff] text-white font-semibold shadow-[0_14px_30px_rgba(90,140,255,0.28)]"
                  >
                    Open chat
                  </button>
                </div>
              ) : (
                conversations.map((conversation, index) => (
                  <button
                    key={conversation.id}
                    onClick={() => router.push(`/chat?id=${conversation.id}`)}
                    className="w-full text-left rounded-3xl bg-white/90 border border-white px-4 py-3 md:px-5 md:py-4 shadow-[0_20px_48px_rgba(116,139,197,0.16)] hover:shadow-[0_26px_60px_rgba(116,139,197,0.22)] hover:-translate-y-0.5 transition"
                  >
                    <div className="flex items-start gap-3 md:gap-4">
                      {renderIcon(conversation.title, index)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 justify-between">
                          <h3 className="text-base md:text-lg font-semibold text-[#1f2b4d] truncate">
                            {conversation.title}
                          </h3>
                          <span className="text-xs text-slate-400 whitespace-nowrap">
                            {formatRelative(conversation.lastMessageAt || conversation.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 line-clamp-1">
                          {conversation.lastMessage?.content ||
                            "Start a message to continue this conversation."}
                        </p>
                        <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <MessageCircle className="h-3.5 w-3.5" />
                            <span>{conversation.messageCount || 0} messages</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <CalendarClock className="h-3.5 w-3.5" />
                            <span>
                              Updated {formatRelative(conversation.lastMessageAt || conversation.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            {pagination.hasMore && !loading && (
              <div className="pt-4 flex justify-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-2 px-4 h-11 rounded-full bg-white border border-slate-200 text-sm font-semibold text-slate-600 hover:text-slate-800 shadow-sm disabled:opacity-60"
                >
                  <span>Load older conversations</span>
                  {loadingMore ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              </div>
            )}

            <div className="text-sm text-slate-400 flex justify-between items-center pt-4">
              <span>{pagination.totalCount} conversation{pagination.totalCount === 1 ? "" : "s"} found</span>
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="text-[#5f8bff] font-semibold hover:underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span>Signed in as {user?.name || "guest"}</span>
          </div>
          <button onClick={logout} className="font-semibold text-slate-500 hover:text-slate-800">
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}
