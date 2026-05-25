/**
 * Add Phone Number to User Account
 * This script adds a phone number to a user so they can receive WhatsApp notifications
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m'
};

async function addPhoneToUser() {
  try {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║          Add Phone Number to User Account                 ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`${colors.green}✓${colors.reset} Connected to MongoDB\n`);

    // Get email from command line or use default
    const email = process.argv[2] || 'mahimrahman07@gmail.com';
    const phone = process.argv[3] || '8801646886795';

    console.log(`${colors.blue}Looking for user:${colors.reset} ${email}`);
    console.log(`${colors.blue}Phone to add:${colors.reset} ${phone}\n`);

    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      console.log(`${colors.red}✗ User not found with email: ${email}${colors.reset}\n`);
      console.log('Available users:');
      const users = await User.find({}).select('email name phone').limit(10);
      users.forEach(u => {
        console.log(`  - ${u.email} (${u.name}) - Phone: ${u.phone || 'N/A'}`);
      });
      process.exit(1);
    }

    console.log(`${colors.green}✓${colors.reset} User found: ${user.name} (${user.email})`);
    console.log(`  Current phone: ${user.phone || 'N/A'}`);

    // Update phone number
    user.phone = phone;
    await user.save();

    console.log(`${colors.green}✓${colors.reset} Phone number updated to: ${phone}\n`);

    // Verify update
    const updatedUser = await User.findById(user._id);
    console.log('Updated user details:');
    console.log(`  Name: ${updatedUser.name}`);
    console.log(`  Email: ${updatedUser.email}`);
    console.log(`  Phone: ${updatedUser.phone}`);
    console.log(`  Role: ${updatedUser.role}\n`);

    await mongoose.connection.close();
    console.log(`${colors.green}✓${colors.reset} Database connection closed\n`);

    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  ✅ Phone Number Added Successfully!                       ║');
    console.log('║                                                            ║');
    console.log('║  Now when you place an order, you will receive:           ║');
    console.log('║  • WhatsApp order confirmation                             ║');
    console.log('║  • WhatsApp status updates                                 ║');
    console.log('║  • SMS notifications                                       ║');
    console.log('║                                                            ║');
    console.log('║  Try placing another order to test!                        ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    process.exit(0);
  } catch (error) {
    console.error(`\n${colors.red}✗ Error:${colors.reset}`, error.message);
    process.exit(1);
  }
}

// Run script
addPhoneToUser();
