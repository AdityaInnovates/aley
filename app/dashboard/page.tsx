"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { MessageCircle, LogOut, Settings, User } from "lucide-react";
import { useAuth } from "../components/AuthProvider";

export default function DashboardPage() {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return; // Still loading
    if (!isAuthenticated) router.push("/login");
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleSignOut = () => {
    logout();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Aley</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-gray-700">
                <User className="h-4 w-4" />
                <span className="text-sm">{user?.name}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-sm">Sign out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome back, {user?.name?.split(" ")[0]}! 👋
          </h1>
          <p className="text-xl text-gray-600">
            Ready to start your AI conversation?
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-100 p-2 rounded-lg">
                <MessageCircle className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">New Chat</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Start a fresh conversation with AI
            </p>
            <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
              Start Chatting
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-green-100 p-2 rounded-lg">
                <Settings className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Chat History</h3>
            </div>
            <p className="text-gray-600 mb-4">
              View your previous conversations
            </p>
            <button className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors">
              View History
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-purple-100 p-2 rounded-lg">
                <User className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Profile Settings</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Manage your account preferences
            </p>
            <button className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors">
              Settings
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Recent Activity
          </h2>
          <div className="text-center py-12">
            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No conversations yet
            </h3>
            <p className="text-gray-600 mb-6">
              Start your first AI conversation to see your activity here.
            </p>
            <button className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors">
              Start Your First Chat
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
