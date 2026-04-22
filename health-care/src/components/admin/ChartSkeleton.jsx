/**
 * ChartSkeleton - Loading placeholder for analytics chart components
 * Displayed while the recharts bundle is being lazy-loaded
 */
export default function ChartSkeleton() {
  return (
    <div className="bg-white rounded-lg p-5 border-[0.5px] border-[var(--color-border-tertiary)] animate-pulse">
      {/* Chart title placeholder */}
      <div className="h-4 bg-gray-300 rounded w-48 mb-4"></div>

      {/* Y-axis labels + bars area */}
      <div className="flex gap-3 items-end h-48">
        {/* Y-axis */}
        <div className="flex flex-col justify-between h-full pb-1">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-3 bg-gray-200 rounded w-8"></div>
          ))}
        </div>

        {/* Bar columns */}
        <div className="flex-1 flex items-end gap-2 h-full">
          {[60, 85, 45, 90, 70].map((height, i) => (
            <div
              key={i}
              className="flex-1 bg-gray-200 rounded-t"
              style={{ height: `${height}%` }}
            ></div>
          ))}
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex gap-2 mt-2 pl-11">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex-1 h-3 bg-gray-200 rounded"></div>
        ))}
      </div>
    </div>
  );
}
