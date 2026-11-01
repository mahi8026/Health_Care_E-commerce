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
    answer: "B2B and volume pricing is available on request for hospitals, clinics and diagnostic centres in Bangladesh. Contact our B2B team for a written quotation."
  },
  {
    question: "Does MediportBD offer credit terms for B2B medical equipment purchases?",
    answer: "Payment terms are agreed per account and confirmed in writing. Contact our B2B team to apply."
  },
  {
    question: "What services are included in MediportBD's B2B program?",
    answer: "B2B clients can request volume pricing, a written quotation and procurement support tailored to their order."
  },
  {
    question: "How do hospitals request a B2B quote from MediportBD?",
    answer: "Hospitals can request a B2B quotation by visiting www.mediportbd.com/b2b and filling the quote request form. We will reply with a written quotation."
  },
  {
    question: "Does MediportBD supply laboratory reagents in bulk for diagnostic centers?",
    answer: "Yes, MediportBD supplies laboratory reagents in bulk. We offer HbA1c, CBC, biochemistry, immunoassay and coagulation reagents from Roche, Abbott and Siemens. Storage and delivery requirements are confirmed in your quotation."
  },
  {
    question: "What is the minimum order value for B2B pricing at MediportBD?",
    answer: "The minimum order value for B2B pricing is ৳100,000 (8% discount). Higher volume orders receive progressive discounts: ৳3 lakh (15% discount), ৳5 lakh (20% discount), ৳10 lakh+ (25-30% discount). Contact us for enterprise-level pricing above ৳50 lakh."
  },
  {
    question: "Does MediportBD provide free installation for hospital equipment in Bangladesh?",
    answer: "Installation and staff training depend on the equipment and location — we will confirm what is available in your quotation."
  }
];

export default function B2BFAQs() {
  return <FAQSchema faqs={B2B_FAQS} />;
}
