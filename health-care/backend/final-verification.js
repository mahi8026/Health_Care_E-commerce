#!/usr/bin/env node
/**
 * Final Verification - Simple Check
 * Verify the key categories that were fixed
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');
const Category = require('./src/models/Category');

async function finalVerification() {
  try {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║                  Final Verification                          ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
    
    await mongoose.connect(process.env.MONGODB_URI);

    // Key checks based on user's original issue
    console.log('✅ VERIFICATION CHECKLIST:\n');
    
    // 1. Check TANITA weight machine is NOT in Laboratory Equipment
    const labEquipment = await Category.findOne({ name: /laboratory equipment/i });
    const tanitaInLab = await Product.findOne({ 
      name: /TANITA UM-070/i,
      category: labEquipment._id 
    });
    
    if (tanitaInLab) {
      console.log('❌ FAIL: TANITA UM-070 is still in Laboratory Equipment');
    } else {
      console.log('✅ PASS: TANITA UM-070 is NOT in Laboratory Equipment');
    }
    
    // 2. Check TANITA weight machine IS in Diagnostic Equipment
    const diagnosticEquipment = await Category.findOne({ name: /diagnostic equipment/i });
    const tanitaInDiagnostic = await Product.findOne({ 
      name: /TANITA UM-070/i,
      category: diagnosticEquipment._id 
    });
    
    if (tanitaInDiagnostic) {
      console.log('✅ PASS: TANITA UM-070 is in Diagnostic Equipment (correct!)');
    } else {
      console.log('❌ FAIL: TANITA UM-070 is NOT in Diagnostic Equipment');
    }
    
    // 3. Check Laboratory Equipment product count
    const labEquipmentCount = await Product.countDocuments({ 
      category: labEquipment._id,
      isActive: true 
    });
    console.log(`\n📊 Laboratory Equipment: ${labEquipmentCount} products`);
    if (labEquipmentCount === 6) {
      console.log('✅ PASS: Laboratory Equipment has correct count (6)');
    } else {
      console.log(`⚠️  Laboratory Equipment count is ${labEquipmentCount} (expected 6)`);
    }
    
    // 4. Check Diagnostic Equipment product count
    const diagnosticEquipmentCount = await Product.countDocuments({ 
      category: diagnosticEquipment._id,
      isActive: true 
    });
    console.log(`\n📊 Diagnostic Equipment: ${diagnosticEquipmentCount} products`);
    if (diagnosticEquipmentCount === 63) {
      console.log('✅ PASS: Diagnostic Equipment has correct count (63)');
    } else {
      console.log(`⚠️  Diagnostic Equipment count is ${diagnosticEquipmentCount} (expected 63)`);
    }
    
    // 5. Check Orthopedic Supports product count
    const orthoSupports = await Category.findOne({ name: /orthopedic supports/i });
    const orthoCount = await Product.countDocuments({ 
      category: orthoSupports._id,
      isActive: true 
    });
    console.log(`\n📊 Orthopedic Supports: ${orthoCount} products`);
    if (orthoCount === 79) {
      console.log('✅ PASS: Orthopedic Supports has correct count (79, was 102)');
    } else {
      console.log(`⚠️  Orthopedic Supports count is ${orthoCount} (expected 79)`);
    }
    
    // 6. Check no weight machines in Laboratory Equipment
    const weightMachinesInLab = await Product.find({ 
      category: labEquipment._id,
      name: { $regex: /weight|scale|weighing|body fat|BMI/i }
    });
    
    if (weightMachinesInLab.length === 0) {
      console.log('\n✅ PASS: No weight machines in Laboratory Equipment');
    } else {
      console.log(`\n❌ FAIL: Found ${weightMachinesInLab.length} weight machine(s) in Laboratory Equipment:`);
      weightMachinesInLab.forEach(p => console.log(`   - ${p.name}`));
    }
    
    // 7. Check Rossmax V3 Suction Unit is in Hospital Machines
    const hospitalMachines = await Category.findOne({ name: /hospital machines/i });
    const suctionUnit = await Product.findOne({ 
      name: /Rossmax V3 Suction Unit/i,
      category: hospitalMachines._id
    });
    
    if (suctionUnit) {
      console.log('✅ PASS: Rossmax V3 Suction Unit is in Hospital Machines (correct!)');
    } else {
      console.log('⚠️  Rossmax V3 Suction Unit not found in Hospital Machines');
    }
    
    // 8. Check Medical Supplies count
    const medicalSupplies = await Category.findOne({ name: /^medical supplies$/i });
    const medicalSuppliesCount = await Product.countDocuments({ 
      category: medicalSupplies._id,
      isActive: true 
    });
    console.log(`\n📊 Medical Supplies: ${medicalSuppliesCount} products`);
    if (medicalSuppliesCount === 3) {
      console.log('✅ PASS: Medical Supplies has correct count (3)');
    } else {
      console.log(`⚠️  Medical Supplies count is ${medicalSuppliesCount} (expected 3)`);
    }
    
    // 9. Total product count
    const totalProducts = await Product.countDocuments({ isActive: true });
    console.log(`\n📊 Total Active Products: ${totalProducts}`);
    if (totalProducts === 287) {
      console.log('✅ PASS: Total product count is correct (287)');
    } else {
      console.log(`⚠️  Total product count is ${totalProducts} (expected 287)`);
    }
    
    // Summary
    console.log('\n═══════════════════════════════════════════════════════════\n');
    console.log('📋 SUMMARY OF ALL CATEGORY COUNTS:\n');
    
    const categories = await Category.find().sort({ name: 1 });
    for (const category of categories) {
      const count = await Product.countDocuments({ 
        category: category._id,
        isActive: true 
      });
      if (count > 0) {
        console.log(`   ${category.name}: ${count} products`);
      }
    }
    
    console.log('\n═══════════════════════════════════════════════════════════\n');
    console.log('✅ VERIFICATION COMPLETE!\n');
    console.log('💡 If all checks passed, the database is correct.');
    console.log('   If admin panel still shows wrong data, restart backend server.\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

finalVerification();
