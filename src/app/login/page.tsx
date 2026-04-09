"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      if (result?.error) {
        setError(result.error === "CredentialsSignin" ? "Invalid email or password" : result.error);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-green-700 flex items-center justify-center text-amber-300 text-2xl font-bold mx-auto mb-4">
            ✝
          </div>
          <h1 className="font-display text-3xl font-bold text-gray-800 mb-2">Welcome Back</h1>
          <p className="text-gray-500 text-sm">Sign in to your member account</p>
        </div>

        <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-8">
          <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-6 text-center">
            <p className="scripture text-sm text-green-800 italic">
              "I am the way and the truth and the life"
            </p>
            <p className="text-xs text-green-600 font-semibold mt-1">— John 14:6</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
              <input
                type="email"
                required
                autoFocus
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="your@email.com"
                className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Your password"
                  className="w-full h-10 rounded-lg border border-gray-200 px-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-700 text-white font-semibold py-3 rounded-xl hover:bg-green-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              {loading ? "Signing in..." : "Sign In"}
            </button>
            <div className="text-right mt-3">
              <Link href="/forgot-password" className="text-sm text-green-600 hover:text-green-700 font-medium">
                Forgot password?
              </Link>
            </div>
          </form>

          {/* Demo credentials */}
          <div className="mt-5 p-3 bg-amber-50 border border-amber-100 rounded-lg">
            <p className="text-xs text-amber-700 font-semibold mb-2">Demo Accounts:</p>
            <div className="space-y-1 text-xs text-amber-600">
              <p>Guardian: admin@wecf.org / Guardian@2024</p>
              <p>BUS Leader: leader@wecf.org / Leader@2024</p>
              <p>Member: member@wecf.org / Member@2024</p>
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-5">
            Don't have an account?{" "}
            <Link href="/register" className="text-green-700 font-semibold hover:underline">
              Join the Fellowship
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
