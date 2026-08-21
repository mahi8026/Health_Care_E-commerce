/**
 * Pricing Service Tests — flash-deal integration in quoteProduct
 */

const { quoteProduct } = require('../pricingService');

describe('quoteProduct — flash deal pricing', () => {
  const product = {
    _id: 'p1',
    name: 'Test Product',
    price: 5000,
    variants: {},
  };

  const item = { product: 'p1', qty: 1 };

  it('charges regular price when no deal price given', () => {
    const quote = quoteProduct(product, null, null, item, null);
    expect(quote.unitPrice).toBe(5000);
    expect(quote.isB2BPrice).toBe(false);
  });

  it('charges the flash-deal price when active', () => {
    const quote = quoteProduct(product, null, null, item, 4000);
    expect(quote.unitPrice).toBe(4000);
    expect(quote.isB2BPrice).toBe(false);
    expect(quote.savings).toBe(1000);
  });

  it('prefers B2B price when it is lower than the deal price', () => {
    const user = { b2bApprovalStatus: 'approved', b2bDiscountEnabled: true };
    const b2bProduct = { ...product, b2bPriceEnabled: true, b2bPrice: 3500 };
    const quote = quoteProduct(b2bProduct, user, null, item, 4000);
    expect(quote.unitPrice).toBe(3500);
    expect(quote.isB2BPrice).toBe(true);
  });

  it('prefers the deal price when it beats the B2B price', () => {
    const user = { b2bApprovalStatus: 'approved', b2bDiscountEnabled: true };
    const b2bProduct = { ...product, b2bPriceEnabled: true, b2bPrice: 4500 };
    const quote = quoteProduct(b2bProduct, user, null, item, 4000);
    expect(quote.unitPrice).toBe(4000);
    expect(quote.isB2BPrice).toBe(false);
    expect(quote.savings).toBe(1000);
  });

  it('adds size adjustment on top of the deal price', () => {
    const sizedProduct = {
      ...product,
      variants: { sizes: [{ name: 'Large', priceAdjustment: 200 }] },
    };
    const sizedItem = { product: 'p1', qty: 1, selectedSize: { name: 'Large' } };
    const quote = quoteProduct(sizedProduct, null, null, sizedItem, 4000);
    expect(quote.unitPrice).toBe(4200);
    expect(quote.sizeName).toBe('Large');
  });

  it('ignores invalid deal prices (zero/negative)', () => {
    const quote = quoteProduct(product, null, null, item, 0);
    expect(quote.unitPrice).toBe(5000);

    const quote2 = quoteProduct(product, null, null, item, -100);
    expect(quote2.unitPrice).toBe(5000);
  });

  it('returns the deal id when a flash-deal entry is applied', () => {
    const quote = quoteProduct(product, null, null, item, { dealId: 'deal1', finalPrice: 4000 });
    expect(quote.unitPrice).toBe(4000);
    expect(quote.flashDealId).toBe('deal1');
  });

  it('omits flashDealId when the B2B price beats the deal', () => {
    const user = { b2bApprovalStatus: 'approved', b2bDiscountEnabled: true };
    const b2bProduct = { ...product, b2bPriceEnabled: true, b2bPrice: 3500 };
    const quote = quoteProduct(b2bProduct, user, null, item, { dealId: 'deal1', finalPrice: 4000 });
    expect(quote.unitPrice).toBe(3500);
    expect(quote.flashDealId).toBeNull();
  });
});
