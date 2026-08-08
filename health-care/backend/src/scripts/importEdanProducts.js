#!/usr/bin/env node

/**
 * EDAN Product Import Script
 * 
 * Imports EDAN brand products to MediportBD
 * Data scraped from https://bmabazar.com/brand/edan/
 * Images are uploaded to Cloudinary
 * 
 * Usage:
 *   node src/scripts/importEdanProducts.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Manufacturer = require('../models/Manufacturer');
const cloudinary = require('cloudinary').v2;
const slugify = require('slugify');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const PRICE_ON_REQUEST = 0;

/**
 * EDAN Products Data
 * Prices verified from bmabazar.com listing pages (August 2026)
 * Products without a listed price are marked as price-on-request (price 0)
 */
const EDAN_PRODUCTS = [
  {
    name: 'EDAN H30 Fully Automatic 3-Part Hematology Analyzer',
    category: 'Laboratory Equipment',
    price: PRICE_ON_REQUEST,
    stock: 5,
    isPriceOnRequest: true,
    images: [
      'https://bmabazar.com/wp-content/uploads/2019/09/cvvvvvvvvvvvvvvvvvvvvvvvvzzzzzzzzz222-1.jpg',
      'https://bmabazar.com/wp-content/uploads/2019/09/edan-500-1.jpg',
      'https://bmabazar.com/wp-content/uploads/2019/09/H02095811501EE5DB.jpg',
      'https://bmabazar.com/wp-content/uploads/2019/09/maxresdefault.jpg',
      'https://bmabazar.com/wp-content/uploads/2019/09/W01112455B5591FA9-scaled.jpg',
    ],
    description: 'The EDAN H30 is a fully automatic 3-part differential hematology analyzer driven by state-of-the-art technology with a mature technical platform. This 3-part differential automated hematology analyzer carries greater stability and decreased maintenance cost, making it a cost-effective solution for blood testing. CBC+3-DIFF with 20 parameters plus 3 histograms. Throughput of 60 samples per hour with 9.6μL whole blood sampling. Intuitive operation system with 10.4 inch TFT touch screen. 35,000 results storage with histograms. 3 routine reagents: Diluent, Lyse, and Cleaner with low reagent consumption. Electrical impedance method for cell counting and cyanide-free lyse for hemoglobin measurement. Price on request - please contact us for a quotation.',
    specifications: {
      'Type': '3-Part Differential Hematology Analyzer',
      'Parameters': '20 parameters: WBC, LYM%, MID%, GRA%, LYM#, MID#, GRA#, RBC, HGB, HCT, MCV, MCH, MCHC, RDW, RDW-SD, PLT, MPV, PDW, PCT, P-LCR',
      'Histograms': 'WBC (3-Diff), RBC and PLT',
      'Throughput': '60 samples per hour',
      'Sample Volume': '9.6μL (whole blood), 20μL (predilution)',
      'Counting Principle': 'Electrical impedance method',
      'Display': '10.4 inch TFT color touch screen',
      'Storage': '35,000 results with histograms',
      'Interfaces': '5 x USB Port, LAN',
      'Operating Temperature': '18°C ~ 32°C',
      'Humidity': '≤ 80%',
      'Certification': 'CE, ISO, FDA',
    },
    certifications: ['CE', 'ISO', 'FDA'],
    unit: 'piece',
    minOrderQty: 1,
    warranty: '1 year manufacturer warranty',
    isFeatured: false,
    badge: null,
  },
  {
    name: 'EDAN Acclarix LX4 Color Doppler Ultrasound',
    category: 'Hospital Machines',
    price: PRICE_ON_REQUEST,
    stock: 3,
    isPriceOnRequest: true,
    images: [
      'https://bmabazar.com/wp-content/uploads/2020/11/kkkkkkkkkkkk.jpg',
      'https://bmabazar.com/wp-content/uploads/2020/11/acclarix-lx4-diagnostic-ultrasound-system-500x500-1.jpg',
    ],
    description: 'The EDAN Acclarix LX4 diagnostic ultrasound system blends image transparency with smart operating workflows, such as a customizable touch screen for gesture control and one-touch auto-optimization for all modes. Features TAI (Tissue Adaptive Imaging) proprietary imaging technology from EDAN, eSRI speckle imaging reduction, 3D/4D capability for automating volume editing with the eFace feature, panoramic photography optimization, TDI tissue Doppler imaging, automated measuring instruments including Auto IMT and Auto OBT, comprehensive DICOM feature set, and equipment for needle visualization. It features a 21-inch tilt-and-swivel HD wide-screen anti-glare LCD display, four active transducer ports, and a down-lit pull-out keyboard. Price on request - please contact us for a quotation.',
    specifications: {
      'Display': '21-inch tilt-and-swivel HD anti-glare LCD',
      'Transducer Ports': '4 active',
      'Imaging Technology': 'TAI, eSRI, 3D/4D, TDI, Auto IMT, Auto OBT',
      'Keyboard': 'Down-lit pull-out',
      'DICOM': 'Comprehensive DICOM feature set',
    },
    certifications: ['CE', 'ISO 13485'],
    unit: 'piece',
    minOrderQty: 1,
    warranty: '1 year manufacturer warranty',
    isFeatured: false,
    badge: null,
  },
  {
    name: 'EDAN Colour Doppler Ultrasound LX8',
    category: 'Hospital Machines',
    price: PRICE_ON_REQUEST,
    stock: 3,
    isPriceOnRequest: true,
    images: [
      'https://bmabazar.com/wp-content/uploads/2020/11/pppppppp-2.jpg',
    ],
    description: 'The EDAN Acclarix LX8 ultrasound system is specifically designed to address the challenges of busy ultrasound environments and features a host of design breakthroughs that make day-to-day operations quick, easy, and intuitive. The transmitting and receiving 128-channel hardware architecture provides outstanding processing power, resulting in excellent image quality. Features include TAI (Tissue Adaptive Imaging) proprietary image technology from EDAN, eSRI speckle elimination imaging, 3D/4D capability with eFace feature, panoramic imagery optimization, TDI tissue Doppler imaging, automated measurement instruments such as Auto IMT and Auto OBT, comprehensive DICOM functions, and needle visualization technology. The wide-screen 21-inch high-definition LCD monitor is anti-glare and tilts and swivels, with a 10-inch gesture-controlled customizable touch screen. Motorized control panel height adjustment allows movement of up to 20 cm for comfortable sitting or standing use. Four illuminated transducer ports support 4 active transducers. Price on request - please contact us for a quotation.',
    specifications: {
      'Display': '21-inch anti-glare HD LCD (tilt and swivel)',
      'Touch Screen': '10-inch gesture-controlled customizable',
      'Architecture': '128-channel transmit and receive',
      'Transducer Ports': '4 illuminated active ports',
      'Panel Adjustment': 'Motorized height, up to 20 cm',
      'Keyboard': 'Down-lit retractable',
      'Imaging Technology': 'TAI, eSRI, 3D/4D, TDI, Auto IMT, Auto OBT',
    },
    certifications: ['CE', 'ISO 13485'],
    unit: 'piece',
    minOrderQty: 1,
    warranty: '1 year manufacturer warranty',
    isFeatured: false,
    badge: null,
  },
  {
    name: 'EDAN U2 Prime Edition Color Doppler Ultrasound',
    category: 'Hospital Machines',
    price: PRICE_ON_REQUEST,
    stock: 3,
    isPriceOnRequest: true,
    images: [
      'https://bmabazar.com/wp-content/uploads/2020/11/u2.jpg',
    ],
    description: 'The EDAN U2 Prime Edition is a general imaging color Doppler ultrasound system with advanced imaging technologies. Speckle reduction technology enhances contrast resolution while retaining detailed resolution, harmonic imaging with phase-inversion reduces noise and clutter for optimal image output, and spatial compounding uses several lines-of-sight to improve contrast resolution. Multi-beam equipment provides high frame rate in all modes including color and Doppler. Features an intuitive control panel that reduces the learning curve, Smart PreSet for quickly adjusting multiple settings to suit patient type and imaging preferences, and multi-frequency transducer technology with multiple 2-D, harmonic, and color frequencies. Supported applications include Abdomen, Obstetrics, Gynecology, Endovaginal, Small Parts, Musculoskeletal, Vascular, Urology, Cardiology, and Pediatrics. Price on request - please contact us for a quotation.',
    specifications: {
      'Monitor': '15-inch high-resolution LCD',
      'Type': 'Color Doppler Ultrasound',
      'Imaging': 'Speckle reduction, harmonic imaging, spatial compounding',
      'Transducers': 'Multi-frequency (2-D, harmonic, color)',
      'Supported Applications': 'Abdomen, Obstetrics, Gynecology, Endovaginal, Small Parts, Musculoskeletal, Vascular, Urology, Cardiology, Pediatrics',
      'Battery': 'Built-in lithium battery',
    },
    certifications: ['CE', 'ISO 13485'],
    unit: 'piece',
    minOrderQty: 1,
    warranty: '1 year manufacturer warranty',
    isFeatured: false,
    badge: null,
  },
  {
    name: 'EDAN IM8 Patient Monitor',
    category: 'Hospital Machines',
    price: 130000,
    stock: 10,
    isPriceOnRequest: false,
    images: [
      'https://bmabazar.com/wp-content/uploads/2020/11/pppppppppppppp-2.jpg',
    ],
    description: 'The EDAN iM8 patient monitor Wi-Fi networking helps healthcare providers from almost anywhere to track the health status of their patients. You can log on from any PC/Tablet and check your patients\' status by connecting it with EDAN MFM-CMS software. Features a 12-inch TFT-LCD high-resolution colour screen, pacemaker detection, protection from defibrillation and electrosurgical intervention, pitch tone modulation of pulse-tone, specific iSEAP algorithm specially optimized for patients with arrhythmia, anti-interference pulse oximetry dual-mode, SP10 NIBP validated, built-in Li-Ion rechargeable battery, nurse call, and optional VGA performance. Appropriate for adult, pediatric or neonatal patients. Standard parameters: 3/5 lead ECG, RESP, EDAN SpO2, NIBP, PR, 2-Temp. Optional: 2-IBP, Respironics CO2, EDAN G2 CO2, Thermal Recorder, WLAN Accessory Kit.',
    specifications: {
      'Display': '12-inch TFT-LCD high-resolution colour screen',
      'Standard Parameters': '3/5 lead ECG, RESP, EDAN SpO2, NIBP, PR, 2-Temp',
      'Optional Parameters': '2-IBP, Respironics CO2, EDAN G2 CO2, Thermal Recorder, WLAN Accessory Kit',
      'Pacemaker Detection': 'Yes',
      'Battery': 'Built-in Li-Ion rechargeable (14.8V, 4200mAh)',
      'Connectivity': 'Wi-Fi networking, MFM-CMS software support',
      'Applicable Patients': 'Adult, pediatric, neonatal',
    },
    certifications: ['CE', 'ISO 13485'],
    unit: 'piece',
    minOrderQty: 1,
    warranty: '1 year manufacturer warranty',
    isFeatured: false,
    badge: null,
  },
  {
    name: 'EDAN Medical Fetal Monitor F3',
    category: 'Hospital Machines',
    price: 220000,
    stock: 8,
    isPriceOnRequest: false,
    images: [
      'https://bmabazar.com/wp-content/uploads/2020/11/ppppppppp.jpg',
      'https://bmabazar.com/wp-content/uploads/2020/11/HTB1svwZd8WD3KVjSZKPq6yp7FXaH.jpg',
    ],
    description: 'The EDAN F3 is the newest EDAN fetal antepartum monitor model. It not only retains EDAN\'s advanced CTG technologies but also provides fair consumer rates. CTG waveforms will be processed automatically, helping doctors with both ongoing monitoring and outpatient assessments. Portable and compact design (3.5 kg) with foldable colour screen. Built-up memory of 60 hours for seamless monitoring and a long-life thermal printer built-in compatible with thermal 150/152 mm recording paper. Wide display of numbers and graphics for easy readability, FHR signal quality indicator, overlap signals verification to separate FHRR twins, and quick printing of stored traces. The F3 mobility ensures long life of the Li-Ion battery. Supports PC management applications and central control scheme. Optional parameters of DECG & IUP. In the event of an unexpected power outage, you do not have to worry about data loss.',
    specifications: {
      'Type': 'Fetal Antepartum Monitor',
      'Weight': '3.5 kg (portable)',
      'Display': 'Foldable colour screen',
      'Memory': '60 hours built-in',
      'Printer': 'Long-life thermal printer (150/152 mm paper)',
      'Optional Parameters': 'DECG & IUP',
      'Battery': 'Li-Ion',
      'Standard Accessories': 'FHR Probe, TOCO Probe, Event Marker, Belts, User Manual, Insight Software (CD)',
    },
    certifications: ['CE', 'ISO 13485'],
    unit: 'piece',
    minOrderQty: 1,
    warranty: '1 year manufacturer warranty',
    isFeatured: false,
    badge: null,
  },
  {
    name: 'EDAN SE-1200 Express 12-Channel ECG Machine',
    category: 'Hospital Machines',
    price: 120000,
    stock: 10,
    isPriceOnRequest: false,
    images: [
      'https://bmabazar.com/wp-content/uploads/2019/12/cats-7.jpg',
      'https://bmabazar.com/wp-content/uploads/2019/12/edan-se-1200-express-ecg-500x500-1.jpg',
    ],
    description: 'The EDAN SE-1200 Express 12-channel ECG machine features a large color touch screen, alphanumeric keyboard, and one-touch operation. Enhanced weak signal detection with comprehensive filters and noise control technology. Freezing and reviewing ECG waveforms in real-time with the advanced Glasgow algorithm for automated calculation and analysis. Built-in high-resolution thermal printer with optional external USB printer support. Large internal storage that can be extended via USB flash disk. Built-in monitoring data management with LAN/Wi-Fi connectivity (optional) and bi-directional contact with the SE-1515 Data Management System. 12-channel digital ECG with automatic lead selection.',
    specifications: {
      'Type': 'Digital 12-Channel ECG',
      'Display': '10.1 inch LCD screen',
      'Leads': '12 channels, automatic lead selection',
      'Paper Width': '216, 210 mm (roll and Z-fold)',
      'Printer': 'Built-in high-resolution thermal',
      'Power Supply': '100-240 V, 50/60 Hz',
      'Battery': '14.8 V rechargeable built-in Li-ion',
      'Dimensions': '420 x 330 x 120 mm',
      'Connectivity': 'LAN / Wi-Fi (optional), USB',
      'Analysis': 'Advanced Glasgow algorithm',
    },
    certifications: ['CE', 'ISO 13485'],
    unit: 'piece',
    minOrderQty: 1,
    warranty: '1 year manufacturer warranty',
    isFeatured: false,
    badge: null,
  },
  {
    name: 'EDAN SE-3 Three-Channel ECG Machine',
    category: 'Hospital Machines',
    price: 48000,
    oldPrice: 55000,
    stock: 15,
    isPriceOnRequest: false,
    images: [
      'https://bmabazar.com/wp-content/uploads/2020/11/pppppppp.jpg',
    ],
    description: 'The EDAN SE-3 Three-Channel ECG is a high-quality and inexpensive unit. For any work scenario, its compact and lightweight nature makes it portable. It has a waveform display with a foldable LCD screen and configurable parameters. 12 lead printing is possible with an external ink-jet printer. Auto/manual work mode with three printing formats (auto, manual, and rhythm). The high-resolution printer prints on 80 mm x 20 m paper and has a wide data store of 120 ECGs for patients. Built-in defibrillator protection, 12 leads simultaneous acquisition, and automatic baseline adjustment. AC 100-115 V / 220-240 V, 50/60 Hz power with built-in rechargeable Li-ion battery.',
    specifications: {
      'Type': '3-Channel ECG',
      'Leads': '12 leads simultaneous',
      'Input Protection': 'Defibrillator protection built-in',
      'Display': 'Foldable LCD',
      'Printer': 'Thermal, 80 mm x 20 m paper',
      'Paper Speeds': '5, 6.25, 10, 12.5, 25, 50 mm/s',
      'Storage': '120 ECGs',
      'Battery': 'Built-in rechargeable Li-ion 14.8 V',
      'Dimensions': '288 x 210 x 70 mm',
      'Weight': '2.5 kg (5.5 lbs)',
    },
    certifications: ['CE', 'ISO 13485'],
    unit: 'piece',
    minOrderQty: 1,
    warranty: '1 year manufacturer warranty',
    isFeatured: false,
    badge: 'sale',
  },
  {
    name: 'EDAN SE-601C 6-Channel ECG Machine',
    category: 'Hospital Machines',
    price: 95000,
    stock: 10,
    isPriceOnRequest: false,
    images: [
      'https://bmabazar.com/wp-content/uploads/2020/11/ppppppppppppppp-2.jpg',
    ],
    description: 'The EDAN SE-601C ECG machine is a compact, lightweight platform convenient for mobile use and limited-space offices. It has a wide 5.7-inch TFT LCD color backlight display and simple data input and operation that makes it easy for all to use. Alphanumeric keyboard with one-touch operation. The EDAN SE-601C cardiograph has pacemaker detection that meets ANSI/AAMI EC11 specifications, automatic adult and pediatric measurement and interpretation, heart rate variability (HRV) and R-to-R trending analysis, two-step exercise test with periodic recording, internal and external thermal printer support, and data transmission to PC via Ethernet or serial port. Internal storage supports 100 ECGs.',
    specifications: {
      'Type': '6-Channel ECG',
      'Display': '5.7 inch TFT LCD color backlight',
      'Pacemaker Detection': 'ANSI/AAMI EC11 compliant',
      'Analysis': 'Automatic adult and pediatric interpretation',
      'HRV': 'Heart rate variability and R-to-R trending analysis',
      'Exercise Test': 'Two-step with periodic recording',
      'Printer': 'Internal thermal + external support',
      'Storage': '100 ECGs internal',
      'Connectivity': 'Ethernet, serial port, USB flash disk, card reader',
      'Battery': 'Built-in rechargeable, AC/DC power supply',
    },
    certifications: ['CE', 'ISO 13485'],
    unit: 'piece',
    minOrderQty: 1,
    warranty: '1 year manufacturer warranty',
    isFeatured: false,
    badge: null,
  },
  {
    name: 'EDAN F9 Fetal & Maternal Monitor',
    category: 'Hospital Machines',
    price: 320000,
    stock: 8,
    isPriceOnRequest: false,
    images: [
      'https://bmabazar.com/wp-content/uploads/2020/11/kkkkkkkkkkkk-1.jpg',
      'https://bmabazar.com/wp-content/uploads/2020/11/edan-12-1-color-touch-screen-fetal-maternal-monitor-f9-express-22.jpg',
    ],
    description: 'The EDAN F9 is a high-end fetal and maternal monitor delivering the most sophisticated integrated delivery room monitoring for the large hospital, private obstetrician\'s office, and clinic antepartum use. The entire spectrum of antepartum, intrapartum, and postpartum applications is covered by F9, optimized for moving situations. Features a 12.1-inch color TFT-LCD touch screen, basic parameters of FHR, TOCO, label of events, and AFM, internal IUP and DECG as optional parameters, 24-hour playback waveforms, optional wireless module built-in, tools for transmitting data to a PC, 150/152 mm wide paper support with 1, 2, 3 cm/min printing speeds, lithium battery with 4 hours of continuous service, waterproof Doppler crystal pulse wave transducer for FHR detection, signal overlap verification, and maternal parameters for MECG, NIBP, MSpO2.',
    specifications: {
      'Type': 'Fetal & Maternal Monitor',
      'Display': '12.1-inch color TFT-LCD touch screen',
      'Basic Parameters': 'FHR, TOCO, Event labels, AFM',
      'Optional Parameters': 'Internal IUP, DECG',
      'Maternal Parameters': 'MECG, NIBP, MSpO2',
      'Playback': '24-hour waveform playback',
      'Paper Width': '150/152 mm',
      'Battery': 'Lithium, 4 hours continuous service',
      'Dimensions': '347 x 330 x 126 mm',
      'Weight': 'Approx. 6 kg',
      'Wireless': 'Optional wireless module',
    },
    certifications: ['CE', 'ISO 13485'],
    unit: 'piece',
    minOrderQty: 1,
    warranty: '1 year manufacturer warranty',
    isFeatured: false,
    badge: null,
  },
  {
    name: 'EDAN DUS-60 Portable Ultrasound System',
    category: 'Hospital Machines',
    price: PRICE_ON_REQUEST,
    stock: 3,
    isPriceOnRequest: true,
    images: [
      'https://bmabazar.com/wp-content/uploads/2020/11/dus60.jpg',
      'https://bmabazar.com/wp-content/uploads/2020/11/EDAN_DUS_60_front.jpg',
    ],
    description: 'The EDAN DUS-60 is an exciting new compact ultrasound device that, across a wide range of applications, offers superb value and best-in-class accuracy. The DUS-60 meets higher diagnostic criteria with pulsed wave Doppler imaging as standard. It has a high contrast 12.1-inch TFT-LCD screen and provides seven kinds of pseudo colors. Innovative technology includes phase-inversion harmonic imaging of compounds, speckle reduction technology, multi-beam synthetic aperture focusing, dynamic scanning frequencies, and multi-frequency transducers. User-friendly workflow with an intuitive control panel that decreases the learning curve. Supported applications: Abdomen, Obstetrics, Gynecology, Endovaginal, Small Parts, Musculoskeletal, Vascular, Urology, Cardiology, Pediatrics. Two hours of battery-driven service with optional battery. Price on request - please contact us for a quotation.',
    specifications: {
      'Type': 'Portable B&W Doppler Ultrasound',
      'Display': '12.1-inch TFT-LCD, high contrast',
      'Transducer Connectors': '2',
      'Transducer Frequency': '2.0-10.0 MHz',
      'Doppler': 'Pulsed wave Doppler',
      'Body Marks': 'More than 13 types',
      'Battery': 'Built-in, up to 2 hours (optional battery)',
      'DICOM': '3.0 compatible',
      'Pseudo Colors': '7 kinds',
    },
    certifications: ['CE', 'ISO 13485'],
    unit: 'piece',
    minOrderQty: 1,
    warranty: '1 year manufacturer warranty',
    isFeatured: false,
    badge: null,
  },
  {
    name: 'EDAN U2 Prime Edition Portable Color Doppler Ultrasound System',
    category: 'Hospital Machines',
    price: PRICE_ON_REQUEST,
    stock: 3,
    isPriceOnRequest: true,
    images: [
      'https://bmabazar.com/wp-content/uploads/2020/11/ppppppppppppppp-1.jpg',
    ],
    description: 'The EDAN U2 is a realistic, portable color Doppler ultrasound device designed to meet clinicians and point-of-care specialists\' imaging needs. U2 provides excellent image quality and uncompromised diagnostic capabilities with advanced signal processing. Features speckle reduction technology, harmonic imaging with phase-inversion, spatial compounding, multi-beam equipment with high frame rate in all modes including color and Doppler, intuitive control panel, Smart PreSet, and multi-frequency transducer technology. Supported applications include Abdomen, Obstetrics, Gynecology, Endovaginal, Small Parts, Musculoskeletal, Vascular, Urology, Cardiology, and Pediatrics. Compact mobile cart design with exceptionally quick boot time and built-in lithium battery. Package includes 1 convex probe C352UB (2.5-4.5 MHz), 1 linear probe L742UB (6.5-8.5 MHz), 1 transvaginal probe E612UB (5.5-7.5 MHz), gel bottle, and mains plug cable. Price on request - please contact us for a quotation.',
    specifications: {
      'Type': 'Portable Color Doppler Ultrasound',
      'Monitor': '15-inch high-resolution LCD',
      'Boot Time': 'Exceptionally quick',
      'Battery': 'Built-in lithium battery',
      'Included Probes': 'C352UB convex (2.5-4.5 MHz), L742UB linear (6.5-8.5 MHz), E612UB transvaginal (5.5-7.5 MHz)',
      'Applications': 'Abdomen, Obstetrics, Gynecology, Endovaginal, Small Parts, Musculoskeletal, Vascular, Urology, Cardiology, Pediatrics',
      'Package Includes': '3 probes, gel bottle, mains plug cable',
    },
    certifications: ['CE', 'ISO 13485'],
    unit: 'piece',
    minOrderQty: 1,
    warranty: '1 year manufacturer warranty',
    isFeatured: false,
    badge: null,
  },
  {
    name: 'EDAN C6A Video Colposcope',
    category: 'Medical Devices',
    price: PRICE_ON_REQUEST,
    stock: 0,
    isPriceOnRequest: true,
    images: [
      'https://bmabazar.com/wp-content/uploads/2020/11/68309-11006363.jpg',
    ],
    description: 'The EDAN C6A Video Colposcope provides a full-screen view of detailed cervical inspection, providing critical and reliable details to help in the clinical decision making of the gynecologist. The LED cold lighting method with 40 LED lamps (two rings of lights, illumination > 1600 lx) reproduces the original tissue view. Advanced and quick auto-focusing system ensures a clear picture, remote capture control for one-hand action, and user-friendly keyboard layout. The electronic green filter improves the viewing of vascular images without sacrificing lighting. Timer for acetic acid and iodine reaction test to detect low/high-grade CIN accurately. Real-time magnification monitor, 1X-36X magnification, and 440,000 pixels resolution. Strong gallery of colposcopy findings for comparison study, R-way Assessment Software supporting clinical advice on cervical disease diagnosis, and DICOM 3.0 support. Price on request - please contact us for a quotation.',
    specifications: {
      'Type': 'Video Colposcope',
      'Model': 'C6A',
      'LED Lamps': '40 (two rings of lights), illumination > 1600 lx',
      'LED Lifetime': '20,000 - 50,000 hours',
      'Magnification': '1X - 36X',
      'Resolution': '440,000 pixels, > 470 lines horizontal',
      'Focus Mode': 'Auto/Manual',
      'Working Distance': '170 - 300 mm',
      'Field of View': '10 - 150 mm',
      'Signal Output': 'S-VIDEO, PAL/NTSC',
      'Power Supply': '110V / 220V, 50 Hz / 60 Hz',
      'Workstation Dimensions': '792 x 510 x 1345 mm',
      'Weight': '13.6 kg',
    },
    certifications: ['CE', 'ISO 13485'],
    unit: 'piece',
    minOrderQty: 1,
    warranty: '1 year manufacturer warranty',
    isFeatured: false,
    badge: null,
  },
  {
    name: 'EDAN SD6 Wireless Ultrasonic Tabletop Doppler',
    category: 'Diagnostic Equipment',
    price: PRICE_ON_REQUEST,
    stock: 10,
    isPriceOnRequest: true,
    images: [
      'https://bmabazar.com/wp-content/uploads/2020/11/pppppppp-1.jpg',
    ],
    description: 'The EDAN SD6 is the revolutionary invention of EDAN\'s Fetal Doppler class - the ultrasonic tabletop Doppler. The use of infrared transmission technology, the remote control probe, and the brand-new architecture bring the SD Series to the top of the list. The wireless probe of the SD6 tabletop Doppler provides unparalleled precision in FHR detection, with a built-in long-lasting rechargeable battery and a large digital FHR monitor. Realizes free movement of patients and makes it ideal for midwives, private physicians, general practice, OB office and L&D outpatient service for planned antepartum use from the 10th week of pregnancy. Features the first and only US Doppler wireless transducer, innovative infrared transmission technology, convenient remote control probe, eye-catching LCD screen backlight, correct FHR calculation, 2MHz and 3MHz probes, built-in recorder, dual speakers for high-fidelity, rechargeable battery for the probe, auto shut-off for no signal, and compact lightweight design. Price on request - please contact us for a quotation.',
    specifications: {
      'Type': 'Wireless Ultrasonic Tabletop Fetal Doppler',
      'Transducer': 'Wireless, infrared transmission',
      'Probes': '2 MHz and 3 MHz',
      'Display': 'Large digital FHR monitor with backlight',
      'Recorder': 'Built-in',
      'Speakers': 'Dual speakers for high-fidelity',
      'Battery': 'Rechargeable for probe and main unit',
      'Auto Shut-off': 'Yes',
      'Usage': 'Antepartum use from 10th week of pregnancy',
    },
    certifications: ['CE', 'ISO 13485'],
    unit: 'piece',
    minOrderQty: 1,
    warranty: '1 year manufacturer warranty',
    isFeatured: false,
    badge: null,
  },
];

