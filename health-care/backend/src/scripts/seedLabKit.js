require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
const mongoose = require("mongoose");
const Product = require("../models/Product");
const Category = require("../models/Category");
const Manufacturer = require("../models/Manufacturer");

const labKitProducts = require("./labkit-products.json");

let stats = { added: 0, skipped: 0, failed: 0, errors: [] };

async function findOrCreateManufacturer(brandName) {
  try {
    let manufacturer = await Manufacturer.findOne({ name: { $regex: new RegExp(`^${brandName}$`, "i") } });
    if (!manufacturer) {
      manufacturer = await Manufacturer.create({ name: brandName, description: `${brandName} - Medical laboratory reagents and diagnostics`, country: "International", isActive: true });
      console.log(`   🏭 Created brand: ${brandName}`);
    }
    return manufacturer;
  } catch (error) {
    console.error(`   ❌ Error with brand ${brandName}:`, error.message);
    throw error;
  }
}

async function findOrCreateCategory(categoryName) {
  try {
    let category = await Category.findOne({ name: { $regex: new RegExp(`^${categoryName}$`, "i") } });
    if (!category) {
      const slug = categoryName.toLowerCase().replace(/\s+/g, "-").replace(/\//g, "-");
      category = await Category.create({ name: categoryName, slug: slug, description: `${categoryName} products and supplies`, isActive: true });
      console.log(`   📁 Created category: ${categoryName}`);
    }
    return category;
  } catch (error) {
    console.error(`   ❌ Error with category ${categoryName}:`, error.message);
    throw error;
  }
}

async function seedProducts() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");
    console.log("╔════════════════════════════════════════════════════════════╗");
    console.log("║          LABKIT - BANGLADESH DISTRIBUTOR PRICES            ║");
    console.log("╚════════════════════════════════════════════════════════════╝\n");
    console.log(`📦 Processing ${labKitProducts.length} products...\n`);
    
    for (const productData of labKitProducts) {
      try {
        const existingProduct = await Product.findOne({ sku: productData.sku });
        if (existingProduct) {
          console.log(`⏭️  Skipped: ${productData.name} (${productData.sku})`);
          stats.skipped++;
          continue;
        }
        const manufacturer = await findOrCreateManufacturer(productData.brand);
        const category = await findOrCreateCategory(productData.category);
        const newProduct = { name: productData.name, sku: productData.sku, description: productData.description, brand: manufacturer._id, category: category._id, price: productData.price, b2bPrice: productData.b2bPrice || productData.price, stock: productData.stock, minOrderQty: productData.minOrderQty || 1, unit: productData.unit || "pack", specifications: productData.specifications || {}, certifications: productData.certifications || [], tags: productData.tags || [], isActive: productData.isActive !== false, isFeatured: productData.isFeatured || false, images: productData.images || [] };
        if (productData.pCode) newProduct.pCode = productData.pCode;
        if (productData.currency) newProduct.currency = productData.currency;
        if (productData.priceUnit) newProduct.priceUnit = productData.priceUnit;
        await Product.create(newProduct);
        console.log(`✅ Added: ${productData.name} - ৳${productData.price}`);
        stats.added++;
      } catch (error) {
        console.error(`❌ Failed: ${productData.name} - ${error.message}`);
        stats.failed++;
        stats.errors.push({ product: productData.name, sku: productData.sku, error: error.message });
      }
    }
    console.log("\n╔════════════════════════════════════════════════════════════╗");
    console.log("║                    IMPORT SUMMARY                          ║");
    console.log("╚════════════════════════════════════════════════════════════╝\n");
    console.log(`✅ Added:   ${stats.added}`);
    console.log(`⏭️  Skipped: ${stats.skipped}`);
    console.log(`❌ Failed:  ${stats.failed}`);
    console.log(`📊 Total:   ${labKitProducts.length}\n`);
    if (stats.failed > 0) {
      console.log("❌ Errors:");
      stats.errors.forEach(err => console.log(`   • ${err.product}: ${err.error}`));
    }
    const totalProducts = await Product.countDocuments();
    const totalCategories = await Category.countDocuments();
    const totalManufacturers = await Manufacturer.countDocuments();
    console.log("\n📊 Database Status:");
    console.log(`   Products: ${totalProducts}`);
    console.log(`   Categories: ${totalCategories}`);
    console.log(`   Manufacturers: ${totalManufacturers}\n`);
    console.log("✅ Import completed!\n");
  } catch (error) {
    console.error("❌ Fatal Error:", error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("👋 Disconnected from MongoDB");
  }
}

seedProducts();
