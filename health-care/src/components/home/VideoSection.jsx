'use client';

import { useState } from 'react';
import { FaPlay, FaCheckCircle, FaExternalLinkAlt } from 'react-icons/fa';

export default function VideoSection() {
  // YouTube video URL - Opens in new tab since embedding is disabled by owner
  const youtubeWatchUrl = 'https://www.youtube.com/watch?v=xWaEQ_YPNy0';
  const youtubeThumbnail = `https://img.youtube.com/vi/xWaEQ_YPNy0/maxresdefault.jpg`;

  const features = [
    'DGDA Certified Products',
    'ISO 13485 Quality Standards',
    'Free Installation & Training',
    'Cold Chain Delivery for Reagents',
    '24/7 Technical Support',
    'Flexible Payment Options',
  ];

  const handleWatchVideo = () => {
    window.open(youtubeWatchUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <section style={{ padding: '60px 24px', background: 'linear-gradient(135deg, #0B2545 0%, #134B70 100%)', position: 'relative', overflow: 'hidden' }}>
      {/* Background Pattern */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.05, backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 48, alignItems: 'center' }}>
          
          {/* Left: Video Thumbnail */}
          <div style={{ position: 'relative' }}>
            <div
              onClick={handleWatchVideo}
              style={{
                position: 'relative',
                paddingBottom: '56.25%', // 16:9 aspect ratio
                borderRadius: 16,
                overflow: 'hidden',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
                background: '#000',
                maxWidth: 640,
                cursor: 'pointer',
              }}
            >
              {/* YouTube Thumbnail */}
              <div style={{ position: 'absolute', inset: 0 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={youtubeThumbnail}
                  alt="MedCore BD — Leading medical equipment supplier in Bangladesh"
                  style={{ 
                    position: 'absolute', 
                    inset: 0, 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover',
                    transition: 'transform 0.3s'
                  }}
                  onError={(e) => {
                    // Fallback to generic medical image if YouTube thumbnail fails
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=1200&h=675&fit=crop';
                  }}
                />
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', transition: 'background 0.3s' }} className="video-overlay" />
                
                {/* Play Button */}
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 10,
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.95)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s',
                  }}
                  className="play-button"
                >
                  <FaPlay style={{ fontSize: 24, color: '#0E8A6E', marginLeft: 4 }} />
                </div>
                
                {/* Watch on YouTube Badge */}
                <div style={{ 
                  position: 'absolute', 
                  bottom: 16, 
                  left: 16, 
                  background: 'rgba(255,0,0,0.9)', 
                  backdropFilter: 'blur(10px)', 
                  padding: '8px 16px', 
                  borderRadius: 8, 
                  fontSize: 12, 
                  color: '#fff', 
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <FaExternalLinkAlt size={10} />
                  Watch on YouTube
                </div>

                {/* Duration Badge (if you know the video duration) */}
                <div style={{ 
                  position: 'absolute', 
                  bottom: 16, 
                  right: 16, 
                  background: 'rgba(0,0,0,0.8)', 
                  padding: '4px 8px', 
                  borderRadius: 4, 
                  fontSize: 11, 
                  color: '#fff', 
                  fontWeight: 600
                }}>
                  Click to play
                </div>
              </div>
            </div>
          </div>

          {/* Right: Content */}
          <div style={{ color: '#fff' }}>
            <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12, lineHeight: 1.2 }}>
              Why Choose MedCore BD?
            </h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', marginBottom: 24, lineHeight: 1.6 }}>
              Bangladesh&apos;s trusted partner for medical equipment, serving hospitals and diagnostic centers nationwide.
            </p>

            {/* Features Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10, marginBottom: 24 }}>
              {features.map((feature, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: 8,
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <FaCheckCircle style={{ fontSize: 16, color: '#4DDBB8', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{feature}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                onClick={() => window.location.href = '/products'}
                style={{
                  padding: '12px 24px',
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
                  e.currentTarget.style.background = '#0B7558';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#0E8A6E';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Browse Products
              </button>
              <button
                onClick={() => window.location.href = '/b2b'}
                style={{
                  padding: '12px 24px',
                  background: 'transparent',
                  color: '#fff',
                  border: '2px solid rgba(255, 255, 255, 0.4)',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.borderColor = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                }}
              >
                B2B Solutions
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .video-overlay {
          background: rgba(0,0,0,0.3);
        }
        div:hover .video-overlay {
          background: rgba(0,0,0,0.15);
        }
        .play-button {
          transform: translate(-50%, -50%) scale(1);
        }
        div:hover .play-button {
          transform: translate(-50%, -50%) scale(1.15);
          background: rgba(255, 255, 255, 1);
          box-shadow: 0 8px 32px rgba(14, 138, 110, 0.4);
        }
        @media (max-width: 1024px) {
          section > div > div {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
          h2 {
            font-size: 28px !important;
          }
          p {
            font-size: 14px !important;
          }
        }
      `}</style>
    </section>
  );
}