/**
 * Upload image to Cloudinary
 */
async function uploadImage(imageUrl, productName, index = 0) {
  try {
    console.log(`   Uploading image ${index + 1}: ${imageUrl}`);

    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: 'Mediport/products/edan',
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
      alt: `${productName} - EDAN Medical Equipment Bangladesh - MediportBD`,
    };
  } catch (error) {
    console.error(`   ✗ Failed to upload image: ${error.message}`);
    return null;
  }
}

/**
 * Find or create EDAN manufacturer
 */
async function getEDANManufacturer() {
  let manufacturer = await Manufacturer.findOne({
    $or: [
      { name: /^EDAN$/i },
      { slug: 'edan' }
    ]
  });

  if (!manufacturer) {
    manufacturer = await Manufacturer.create({
      name: 'EDAN',
      slug: 'edan',
      description: 'EDAN Instruments - Global medical device manufacturer specializing in patient monitors, ECG machines, ultrasound systems, hematology analyzers, fetal monitors, and diagnostic equipment. Known for high-quality, value-driven medical equipment used in hospitals and clinics worldwide.',
      country: 'China',
      website: 'https://www.edan.com',
      isActive: true,
    });
    console.log('✓ Created EDAN manufacturer');
  } else {
    console.log('✓ Found existing EDAN manufacturer');
  }

  return manufacturer;
}

