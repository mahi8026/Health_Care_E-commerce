require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');
const Quote = require('../models/Quote');
const logger = require('./logger');

// Comprehensive seed data for MedCore BD
const seedDatabase = async () => {
  try {
    await connectDB();
    logger.info('Clearing existing data...');
    
    await Promise.all([
      Product.deleteMany(),
      User.deleteMany(),
      Order.deleteMany(),
      Quote.deleteMany()
    ]);

    logger.info('Creating users...');
    
    // 3 Admin users
    const admin1 = await User.create({
      name: 'Shahid Admin',
      email: 'admin@medcorebd.com',
      password: 'admin123',
      phone: '+880 1812-345678',
      role: 'admin',
      accountType: 'B2B',
      companyName: 'MedCore BD',
      isActive: true,
      isVerified: true
    });

    const admin2 = await User.create({
      name: 'Fatima Manager',
      email: 'manager@medcorebd.com',
      password: 'manager123',
      phone: '+880 1813-456789',
      role: 'admin',
      accountType: 'B2B',
      companyName: 'MedCore BD',
      isActive: true,
      isVerified: true
    });

    const admin3 = await User.create({
      name: 'Karim Support',
      email: 'karim.support@medcorebd.com',
      password: 'support123',
      phone: '+880 1814-567890',
      role: 'admin',
      accountType: 'B2B',
      companyName: 'MedCore BD',
      isActive: true,
      isVerified: true
    });

    // 5 B2B customers
    const b2b1 = await User.create({
      name: 'Dr. Shahid Hasan',
      email: 'shahid@squarehospital.com',
      password: 'password123',
      phone: '+880 1712-345678',
      role: 'b2b_customer',
      accountType: 'B2B',
      companyName: 'Square Hospital',
      institutionType: 'Hospital',
      b2bAccount: true,
      b2bTier: 'Platinum',
      b2bId: 'B2B-04821',
      accountManager: 'Fatima Manager',
      creditLimit: 1000000,
      creditUsed: 225000,
      paymentTerms: 90,
      loyaltyPoints: 8420,
      addresses: [{
        label: 'Main Hospital',
        street: '18/F, Bir Uttam Qazi Nuruzzaman Sarak',
        thana: 'Panthapath',
        district: 'Dhaka',
        postcode: '1205',
        isDefault: true
      }],
      isActive: true,
      isVerified: true
    });

    const b2b2 = await User.create({
      name: 'Dr. Ayesha Rahman',
      email: 'ayesha@labaid.com',
      password: 'password123',
      phone: '+880 1713-456789',
      role: 'b2b_customer',
      accountType: 'B2B',
      companyName: 'Labaid Diagnostics',
      institutionType: 'Diagnostic Center',
      b2bAccount: true,
      b2bTier: 'Gold',
      b2bId: 'B2B-05932',
      accountManager: 'Fatima Manager',
      creditLimit: 500000,
      creditUsed: 125000,
      paymentTerms: 60,
      loyaltyPoints: 4210,
      addresses: [{
        label: 'Dhanmondi Branch',
        street: 'House 1, Road 4, Dhanmondi',
        thana: 'Dhanmondi',
        district: 'Dhaka',
        postcode: '1209',
        isDefault: true
      }],
      isActive: true,
      isVerified: true
    });

    const b2b3 = await User.create({
      name: 'Dr. Mahmud Khan',
      email: 'mahmud@ibnsinahospital.com',
      password: 'password123',
      phone: '+880 1714-567890',
      role: 'b2b_customer',
      accountType: 'B2B',
      companyName: 'Ibn Sina Hospital',
      institutionType: 'Hospital',
      b2bAccount: true,
      b2bTier: 'Gold',
      b2bId: 'B2B-06143',
      accountManager: 'Shahid Admin',
      creditLimit: 750000,
      creditUsed: 180000,
      paymentTerms: 60,
      loyaltyPoints: 5890,
      addresses: [{
        label: 'Sylhet Branch',
        street: 'Subhanighat, Sylhet',
        thana: 'Sylhet Sadar',
        district: 'Sylhet',
        postcode: '3100',
        isDefault: true
      }],
      isActive: true,
      isVerified: true
    });

    const b2b4 = await User.create({
      name: 'Dr. Nasrin Akter',
      email: 'nasrin@populardiagnostic.com',
      password: 'password123',
      phone: '+880 1715-678901',
      role: 'b2b_customer',
      accountType: 'B2B',
      companyName: 'Popular Diagnostic Centre',
      institutionType: 'Diagnostic Center',
      b2bAccount: true,
      b2bTier: 'Silver',
      b2bId: 'B2B-07254',
      accountManager: 'Fatima Manager',
      creditLimit: 300000,
      creditUsed: 85000,
      paymentTerms: 30,
      loyaltyPoints: 2340,
      addresses: [{
        label: 'Chittagong Branch',
        street: '2 English Road, Chittagong',
        thana: 'Kotwali',
        district: 'Chittagong',
        postcode: '4000',
        isDefault: true
      }],
      isActive: true,
      isVerified: true
    });

    const b2b5 = await User.create({
      name: 'Dr. Rafiq Ahmed',
      email: 'rafiq@uniteddiagnostic.com',
      password: 'password123',
      phone: '+880 1716-789012',
      role: 'b2b_customer',
      accountType: 'B2B',
      companyName: 'United Diagnostic Center',
      institutionType: 'Diagnostic Center',
      b2bAccount: true,
      b2bTier: 'Silver',
      b2bId: 'B2B-08365',
      accountManager: 'Shahid Admin',
      creditLimit: 250000,
      creditUsed: 45000,
      paymentTerms: 30,
      loyaltyPoints: 1560,
      addresses: [{
        label: 'Gulshan Branch',
        street: 'Plot 2, Road 53, Gulshan 2',
        thana: 'Gulshan',
        district: 'Dhaka',
        postcode: '1212',
        isDefault: true
      }],
      isActive: true,
      isVerified: true
    });

    // 10 Retail customers
    const customers = [];
    const customerData = [
      { name: 'Kamal Hossain', email: 'kamal@example.com', phone: '+880 1912-345678', district: 'Dhaka', thana: 'Mirpur' },
      { name: 'Rima Begum', email: 'rima@example.com', phone: '+880 1913-456789', district: 'Dhaka', thana: 'Uttara' },
      { name: 'Jamal Uddin', email: 'jamal@example.com', phone: '+880 1914-567890', district: 'Chittagong', thana: 'Agrabad' },
      { name: 'Sadia Islam', email: 'sadia@example.com', phone: '+880 1915-678901', district: 'Dhaka', thana: 'Dhanmondi' },
      { name: 'Rahim Mia', email: 'rahim@example.com', phone: '+880 1916-789012', district: 'Sylhet', thana: 'Zindabazar' },
      { name: 'Nusrat Jahan', email: 'nusrat@example.com', phone: '+880 1917-890123', district: 'Dhaka', thana: 'Banani' },
      { name: 'Habib Rahman', email: 'habib@example.com', phone: '+880 1918-901234', district: 'Chittagong', thana: 'Panchlaish' },
      { name: 'Farzana Akter', email: 'farzana@example.com', phone: '+880 1919-012345', district: 'Dhaka', thana: 'Mohammadpur' },
      { name: 'Shakil Ahmed', email: 'shakil@example.com', phone: '+880 1920-123456', district: 'Dhaka', thana: 'Gulshan' },
      { name: 'Taslima Nasrin', email: 'taslima@example.com', phone: '+880 1921-234567', district: 'Sylhet', thana: 'Sylhet Sadar' }
    ];

    for (const data of customerData) {
      const customer = await User.create({
        ...data,
        password: 'password123',
        role: 'customer',
        accountType: 'Retail',
        loyaltyPoints: Math.floor(Math.random() * 500),
        addresses: [{
          label: 'Home',
          street: `House ${Math.floor(Math.random() * 100) + 1}, Road ${Math.floor(Math.random() * 20) + 1}`,
          thana: data.thana,
          district: data.district,
          postcode: data.district === 'Dhaka' ? '1200' : data.district === 'Chittagong' ? '4000' : '3100',
          isDefault: true
        }],
        isActive: true,
        isVerified: true
      });
      customers.push(customer);
    }

    logger.info(`${3 + 5 + 10} users created`);

    logger.info('Creating products...');
    
    const products = [];

    // 30 Products across all categories
    const productData = [
      // Diagnostic Equipment (5)
      { name: 'Siemens Cardiostat ECG 12-lead', brand: 'Siemens Healthineers', category: 'Diagnostic Equipment', sku: 'SIE-ECG-001', price: 95000, oldPrice: 110000, stock: 45, description: 'Professional 12-lead ECG machine with advanced diagnostic capabilities', specifications: { Model: 'Cardiostat ECG-12', Channels: '12-lead', Display: '10.1" touchscreen', Connectivity: 'USB, LAN, WiFi', Battery: '4 hours', Weight: '2.5 kg' }, variants: { connectivity: ['USB', 'LAN', 'USB+LAN'], warranty: ['1-year', '2-year', '3-year'] }, badge: 'sale', rating: 4.8, reviewCount: 124, isFeatured: true, certifications: ['CE', 'FDA', 'ISO'] },
      { name: 'GE Vivid E95 Ultrasound System', brand: 'GE Healthcare', category: 'Diagnostic Equipment', sku: 'GE-US-002', price: 2850000, stock: 3, description: 'Premium cardiovascular ultrasound system with 4D imaging', specifications: { Model: 'Vivid E95', Probes: '4D Matrix Array', Display: '23" LED', Connectivity: 'DICOM, USB', Weight: '85 kg' }, badge: 'new', rating: 4.9, reviewCount: 42, isFeatured: true, certifications: ['CE', 'FDA'], hasAMC: true },
      { name: 'Philips IntelliVue MX40 Patient Monitor', brand: 'Philips', category: 'Diagnostic Equipment', sku: 'PHI-MON-003', price: 185000, stock: 28, description: 'Portable patient monitoring system with wireless connectivity', specifications: { Parameters: 'ECG, SpO2, NIBP, Temp', Display: '7" touchscreen', Battery: '3 hours', Weight: '1.8 kg' }, rating: 4.7, reviewCount: 89, certifications: ['CE', 'ISO'] },
      { name: 'Omron Digital Blood Pressure Monitor', brand: 'Omron', category: 'Diagnostic Equipment', sku: 'OMR-BP-004', price: 3500, oldPrice: 4200, stock: 150, description: 'Automatic upper arm blood pressure monitor with irregular heartbeat detection', specifications: { Type: 'Automatic', Cuff: '22-42 cm', Memory: '60 readings', Display: 'LCD' }, badge: 'bestseller', rating: 4.6, reviewCount: 312, isFeatured: true, certifications: ['CE', 'FDA'] },
      { name: 'Beurer Infrared Thermometer', brand: 'Beurer', category: 'Diagnostic Equipment', sku: 'BEU-TH-005', price: 2800, stock: 95, description: 'Non-contact infrared thermometer for forehead measurement', specifications: { Type: 'Infrared', Range: '32-42.9°C', Accuracy: '±0.2°C', Memory: '60 readings' }, rating: 4.5, reviewCount: 178, certifications: ['CE'] },

      // Surgical Instruments (5)
      { name: 'Stainless Steel Surgical Scissor Set', brand: 'Aesculap', category: 'Surgical Instruments', sku: 'AES-SCI-006', price: 12500, stock: 65, description: 'Premium surgical scissors set with 5 pieces', specifications: { Material: 'Stainless Steel', Pieces: '5', Sterilizable: 'Yes', Origin: 'Germany' }, rating: 4.8, reviewCount: 95, certifications: ['CE', 'ISO'] },
      { name: 'Disposable Surgical Blade Box', brand: 'Swann-Morton', category: 'Surgical Instruments', sku: 'SWA-BLA-007', price: 4500, stock: 8, minOrderQty: 10, description: 'Sterile surgical blades, box of 100', specifications: { Quantity: '100 blades', Type: 'Disposable', Sterile: 'Yes', Sizes: '10, 11, 15, 22' }, rating: 4.7, reviewCount: 156 },
      { name: 'Surgical Forceps Set', brand: 'KLS Martin', category: 'Surgical Instruments', sku: 'KLS-FOR-008', price: 18500, stock: 42, description: 'Precision surgical forceps, 8-piece set', specifications: { Material: 'Titanium Alloy', Pieces: '8', Autoclavable: 'Yes', Weight: '450g' }, rating: 4.9, reviewCount: 67, certifications: ['CE', 'ISO'] },
      { name: 'Electrosurgical Pencil', brand: 'Medtronic', category: 'Surgical Instruments', sku: 'MED-ESP-009', price: 8500, stock: 55, description: 'Reusable electrosurgical pencil with safety features', specifications: { Type: 'Reusable', Connector: 'Standard 3-pin', Cable: '3 meters', Autoclavable: 'Yes' }, rating: 4.6, reviewCount: 88, certifications: ['CE', 'FDA'] },
      { name: 'Surgical Suture Kit', brand: 'Ethicon', category: 'Surgical Instruments', sku: 'ETH-SUT-010', price: 6500, stock: 120, description: 'Absorbable surgical sutures, assorted sizes', specifications: { Type: 'Absorbable', Material: 'Polyglactin 910', Sizes: '2-0 to 5-0', Quantity: '12 pieces' }, badge: 'bestseller', rating: 4.8, reviewCount: 245, certifications: ['CE', 'FDA'] },

      // Laboratory Reagents (8)
      { name: 'Roche Cobas HbA1c Reagent Kit', brand: 'Roche Diagnostics', category: 'Laboratory Reagents', sku: 'ROC-HBA-011', price: 8500, stock: 8, lowStockThreshold: 20, minOrderQty: 5, description: 'High-precision HbA1c testing reagent for diabetes monitoring', storageTemp: 'cold', hazardClass: 'biohazard', lotNumber: 'LOT-2025-08841', expiryDate: new Date('2026-08-31'), tests: '100 tests per kit', badge: 'new', rating: 4.9, reviewCount: 89, isFeatured: true, certifications: ['CE', 'ISO'] },
      { name: 'Abbott Troponin I Reagent', brand: 'Abbott Laboratories', category: 'Laboratory Reagents', sku: 'ABB-TRO-012', price: 22000, stock: 15, lowStockThreshold: 25, minOrderQty: 2, description: 'Cardiac marker testing reagent for acute myocardial infarction', storageTemp: 'cold', hazardClass: 'biohazard', lotNumber: 'LOT-2025-11243', expiryDate: new Date('2025-12-31'), tests: '200 tests per pack', rating: 4.7, reviewCount: 56, isFeatured: true, certifications: ['CE', 'FDA'] },
      { name: 'Beckman CBC Reagent Pack', brand: 'Beckman Coulter', category: 'Laboratory Reagents', sku: 'BEC-CBC-013', price: 18000, stock: 62, description: 'Complete blood count reagent pack for DxH series analyzers', storageTemp: 'room', hazardClass: 'safe', lotNumber: 'LOT-2025-07731', expiryDate: new Date('2026-06-30'), tests: '500 tests · Lyse + diluent included', rating: 4.6, reviewCount: 42, certifications: ['CE'] },
      { name: 'Siemens Liver Function Panel Reagent', brand: 'Siemens Healthineers', category: 'Laboratory Reagents', sku: 'SIE-LFP-014', price: 14500, stock: 0, lowStockThreshold: 30, minOrderQty: 3, description: 'Comprehensive liver function testing reagent panel', storageTemp: 'cold', hazardClass: 'chemical', lotNumber: 'LOT-2025-09912', expiryDate: new Date('2026-03-31'), tests: '150 tests · ALT, AST, ALP, Bilirubin', rating: 4.5, reviewCount: 38 },
      { name: 'Bio-Rad Lipid Profile Reagent', brand: 'Bio-Rad', category: 'Laboratory Reagents', sku: 'BIO-LIP-015', price: 16500, stock: 35, description: 'Complete lipid profile testing reagent', storageTemp: 'cold', hazardClass: 'chemical', lotNumber: 'LOT-2025-10234', expiryDate: new Date('2026-05-15'), tests: '200 tests · TC, TG, HDL, LDL', rating: 4.7, reviewCount: 64, certifications: ['CE', 'ISO'] },
      { name: 'Sysmex Hematology Reagent', brand: 'Sysmex', category: 'Laboratory Reagents', sku: 'SYS-HEM-016', price: 19500, stock: 28, description: 'Hematology analyzer reagent for XN series', storageTemp: 'room', hazardClass: 'safe', lotNumber: 'LOT-2025-08567', expiryDate: new Date('2026-07-20'), tests: '1000 tests', rating: 4.8, reviewCount: 52, certifications: ['CE'] },
      { name: 'Ortho Clinical Immunoassay Reagent', brand: 'Ortho Clinical', category: 'Laboratory Reagents', sku: 'ORT-IMM-017', price: 24500, stock: 18, minOrderQty: 2, description: 'Immunoassay reagent for hormone testing', storageTemp: 'cold', hazardClass: 'biohazard', lotNumber: 'LOT-2025-09876', expiryDate: new Date('2026-04-10'), tests: '100 tests · TSH, T3, T4', rating: 4.6, reviewCount: 41, certifications: ['CE', 'FDA'] },
      { name: 'Randox Creatinine Reagent', brand: 'Randox', category: 'Laboratory Reagents', sku: 'RAN-CRE-018', price: 9500, stock: 48, description: 'Creatinine testing reagent for renal function', storageTemp: 'room', hazardClass: 'chemical', lotNumber: 'LOT-2025-11098', expiryDate: new Date('2026-09-25'), tests: '500 tests', rating: 4.5, reviewCount: 73, certifications: ['CE'] },

      // Hospital Machines (4)
      { name: 'Mindray BeneVision N12 Patient Monitor', brand: 'Mindray', category: 'Hospital Machines', sku: 'MIN-PM-019', price: 285000, stock: 12, description: 'Multi-parameter patient monitoring system', specifications: { Parameters: 'ECG, SpO2, NIBP, IBP, Temp, Resp', Display: '12.1" TFT', Battery: '4 hours', Network: 'WiFi, LAN' }, rating: 4.7, reviewCount: 34, certifications: ['CE', 'ISO'], hasAMC: true },
      { name: 'Dräger Savina 300 Ventilator', brand: 'Dräger', category: 'Hospital Machines', sku: 'DRA-VEN-020', price: 1850000, stock: 5, description: 'ICU ventilator with advanced modes', specifications: { Type: 'ICU Ventilator', Modes: 'SIMV, CPAP, BiPAP, APRV', Display: '15" touchscreen', Battery: '2 hours' }, badge: 'new', rating: 4.9, reviewCount: 18, certifications: ['CE', 'FDA'], hasAMC: true },
      { name: 'Fresenius 4008S Dialysis Machine', brand: 'Fresenius', category: 'Hospital Machines', sku: 'FRE-DIA-021', price: 1250000, stock: 8, description: 'Hemodialysis machine with online clearance monitoring', specifications: { Type: 'Hemodialysis', Flow: '0-500 ml/min', Display: '10.4" color', Water: 'RO compatible' }, rating: 4.8, reviewCount: 26, certifications: ['CE', 'ISO'], hasAMC: true },
      { name: 'Medtronic Puritan Bennett 980 Ventilator', brand: 'Medtronic', category: 'Hospital Machines', sku: 'MED-VEN-022', price: 2150000, stock: 4, description: 'Advanced ICU ventilator with lung protection', specifications: { Type: 'ICU Ventilator', Modes: 'Volume, Pressure, PRVC', Display: '15" touchscreen', Battery: '3 hours' }, rating: 4.9, reviewCount: 22, certifications: ['CE', 'FDA'], hasAMC: true },

      // Lab Equipment (4)
      { name: 'Eppendorf Centrifuge 5810R', brand: 'Eppendorf', category: 'Lab Equipment', sku: 'EPP-CEN-023', price: 485000, stock: 6, description: 'Refrigerated benchtop centrifuge', specifications: { Type: 'Refrigerated', Speed: '14000 rpm', Capacity: '4x250ml', Temp: '-10 to 40°C' }, rating: 4.8, reviewCount: 31, certifications: ['CE', 'ISO'] },
      { name: 'Thermo Fisher PCR Thermal Cycler', brand: 'Thermo Fisher', category: 'Lab Equipment', sku: 'THE-PCR-024', price: 625000, stock: 4, description: 'High-performance PCR thermal cycler', specifications: { Type: 'PCR', Blocks: '96-well', Gradient: 'Yes', Connectivity: 'USB, Ethernet' }, badge: 'new', rating: 4.9, reviewCount: 19, certifications: ['CE', 'ISO'] },
      { name: 'Mettler Toledo Analytical Balance', brand: 'Mettler Toledo', category: 'Lab Equipment', sku: 'MET-BAL-025', price: 185000, stock: 15, description: 'Precision analytical balance', specifications: { Capacity: '220g', Readability: '0.1mg', Calibration: 'Internal', Display: 'Color touchscreen' }, rating: 4.7, reviewCount: 48, certifications: ['CE', 'ISO'] },
      { name: 'Labconco Biosafety Cabinet Class II', brand: 'Labconco', category: 'Lab Equipment', sku: 'LAB-BSC-026', price: 725000, stock: 3, description: 'Class II Type A2 biosafety cabinet', specifications: { Type: 'Class II A2', Width: '4 feet', HEPA: 'Yes', UV: 'Yes' }, rating: 4.8, reviewCount: 24, certifications: ['CE', 'ISO'] },

      // PPE (2)
      { name: '3M N95 Respirator Mask Box', brand: '3M', category: 'PPE', sku: '3M-N95-027', price: 2500, stock: 250, minOrderQty: 10, description: 'NIOSH-approved N95 respirator masks, box of 20', specifications: { Type: 'N95', Quantity: '20 masks', Filtration: '95%', Certification: 'NIOSH' }, badge: 'bestseller', rating: 4.7, reviewCount: 412, certifications: ['CE', 'FDA'] },
      { name: 'Ansell Surgical Gloves Sterile', brand: 'Ansell', category: 'PPE', sku: 'ANS-GLV-028', price: 3500, stock: 180, minOrderQty: 5, description: 'Sterile latex surgical gloves, box of 50 pairs', specifications: { Type: 'Latex', Quantity: '50 pairs', Sterile: 'Yes', Sizes: '6.5, 7.0, 7.5, 8.0' }, rating: 4.6, reviewCount: 298, certifications: ['CE', 'ISO'] },

      // Implants (2)
      { name: 'Stryker Hip Implant System', brand: 'Stryker', category: 'Implants', sku: 'STR-HIP-029', price: 385000, stock: 12, description: 'Total hip replacement implant system', specifications: { Type: 'Hip Implant', Material: 'Titanium Alloy', Sizes: 'Multiple', Coating: 'Hydroxyapatite' }, rating: 4.9, reviewCount: 15, certifications: ['CE', 'FDA'], hasAMC: true },
      { name: 'Zimmer Knee Implant', brand: 'Zimmer Biomet', category: 'Implants', sku: 'ZIM-KNE-030', price: 425000, stock: 8, description: 'Total knee replacement implant', specifications: { Type: 'Knee Implant', Material: 'Cobalt Chrome', Sizes: 'Multiple', Design: 'Posterior Stabilized' }, rating: 4.8, reviewCount: 12, certifications: ['CE', 'FDA'], hasAMC: true }
    ];

    for (const data of productData) {
      const product = await Product.create(data);
      products.push(product);
    }

    logger.info(`${products.length} products created`);

    logger.info('Creating orders...');
    
    // 20 Orders with various statuses
    const orders = [];
    const orderStatuses = ['placed', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];
    const paymentMethods = ['bkash', 'nagad', 'beftn', 'b2b_credit', 'bank_transfer'];
    
    // B2B orders
    for (let i = 0; i < 10; i++) {
      const b2bUser = [b2b1, b2b2, b2b3, b2b4, b2b5][i % 5];
      const numItems = Math.floor(Math.random() * 3) + 2;
      const orderItems = [];
      let subtotal = 0;

      for (let j = 0; j < numItems; j++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const qty = Math.floor(Math.random() * 5) + 1;
        const price = product.price;
        subtotal += price * qty;
        orderItems.push({
          product: product._id,
          name: product.name,
          sku: product.sku,
          brand: product.brand,
          price,
          qty,
          quantity: qty
        });
      }

      const discountPct = b2bUser.b2bTier === 'Platinum' ? 30 : b2bUser.b2bTier === 'Gold' ? 22 : 10;
      const b2bDiscount = Math.round(subtotal * (discountPct / 100));
      const deliveryFee = subtotal > 50000 ? 0 : 500;
      const vatAmount = Math.round((subtotal - b2bDiscount) * 0.05);
      const totalAmount = subtotal - b2bDiscount + deliveryFee + vatAmount;

      const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
      const createdDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);

      const order = await Order.create({
        user: b2bUser._id,
        items: orderItems,
        subtotal,
        b2bDiscount,
        b2bDiscountPct: discountPct,
        discount: b2bDiscount,
        deliveryFee,
        vatAmount,
        totalAmount,
        total: totalAmount,
        deliveryAddress: b2bUser.addresses[0],
        deliveryType: 'standard',
        paymentMethod: 'b2b_credit',
        paymentStatus: status === 'cancelled' ? 'failed' : status === 'delivered' ? 'paid' : 'pending',
        status,
        accountManager: b2bUser.accountManager,
        createdAt: createdDate,
        updatedAt: createdDate
      });
      orders.push(order);
    }

    // Retail orders
    for (let i = 0; i < 10; i++) {
      const customer = customers[i % customers.length];
      const numItems = Math.floor(Math.random() * 2) + 1;
      const orderItems = [];
      let subtotal = 0;

      for (let j = 0; j < numItems; j++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const qty = Math.floor(Math.random() * 3) + 1;
        const price = product.price;
        subtotal += price * qty;
        orderItems.push({
          product: product._id,
          name: product.name,
          sku: product.sku,
          brand: product.brand,
          price,
          qty,
          quantity: qty
        });
      }

      const deliveryFee = subtotal > 50000 ? 0 : Math.floor(Math.random() * 2) === 0 ? 150 : 500;
      const vatAmount = Math.round(subtotal * 0.05);
      const totalAmount = subtotal + deliveryFee + vatAmount;

      const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
      const paymentMethod = paymentMethods[Math.floor(Math.random() * (paymentMethods.length - 1))]; // exclude b2b_credit
      const createdDate = new Date(Date.now() - Math.random() * 45 * 24 * 60 * 60 * 1000);

      const order = await Order.create({
        user: customer._id,
        items: orderItems,
        subtotal,
        deliveryFee,
        vatAmount,
        totalAmount,
        total: totalAmount,
        deliveryAddress: customer.addresses[0],
        deliveryType: deliveryFee === 500 ? 'express' : 'standard',
        paymentMethod,
        paymentStatus: status === 'cancelled' ? 'failed' : status === 'delivered' ? 'paid' : 'pending',
        status,
        createdAt: createdDate,
        updatedAt: createdDate
      });
      orders.push(order);
    }

    logger.info(`${orders.length} orders created`);

    logger.info('Creating quotations...');
    
    // 5 Quotations
    const quotes = [];
    const quoteStatuses = ['pending', 'sent', 'approved', 'converted'];

    for (let i = 0; i < 5; i++) {
      const b2bUser = [b2b1, b2b2, b2b3, b2b4, b2b5][i];
      const numItems = Math.floor(Math.random() * 4) + 2;
      const quoteItems = [];
      let subtotal = 0;

      for (let j = 0; j < numItems; j++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const qty = Math.floor(Math.random() * 10) + 5;
        const unitPrice = product.price;
        const discount = Math.floor(Math.random() * 5);
        subtotal += unitPrice * qty;
        quoteItems.push({
          product: product._id,
          name: product.name,
          sku: product.sku,
          brand: product.brand,
          qty,
          unitPrice,
          discount
        });
      }

      const discountPct = b2bUser.b2bTier === 'Platinum' ? 30 : b2bUser.b2bTier === 'Gold' ? 22 : 10;
      const discountAmount = Math.round(subtotal * (discountPct / 100));
      const finalAmount = subtotal - discountAmount;

      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + 30);

      const quote = await Quote.create({
        user: b2bUser._id,
        items: quoteItems,
        subtotal,
        discountPct,
        discountAmount,
        finalAmount,
        validUntil,
        paymentTerms: b2bUser.paymentTerms,
        status: quoteStatuses[i % quoteStatuses.length],
        accountManager: b2bUser.accountManager,
        notes: `Bulk order request for ${b2bUser.companyName}`
      });
      quotes.push(quote);
    }

    logger.info(`${quotes.length} quotations created`);

    logger.info('Database seeded successfully');
    logger.info(`Summary: ${3} admins | ${5} B2B customers | ${10} retail customers | ${products.length} products | ${orders.length} orders | ${quotes.length} quotations`);

    process.exit(0);
  } catch (error) {
    logger.error(`[seedDatabase] ${error.message}`);
    process.exit(1);
  }
};

// Run seeder
seedDatabase();
