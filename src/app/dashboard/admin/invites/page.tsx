"use client";

import { useState, useEffect } from "react";
import QRCode from "qrcode";
import {
  Plus, Copy, Trash2, X, CheckCircle, Clock, AlertCircle, Link2, QrCode, Download, CalendarClock,
} from "lucide-react";
import { formatWarsaw, warsawDateKey } from "@/lib/timezone";
import { confirmDialog, toast } from "@/components/ui/toaster";

interface InviteToken {
  id: string;
  token: string;
  email: string | null;
  createdAt: string;
  expiresAt: string;
  used: boolean;
  usedAt: string | null;
  status: "Valid" | "Used" | "Expired";
  isExpired: boolean;
}

type Preset = "2d" | "1w" | "1m" | "date";

const PRESETS: { key: Preset; label: string }[] = [
  { key: "2d", label: "2 days" },
  { key: "1w", label: "1 week" },
  { key: "1m", label: "1 month" },
  { key: "date", label: "Pick a date" },
];

/** "YYYY-MM-DD" for `days` from today on the Warsaw calendar. */
function daysFromToday(days: number): string {
  return warsawDateKey(new Date(Date.now() + days * 24 * 60 * 60 * 1000));
}

function inviteLink(token: string): string {
  return `${process.env.NEXT_PUBLIC_BASE_URL || window.location.origin}/register?invite=${token}`;
}