/**
 * Find category by name
 */
async function findCategory(categoryName) {
  const category = await Category.findOne({
    name: categoryName,
    isActive: true
  });

  if (!category) {
    throw new Error(`Category "${categoryName}" not found. Please create it first or use an existing category.`);
  }

  return category;
}

/**
 * Generate unique SKU
 */
async function generateSKU(productName, manufacturer) {
  const base = productName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 10);

  const prefix = manufacturer.name.substring(0, 3).toUpperCase();
  let sku = `${prefix}-${base}`;

  let counter = 1;
  while (await Product.findOne({ sku })) {
    sku = `${prefix}-${base}-${counter}`;
    counter++;
  }

  return sku;
}

/**
 * Generate unique slug
 */
async function generateUniqueSlug(name) {
  let slug = slugify(name, { lower: true, strict: true });
  let counter = 1;

  while (await Product.findOne({ slug })) {
    slug = `${slugify(name, { lower: true, strict: true })}-${counter}`;
    counter++;
  }

  return slug;
}

/**
 * Import single product
 */
async function importProduct(productData, manufacturer) {
  try {
    console.log(`\n→ Processing: ${productData.name}`);

    // Check for duplicates
    const existing = await Product.findOne({
      name: new RegExp(`^${productData.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
    });

    if (existing) {
      console.log(`   ⊘ Skipped: Product already exists (ID: ${existing._id})`);
      return { success: false, reason: 'duplicate', product: existing };
    }

    // Find category
    const category = await findCategory(productData.category);
    console.log(`   ✓ Category: ${category.name}`);

    // Generate SKU
    const sku = await generateSKU(productData.name, manufacturer);
    console.log(`   ✓ SKU: ${sku}`);

    // Generate slug
    const slug = await generateUniqueSlug(productData.name);
    console.log(`   ✓ Slug: ${slug}`);

    // Upload images
    const uploadedImages = [];
    if (productData.images && productData.images.length > 0) {
      console.log(`   ↑ Uploading ${productData.images.length} image(s)...`);

      for (let i = 0; i < productData.images.length && i < 5; i++) {
        const uploadedImage = await uploadImage(productData.images[i], productData.name, i);
        if (uploadedImage) {
          uploadedImages.push(uploadedImage);
        }
      }

      console.log(`   ✓ Uploaded ${uploadedImages.length} image(s)`);
    }

    // Prepare specifications
    const specifications = new Map();
    if (productData.specifications) {
      Object.entries(productData.specifications).forEach(([key, value]) => {
        specifications.set(key, value);
      });
    }

    if (productData.warranty) {
      specifications.set('Warranty', productData.warranty);
    }

    if (productData.isPriceOnRequest) {
      specifications.set('Price', 'Price on request - contact us for quotation');
    }

    // Create product
    const newProduct = await Product.create({
      name: productData.name,
      slug,
      sku,
      description: productData.description,
      brand: manufacturer._id,
      category: category._id,
      price: productData.price,
      oldPrice: productData.oldPrice || null,
      stock: productData.stock || 0,
      lowStockThreshold: productData.lowStockThreshold || 5,
      unit: productData.unit || 'piece',
      minOrderQty: productData.minOrderQty || 1,
      images: uploadedImages,
      specifications,
      certifications: productData.certifications || [],
      badge: productData.badge || null,
      isFeatured: productData.isFeatured || false,
      isActive: true,
      tags: ['EDAN', category.name, 'Hospital Equipment', 'China Quality'],
    });

    console.log(`   ✓ Created product (ID: ${newProduct._id})`);
    console.log(`   ✓ Price: ${productData.isPriceOnRequest ? 'Price on request' : '৳' + newProduct.price.toLocaleString()}`);
    console.log(`   ✓ Stock: ${newProduct.stock} units`);

    return { success: true, product: newProduct };
  } catch (error) {
    console.error(`   ✗ Error: ${error.message}`);
    return { success: false, reason: error.message, product: null };
  }
}

/**
 * Main import function
 */
async function importEDANProducts() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  EDAN Product Import Script');
  console.log('═══════════════════════════════════════════════════════════\n');

  const stats = {
    total: EDAN_PRODUCTS.length,
    success: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  try {
    // Connect to MongoDB
    console.log('→ Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Get or create EDAN manufacturer
    console.log('→ Setting up EDAN manufacturer...');
    const manufacturer = await getEDANManufacturer();
    console.log(`   ID: ${manufacturer._id}\n`);

    // Get available categories
    console.log('→ Available categories:');
    const categories = await Category.find({ isActive: true })
      .select('name')
      .sort({ name: 1 })
      .lean();
    categories.forEach(cat => console.log(`   - ${cat.name}`));
    console.log('');

    // Import products
    console.log(`→ Importing ${stats.total} product(s)...\n`);
    console.log('─'.repeat(60));

    for (const productData of EDAN_PRODUCTS) {
      const result = await importProduct(productData, manufacturer);

      if (result.success) {
        stats.success++;
      } else if (result.reason === 'duplicate') {
        stats.skipped++;
      } else {
        stats.failed++;
        stats.errors.push({
          product: productData.name,
          error: result.reason,
        });
      }

      // Add delay to avoid rate limiting on Cloudinary
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Print summary
    console.log('\n' + '─'.repeat(60));
    console.log('\n📊 Import Summary:');
    console.log('─'.repeat(60));
    console.log(`   Total products:      ${stats.total}`);
    console.log(`   ✓ Successfully added: ${stats.success}`);
    console.log(`   ⊘ Skipped (existing): ${stats.skipped}`);
    console.log(`   ✗ Failed:             ${stats.failed}`);
    console.log('─'.repeat(60));

    // Print errors if any
    if (stats.errors.length > 0) {
      console.log('\n❌ Errors:\n');
      stats.errors.forEach((err, index) => {
        console.log(`   ${index + 1}. ${err.product}`);
        console.log(`      Error: ${err.error}\n`);
      });
    }

    // Print next steps
    if (stats.success > 0) {
      console.log('\n✅ Next Steps:\n');
      console.log('   1. Verify products in Admin Dashboard');
      console.log('   2. Check product images and descriptions');
      console.log('   3. Update stock levels if needed');
      console.log('   4. Set featured products if desired');
      console.log('   5. Review and adjust pricing\n');
    }

    console.log('═══════════════════════════════════════════════════════════\n');
  } catch (error) {
    console.error('\n❌ Fatal Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('✓ Database connection closed\n');
  }
}

// Run import
if (require.main === module) {
  importEDANProducts().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { importEDANProducts, EDAN_PRODUCTS };
