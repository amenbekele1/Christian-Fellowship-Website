"use client";

import { useState, useEffect } from "react";
import { Plus, Calendar, Trash2, X, Globe, Lock, Edit2 } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface Event {
  id: string; title: string; description: string | null; location: string | null;
  startDate: string; endDate: string | null; type: string | null; isPublic: boolean;
}

const eventTypes = ["Worship", "Worship Night", "Bible Study", "Sermon", "Literature Night", "BUS Meeting", "Other"];

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", location: "", startDate: "", endDate: "", type: "Worship", isPublic: true,
  });

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    setLoading(true);
    const res = await fetch("/api/events");
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
    setForm({ title: "", description: "", location: "", startDate: "", endDate: "", type: "Worship", isPublic: true });
    fetchEvents();
    setSaving(false);
  };

  const editEvent = (event: Event) => {
    setForm({
      title: event.title,
      description: event.description || "",
      location: event.location || "",
      startDate: event.startDate.slice(0, 16),
      endDate: event.endDate ? event.endDate.slice(0, 16) : "",
      type: event.type || "Worship",
      isPublic: event.isPublic,
    });
    setEditingId(event.id);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ title: "", description: "", location: "", startDate: "", endDate: "", type: "Worship", isPublic: true });
  };

  const deleteEvent = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    await fetch(`/api/events?id=${id}`, { method: "DELETE" });
    fetchEvents();
  };

  const upcoming = events.filter(e => new Date(e.startDate) >= new Date());
  const past = events.filter(e => new Date(e.startDate) < new Date());

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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                  placeholder="Event description..." rows={3}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 resize-none"/>
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
              <h2 className="font-semibold text-gray-400 text-sm uppercase tracking-wider mt-6">Past</h2>
              {past.slice(0, 5).map(event => (
                <div key={event.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex gap-4 items-center opacity-60">
                  <Calendar className="w-5 h-5 text-gray-300 shrink-0"/>
                  <div className="flex-1">
                    <p className="font-medium text-gray-600 text-sm">{event.title}</p>
                    <p className="text-xs text-gray-400">{formatDateTime(event.startDate)}</p>
                  </div>
                  <button onClick={() => deleteEvent(event.id)} className="text-gray-200 hover:text-red-300 p-1">
                    <Trash2 className="w-4 h-4"/>
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
