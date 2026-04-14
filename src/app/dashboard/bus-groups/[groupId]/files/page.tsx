"use client";

import { useState, useEffect, useRef } from "react";
import { Upload, FileText, Image, File, Download, Copy, Check, AlertCircle, X } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface FileMsg {
  id: string; fileUrl: string; fileName?: string | null; fileType?: string | null;
  createdAt: string; sender: { id: string; name: string };
}

export default function FilesPage({ params }: { params: { groupId: string } }) {
  const [files, setFiles] = useState<FileMsg[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = async () => {
    try {
      const res = await fetch(`/api/bus-groups/${params.groupId}/messages?after=0`);
      const { messages } = await res.json();
      setFiles((messages as FileMsg[]).filter((m: any) => m.fileUrl));
    } catch {
      setError("Failed to load files");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFiles(); }, [params.groupId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const uploadRes = await fetch(`/api/bus-groups/${params.groupId}/upload`, { method: "POST", body: fd });
      if (!uploadRes.ok) { const d = await uploadRes.json(); throw new Error(d.error); }
      const { url, fileName, fileType } = await uploadRes.json();

      // Post as a message so it appears in chat too
      await fetch(`/api/bus-groups/${params.groupId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrl: url, fileName, fileType }),
      });
      await fetchFiles();
    } catch (err: any) {
      setError(err.message ?? "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const copyUrl = async (id: string, url: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) return (
    <div className="flex justify-center py-16">
      <svg className="animate-spin w-7 h-7 text-gold-600" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-gray-500 text-sm">{files.length} files shared</p>
        <div>
          <input type="file" ref={fileInputRef} onChange={handleUpload}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
            className="flex items-center gap-2 bg-brown-800 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-brown-800 disabled:opacity-50">
            {uploading
              ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Uploading...</>
              : <><Upload className="w-4 h-4" /> Upload File</>}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-4 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {files.length === 0 ? (
        <div className="bg-white border border-brown-200 rounded-2xl p-16 text-center">
          <File className="w-12 h-12 mx-auto mb-4 text-gray-200" />
          <p className="text-gray-500 text-sm font-medium">No files shared yet</p>
          <p className="text-gray-400 text-xs mt-1">Upload a file or share one in the chat</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {files.map(f => (
            <div key={f.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-brown-200 transition-colors shadow-sm">
              {f.fileType === "image" ? (
                <a href={f.fileUrl} target="_blank" rel="noreferrer">
                  <img src={f.fileUrl} alt={f.fileName ?? "image"} className="w-full h-32 object-cover" />
                </a>
              ) : (
                <div className="h-32 bg-gray-50 flex items-center justify-center">
                  {f.fileType === "pdf"
                    ? <FileText className="w-12 h-12 text-red-300" />
                    : <File className="w-12 h-12 text-blue-300" />}
                </div>
              )}
              <div className="p-3">
                <p className="text-xs font-medium text-gray-800 truncate" title={f.fileName ?? ""}>{f.fileName ?? "File"}</p>
                <p className="text-xs text-gray-400 mt-0.5">{f.sender.name} · {formatDate(f.createdAt)}</p>
                <div className="flex gap-1 mt-2">
                  <a href={f.fileUrl} download={f.fileName ?? "file"} target="_blank" rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-1 text-xs bg-brown-50 text-gold-500 hover:bg-brown-100 rounded-lg py-1.5 transition-colors font-medium">
                    <Download className="w-3 h-3" /> Download
                  </a>
                  <button onClick={() => copyUrl(f.id, f.fileUrl)}
                    className="flex items-center justify-center px-2.5 bg-gray-50 text-gray-500 hover:bg-gray-100 rounded-lg py-1.5 transition-colors">
                    {copiedId === f.id ? <Check className="w-3 h-3 text-gold-500" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
