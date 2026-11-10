'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FaArrowLeft,
  FaExternalLinkAlt,
  FaPlus,
  FaSave,
  FaTrash,
  FaUndo,
} from 'react-icons/fa';
import { confirmAction } from '@/components/ui/ConfirmDialog';
import { showToast } from '@/components/ui/Toast';
import { API } from '@/constants/api';
import {
  computeInvoiceTotals,
  formatBdt,
  formatInvoiceDate,
  resolveInvoiceWarranty,
} from '@/utils/invoiceHelpers';

const PAYMENT_METHODS = [
  'cod',
  'bkash',
  'nagad',
  'bank_transfer',
  'beftn',
  'npsb',
  'card',
  'cheque',
  'b2b_credit',
  'credit_terms',
  'cash',
];

const PAYMENT_STATUSES = ['pending', 'partial', 'paid', 'failed', 'refunded', 'cancelled'];

const INPUT_CLASS =
  'w-full rounded-md border border-[var(--color-border-tertiary)] bg-white px-2.5 py-1.5 text-sm text-[var(--color-text-primary)] focus:border-brand-teal focus:outline-none focus:ring-1 focus:ring-brand-teal';
const LABEL_CLASS =
  'mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]';
const CARD_CLASS =
  'rounded-lg border border-[var(--color-border-tertiary)] bg-white p-4 shadow-sm';

