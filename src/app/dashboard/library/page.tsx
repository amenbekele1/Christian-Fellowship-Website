"use client";

import { useState, useEffect } from "react";
import { BookOpen, Search, Book, CheckCircle, Clock, AlertCircle } from "lucide-react";

interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  coverImage: string | null;
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
  "Christian Living": "bg-green-100 text-green-700",
  "Apologetics": "bg-blue-100 text-blue-700",
  "Devotional": "bg-amber-100 text-amber-700",
  "Fiction": "bg-rose-100 text-rose-700",
  "Biography": "bg-teal-100 text-teal-700",
};

export default function LibraryPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [myRentals, setMyRentals] = useState<Rental[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"browse" | "my-books">("browse");

  useEffect(() => {
    fetchBooks();
    fetchMyRentals();
  }, []);

  const fetchBooks = async (q?: string) => {
    setLoading(true);
    try {
      const url = q ? `/api/books?search=${encodeURIComponent(q)}` : "/api/books";
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
    fetchBooks(search);
  };

  const reserveBook = async (bookId: string) => {
    setReserving(bookId);
    setMessage(null);
    try {
      const res = await fetch("/api/books/rentals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({ type: "success", text: "Book reserved! Collect it during Saturday service." });
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
          message.type === "success" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"
        }`}>
          {message.type === "success" ? <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />}
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        <button
          onClick={() => setActiveTab("browse")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "browse" ? "bg-white text-green-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          Browse Books ({books.length})
        </button>
        <button
          onClick={() => setActiveTab("my-books")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "my-books" ? "bg-white text-green-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          My Reservations ({myRentals.filter(r => r.status === "ACTIVE").length})
        </button>
      </div>

      {activeTab === "browse" && (
        <>
          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title or author..."
                className="w-full pl-10 pr-4 h-10 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <button type="submit" className="bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-800 transition-colors">
              Search
            </button>
          </form>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <svg className="animate-spin w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {books.map((book) => {
                const alreadyReserved = activeRentalIds.includes(book.id);
                return (
                  <div key={book.id} className="bg-white rounded-2xl border border-green-100 shadow-sm overflow-hidden flex flex-col card-hover">
                    {/* Book cover placeholder */}
                    <div className="h-36 bg-gradient-to-br from-green-700 to-green-900 flex items-center justify-center">
                      <div className="text-center">
                        <BookOpen className="w-10 h-10 text-white/30 mx-auto mb-1" />
                        <p className="text-white/50 text-xs">📖</p>
                      </div>
                    </div>

                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1">
                          <h3 className="font-display font-bold text-gray-800 leading-tight">{book.title}</h3>
                          <p className="text-sm text-green-600 mt-0.5">{book.author}</p>
                        </div>
                        {book.category && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${categoryColors[book.category] || "bg-gray-100 text-gray-600"}`}>
                            {book.category}
                          </span>
                        )}
                      </div>

                      {book.description && (
                        <p className="text-xs text-gray-500 leading-relaxed mb-4 line-clamp-3 flex-1">
                          {book.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${book.availableQty > 0 ? "bg-green-500" : "bg-red-400"}`} />
                          <span className="text-xs text-gray-500">
                            {book.availableQty > 0 ? `${book.availableQty} available` : "Unavailable"}
                          </span>
                        </div>
                        <button
                          onClick={() => reserveBook(book.id)}
                          disabled={book.availableQty === 0 || alreadyReserved || reserving === book.id}
                          className="text-xs bg-green-700 text-white px-3 py-1.5 rounded-lg hover:bg-green-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                        >
                          {reserving === book.id ? "..." : alreadyReserved ? "Reserved ✓" : book.availableQty === 0 ? "Unavailable" : "Reserve"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {books.length === 0 && !loading && (
                <div className="col-span-3 text-center py-16 text-gray-400">
                  <Book className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No books found. Try a different search.</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {activeTab === "my-books" && (
        <div className="space-y-4">
          {myRentals.length === 0 ? (
            <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-green-100">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium mb-1">No book reservations yet</p>
              <p className="text-sm">Browse our library and reserve a book to get started!</p>
              <button onClick={() => setActiveTab("browse")} className="mt-4 text-green-700 font-medium text-sm hover:underline">
                Browse Library →
              </button>
            </div>
          ) : (
            myRentals.map((rental) => (
              <div key={rental.id} className="bg-white border border-green-100 rounded-2xl p-5 flex items-center gap-5">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                  <BookOpen className="w-6 h-6 text-green-600" />
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
                  rental.status === "ACTIVE" ? "bg-green-100 text-green-700 border-green-200" :
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
