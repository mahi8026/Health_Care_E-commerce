#!/usr/bin/env node

/**
 * GoWell Product Import Script
 * Adds GoWell products to MediportBD with Cloudinary image upload.
 *
 * Usage:
 *   node src/scripts/importGoWellProducts.js
 *
 * Add products to the GOWELL_PRODUCTS array below following the documented
 * structure in GOWELL_IMPORT_GUIDE.md.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Manufacturer = require('../models/Manufacturer');
const cloudinary = require('cloudinary').v2;
const slugify = require('slugify');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const GOWELL_PRODUCTS = [
  {
    name: 'GoWell Comfy Stim 806 Plus Digital TENS Machine',
    description:
      'Digital TENS machine providing effective pain relief and muscle stimulation with TENS and EMS technology. Features multiple therapy modes and adjustable intensity levels for versatile physiotherapy use at home or clinic.',
    category: 'Physiotherapy & Rehabilitation',
    price: 5860,
    oldPrice: null,
    stock: 20,
    lowStockThreshold: 5,
    unit: 'piece',
    minOrderQty: 1,
    images: [
      'https://gowellbd.com/wp-content/uploads/2026/04/311-scaled.jpg',
      'https://gowellbd.com/wp-content/uploads/2024/09/IMG_1589-scaled.jpg',
      'https://gowellbd.com/wp-content/uploads/2024/09/IMG_1586-rotated.jpg',
      'https://gowellbd.com/wp-content/uploads/2024/09/IMG_1583-rotated.jpg',
      'https://gowellbd.com/wp-content/uploads/2024/09/IMG_1578-rotated.jpg',
    ],
    specifications: {
      'Type': 'Digital TENS Machine (TENS & EMS)',
      'Technology': 'TENS and EMS',
      'Use': 'Pain relief and muscle stimulation',
      'Warranty': '1 year manufacturer warranty',
    },
    certifications: [],
    warranty: '1 year manufacturer warranty',
    badge: null,
    isFeatured: false,
    tags: ['GoWell', 'TENS Machine', 'Physiotherapy', 'Pain Relief', 'EMS'],
    sku: '59424695',
  },
  {
    name: 'GoWell Comfy Tens 804 Digital Physiotherapy Machine',
    description:
      'Digital physiotherapy machine offering non-invasive pain relief and muscle relaxation with TENS technology. Compact design for home and clinical physiotherapy use.',
    category: 'Physiotherapy & Rehabilitation',
    price: 4950,
    oldPrice: null,
    stock: 20,
    lowStockThreshold: 5,
    unit: 'piece',
    minOrderQty: 1,
    images: [
      'https://gowellbd.com/wp-content/uploads/2024/09/imgi_22_1317313_comfy-tens-physiotherapy-back-pain-remove-machine-physiotherapy-device-taiwan-made-with-warranty.jpg',
      'https://gowellbd.com/wp-content/uploads/2024/09/imgi_7_giant_278715.jpg',
      'https://gowellbd.com/wp-content/uploads/2024/09/imgi_6_giant_278714.jpg',
      'https://gowellbd.com/wp-content/uploads/2024/09/imgi_23_1317314_comfy-tens-physiotherapy-back-pain-remove-machine-physiotherapy-device-taiwan-made-with-warranty.jpg',
      'https://gowellbd.com/wp-content/uploads/2024/09/Gemini_Generated_Image_gcon9fgcon9fgcon.png',
    ],
    specifications: {
      'Type': 'Digital Physiotherapy Machine',
      'Technology': 'TENS',
      'Use': 'Non-invasive pain relief and muscle relaxation',
      'Warranty': '1 year manufacturer warranty',
    },
    certifications: [],
    warranty: '1 year manufacturer warranty',
    badge: null,
    isFeatured: false,
    tags: ['GoWell', 'TENS Machine', 'Physiotherapy', 'Pain Relief'],
    sku: '59423799',
  },
  {
    name: 'GoWell Blueidea Electronic TENS Pulse Massager BLD321',
    description:
      'Electronic TENS pulse massager with LCD digital screen and 8 therapy modes. Adjustable intensity levels, suitable for full body use. Lightweight and compact design for home physiotherapy and pain relief.',
    category: 'Physiotherapy & Rehabilitation',
    price: 1590,
    oldPrice: null,
    stock: 50,
    lowStockThreshold: 10,
    unit: 'piece',
    minOrderQty: 1,
    images: [
      'https://gowellbd.com/wp-content/uploads/2026/05/s-l1600-8.webp',
      'https://gowellbd.com/wp-content/uploads/2026/05/s-l1600-9.webp',
      'https://gowellbd.com/wp-content/uploads/2026/05/s-l1600-8-1.webp',
      'https://gowellbd.com/wp-content/uploads/2026/05/s-l1600-7-1.webp',
      'https://gowellbd.com/wp-content/uploads/2026/05/s-l1600-6-2.webp',
    ],
    specifications: {
      'Brand': 'Blueidea',
      'Model': 'BLD-321',
      'Type': 'Electronic TENS Pulse Massager',
      'Display': 'LCD Digital Screen',
      'Modes': '8 Therapy Modes',
      'Intensity': 'Adjustable Levels',
      'Usage Area': 'Full Body',
      'Portability': 'Lightweight & Compact',
      'Warranty': '1 year manufacturer warranty',
    },
    certifications: [],
    warranty: '1 year manufacturer warranty',
    badge: null,
    isFeatured: false,
    tags: ['GoWell', 'TENS Machine', 'Pulse Massager', 'Physiotherapy', 'Pain Relief'],
    sku: '61727139',
  },
  {
    name: 'GoWell 35W Disposable Skin Stapler (Stainless Steel)',
    description:
      'High-quality 35W disposable skin stapler with 35 stainless steel staples. Designed for safe, precise, and sterile wound closure in medical applications. Single-use, ready-to-use design for surgical and clinical use.',
    category: 'Surgical Instruments',
    price: 400,
    oldPrice: null,
    stock: 100,
    lowStockThreshold: 20,
    unit: 'piece',
    minOrderQty: 1,
    images: [
      'https://gowellbd.com/wp-content/uploads/2026/06/35W.jpg',
      'https://gowellbd.com/wp-content/uploads/2026/06/35W1.jpg',
      'https://gowellbd.com/wp-content/uploads/2026/06/imgi_81_f62c816cf1e07567dbc5669cbd6aeaa2.jpg',
      'https://gowellbd.com/wp-content/uploads/2026/06/imgi_82_f22b7d640e08ce95a38b853ef7d5dc2b.jpg',
    ],
    specifications: {
      'Type': 'Disposable Skin Stapler',
      'Staple Count': '35 stainless steel staples',
      'Material': 'Stainless Steel',
      'Use': 'Wound closure - surgical and clinical',
      'Sterility': 'Sterile, single-use',
      'Warranty': '1 year manufacturer warranty',
    },
    certifications: ['CE'],
    warranty: '1 year manufacturer warranty',
    badge: null,
    isFeatured: false,
    tags: ['GoWell', 'Skin Stapler', 'Surgical', 'Wound Closure', 'Disposable'],
    sku: '03315403',
  },
  {
    name: 'GoWell Dual Light Zoom Headlamp T6',
    description:
      'Dual light source headlamp with powerful illumination, telescopic zoom for wide and focused lighting, and high beam intensity. Features three lighting modes for versatile use, a durable aluminium alloy body, adjustable 90° lighting angle, comfortable headband, and red rear indicator light for safety. Powered by a rechargeable 2400mAh battery. Ideal for outdoor work, camping, hiking, inspection, and medical examination use.',
    category: 'Diagnostic Equipment',
    price: 880,
    oldPrice: null,
    stock: 30,
    lowStockThreshold: 10,
    unit: 'piece',
    minOrderQty: 1,
    images: [
      'https://gowellbd.com/wp-content/uploads/2026/04/dual-zoom.png',
      'https://gowellbd.com/wp-content/uploads/2026/04/4%D1%81.jpg',
      'https://gowellbd.com/wp-content/uploads/2026/04/Gemini_Generated_Image_7u941n7u941n7u94.png',
      'https://gowellbd.com/wp-content/uploads/2026/04/6%D1%81.jpg',
      'https://gowellbd.com/wp-content/uploads/2026/04/8%D1%81.jpg',
    ],
    specifications: {
      'Type': 'Dual Light Zoom Headlamp',
      'Material': 'Aluminium Alloy',
      'Power Source': 'Rechargeable Battery (2400mAh)',
      'Lighting Angle': 'Adjustable up to 90°',
      'Lighting Modes': 'Three modes (high beam intensity)',
      'Zoom': 'Telescopic zoom for wide and focused lighting',
      'Safety Feature': 'Red rear indicator light',
      'Headband': 'Adjustable and comfortable',
      'Colour': 'Multicolour',
      'Warranty': '1 year manufacturer warranty',
    },
    certifications: [],
    warranty: '1 year manufacturer warranty',
    badge: 'new',
    isFeatured: false,
    tags: ['GoWell', 'Headlamp', 'Flash Light', 'Rechargeable'],
    sku: '01514079',
  },
  {
    name: 'GoWell Blueidea Neck Massager Pillow BLD118',
    description:
      'Rechargeable neck massager pillow with U-shaped design that wraps around the neck and shoulders. Compact and portable, ideal for home, office, or travel use. Provides relaxing massage to relieve tired neck and shoulder muscles.',
    category: 'Physiotherapy & Rehabilitation',
    price: 1750,
    oldPrice: null,
    stock: 30,
    lowStockThreshold: 10,
    unit: 'piece',
    minOrderQty: 1,
    images: [
      'https://gowellbd.com/wp-content/uploads/2026/08/Untitled-1.jpg',
      'https://gowellbd.com/wp-content/uploads/2026/08/01-1-4.jpg',
      'https://gowellbd.com/wp-content/uploads/2026/08/02-32.jpg',
      'https://gowellbd.com/wp-content/uploads/2026/08/03-30.jpg',
      'https://gowellbd.com/wp-content/uploads/2026/08/04-30.jpg',
    ],
    specifications: {
      'Brand': 'Blueidea',
      'Model': 'BLD-118',
      'Type': 'Rechargeable Neck Massager Pillow',
      'Use': 'Neck and shoulder relaxation',
      'Portability': 'Compact, home/office/travel',
      'Warranty': '1 year manufacturer warranty',
    },
    certifications: [],
    warranty: '1 year manufacturer warranty',
    badge: null,
    isFeatured: false,
    tags: ['GoWell', 'Neck Massager', 'Massage', 'Physiotherapy', 'Relaxation'],
    sku: '39719019',
  },
  {
    name: 'GoWell Double Head Massage Gun',
    description:
      'Powerful double-head massage gun for deep muscle relaxation and recovery. Two massage heads deliver double the coverage with adjustable intensity, suitable for athletes and home physiotherapy use.',
    category: 'Physiotherapy & Rehabilitation',
    price: 1795,
    oldPrice: null,
    stock: 30,
    lowStockThreshold: 10,
    unit: 'piece',
    minOrderQty: 1,
    images: [
      'https://gowellbd.com/wp-content/uploads/2025/05/247-scaled.jpg',
      'https://gowellbd.com/wp-content/uploads/2024/10/Orange-and-White-Best-Selling-Product-Instagram-Post-2024-10-16T104109.899.jpg',
    ],
    specifications: {
      'Type': 'Double Head Massage Gun',
      'Use': 'Deep muscle relaxation and recovery',
      'Heads': '2 massage heads',
      'Warranty': '1 year manufacturer warranty',
    },
    certifications: [],
    warranty: '1 year manufacturer warranty',
    badge: null,
    isFeatured: false,
    tags: ['GoWell', 'Massage Gun', 'Massage', 'Muscle Recovery', 'Physiotherapy'],
    sku: '59371455',
  },
  {
    name: 'GoWell Mini Massage Gun 4 Head',
    description:
      'Compact mini massage gun with 4 interchangeable massage heads, 1200mAh rechargeable battery with 4-6 hours working time, and USB-C charging. Lightweight metal body for portable muscle relaxation and recovery at home or on the go.',
    category: 'Physiotherapy & Rehabilitation',
    price: 899,
    oldPrice: null,
    stock: 40,
    lowStockThreshold: 10,
    unit: 'piece',
    minOrderQty: 1,
    images: [
      'https://gowellbd.com/wp-content/uploads/2025/11/251-scaled.jpg',
      'https://gowellbd.com/wp-content/uploads/2026/02/91-1024x1024-1.avif',
      'https://gowellbd.com/wp-content/uploads/2025/11/256-scaled.jpg',
      'https://gowellbd.com/wp-content/uploads/2026/02/Go-Well-Products-2-scaled.jpg',
    ],
    specifications: {
      'Type': 'Mini Massage Gun',
      'Heads': '4 interchangeable massage heads',
      'Battery': '1200mAh rechargeable, 4-6 hours working time',
      'Charging': 'USB-C',
      'Material': 'Lightweight metal body',
      'Warranty': '1 year manufacturer warranty',
    },
    certifications: [],
    warranty: '1 year manufacturer warranty',
    badge: null,
    isFeatured: false,
    tags: ['GoWell', 'Massage Gun', 'Massage', 'Muscle Recovery', 'Portable'],
    sku: '39778431',
  },
  {
    name: 'GoWell Small Mesh Nebulizer',
    description:
      'Compact small mesh nebulizer for effective respiratory therapy at home or on the go. Uses advanced mesh technology for fine particle mist, one-button operation, and quiet performance. Powered by USB rechargeable battery or AA batteries.',
    category: 'Respiratory Equipment',
    price: 810,
    oldPrice: null,
    stock: 40,
    lowStockThreshold: 10,
    unit: 'piece',
    minOrderQty: 1,
    images: [
      'https://gowellbd.com/wp-content/uploads/2024/10/imgi_87_JSL-W303-6.jpg.webp',
      'https://gowellbd.com/wp-content/uploads/2024/10/imgi_65_7b629b2fc09119c4423af327033f7221.jpg',
      'https://gowellbd.com/wp-content/uploads/2024/10/imgi_63_071b7be358dd36051fb2664b8f2b6ac8.jpg',
      'https://gowellbd.com/wp-content/uploads/2024/10/imgi_68_074757c7b58a37273b01239a8b20f0c6.jpg',
    ],
    specifications: {
      'Type': 'Small Mesh Nebulizer',
      'Technology': 'Mesh technology, fine particle mist',
      'Power Source': 'USB rechargeable or AA battery',
      'Operation': 'One-button, silent',
      'Use': 'Respiratory therapy',
      'Warranty': '1 year manufacturer warranty',
    },
    certifications: [],
    warranty: '1 year manufacturer warranty',
    badge: null,
    isFeatured: false,
    tags: ['GoWell', 'Nebulizer', 'Respiratory', 'Inhaler', 'Mesh'],
    sku: '35335487',
  },
  {
    name: 'GoWell Hijama Cupping Therapy 32 Set',
    description:
      'Complete 32-piece hijama cupping therapy set for full-body wellness. Includes durable glass and plastic cups with a manual suction pump for controlled vacuum pressure without heat. Helps stimulate blood circulation, relax muscles, and relieve body tension for personal or professional use.',
    category: 'Physiotherapy & Rehabilitation',
    price: 1800,
    oldPrice: null,
    stock: 25,
    lowStockThreshold: 10,
    unit: 'set',
    minOrderQty: 1,
    images: [
      'https://gowellbd.com/wp-content/uploads/2026/04/s-l1600-4-1-1.webp',
      'https://gowellbd.com/wp-content/uploads/2026/04/s-l1600-3-1-1.webp',
      'https://gowellbd.com/wp-content/uploads/2026/04/s-l1600-2-1-1.webp',
    ],
    specifications: {
      'Brand': 'Baoyi',
      'Model': 'BY-3213',
      'Quantity': '32 pieces',
      'Material': 'Glass & Plastic',
      'Application': 'Whole body',
      'Includes': 'Manual suction pump',
      'Origin': 'Zhejiang, China',
      'Warranty': '1 year manufacturer warranty',
    },
    certifications: [],
    warranty: '1 year manufacturer warranty',
    badge: null,
    isFeatured: false,
    tags: ['GoWell', 'Hijama', 'Cupping Therapy', 'Wellness', 'Blood Circulation'],
    sku: '01459606',
  },
  {
    name: 'GoWell Manual Breast Pump 120ml',
    description:
      'Manual breast pump (model AB-121) with gentle and effective milk expression for nursing mothers. Ergonomic design, compact and lightweight for home and travel use. Made from safe and baby-friendly materials, easy to assemble and clean.',
    category: 'Medical Supplies',
    price: 500,
    oldPrice: null,
    stock: 30,
    lowStockThreshold: 10,
    unit: 'piece',
    minOrderQty: 1,
    images: [
      'https://gowellbd.com/wp-content/uploads/2026/04/798f70c1a512305d8ecbce11220ed2ce.jpg_2200x2200q80.jpg_.webp',
      'https://gowellbd.com/wp-content/uploads/2026/04/1248605_apple-bear-brest-pump-manual-control-valve-mom-breastfeeding-baby-milk-suction-feeding-newborn-bottl.webp',
      'https://gowellbd.com/wp-content/uploads/2026/04/104821597_575660413094543_5951604237391904108_n.jpg',
      'https://gowellbd.com/wp-content/uploads/2026/04/f91a226327b3e25fc256fc1bdfa18373.jpg_2200x2200q80.jpg_.webp',
    ],
    specifications: {
      'Model': 'AB-121',
      'Capacity': '120ml',
      'Type': 'Manual Breast Pump',
      'Material': 'Safe, baby-friendly materials',
      'Operation': 'Manual',
      'Use': 'Breast milk expression',
      'Warranty': '1 year manufacturer warranty',
    },
    certifications: [],
    warranty: '1 year manufacturer warranty',
    badge: null,
    isFeatured: false,
    tags: ['GoWell', 'Breast Pump', 'Baby & Mom Care', 'Manual', 'Nursing'],
    sku: '01452064',
  },
  {
    name: 'GoWell Milk Extractor (Manual Breast Pump)',
    description:
      'Lightweight manual breast pump with soft breast shield and ergonomic hand pump for comfortable, gentle milk expression. BPA-free plastic and silicone materials, easy to assemble and clean. Ideal for home, office, and travel use. Includes collection bottle, soft breast shield, and bottle cap.',
    category: 'Medical Supplies',
    price: 190,
    oldPrice: null,
    stock: 40,
    lowStockThreshold: 10,
    unit: 'piece',
    minOrderQty: 1,
    images: [
      'https://gowellbd.com/wp-content/uploads/2026/06/imgi_74_PUR_Milk_Extractor_Breast_Pump-Pur-6a451-239184.jpg',
      'https://gowellbd.com/wp-content/uploads/2026/06/imgi_75_PUR_Milk_Extractor_Breast_Pump-Pur-6b074-239184.jpg',
      'https://gowellbd.com/wp-content/uploads/2026/06/imgi_76_PUR_Milk_Extractor_Breast_Pump-Pur-45eea-239184.jpg',
      'https://gowellbd.com/wp-content/uploads/2026/06/255-scaled.jpg',
      'https://gowellbd.com/wp-content/uploads/2026/06/254-scaled.jpg',
    ],
    specifications: {
      'Type': 'Manual Breast Pump',
      'Material': 'BPA-Free Plastic & Silicone',
      'Operation': 'Manual Hand Pump',
      'Portability': 'Lightweight & Travel-Friendly',
      'Reusable': 'Yes',
      'Usage': 'Breast Milk Expression & Collection',
      'Warranty': '1 year manufacturer warranty',
    },
    certifications: [],
    warranty: '1 year manufacturer warranty',
    badge: null,
    isFeatured: false,
    tags: ['GoWell', 'Breast Pump', 'Milk Extractor', 'Baby & Mom Care', 'Manual'],
    sku: '03307679',
  },
  {
    name: 'GoWell Therapy TENS Machine Gel Pad',
    description:
      'Reusable, skin-friendly gel pad for therapy machines including TENS units and ultrasound devices. Superior conductivity ensures efficient transmission of electrical and thermal therapy, with a soft flexible design that conforms to the body. Cost-effective and sustainable for ongoing therapy needs.',
    category: 'Physiotherapy & Rehabilitation',
    price: 215,
    oldPrice: null,
    stock: 50,
    lowStockThreshold: 10,
    unit: 'piece',
    minOrderQty: 1,
    images: [
      'https://gowellbd.com/wp-content/uploads/2024/05/c07fc58fd6b9a8114fd9e00752334148.jpg_720x720q80.jpg',
      'https://gowellbd.com/wp-content/uploads/2024/05/Untitled-design-11.jpg',
    ],
    specifications: {
      'Type': 'Therapy Machine Gel Pad',
      'Compatibility': 'TENS units, ultrasound machines and other therapy devices',
      'Material': 'Skin-friendly gel',
      'Reusable': 'Yes',
      'Origin': 'Taiwan / China',
      'Warranty': '1 year manufacturer warranty',
    },
    certifications: [],
    warranty: '1 year manufacturer warranty',
    badge: null,
    isFeatured: false,
    tags: ['GoWell', 'TENS', 'Gel Pad', 'Physiotherapy', 'Accessory'],
    sku: 'KF5050',
  },
  {
    name: 'NittoNova Fascia Massage Gun LM-130 With 9 Multi-Head Attachment',
    description:
      'Fascia massage gun with 6-speed adjustable intensity from light to deep-tissue therapy and 9 interchangeable massage heads for neck, shoulders, back, hands, waist, and feet. Compact and lightweight design in premium ABS (only 364g) with whisper-quiet performance. Includes charging cable.',
    category: 'Physiotherapy & Rehabilitation',
    price: 999,
    oldPrice: 1500,
    stock: 100,
    lowStockThreshold: 10,
    unit: 'piece',
    minOrderQty: 1,
    images: [
      'https://nittonova.com/storage/products/1782840955_6a43fe7b96daf.webp',
      'https://nittonova.com/storage/products/gallery/1782744042_6a4283ea5cefa.webp',
      'https://nittonova.com/storage/products/gallery/1786864879_6a8164ef8e7e6.webp',
      'https://nittonova.com/storage/products/gallery/1786864880_6a8164f039d2a.webp',
      'https://nittonova.com/storage/products/gallery/1786864880_6a8164f0e0cce.webp',
    ],
    specifications: {
      'Model': 'LM-130',
      'Type': 'Fascia Massage Gun',
      'Speed Adjustment': '6 Gears',
      'Massage Heads': '9 interchangeable heads',
      'Battery': '1200mAh',
      'Rated Power': '24W',
      'Rated Voltage': '5V 1A',
      'Net Weight': '364g',
      'Material': 'Premium ABS',
      'Warranty': '3 days replacement warranty',
    },
    certifications: [],
    warranty: '3 days replacement warranty',
    badge: null,
    isFeatured: false,
    tags: ['NittoNova', 'Massage Gun', 'Fascia Gun', 'Muscle Recovery', 'Physiotherapy'],
    sku: 'LM-130',
  },
  {
    name: 'NittoNova Smart Scalp Massager with Red Light',
    description:
      'Smart scalp massager with red light therapy, 3D deep kneading massage with 4 independent massage heads and 96 soft silicone nodes. 3 speed levels, IPX7 waterproof rating, USB Type-C rechargeable battery with 2-3 hours working time. Suitable for head, scalp, neck and shoulders.',
    category: 'Physiotherapy & Rehabilitation',
    price: 740,
    oldPrice: 1200,
    stock: 3,
    lowStockThreshold: 5,
    unit: 'piece',
    minOrderQty: 1,
    images: [
      'https://nittonova.com/storage/products/1782841284_6a43ffc4efd47.webp',
      'https://nittonova.com/storage/products/gallery/1782750210_6a429c020934a.webp',
      'https://nittonova.com/storage/products/gallery/1782750210_6a429c0228bcd.webp',
      'https://nittonova.com/storage/products/gallery/1782750210_6a429c0245f8a.webp',
      'https://nittonova.com/storage/products/gallery/1782750210_6a429c0261648.webp',
    ],
    specifications: {
      'Model': 'M001',
      'Type': 'Smart Scalp Massager with Red Light',
      'Massage Technology': '3D Deep Kneading Massage',
      'Massage Heads': '4 independent heads, 96 soft silicone nodes',
      'Speed Levels': '3',
      'Waterproof Rating': 'IPX7',
      'Battery': 'Rechargeable lithium, USB Type-C, ~1 hour charge',
      'Working Time': 'Up to 2-3 hours',
      'Rated Power': '5W',
      'Input Voltage': 'DC 5V/1A',
      'Material': 'Premium ABS + Food-Grade Silicone',
      'Color': 'Black, White, Pink, Red, Green',
      'Warranty': '3 months replacement guarantee',
    },
    certifications: [],
    warranty: '3 months replacement guarantee',
    badge: 'sale',
    isFeatured: false,
    tags: ['NittoNova', 'Scalp Massager', 'Red Light', 'Head Massage', 'Relaxation'],
    sku: 'M001',
  },
  {
    name: 'NittoNova Bionic Neck & Shoulder Massager with Fingers',
    description:
      'Bionic neck and shoulder massager with finger-style massage nodes that mimic human hand kneading to relieve tension in the neck and shoulder area. Ideal for relaxation after long working hours, at home or in the office.',
    category: 'Physiotherapy & Rehabilitation',
    price: 2450,
    oldPrice: 2700,
    stock: 0,
    lowStockThreshold: 5,
    unit: 'piece',
    minOrderQty: 1,
    images: [
      'https://nittonova.com/storage/products/1782816809_6a43a029ddd8e.webp',
    ],
    specifications: {
      'Model': 'M002',
      'Type': 'Bionic Neck & Shoulder Massager',
      'Massage Style': 'Finger-style massage nodes',
      'Use': 'Neck and shoulder tension relief',
      'Warranty': '1 year manufacturer warranty',
    },
    certifications: [],
    warranty: '1 year manufacturer warranty',
    badge: null,
    isFeatured: false,
    tags: ['NittoNova', 'Neck Massager', 'Shoulder Massager', 'Massage', 'Relaxation'],
    sku: 'M002',
  },
  {
    name: 'NittoNova Five Headed Fascia Gun DH-780 | 9 Multi-Head Attachment',
    description:
      'Five-headed fascia gun (DH-780) with 9 multi-head attachments for targeted deep muscle relief. Compact fascia massage gun for muscle recovery, relaxation, and physiotherapy use at home or on the go.',
    category: 'Physiotherapy & Rehabilitation',
    price: 1290,
    oldPrice: 1800,
    stock: 0,
    lowStockThreshold: 5,
    unit: 'piece',
    minOrderQty: 1,
    images: [
      'https://nittonova.com/storage/products/1782841628_6a44011c56523.webp',
      'https://nittonova.com/storage/products/gallery/1782814376_6a4396a8f1b3f.webp',
      'https://nittonova.com/storage/products/gallery/1782814377_6a4396a90739d.webp',
    ],
    specifications: {
      'Model': 'DH-780',
      'Type': 'Five Headed Fascia Gun',
      'Attachments': '9 multi-head attachments',
      'Use': 'Deep muscle relief and recovery',
      'Warranty': '1 year manufacturer warranty',
    },
    certifications: [],
    warranty: '1 year manufacturer warranty',
    badge: null,
    isFeatured: false,
    tags: ['NittoNova', 'Fascia Gun', 'Massage Gun', 'Muscle Recovery', 'Physiotherapy'],
    sku: 'DH-780',
  },
  {
    name: 'JMI Scalp Vein Set 19G (1 Box of 50 Pcs)',
    description:
      'JMI Scalp Vein Set 19G is a sterile disposable butterfly needle set designed for healthcare and clinical use. 19G needle size, produced following quality and safety standards for reliable performance in professional medical applications. Box of 50 pieces.',
    category: 'IV & Infusion Therapy',
    price: 500,
    oldPrice: null,
    stock: 46,
    lowStockThreshold: 10,
    unit: 'box',
    minOrderQty: 1,
    images: [
      'https://mouripharma.blr1.digitaloceanspaces.com/healthcare/2026/06/jmi-scalp-vein-set-19g-1box-5ko1VW.jpg',
    ],
    specifications: {
      'Brand': 'JMI',
      'Type': 'Scalp Vein Set (Butterfly Needle)',
      'Needle Size': '19G',
      'Sterility': 'Sterile, disposable',
      'Pack Size': '1 Box (50 Pcs)',
      'Use': 'Intravenous infusion and clinical use',
    },
    certifications: [],
    warranty: null,
    badge: null,
    isFeatured: false,
    tags: ['JMI', 'Scalp Vein Set', 'Butterfly Needle', 'IV', 'Disposable'],
    sku: 'HC1436',
    manufacturer: 'JMI',
  },
  {
    name: 'JMI Scalp Vein Set 21G (1 Box of 50 Pcs)',
    description:
      'JMI Scalp Vein Set 21G is a sterile disposable butterfly needle set designed for healthcare and clinical use. 21G needle size, produced following quality and safety standards for reliable performance in professional medical applications. Box of 50 pieces.',
    category: 'IV & Infusion Therapy',
    price: 500,
    oldPrice: null,
    stock: 49,
    lowStockThreshold: 10,
    unit: 'box',
    minOrderQty: 1,
    images: [
      'https://mouripharma.blr1.digitaloceanspaces.com/healthcare/2026/06/jmi-scalp-vein-set-21g-1box-kNrfAJ.jpg',
    ],
    specifications: {
      'Brand': 'JMI',
      'Type': 'Scalp Vein Set (Butterfly Needle)',
      'Needle Size': '21G',
      'Sterility': 'Sterile, disposable',
      'Pack Size': '1 Box (50 Pcs)',
      'Use': 'Intravenous infusion and clinical use',
    },
    certifications: [],
    warranty: null,
    badge: null,
    isFeatured: false,
    tags: ['JMI', 'Scalp Vein Set', 'Butterfly Needle', 'IV', 'Disposable'],
    sku: 'HC1435',
    manufacturer: 'JMI',
  },
  {
    name: 'JMI Scalp Vein Set 23G (Single)',
    description:
      'JMI Scalp Vein Set 23G is a sterile disposable butterfly needle set for intravenous infusion and clinical use. Sterile, single-use design ensuring safe and hygienic procedures for trained healthcare professionals.',
    category: 'IV & Infusion Therapy',
    price: 10,
    oldPrice: null,
    stock: 20,
    lowStockThreshold: 10,
    unit: 'piece',
    minOrderQty: 1,
    images: [
      'https://mouripharma.blr1.digitaloceanspaces.com/HealthAndSurgical/2026/06/jmi-scalp-vein-set-23g-EeGytv.webp',
    ],
    specifications: {
      'Brand': 'JMI',
      'Type': 'Scalp Vein Set (Butterfly Needle)',
      'Needle Size': '23G',
      'Sterility': 'Sterile, disposable',
      'Pack Size': '1 x 1 Pack',
      'Use': 'Intravenous infusion and clinical use',
    },
    certifications: [],
    warranty: null,
    badge: null,
    isFeatured: false,
    tags: ['JMI', 'Scalp Vein Set', 'Butterfly Needle', 'IV', 'Disposable'],
    sku: 'HC521',
    manufacturer: 'JMI',
  },
  {
    name: 'JMI Butterfly Needle for Blood Collection 23G',
    description:
      'JMI Butterfly Needle for blood collection, 23G sterile disposable needle set. Designed for safe and reliable blood collection and intravenous procedures in healthcare and clinical settings.',
    category: 'IV & Infusion Therapy',
    price: 13,
    oldPrice: null,
    stock: 20,
    lowStockThreshold: 10,
    unit: 'piece',
    minOrderQty: 1,
    images: [
      'https://mouripharma.blr1.digitaloceanspaces.com/HealthAndSurgical/2026/06/jmi-butterfly-needle-for-blood-collection-23g-DcMF61.webp',
    ],
    specifications: {
      'Brand': 'JMI',
      'Type': 'Butterfly Needle for Blood Collection',
      'Needle Size': '23G',
      'Sterility': 'Sterile, disposable',
      'Pack Size': '1 x 1 Pack',
      'Use': 'Blood collection and IV procedures',
    },
    certifications: [],
    warranty: null,
    badge: null,
    isFeatured: false,
    tags: ['JMI', 'Butterfly Needle', 'Blood Collection', 'IV', 'Disposable'],
    sku: 'HC522',
    manufacturer: 'JMI',
  },
  {
    name: 'JMI Scalp Vein Set 25G (Single)',
    description:
      'JMI Scalp Vein Set 25G is a sterile disposable butterfly needle set for intravenous infusion and clinical use. Sterile, single-use design ensuring safe and hygienic procedures for trained healthcare professionals.',
    category: 'IV & Infusion Therapy',
    price: 10,
    oldPrice: null,
    stock: 20,
    lowStockThreshold: 10,
    unit: 'piece',
    minOrderQty: 1,
    images: [
      'https://mouripharma.blr1.digitaloceanspaces.com/HealthAndSurgical/2026/06/jmi-scalp-vein-set-25g-9vwFCq.webp',
    ],
    specifications: {
      'Brand': 'JMI',
      'Type': 'Scalp Vein Set (Butterfly Needle)',
      'Needle Size': '25G',
      'Sterility': 'Sterile, disposable',
      'Pack Size': '1 x 1 Pack',
      'Use': 'Intravenous infusion and clinical use',
    },
    certifications: [],
    warranty: null,
    badge: null,
    isFeatured: false,
    tags: ['JMI', 'Scalp Vein Set', 'Butterfly Needle', 'IV', 'Disposable'],
    sku: 'HC530',
    manufacturer: 'JMI',
  },
  {
    name: 'JMI Scalp Vein Set 27G (Single)',
    description:
      'JMI Scalp Vein Set 27G is a sterile disposable butterfly needle set for intravenous infusion and clinical use. Sterile, single-use design ensuring safe and hygienic procedures for trained healthcare professionals.',
    category: 'IV & Infusion Therapy',
    price: 10,
    oldPrice: null,
    stock: 20,
    lowStockThreshold: 10,
    unit: 'piece',
    minOrderQty: 1,
    images: [
      'https://mouripharma.blr1.digitaloceanspaces.com/HealthAndSurgical/2026/06/jmi-scalp-vein-set-27g-2Juyhv.webp',
    ],
    specifications: {
      'Brand': 'JMI',
      'Type': 'Scalp Vein Set (Butterfly Needle)',
      'Needle Size': '27G',
      'Sterility': 'Sterile, disposable',
      'Pack Size': '1 x 1 Pack',
      'Use': 'Intravenous infusion and clinical use',
    },
    certifications: [],
    warranty: null,
    badge: null,
    isFeatured: false,
    tags: ['JMI', 'Scalp Vein Set', 'Butterfly Needle', 'IV', 'Disposable'],
    sku: 'HC531',
    manufacturer: 'JMI',
  },
  {
    name: 'JMI Scalp Vein Set 19G (Single)',
    description:
      'JMI Scalp Vein Set 19G is a sterile disposable butterfly needle set for intravenous infusion and clinical use. Sterile, single-use design ensuring safe and hygienic procedures for trained healthcare professionals.',
    category: 'IV & Infusion Therapy',
    price: 10,
    oldPrice: null,
    stock: 20,
    lowStockThreshold: 10,
    unit: 'piece',
    minOrderQty: 1,
    images: [
      'https://mouripharma.blr1.digitaloceanspaces.com/HealthAndSurgical/2026/06/jmi-scalp-vein-set-19g-bfyPkS.webp',
    ],
    specifications: {
      'Brand': 'JMI',
      'Type': 'Scalp Vein Set (Butterfly Needle)',
      'Needle Size': '19G',
      'Sterility': 'Sterile, disposable',
      'Pack Size': '1 x 1 Pack',
      'Use': 'Intravenous infusion and clinical use',
    },
    certifications: [],
    warranty: null,
    badge: null,
    isFeatured: false,
    tags: ['JMI', 'Scalp Vein Set', 'Butterfly Needle', 'IV', 'Disposable'],
    sku: 'HC547',
    manufacturer: 'JMI',
  },
  {
    name: 'JMI Scalp Vein Set 21G (Single)',
    description:
      'JMI Scalp Vein Set 21G is a sterile disposable butterfly needle set for intravenous infusion and clinical use. Sterile, single-use design ensuring safe and hygienic procedures for trained healthcare professionals.',
    category: 'IV & Infusion Therapy',
    price: 10,
    oldPrice: null,
    stock: 20,
    lowStockThreshold: 10,
    unit: 'piece',
    minOrderQty: 1,
    images: [
      'https://mouripharma.blr1.digitaloceanspaces.com/HealthAndSurgical/2026/06/jmi-scalp-vein-set-21g-khwhis.webp',
    ],
    specifications: {
      'Brand': 'JMI',
      'Type': 'Scalp Vein Set (Butterfly Needle)',
      'Needle Size': '21G',
      'Sterility': 'Sterile, disposable',
      'Pack Size': '1 x 1 Pack',
      'Use': 'Intravenous infusion and clinical use',
    },
    certifications: [],
    warranty: null,
    badge: null,
    isFeatured: false,
    tags: ['JMI', 'Scalp Vein Set', 'Butterfly Needle', 'IV', 'Disposable'],
    sku: 'HC549',
    manufacturer: 'JMI',
  },
  {
    name: 'JMI Blood Lancet 100s',
    description:
      'JMI Blood Lancet (100 pieces) is a healthcare accessory designed for blood glucose testing. Made with durable materials and designed for ease of use in daily healthcare routines at home or on the go.',
    category: 'Diabetes Care',
    price: 80,
    oldPrice: null,
    stock: 20,
    lowStockThreshold: 10,
    unit: 'box',
    minOrderQty: 1,
    images: [],
    specifications: {
      'Brand': 'JMI',
      'Type': 'Blood Lancet',
      'Pack Size': '1 x 100s Lancet',
      'Use': 'Blood glucose testing',
      'Safety': 'Keep away from children',
    },
    certifications: [],
    warranty: null,
    badge: null,
    isFeatured: false,
    tags: ['JMI', 'Lancet', 'Blood Glucose', 'Diabetes Care', 'Disposable'],
    sku: 'HC162',
    manufacturer: 'JMI',
  },
];

async function uploadImage(imageUrl, productName, index) {
  try {
    console.log('   Uploading image ' + (index + 1) + ': ' + imageUrl);
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: 'Mediport/products/gowell',
      resource_type: 'auto',
      timeout: 60000,
      transformation: [
        { width: 1000, height: 1000, crop: 'limit', quality: 'auto:good' },
      ],
    });
    return {
      url: result.secure_url,
      publicId: result.public_id,
      isPrimary: index === 0,
      alt: productName + ' - GoWell - MediportBD',
    };
  } catch (error) {
    console.error('   x Failed to upload image: ' + error.message);
    return null;
  }
}

async function getManufacturer(raw) {
  const brandName = (raw && raw.manufacturer) || 'Generic';
  let manufacturer = await Manufacturer.findOne({ name: brandName });
  if (!manufacturer) {
    manufacturer = await Manufacturer.create({
      name: brandName,
      slug: slugify(brandName, { lower: true, strict: true }),
      description: brandName + ' products.',
      isActive: true,
    });
    console.log('✓ Created ' + brandName + ' manufacturer');
  } else {
    console.log('✓ Found ' + manufacturer.name + ' manufacturer');
  }
  return manufacturer;
}

async function findCategory(mappedName) {
  const category = await Category.findOne({ name: mappedName, isActive: true });
  if (!category) {
    throw new Error('Category "' + mappedName + '" not found in DB');
  }
  return category;
}

async function generateUniqueSlug(name) {
  let slug = slugify(name, { lower: true, strict: true });
  let counter = 1;
  while (await Product.findOne({ slug })) {
    slug = slugify(name, { lower: true, strict: true }) + '-' + counter;
    counter++;
  }
  return slug;
}

async function importProduct(raw) {
  try {
    console.log('\n→ Processing: ' + raw.name);

    const existing = await Product.findOne({
      name: new RegExp('^' + raw.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i'),
    });
    if (existing) {
      console.log('   ⊘ Skipped: already exists (ID: ' + existing._id + ')');
      return { success: false, reason: 'duplicate' };
    }

    const category = await findCategory(raw.category);
    console.log('   ✓ Category: ' + raw.category);

    const sku = (raw.sku || '').trim();
    const slug = await generateUniqueSlug(raw.name);

    const uploadedImages = [];
    if (raw.images && raw.images.length) {
      console.log('   ↑ Uploading ' + raw.images.length + ' image(s)...');
      for (let i = 0; i < raw.images.length && i < 5; i++) {
        const up = await uploadImage(raw.images[i], raw.name, i);
        if (up) {
          uploadedImages.push(up);
        }
      }
      console.log('   ✓ Uploaded ' + uploadedImages.length + ' image(s)');
    }

    const specifications = new Map(Object.entries(raw.specifications || {}));

    const product = await Product.create({
      name: raw.name,
      slug,
      sku,
      description: raw.description,
      brand: manufacturer._id,
      category: category._id,
      price: raw.price,
      oldPrice: raw.oldPrice || null,
      stock: raw.stock,
      lowStockThreshold: raw.lowStockThreshold || 10,
      unit: raw.unit || 'piece',
      minOrderQty: raw.minOrderQty || 1,
      images: uploadedImages,
      specifications,
      certifications: raw.certifications || [],
      badge: raw.badge || null,
      isFeatured: raw.isFeatured || false,
      isActive: true,
      tags: raw.tags || [],
    });

    console.log('   ✓ Created product (ID: ' + product._id + ')');
    console.log('   ✓ Price: ৳' + product.price.toLocaleString());
    console.log('   ✓ Stock: ' + product.stock + ' units');
    return { success: true, product };
  } catch (error) {
    console.error('   ✗ Error: ' + error.message);
    return { success: false, reason: error.message };
  }
}

let manufacturer;

async function main() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  GOWELL PRODUCT IMPORT');
  console.log('═══════════════════════════════════════════════════════════\n');

  const stats = { total: GOWELL_PRODUCTS.length, success: 0, failed: 0, skipped: 0, errors: [] };

  try {
    console.log('→ Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    manufacturer = await getManufacturer(GOWELL_PRODUCTS[0]);
    console.log('   ID: ' + manufacturer._id + '\n');

    console.log('→ Importing ' + stats.total + ' product(s)...\n');
    console.log('─'.repeat(60));

    for (const raw of GOWELL_PRODUCTS) {
      manufacturer = await getManufacturer(raw);
      const result = await importProduct(raw);
      if (result.success) {
        stats.success++;
      } else if (result.reason === 'duplicate') {
        stats.skipped++;
      } else {
        stats.failed++;
        stats.errors.push({ product: raw.name, error: result.reason });
      }
      await new Promise((r) => setTimeout(r, 800));
    }

    console.log('\n' + '─'.repeat(60));
    console.log('\n📊 Import Summary:');
    console.log('─'.repeat(60));
    console.log('   Total products:      ' + stats.total);
    console.log('   ✓ Successfully added: ' + stats.success);
    console.log('   ⊘ Skipped (existing): ' + stats.skipped);
    console.log('   ✗ Failed:             ' + stats.failed);

    if (stats.errors.length) {
      console.log('\n❌ Errors:\n');
      stats.errors.forEach((e, i) => {
        console.log('   ' + (i + 1) + '. ' + e.product);
        console.log('      ' + e.error + '\n');
      });
    }
    console.log('\n═══════════════════════════════════════════════════════════\n');
  } catch (error) {
    console.error('\n❌ Fatal Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('✓ Database connection closed\n');
  }
}

main().catch((e) => {
  console.error('Unhandled error:', e);
  process.exit(1);
});