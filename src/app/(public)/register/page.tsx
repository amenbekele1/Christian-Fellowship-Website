"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, UserPlus, CheckCircle } from "lucide-react";

function ContactInterestForm() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await fetch("/api/contact-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setSent(true);
    } catch {
      setSent(true); // show success regardless to avoid email enumeration
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center py-4">
        <CheckCircle className="w-10 h-10 text-gold-600 mx-auto mb-3" />
        <p className="font-semibold text-gray-800">Message sent!</p>
        <p className="text-gray-500 text-sm mt-1">A fellowship leader will reach out to you soon.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSend} className="space-y-3">
      <p className="text-sm font-medium text-gray-700 mb-2">Or send us a message and we'll reach out:</p>
      <input
        type="text" required placeholder="Your name"
        value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
        className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
      />
      <input
        type="email" required placeholder="Your email"
        value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
        className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
      />
      <textarea
        placeholder="Tell us a little about yourself (optional)" rows={2}
        value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 resize-none"
      />
      <button
        type="submit" disabled={sending}
        className="w-full bg-brown-800 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-brown-800 disabled:opacity-50 transition-colors"
      >
        {sending ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");

  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(!!inviteToken);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [inviteValid, setInviteValid] = useState(false);

  const pwdRules = {
    length: form.password.length >= 10,
    upper: /[A-Z]/.test(form.password),
    lower: /[a-z]/.test(form.password),
    number: /\d/.test(form.password),
  };
  const pwdValid = Object.values(pwdRules).every(Boolean);
  const confirmMatch = form.confirm.length > 0 && form.password === form.confirm;

  useEffect(() => {
    if (!inviteToken) {
      return;
    }

    const validateInvite = async () => {
      try {
        const res = await fetch(`/api/invites/validate?token=${inviteToken}`);
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Invalid or expired invite");
          setInviteValid(false);
        } else {
          setInviteValid(true);
        }
      } catch (err) {
        setError("Failed to validate invite");
      } finally {
        setValidating(false);
      }
    };

    validateInvite();
  }, [inviteToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const errors: Record<string, string> = {};
    if (form.name.trim().length < 2) errors.name = "Name must be at least 2 characters";
    if (!pwdValid) errors.password = "Password does not meet requirements";
    if (form.password !== form.confirm) errors.confirm = "Passwords do not match";
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    setFieldErrors({});

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          inviteToken: inviteToken || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      // Mark invite as used if provided
      if (inviteToken) {
        await fetch("/api/invites/use", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: inviteToken }),
        }).catch(console.error);
      }

      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen bg-brown-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-10 max-w-md w-full text-center shadow-sm border border-brown-200">
          <svg className="animate-spin w-8 h-8 text-gold-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-gray-600">Validating your invite...</p>
        </div>
      </div>
    );
  }

  if (!inviteValid) {
    return (
      <div className="min-h-screen bg-brown-50 flex items-center justify-center px-4 py-12">
        <div className="bg-white rounded-2xl p-10 max-w-lg w-full shadow-sm border border-brown-200">
          {/* Header */}
          <div className="text-center mb-8">
            <img src="/logo.svg" alt="WECF" className="h-28 w-auto mx-auto mb-4 shadow-warm" />
            <h1 className="font-display text-3xl font-bold text-gray-800 mb-2">Join the Fellowship</h1>
            <p className="text-gray-500 text-sm">Membership is by invitation. Come meet us first!</p>
          </div>

          {/* Visit invitation */}
          <div className="bg-brown-50 border border-brown-200 rounded-2xl p-6 mb-6">
            <p className="font-semibold text-brown-700 mb-1">📍 Join us this Saturday</p>
            <p className="text-gray-700 font-medium">Naddnieprzańska 7, 04-205 Warszawa</p>
            <p className="text-gold-500 font-bold text-lg mt-1">18:00</p>
            <p className="text-gray-500 text-sm mt-2">Come to our Saturday service, meet the fellowship, and a leader will send you an invite link to register.</p>
          </div>

          {/* Contact form */}
          <ContactInterestForm />

          <p className="text-center text-sm text-gray-400 mt-6">
            Already have an invite?{" "}
            <Link href="/register?invite=" className="text-gold-500 font-medium hover:underline">Use your link</Link>
            {" · "}
            <Link href="/login" className="text-gold-500 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-brown-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-10 max-w-md w-full text-center shadow-sm border border-brown-200">
          <div className="text-6xl mb-5">🎉</div>
          <h2 className="font-display text-3xl font-bold text-brown-700 mb-3">Welcome to the Family!</h2>
          <p className="text-gray-500 mb-2">Your account has been created successfully.</p>
          <p className="text-sm text-gray-400">Redirecting you to sign in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brown-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <img src="/logo.svg" alt="WECF" className="h-20 w-auto mx-auto mb-4 shadow-warm" />
          <h1 className="font-display text-3xl font-bold text-gray-800 mb-2">Join the Fellowship</h1>
          <p className="text-gray-500 text-sm">Create your member account</p>
        </div>

        <div className="bg-white rounded-2xl border border-brown-200 shadow-sm p-8">
          {/* Scripture */}
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6 text-center">
            <p className="scripture text-sm text-amber-800 italic">
              "Not giving up meeting together... but encouraging one another"
            </p>
            <p className="text-xs text-amber-600 font-semibold mt-1">— Hebrews 10:25</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => { setForm({ ...form, name: e.target.value }); setFieldErrors(fe => ({ ...fe, name: "" })); }}
                placeholder="Miriam Haile"
                className={`w-full h-10 rounded-lg border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent ${fieldErrors.name ? "border-red-300 bg-red-50" : "border-gray-200"}`}
              />
              {fieldErrors.name && <p className="text-xs text-red-600 mt-1">{fieldErrors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address *</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="miriam@example.com"
                className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+48 123 456 789"
                className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password *</label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  required
                  value={form.password}
                  onChange={(e) => { setForm({ ...form, password: e.target.value }); setFieldErrors(fe => ({ ...fe, password: "" })); }}
                  placeholder="Min 10 chars, upper + lower + number"
                  className={`w-full h-10 rounded-lg border px-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent ${fieldErrors.password ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.password.length > 0 && (
                <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                  {[
                    { ok: pwdRules.length, label: "10+ characters" },
                    { ok: pwdRules.upper,  label: "Uppercase letter" },
                    { ok: pwdRules.lower,  label: "Lowercase letter" },
                    { ok: pwdRules.number, label: "Number" },
                  ].map(({ ok, label }) => (
                    <span key={label} className={`flex items-center gap-1 ${ok ? "text-gold-600" : "text-gray-400"}`}>
                      <span>{ok ? "✓" : "○"}</span> {label}
                    </span>
                  ))}
                </div>
              )}
              {fieldErrors.password && <p className="text-xs text-red-600 mt-1">{fieldErrors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password *</label>
              <input
                type="password"
                required
                value={form.confirm}
                onChange={(e) => { setForm({ ...form, confirm: e.target.value }); setFieldErrors(fe => ({ ...fe, confirm: "" })); }}
                placeholder="Repeat your password"
                className={`w-full h-10 rounded-lg border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent ${fieldErrors.confirm ? "border-red-300 bg-red-50" : form.confirm.length > 0 ? (confirmMatch ? "border-gold-400" : "border-red-300") : "border-gray-200"}`}
              />
              {form.confirm.length > 0 && !confirmMatch && !fieldErrors.confirm && (
                <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
              )}
              {fieldErrors.confirm && <p className="text-xs text-red-600 mt-1">{fieldErrors.confirm}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brown-800 text-white font-semibold py-3 rounded-xl hover:bg-brown-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            Already have an account?{" "}
            <Link href="/login" className="text-gold-500 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-brown-50 flex items-center justify-center"><div className="text-gray-600">Loading...</div></div>}>
      <RegisterContent />
    </Suspense>
  );
}
