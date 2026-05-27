'use client';

import { createContext, useContext, useState, useCallback } from 'react';

const CompareContext = createContext();

const MAX_COMPARE = 4;

export function CompareProvider({ children }) {
  const [compareList, setCompareList] = useState([]);

  const addToCompare = useCallback((product) => {
    setCompareList((prev) => {
      if (prev.find((p) => (p._id || p.id) === (product._id || product.id))) return prev;
      if (prev.length >= MAX_COMPARE) return prev; // silently cap at 4
      return [...prev, product];
    });
  }, []);

  const removeFromCompare = useCallback((productId) => {
    setCompareList((prev) => prev.filter((p) => (p._id || p.id) !== productId));
  }, []);

  const clearCompare = useCallback(() => setCompareList([]), []);

  const isInCompare = useCallback(
    (productId) => compareList.some((p) => (p._id || p.id) === productId),
    [compareList]
  );

  const toggleCompare = useCallback(
    (product) => {
      const id = product._id || product.id;
      if (isInCompare(id)) {
        removeFromCompare(id);
      } else {
        addToCompare(product);
      }
    },
    [isInCompare, addToCompare, removeFromCompare]
  );

  return (
    <CompareContext.Provider
      value={{ compareList, addToCompare, removeFromCompare, clearCompare, isInCompare, toggleCompare, MAX_COMPARE }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error('useCompare must be used within CompareProvider');
  return ctx;
}

