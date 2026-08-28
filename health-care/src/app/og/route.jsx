import { ImageResponse } from 'next/og';

export const runtime = 'edge';

/**
 * Dynamic OG image generator — /og?title=...&subtitle=...&page=...&price=...&productImage=...
 *
 * Supports two layouts:
 *   - Default (no productImage): full-width branded card with title + subtitle + tags
 *   - Product (productImage set): split layout — product photo left, info right
 *
 * All params are optional and have sensible defaults.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const title        = searchParams.get('title')        || 'Medical Equipment Supplier Bangladesh';
  const subtitle     = searchParams.get('subtitle')     || 'Diagnostic • Surgical • Reagents • Hospital Equipment';
  const page         = searchParams.get('page')         || '';
  const price        = searchParams.get('price')        || '';
  const brand        = searchParams.get('brand')        || '';
  const productImage = searchParams.get('productImage') || '';
  const category     = searchParams.get('category')     || '';

  // ── Product card layout (when productImage is provided) ──────────────────
  if (productImage) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '1200px',
            height: '630px',
            display: 'flex',
            background: 'linear-gradient(135deg, #0b2545 0%, #0d3162 55%, #0e8a6e 100%)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Background dots */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            display: 'flex',
          }} />

          {/* Left accent bar */}
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: '5px',
            background: 'linear-gradient(180deg, #4ddbb8 0%, #0e8a6e 100%)',
            display: 'flex',
          }} />

          {/* Product image panel (left ~42%) */}
          <div style={{
            width: '500px',
            height: '630px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255,255,255,0.06)',
            borderRight: '1px solid rgba(255,255,255,0.1)',
            flexShrink: 0,
            padding: '32px',
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={productImage}
              alt={title}
              style={{
                maxWidth: '420px',
                maxHeight: '520px',
                objectFit: 'contain',
                borderRadius: '16px',
              }}
            />
          </div>

          {/* Right info panel */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '44px 52px 44px 48px',
            position: 'relative',
            zIndex: 1,
          }}>
            {/* Top: Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)',
                border: '2px solid rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{
                  width: '26px', height: '26px', background: '#4ddbb8',
                  borderRadius: '50%', display: 'flex',
                }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '22px', fontWeight: '700', color: '#ffffff', lineHeight: 1 }}>
                  Mediport<span style={{ color: '#4ddbb8' }}>BD</span>
                </span>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>
                  www.mediportbd.com
                </span>
              </div>
              {/* DGDA badge */}
              <div style={{
                marginLeft: 'auto',
                padding: '4px 10px', borderRadius: '16px',
                background: 'rgba(77,219,184,0.15)',
                border: '1px solid rgba(77,219,184,0.3)',
                fontSize: '10px', fontWeight: '600',
                color: '#4ddbb8', letterSpacing: '0.07em',
                display: 'flex',
              }}>
                DGDA REGISTERED
              </div>
            </div>

            {/* Middle: Product info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(category || brand) && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {brand && (
                    <span style={{
                      fontSize: '12px', fontWeight: '600', color: '#4ddbb8',
                      textTransform: 'uppercase', letterSpacing: '0.1em',
                    }}>
                      {brand}
                    </span>
                  )}
                  {brand && category && (
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>·</span>
                  )}
                  {category && (
                    <span style={{
                      fontSize: '12px', color: 'rgba(255,255,255,0.5)',
                      letterSpacing: '0.04em',
                    }}>
                      {category}
                    </span>
                  )}
                </div>
              )}

              <div style={{
                fontSize: title.length > 40 ? '28px' : '34px',
                fontWeight: '700',
                color: '#ffffff',
                lineHeight: 1.2,
                letterSpacing: '-0.3px',
                display: 'flex',
                flexWrap: 'wrap',
              }}>
                {title.length > 60 ? title.slice(0, 57) + '…' : title}
              </div>

              {price && (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
                  <span style={{
                    fontSize: '36px', fontWeight: '700', color: '#4ddbb8',
                    letterSpacing: '-0.5px', display: 'flex',
                  }}>
                    {price}
                  </span>
                  <span style={{
                    fontSize: '14px', color: 'rgba(255,255,255,0.5)', display: 'flex',
                  }}>
                    in Bangladesh
                  </span>
                </div>
              )}
            </div>

            {/* Bottom: Trust tags */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['CE Certified', 'Free Delivery Dhaka', 'B2B Pricing'].map((tag) => (
                <div key={tag} style={{
                  padding: '6px 12px', borderRadius: '6px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  fontSize: '12px', fontWeight: '500',
                  color: 'rgba(255,255,255,0.75)',
                  display: 'flex',
                }}>
                  {tag}
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  // ── Default full-width layout ─────────────────────────────────────────────
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          background: 'linear-gradient(135deg, #0b2545 0%, #0d3162 55%, #0e8a6e 100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background decoration circles */}
        <div style={{
          position: 'absolute', top: '-120px', right: '-80px',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(77,219,184,0.18) 0%, transparent 70%)',
          display: 'flex',
        }} />
        <div style={{
          position: 'absolute', bottom: '-160px', left: '-80px',
          width: '440px', height: '440px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(14,138,110,0.22) 0%, transparent 70%)',
          display: 'flex',
        }} />
        {/* Grid dots pattern */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          display: 'flex',
        }} />

        {/* Left accent bar */}
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: '6px',
          background: 'linear-gradient(180deg, #4ddbb8 0%, #0e8a6e 100%)',
          display: 'flex',
        }} />

        {/* Main content */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '56px 64px 52px 72px',
          width: '100%',
          position: 'relative',
          zIndex: 1,
        }}>

          {/* Top: Logo + Brand name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            {/* Logo circle */}
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.12)',
              border: '2px solid rgba(255,255,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{
                width: '36px', height: '36px',
                background: '#4ddbb8',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{
                  width: '18px', height: '4px',
                  background: '#0b2545',
                  borderRadius: '2px',
                  display: 'flex',
                }} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{
                fontSize: '32px', fontWeight: '700', color: '#ffffff',
                letterSpacing: '-0.5px', lineHeight: 1,
              }}>
                Mediport<span style={{ color: '#4ddbb8' }}>BD</span>
              </span>
              <span style={{
                fontSize: '13px', color: 'rgba(255,255,255,0.55)',
                marginTop: '4px', letterSpacing: '0.04em',
              }}>
                www.mediportbd.com
              </span>
            </div>

            {/* DGDA badge */}
            <div style={{
              marginLeft: 'auto',
              display: 'flex', gap: '10px',
            }}>
              <div style={{
                padding: '6px 14px', borderRadius: '20px',
                background: 'rgba(77,219,184,0.15)',
                border: '1px solid rgba(77,219,184,0.35)',
                fontSize: '12px', fontWeight: '600',
                color: '#4ddbb8', letterSpacing: '0.06em',
                display: 'flex',
              }}>
                DGDA REGISTERED
              </div>
              <div style={{
                padding: '6px 14px', borderRadius: '20px',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                fontSize: '12px', fontWeight: '600',
                color: 'rgba(255,255,255,0.7)', letterSpacing: '0.06em',
                display: 'flex',
              }}>
                ISO 13485
              </div>
            </div>
          </div>

          {/* Center: Main title */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {page && (
              <span style={{
                fontSize: '13px', color: '#4ddbb8', fontWeight: '600',
                textTransform: 'uppercase', letterSpacing: '0.12em',
              }}>
                {page}
              </span>
            )}
            <div style={{
              fontSize: title.length > 45 ? '42px' : '52px',
              fontWeight: '700',
              color: '#ffffff',
              lineHeight: 1.15,
              letterSpacing: '-0.5px',
              maxWidth: '820px',
              display: 'flex',
              flexWrap: 'wrap',
            }}>
              {title}
            </div>
            <div style={{
              fontSize: '20px', color: 'rgba(255,255,255,0.65)',
              fontWeight: '400', lineHeight: 1.4,
              display: 'flex',
            }}>
              {subtitle}
            </div>
          </div>

          {/* Bottom: Feature tags */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            {['Bangladesh', 'B2B & Retail', 'DGDA Certified', 'Free Delivery Dhaka'].map((tag) => (
              <div key={tag} style={{
                padding: '8px 16px', borderRadius: '8px',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.14)',
                fontSize: '14px', fontWeight: '500',
                color: 'rgba(255,255,255,0.8)',
                display: 'flex',
              }}>
                {tag}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
