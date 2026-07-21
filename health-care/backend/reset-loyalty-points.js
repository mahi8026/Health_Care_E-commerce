/**
 * Reset All Loyalty Points to Zero
 * This script resets all user loyalty points to 0 and optionally clears transaction history
 * 
 * Usage:
 * node reset-loyalty-points.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const LoyaltyTransaction = require('./src/models/LoyaltyTransaction');
const Order = require('./src/models/Order');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/medcore';

async function resetLoyaltyPoints() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Step 1: Reset all user loyalty points to 0
    console.log('\n📊 Resetting all user loyalty points to 0...');
    const userUpdateResult = await User.updateMany(
      {},
      { $set: { loyaltyPoints: 0 } }
    );
    console.log(`✅ Updated ${userUpdateResult.modifiedCount} users`);

    // Step 2: Clear all loyalty transactions (optional - comment out if you want to keep history)
    console.log('\n🗑️  Clearing all loyalty transactions...');
    const transactionDeleteResult = await LoyaltyTransaction.deleteMany({});
    console.log(`✅ Deleted ${transactionDeleteResult.deletedCount} transactions`);

    // Step 3: Reset loyalty points fields in all orders
    console.log('\n📦 Resetting loyalty points in all orders...');
    const orderUpdateResult = await Order.updateMany(
      {},
      { 
        $set: { 
          loyaltyPointsEarned: 0,
          loyaltyPointsRedeemed: 0,
          loyaltyDiscount: 0
        } 
      }
    );
    console.log(`✅ Updated ${orderUpdateResult.modifiedCount} orders`);

    // Step 4: Show summary
    console.log('\n📋 Summary:');
    const totalUsers = await User.countDocuments({});
    const usersWithPoints = await User.countDocuments({ loyaltyPoints: { $gt: 0 } });
    const totalTransactions = await LoyaltyTransaction.countDocuments({});
    
    console.log(`   Total users: ${totalUsers}`);
    console.log(`   Users with points > 0: ${usersWithPoints}`);
    console.log(`   Total transactions: ${totalTransactions}`);

    if (usersWithPoints === 0 && totalTransactions === 0) {
      console.log('\n✅ All loyalty points successfully reset to zero!');
    } else {
      console.log('\n⚠️  Warning: Some data may not have been reset');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
console.log('⚠️  WARNING: This will reset ALL loyalty points to ZERO for ALL users!');
console.log('⚠️  This action cannot be undone!');
console.log('⚠️  Press Ctrl+C within 3 seconds to cancel...\n');

setTimeout(() => {
  resetLoyaltyPoints();
}, 3000);
