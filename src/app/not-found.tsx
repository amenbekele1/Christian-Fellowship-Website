import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-brown-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-7xl font-display font-bold text-brown-200 mb-2">404</div>
        <svg className="w-12 h-12 mx-auto mb-6 text-brown-300" viewBox="0 0 100 100" fill="currentColor" aria-hidden="true"><path d="M42,5 H58 V30 H90 V46 H58 V95 H42 V46 H10 V30 H42 Z"/></svg>
        <h1 className="font-display text-2xl font-bold text-gray-800 mb-3">
          Page Not Found
        </h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          This page does not exist. Perhaps you were looking for something else in
          our fellowship?
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="bg-brown-800 text-white font-semibold px-6 py-3 rounded-xl hover:bg-brown-800 transition-colors"
          >
            Go Home
          </Link>
          <Link
            href="/dashboard"
            className="border border-brown-200 text-gold-500 font-medium px-6 py-3 rounded-xl hover:bg-brown-50 transition-colors"
          >
            My Dashboard
          </Link>
        </div>
        <p className="text-xs text-gray-400 mt-10 italic">
          "I am the way and the truth and the life." — John 14:6
        </p>
      </div>
    </div>
  );
}
