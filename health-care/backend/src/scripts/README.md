# Migration Scripts

⚠️ **IMPORTANT: These migration scripts have ALREADY been run on production data.**

## DO NOT RE-RUN:
- `migrateCategories.js` - ✅ Already executed
- `migrateManufacturers.js` - ✅ Already executed  
- `migrateImages.js` - ✅ Already executed

## Safe to Run:
- `fixProductBrands.js` - Fixes brand references (idempotent)
- `fixProductCategories.js` - Fixes category references (idempotent)

## Usage
```bash
npm run fix:brands
npm run fix:categories
```

Re-running migration scripts may cause data duplication or corruption.
