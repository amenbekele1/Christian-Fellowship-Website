"use client";

import { useState, useEffect } from "react";
import { Plus, Copy, Trash2, X, CheckCircle, Clock, AlertCircle, Link2 } from "lucide-react";

interface InviteToken {
  id: string;
  token: string;
  email: string | null;
  expiresAt: string;
  used: boolean;
  usedAt: string | null;
  status: "Valid" | "Used" | "Expired";
  isExpired: boolean;
}

export default function AdminInvitesPage() {
  const [tokens, setTokens] = useState<InviteToken[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [generatedUrl, setGeneratedUrl] = useState<string>("");

  useEffect(() => {
    fetchTokens();
  }, []);

  const fetchTokens = async () => {
    setLoading(true);
    const res = await fetch("/api/invites");
    const data = await res.json();
    setTokens(data);
    setLoading(false);
  };

  const generateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email || undefined }),
      });
      const data = await res.json();
      setGeneratedUrl(data.inviteUrl);
      setEmail("");
      fetchTokens();
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = (url: string, tokenId: string) => {
    navigator.clipboard.writeText(url);
    setCopied(tokenId);
    setTimeout(() => setCopied(null), 2000);
  };

  const deleteToken = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this invite?")) return;
    await fetch(`/api/invites?id=${id}`, { method: "DELETE" });
    fetchTokens();
  };

  const getStatusBadge = (token: InviteToken) => {
    if (token.status === "Used") {
      return (
        <div className="flex items-center gap-1.5">
          <CheckCircle className="w-4 h-4 text-gold-500" />
          <span className="text-xs bg-brown-100 text-gold-500 px-2 py-0.5 rounded-full">Used</span>
          {token.usedAt && (
            <span className="text-xs text-gray-500">
              {new Date(token.usedAt).toLocaleDateString("en-GB", {day: "numeric", month: "short"})}
            </span>
          )}
        </div>
      );
    }
    if (token.status === "Expired") {
      return (
        <div className="flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Expired</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5">
        <Clock className="w-4 h-4 text-amber-500" />
        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Valid</span>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-800">Invite Members</h1>
          <p className="text-gray-500 mt-1">Generate and manage registration invites for new members</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-brown-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-brown-800 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Generate Invite
        </button>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-gray-800 text-xl">Generate Invite Link</h2>
              <button onClick={() => setShowForm(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {generatedUrl ? (
              <div className="space-y-4">
                <div className="bg-brown-50 border border-brown-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gold-500 uppercase tracking-wide mb-2">Invite Link Generated</p>
                  <div className="bg-white rounded-lg p-3 mb-3 break-all text-sm text-gray-700 font-mono">
                    {generatedUrl}
                  </div>
                  <button
                    onClick={() => copyToClipboard(generatedUrl, "generated")}
                    className="w-full flex items-center justify-center gap-2 bg-brown-800 text-white py-2 rounded-lg text-sm font-medium hover:bg-brown-800 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    {copied === "generated" ? "Copied!" : "Copy Link"}
                  </button>
                </div>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setGeneratedUrl("");
                  }}
                  className="w-full border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={generateInvite} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address (Optional)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="member@example.com"
                    className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave empty to create a generic invite</p>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 bg-brown-800 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-brown-800 disabled:opacity-50"
                  >
                    {creating ? "Generating..." : "Generate"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <svg className="animate-spin w-8 h-8 text-gold-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-brown-200 shadow-sm overflow-hidden">
          {tokens.length === 0 ? (
            <div className="text-center py-14 text-gray-400">
              <Link2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium mb-1">No invites yet</p>
              <p className="text-sm">Create your first invite link to get started</p>
            </div>
          ) : (
            <div className="divide-y divide-brown-100">
              <div className="grid grid-cols-6 gap-4 px-6 py-3 bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <div className="col-span-2">Email / Link</div>
                <div>Created</div>
                <div>Expires</div>
                <div>Status</div>
                <div className="text-right">Actions</div>
              </div>
              {tokens.map((token) => (
                <div key={token.id} className="grid grid-cols-6 gap-4 px-6 py-4 items-center hover:bg-gray-50 transition-colors">
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {token.email || `invite-${token.token.slice(0, 8)}`}
                    </p>
                    <p className="text-xs text-gray-500 truncate font-mono">{token.token.slice(0, 12)}...</p>
                  </div>
                  <div className="text-sm text-gray-600">
                    {new Date(token.expiresAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "2-digit",
                    })}
                  </div>
                  <div className="text-sm text-gray-600">
                    {new Date(token.expiresAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  <div>{getStatusBadge(token)}</div>
                  <div className="flex items-center justify-end gap-2">
                    {!token.used && !token.isExpired && (
                      <button
                        onClick={() =>
                          copyToClipboard(`${process.env.NEXT_PUBLIC_BASE_URL || window.location.origin}/register?invite=${token.token}`, token.id)
                        }
                        className="text-gold-600 hover:text-gold-500 p-1 transition-colors"
                        title="Copy link"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteToken(token.id)}
                      className="text-red-400 hover:text-red-600 p-1 transition-colors"
                      title="Revoke"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
