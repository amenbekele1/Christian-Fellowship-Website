"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Calendar, Trash2, X, Globe, Lock, Edit2, ImagePlus, Youtube, ExternalLink, Check } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { EVENT_THEMES, EVENT_LAYOUTS, parseVideoEmbed, eventPath } from "@/lib/event-presets";

interface Event {
  id: string; title: string; description: string | null; body: string | null;
  location: string | null; startDate: string; endDate: string | null;
  type: string | null; imageUrl: string | null; gallery: string[];
  videoUrl: string | null; theme: string | null; layout: string | null;
  isPublic: boolean;
}

const eventTypes = ["Worship", "Worship Night", "Bible Study", "Sermon", "Literature Night", "BUS Meeting", "Other"];

const EMPTY_FORM = {
  title: "", description: "", body: "", location: "",
  startDate: "", endDate: "", type: "Worship",
  imageUrl: "", gallery: [] as string[], videoUrl: "",
  theme: "brown", layout: "banner", isPublic: true,
};

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [uploading, setUploading] = useState<"hero" | "gallery" | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchEvents(); }, []);

  /** Upload straight to Vercel Blob via the shared upload route. */
  const uploadImage = async (file: File): Promise<string> => {
    const { upload } = await import("@vercel/blob/client");
    const blob = await upload(file.name, file, {
      access: "public",
      handleUploadUrl: "/api/upload",
    });
    return blob.url;
  };

  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading("hero");
    setUploadError(null);
    try {
      const url = await uploadImage(file);
      setForm((f) => ({ ...f, imageUrl: url }));
    } catch (err: any) {
      setUploadError(err?.message ?? "Upload failed");
    } finally {
      setUploading(null);
      if (heroInputRef.current) heroInputRef.current.value = "";
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploading("gallery");
    setUploadError(null);
    try {
      const urls: string[] = [];
      for (const file of files.slice(0, 12)) {
        urls.push(await uploadImage(file));
      }
      setForm((f) => ({ ...f, gallery: [...f.gallery, ...urls].slice(0, 24) }));
    } catch (err: any) {
      setUploadError(err?.message ?? "Upload failed");
    } finally {
      setUploading(null);
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  };

  const fetchEvents = async () => {
    setLoading(true);
    // Explicit high limit: the API defaults to 20 ordered by startDate asc,
    // which silently hides everything past the twentieth-oldest event.
    const res = await fetch("/api/events?limit=500");
    setEvents(await res.json());
    setLoading(false);
  };

  const createEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    if (editingId) {
      // Update existing event
      await fetch(`/api/events?id=${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else {
      // Create new event
      await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }

    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    fetchEvents();
    setSaving(false);
  };

  const editEvent = (event: Event) => {
    setForm({
      title: event.title,
      description: event.description || "",
      body: event.body || "",
      location: event.location || "",
      startDate: event.startDate.slice(0, 16),
      endDate: event.endDate ? event.endDate.slice(0, 16) : "",
      type: event.type || "Worship",
      imageUrl: event.imageUrl || "",
      gallery: event.gallery ?? [],
      videoUrl: event.videoUrl || "",
      theme: event.theme || "brown",
      layout: event.layout || "banner",
      isPublic: event.isPublic,
    });
    setEditingId(event.id);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setUploadError(null);
  };

  const deleteEvent = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    await fetch(`/api/events?id=${id}`, { method: "DELETE" });
    fetchEvents();
  };

  const upcoming = events.filter(e => new Date(e.startDate) >= new Date());
  // Most recent first — the event you just ran is the one you are most
  // likely to be adding photos to.
  const past = events
    .filter(e => new Date(e.startDate) < new Date())
    .sort((a, b) => +new Date(b.startDate) - +new Date(a.startDate));

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-800">Events</h1>
          <p className="text-gray-500 mt-1">{upcoming.length} upcoming · {past.length} past</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-brown-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-brown-800 shadow-sm">
          <Plus className="w-4 h-4"/> New Event
        </button>
      </div>

      {/* Create/Edit modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-gray-800 text-xl">{editingId ? "Edit Event" : "Create Event"}</h2>
              <button onClick={closeForm}><X className="w-5 h-5 text-gray-400"/></button>
            </div>
            <form onSubmit={createEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Title *</label>
                <input type="text" required value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                  placeholder="Event title" className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}
                    className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500">
                    {eventTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Visibility</label>
                  <select value={form.isPublic ? "true" : "false"} onChange={e => setForm({...form, isPublic: e.target.value === "true"})}
                    className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500">
                    <option value="true">Public</option>
                    <option value="false">Members Only</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
                <input type="text" value={form.location} onChange={e => setForm({...form, location: e.target.value})}
                  placeholder="Fellowship Hall, Room 2..." className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date & Time *</label>
                  <input type="datetime-local" required value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})}
                    className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date & Time</label>
                  <input type="datetime-local" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})}
                    className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"/>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Short summary</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                  placeholder="One or two lines, shown on event cards and link previews..." rows={2}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 resize-none"/>
              </div>

              {/* ── Full write-up ──────────────────────────── */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full write-up</label>
                <textarea value={form.body} onChange={e => setForm({...form, body: e.target.value})}
                  placeholder={"Write the full details here.\n\n# A heading\n## A smaller heading\n\n- a bullet point\n1. a numbered point\n> a quote\n\n**bold**, *italic*, and [a link](https://example.com)"}
                  rows={9}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 resize-y font-mono"/>
                <p className="text-xs text-gray-400 mt-1.5">
                  Blank line starts a new paragraph. <code className="bg-gray-100 px-1 rounded">#</code> heading,
                  <code className="bg-gray-100 px-1 rounded ml-1">-</code> bullet,
                  <code className="bg-gray-100 px-1 rounded ml-1">**bold**</code>,
                  <code className="bg-gray-100 px-1 rounded ml-1">[link](url)</code>
                </p>
              </div>

              {/* ── Photos ─────────────────────────────────── */}
              <div className="border-t border-gray-100 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Main photo</label>
                <input type="file" ref={heroInputRef} accept="image/*" onChange={handleHeroUpload} className="hidden"/>
                {form.imageUrl ? (
                  <div className="flex items-center gap-3">
                    <img src={form.imageUrl} alt="" className="w-24 h-16 object-cover rounded-lg border border-gray-200"/>
                    <button type="button" onClick={() => heroInputRef.current?.click()}
                      className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50">Replace</button>
                    <button type="button" onClick={() => setForm({...form, imageUrl: ""})}
                      className="text-xs text-gray-400 hover:text-red-500">Remove</button>
                  </div>
                ) : (
                  <button type="button" onClick={() => heroInputRef.current?.click()} disabled={uploading === "hero"}
                    className="flex items-center gap-2 text-sm border border-dashed border-gray-300 text-gray-500 px-4 py-2.5 rounded-lg hover:border-brown-300 hover:text-brown-600 transition-colors disabled:opacity-50">
                    <ImagePlus className="w-4 h-4"/>
                    {uploading === "hero" ? "Uploading…" : "Upload main photo"}
                  </button>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photo gallery {form.gallery.length > 0 && <span className="text-gray-400 font-normal">({form.gallery.length})</span>}
                </label>
                <input type="file" ref={galleryInputRef} accept="image/*" multiple onChange={handleGalleryUpload} className="hidden"/>
                {form.gallery.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {form.gallery.map((url) => (
                      <div key={url} className="relative group">
                        <img src={url} alt="" className="w-full h-16 object-cover rounded-lg border border-gray-200"/>
                        <button type="button"
                          onClick={() => setForm({...form, gallery: form.gallery.filter(g => g !== url)})}
                          className="absolute -top-1.5 -right-1.5 bg-white border border-gray-200 rounded-full p-0.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="w-3 h-3 text-red-500"/>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <button type="button" onClick={() => galleryInputRef.current?.click()} disabled={uploading === "gallery"}
                  className="flex items-center gap-2 text-sm border border-dashed border-gray-300 text-gray-500 px-4 py-2 rounded-lg hover:border-brown-300 hover:text-brown-600 transition-colors disabled:opacity-50">
                  <ImagePlus className="w-4 h-4"/>
                  {uploading === "gallery" ? "Uploading…" : "Add photos"}
                </button>
              </div>

              {uploadError && (
                <p className="text-xs text-red-500">{uploadError}</p>
              )}

              {/* ── Video ──────────────────────────────────── */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Video link</label>
                <div className="relative">
                  <Youtube className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"/>
                  <input type="url" value={form.videoUrl} onChange={e => setForm({...form, videoUrl: e.target.value})}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full h-10 rounded-lg border border-gray-200 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"/>
                </div>
                {form.videoUrl && (
                  parseVideoEmbed(form.videoUrl)
                    ? <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1"><Check className="w-3 h-3"/> Video recognised — it will play on the event page</p>
                    : <p className="text-xs text-amber-600 mt-1.5">Not a recognised YouTube or Vimeo link — it will be ignored</p>
                )}
                <p className="text-xs text-gray-400 mt-1.5">
                  Upload the video to YouTube (unlisted is fine), then paste the link here.
                </p>
              </div>

              {/* ── Appearance ─────────────────────────────── */}
              <div className="border-t border-gray-100 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Colour theme</label>
                <div className="flex flex-wrap gap-2">
                  {EVENT_THEMES.map(t => (
                    <button key={t.key} type="button" onClick={() => setForm({...form, theme: t.key})}
                      className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg border transition-colors ${
                        form.theme === t.key ? "border-gold-500 bg-gold-50 text-brown-800 font-medium" : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}>
                      <span className={`w-3.5 h-3.5 rounded-full ${t.swatch}`}/>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Page layout</label>
                <div className="grid sm:grid-cols-3 gap-2">
                  {EVENT_LAYOUTS.map(l => (
                    <button key={l.key} type="button" onClick={() => setForm({...form, layout: l.key})}
                      className={`text-left px-3 py-2.5 rounded-lg border transition-colors ${
                        form.layout === l.key ? "border-gold-500 bg-gold-50" : "border-gray-200 hover:border-gray-300"
                      }`}>
                      <p className="text-xs font-medium text-gray-800">{l.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5 leading-snug">{l.hint}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeForm} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-brown-800 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-brown-800 disabled:opacity-50">
                  {saving ? (editingId ? "Updating..." : "Creating...") : (editingId ? "Update Event" : "Create Event")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><svg className="animate-spin w-8 h-8 text-gold-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg></div>
      ) : (
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-600 text-sm uppercase tracking-wider">Upcoming</h2>
          {upcoming.length === 0 && <p className="text-gray-400 text-sm">No upcoming events.</p>}
          {upcoming.map(event => (
            <div key={event.id} className="bg-white border border-brown-200 rounded-2xl p-5 flex gap-4 items-start shadow-sm">
              <div className="shrink-0 bg-brown-50 rounded-xl px-3 py-2 text-center border border-brown-200 min-w-[52px]">
                <p className="text-xs font-bold text-gold-600 uppercase">{new Date(event.startDate).toLocaleDateString("en-GB",{month:"short"})}</p>
                <p className="font-display font-bold text-brown-700 text-xl leading-none">{new Date(event.startDate).getDate()}</p>
              </div>
              <div className="flex-1">
                <div className="flex items-start gap-2">
                  <h3 className="font-semibold text-gray-800">{event.title}</h3>
                  {event.isPublic ? <Globe className="w-4 h-4 text-gold-400 mt-0.5 shrink-0"/> : <Lock className="w-4 h-4 text-gray-300 mt-0.5 shrink-0"/>}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{formatDateTime(event.startDate)}{event.location && ` · ${event.location}`}</p>
                {event.description && <p className="text-sm text-gray-400 mt-1.5 line-clamp-2">{event.description}</p>}
              </div>
              <div className="flex gap-1 shrink-0">
                <a href={eventPath(event)} target="_blank" rel="noreferrer"
                  title="View the event page"
                  className="text-gray-300 hover:text-gold-600 transition-colors p-1">
                  <ExternalLink className="w-4 h-4"/>
                </a>
                <button onClick={() => editEvent(event)} className="text-gray-300 hover:text-gold-600 transition-colors p-1">
                  <Edit2 className="w-4 h-4"/>
                </button>
                <button onClick={() => deleteEvent(event.id)} className="text-gray-300 hover:text-red-400 transition-colors p-1">
                  <Trash2 className="w-4 h-4"/>
                </button>
              </div>
            </div>
          ))}

          {past.length > 0 && (
            <>
              <h2 className="font-semibold text-gray-400 text-sm uppercase tracking-wider mt-6">
                Past ({past.length})
              </h2>
              {past.map(event => (
                <div key={event.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex gap-4 items-center">
                  {event.isPublic
                    ? <Globe className="w-4 h-4 text-gold-400 shrink-0"/>
                    : <Lock className="w-4 h-4 text-gray-300 shrink-0"/>}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-700 text-sm truncate">{event.title}</p>
                    <p className="text-xs text-gray-400">{formatDateTime(event.startDate)}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <a href={eventPath(event)} target="_blank" rel="noreferrer"
                      title="View the event page"
                      className="text-gray-300 hover:text-gold-600 transition-colors p-1">
                      <ExternalLink className="w-4 h-4"/>
                    </a>
                    <button onClick={() => editEvent(event)}
                      title="Edit — add photos, video or a write-up"
                      className="text-gray-300 hover:text-gold-600 transition-colors p-1">
                      <Edit2 className="w-4 h-4"/>
                    </button>
                    <button onClick={() => deleteEvent(event.id)}
                      title="Delete"
                      className="text-gray-300 hover:text-red-400 transition-colors p-1">
                      <Trash2 className="w-4 h-4"/>
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
