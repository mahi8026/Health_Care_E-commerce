require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');
const logger = require('../utils/logger');

// Category mapping with descriptions and display order
const CATEGORY_DATA = {
  'Diagnostic Equipment': {
    description: 'Medical diagnostic devices including ECG machines, ultrasound systems, patient monitors, and blood pressure monitors',
    displayOrder: 1,
    seo: {
      metaTitle: 'Diagnostic Equipment - Medical Devices | MedCore BD',
      metaDescription: 'Browse our range of diagnostic equipment including ECG machines, ultrasound systems, and patient monitors for hospitals and clinics.',
      keywords: ['diagnostic equipment', 'ECG machine', 'ultrasound', 'patient monitor', 'medical devices']
    }
  },
  'Surgical Instruments': {
    description: 'High-quality surgical instruments including scissors, forceps, scalpels, and electrosurgical devices',
    displayOrder: 2,
    seo: {
      metaTitle: 'Surgical Instruments - Medical Tools | MedCore BD',
      metaDescription: 'Premium surgical instruments for hospitals and surgical centers. Stainless steel and titanium surgical tools.',
      keywords: ['surgical instruments', 'surgical scissors', 'forceps', 'scalpel', 'surgical tools']
    }
  },
  'Laboratory Reagents': {
    description: 'Laboratory testing reagents for clinical chemistry, hematology, immunoassay, and biochemistry',
    displayOrder: 3,
    seo: {
      metaTitle: 'Laboratory Reagents - Clinical Testing | MedCore BD',
      metaDescription: 'High-quality laboratory reagents for clinical testing including HbA1c, troponin, CBC, and liver function tests.',
      keywords: ['laboratory reagents', 'clinical reagents', 'HbA1c', 'troponin', 'CBC reagent']
    }
  },
  'Hospital Machines': {
    description: 'Hospital equipment including ventilators, dialysis machines, anesthesia machines, and ICU equipment',
    displayOrder: 4,
    seo: {
      metaTitle: 'Hospital Machines - ICU Equipment | MedCore BD',
      metaDescription: 'Advanced hospital machines including ventilators, dialysis machines, and ICU monitoring systems.',
      keywords: ['hospital machines', 'ventilator', 'dialysis machine', 'ICU equipment', 'anesthesia machine']
    }
  },
  'Lab Equipment': {
    description: 'Laboratory equipment including centrifuges, microscopes, incubators, and PCR machines',
    displayOrder: 5,
    seo: {
      metaTitle: 'Lab Equipment - Laboratory Instruments | MedCore BD',
      metaDescription: 'Laboratory equipment for clinical and research labs including centrifuges, microscopes, and PCR machines.',
      keywords: ['lab equipment', 'centrifuge', 'microscope', 'incubator', 'PCR machine']
    }
  },
  'Dental Equipment': {
    description: 'Dental equipment and instruments for dental clinics and practices',
    displayOrder: 6,
    seo: {
      metaTitle: 'Dental Equipment - Dental Instruments | MedCore BD',
      metaDescription: 'Professional dental equipment and instruments for dental clinics and practices.',
      keywords: ['dental equipment', 'dental instruments', 'dental chair', 'dental tools']
    }
  },
  'PPE': {
    description: 'Personal protective equipment including masks, gloves, gowns, and face shields',
    displayOrder: 7,
    seo: {
      metaTitle: 'PPE - Personal Protective Equipment | MedCore BD',
      metaDescription: 'Medical-grade personal protective equipment including surgical masks, gloves, gowns, and face shields.',
      keywords: ['PPE', 'personal protective equipment', 'surgical mask', 'medical gloves', 'face shield']
    }
  },
  'Implants': {
    description: 'Medical implants including orthopedic implants, cardiac implants, and surgical implants',
    displayOrder: 8,
    seo: {
      metaTitle: 'Medical Implants - Surgical Implants | MedCore BD',
      metaDescription: 'High-quality medical implants including orthopedic, cardiac, and surgical implants.',
      keywords: ['medical implants', 'orthopedic implants', 'cardiac implants', 'surgical implants']
    }
  }
};

