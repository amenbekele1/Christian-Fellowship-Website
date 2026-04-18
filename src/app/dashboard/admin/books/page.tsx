"use client";

import { useState, useEffect } from "react";
import { Plus, BookMarked, Trash2, X, BookOpen, Pencil } from "lucide-react";

interface Book {
  id: string; title: string; author: string; translatedBy: string | null;
  description: string | null; totalQuantity: number; availableQty: number;
  category: string | null; publishedYear: number | null; isActive: boolean;
  imageUrl: string | null;
}
interface Rental {
  id: string; status: string; reservedAt: string; dueDate: string | null;
  user: { name: string; email: string };
  book: { title: string };
}

const EMPTY_FORM = {
  title: "", author: "", translatedBy: "", description: "", category: "",
  publishedYear: "", totalQuantity: "1", imageUrl: "",
};

export default function AdminBooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [activeTab, setActiveTab] = useState<"books" | "rentals">("books");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const [b, r] = await Promise.all([fetch("/api/books"), fetch("/api/books/rentals")]);
    setBooks(await b.json());
    const rentalData = await r.json();
    setRentals(Array.isArray(rentalData) ? rentalData : []);
    setLoading(false);
  };

  const openCreate = () => {
    setEditingBook(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (book: Book) => {
    setEditingBook(book);
    setForm({
      title: book.title,
      author: book.author,
      translatedBy: book.translatedBy || "",
      description: book.description || "",
      category: book.category || "",
      publishedYear: book.publishedYear?.toString() || "",
      totalQuantity: book.totalQuantity.toString(),
      imageUrl: book.imageUrl || "",
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingBook(null);
    setForm(EMPTY_FORM);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) setForm(f => ({ ...f, imageUrl: data.url }));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      totalQuantity: parseInt(form.totalQuantity),
      publishedYear: form.publishedYear ? parseInt(form.publishedYear) : undefined,
    };
    if (editingBook) {
      await fetch(`/api/books?id=${editingBook.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    closeForm();
    fetchData();
    setSaving(false);
  };

  const deleteBook = async (id: string) => {
    if (!confirm("Remove this book from the library?")) return;
    await fetch(`/api/books?id=${id}`, { method: "DELETE" });
    fetchData();
  };

  const returnBook = async (rentalId: string) => {
    await fetch(`/api/books/rentals?id=${rentalId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "return" }),
    });
    fetchData();
  };

  const activeRentals = rentals.filter(r => r.status === "ACTIVE" || r.status === "OVERDUE");

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-800">Library Management</h1>
          <p className="text-gray-500 mt-1">{books.length} books · {activeRentals.length} active rentals</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-brown-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-brown-800 shadow-sm">
          <Plus className="w-4 h-4"/> Add Book
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        <button onClick={() => setActiveTab("books")} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "books" ? "bg-white text-gold-500 shadow-sm" : "text-gray-500"}`}>
          Books ({books.length})
        </button>
        <button onClick={() => setActiveTab("rentals")} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "rentals" ? "bg-white text-gold-500 shadow-sm" : "text-gray-500"}`}>
          Active Rentals ({activeRentals.length})
        </button>
      </div>

      {/* Create / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-gray-800 text-xl">
                {editingBook ? "Edit Book" : "Add Book to Library"}
              </h2>
              <button onClick={closeForm}><X className="w-5 h-5 text-gray-400"/></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Title *</label>
                <input type="text" required value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                  placeholder="Book title" className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Author *</label>
                <input type="text" required value={form.author} onChange={e => setForm({...form, author: e.target.value})}
                  placeholder="Author name" className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Translated by</label>
                <input type="text" value={form.translatedBy} onChange={e => setForm({...form, translatedBy: e.target.value})}
                  placeholder="Translator name (if applicable)" className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                    className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500">
                    <option value="">Select...</option>
                    {["Theology","Christian Living","Apologetics","Devotional","Fiction","Biography","Other"].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Quantity</label>
                  <input type="number" min="1" value={form.totalQuantity} onChange={e => setForm({...form, totalQuantity: e.target.value})}
                    className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"/>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                  placeholder="Book description..." rows={3}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 resize-none"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Published Year</label>
                <input type="number" min="1800" max="2030" value={form.publishedYear} onChange={e => setForm({...form, publishedYear: e.target.value})}
                  placeholder="e.g. 1952" className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Book Cover Image</label>
                <div className="space-y-2">
                  {form.imageUrl && (
                    <div className="relative w-24 h-32 rounded-lg overflow-hidden border border-brown-200">
                      <img src={form.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setForm({...form, imageUrl: ""})}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 text-xs">✕</button>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading}
                    className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-brown-100 file:text-gold-500 hover:file:bg-brown-100"/>
                  {uploading && <p className="text-xs text-gold-600">Uploading...</p>}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeForm} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-brown-800 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-brown-800 disabled:opacity-50">
                  {saving ? (editingBook ? "Saving..." : "Adding...") : (editingBook ? "Save Changes" : "Add to Library")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cover image lightbox */}
      {coverPreview && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setCoverPreview(null)}>
          <div className="relative max-h-[90vh] max-w-sm w-full">
            <img src={coverPreview} alt="Book cover" className="w-full h-full object-contain rounded-xl shadow-2xl" />
            <button onClick={() => setCoverPreview(null)} className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 hover:bg-black/80">
              <X className="w-4 h-4"/>
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><svg className="animate-spin w-8 h-8 text-gold-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg></div>
      ) : activeTab === "books" ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {books.map(book => (
            <div key={book.id} className="bg-white border border-brown-200 rounded-2xl shadow-sm overflow-hidden">
              <div
                className="aspect-[2/3] bg-gradient-to-br from-brown-800 to-brown-900 flex items-center justify-center overflow-hidden cursor-pointer"
                onClick={() => book.imageUrl && setCoverPreview(book.imageUrl)}
              >
                {book.imageUrl ? (
                  <img src={book.imageUrl} alt={book.title} className="w-full h-full object-contain" />
                ) : (
                  <BookOpen className="w-8 h-8 text-white/30"/>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 text-sm leading-tight">{book.title}</h3>
                <p className="text-xs text-gold-600 mt-0.5">{book.author}</p>
                {book.translatedBy && <p className="text-xs text-gray-400 mt-0.5 italic">Trans. {book.translatedBy}</p>}
                {book.category && <p className="text-xs text-gray-400 mt-0.5">{book.category}</p>}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${book.availableQty > 0 ? "bg-gold-500" : "bg-red-400"}`}/>
                    <span className="text-xs text-gray-500">{book.availableQty}/{book.totalQuantity} available</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(book)} className="text-gray-300 hover:text-gold-600 transition-colors p-1" title="Edit book">
                      <Pencil className="w-3.5 h-3.5"/>
                    </button>
                    <button onClick={() => deleteBook(book.id)} className="text-gray-300 hover:text-red-400 transition-colors p-1" title="Delete book">
                      <Trash2 className="w-3.5 h-3.5"/>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {books.length === 0 && (
            <div className="col-span-3 text-center py-14 bg-white rounded-2xl border border-brown-200 text-gray-400">
              <BookMarked className="w-12 h-12 mx-auto mb-3 opacity-30"/>
              <p>No books in the library yet.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {activeRentals.length === 0 && <p className="text-center py-14 text-gray-400 bg-white rounded-2xl border border-brown-200">No active rentals.</p>}
          {activeRentals.map(rental => (
            <div key={rental.id} className={`bg-white border rounded-2xl p-4 flex items-center gap-4 shadow-sm ${rental.status === "OVERDUE" ? "border-red-200" : "border-brown-200"}`}>
              <BookOpen className={`w-8 h-8 shrink-0 ${rental.status === "OVERDUE" ? "text-red-300" : "text-brown-300"}`}/>
              <div className="flex-1">
                <p className="font-medium text-gray-800 text-sm">{rental.book.title}</p>
                <p className="text-xs text-gray-500">{rental.user.name} · {rental.user.email}</p>
                {rental.dueDate && (
                  <p className={`text-xs mt-0.5 ${rental.status === "OVERDUE" ? "text-red-500 font-medium" : "text-amber-600"}`}>
                    {rental.status === "OVERDUE" ? "⚠️ OVERDUE — " : "Due: "}
                    {new Date(rental.dueDate).toLocaleDateString("en-GB", {day:"numeric", month:"short", year:"numeric"})}
                  </p>
                )}
              </div>
              <button onClick={() => returnBook(rental.id)}
                className="bg-brown-800 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-brown-800 transition-colors font-medium shrink-0">
                Mark Returned
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
