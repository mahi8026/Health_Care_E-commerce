# Pagination Implementation Guide

## Overview

All list endpoints in the MedCore BD API now use a standardized pagination format with consistent metadata and response streaming support for large datasets.

## Pagination Format

### Request Parameters

All list endpoints accept the following query parameters:

- `page` (optional): Page number (1-indexed). Default: `1`. Minimum: `1`.
- `limit` (optional): Items per page. Default: `20`. Minimum: `1`. Maximum: `100`.

### Response Format

All paginated responses follow this structure:

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 450,
    "totalPages": 23,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### Pagination Metadata Fields

- `page` (number): Current page number (1-indexed)
- `limit` (number): Number of items per page
- `total` (number): Total number of items across all pages
- `totalPages` (number): Total number of pages
- `hasNext` (boolean): Whether there is a next page
- `hasPrev` (boolean): Whether there is a previous page

### Backward Compatibility

For backward compatibility, responses also include legacy fields:

```json
{
  "success": true,
  "data": [...],
  "pagination": {...},
  "count": 20,
  "total": 450,
  "page": 1,
  "pages": 23,
  "products": [...]  // or "orders", "reviews", "customers" depending on endpoint
}
```

## Endpoints with Pagination

### Products

**GET /api/products**

```bash
# Get first page with default limit (20)
GET /api/products

# Get page 2 with 50 items per page
GET /api/products?page=2&limit=50

# Get products with filters and pagination
GET /api/products?category=diagnostic&page=1&limit=20
```

### Orders

**GET /api/orders**

```bash
# Get user's orders (first page)
GET /api/orders

# Get page 3 with 10 items per page
GET /api/orders?page=3&limit=10
```

### Reviews

**GET /api/reviews/product/:productId**

```bash
# Get reviews for a product
GET /api/reviews/product/507f1f77bcf86cd799439011?page=1&limit=10
```

**GET /api/reviews/user**

```bash
# Get current user's reviews
GET /api/reviews/user?page=1&limit=10
```

**GET /api/admin/reviews** (Admin only)

```bash
# Get all reviews (admin)
GET /api/admin/reviews?page=1&limit=20&status=pending
```

### Users/Customers

**GET /api/admin/customers** (Admin only)

```bash
# Get all customers
GET /api/admin/customers?page=1&limit=20

# Search customers with pagination
GET /api/admin/customers?search=hospital&page=1&limit=20
```

## Using the Pagination Utility

### In Controllers

```javascript
const { parsePaginationParams, generatePaginationMetadata } = require('../utils/pagination');

exports.getItems = async (req, res) => {
  try {
    // Parse and validate pagination parameters
    const { page, limit } = parsePaginationParams(req.query);
    const skip = (page - 1) * limit;

    // Execute query
    const [items, total] = await Promise.all([
      Model.find(query)
        .skip(skip)
        .limit(limit)
        .lean(),
      Model.countDocuments(query)
    ]);

    // Generate pagination metadata
    const pagination = generatePaginationMetadata(page, limit, total);

    res.json({
      success: true,
      data: items,
      pagination
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
```

### Using paginateResponse Helper

For simpler cases, use the `paginateResponse` helper:

```javascript
const { paginateResponse } = require('../utils/pagination');

exports.getItems = async (req, res) => {
  try {
    const query = Model.find({ isActive: true }).populate('category');
    const total = await Model.countDocuments({ isActive: true });
    
    const result = await paginateResponse(
      query,
      req.query.page,
      req.query.limit,
      total
    );
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
```

## Response Streaming (Advanced)

For very large datasets (e.g., exporting all products), use response streaming to avoid loading all data into memory:

```javascript
const { streamPaginatedResponse } = require('../utils/pagination');

exports.exportProducts = async (req, res) => {
  try {
    const query = Product.find({ isActive: true });
    
    await streamPaginatedResponse(query, res, { batchSize: 100 });
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Export failed' });
    }
  }
};
```

## Validation Rules

### Page Parameter

- Must be a positive integer
- Minimum value: `1`
- Invalid values (negative, zero, non-numeric) default to `1`

### Limit Parameter

- Must be a positive integer
- Minimum value: `1`
- Maximum value: `100`
- Default value: `20`
- Invalid values default to `20`
- Zero or negative values are clamped to `1`
- Values exceeding `100` are clamped to `100`

## Frontend Integration

### React Example

```javascript
const fetchProducts = async (page = 1, limit = 20) => {
  const response = await fetch(`/api/products?page=${page}&limit=${limit}`);
  const data = await response.json();
  
  return {
    products: data.data,
    pagination: data.pagination
  };
};

// Usage in component
const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  
  useEffect(() => {
    fetchProducts(1, 20).then(({ products, pagination }) => {
      setProducts(products);
      setPagination(pagination);
    });
  }, []);
  
  return (
    <div>
      {products.map(product => <ProductCard key={product._id} {...product} />)}
      
      <Pagination
        currentPage={pagination?.page}
        totalPages={pagination?.totalPages}
        hasNext={pagination?.hasNext}
        hasPrev={pagination?.hasPrev}
        onPageChange={(page) => fetchProducts(page, 20)}
      />
    </div>
  );
};
```

### Next.js Example with Server Components

```javascript
// app/products/page.jsx
export default async function ProductsPage({ searchParams }) {
  const page = parseInt(searchParams.page) || 1;
  const limit = parseInt(searchParams.limit) || 20;
  
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/products?page=${page}&limit=${limit}`,
    { next: { revalidate: 3600 } }
  );
  
  const { data: products, pagination } = await response.json();
  
  return (
    <div>
      <ProductGrid products={products} />
      <PaginationControls pagination={pagination} />
    </div>
  );
}
```

## Performance Considerations

### Caching

- Product list responses are cached in Redis with 1-hour TTL
- Cache keys include pagination parameters
- Admin requests bypass cache

### Database Optimization

- Use `.lean()` for read-only queries to improve performance
- Always use `.select()` to limit returned fields
- Ensure indexes exist on frequently queried fields
- Use `countDocuments()` instead of `count()` (deprecated)

### Large Datasets

- For datasets > 10,000 items, consider cursor-based pagination
- Use response streaming for exports
- Implement virtual scrolling on frontend for better UX

## Testing

Run pagination tests:

```bash
# Unit tests
npm test -- pagination.test.js

# Integration tests
npm test -- pagination-integration.test.js
```

## Migration Notes

### Updating Existing Endpoints

1. Import pagination utilities:
   ```javascript
   const { parsePaginationParams, generatePaginationMetadata } = require('../utils/pagination');
   ```

2. Replace manual pagination parsing with `parsePaginationParams()`

3. Replace manual metadata calculation with `generatePaginationMetadata()`

4. Keep legacy fields for backward compatibility

### Frontend Migration

- Update API clients to use `data` field instead of endpoint-specific fields
- Use `pagination` object for pagination controls
- Legacy fields will remain available during transition period

## Support

For questions or issues with pagination:
- Check this documentation
- Review test files for examples
- Contact backend team
