"use client";

import { useState, useEffect } from "react";
import { Copy, Check, ExternalLink, Video, Users, Info, AlertCircle, Loader2 } from "lucide-react";

interface TokenData {
  token: string;
  roomName: string;
  appId: string;
}

export default function MeetingPage({ params }: { params: { groupId: string } }) {
  const [groupName, setGroupName]   = useState<string>("");
  const [joined, setJoined]         = useState(false);
  const [copied, setCopied]         = useState(false);
  const [tokenData, setTokenData]   = useState<TokenData | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [loadingToken, setLoadingToken] = useState(true);

  // Guest invite link always uses plain meet.jit.si (no token needed for guests)
  const roomName   = `wecf-bus-${params.groupId.replace(/[^a-z0-9]/gi, "")}`;
  const guestUrl   = `https://meet.jit.si/${roomName}`;

  // JaaS authenticated URL — only used inside the iframe when token is available
  const meetingUrl = tokenData
    ? `https://8x8.vc/${tokenData.appId}/${tokenData.roomName}?jwt=${tokenData.token}`
    : guestUrl;

  useEffect(() => {
    // Fetch group name
    fetch(`/api/bus-groups/${params.groupId}`)
      .then(r => r.json())
      .then(g => setGroupName(g.name ?? ""))
      .catch(() => {});

    // Fetch JaaS token
    fetch(`/api/bus-groups/${params.groupId}/meeting-token`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setTokenError(data.error);
        else setTokenData(data);
      })
      .catch(() => setTokenError("Could not load meeting credentials"))
      .finally(() => setLoadingToken(false));
  }, [params.groupId]);

  const copyLink = async () => {
    await navigator.clipboard.writeText(guestUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div>
      {!joined ? (
        /* Pre-join screen */
        <div className="bg-white border border-green-100 rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-gradient-to-br from-green-800 to-green-900 p-10 text-center">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Video className="w-8 h-8 text-white" />
            </div>
            <h2 className="font-display text-2xl font-bold text-white mb-1">
              {groupName ? `${groupName} Meeting Room` : "Meeting Room"}
            </h2>
            <p className="text-green-200 text-sm">Video conferencing powered by Jitsi Meet</p>
          </div>

          <div className="p-8 space-y-6">
            {/* Auth status */}
            {loadingToken ? (
              <div className="flex items-center justify-center gap-2 text-sm text-gray-400 py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Preparing your meeting credentials…
              </div>
            ) : tokenError ? (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl p-3 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Meeting will open without automatic sign-in. <span className="font-medium">JaaS not yet configured.</span></span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 text-sm">
                <Check className="w-4 h-4 shrink-0" />
                <span>You&apos;ll join as <span className="font-semibold">yourself</span> — no separate Jitsi login needed.</span>
              </div>
            )}

            {/* Info cards */}
            <div className="grid sm:grid-cols-3 gap-3 text-center">
              {[
                { icon: Video,   title: "HD Video",       desc: "Camera & screen sharing" },
                { icon: Users,   title: "Open to Guests", desc: "No account required" },
                { icon: Info,    title: "Persistent Room", desc: "Same link every time" },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="bg-green-50 rounded-xl p-4">
                  <Icon className="w-5 h-5 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-800">{title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </div>
              ))}
            </div>

            {/* Guest invite */}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Guest Invite Link</p>
              <div className="flex items-center gap-2">
                <p className="text-xs text-gray-600 truncate flex-1 font-mono bg-white border border-gray-200 rounded-lg px-3 py-2">
                  {guestUrl}
                </p>
                <button onClick={copyLink}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    copied ? "bg-green-100 text-green-700" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"
                  }`}>
                  {copied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">Share this link with guests — they can join without an account</p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setJoined(true)}
                disabled={loadingToken}
                className="flex-1 flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white py-3 rounded-xl font-medium transition-colors">
                {loadingToken
                  ? <><Loader2 className="w-5 h-5 animate-spin" /> Preparing…</>
                  : <><Video className="w-5 h-5" /> Join Meeting</>}
              </button>
              <a href={guestUrl} target="_blank" rel="noreferrer"
                className="flex items-center justify-center gap-2 border border-gray-200 text-gray-600 hover:bg-gray-50 px-4 py-3 rounded-xl transition-colors text-sm">
                <ExternalLink className="w-4 h-4" /> Open in New Tab
              </a>
            </div>
          </div>
        </div>
      ) : (
        /* In-meeting view */
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-gray-700">Meeting in progress</span>
            </div>
            <div className="flex gap-2">
              <button onClick={copyLink}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  copied ? "bg-green-50 border-green-200 text-green-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}>
                {copied ? <><Check className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Invite</>}
              </button>
              <button onClick={() => setJoined(false)}
                className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors">
                Leave
              </button>
            </div>
          </div>

          <iframe
            src={meetingUrl}
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            className="w-full rounded-2xl border border-gray-200 shadow-sm"
            style={{ height: "calc(100vh - 320px)", minHeight: 480 }}
            title="Jitsi Meeting"
          />
        </div>
      )}
    </div>
  );
}
