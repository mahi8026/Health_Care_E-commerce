export default function SearchLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="animate-pulse space-y-6">
        <div className="h-10 bg-gray-200 rounded-full w-full max-w-2xl mx-auto" />
        <div className="flex gap-4">
          <div className="hidden lg:block w-64 space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-32 bg-gray-200 rounded w-full" />
            <div className="h-24 bg-gray-200 rounded w-full" />
          </div>
          <div className="flex-1">
            <div className="h-8 bg-gray-200 rounded w-48 mb-6" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="rounded-xl overflow-hidden border border-gray-100">
                  <div className="h-[200px] bg-gray-200" />
                  <div className="p-4 space-y-3">
                    <div className="h-3 bg-gray-200 rounded w-16" />
                    <div className="h-4 bg-gray-200 rounded w-full" />
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-5 bg-gray-200 rounded w-24" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
