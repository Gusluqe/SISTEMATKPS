export default function DashboardLoading() {
  return (
    <div className="flex-1 p-6 space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="h-16 bg-[#0d0d1a]/80 border-b border-white/[0.06] -mx-6 -mt-6 mb-6 px-6 flex items-center gap-3">
        <div className="h-5 w-32 rounded-lg skeleton" />
      </div>

      {/* Metric cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-[#12121f] border border-white/[0.07] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-3 w-24 rounded skeleton" />
              <div className="w-9 h-9 rounded-xl skeleton" />
            </div>
            <div className="h-8 w-16 rounded skeleton" />
            <div className="h-3 w-28 rounded skeleton" />
          </div>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-[#12121f] border border-white/[0.07] rounded-2xl p-5">
            <div className="h-3 w-36 rounded skeleton mb-5" />
            <div className="h-[220px] rounded-xl skeleton" />
          </div>
        ))}
      </div>

      {/* Recent tickets skeleton */}
      <div className="bg-[#12121f] border border-white/[0.07] rounded-2xl">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <div className="h-4 w-40 rounded skeleton" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-white/[0.04] last:border-0">
            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <div className="h-3 w-20 rounded skeleton" />
                <div className="h-3 w-14 rounded skeleton" />
              </div>
              <div className="h-4 w-64 rounded skeleton" />
              <div className="h-3 w-40 rounded skeleton" />
            </div>
            <div className="h-3 w-16 rounded skeleton" />
          </div>
        ))}
      </div>
    </div>
  );
}
