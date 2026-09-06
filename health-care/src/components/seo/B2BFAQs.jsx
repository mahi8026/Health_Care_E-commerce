/**
 * B2B Page FAQ Schema Component
 * 
 * Targets Google's "People Also Ask" feature for B2B-related queries.
 * Focuses on bulk pricing, credit terms, and hospital supply questions.
 */

import FAQSchema from './FAQSchema';

export const B2B_FAQS = [
  {
    question: "What B2B discounts does MediportBD offer for bulk medical equipment orders?",
    answer: "MediportBD offers 8-30% bulk discounts for hospitals, clinics, and diagnostic centers in Bangladesh based on order volume. Discounts range from 8% for orders above ৳100,000 to 30% for orders above ৳10 lakh. Contact our B2B team at +880 1646-886795 for customized bulk pricing."
  },
  {
    question: "Does MediportBD offer credit terms for B2B medical equipment purchases?",
    answer: "Yes, MediportBD offers flexible credit terms of 30-90 days for verified B2B clients (hospitals, clinics, diagnostic centers) with established purchase history. New B2B clients start with 30-day terms after verification. Contact our B2B team to apply for credit terms."
  },
  {
    question: "What services are included in MediportBD's B2B program?",
    answer: "MediportBD B2B clients receive: 8-30% bulk discounts, 30-90 day credit terms, free installation and staff training in Dhaka metro, dedicated account manager, priority technical support 24/7, quarterly maintenance visits, and customized procurement solutions."
  },
  {
    question: "How do hospitals request a B2B quote from MediportBD?",
    answer: "Hospitals can request a free B2B quote by: (1) Visiting mediportbd.com/b2b and filling the quote request form, (2) Calling +880 1646-886795, or (3) Emailing mediportbdofficial@gmail.com with your requirements. Our B2B team responds within 24 hours with customized pricing and credit terms."
  },
  {
    question: "Does MediportBD supply laboratory reagents in bulk for diagnostic centers?",
    answer: "Yes, MediportBD supplies laboratory reagents in bulk with cold chain management (2-8°C or -20°C). We offer HbA1c, CBC, biochemistry, immunoassay, and coagulation reagents from Roche, Abbott, and Siemens. B2B diagnostic centers receive regular supply contracts with 10-25% bulk discounts."
  },
  {
    question: "What is the minimum order value for B2B pricing at MediportBD?",
    answer: "The minimum order value for B2B pricing is ৳100,000 (8% discount). Higher volume orders receive progressive discounts: ৳3 lakh (15% discount), ৳5 lakh (20% discount), ৳10 lakh+ (25-30% discount). Contact us for enterprise-level pricing above ৳50 lakh."
  },
  {
    question: "Does MediportBD provide free installation for hospital equipment in Bangladesh?",
    answer: "Yes, MediportBD provides free installation and staff training for diagnostic equipment (ECG machines, patient monitors, ultrasound) in Dhaka metro area. For installations outside Dhaka, we offer subsidized installation services. Our certified technicians ensure proper setup, calibration, and operation training."
  }
];

export default function B2BFAQs() {
  return <FAQSchema faqs={B2B_FAQS} />;
}
