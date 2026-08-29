/**
 * RatingStars - Shared star rating display
 *
 * Usage:
 * <RatingStars rating={4.5} size="sm" count={12} />
 */
const STAR_CLIP =
  'polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)';

export default function RatingStars({ rating = 0, size = 'sm', count, showCount = true }) {
  const starSize = size === 'md' ? 'w-4 h-4 sm:w-5 sm:h-5' : size === 'lg' ? 'w-5 h-5' : 'w-[11px] h-[11px] sm:w-[12px] sm:h-[12px]';

  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-[1px]" role="img" aria-label={`Rated ${rating} out of 5 stars`}>
        {[...Array(5)].map((_, i) => {
          const fill = Math.max(0, Math.min(1, rating - i));
          return (
            <div
              key={i}
              className={`${starSize} bg-[var(--color-border-secondary)] relative`}
              style={{ clipPath: STAR_CLIP }}
            >
              {fill > 0 && (
                <div
                  className="absolute inset-0 bg-[#FFB020]"
                  style={{ clipPath: STAR_CLIP, width: `${fill * 100}%` }}
                />
              )}
            </div>
          );
        })}
      </div>
      {showCount && count !== undefined && count !== null && (
        <span className="text-xs sm:text-xs text-[var(--color-text-secondary)]">({count})</span>
      )}
    </div>
  );
}
