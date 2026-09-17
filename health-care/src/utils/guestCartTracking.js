import api from '@/utils/api';
import { getGuestCartSessionId } from '@/utils/guestCartSession';

/**
 * Guest cart recovery — link a known guest email to the current cart contents.
 *
 * Call this as soon as a guest email is captured anywhere in the funnel (the
 * checkout address form, the exit-intent popup, ...). Guests have no server-side
 * cart, so until an email is paired with a cart snapshot the recovery sweep has
 * nothing to email and the guest is unrecoverable.
 *
 * Only `id` + `quantity` are sent: the backend re-derives every price from the
 * database, so a stale localStorage price can never reach the recovery email.
 *
 * Fire-and-forget by design — it never throws and never blocks the caller,
 * because a tracking failure must never break a lead capture or a checkout.
 *
 * @param {string} email  Guest email just captured.
 * @param {Array}  items  Cart items ({ id|_id, quantity }).
 * @returns {Promise|null} null when there is nothing to track.
 */
export function trackGuestCartForEmail(email, items) {
  const toSend = (email || '').trim();
  if (!toSend || !/^\S+@\S+\.\S+$/.test(toSend)) return null;

  const normalized = (items || [])
    .map((item) => ({
      id: item?.id || item?._id,
      quantity: item?.quantity,
    }))
    .filter((item) => item.id);

  // Nothing worth recovering — don't create an empty cart row.
  if (!normalized.length) return null;

  const sessionId = getGuestCartSessionId();
  if (!sessionId) return null;

  try {
    // api.trackGuestCart already swallows its own failures; the guard below also
    // covers any future transport that rejects, so callers on a lead-capture
    // path never see a rejection.
    return api.trackGuestCart({ sessionId, email: toSend, items: normalized })?.catch?.(() => null);
  } catch {
    return null;
  }
}