function formatExpiry(iso: string): string {
  return formatWarsaw(iso, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/** Save a data/blob URL as a file. */
function download(href: string, filename: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** QR code for an invite link, with print-quality PNG and SVG downloads. */
function QrPanel({ url, expiresAt }: { url: string; expiresAt?: string }) {
  const [preview, setPreview] = useState<string>("");

  useEffect(() => {
    QRCode.toDataURL(url, { width: 480, margin: 2, errorCorrectionLevel: "M" })
      .then(setPreview)
      .catch(() => setPreview(""));
  }, [url]);

  const downloadPng = async () => {
    // 2000px is sharp enough for a printed banner.
    const png = await QRCode.toDataURL(url, { width: 2000, margin: 4, errorCorrectionLevel: "M" });
    download(png, "wecf-join-qr.png");
  };

  const downloadSvg = async () => {
    const svg = await QRCode.toString(url, { type: "svg", margin: 4, errorCorrectionLevel: "M" });
    const blobUrl = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    download(blobUrl, "wecf-join-qr.svg");
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  };

  return (
    <div className="text-center">
      <div className="inline-block bg-white p-3 rounded-xl border border-brown-200">
        {preview ? (
          <img src={preview} alt="QR code for the invite link" className="w-48 h-48" />
        ) : (
          <div className="w-48 h-48 animate-pulse bg-brown-50 rounded" />
        )}
      </div>
      {/* Shown so you can check the QR points at the right domain before printing */}
      <p className="text-[11px] text-gray-500 mt-2 font-mono break-all">{url}</p>
      {expiresAt && (
        <p className="text-xs text-gray-500 mt-1">Works until {formatExpiry(expiresAt)}</p>
      )}
      <div className="grid grid-cols-2 gap-2 mt-3">
        <button
          type="button"
          onClick={downloadPng}
          className="flex items-center justify-center gap-1.5 border border-brown-200 text-brown-800 py-2 rounded-lg text-sm font-medium hover:bg-brown-50"
        >
          <Download className="w-4 h-4" /> PNG
        </button>
        <button
          type="button"
          onClick={downloadSvg}
          className="flex items-center justify-center gap-1.5 border border-brown-200 text-brown-800 py-2 rounded-lg text-sm font-medium hover:bg-brown-50"
        >
          <Download className="w-4 h-4" /> SVG (print)
        </button>
      </div>
    </div>
  );
}

/** Preset buttons + optional date input for choosing how long a link works. */
function ExpiryPicker({
  preset, setPreset, date, setDate,
}: {
  preset: Preset; setPreset: (p: Preset) => void; date: string; setDate: (d: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">Valid until</label>
      <div className="grid grid-cols-4 gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setPreset(p.key)}
            className={`py-2 rounded-lg text-xs font-semibold border transition-colors ${
              preset === p.key
                ? "bg-brown-800 text-white border-brown-800"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      {preset === "date" && (
        <input
          type="date"
          required
          value={date}
          min={daysFromToday(0)}
          max={daysFromToday(365)}
          onChange={(e) => setDate(e.target.value)}
          className="mt-2 w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
        />
      )}
      <p className="text-xs text-gray-500 mt-1">
        The link keeps working through the end of that day (Warsaw time), for as many people as you share it with.
      </p>
    </div>
  );
}

/** Translate the picker state into the API's `expiresOn` (undefined = 48h default). */
function expiresOnFor(preset: Preset, date: string): string | undefined {
  if (preset === "1w") return daysFromToday(7);
  if (preset === "1m") return daysFromToday(30);
  if (preset === "date") return date;
  return undefined;
}

export default function AdminInvitesPage() {
  const [tokens, setTokens] = useState<InviteToken[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [preset, setPreset] = useState<Preset>("2d");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [generated, setGenerated] = useState<{ url: string; expiresAt: string } | null>(null);
  const [qrFor, setQrFor] = useState<InviteToken | null>(null);
  const [editing, setEditing] = useState<InviteToken | null>(null);
  const [editDate, setEditDate] = useState("");

  useEffect(() => {
    fetchTokens();
  }, []);

  const fetchTokens = async () => {
    const res = await fetch("/api/invites");
    const data = await res.json();
    setTokens(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  const closeForm = () => {
    setShowForm(false);
    setGenerated(null);
    setEmail("");
    setPreset("2d");
    setDate("");
  };

  const generateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email || undefined, expiresOn: expiresOnFor(preset, date) }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't create the invite");
        return;
      }
      setGenerated({ url: data.inviteUrl, expiresAt: data.inviteToken.expiresAt });
      if (email && !data.emailSent) toast.error("The link was created but the email could not be sent.");
      fetchTokens();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const saveExpiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const res = await fetch(`/api/invites?id=${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expiresOn: editDate }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(data.error ?? "Couldn't update the invite");
      return;
    }
    toast.success("Expiry updated");
    setEditing(null);
    fetchTokens();
  };

  const copyToClipboard = (url: string, tokenId: string) => {
    navigator.clipboard.writeText(url);
    setCopied(tokenId);
    setTimeout(() => setCopied(null), 2000);
  };

  const deleteToken = async (id: string) => {
    if (!(await confirmDialog({ title: "Revoke this invite?", message: "The link will stop working for anyone who has not registered yet.", confirmLabel: "Revoke", destructive: true }))) return;
    await fetch(`/api/invites?id=${id}`, { method: "DELETE" });
    fetchTokens();
  };

  const getStatusBadge = (token: InviteToken) => {
    if (token.status === "Used") {
      return (
        <div className="flex items-center gap-1.5">
          <CheckCircle className="w-4 h-4 text-gold-500" />
          <span className="text-xs bg-brown-100 text-gold-500 px-2 py-0.5 rounded-full">Used</span>
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
        {token.usedAt && (
          <span className="text-xs text-gray-500" title="Last registration through this link">
            · last used {formatWarsaw(token.usedAt, { day: "numeric", month: "short" })}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-800">Invite Members</h1>
          <p className="text-gray-500 mt-1">Generate and manage registration invites for new members</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-brown-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-brown-800 shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" /> Generate Invite
        </button>
      </div>

      {/* Create modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-gray-800 text-xl">Generate Invite Link</h2>
              <button onClick={closeForm} aria-label="Close">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {generated ? (
              <div className="space-y-4">
                <div className="bg-brown-50 border border-brown-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gold-500 uppercase tracking-wide mb-2">Invite Link Generated</p>
                  <div className="bg-white rounded-lg p-3 mb-3 break-all text-sm text-gray-700 font-mono">
                    {generated.url}
                  </div>
                  <button
                    onClick={() => copyToClipboard(generated.url, "generated")}
                    className="w-full flex items-center justify-center gap-2 bg-brown-800 text-white py-2 rounded-lg text-sm font-medium hover:bg-brown-800 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    {copied === "generated" ? "Copied!" : "Copy Link"}
                  </button>
                </div>
                <QrPanel url={generated.url} expiresAt={generated.expiresAt} />
                <button
                  onClick={closeForm}
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
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty for a shareable link (e.g. a QR code on a banner). With an email, only that address can use it.
                  </p>
                </div>
                <ExpiryPicker preset={preset} setPreset={setPreset} date={date} setDate={setDate} />
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeForm}
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

      {/* QR modal for an existing invite */}
      {qrFor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setQrFor(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-gray-800 text-xl">Invite QR code</h2>
              <button onClick={() => setQrFor(null)} aria-label="Close">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <QrPanel url={inviteLink(qrFor.token)} expiresAt={qrFor.expiresAt} />
          </div>
        </div>
      )}

      {/* Change-expiry modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setEditing(null)}>
          <form
            onSubmit={saveExpiry}
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-gray-800 text-xl">Change expiry</h2>
              <button type="button" onClick={() => setEditing(null)} aria-label="Close">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <p className="text-sm text-gray-500">
              Currently works until {formatExpiry(editing.expiresAt)}. The link and any printed QR code stay the same.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Valid until</label>
              <input
                type="date"
                required
                value={editDate}
                min={daysFromToday(0)}
                max={daysFromToday(365)}
                onChange={(e) => setEditDate(e.target.value)}
                className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>
            <button type="submit" className="w-full bg-brown-800 text-white py-2.5 rounded-xl text-sm font-medium">
              Save
            </button>
          </form>
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
              <div className="hidden md:grid grid-cols-6 gap-4 px-6 py-3 bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <div className="col-span-2">Email / Link</div>
                <div>Created</div>
                <div>Expires</div>
                <div>Status</div>
                <div className="text-right">Actions</div>
              </div>
              {tokens.map((token) => {
                const active = !token.used && !token.isExpired;
                return (
                  <div key={token.id} className="grid grid-cols-2 md:grid-cols-6 gap-x-4 gap-y-1 px-6 py-4 items-center hover:bg-gray-50 transition-colors">
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {token.email || "Shareable link"}
                      </p>
                      <p className="text-xs text-gray-500 truncate font-mono">{token.token.slice(0, 12)}...</p>
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="md:hidden text-xs text-gray-400">Created </span>
                      {formatWarsaw(token.createdAt, { day: "numeric", month: "short", year: "2-digit" })}
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="md:hidden text-xs text-gray-400">Expires </span>
                      {formatExpiry(token.expiresAt)}
                    </div>
                    <div>{getStatusBadge(token)}</div>
                    <div className="flex items-center justify-end gap-1">
                      {active && (
                        <>
                          <button
                            onClick={() => copyToClipboard(inviteLink(token.token), token.id)}
                            className="text-gold-600 hover:text-gold-500 p-1.5 transition-colors"
                            title={copied === token.id ? "Copied!" : "Copy link"}
                            aria-label="Copy link"
                          >
                            {copied === token.id ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => setQrFor(token)}
                            className="text-gold-600 hover:text-gold-500 p-1.5 transition-colors"
                            title="QR code"
                            aria-label="Show QR code"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {!token.used && (
                        <button
                          onClick={() => { setEditing(token); setEditDate(warsawDateKey(token.expiresAt)); }}
                          className="text-gray-500 hover:text-gray-700 p-1.5 transition-colors"
                          title="Change expiry"
                          aria-label="Change expiry"
                        >
                          <CalendarClock className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteToken(token.id)}
                        className="text-red-400 hover:text-red-600 p-1.5 transition-colors"
                        title="Revoke"
                        aria-label="Revoke invite"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
