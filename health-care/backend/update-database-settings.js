/**
 * Update Database Settings - MedCore BD → MediportBD Rebrand
 * Updates all company information in the settings collection
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Settings = require('./src/models/Settings');

async function updateSettings() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('📝 Updating company settings...');

    // Find or create settings document
    let settings = await Settings.findOne();
    
    if (!settings) {
      console.log('   Creating new settings document...');
      settings = new Settings();
    } else {
      console.log('   Found existing settings document');
    }

    // Update company information
    settings.companyName = 'MediportBD';
    settings.tagline = "Bangladesh's Most Trusted Medical Equipment Supplier";
    settings.contactPhone = '+880 1646-886795'; // Your real phone number
    settings.contactEmail = 'mahimrahman07@gmail.com'; // Your real email
    settings.supportHours = '24/7';
    settings.certifications = ['DGDA Registered', 'ISO 13485 Certified', 'CE Certified'];
    settings.freeDeliveryThreshold = 50000; // ৳50,000
    settings.returnPolicyDays = 30;
    settings.b2bMaxDiscount = 30; // 30% max discount
    settings.b2bCreditDays = 90; // 90 days credit

    await settings.save();

    console.log('\n✅ Settings updated successfully!');
    console.log('\n📋 Current Settings:');
    console.log(`   Company Name: ${settings.companyName}`);
    console.log(`   Tagline: ${settings.tagline}`);
    console.log(`   Contact Phone: ${settings.contactPhone}`);
    console.log(`   Contact Email: ${settings.contactEmail}`);
    console.log(`   Support Hours: ${settings.supportHours}`);
    console.log(`   Free Delivery: ৳${settings.freeDeliveryThreshold.toLocaleString()}`);
    console.log(`   Return Policy: ${settings.returnPolicyDays} days`);
    console.log(`   B2B Max Discount: ${settings.b2bMaxDiscount}%`);
    console.log(`   B2B Credit Terms: ${settings.b2bCreditDays} days`);
    console.log(`   Certifications: ${settings.certifications.join(', ')}`);

    console.log('\n✅ Database settings updated to MediportBD!\n');

    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    await mongoose.connection.close();
    process.exit(1);
  }
}

updateSettings();
