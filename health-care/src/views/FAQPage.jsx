'use client';

import { useState } from 'react';
import { FaChevronDown, FaChevronUp, FaSearch, FaPhone, FaEnvelope, FaWhatsapp } from 'react-icons/fa';

const FAQ_CATEGORIES = [
  {
    category: 'Orders & Payment',
    icon: 'ðŸ›’',
    faqs: [
      {
        question: 'How do I place an order?',
        answer: 'Browse products, add items to cart, proceed to checkout, fill in delivery details, choose payment method (bKash, Nagad, Bank Transfer, or Cash on Delivery), and confirm your order. You\'ll receive an email confirmation within minutes.'
      },
      {
        question: 'What payment methods do you accept?',
        answer: 'We accept bKash, Nagad, bank transfer, credit/debit cards, and cash on delivery (COD) for orders within Dhaka. B2B customers can apply for credit terms (30-90 days).'
      },
      {
        question: 'Is cash on delivery available?',
        answer: 'Yes, COD is available for orders within Dhaka city. A small COD fee may apply depending on order value.'
      },
      {
        question: 'Can I cancel or modify my order?',
        answer: 'Yes, you can cancel or modify your order within 2 hours of placement. Contact us immediately at +880 1646-886795 or mahimrahman07@gmail.com. Once shipped, cancellation is not possible, but you can initiate a return.'
      },
      {
        question: 'Do you provide invoices?',
        answer: 'Yes, all orders include a detailed invoice with VAT breakdown. You can download your invoice from your account dashboard or request it via email.'
      }
    ]
  },
  {
    category: 'Delivery & Shipping',
    icon: 'ðŸšš',
    faqs: [
      {
        question: 'What are your delivery areas?',
        answer: 'We deliver across Bangladesh. Free delivery for orders above ৳50,000 in Dhaka, Chittagong, and Sylhet. Delivery charges apply for other areas and smaller orders.'
      },
      {
        question: 'How long does delivery take?',
        answer: 'Dhaka: 1-2 business days | Chittagong & Sylhet: 2-3 business days | Other areas: 3-5 business days. Express delivery available in Dhaka (same-day or next-day).'
      },
      {
        question: 'Can I track my order?',
        answer: 'Yes! You\'ll receive a tracking link via SMS and email once your order ships. You can also track orders from your account dashboard or our Track Order page.'
      },
      {
        question: 'Do you provide installation?',
        answer: 'Yes, free installation is included for diagnostic equipment (ECG machines, patient monitors, etc.) in Dhaka. Installation charges apply outside Dhaka. We also provide staff training.'
      },
      {
        question: 'What about cold chain delivery for reagents?',
        answer: 'All temperature-sensitive reagents are shipped with proper cold chain packaging (ice packs, insulated boxes) to maintain 2-8Â°C throughout transit. Door-to-door cold chain delivery available.'
      }
    ]
  },
  {
    category: 'Products & Stock',
    icon: 'ðŸ“¦',
    faqs: [
      {
        question: 'Are all products DGDA registered?',
        answer: 'Yes, 100% of our products are DGDA registered and CE certified. DGDA registration numbers are displayed on product pages.'
      },
      {
        question: 'Do you have stock available?',
        answer: 'Most products are in stock. Stock status is shown on product pages. For bulk orders or specific items, please contact us to confirm availability before ordering.'
      },
      {
        question: 'Can I request a product not listed?',
        answer: 'Yes! We can source specific medical equipment on request. Contact us with product details, and we\'ll provide a quote within 24-48 hours.'
      },
      {
        question: 'What brands do you carry?',
        answer: 'We carry leading brands including Siemens, GE, Mindray, Roche, Abbott, Beckman Coulter, Eppendorf, and many others. All products are 100% genuine with manufacturer warranty.'
      },
      {
        question: 'Do products come with warranty?',
        answer: 'Yes, all products include manufacturer warranty. Warranty period varies by product (typically 1-2 years for equipment, shorter for consumables). Extended warranty available on request.'
      }
    ]
  },
  {
    category: 'Returns & Refunds',
    icon: 'â†©ï¸',
    faqs: [
      {
        question: 'What is your return policy?',
        answer: '7-day return policy for unused items in original packaging. Medical equipment must be unopened. Reagents and consumables are non-returnable unless damaged. Restocking fee may apply.'
      },
      {
        question: 'How do I initiate a return?',
        answer: 'Go to My Account > Returns, select the order, provide reason, and submit. Our team will review and approve within 24 hours. You can then ship the item back or arrange pickup.'
      },
      {
        question: 'When will I receive my refund?',
        answer: 'Refunds are processed within 5-7 business days after we receive and inspect the returned item. Refunds go back to your original payment method (bKash, bank, etc.).'
      },
      {
        question: 'What if I receive a damaged product?',
        answer: 'Contact us immediately (within 24 hours of delivery) with photos. We\'ll arrange free pickup and send a replacement or issue full refund including delivery charges.'
      },
      {
        question: 'Can I exchange a product?',
        answer: 'Yes, exchanges are allowed for unopened products within 7 days. Contact us to arrange an exchange. You may need to pay any price difference.'
      }
    ]
  },
  {
    category: 'B2B & Bulk Orders',
    icon: 'ðŸ¥',
    faqs: [
      {
        question: 'Do you offer bulk discounts?',
        answer: 'Yes! B2B institutions get 8-30% discount based on order value. Register as B2B customer to see discounted pricing automatically.'
      },
      {
        question: 'What are your B2B credit terms?',
        answer: 'We offer 30, 60, or 90-day credit terms to approved B2B customers (hospitals, clinics, diagnostic centers). Apply via B2B Portal with trade license and bank details.'
      },
      {
        question: 'How do I register as B2B customer?',
        answer: 'Go to B2B Portal, fill registration form with business details (trade license, tax ID, bank info), submit. Our team will verify and approve within 1-2 business days.'
      },
      {
        question: 'Can I get a quotation before ordering?',
        answer: 'Yes! B2B customers can request formal quotations. Go to B2B Portal > Request Quote, add products, and submit. You\'ll receive a detailed quote within 24 hours.'
      },
      {
        question: 'Do you participate in tenders?',
        answer: 'Yes, we regularly participate in government and private hospital tenders. Contact our B2B team for tender support and documentation.'
      }
    ]
  },
  {
    category: 'Account & Security',
    icon: 'ðŸ”',
    faqs: [
      {
        question: 'How do I create an account?',
        answer: 'Click Register, provide name, email, phone, and password. Verify your email, and you\'re ready to shop. You can also sign in with Google.'
      },
      {
        question: 'I forgot my password. What should I do?',
        answer: 'Click "Forgot Password" on login page, enter your email, and we\'ll send a password reset link. Follow the link to set a new password.'
      },
      {
        question: 'Is my data secure?',
        answer: 'Yes, we use industry-standard encryption (SSL/TLS) for all data transmission. Payment information is never stored on our servers. We comply with data protection best practices.'
      },
      {
        question: 'Can I update my account information?',
        answer: 'Yes, go to My Account > Profile to update name, phone, email, and address. You can also change your password in the Security section.'
      },
      {
        question: 'Do you offer Two-Factor Authentication (2FA)?',
        answer: 'Yes! Enable 2FA in My Account > Security using Google Authenticator or similar apps for extra account protection.'
      }
    ]
  }
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const toggleFAQ = (categoryName, faqIndex) => {
    const key = `${categoryName}-${faqIndex}`;
    setOpenIndex(openIndex === key ? null : key);
  };

  // Filter FAQs based on search query
  const filteredCategories = FAQ_CATEGORIES.map(cat => ({
    ...cat,
    faqs: cat.faqs.filter(faq =>
      searchQuery === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.faqs.length > 0);

  // Filter by active category
  const displayCategories = activeCategory === 'all' 
    ? filteredCategories 
    : filteredCategories.filter(cat => cat.category === activeCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-background-secondary)] to-[var(--color-background-tertiary)] py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-3">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto">
            Find answers to common questions about ordering, delivery, products, returns, and B2B services.
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[var(--color-text-secondary)]" />
            <input
              type="text"
              placeholder="Search FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-[var(--color-border-primary)] rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent text-[var(--color-text-primary)]"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-2 mb-6 justify-center">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeCategory === 'all'
                ? 'bg-brand-teal text-white shadow-md'
                : 'bg-white text-[var(--color-text-primary)] hover:bg-[var(--color-background-tertiary)]'
            }`}
          >
            All
          </button>
          {FAQ_CATEGORIES.map((cat) => (
            <button
              key={cat.category}
              onClick={() => setActiveCategory(cat.category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat.category
                  ? 'bg-brand-teal text-white shadow-md'
                  : 'bg-white text-[var(--color-text-primary)] hover:bg-[var(--color-background-tertiary)]'
              }`}
            >
              {cat.icon} {cat.category}
            </button>
          ))}
        </div>

        {/* FAQ Sections */}
        {displayCategories.length > 0 ? (
          <div className="space-y-5">
            {displayCategories.map((category) => (
              <div key={category.category} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-brand-teal to-[var(--color-brand-teal-hover)] px-6 py-4">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <span className="text-3xl">{category.icon}</span>
                    {category.category}
                  </h2>
                </div>
                <div className="divide-y divide-[var(--color-border-tertiary)]">
                  {category.faqs.map((faq, faqIndex) => {
                    const key = `${category.category}-${faqIndex}`;
                    const isOpen = openIndex === key;
                    return (
                      <div key={key} className="transition-all">
                        <button
                          onClick={() => toggleFAQ(category.category, faqIndex)}
                          className="w-full px-6 py-5 flex justify-between items-start gap-4 hover:bg-[var(--color-background-secondary)] transition-colors text-left"
                        >
                          <span className="font-semibold text-[var(--color-text-primary)] flex-1">
                            {faq.question}
                          </span>
                          <span className="text-brand-teal flex-shrink-0 mt-1">
                            {isOpen ? <FaChevronUp /> : <FaChevronDown />}
                          </span>
                        </button>
                        {isOpen && (
                          <div className="px-6 pb-5 text-[var(--color-text-secondary)] leading-relaxed">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <p className="text-[var(--color-text-secondary)] text-lg mb-2">No FAQs found matching your search.</p>
            <p className="text-[var(--color-text-secondary)] text-sm">Try a different search term or browse all categories.</p>
          </div>
        )}

        {/* Still have questions? */}
        <div className="mt-8 bg-gradient-to-r from-brand-teal to-[var(--color-brand-teal-hover)] rounded-2xl shadow-lg p-5 text-white">
          <h3 className="text-lg font-semibold mb-3 text-center">Still have questions?</h3>
          <p className="text-center mb-6 text-white/90">
            Our support team is here to help you with any inquiries.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <a
              href="tel:+8801646886795"
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl p-4 flex items-center gap-3 transition-all"
            >
              <div className="bg-white/20 p-3 rounded-lg">
                <FaPhone className="text-xl" />
              </div>
              <div>
                <p className="text-sm text-white/80">Call Us</p>
                <p className="font-semibold">+880 1646-886795</p>
              </div>
            </a>
            <a
              href="mailto:mahimrahman07@gmail.com"
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl p-4 flex items-center gap-3 transition-all"
            >
              <div className="bg-white/20 p-3 rounded-lg">
                <FaEnvelope className="text-xl" />
              </div>
              <div>
                <p className="text-sm text-white/80">Email Us</p>
                <p className="font-semibold">mahimrahman07@gmail.com</p>
              </div>
            </a>
            <a
              href="https://wa.me/8801646886795"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl p-4 flex items-center gap-3 transition-all"
            >
              <div className="bg-white/20 p-3 rounded-lg">
                <FaWhatsapp className="text-xl" />
              </div>
              <div>
                <p className="text-sm text-white/80">WhatsApp</p>
                <p className="font-semibold">8801646886795</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
