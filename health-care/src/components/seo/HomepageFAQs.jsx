/**
 * Homepage FAQ Schema Component
 * 
 * Targets Google's "People Also Ask" feature to increase CTR and visibility.
 * These FAQs answer common queries about MediportBD's services and build trust.
 */

import FAQSchema from './FAQSchema';

export const HOMEPAGE_FAQS = [
  {
    question: "What medical equipment does MediportBD supply in Bangladesh?",
    answer: "MediportBD supplies 350+ medical equipment products including diagnostic machines (ECG, ultrasound, patient monitors), surgical instruments, laboratory reagents (HbA1c, CBC, troponin kits), hospital equipment, PPE, and medical supplies. All products are DGDA registered and CE certified."
  },
  {
    question: "Does MediportBD offer B2B bulk pricing for hospitals?",
    answer: "Yes, MediportBD offers 8-30% bulk discounts for hospitals, clinics, and diagnostic centers in Bangladesh. B2B clients receive 30-90 day credit terms, free installation in Dhaka metro area, dedicated account managers, and 24/7 technical support."
  },
  {
    question: "Are MediportBD products DGDA registered and certified?",
    answer: "Yes, MediportBD is a DGDA registered medical equipment supplier (License No: [Add License Number]). All products we sell are DGDA approved and CE certified, meeting Bangladesh medical device regulations and international quality standards."
  },
  {
    question: "What is the delivery time for medical equipment in Dhaka?",
    answer: "MediportBD offers same-day delivery in Dhaka metro area for in-stock items ordered before 2 PM. Orders over ৳50,000 qualify for free delivery. Nationwide delivery to other cities takes 2-5 business days via reliable courier services."
  },
  {
    question: "Does MediportBD provide installation and training services?",
    answer: "Yes, MediportBD provides free installation and staff training for diagnostic equipment (ECG machines, patient monitors, ultrasound) in Dhaka metro area. Our certified technicians ensure proper setup, calibration, and operation training for your medical team."
  },
  {
    question: "Can I get laboratory reagents with cold chain delivery in Bangladesh?",
    answer: "Yes, MediportBD maintains proper cold chain management (2-8°C or -20°C) for all laboratory reagents. We supply HbA1c, CBC, biochemistry, and immunoassay reagents from Roche, Abbott, and Siemens with temperature-monitored cold chain delivery across Bangladesh."
  },
  {
    question: "What brands of medical equipment does MediportBD sell?",
    answer: "MediportBD sells medical equipment from world-leading brands including Siemens Healthineers, GE Healthcare, Mindray, Roche Diagnostics, Abbott, Omron, Rossmax, B-Braun, JMS, ConvaTec, Accu-Chek, and 50+ other trusted manufacturers."
  },
  {
    question: "How can I request a quote for bulk medical equipment orders?",
    answer: "You can request a free B2B quote by visiting mediportbd.com/b2b, calling +880 1646-886795, or emailing mediportbdofficial@gmail.com. Our B2B team will respond within 24 hours with customized pricing, credit terms, and delivery timelines."
  }
];

export default function HomepageFAQs() {
  return <FAQSchema faqs={HOMEPAGE_FAQS} />;
}
