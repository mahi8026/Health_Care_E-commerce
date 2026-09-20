/**
 * Shared server-side product listing fetcher.
 *
 * Fetches the first page of products (with filters), plus categories and
 * brands, so server components can render a fully crawlable catalog page.
 * Used by /products and /products/category/[slug].
 */

import { API } from '@/constants/api';
import { serverFetchJson } from '@/lib/serverFetch';

/**
 * Thin wrapper over the deadlined server fetch. The deadline matters at build
 * time: without it a slow/cold API hangs static generation until Next's 60s
 * page timeout aborts the whole build. See src/lib/serverFetch.js.
 */
export async function fetchJson(url, { revalidate = 60, timeout } = {}) {
  return serverFetchJson(url, { revalidate, timeout });
}

export function parseNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) && num >= 0 ? num : undefined;
}

/**
 * @param {Object} params - { search, category, brand, minPrice, maxPrice, inStock, sortBy, page }
 * @returns {{ products, pagination, categories, brands, filters }}
 */
export async function fetchListing(params = {}) {
  const query = new URLSearchParams();
  const search = params.search || '';
  const category = params.category || '';
  const brand = params.brand || '';
  const minPrice = (params.minPrice === '' || params.minPrice === null || params.minPrice === undefined) ? undefined : Number(params.minPrice);
  const maxPrice = (params.maxPrice === '' || params.maxPrice === null || params.maxPrice === undefined) ? undefined : Number(params.maxPrice);
  const inStock = !!params.inStock;
  const sortBy = params.sortBy || 'name';
  const page = Math.max(1, parseInt(params.page, 10) || 1);

  if (search) query.set('search', search);
  if (category) query.set('category', category);
  if (brand) query.set('brand', brand);
  if (minPrice !== undefined && minPrice !== null && minPrice !== '') query.set('minPrice', minPrice);
  if (maxPrice !== undefined && maxPrice !== null && maxPrice !== '') query.set('maxPrice', maxPrice);
  if (inStock) query.set('inStock', 'true');
  if (sortBy !== 'name') query.set('sort', sortBy);
  query.set('limit', '20');
  query.set('page', String(page));

  const data = await fetchJson(`${API}/products?${query}`);

  const products = Array.isArray(data?.data)
    ? data.data
    : (Array.isArray(data?.products) ? data.products : []);

  const paginationData = data?.pagination || {};

  const [categoriesData, brandsData] = await Promise.all([
    fetchJson(`${API}/categories?limit=50`),
    fetchJson(`${API}/manufacturers?limit=50`),
  ]);

  const categories = Array.isArray(categoriesData?.data?.categories)
    ? categoriesData.data.categories
    : (Array.isArray(categoriesData?.categories) ? categoriesData.categories : []);
  const brands = Array.isArray(brandsData?.data?.manufacturers)
    ? brandsData.data.manufacturers
    : (Array.isArray(brandsData?.manufacturers) ? brandsData.manufacturers : []);

  return {
    products,
    pagination: {
      total: paginationData.total || 0,
      page: paginationData.page || page,
      pages: paginationData.pages || paginationData.totalPages || 0,
      count: paginationData.count || products.length || 0,
    },
    categories,
    brands,
    filters: { search, category, brand, minPrice, maxPrice, inStock, sortBy, page },
  };
}