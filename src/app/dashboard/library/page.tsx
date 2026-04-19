"use client";

import { useState, useEffect } from "react";
import { BookOpen, Search, Book, CheckCircle, Clock, AlertCircle, X } from "lucide-react";

interface Book {
  id: string;
  title: string;
  author: string;
  translatedBy: string | null;
  description: string;
  coverImage: string | null;
  imageUrl: string | null;
  totalQuantity: number;
  availableQty: number;
  category: string | null;
  publishedYear: number | null;
}

interface Rental {
  id: string;
  status: string;
  reservedAt: string;
  dueDate: string | null;
  book: { id: string; title: string; author: string };
}

const categoryColors: Record<string, string> = {
  "Theology": "bg-purple-100 text-purple-700",
  "Christian Living": "bg-brown-100 text-gold-500",
  "Apologetics": "bg-blue-100 text-blue-700",
  "Devotional": "bg-amber-100 text-amber-700",
  "Fiction": "bg-rose-100 text-rose-700",
  "Biography": "bg-teal-100 text-teal-700",
};

export default function LibraryPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [myRentals, setMyRentals] = useState<Rental[]>([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"browse" | "my-books">("browse");
  const [showDatePicker, setShowDatePicker] = useState<string | null>(null);
  const [pickupDate, setPickupDate] = useState<string>("");
  const [returnDate, setReturnDate] = useState<string>("");
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchBooks();
    fetchMyRentals();
  }, []);

  const fetchBooks = async (q?: string, cat?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q)   params.set("search",   q);
      if (cat) params.set("category", cat);
      const url = params.size ? `/api/books?${params}` : "/api/books";
      const res = await fetch(url);
      const data = await res.json();
      setBooks(data);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyRentals = async () => {
    const res = await fetch("/api/books/rentals?mine=true");
    const data = await res.json();
    setMyRentals(Array.isArray(data) ? data : []);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBooks(search, activeCategory);
  };

  const handleCategoryFilter = (cat: string) => {
    const next = cat === activeCategory ? "" : cat;
    setActiveCategory(next);
    fetchBooks(search, next);
  };

  // Get next Saturday
  const getNextSaturday = (): string => {
    const today = new Date();
    const day = today.getDay();
    const daysUntilSaturday = day === 0 ? 6 : (6 - day + 7) % 7 || 7;
    const nextSat = new Date(today);
    nextSat.setDate(nextSat.getDate() + daysUntilSaturday);
    return nextSat.toISOString().split("T")[0];
  };

  // Check if date is Saturday
  const isSaturday = (dateStr: string): boolean => {
    const date = new Date(dateStr + "T00:00:00Z");
    return date.getUTCDay() === 6;
  };

  const openDatePicker = (bookId: string) => {
    setShowDatePicker(bookId);
    setPickupDate(getNextSaturday());
    setReturnDate("");
  };

  const closeDatePicker = () => {
    setShowDatePicker(null);
    setPickupDate("");
    setReturnDate("");
  };

  const reserveBook = async () => {
    if (!showDatePicker) return;
    if (!pickupDate || !returnDate) {
      setMessage({ type: "error", text: "Please select both pickup and return dates" });
      return;
    }
    if (!isSaturday(pickupDate)) {
      setMessage({ type: "error", text: "Pickup date must be a Saturday" });
      return;
    }

    setReserving(showDatePicker);
    setMessage(null);
    try {
      const res = await fetch("/api/books/rentals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId: showDatePicker, pickupDate, returnDate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({ type: "success", text: "Book reserved! Collect it on the selected date." });
      closeDatePicker();
      fetchBooks(search);
      fetchMyRentals();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setReserving(null);
    }
  };

  const activeRentalIds = myRentals.filter((r) => r.status === "ACTIVE").map((r) => r.book.id);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-gray-800">E-Library</h1>
        <p className="text-gray-500 mt-1">Browse and reserve books from our fellowship library. Collect during Saturday service.</p>
      </div>

      {message && (
        <div className={`mb-5 p-4 rounded-xl border flex items-start gap-3 ${
          message.type === "success" ? "bg-brown-50 border-brown-200 text-brown-700" : "bg-red-50 border-red-200 text-red-800"
        }`}>
          {message.type === "success" ? <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />}
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        <button
          onClick={() => setActiveTab("browse")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "browse" ? "bg-white text-gold-500 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          Browse Books ({books.length})
        </button>
        <button
          onClick={() => setActiveTab("my-books")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "my-books" ? "bg-white text-gold-500 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          My Reservations ({myRentals.filter(r => r.status === "ACTIVE").length})
        </button>
      </div>

      {activeTab === "browse" && (
        <>
          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, author or translator..."
                className="w-full pl-10 pr-4 h-10 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>
            <button type="submit" className="bg-brown-800 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-brown-800 transition-colors">
              Search
            </button>
          </form>

          {/* Category filter chips */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => handleCategoryFilter("")}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all border ${
                activeCategory === ""
                  ? "bg-brown-800 text-white border-brown-800"
                  : "bg-white text-gray-500 border-gray-200 hover:border-brown-300"
              }`}
            >
              All
            </button>
            {Object.keys(categoryColors).map(cat => (
              <button
                key={cat}
                onClick={() => handleCategoryFilter(cat)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all border ${
                  activeCategory === cat
                    ? `${categoryColors[cat]} border-transparent`
                    : "bg-white text-gray-500 border-gray-200 hover:border-brown-300"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <svg className="animate-spin w-8 h-8 text-gold-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
              {books.map((book) => {
                const alreadyReserved = activeRentalIds.includes(book.id);
                return (
                  <div key={book.id} className="bg-white rounded-2xl border border-brown-200 shadow-sm overflow-hidden flex flex-col card-hover">
                    {/* Book cover image or placeholder */}
                    <div
                      className="aspect-[2/3] bg-gradient-to-br from-brown-800 to-brown-900 flex items-center justify-center overflow-hidden cursor-pointer"
                      onClick={() => book.imageUrl && setCoverPreview(book.imageUrl)}
                    >
                      {book.imageUrl ? (
                        <img src={book.imageUrl} alt={book.title} className="w-full h-full object-contain" />
                      ) : (
                        <div className="text-center">
                          <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-white/30 mx-auto mb-1" />
                        </div>
                      )}
                    </div>

                    <div className="p-3 sm:p-5 flex flex-col flex-1">
                      <div className="mb-2">
                        <h3 className="font-display font-bold text-gray-800 text-xs sm:text-base leading-tight line-clamp-2">{book.title}</h3>
                        <p className="text-xs text-gold-600 mt-0.5 line-clamp-1">{book.author}</p>
                        {book.translatedBy && (
                          <p className="text-xs text-gray-400 mt-0.5 italic line-clamp-1">Trans. {book.translatedBy}</p>
                        )}
                        {book.category && (
                          <span className={`inline-block text-xs px-1.5 py-0.5 rounded-full font-medium mt-1 ${categoryColors[book.category] || "bg-gray-100 text-gray-600"}`}>
                            {book.category}
                          </span>
                        )}
                      </div>

                      {book.description && (
                        <p className="hidden sm:block text-xs text-gray-500 leading-relaxed mb-3 line-clamp-3 flex-1">
                          {book.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
                        <div className="flex items-center gap-1">
                          <div className={`w-1.5 h-1.5 rounded-full ${book.availableQty > 0 ? "bg-gold-500" : "bg-red-400"}`} />
                          <span className="text-xs text-gray-500">
                            {book.availableQty > 0 ? `${book.availableQty}` : "Out"}
                          </span>
                        </div>
                        <button
                          onClick={() => openDatePicker(book.id)}
                          disabled={book.availableQty === 0 || alreadyReserved || reserving === book.id}
                          className="text-xs bg-brown-800 text-white px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg hover:bg-brown-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                        >
                          {reserving === book.id ? "..." : alreadyReserved ? "✓" : book.availableQty === 0 ? "Out" : "Reserve"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {books.length === 0 && !loading && (
                <div className="col-span-2 lg:col-span-3 text-center py-16 text-gray-400">
                  <Book className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>
                    {activeCategory
                      ? `No ${activeCategory} books found.`
                      : "No books found. Try a different search."}
                  </p>
                  {(search || activeCategory) && (
                    <button
                      onClick={() => { setSearch(""); setActiveCategory(""); fetchBooks(); }}
                      className="mt-3 text-sm text-gold-600 hover:underline"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Cover image lightbox */}
          {coverPreview && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setCoverPreview(null)}>
              <div className="relative max-h-[90vh] max-w-sm w-full">
                <img src={coverPreview} alt="Book cover" className="w-full h-full object-contain rounded-xl shadow-2xl" />
                <button onClick={() => setCoverPreview(null)} className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 hover:bg-black/80">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {showDatePicker && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-display font-bold text-gray-800 text-xl">Select Rental Dates</h2>
                  <button onClick={closeDatePicker} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Pickup Date (Saturdays only)</label>
                    <input
                      type="date"
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                      className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
                    />
                    {pickupDate && !isSaturday(pickupDate) && (
                      <p className="text-xs text-red-500 mt-1">Please select a Saturday</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Return Date</label>
                    <input
                      type="date"
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      min={pickupDate ? new Date(new Date(pickupDate).getTime() + 86400000).toISOString().split("T")[0] : ""}
                      max={pickupDate ? new Date(new Date(pickupDate).getTime() + 30 * 86400000).toISOString().split("T")[0] : ""}
                      className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
                    />
                    {pickupDate && returnDate && (
                      <p className="text-xs text-gray-500 mt-1">
                        {Math.floor((new Date(returnDate).getTime() - new Date(pickupDate).getTime()) / 86400000)} days
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button onClick={closeDatePicker} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium">
                      Cancel
                    </button>
                    <button
                      onClick={reserveBook}
                      disabled={!pickupDate || !returnDate || !isSaturday(pickupDate) || reserving === showDatePicker}
                      className="flex-1 bg-brown-800 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-brown-800 disabled:opacity-50 transition-colors"
                    >
                      {reserving === showDatePicker ? "Reserving..." : "Reserve Book"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === "my-books" && (
        <div className="space-y-4">
          {myRentals.length === 0 ? (
            <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-brown-200">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium mb-1">No book reservations yet</p>
              <p className="text-sm">Browse our library and reserve a book to get started!</p>
              <button onClick={() => setActiveTab("browse")} className="mt-4 text-gold-500 font-medium text-sm hover:underline">
                Browse Library →
              </button>
            </div>
          ) : (
            myRentals.map((rental) => (
              <div key={rental.id} className="bg-white border border-brown-200 rounded-2xl p-5 flex items-center gap-5">
                <div className="w-12 h-12 bg-brown-100 rounded-xl flex items-center justify-center shrink-0">
                  <BookOpen className="w-6 h-6 text-gold-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{rental.book.title}</h3>
                  <p className="text-sm text-gray-500">{rental.book.author}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-gray-400">
                      Reserved: {new Date(rental.reservedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    {rental.dueDate && (
                      <span className="text-xs text-amber-600 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Due: {new Date(rental.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </span>
                    )}
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
                  rental.status === "ACTIVE" ? "bg-brown-100 text-gold-500 border-brown-200" :
                  rental.status === "OVERDUE" ? "bg-red-100 text-red-700 border-red-200" :
                  "bg-gray-100 text-gray-600 border-gray-200"
                }`}>
                  {rental.status}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
