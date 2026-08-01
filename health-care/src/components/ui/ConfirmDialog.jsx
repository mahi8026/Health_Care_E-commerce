'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';

class ConfirmManager {
  constructor() {
    this.pending = [];
    this.listeners = [];
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach((listener) => listener(this.pending));
  }

  confirm(options) {
    const request = typeof options === 'string' ? { message: options } : { ...options };
    const id = Date.now() + Math.random();
    const promise = new Promise((resolve) => {
      this.pending.push({
        id,
        title: request.title || 'Please confirm',
        message: request.message,
        confirmLabel: request.confirmLabel || 'Confirm',
        cancelLabel: request.cancelLabel || 'Cancel',
        danger: request.danger !== false,
        resolve,
      });
    });
    this.notify();
    return promise;
  }

  settle(id, result) {
    this.pending = this.pending.filter((p) => {
      if (p.id === id) {
        p.resolve(result);
        return false;
      }
      return true;
    });
    this.notify();
  }
}

export const confirmManager = new ConfirmManager();

/**
 * Promise-based confirmation dialog.
 *
 * Usage:
 *   import { confirmAction } from '@/components/ui/ConfirmDialog';
 *   if (!await confirmAction('Delete this item?'))) return;
 *   if (!await confirmAction({ title: 'Clear cart?', message: 'All items will be removed.', confirmLabel: 'Clear' }))) return;
 */
export const confirmAction = (options) => confirmManager.confirm(options);

export default function ConfirmDialogProvider() {
  const [pending, setPending] = useState([]);

  const [current] = pending;

  useEffect(() => {
    return confirmManager.subscribe(setPending);
  }, []);

  if (pending.length === 0) return null;

  return (
    <Modal
      isOpen={!!current}
      onClose={() => confirmManager.settle(current.id, false)}
      title={current.title}
      size="sm"
    >
      <p className="text-sm text-[var(--color-text-secondary)]">{current.message}</p>
      <div className="flex gap-3 mt-6">
        <button
          onClick={() => confirmManager.settle(current.id, false)}
          className="flex-1 py-2.5 border border-[var(--color-border-primary)] rounded-xl text-sm font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-background-tertiary)] transition-colors"
        >
          {current.cancelLabel}
        </button>
        <button
          onClick={() => confirmManager.settle(current.id, true)}
          className={`flex-1 py-2.5 text-white rounded-xl text-sm font-semibold transition-colors ${
            current.danger
              ? 'bg-danger hover:bg-[#C93A39]'
              : 'bg-brand-teal hover:bg-[var(--color-brand-teal-hover)]'
          }`}
        >
          {current.confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
