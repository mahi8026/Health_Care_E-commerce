export default function Footer() {
  const currentYear = new Date().getFullYear();

  const links = [
    {
      heading: 'Company',
      items: [
        { label: 'About Us', href: '/about' },
        { label: 'Careers', href: '/careers' },
        { label: 'News', href: '/news' },
        { label: 'Contact', href: '/contact' },
      ],
    },
    {
      heading: 'Products',
      items: [
        { label: 'Diagnostic Equipment', href: '/search?category=Diagnostic+Equipment' },
        { label: 'Surgical Instruments', href: '/search?category=Surgical+Instruments' },
        { label: 'Laboratory Reagents', href: '/search?category=Laboratory+Reagents' },
        { label: 'Hospital Machines', href: '/search?category=Hospital+Machines' },
      ],
    },
    {
      heading: 'B2B',
      items: [
        { label: 'Register B2B Account', href: '/register' },
        { label: 'Bulk Pricing', href: '/b2b' },
        { label: 'Credit Terms', href: '/b2b#credit' },
        { label: 'Request a Quote', href: '/b2b#quote' },
      ],
    },
    {
      heading: 'Support',
      items: [
        { label: 'Help Centre', href: '/help' },
        { label: 'Track Order', href: '/track' },
        { label: 'Returns Policy', href: '/returns' },
        { label: 'Warranty', href: '/warranty' },
      ],
    },
  ];

  return (
    <footer className="bg-[#0B2545] text-white">
      {/* Main footer content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1.5fr] gap-8">
          {/* Link columns */}
          {links.map((col) => (
            <div key={col.heading}>
              <h4 className="text-[12px] font-semibold uppercase tracking-wider text-[#4DDBB8] mb-4 font-[family-name:var(--font-plus-jakarta)]">
                {col.heading}
              </h4>
              <ul className="space-y-2">
                {col.items.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="text-[12px] text-white/70 hover:text-white transition-colors"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Brand column */}
          <div>
            <div className="font-[family-name:var(--font-lora)] text-[24px] font-semibold mb-2">
              MedCore<span className="text-[#0E8A6E]">BD</span>
            </div>
            <p className="text-[12px] text-white/70 mb-4 leading-relaxed">
              Bangladesh's trusted source for premium medical equipment, surgical instruments, and laboratory reagents.
            </p>

            {/* Badges */}
            <div className="flex gap-2 flex-wrap mb-4">
              <span className="text-[10px] px-2 py-1 rounded border border-[#0E8A6E] text-[#4DDBB8] font-medium">
                DGDA Registered
              </span>
              <span className="text-[10px] px-2 py-1 rounded border border-[#0E8A6E] text-[#4DDBB8] font-medium">
                ISO 13485
              </span>
            </div>

            {/* Contact */}
            <div className="space-y-1">
              <a
                href="https://wa.me/8801700000000"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[12px] text-white/70 hover:text-white transition-colors"
              >
                <span>📱</span>
                <span>+880 1700-000000 (WhatsApp)</span>
              </a>
              <a
                href="mailto:info@medcorebd.com"
                className="flex items-center gap-2 text-[12px] text-white/70 hover:text-white transition-colors"
              >
                <span>✉️</span>
                <span>info@medcorebd.com</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between flex-wrap gap-3">
          <p className="text-[11px] text-white/50">
            © {currentYear} MedCore Bangladesh Ltd. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a href="/privacy" className="text-[11px] text-white/50 hover:text-white/80 transition-colors">
              Privacy Policy
            </a>
            <a href="/terms" className="text-[11px] text-white/50 hover:text-white/80 transition-colors">
              Terms of Service
            </a>
            <span className="text-[11px] text-[#4DDBB8] font-medium">DGDA Registered</span>
            <span className="text-[11px] text-[#4DDBB8] font-medium">ISO 13485</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
