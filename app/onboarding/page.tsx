"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Sparkles } from "lucide-react";
import Image from "next/image";
import { useAuth } from "../components/AuthProvider";

export default function OnboardingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
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

  const handleStartChatting = () => {
    router.push("/chat");
  };

  const handleSignIn = () => {
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card Container */}
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-10">
          {/* Logo/Icon */}
          <div className="flex justify-center mb-6">
            <Sparkles className="h-8 w-8 text-blue-500" />
          </div>

          {/* App Name */}
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Aley
          </h1>

          {/* Image */}
          <div className="relative w-full aspect-4/3 mb-8 rounded-2xl overflow-hidden bg-linear-to-br from-gray-800 to-gray-900">
            <Image
              src="/Aley_chatting.png"
              alt="AI Conversation"
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* Heading */}
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-4">
            Clarity in every conversation
          </h2>

          {/* Subheading */}
          <p className="text-gray-600 text-center mb-8 leading-relaxed">
            Experience a smarter way to work and create, designed for peace of
            mind.
          </p>

          {/* Start Chatting Button */}
          <button
            onClick={handleStartChatting}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3.5 px-6 rounded-xl transition-colors duration-200 mb-4 flex items-center justify-center gap-2"
          >
            Start Chatting
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          {/* Sign In Link */}
          <p className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <button
              onClick={handleSignIn}
              className="text-blue-500 hover:text-blue-600 font-medium transition-colors"
            >
              Sign in
            </button>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-6">
          © 2023 Aley AI Assistant. All rights reserved.
        </p>
      </div>
    </div>
  );
}
