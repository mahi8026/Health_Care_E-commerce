import { NextResponse } from 'next/server';
import { CATEGORY_SLUG_MAP } from '@/constants/categories';

export async function GET() {
  return NextResponse.json({
    message: 'Category routes test',
    slugs: Object.keys(CATEGORY_SLUG_MAP),
    slugMap: CATEGORY_SLUG_MAP,
    testUrls: Object.keys(CATEGORY_SLUG_MAP).map(slug => `/products/category/${slug}`),
  });
}
