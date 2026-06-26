'use client';

import { useRouter } from 'next/navigation';
import { 
  FaPhoneAlt, 
  FaWhatsapp, 
  FaEnvelope, 
  FaFileAlt,
  FaQuestionCircle,
  FaShippingFast,
  FaCertificate,
  FaHeadset
} from 'react-icons/fa';

const SUPPORT_OPTIONS = [
  {
    icon: <FaPhoneAlt />,
    title: 'Call Us',
    desc: '+880 1646-886795',
    action: 'tel:+8801646886795',
    color: '#0066CC',
    bgColor: '#EFF6FF'
  },
  {
    icon: <FaWhatsapp />,
    title: 'WhatsApp Support',
    desc: 'Chat with our team',
    action: 'https://wa.me/8801646886795',
    color: '#25D366',
    bgColor: '#F0FDF4'
  },
  {
    icon: <FaEnvelope />,
    title: 'Email Us',
    desc: 'mahimrahman07@gmail.com',
    action: 'mailto:mahimrahman07@gmail.com',
    color: '#DC2626',
    bgColor: '#FFF1F2'
  },
  {
    icon: <FaQuestionCircle />,
    title: 'FAQs',
    desc: 'Common questions',
    action: '/faq',
    color: '#7C3AED',
    bgColor: '#FAF5FF'
  },
  {
    icon: <FaFileAlt />,
    title: 'Request Quote',
    desc: 'Get B2B pricing',
    action: '/b2b',
    color: '#EA580C',
    bgColor: '#FFF7ED'
  },
  {
    icon: <FaShippingFast />,
    title: 'Track Order',
    desc: 'Check delivery status',
    action: '/track',
    color: '#0891B2',
    bgColor: '#F0FDFA'
  },
  {
    icon: <FaCertificate />,
    title: 'Certifications',
    desc: 'DGDA & ISO verified',
    action: '/certifications',
    color: '#CA8A04',
    bgColor: '#FFFBEB'
  },
  {
    icon: <FaHeadset />,
    title: '24/7 Support',
    desc: 'Technical assistance',
    action: '/support',
    color: '#059669',
    bgColor: '#F0FDF4'
  },
];

export default function SupportResources() {
  const router = useRouter();

  const handleClick = (action) => {
    if (action.startsWith('http') || action.startsWith('tel:') || action.startsWith('mailto:')) {
      window.open(action, '_blank', 'noopener,noreferrer');
    } else {
      router.push(action);
    }
  };

  return (
    <section style={{ padding: '60px 24px', background: '#FAFBFC' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div className="text-center" style={{ marginBottom: 40 }}>
          <p style={{ fontSize: 11, color: '#0E8A6E', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
            WE&apos;RE HERE TO HELP
          </p>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: '#0B2545', marginBottom: 10, fontFamily: 'Georgia, serif' }}>
            Support & Resources
          </h2>
          <p style={{ fontSize: 14, color: '#64748B', maxWidth: 600, margin: '0 auto', lineHeight: 1.5 }}>
            Get instant help, documentation, and expert support for your medical equipment needs
          </p>
        </div>

        {/* Support Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 16,
          }}
        >
          {SUPPORT_OPTIONS.map((option, idx) => (
            <div
              key={idx}
              onClick={() => handleClick(option.action)}
              style={{
                background: option.bgColor,
                border: '2px solid transparent',
                borderRadius: 12,
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = option.color;
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 8px 24px ${option.color}20`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 12,
                  background: `linear-gradient(135deg, ${option.color}20, ${option.color}10)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  color: option.color,
                  flexShrink: 0,
                }}
              >
                {option.icon}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0B2545', marginBottom: 3, lineHeight: 1.3 }}>
                  {option.title}
                </h3>
                <p style={{ fontSize: 12, color: '#64748B', margin: 0, lineHeight: 1.4 }}>
                  {option.desc}
                </p>
              </div>

              {/* Arrow/Indicator */}
              <div
                style={{
                  fontSize: 14,
                  color: option.color,
                  opacity: 0.7,
                  transition: 'opacity 0.2s',
                }}
                className="support-arrow"
              >
                →
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div 
          style={{ 
            marginTop: 40, 
            padding: '24px', 
            background: 'linear-gradient(135deg, #0B2545 0%, #134B70 100%)', 
            borderRadius: 12,
            textAlign: 'center'
          }}
        >
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
            Need Technical Support?
          </h3>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 16 }}>
            Our medical equipment specialists are available 24/7 to assist you
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => handleClick('tel:+8801646886795')}
              style={{
                padding: '10px 24px',
                background: '#0E8A6E',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#0c7a61';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#0E8A6E';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              📞 Call Now
            </button>
            <button
              onClick={() => handleClick('https://wa.me/8801646886795')}
              style={{
                padding: '10px 24px',
                background: 'transparent',
                color: '#fff',
                border: '2px solid rgba(255,255,255,0.3)',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
              }}
            >
              💬 WhatsApp
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        div:hover .support-arrow {
          opacity: 1;
        }
        @media (max-width: 640px) {
          div[style*="gridTemplateColumns"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
