'use client';

/**
 * ProductVideo — Video Embed for Product Pages
 * 
 * Supports:
 * - YouTube videos
 * - Vimeo videos
 * - Direct video URLs (mp4, webm)
 * - Lazy loading with thumbnail
 * - Responsive aspect ratio
 */

import { useState } from 'react';
import { FiPlay, FiX } from 'react-icons/fi';

export default function ProductVideo({ 
  videoUrl, 
  thumbnail,
  title = 'Product Video',
  autoplay = false,
  className = ''
}) {
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [showVideo, setShowVideo] = useState(autoplay);

  if (!videoUrl) return null;

  // Detect video platform
  const videoType = detectVideoType(videoUrl);
  const embedUrl = getEmbedUrl(videoUrl, videoType);

  const handlePlay = () => {
    setShowVideo(true);
    setIsPlaying(true);
  };

  const handleClose = () => {
    setShowVideo(false);
    setIsPlaying(false);
  };

  return (
    <div className={`relative ${className}`}>
      {!showVideo ? (
        // Video thumbnail with play button
        <button
          onClick={handlePlay}
          className="relative w-full aspect-video rounded-lg overflow-hidden group bg-gray-900"
        >
          {/* Thumbnail */}
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={title}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--color-brand-navy)] to-[var(--color-brand-navy)]">
              <div className="text-center">
                <FiPlay className="w-16 h-16 text-white/50 mx-auto mb-2" />
                <p className="text-white/70 text-sm">Video Preview</p>
              </div>
            </div>
          )}

          {/* Play button overlay */}
          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-danger flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
              <FiPlay className="w-10 h-10 text-white ml-1" />
            </div>
          </div>

          {/* Video type badge */}
          <div className="absolute top-3 left-3 px-2 py-1 bg-black/70 backdrop-blur-sm text-white text-xs font-semibold rounded">
            {videoType.toUpperCase()}
          </div>
        </button>
      ) : (
        // Video player
        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 z-20 p-0 w-11 h-11 flex items-center justify-center bg-black/70 backdrop-blur-sm rounded-full text-white hover:bg-black/90 transition-colors"
            aria-label="Close video"
          >
            <FiX className="w-5 h-5" />
          </button>

          {/* Video embed */}
          {videoType === 'youtube' && (
            <iframe
              src={embedUrl}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          )}

          {videoType === 'vimeo' && (
            <iframe
              src={embedUrl}
              title={title}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          )}

          {videoType === 'direct' && (
            <video
              src={videoUrl}
              controls
              autoPlay={isPlaying}
              className="w-full h-full"
            >
              Your browser does not support the video tag.
            </video>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Detect video type from URL
 */
function detectVideoType(url) {
  if (!url) return 'unknown';

  const urlLower = url.toLowerCase();

  if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
    return 'youtube';
  }

  if (urlLower.includes('vimeo.com')) {
    return 'vimeo';
  }

  if (urlLower.endsWith('.mp4') || urlLower.endsWith('.webm') || urlLower.endsWith('.ogg')) {
    return 'direct';
  }

  return 'unknown';
}

/**
 * Get embeddable URL for video platforms
 */
function getEmbedUrl(url, type) {
  if (type === 'youtube') {
    // Extract video ID
    let videoId = '';
    
    if (url.includes('youtube.com/watch')) {
      const urlObj = new URL(url);
      videoId = urlObj.searchParams.get('v');
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1].split('?')[0];
    }

    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
    }
  }

  if (type === 'vimeo') {
    // Extract video ID
    const match = url.match(/vimeo\.com\/(\d+)/);
    if (match && match[1]) {
      return `https://player.vimeo.com/video/${match[1]}?autoplay=1`;
    }
  }

  return url;
}

/**
 * ProductVideoGallery — Multiple videos in a gallery
 */
export function ProductVideoGallery({ videos = [], className = '' }) {
  const [selectedVideo, setSelectedVideo] = useState(null);

  if (!videos || videos.length === 0) return null;

  return (
    <div className={className}>
      <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
        Product Videos
      </h3>

      {/* Video grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {videos.map((video, index) => (
          <div key={index} className="relative">
            {selectedVideo === index ? (
              <ProductVideo
                videoUrl={video.url}
                thumbnail={video.thumbnail}
                title={video.title || `Product Video ${index + 1}`}
                autoplay={true}
              />
            ) : (
              <button
                onClick={() => setSelectedVideo(index)}
                className="relative w-full aspect-video rounded-lg overflow-hidden group bg-gray-900"
              >
                {video.thumbnail ? (
                  <img
                    src={video.thumbnail}
                    alt={video.title || `Video ${index + 1}`}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--color-brand-navy)] to-[var(--color-brand-navy)]">
                    <FiPlay className="w-12 h-12 text-white/50" />
                  </div>
                )}

                {/* Play overlay */}
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-danger flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FiPlay className="w-6 h-6 text-white ml-0.5" />
                  </div>
                </div>

                {/* Video title */}
                {video.title && (
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                    <p className="text-white text-sm font-medium line-clamp-1">
                      {video.title}
                    </p>
                  </div>
                )}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * ProductVideoCompact — Smaller version for cards
 */
export function ProductVideoCompact({ videoUrl, className = '' }) {
  const [showVideo, setShowVideo] = useState(false);

  if (!videoUrl) return null;

  if (!showVideo) {
    return (
      <button
        onClick={() => setShowVideo(true)}
        className={`inline-flex items-center gap-2 px-3 py-1.5 bg-danger hover:bg-danger text-white text-sm font-medium rounded-lg transition-colors ${className}`}
      >
        <FiPlay className="w-4 h-4" />
        Watch Video
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] bg-black/90 flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl">
        <button
          onClick={() => setShowVideo(false)}
          className="absolute -top-12 right-0 p-2 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 transition-colors"
        >
          <FiX className="w-6 h-6" />
        </button>
        
        <ProductVideo videoUrl={videoUrl} autoplay={true} />
      </div>
    </div>
  );
}
