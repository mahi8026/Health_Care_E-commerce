'use client';

import { useState } from 'react';
import { FaStar, FaInfoCircle } from 'react-icons/fa';

const MIN_REDEEM = 500;
const POINTS_TO_TAKA = 0.10;

export default function PointsRedeemWidget({ availablePoints = 0, orderTotal = 0, onRedeem }) {
  const [inputPoints, setInputPoints] = useState('');
  const [error, setError] = useState('');

  const maxRedeemable = Math.min(
    availablePoints,
    Math.floor((orderTotal * 0.20) / POINTS_TO_TAKA)
  );
  const canRedeem = availablePoints >= MIN_REDEEM && maxRedeemable >= MIN_REDEEM;

  const handleApply = () => {
    const pts = parseInt(inputPoints);
    setError('');

    if (!pts || pts < MIN_REDEEM) {
      setError(`Minimum ${MIN_REDEEM} points required`);
      return;
    }
    if (pts > availablePoints) {
      setError('Not enough points');
      return;
    }
    if (pts > maxRedeemable) {
      setError(`Max redeemable: ${maxRedeemable} pts (20% of order)`);
      return;
    }

    onRedeem(pts);
    setInputPoints('');
  };

  const handleRemove = () => {
    onRedeem(0);
    setInputPoints('');
    setError('');
  };

  if (availablePoints === 0) return null;

  return (
    <div className="border border-blue-100 rounded-xl p-4 bg-blue-50/50">
      <div className="flex items-center gap-2 mb-3">
        <FaStar className="text-[var(--color-status-warning)] w-4 h-4" />
        <span className="font-semibold text-[var(--color-text-primary)] text-sm">Use Loyalty Points</span>
        <span className="ml-auto text-xs text-[var(--color-text-secondary)]">
          {availablePoints.toLocaleString()} pts available
        </span>
      </div>

      {!canRedeem ? (
        <p className="text-xs text-[var(--color-text-secondary)] flex items-center gap-1">
          <FaInfoCircle className="w-3 h-3" />
          Need at least {MIN_REDEEM} points to redeem (you have {availablePoints})
        </p>
      ) : (
        <>
          <p className="text-xs text-[var(--color-text-secondary)] mb-2">
            Max redeemable: <strong>{maxRedeemable.toLocaleString()} pts</strong> = ৳{(maxRedeemable * POINTS_TO_TAKA).toFixed(0)}
          </p>
          <div className="flex gap-2">
            <input
              type="number"
              value={inputPoints}
              onChange={e => setInputPoints(e.target.value)}
              placeholder={`${MIN_REDEEM}–${maxRedeemable}`}
              min={MIN_REDEEM}
              max={maxRedeemable}
              className="flex-1 px-3 py-2 text-sm border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleApply}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="px-3 py-2 text-[var(--color-text-secondary)] text-sm border border-[var(--color-border-primary)] rounded-lg hover:bg-[var(--color-background-tertiary)] transition-colors"
            >
              Clear
            </button>
          </div>
          {error && <p className="text-xs text-[var(--color-status-danger)] mt-1" role="alert" aria-live="polite">{error}</p>}
        </>
      )}
    </div>
  );
}
