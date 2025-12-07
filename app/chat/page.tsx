"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bell, ChevronDown, Dot, Sparkles } from "lucide-react";
import { useAuth } from "../components/AuthProvider";
import MessageBubble from "../components/MessageBubble";
import ChatInput from "../components/ChatInput";
import ConversationList from "../components/ConversationList";
import TypingIndicator from "../components/TypingIndicator";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  isStreaming?: boolean;
}

interface Conversation {
  id: string;
  title: string;
  lastMessageAt: string;
  preview?: {
    content: string;
    role: string;
  } | null;
}

export default function ChatPage() {
  const {
    user,
    token,
    logout,
    isAuthenticated,
    isLoading: authLoading,
  } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [sidebarOpen] = useState(true);
  const [isAiTyping, setIsAiTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, authLoading, router]);

  // Load conversations on mount
  useEffect(() => {
    if (isAuthenticated && token) {
      loadConversations();
    }
  }, [isAuthenticated, token]);

  // Check if conversationId is in URL
  useEffect(() => {
    const convId = searchParams.get("id");
    if (convId && isAuthenticated) {
      setActiveConversationId(convId);
      loadMessages(convId);
    }
  }, [searchParams, isAuthenticated]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConversations = async () => {
    try {
      setIsLoadingConversations(true);
      const response = await fetch("/api/chat/conversations", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations);
      } else {
        console.error("Failed to load conversations");
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      setIsLoadingMessages(true);
      setError("");
      const response = await fetch(
        `/api/chat/history?conversationId=${conversationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages.reverse()); // Reverse to show oldest first
      } else {
        setError("Failed to load messages");
      }
    } catch (error) {
      console.error("Error loading messages:", error);
      setError("Failed to load messages");
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSendMessage = async (message: string) => {
    try {
      setIsSending(true);
      setIsAiTyping(false);
      setError("");

      // Create a temporary ID for the streaming message
      const tempAiMessageId = `temp-${Date.now()}`;

      const response = await fetch("/api/chat/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message,
          conversationId: activeConversationId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "Failed to send message");
        setIsSending(false);
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        setError("Failed to initialize stream");
        setIsSending(false);
        return;
      }

      let userMessageAdded = false;
      let streamingMessageAdded = false;
      let streamedContent = "";
      let newConversationId: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "userMessage") {
                // Add user message to the list
                setMessages((prev) => [
                  ...prev,
                  {
                    id: data.data.id,
                    role: data.data.role,
                    content: data.data.content,
                    createdAt: data.data.createdAt,
                  },
                ]);
                userMessageAdded = true;
                // Show typing indicator after user message
                setIsAiTyping(true);
              } else if (data.type === "conversationId") {
                newConversationId = data.data;
              } else if (data.type === "stream") {
                streamedContent += data.data;

                if (!streamingMessageAdded) {
                  // Hide typing indicator and add streaming message
                  setIsAiTyping(false);
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: tempAiMessageId,
                      role: "assistant",
                      content: streamedContent,
                      createdAt: new Date().toISOString(),
                      isStreaming: true,
                    },
                  ]);
                  streamingMessageAdded = true;
                } else {
                  // Update streaming message content
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === tempAiMessageId
                        ? { ...msg, content: streamedContent }
                        : msg
                    )
                  );
                }
              } else if (data.type === "complete") {
                // Replace temp message with final message
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === tempAiMessageId
                      ? {
                          id: data.data.id,
                          role: data.data.role,
                          content: data.data.content,
                          createdAt: data.data.createdAt,
                          isStreaming: false,
                        }
                      : msg
                  )
                );

                // If this was a new conversation, update the active conversation
                if (!activeConversationId && newConversationId) {
                  setActiveConversationId(newConversationId);
                  router.push(`/chat?id=${newConversationId}`);
                  loadConversations();
                } else {
                  // Update conversation list to reflect new message
                  loadConversations();
                }
              } else if (data.type === "error") {
                setError(data.data);
              }
            } catch (e) {
              console.error("Error parsing stream data:", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Failed to send message");
    } finally {
      setIsSending(false);
      setIsAiTyping(false);
    }
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    router.push(`/chat?id=${id}`);
    loadMessages(id);
  };

  const handleNewConversation = () => {
    setActiveConversationId(null);
    setMessages([]);
    router.push("/chat");
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      const response = await fetch(`/api/chat/conversations?id=${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Remove from list
        setConversations((prev) => prev.filter((c) => c.id !== id));

        // If deleted conversation was active, reset
        if (activeConversationId === id) {
          handleNewConversation();
        }
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
    }
  };

  const handleSignOut = () => {
    logout();
    router.push("/");
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen overflow-hidden bg-gradient-to-br from-[#edf1fb] via-[#f7f8fc] to-[#eef4ff]">
      <div className="pointer-events-none absolute -left-20 top-24 h-64 w-64 rounded-full bg-[#dce6ff] blur-3xl opacity-70" />
      <div className="pointer-events-none absolute -right-16 top-12 h-72 w-72 rounded-full bg-[#cde7ff] blur-3xl opacity-60" />
      <div className="pointer-events-none absolute right-8 bottom-4 h-64 w-64 rounded-full bg-[#e9dcff] blur-3xl opacity-50" />

      <div className="relative z-10 flex h-full">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? "flex" : "hidden"
          } lg:flex w-[320px] shrink-0`}
        >
          <ConversationList
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={handleSelectConversation}
            onDeleteConversation={handleDeleteConversation}
            onNewConversation={handleNewConversation}
            isLoading={isLoadingConversations}
            userName={user?.name || "Alex M."}
            onSignOut={handleSignOut}
          />
        </aside>

        {/* Chat Area */}
        <main className="flex-1 flex flex-col px-4 sm:px-8 md:px-10 lg:px-16 py-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3 bg-white/80 backdrop-blur rounded-full px-4 py-2 shadow-[0_10px_30px_rgba(79,114,205,0.18)] border border-white">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#6f8bff] to-[#86c6ff] text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-1 text-sm font-semibold text-[#1e2b45]">
                Aley
                <Dot className="h-4 w-4 text-sky-400" />
                Creative Mode
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </div>

            <button className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 border border-white shadow-[0_8px_30px_rgba(71,112,203,0.15)] text-slate-500 hover:text-slate-700 transition">
              <Bell className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pb-6">
            {isLoadingMessages ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6f8bff] mx-auto"></div>
                  <p className="mt-4 text-slate-500">Loading messages...</p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-xl bg-white/70 backdrop-blur rounded-3xl p-10 shadow-[0_18px_50px_rgba(104,138,220,0.18)] border border-white">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6f8aff] to-[#7fd0ff] text-white shadow-lg">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <h2 className="text-2xl font-semibold text-[#1f2a44] mb-2">
                    Start a conversation
                  </h2>
                  <p className="text-slate-500">
                    Ask Aley anything and she will craft thoughtful responses to keep you moving forward.
                  </p>
                </div>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto flex flex-col gap-4">
                <div className="mx-auto text-[11px] uppercase tracking-[0.12em] text-slate-400 bg-white/70 backdrop-blur px-3 py-1 rounded-full shadow-sm border border-white">
                  Today,{" "}
                  {new Date(
                    messages[0]?.createdAt || new Date().toISOString()
                  ).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                {messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    role={msg.role}
                    content={msg.content}
                    timestamp={msg.createdAt}
                    isStreaming={msg.isStreaming}
                  />
                ))}
                {isAiTyping && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>
            )}

            {error && (
              <div className="max-w-4xl mx-auto mt-4">
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                  {error}
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="max-w-4xl mx-auto w-full">
            <ChatInput
              onSend={handleSendMessage}
              disabled={isLoadingMessages}
              isLoading={isSending}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
