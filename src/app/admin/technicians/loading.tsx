export default function TechniciansLoading() {
  return (
    <div className="flex-1 p-6 space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="h-16 bg-[#0e1d38]/80 border-b border-white/[0.06] -mx-6 -mt-6 mb-6 px-6 flex items-center gap-3">
        <div className="h-5 w-32 rounded-lg skeleton" />
      </div>

      {/* Technician rows skeleton */}
      <div className="bg-[#13233f] border border-white/[0.07] rounded-2xl">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-white/[0.04] last:border-0">
            <div className="w-9 h-9 rounded-xl skeleton flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 rounded skeleton" />
              <div className="h-3 w-56 rounded skeleton" />
            </div>
            <div className="h-6 w-16 rounded-full skeleton" />
          </div>
        ))}
      </div>
    </div>
  );
}
