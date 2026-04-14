"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, Check, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send reset email");
      }

      setSent(true);
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-brown-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/logo.svg" alt="WECF" className="w-12 h-12 rounded-full mx-auto mb-4 shadow-warm" />
          <h1 className="font-display text-2xl font-bold text-brown-700">Warsaw Ethiopian</h1>
          <p className="text-gold-600 text-sm">Christian Fellowship</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl border border-brown-200 p-8 shadow-sm">
          {!sent ? (
            <>
              <h2 className="font-display font-bold text-gray-800 text-xl mb-2">Forgot Password?</h2>
              <p className="text-gray-500 text-sm mb-6">
                Enter your email and we'll send you a link to reset your password.
              </p>

              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2 items-start">
                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brown-800 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-brown-800 disabled:opacity-50 transition-colors"
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-sm text-gray-600 text-center">
                  Remember your password?{" "}
                  <Link href="/login" className="text-gold-600 hover:text-gold-500 font-medium">
                    Sign in
                  </Link>
                </p>
              </div>
            </>
          ) : (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brown-100 text-gold-600 mb-4">
                <Check className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Check Your Email</h3>
              <p className="text-gray-500 text-sm mb-6">
                We've sent a password reset link to <strong>{email}</strong>. The link expires in 1 hour.
              </p>
              <button
                onClick={() => setSent(false)}
                className="w-full bg-brown-800 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-brown-800 transition-colors"
              >
                Send Another Link
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
