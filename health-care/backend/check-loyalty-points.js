#!/usr/bin/env node
/**
 * Check User Loyalty Points
 * Diagnoses loyalty points calculation for a specific user
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Order = require('./src/models/Order');
const LoyaltyTransaction = require('./src/models/LoyaltyTransaction');

async function checkLoyaltyPoints() {
  try {
    console.log('🔍 Connecting to MongoDB...\n');
    await mongoose.connect(process.env.MONGODB_URI);

    // Find the user (Mahi M Rahman based on screenshots)
    const user = await User.findOne({ name: /Mahi.*Rahman/i });
    
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    console.log('👤 User:', user.name);
    console.log('   Email:', user.email);
    console.log('   Current Points:', user.loyaltyPoints || 0);
    console.log('');

    // Get all completed orders
    const orders = await Order.find({ 
      user: user._id,
      status: { $in: ['completed', 'placed', 'processing', 'shipped', 'delivered'] }
    }).sort({ createdAt: 1 });

    console.log(`📦 Orders (${orders.length} total):\n`);
    
    let expectedPoints = 0;
    let isFirstOrder = true;

    orders.forEach((order, index) => {
      const orderPoints = Math.floor(order.totalAmount * 0.01); // ৳100 = 1 point
      const bonus = isFirstOrder ? 200 : 0;
      isFirstOrder = false;
      
      expectedPoints += orderPoints + bonus;

      console.log(`   ${index + 1}. ${order.orderNumber}`);
      console.log(`      Amount: ৳${order.totalAmount.toLocaleString()}`);
      console.log(`      Points: ${orderPoints} ${bonus ? `+ ${bonus} (first order bonus)` : ''}`);
      console.log(`      Status: ${order.status}`);
      console.log(`      Date: ${order.createdAt.toISOString().split('T')[0]}`);
      console.log('');
    });

    console.log(`📊 Calculation:\n`);
    console.log(`   Expected Points (based on orders): ${expectedPoints}`);
    console.log(`   Actual Points (in database): ${user.loyaltyPoints || 0}`);
    console.log(`   Difference: ${(user.loyaltyPoints || 0) - expectedPoints}`);
    console.log('');

    // Check loyalty transactions
    const transactions = await LoyaltyTransaction.find({ user: user._id })
      .sort({ createdAt: 1 });

    if (transactions.length > 0) {
      console.log(`💳 Loyalty Transactions (${transactions.length} total):\n`);
      
      transactions.forEach((tx, index) => {
        console.log(`   ${index + 1}. ${tx.type.toUpperCase()}`);
        console.log(`      Points: ${tx.points > 0 ? '+' : ''}${tx.points}`);
        console.log(`      Balance After: ${tx.balance}`);
        console.log(`      Description: ${tx.description}`);
        console.log(`      Date: ${tx.createdAt.toISOString().split('T')[0]}`);
        console.log('');
      });

      // Calculate from transactions
      const totalEarned = transactions
        .filter(t => t.type === 'earn' || t.type === 'bonus')
        .reduce((sum, t) => sum + t.points, 0);
      
      const totalRedeemed = transactions
        .filter(t => t.type === 'redeem')
        .reduce((sum, t) => sum + Math.abs(t.points), 0);

      console.log(`   Total Earned: ${totalEarned}`);
      console.log(`   Total Redeemed: ${totalRedeemed}`);
      console.log(`   Net Balance: ${totalEarned - totalRedeemed}`);
      console.log('');
    } else {
      console.log('💳 No loyalty transactions found\n');
      console.log('⚠️  Points may have been awarded before transaction logging was implemented\n');
    }

    // Recommendations
    console.log('💡 Recommendations:\n');
    
    if (Math.abs((user.loyaltyPoints || 0) - expectedPoints) > 10) {
      console.log('   ⚠️  Significant difference detected!');
      console.log(`   • User has ${user.loyaltyPoints || 0} points but should have ~${expectedPoints}`);
      console.log('   • Possible reasons:');
      console.log('     - Points were manually adjusted');
      console.log('     - Points were redeemed (check transactions above)');
      console.log('     - Some orders did not award points');
      console.log('     - Calculation rate changed');
      console.log('');
      console.log('   To fix:');
      console.log(`     1. Manually adjust: db.users.updateOne({_id: ObjectId("${user._id}")}, {$set: {loyaltyPoints: ${expectedPoints}}})`);
      console.log('     2. Or recalculate points from all completed orders');
      console.log('');
    } else {
      console.log('   ✅ Points calculation looks correct!');
      console.log('');
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run
console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║           Check User Loyalty Points                         ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

checkLoyaltyPoints();
