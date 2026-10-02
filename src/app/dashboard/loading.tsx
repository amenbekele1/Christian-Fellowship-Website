/**
 * Shown instantly while a dashboard page loads its data, so opening the app
 * paints the portal (sidebar + placeholders) instead of a blank screen.
 */
function Block({ className = "", dark = false }: { className?: string; dark?: boolean }) {
  return (
    <div
      className={`rounded-2xl animate-pulse ${className}`}
      style={{ background: dark ? "#2C1A0E" : "#fff", border: dark ? "none" : "1px solid #E0CBB0" }}
    />
  );
}

export default function DashboardLoading() {
  return (
    <div className="max-w-6xl mx-auto" aria-busy="true" aria-label="Loading">
      <div className="mb-8 space-y-2">
        <div className="h-8 w-64 rounded-lg animate-pulse" style={{ background: "#E8DCC8" }} />
        <div className="h-4 w-40 rounded animate-pulse" style={{ background: "#F0E6D3" }} />
      </div>
      <Block dark className="h-36 mb-6" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[0, 1, 2, 3].map((i) => <Block key={i} className="h-24" />)}
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <Block className="lg:col-span-2 h-72" />
        <Block className="h-72" />
      </div>
    </div>
  );
}
