import Link from 'next/link';

/**
 * BrandLogo — shared MediportBD wordmark.
 *
 * Usage:
 * <BrandLogo size="lg" href="/" />
 */
export default function BrandLogo({ size = 'default', href = '/' }) {
  const sizeClass = size === 'lg' ? 'text-3xl sm:text-4xl' : 'text-3xl';

  return (
    <Link href={href} aria-label="MediportBD home">
      <span className={`font-[family-name:var(--font-lora)] ${sizeClass} font-semibold text-brand-navy`}>
        Mediport<span className="text-brand-teal">BD</span>
      </span>
    </Link>
  );
}
