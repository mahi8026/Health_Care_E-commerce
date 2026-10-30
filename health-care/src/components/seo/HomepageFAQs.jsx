/**
 * Homepage FAQ Schema Component
 * 
 * Targets Google's "People Also Ask" feature to increase CTR and visibility.
 * These FAQs answer common queries about MediportBD's services and build trust.
 */

import FAQSchema from './FAQSchema';

/**
 * DGDA registration number — supplied by env at build time.
 * The registration fragment is only emitted when a real value is configured;
 * an empty (or placeholder) value must never reach the copy or the JSON-LD.
 */
const DGDA_REGISTRATION_NUMBER = (process.env.NEXT_PUBLIC_DGDA_REGISTRATION_NUMBER || '').trim();
const HAS_USABLE_REGISTRATION_NUMBER =
  DGDA_REGISTRATION_NUMBER.length > 0 &&
  !/^\[|add\s+license|placeholder|^tbd$|^todo$/i.test(DGDA_REGISTRATION_NUMBER);

const DGDA_ANSWER_BASE =
  'MediportBD supplies medical equipment sourced from DGDA-registered importers and manufacturers. Registration details for specific products are available on request.';

const DGDA_ANSWER = HAS_USABLE_REGISTRATION_NUMBER
  ? `${DGDA_ANSWER_BASE} DGDA registration no: ${DGDA_REGISTRATION_NUMBER}.`
  : DGDA_ANSWER_BASE;

export const HOMEPAGE_FAQS = [
  {
    question: "What medical equipment does MediportBD supply in Bangladesh?",
    answer: "MediportBD supplies 600+ medical equipment products including diagnostic machines (ECG, ultrasound, patient monitors), surgical instruments, laboratory reagents (HbA1c, CBC, troponin kits), hospital equipment, PPE, and medical supplies. Products are sourced from leading global manufacturers, with DGDA registration details and conformity documents available on request."
  },
  {
    question: "Does MediportBD offer B2B bulk pricing for hospitals?",
    answer: "Yes. MediportBD offers B2B and volume pricing for hospitals, clinics and labs on request. Request a quotation and we will send a written offer."
  },
  {
    question: "Are MediportBD products DGDA registered?",
    answer: DGDA_ANSWER
  },
  {
    question: "How does delivery work for medical equipment?",
    answer: "Orders over ৳50,000 qualify for free delivery nationwide. We will confirm delivery details in your quotation."
  },
  {
    question: "Is installation and training available?",
    answer: "Installation and training depend on the product. Tell us what you need when you request a quotation, and we will confirm what is available."
  },
  {
    question: "What brands of medical equipment does MediportBD sell?",
    answer: "MediportBD sells medical equipment from world-leading brands including Siemens Healthineers, GE Healthcare, Mindray, Roche Diagnostics, Abbott, Omron, Rossmax, B-Braun, JMS, ConvaTec, Accu-Chek, and other manufacturers."
  },
  {
    question: "How can I request a quote for bulk medical equipment orders?",
    answer: "You can request a B2B quotation by visiting www.mediportbd.com/b2b, calling +880 1646-886795, or emailing mediportbdofficial@gmail.com. We will reply with a written quotation."
  }
];

export default function HomepageFAQs() {
  return <FAQSchema faqs={HOMEPAGE_FAQS} />;
}
