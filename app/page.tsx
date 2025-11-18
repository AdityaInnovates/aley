import Link from "next/link";
import { MessageCircle, Brain, Zap, Shield } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-100">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 md:px-12">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-8 w-8 text-blue-600" />
          <span className="text-xl font-bold text-gray-900">Aley</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="px-6 md:px-12">
        <div className="max-w-4xl mx-auto text-center py-20">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Your AI Chat Assistant,
            <span className="text-blue-600"> Simplified</span>
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Have intelligent conversations with AI without the technical setup.
            Aley provides a clean, intuitive interface for all your AI chat
            needs.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Start Chatting Now
            </Link>
            <Link
              href="/login"
              className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              I have an account
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-6xl mx-auto py-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-16">
            Why Choose Aley?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Intelligent Conversations
              </h3>
              <p className="text-gray-600">
                Powered by advanced GPT technology for natural, contextual
                conversations that understand your needs.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Lightning Fast
              </h3>
              <p className="text-gray-600">
                Get instant responses with our optimized chat interface. No
                waiting, no complexity, just results.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Secure & Private
              </h3>
              <p className="text-gray-600">
                Your conversations are protected with enterprise-grade security.
                Your data stays private, always.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-4xl mx-auto text-center py-20">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Ready to start your AI conversation?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of users who trust Aley for their AI chat needs.
          </p>
          <Link
            href="/signup"
            className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg"
          >
            Get Started for Free
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 px-6 md:px-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <MessageCircle className="h-6 w-6 text-blue-600" />
            <span className="font-bold text-gray-900">Aley</span>
          </div>
          <p className="text-gray-600 text-sm">
            © 2025 Aley. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