/** Date → yyyy-mm-dd for <input type="date"> */
function toDateInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** yyyy-mm-dd → ISO string anchored at local noon (no timezone day-shift) */
function toIsoDate(value) {
  if (!value) return null;
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function toText(value) {
  return value === null || value === undefined ? '' : String(value);
}

/** Map the composed invoice returned by the API into editable form state. */
function toFormState(order, defaults) {
  const address = order?.deliveryAddress || {};
  const customer = order?.customer || {};
  const warranty = resolveInvoiceWarranty(order);
  const brand = (item) =>
    item?.brand && typeof item.brand === 'object' ? item.brand.name || '' : toText(item?.brand);

  return {
    invoiceNumber: toText(order?.invoiceNumber || order?.orderNumber),
    issueDate: toDateInput(order?.invoiceDate || order?.createdAt),
    dueDate: toDateInput(order?.dueDate),
    customer: {
      name: toText(customer.name || address.name),
      companyName: toText(customer.companyName),
      email: toText(customer.email),
      phone: toText(customer.phone || address.phone),
    },
    deliveryAddress: {
      name: toText(address.name),
      phone: toText(address.phone),
      street: toText(address.street),
      thana: toText(address.thana),
      district: toText(address.district),
      postcode: toText(address.postcode),
    },
    items: (order?.items || []).map((item) => ({
      name: toText(item.name),
      sku: toText(item.sku),
      brand: brand(item),
      qty: toText(item.qty ?? item.quantity ?? 1),
      price: toText(item.price ?? 0),
      discount: toText(item.discount ?? 0),
      warranty: toText(item.warranty),
    })),
    charges: {
      b2bDiscount: toText(order?.b2bDiscount ?? 0),
      couponDiscount: toText(order?.couponDiscount ?? 0),
      vatAmount: toText(order?.vatAmount ?? 0),
      deliveryFee: toText(order?.deliveryFee ?? 0),
    },
    payment: {
      method: toText(order?.paymentMethod || 'cod'),
      status: toText(order?.paymentStatus || 'pending'),
      reference: toText(order?.paymentReference),
      instructions: toText(order?.paymentInstructions),
    },
    warranty: {
      months: toText(warranty.months),
      note: toText(order?.warrantyNote),
    },
    notes: toText(order?.invoiceNotes),
    terms: Array.isArray(order?.invoiceTerms) && order.invoiceTerms.length
      ? order.invoiceTerms.map(toText)
      : (defaults?.terms || []).map(toText),
  };
}

/** Form state → API payload. Numbers are coerced; the server re-validates. */
function buildPayload(form, revision) {
  const number = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  return {
    revision,
    invoiceNumber: form.invoiceNumber.trim(),
    issueDate: toIsoDate(form.issueDate),
    dueDate: toIsoDate(form.dueDate),
    customer: form.customer,
    deliveryAddress: form.deliveryAddress,
    items: form.items.map((item) => ({
      name: item.name.trim(),
      sku: item.sku.trim(),
      brand: item.brand.trim(),
      qty: Math.max(1, Math.round(number(item.qty, 1))),
      price: Math.max(0, number(item.price, 0)),
      discount: Math.min(100, Math.max(0, number(item.discount, 0))),
      warranty: item.warranty.trim(),
    })),
    charges: {
      b2bDiscount: Math.max(0, number(form.charges.b2bDiscount, 0)),
      couponDiscount: Math.max(0, number(form.charges.couponDiscount, 0)),
      vatAmount: Math.max(0, number(form.charges.vatAmount, 0)),
      deliveryFee: Math.max(0, number(form.charges.deliveryFee, 0)),
    },
    payment: {
      method: form.payment.method.trim(),
      status: form.payment.status.trim(),
      reference: form.payment.reference.trim(),
      instructions: form.payment.instructions.trim(),
    },
    warranty: {
      months: Math.min(120, Math.max(0, Math.round(number(form.warranty.months, 0)))),
      note: form.warranty.note.trim(),
    },
    notes: form.notes.trim(),
    terms: form.terms.map((term) => term.trim()).filter(Boolean),
  };
}

function Field({ label, className = '', ...props }) {
  return (
    <label className={`block ${className}`}>
      <span className={LABEL_CLASS}>{label}</span>
      <input className={INPUT_CLASS} {...props} />
    </label>
  );
}

function Section({ title, description, children }) {
  return (
    <section className={CARD_CLASS}>
      <header className="mb-3">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</h2>
        {description && (
          <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">{description}</p>
        )}
      </header>
      {children}
    </section>
  );
}

const currency = (value) => `BDT ${formatBdt(value)}`;

/**
 * Admin invoice editor.
 *
 * Edits are stored as a per-order Invoice revision; the PDF and the printable
 * invoice page both render the merged result. Totals are recalculated by the
 * server on save (the values shown here are a live preview only).
 */
export default function InvoiceEditor({ orderId }) {
  const [form, setForm] = useState(null);
  const [meta, setMeta] = useState({ isEdited: false, revision: 0, lastEditedAt: null });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState(null);

  const authHeaders = useCallback(
    () => ({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('Mediport_token') || ''}`,
    }),
    []
  );

  const load = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/invoices/order/${orderId}`, {
        headers: authHeaders(),
        cache: 'no-store',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'Failed to load invoice');
      }
      setForm(toFormState(data.order, data.defaults));
      setMeta(data.invoice || { isEdited: false, revision: 0 });
    } catch (err) {
      setError(err.message || 'Failed to load invoice');
    } finally {
      setLoading(false);
    }
  }, [orderId, authHeaders]);

  useEffect(() => {
    // Deferred to a task so the effect body itself never triggers a state
    // update (React Compiler lint: set-state-in-effect).
    let cancelled = false;
    const timer = setTimeout(() => {
      if (!cancelled) load();
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [load]);

  const totals = useMemo(
    () => computeInvoiceTotals(form?.items || [], form?.charges || {}),
    [form]
  );

  const warranty = useMemo(
    () =>
      resolveInvoiceWarranty({
        invoiceDate: form?.issueDate,
        createdAt: form?.issueDate,
        warrantyMonths: form?.warranty?.months,
      }),
    [form?.issueDate, form?.warranty?.months]
  );

  const update = (path, value) => {
    setForm((prev) => {
      if (!prev) return prev;
      const next = { ...prev };
      let cursor = next;
      for (let i = 0; i < path.length - 1; i += 1) {
        const key = path[i];
        cursor[key] = Array.isArray(cursor[key]) ? [...cursor[key]] : { ...cursor[key] };
        cursor = cursor[key];
      }
      cursor[path[path.length - 1]] = value;
      return next;
    });
  };

  const updateItem = (index, key, value) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => (i === index ? { ...item, [key]: value } : item)),
    }));
  };

  const addItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { name: '', sku: '', brand: '', qty: '1', price: '0', discount: '0', warranty: '' },
      ],
    }));
  };

  const removeItem = (index) => {
    setForm((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  const updateTerm = (index, value) => {
    setForm((prev) => ({
      ...prev,
      terms: prev.terms.map((term, i) => (i === index ? value : term)),
    }));
  };

  const addTerm = () => {
    setForm((prev) => ({ ...prev, terms: [...prev.terms, ''] }));
  };

  const removeTerm = (index) => {
    setForm((prev) => ({ ...prev, terms: prev.terms.filter((_, i) => i !== index) }));
  };


  const handleSave = async (event) => {
    event?.preventDefault();
    if (!form || saving) return;

    if (!form.invoiceNumber.trim()) {
      showToast.error('Invoice number is required');
      return;
    }
    if (!form.items.length) {
      showToast.error('An invoice needs at least one line item');
      return;
    }
    if (form.items.some((item) => !item.name.trim())) {
      showToast.error('Every line item needs a description');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API}/invoices/order/${orderId}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(buildPayload(form, meta?.revision ?? 0)),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 409) {
        showToast.error(data.message || 'Invoice changed elsewhere. Reloading…');
        if (data.code === 'INVOICE_REVISION_CONFLICT') {
          await load();
        }
        return;
      }
      if (!res.ok) {
        throw new Error(data.message || 'Failed to save invoice');
      }

      setForm(toFormState(data.order, null));
      setMeta(data.invoice || {});
      showToast.success(data.message || 'Invoice updated');
    } catch (err) {
      showToast.error(err.message || 'Failed to save invoice');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    const confirmed = await confirmAction({
      title: 'Reset this invoice?',
      message: 'All admin edits will be discarded and the invoice will be rebuilt from the order.',
      confirmLabel: 'Reset invoice',
    });
    if (!confirmed) return;

    setResetting(true);
    try {
      const res = await fetch(`${API}/invoices/order/${orderId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'Failed to reset invoice');
      }
      setForm(toFormState(data.order, null));
      setMeta(data.invoice || { isEdited: false, revision: 0 });
      showToast.success(data.message || 'Invoice reset');
    } catch (err) {
      showToast.error(err.message || 'Failed to reset invoice');
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-64 animate-pulse rounded bg-[var(--color-background-muted)]" />
        <div className="h-64 animate-pulse rounded-lg bg-[var(--color-background-muted)]" />
        <div className="h-64 animate-pulse rounded-lg bg-[var(--color-background-muted)]" />
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className={CARD_CLASS}>
        <h1 className="text-base font-semibold text-[var(--color-text-primary)]">
          Invoice could not be loaded
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{error}</p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={load}
            className="rounded-md bg-brand-navy px-3 py-1.5 text-sm font-medium text-white"
          >
            Try again
          </button>
          <a
            href="/admin/orders"
            className="rounded-md border border-[var(--color-border-tertiary)] px-3 py-1.5 text-sm font-medium"
          >
            Back to orders
          </a>
        </div>
      </div>
    );
  }


  return (
    <form onSubmit={handleSave} className="space-y-4" noValidate>
      {/* Action bar */}
      <div className={`${CARD_CLASS} flex flex-wrap items-center justify-between gap-3`}>
        <div className="flex items-center gap-3">
          <a
            href="/admin/orders"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border-tertiary)] text-[var(--color-text-secondary)] hover:border-brand-teal hover:text-brand-teal"
            aria-label="Back to orders"
          >
            <FaArrowLeft className="h-3 w-3" />
          </a>
          <div>
            <h1 className="text-base font-semibold text-[var(--color-text-primary)]">
              Invoice {form.invoiceNumber || '—'}
            </h1>
            <p className="text-xs text-[var(--color-text-secondary)]">
              {meta?.isEdited
                ? `Revision ${meta.revision}${meta.lastEditedAt ? ` · updated ${formatInvoiceDate(meta.lastEditedAt)}` : ''}`
                : 'Not edited yet — currently generated from the order'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`/orders/${orderId}/invoice`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--color-border-tertiary)] px-3 py-1.5 text-sm font-medium hover:border-brand-teal hover:text-brand-teal"
          >
            <FaExternalLinkAlt className="h-3 w-3" /> Preview
          </a>
          <button
            type="button"
            onClick={handleReset}
            disabled={resetting || saving || !meta?.isEdited}
            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--color-border-tertiary)] px-3 py-1.5 text-sm font-medium hover:border-[var(--color-status-danger)] hover:text-[var(--color-status-danger)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FaUndo className="h-3 w-3" /> {resetting ? 'Resetting…' : 'Reset'}
          </button>
          <button
            type="submit"
            disabled={saving || resetting}
            className="inline-flex items-center gap-1.5 rounded-md bg-brand-teal px-4 py-1.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FaSave className="h-3 w-3" /> {saving ? 'Saving…' : 'Save invoice'}
          </button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <Section
            title="Invoice details"
            description="The invoice number, issue date and payment due date printed on the document."
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <Field
                label="Invoice number"
                value={form.invoiceNumber}
                onChange={(e) => update(['invoiceNumber'], e.target.value)}
                maxLength={40}
                required
              />
              <Field
                label="Issue date"
                type="date"
                value={form.issueDate}
                onChange={(e) => update(['issueDate'], e.target.value)}
                required
              />
              <Field
                label="Due date (optional)"
                type="date"
                value={form.dueDate}
                onChange={(e) => update(['dueDate'], e.target.value)}
              />
            </div>
          </Section>


          <Section title="Customer" description="Appears in the CUSTOMER block of the invoice.">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Name"
                value={form.customer.name}
                onChange={(e) => update(['customer', 'name'], e.target.value)}
                maxLength={120}
              />
              <Field
                label="Company"
                value={form.customer.companyName}
                onChange={(e) => update(['customer', 'companyName'], e.target.value)}
                maxLength={160}
              />
              <Field
                label="Email"
                type="email"
                value={form.customer.email}
                onChange={(e) => update(['customer', 'email'], e.target.value)}
                maxLength={160}
              />
              <Field
                label="Phone"
                value={form.customer.phone}
                onChange={(e) => update(['customer', 'phone'], e.target.value)}
                maxLength={40}
              />
            </div>
          </Section>

          <Section title="Delivery address" description="Printed in the DELIVER TO block.">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Recipient"
                value={form.deliveryAddress.name}
                onChange={(e) => update(['deliveryAddress', 'name'], e.target.value)}
                maxLength={120}
              />
              <Field
                label="Phone"
                value={form.deliveryAddress.phone}
                onChange={(e) => update(['deliveryAddress', 'phone'], e.target.value)}
                maxLength={40}
              />
              <Field
                label="Street"
                className="sm:col-span-2"
                value={form.deliveryAddress.street}
                onChange={(e) => update(['deliveryAddress', 'street'], e.target.value)}
                maxLength={240}
              />
              <Field
                label="Thana / Area"
                value={form.deliveryAddress.thana}
                onChange={(e) => update(['deliveryAddress', 'thana'], e.target.value)}
                maxLength={120}
              />
              <Field
                label="District"
                value={form.deliveryAddress.district}
                onChange={(e) => update(['deliveryAddress', 'district'], e.target.value)}
                maxLength={120}
              />
              <Field
                label="Postcode"
                value={form.deliveryAddress.postcode}
                onChange={(e) => update(['deliveryAddress', 'postcode'], e.target.value)}
                maxLength={20}
              />
            </div>
          </Section>


          <Section
            title="Line items"
            description="Descriptions, quantities, prices and per-line discounts. Line totals are recalculated automatically."
          >
            <div className="space-y-3">
              {form.items.map((item, index) => {
                const qty = Number(item.qty) || 0;
                const price = Number(item.price) || 0;
                const discount = Number(item.discount) || 0;
                const lineTotal = qty * price * (1 - discount / 100);

                return (
                  <div
                    key={index}
                    className="rounded-md border border-[var(--color-border-tertiary)] p-3"
                  >
                    <div className="flex items-start gap-2">
                      <div className="grid flex-1 gap-2 sm:grid-cols-12">
                        <Field
                          label={`Description ${index + 1}`}
                          className="sm:col-span-12"
                          value={item.name}
                          onChange={(e) => updateItem(index, 'name', e.target.value)}
                          maxLength={200}
                          required
                        />
                        <Field
                          label="SKU"
                          className="sm:col-span-4"
                          value={item.sku}
                          onChange={(e) => updateItem(index, 'sku', e.target.value)}
                          maxLength={80}
                        />
                        <Field
                          label="Brand"
                          className="sm:col-span-4"
                          value={item.brand}
                          onChange={(e) => updateItem(index, 'brand', e.target.value)}
                          maxLength={120}
                        />
                        <Field
                          label="Warranty (months or text)"
                          className="sm:col-span-4"
                          value={item.warranty}
                          onChange={(e) => updateItem(index, 'warranty', e.target.value)}
                          maxLength={80}
                          placeholder="e.g. 12 months"
                        />
                        <Field
                          label="Qty"
                          className="sm:col-span-2"
                          type="number"
                          min="1"
                          max="1000"
                          step="1"
                          value={item.qty}
                          onChange={(e) => updateItem(index, 'qty', e.target.value)}
                        />
                        <Field
                          label="Unit price (BDT)"
                          className="sm:col-span-3"
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.price}
                          onChange={(e) => updateItem(index, 'price', e.target.value)}
                        />
                        <Field
                          label="Discount %"
                          className="sm:col-span-2"
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={item.discount}
                          onChange={(e) => updateItem(index, 'discount', e.target.value)}
                        />
                        <div className="sm:col-span-5">
                          <span className={LABEL_CLASS}>Line total</span>
                          <p className="py-1.5 text-sm font-semibold text-[var(--color-text-primary)]">
                            {currency(lineTotal)}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        aria-label={`Remove line ${index + 1}`}
                        disabled={form.items.length === 1}
                        className="mt-5 flex h-8 w-8 items-center justify-center rounded-md border border-[var(--color-border-tertiary)] text-[var(--color-text-secondary)] hover:border-[var(--color-status-danger)] hover:text-[var(--color-status-danger)] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <FaTrash className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={addItem}
              className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-dashed border-[var(--color-border-tertiary)] px-3 py-1.5 text-sm font-medium text-[var(--color-text-secondary)] hover:border-brand-teal hover:text-brand-teal"
            >
              <FaPlus className="h-3 w-3" /> Add line item
            </button>
          </Section>


          <Section
            title="Charges & discounts"
            description="All amounts in BDT. Total = subtotal − discounts + VAT + delivery."
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field
                label="B2B discount"
                type="number"
                min="0"
                step="0.01"
                value={form.charges.b2bDiscount}
                onChange={(e) => update(['charges', 'b2bDiscount'], e.target.value)}
              />
              <Field
                label="Coupon discount"
                type="number"
                min="0"
                step="0.01"
                value={form.charges.couponDiscount}
                onChange={(e) => update(['charges', 'couponDiscount'], e.target.value)}
              />
              <Field
                label="VAT / tax"
                type="number"
                min="0"
                step="0.01"
                value={form.charges.vatAmount}
                onChange={(e) => update(['charges', 'vatAmount'], e.target.value)}
              />
              <Field
                label="Delivery fee"
                type="number"
                min="0"
                step="0.01"
                value={form.charges.deliveryFee}
                onChange={(e) => update(['charges', 'deliveryFee'], e.target.value)}
              />
            </div>
          </Section>

          <Section
            title="Payment"
            description="Method, status and instructions printed in the payment block."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className={LABEL_CLASS}>Payment method</span>
                <select
                  className={INPUT_CLASS}
                  value={form.payment.method}
                  onChange={(e) => update(['payment', 'method'], e.target.value)}
                >
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {method.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className={LABEL_CLASS}>Payment status</span>
                <select
                  className={INPUT_CLASS}
                  value={form.payment.status}
                  onChange={(e) => update(['payment', 'status'], e.target.value)}
                >
                  {PAYMENT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </label>

              <Field
                label="Transaction / bank reference"
                className="sm:col-span-2"
                value={form.payment.reference}
                onChange={(e) => update(['payment', 'reference'], e.target.value)}
                maxLength={120}
                placeholder="e.g. TRX-920183"
              />

              <label className="block sm:col-span-2">
                <span className={LABEL_CLASS}>Payment instructions (optional)</span>
                <textarea
                  className={`${INPUT_CLASS} min-h-[84px]`}
                  value={form.payment.instructions}
                  onChange={(e) => update(['payment', 'instructions'], e.target.value)}
                  maxLength={600}
                  rows={4}
                  placeholder="Leave blank to print the standard BRAC Bank account details."
                />
                <span className="mt-1 block text-xs text-[var(--color-text-secondary)]">
                  One line per row. Blank uses the default BRAC Bank PLC details.
                </span>
              </label>
            </div>
          </Section>

          <Section
            title="Warranty"
            description="The warranty period and expiry date printed in the WARRANTY & SERVICE block."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Warranty period (months)"
                type="number"
                min="0"
                max="120"
                step="1"
                value={form.warranty.months}
                onChange={(e) => update(['warranty', 'months'], e.target.value)}
              />

              <div className="rounded-md border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-900">
                <p className="font-semibold">{warranty.label}</p>
                <p>
                  {warranty.endDate
                    ? `From ${formatInvoiceDate(warranty.startDate)} until ${formatInvoiceDate(warranty.endDate)}`
                    : 'No warranty coverage will be printed.'}
                </p>
              </div>

              <label className="block sm:col-span-2">
                <span className={LABEL_CLASS}>Warranty note (optional)</span>
                <textarea
                  className={`${INPUT_CLASS} min-h-[64px]`}
                  value={form.warranty.note}
                  onChange={(e) => update(['warranty', 'note'], e.target.value)}
                  maxLength={500}
                  rows={2}
                  placeholder="e.g. Consumables and reagents are covered by their printed shelf life."
                />
              </label>
            </div>
          </Section>


          <Section
            title="Notes & terms"
            description="Printed on the invoice below the warranty block. Use notes for one-off messages."
          >
            <label className="block">
              <span className={LABEL_CLASS}>Additional notes (optional)</span>
              <textarea
                className={`${INPUT_CLASS} min-h-[72px]`}
                value={form.notes}
                onChange={(e) => update(['notes'], e.target.value)}
                maxLength={2000}
                rows={3}
                placeholder="e.g. Delivered by hand on 31 Aug 2026 — received in good condition."
              />
            </label>

            <div className="mt-3 space-y-2">
              {form.terms.map((term, index) => (
                <div key={index} className="flex items-start gap-2">
                  <input
                    className={INPUT_CLASS}
                    value={term}
                    onChange={(e) => updateTerm(index, e.target.value)}
                    maxLength={300}
                    aria-label={`Term ${index + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeTerm(index)}
                    aria-label={`Remove term ${index + 1}`}
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border border-[var(--color-border-tertiary)] text-[var(--color-text-secondary)] hover:border-[var(--color-status-danger)] hover:text-[var(--color-status-danger)]"
                  >
                    <FaTrash className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addTerm}
              className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-dashed border-[var(--color-border-tertiary)] px-3 py-1.5 text-sm font-medium text-[var(--color-text-secondary)] hover:border-brand-teal hover:text-brand-teal"
            >
              <FaPlus className="h-3 w-3" /> Add term
            </button>
          </Section>
        </div>

        {/* Live summary */}
        <aside className="space-y-4">
          <div className={CARD_CLASS}>
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Summary</h2>
            <dl className="mt-3 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-[var(--color-text-secondary)]">Subtotal</dt>
                <dd className="font-medium">{currency(totals.subtotal)}</dd>
              </div>
              {totals.b2bDiscount > 0 && (
                <div className="flex justify-between text-[var(--color-status-success)]">
                  <dt>B2B discount</dt>
                  <dd>− {currency(totals.b2bDiscount)}</dd>
                </div>
              )}
              {totals.couponDiscount > 0 && (
                <div className="flex justify-between text-[var(--color-status-success)]">
                  <dt>Coupon discount</dt>
                  <dd>− {currency(totals.couponDiscount)}</dd>
                </div>
              )}
              {totals.vatAmount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-[var(--color-text-secondary)]">VAT / tax</dt>
                  <dd className="font-medium">{currency(totals.vatAmount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-[var(--color-text-secondary)]">Delivery</dt>
                <dd className="font-medium">{currency(totals.deliveryFee)}</dd>
              </div>
              <div className="mt-2 flex items-center justify-between rounded-md bg-brand-navy px-3 py-2">
                <dt className="text-sm font-bold text-white">TOTAL</dt>
                <dd className="text-base font-bold text-brand-teal">{currency(totals.totalAmount)}</dd>
              </div>
            </dl>
            <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
              Live preview — totals are recalculated by the server when you save.
            </p>
          </div>

          <div className={CARD_CLASS}>
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Document</h2>
            <dl className="mt-3 space-y-1.5 text-xs">
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--color-text-secondary)]">Revision</dt>
                <dd className="font-medium">{meta?.isEdited ? meta.revision : '—'}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--color-text-secondary)]">Last edited</dt>
                <dd className="font-medium">
                  {meta?.lastEditedAt ? formatInvoiceDate(meta.lastEditedAt) : '—'}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--color-text-secondary)]">Line items</dt>
                <dd className="font-medium">{form.items.length}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--color-text-secondary)]">Warranty</dt>
                <dd className="font-medium">{warranty.label}</dd>
              </div>
            </dl>

            <button
              type="submit"
              disabled={saving || resetting}
              className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-brand-teal px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FaSave className="h-3 w-3" /> {saving ? 'Saving…' : 'Save invoice'}
            </button>
          </div>
        </aside>
      </div>
    </form>
  );
}

