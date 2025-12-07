"use client";

import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Camera,
  CheckCircle2,
  CreditCard,
  Loader2,
  LogOut,
  MessageSquare,
  MoonStar,
  Shield,
  Sparkles,
  User,
} from "lucide-react";
import { useAuth } from "../components/AuthProvider";

type UserProfile = {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  preferences?: {
    darkMode: boolean;
    notifications: boolean;
  };
  plan?: string;
  status?: string;
  memberSince?: string;
};

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string;
  bio: string;
  preferences: {
    darkMode: boolean;
    notifications: boolean;
  };
};

const NAV_ITEMS = [
  { key: "personal", label: "Personal Info", icon: User },
  { key: "subscription", label: "Subscription", icon: CreditCard },
  { key: "chat", label: "Chat Preferences", icon: MessageSquare },
  { key: "security", label: "Security", icon: Shield },
];

const formatDate = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
  });
};

export default function SettingsPage() {
  const router = useRouter();
  const { token, isAuthenticated, isLoading, logout, login } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState<FormState>({
    firstName: "",
    lastName: "",
    email: "",
    avatarUrl: "",
    bio: "",
    preferences: {
      darkMode: false,
      notifications: true,
    },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeNav, setActiveNav] = useState("personal");

  const displayName =
    `${form.firstName || ""} ${form.lastName || ""}`.trim() ||
    profile?.name ||
    "User";

  const isDirty = useMemo(() => {
    if (!profile) return false;
    return (
      form.firstName !== (profile.firstName || "") ||
      form.lastName !== (profile.lastName || "") ||
      form.email !== profile.email ||
      form.avatarUrl !== (profile.avatarUrl || "") ||
      form.bio !== (profile.bio || "") ||
      form.preferences.darkMode !== (profile.preferences?.darkMode ?? false) ||
      form.preferences.notifications !==
        (profile.preferences?.notifications ?? true)
    );
  }, [form, profile]);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    fetchProfile();
  }, [isAuthenticated, isLoading, router, token]);

  const fetchProfile = async () => {
    if (!token) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/user/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to load profile");
      }

      const data = await response.json();
      const userData: UserProfile = data.user;

      setProfile(userData);
      setForm({
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        email: userData.email,
        avatarUrl: userData.avatarUrl || "",
        bio: userData.bio || "",
        preferences: {
          darkMode: userData.preferences?.darkMode ?? false,
          notifications: userData.preferences?.notifications ?? true,
        },
      });
    } catch (err: any) {
      setError(err.message || "Unable to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          preferences: form.preferences,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      const updated: UserProfile = data.user;
      setProfile(updated);
      setForm({
        firstName: updated.firstName || "",
        lastName: updated.lastName || "",
        email: updated.email,
        avatarUrl: updated.avatarUrl || "",
        bio: updated.bio || "",
        preferences: {
          darkMode: updated.preferences?.darkMode ?? false,
          notifications: updated.preferences?.notifications ?? true,
        },
      });

      // Keep auth context in sync for other pages
      login(token, {
        id: updated.id,
        name: updated.name,
        email: updated.email,
      });

      setSuccess("Profile updated");
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("Please use an image under 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((prev) => ({
        ...prev,
        avatarUrl: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    if (!profile) return;
    setForm({
      firstName: profile.firstName || "",
      lastName: profile.lastName || "",
      email: profile.email,
      avatarUrl: profile.avatarUrl || "",
      bio: profile.bio || "",
      preferences: {
        darkMode: profile.preferences?.darkMode ?? false,
        notifications: profile.preferences?.notifications ?? true,
      },
    });
    setError("");
    setSuccess("");
  };

  const handleNavClick = (key: string) => {
    setActiveNav(key);
    setError("");
    setSuccess("");
  };

  const isDark = form.preferences.darkMode;
  const inputClasses = `mt-2 w-full rounded-xl border px-4 py-3 shadow-sm outline-none transition focus:ring-2 focus:ring-blue-100 ${
    isDark
      ? "border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-400 focus:border-blue-400"
      : "border-gray-200 bg-white text-gray-900 focus:border-blue-500"
  }`;
  const cardClasses = `rounded-2xl border ${
    isDark ? "border-slate-700 bg-slate-900/70" : "border-gray-100 bg-white"
  } shadow-sm`;
  const softText = isDark ? "text-slate-300" : "text-gray-600";
  const strongText = isDark ? "text-slate-100" : "text-gray-900";

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading your settings...
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen p-4 md:p-6 transition-colors ${
        isDark
          ? "bg-slate-950 text-slate-50"
          : "bg-linear-to-br from-blue-50 via-white to-purple-50 text-gray-900"
      }`}
    >
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-3">
        <aside
          className={`col-span-1 h-full rounded-3xl p-6 shadow-xl backdrop-blur-sm ${
            isDark ? "bg-slate-900/70" : "bg-white/70"
          }`}
        >
          <div className="mb-6">
            <h2 className={`text-xl font-bold ${strongText}`}>Settings</h2>
            <p className={`text-sm ${softText}`}>
              Manage your personal preferences
            </p>
          </div>

          <div className="space-y-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => handleNavClick(item.key)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-all ${
                    isActive
                      ? isDark
                        ? "bg-slate-800 text-blue-300 shadow-sm"
                        : "bg-blue-50 text-blue-700 shadow-sm"
                      : isDark
                        ? "text-slate-200 hover:bg-slate-800"
                        : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-6 border-t border-gray-100 pt-6 space-y-3">
            <button
              onClick={() => router.push("/chat")}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition ${
                isDark
                  ? "text-slate-200 hover:bg-slate-800"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Sparkles className="h-5 w-5" />
              <span className="font-medium">Back to Chat</span>
            </button>
            <button
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-red-500 hover:bg-red-50 transition"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Log Out</span>
            </button>
          </div>

          <div
            className={`mt-8 rounded-2xl p-4 text-white shadow-lg ${
              isDark
                ? "bg-linear-to-br from-indigo-600 to-blue-600"
                : "bg-linear-to-br from-blue-600 to-indigo-500"
            }`}
          >
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
              <Sparkles className="h-4 w-4" />
              Pro Plan
            </div>
            <p className="mt-2 text-sm text-blue-50">
              Upgrade to unlock GPT-4 access and advanced memory.
            </p>
            <button className="mt-4 w-full rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/25">
              Upgrade Now
            </button>
          </div>
        </aside>

        <main
          className={`col-span-2 rounded-3xl p-6 shadow-xl backdrop-blur-sm md:p-8 ${
            isDark ? "bg-slate-900/70" : "bg-white/90"
          }`}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 overflow-hidden rounded-full bg-linear-to-br from-blue-100 to-purple-100 shadow-inner">
                {form.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.avatarUrl}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div
                    className={`flex h-full w-full items-center justify-center text-2xl font-semibold ${
                      isDark ? "text-blue-200" : "text-blue-600"
                    }`}
                  >
                    {displayName.slice(0, 1)}
                  </div>
                )}
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-1 right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition hover:bg-blue-700"
                >
                  <Camera className="h-4 w-4" />
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
              <div>
                <div className={`text-2xl font-semibold ${strongText}`}>
                  {displayName}
                </div>
                <div className={`text-sm ${softText}`}>
                  {profile?.plan || "Free"} Plan Member
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                    <CheckCircle2 className="h-4 w-4" />
                    {(profile?.status || "Active").toUpperCase()}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                    <Sparkles className="h-4 w-4 text-blue-500" />
                    Member since {formatDate(profile?.memberSince)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {activeNav === "personal" && (
            <form className="mt-8 space-y-6" onSubmit={handleSave}>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label
                    className={`text-sm font-semibold ${
                      isDark ? "text-slate-200" : "text-gray-700"
                    }`}
                  >
                    First Name
                  </label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        firstName: e.target.value,
                      }))
                    }
                    className={inputClasses}
                    placeholder="Alex"
                  />
                </div>
                <div>
                  <label
                    className={`text-sm font-semibold ${
                      isDark ? "text-slate-200" : "text-gray-700"
                    }`}
                  >
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        lastName: e.target.value,
                      }))
                    }
                    className={inputClasses}
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label
                  className={`text-sm font-semibold ${
                    isDark ? "text-slate-200" : "text-gray-700"
                  }`}
                >
                  Email Address
                </label>
                <div
                  className={`mt-2 flex items-center gap-3 rounded-xl border px-4 py-3 shadow-sm ${
                    isDark
                      ? "border-slate-700 bg-slate-900"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full ${
                      isDark ? "bg-slate-800" : "bg-gray-100"
                    }`}
                  >
                    <Bell className="h-4 w-4 text-blue-600" />
                  </div>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                    className={`w-full outline-none ${
                      isDark ? "bg-transparent text-slate-100" : "text-gray-900"
                    }`}
                    placeholder="alex.doe@example.com"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label
                    className={`text-sm font-semibold ${
                      isDark ? "text-slate-200" : "text-gray-700"
                    }`}
                  >
                    Context Bio
                  </label>
                  <span className={`text-xs ${softText}`}>
                    Tells Aley about you for better answers
                  </span>
                </div>
                <textarea
                  value={form.bio}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, bio: e.target.value }))
                  }
                  rows={4}
                  className={`mt-2 w-full rounded-2xl border px-4 py-3 shadow-inner outline-none transition focus:ring-2 focus:ring-blue-100 ${
                    isDark
                      ? "border-slate-700 bg-slate-900 text-slate-100 focus:border-blue-400"
                      : "border-gray-200 bg-gray-50 text-gray-900 focus:border-blue-500"
                  }`}
                  placeholder="I'm a software engineer interested in AI and design. I prefer concise answers and technical details."
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <SettingToggle
                  title="Dark Mode"
                  description="Adjust appearance for low light"
                  icon={<MoonStar className="h-5 w-5 text-indigo-500" />}
                  enabled={form.preferences.darkMode}
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      preferences: { ...prev.preferences, darkMode: value },
                    }))
                  }
                  isDark={isDark}
                />
                <SettingToggle
                  title="Notifications"
                  description="Get updates on new features"
                  icon={<Bell className="h-5 w-5 text-cyan-500" />}
                  enabled={form.preferences.notifications}
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      preferences: { ...prev.preferences, notifications: value },
                    }))
                  }
                  isDark={isDark}
                />
              </div>

              {(error || success) && (
                <div
                  className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${
                    error
                      ? "border-red-200 bg-red-50 text-red-700"
                      : "border-green-200 bg-green-50 text-green-700"
                  }`}
                >
                  {error ? (
                    <Shield className="h-4 w-4" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  <span>{error || success}</span>
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={resetForm}
                  className={`w-full rounded-xl px-5 py-3 text-center font-semibold transition sm:w-auto ${
                    isDark
                      ? "bg-slate-800 text-slate-100 hover:bg-slate-700"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isDirty || saving}
                  className={`w-full rounded-xl px-6 py-3 text-center font-semibold text-white shadow-lg transition sm:w-auto ${
                    !isDirty || saving
                      ? "bg-gray-300 text-gray-600"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          )}

          {activeNav === "subscription" && (
            <section className={`mt-8 ${cardClasses} p-5`}>
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="font-semibold">Subscription</div>
                  <p className={`text-sm ${softText}`}>
                    Manage your current plan and billing preferences.
                  </p>
                </div>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div
                  className={`rounded-xl border ${
                    isDark
                      ? "border-slate-700 bg-slate-900/60"
                      : "border-gray-200 bg-gray-50"
                  } p-4`}
                >
                  <div className="text-sm font-semibold text-blue-600">
                    Current Plan
                  </div>
                  <div className="mt-1 text-lg font-bold">
                    {profile?.plan || "Free"}
                  </div>
                  <p className={`text-sm ${softText} mt-1`}>
                    Unlimited chat on the free tier. Upgrade for GPT-4 access.
                  </p>
                </div>
                <div
                  className={`rounded-xl border ${
                    isDark
                      ? "border-slate-700 bg-slate-900/60"
                      : "border-gray-200 bg-gray-50"
                  } p-4`}
                >
                  <div className="text-sm font-semibold text-green-600">
                    Status
                  </div>
                  <div className="mt-1 text-lg font-bold capitalize">
                    {profile?.status || "active"}
                  </div>
                  <p className={`text-sm ${softText} mt-1`}>
                    Billing is handled securely. Contact support to change plan.
                  </p>
                </div>
              </div>
            </section>
          )}

          {activeNav === "chat" && (
            <section className={`mt-8 ${cardClasses} p-5`}>
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-purple-500" />
                <div>
                  <div className="font-semibold">Chat Preferences</div>
                  <p className={`text-sm ${softText}`}>
                    Responses are tailored using your context bio and
                    notification choices.
                  </p>
                </div>
              </div>
              <div
                className={`mt-4 rounded-xl border p-4 ${
                  isDark
                    ? "border-slate-700 bg-slate-900/60"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="text-sm font-semibold">Context Bio</div>
                <p className={`text-sm ${softText} mt-1`}>
                  We use your bio to deliver more relevant answers. Update it in
                  Personal Info.
                </p>
              </div>
            </section>
          )}

          {activeNav === "security" && (
            <section className={`mt-8 ${cardClasses} p-5`}>
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-red-500" />
                <div>
                  <div className="font-semibold">Security</div>
                  <p className={`text-sm ${softText}`}>
                    You are logged in with your email. Contact support to change
                    password or enable 2FA.
                  </p>
                </div>
              </div>
              <div
                className={`mt-4 rounded-xl border p-4 ${
                  isDark
                    ? "border-slate-700 bg-slate-900/60"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="text-sm font-semibold">Sessions</div>
                <p className={`text-sm ${softText} mt-1`}>
                  Log out from here to end this session. Additional security
                  controls are coming soon.
                </p>
                <button
                  onClick={logout}
                  className={`mt-3 rounded-lg px-4 py-2 text-sm font-semibold ${
                    isDark
                      ? "bg-red-500 text-white hover:bg-red-600"
                      : "bg-red-100 text-red-700 hover:bg-red-200"
                  }`}
                >
                  Log Out Now
                </button>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

function SettingToggle({
  title,
  description,
  enabled,
  onChange,
  icon,
  isDark,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
  icon: ReactNode;
  isDark: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-4 shadow-sm ${
        isDark ? "border-slate-700 bg-slate-900/70" : "border-gray-100 bg-white"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
            isDark ? "bg-slate-800" : "bg-gray-50"
          }`}
        >
          {icon}
        </div>
        <div>
          <div className={`font-semibold ${isDark ? "text-slate-100" : "text-gray-900"}`}>
            {title}
          </div>
          <p className={`text-sm ${isDark ? "text-slate-300" : "text-gray-600"}`}>
            {description}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!enabled)}
        className={`relative h-7 w-12 rounded-full transition ${
          enabled ? "bg-blue-600" : "bg-gray-300"
        }`}
        aria-pressed={enabled}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
            enabled ? "right-1" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}