async function migrateCategories() {
  try {
    console.log('🚀 Starting category migration...\n');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Get native MongoDB driver (bypass Mongoose schema validation)
    const db = mongoose.connection.db;
    const productsCollection = db.collection('products');
    
    // Step 1: Get all unique category strings from products using native driver
    const uniqueCategories = await productsCollection.distinct('category', {
      category: { $type: 'string' } // Only get string values
    });
    
    console.log(`📊 Found ${uniqueCategories.length} unique string categories in products:`);
    uniqueCategories.forEach(cat => console.log(`   - ${cat}`));
    console.log('');
    
    if (uniqueCategories.length === 0) {
      console.log('✅ No string categories found. All products already migrated!\n');
      await mongoose.connection.close();
      process.exit(0);
    }
    
    // Step 2: Create Category documents
    const createdCategories = [];
    const skippedCategories = [];
    
    for (const categoryName of uniqueCategories) {
      // Check if category already exists
      const existing = await Category.findOne({ name: categoryName });
      
      if (existing) {
        console.log(`⏭️  Category "${categoryName}" already exists (ID: ${existing._id})`);
        skippedCategories.push({ name: categoryName, id: existing._id });
        continue;
      }
      
      // Create new category
      const categoryData = CATEGORY_DATA[categoryName] || {
        description: `${categoryName} products and equipment`,
        displayOrder: 99,
        seo: {
          metaTitle: `${categoryName} | MedCore BD`,
          metaDescription: `Browse our range of ${categoryName.toLowerCase()} products.`,
          keywords: [categoryName.toLowerCase()]
        }
      };
      
      const category = await Category.create({
        name: categoryName,
        ...categoryData,
        isActive: true
      });
      
      console.log(`✅ Created category "${categoryName}" (ID: ${category._id})`);
      createdCategories.push({ name: categoryName, id: category._id });
    }
    
    console.log(`\n📝 Category Creation Summary:`);
    console.log(`   ✅ Created: ${createdCategories.length}`);
    console.log(`   ⏭️  Skipped (already exist): ${skippedCategories.length}`);
    console.log('');
    
    // Step 3: Update products to reference Category ObjectId using native driver
    console.log('🔄 Updating products with category references...\n');
    
    const allCategories = [...createdCategories, ...skippedCategories];
    let totalUpdated = 0;
    let totalErrors = 0;
    
    for (const { name, id } of allCategories) {
      try {
        // Use native MongoDB driver to bypass Mongoose validation
        const result = await productsCollection.updateMany(
          { category: name }, // Find products where category is still a string
          { $set: { category: new mongoose.Types.ObjectId(id) } } // Convert to ObjectId
        );
        
        console.log(`✅ Updated ${result.modifiedCount} products for category "${name}"`);
        totalUpdated += result.modifiedCount;
      } catch (error) {
        console.error(`❌ Error updating products for category "${name}":`, error.message);
        totalErrors++;
      }
    }
    
    console.log(`\n📊 Product Update Summary:`);
    console.log(`   ✅ Total products updated: ${totalUpdated}`);
    console.log(`   ❌ Errors: ${totalErrors}`);
    console.log('');
    
    // Step 4: Verify migration
    console.log('🔍 Verifying migration...\n');
    
    const productsWithStringCategory = await productsCollection.countDocuments({ 
      category: { $type: 'string' } 
    });
    
    const productsWithObjectIdCategory = await productsCollection.countDocuments({ 
      category: { $type: 'objectId' } 
    });
    
    console.log(`   📊 String categories remaining: ${productsWithStringCategory}`);
    console.log(`   📊 ObjectId categories: ${productsWithObjectIdCategory}`);
    console.log('');
    
    if (productsWithStringCategory > 0) {
      console.log(`⚠️  Warning: ${productsWithStringCategory} products still have string categories\n`);
      const samples = await productsCollection.find({ 
        category: { $type: 'string' } 
      }).limit(5).toArray();
      console.log('   Sample products with string categories:');
      samples.forEach(p => console.log(`      - ${p.name}: "${p.category}"`));
      console.log('');
    } else {
      console.log('✅ All products successfully migrated to ObjectId references!\n');
    }
    
    // Final summary
    console.log('═══════════════════════════════════════════════════════════');
    console.log('                    MIGRATION COMPLETE                     ');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`📁 Categories created: ${createdCategories.length}`);
    console.log(`📦 Products updated: ${totalUpdated}`);
    console.log(`❌ Errors: ${totalErrors}`);
    console.log(`✅ Success rate: ${totalErrors === 0 ? '100%' : Math.round((totalUpdated / (totalUpdated + totalErrors)) * 100) + '%'}`);
    console.log('═══════════════════════════════════════════════════════════\n');
    
    if (totalErrors === 0 && productsWithStringCategory === 0) {
      console.log('🎉 Migration completed successfully! All products now use ObjectId references.\n');
    } else {
      console.log('⚠️  Migration completed with warnings. Please review the output above.\n');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    logger.error(`[migrateCategories] ${error.message}`);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run migration
migrateCategories();
