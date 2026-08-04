'use client';

/**
 * RankingBadge Component
 * 
 * Displays a circular ranking badge with gradient styling for top 3 positions.
 * Used in Best Selling Section to show product ranking.
 * 
 * @param {Object} props
 * @param {number} props.rank - The ranking position (1, 2, 3, etc.)
 * @param {string} [props.size='medium'] - Size variant: 'small', 'medium', 'large'
 * @param {string} [props.className] - Additional CSS classes
 */
export default function RankingBadge({ rank, size = 'medium', className = '' }) {
  // Guard against missing or non-numeric rank
  if (!rank || typeof rank !== 'number') return null;

  // Get gradient based on rank
  const getRankGradient = (rank) => {
    switch (rank) {
      case 1:
        return 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)'; // Gold
      case 2:
        return 'linear-gradient(135deg, #C0C0C0 0%, #A9A9A9 100%)'; // Silver
      case 3:
        return 'linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)'; // Bronze
      default:
        return '#6B7280'; // Gray
    }
  };

  // Get box shadow based on rank
  const getRankShadow = (rank) => {
    switch (rank) {
      case 1:
        return '0 4px 12px rgba(255, 215, 0, 0.4)';
      case 2:
        return '0 4px 12px rgba(192, 192, 192, 0.4)';
      case 3:
        return '0 4px 12px rgba(205, 127, 50, 0.4)';
      default:
        return '0 2px 8px rgba(0, 0, 0, 0.15)';
    }
  };

  // Size configurations
  const sizeConfig = {
    small: {
      width: '28px',
      height: '28px',
      fontSize: '11px',
    },
    medium: {
      width: '36px',
      height: '36px',
      fontSize: '13px',
    },
    large: {
      width: '44px',
      height: '44px',
      fontSize: '16px',
    },
  };

  const config = sizeConfig[size] || sizeConfig.medium;

  return (
    <>
      <div
        className={`ranking-badge ranking-badge-${rank <= 3 ? rank : 'default'} ${className}`}
        style={{
          background: getRankGradient(rank),
          boxShadow: getRankShadow(rank),
          width: config.width,
          height: config.height,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: rank <= 3 ? '#fff' : '#374151',
          fontWeight: 700,
          fontSize: config.fontSize,
          border: rank <= 3 ? '2px solid rgba(255, 255, 255, 0.3)' : '1px solid #E5E7EB',
          position: 'relative',
          zIndex: 10,
        }}
        role="status"
        aria-label={`Ranked number ${rank}`}
      >
        <span aria-hidden="true">#{rank}</span>
        <span className="sr-only">Ranked number {rank} in best sellers</span>
      </div>

      {/* Pulse animation for rank 1 */}
      {rank === 1 && (
        <style jsx>{`
          @keyframes badgePulse {
            0%, 100% {
              transform: scale(1);
              box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
            }
            50% {
              transform: scale(1.05);
              box-shadow: 0 4px 12px rgba(255, 215, 0, 0.6), 0 0 0 10px rgba(255, 215, 0, 0);
            }
          }

          .ranking-badge-1 {
            animation: badgePulse 2s infinite;
          }
        `}</style>
      )}

      {/* Screen reader only class */}
      <style jsx global>{`
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border-width: 0;
        }
      `}</style>
    </>
  );
}
