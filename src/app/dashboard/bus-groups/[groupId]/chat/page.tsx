"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Send, Paperclip, X, Download, Megaphone, Trash2, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Sender { id: string; name: string; }
interface Message {
  id: string; seq: number; senderId: string; content?: string | null;
  fileUrl?: string | null; fileName?: string | null; fileType?: string | null;
  isAnnouncement: boolean; createdAt: string; sender: Sender;
}

export default function ChatPage({ params }: { params: { groupId: string } }) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ url: string; name: string; type: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const lastSeqRef = useRef(0);
  const listEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchMessages = useCallback(async (after: number, initial = false) => {
    try {
      const res = await fetch(`/api/bus-groups/${params.groupId}/messages?after=${after}`);
      if (!res.ok) return;
      const { messages: newMsgs, latestSeq } = await res.json();
      if (newMsgs.length > 0) {
        setMessages(prev => initial ? newMsgs : [...prev, ...newMsgs]);
        lastSeqRef.current = latestSeq;
        setTimeout(() => listEndRef.current?.scrollIntoView({ behavior: initial ? "auto" : "smooth" }), 50);
      }
    } catch {
      // silent poll failure
    }
  }, [params.groupId]);

  useEffect(() => {
    fetchMessages(0, true).finally(() => setLoading(false));
    intervalRef.current = setInterval(() => fetchMessages(lastSeqRef.current), 3000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchMessages]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/bus-groups/${params.groupId}/upload`, { method: "POST", body: fd });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      const { url, fileName, fileType } = await res.json();
      setUploadedFile({ url, name: fileName, type: fileType });
    } catch (err: any) {
      setError(err.message ?? "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !uploadedFile) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/bus-groups/${params.groupId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: input.trim() || undefined,
          fileUrl: uploadedFile?.url,
          fileName: uploadedFile?.name,
          fileType: uploadedFile?.type,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      const msg = await res.json();
      setMessages(prev => [...prev, msg]);
      lastSeqRef.current = msg.seq;
      setInput("");
      setUploadedFile(null);
      setTimeout(() => listEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (err: any) {
      setError(err.message ?? "Failed to send");
    } finally {
      setSending(false);
    }
  };

  const deleteMsg = async (id: string) => {
    if (!confirm("Delete this message?")) return;
    await fetch(`/api/bus-groups/${params.groupId}/messages?msgId=${id}`, { method: "DELETE" });
    setMessages(prev => prev.filter(m => m.id !== id));
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <svg className="animate-spin w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
    </div>
  );

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 260px)", minHeight: 400 }}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {messages.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-sm">No messages yet. Say hello! 👋</p>
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.senderId === session?.user?.id;
          if (msg.isAnnouncement) {
            return (
              <div key={msg.id} className="bg-amber-50 border border-amber-200 rounded-2xl p-4 group relative">
                <div className="flex items-center gap-2 mb-2">
                  <Megaphone className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Announcement</span>
                  <span className="text-xs text-amber-600 ml-auto">
                    {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                  </span>
                  {isMe && (
                    <button onClick={() => deleteMsg(msg.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-amber-400 hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {msg.content && <p className="text-sm text-gray-800 leading-relaxed">{msg.content}</p>}
                {msg.fileUrl && <FileAttachment url={msg.fileUrl} name={msg.fileName} type={msg.fileType} />}
                <p className="text-xs text-amber-600 mt-2 font-medium">{msg.sender.name}</p>
              </div>
            );
          }
          return (
            <div key={msg.id} className={`flex gap-2.5 group ${isMe ? "flex-row-reverse" : ""}`}>
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs shrink-0 mt-1">
                {msg.sender.name.charAt(0).toUpperCase()}
              </div>
              <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
                <div className="flex items-center gap-2">
                  {!isMe && <span className="text-xs font-medium text-gray-600">{msg.sender.name}</span>}
                  <span className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                  </span>
                  {isMe && (
                    <button onClick={() => deleteMsg(msg.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-gray-300 hover:text-red-400">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  isMe ? "bg-green-700 text-white rounded-tr-sm" : "bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm"
                }`}>
                  {msg.content && <p>{msg.content}</p>}
                  {msg.fileUrl && <FileAttachment url={msg.fileUrl} name={msg.fileName} type={msg.fileType} dark={isMe} />}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={listEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-xs mt-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Uploaded file preview */}
      {uploadedFile && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mt-2 text-xs text-green-800">
          <Paperclip className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{uploadedFile.name}</span>
          <button onClick={() => setUploadedFile(null)} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Input */}
      <form onSubmit={send} className="flex gap-2 mt-3 bg-white border border-gray-200 rounded-2xl p-2 shadow-sm">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="p-2 text-gray-400 hover:text-green-600 transition-colors disabled:opacity-50"
          title="Attach file"
        >
          {uploading
            ? <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            : <Paperclip className="w-4 h-4" />}
        </button>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Write a message..."
          className="flex-1 text-sm focus:outline-none bg-transparent"
        />
        <button
          type="submit"
          disabled={sending || uploading || (!input.trim() && !uploadedFile)}
          className="bg-green-700 hover:bg-green-800 text-white p-2 rounded-xl transition-colors disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

function FileAttachment({ url, name, type, dark }: { url: string; name?: string | null; type?: string | null; dark?: boolean }) {
  if (type === "image") {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="block mt-2">
        <img src={url} alt={name ?? "image"} className="max-w-[220px] rounded-lg object-cover" />
      </a>
    );
  }
  return (
    <a
      href={url}
      download={name ?? "file"}
      target="_blank"
      rel="noreferrer"
      className={`flex items-center gap-2 mt-2 text-xs underline ${dark ? "text-green-100" : "text-green-700"}`}
    >
      <Download className="w-3.5 h-3.5" />
      {name ?? "Download file"}
    </a>
  );
}
