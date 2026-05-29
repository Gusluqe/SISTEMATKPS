export default function TicketsLoading() {
  return (
    <div className="flex-1 p-6 space-y-4 animate-pulse">
      {/* Filters skeleton */}
      <div className="flex flex-wrap gap-3">
        <div className="h-9 flex-1 min-w-[200px] rounded-xl skeleton" />
        <div className="h-9 w-36 rounded-xl skeleton" />
        <div className="h-9 w-36 rounded-xl skeleton" />
        <div className="h-9 w-32 rounded-xl skeleton" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-2xl border border-white/[0.07] overflow-hidden">
        <div className="bg-[#0d0d1a] px-4 py-3 flex gap-4">
          {["w-20", "flex-1", "w-24", "w-20", "w-24", "w-28", "w-24", "w-20"].map((w, i) => (
            <div key={i} className={`h-3 ${w} rounded skeleton`} />
          ))}
        </div>
        <div className="bg-[#12121f] divide-y divide-white/[0.04]">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="px-4 py-3.5 flex items-center gap-4">
              <div className="h-4 w-24 rounded skeleton" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-48 rounded skeleton" />
                <div className="h-3 w-24 rounded skeleton" />
              </div>
              <div className="h-5 w-20 rounded-full skeleton" />
              <div className="h-5 w-16 rounded-full skeleton" />
              <div className="h-3 w-16 rounded skeleton" />
              <div className="space-y-1">
                <div className="h-3 w-24 rounded skeleton" />
                <div className="h-2.5 w-32 rounded skeleton" />
              </div>
              <div className="h-3 w-20 rounded skeleton" />
              <div className="h-3 w-16 rounded skeleton" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
