/**
 * Unit tests for OptimizedImage component
 * 
 * **Validates: Requirements 2.5, 2.8**
 * 
 * Requirement 2.5: THE Application SHALL define explicit `width` and `height` 
 * attributes (or `fill` with a sized container) on every `next/image` instance 
 * to prevent layout shift (CLS contribution ≤ 0).
 * 
 * Requirement 2.8: IF an image fails to load, THEN THE Application SHALL display 
 * a placeholder element of the same dimensions to prevent layout shift.
 */

import { render, screen, waitFor, act } from '@testing-library/react';
import OptimizedImage from '../OptimizedImage';

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ onError, priority, fill, ...props }) => {
    return (
      <img
        {...props}
        data-testid="next-image"
        data-priority={priority ? 'true' : undefined}
        data-fill={fill ? 'true' : undefined}
        onError={onError}
      />
    );
  },
}));

describe('OptimizedImage', () => {
  describe('Correct prop rendering', () => {
    it('should render with required props (src, alt, width, height)', () => {
      render(
        <OptimizedImage
          src="/test-image.jpg"
          alt="Test image"
          width={800}
          height={600}
        />
      );

      const image = screen.getByTestId('next-image');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', '/test-image.jpg');
      expect(image).toHaveAttribute('alt', 'Test image');
      expect(image).toHaveAttribute('width', '800');
      expect(image).toHaveAttribute('height', '600');
    });

    it('should render with fill prop', () => {
      render(
        <OptimizedImage
          src="/test-image.jpg"
          alt="Test image"
          fill={true}
        />
      );

      const image = screen.getByTestId('next-image');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('data-fill', 'true');
      expect(image).not.toHaveAttribute('width');
      expect(image).not.toHaveAttribute('height');
    });

    it('should pass className to next/image', () => {
      render(
        <OptimizedImage
          src="/test-image.jpg"
          alt="Test image"
          width={800}
          height={600}
          className="custom-class rounded-lg"
        />
      );

      const image = screen.getByTestId('next-image');
      expect(image).toHaveClass('custom-class', 'rounded-lg');
    });

    it('should pass sizes prop to next/image', () => {
      render(
        <OptimizedImage
          src="/test-image.jpg"
          alt="Test image"
          width={800}
          height={600}
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      );

      const image = screen.getByTestId('next-image');
      expect(image).toHaveAttribute('sizes', '(max-width: 768px) 100vw, 50vw');
    });

    it('should pass additional props to next/image', () => {
      render(
        <OptimizedImage
          src="/test-image.jpg"
          alt="Test image"
          width={800}
          height={600}
          loading="eager"
          quality={90}
        />
      );

      const image = screen.getByTestId('next-image');
      expect(image).toHaveAttribute('loading', 'eager');
      expect(image).toHaveAttribute('quality', '90');
    });
  });

  describe('Placeholder display on image error', () => {
    it('should display placeholder when image fails to load', async () => {
      render(
        <OptimizedImage
          src="/broken-image.jpg"
          alt="Broken image"
          width={800}
          height={600}
        />
      );

      const image = screen.getByTestId('next-image');
      
      // Simulate image error wrapped in act
      await act(async () => {
        image.dispatchEvent(new Event('error'));
      });

      await waitFor(() => {
        expect(screen.queryByTestId('next-image')).not.toBeInTheDocument();
      });

      // Check placeholder is displayed
      const placeholder = screen.getByRole('img', { name: /broken image \(unavailable\)/i });
      expect(placeholder).toBeInTheDocument();
      expect(placeholder).toHaveTextContent('Image unavailable');
    });

    it('should preserve dimensions in placeholder (width/height mode)', async () => {
      render(
        <OptimizedImage
          src="/broken-image.jpg"
          alt="Broken image"
          width={800}
          height={600}
        />
      );

      const image = screen.getByTestId('next-image');
      
      await act(async () => {
        image.dispatchEvent(new Event('error'));
      });

      await waitFor(() => {
        const placeholder = screen.getByRole('img', { name: /broken image \(unavailable\)/i });
        expect(placeholder).toHaveStyle({ width: '800px', height: '600px' });
      });
    });

    it('should preserve dimensions in placeholder (fill mode)', async () => {
      render(
        <OptimizedImage
          src="/broken-image.jpg"
          alt="Broken image"
          fill={true}
        />
      );

      const image = screen.getByTestId('next-image');
      
      await act(async () => {
        image.dispatchEvent(new Event('error'));
      });

      await waitFor(() => {
        const placeholder = screen.getByRole('img', { name: /broken image \(unavailable\)/i });
        expect(placeholder).toHaveStyle({
          position: 'absolute',
          inset: '0',
        });
      });
    });

    it('should preserve className in placeholder', async () => {
      render(
        <OptimizedImage
          src="/broken-image.jpg"
          alt="Broken image"
          width={800}
          height={600}
          className="custom-class rounded-lg"
        />
      );

      const image = screen.getByTestId('next-image');
      
      await act(async () => {
        image.dispatchEvent(new Event('error'));
      });

      await waitFor(() => {
        const placeholder = screen.getByRole('img', { name: /broken image \(unavailable\)/i });
        expect(placeholder).toHaveClass('custom-class', 'rounded-lg');
      });
    });

    it('should call custom onError handler when provided', async () => {
      const customOnError = jest.fn();

      render(
        <OptimizedImage
          src="/broken-image.jpg"
          alt="Broken image"
          width={800}
          height={600}
          onError={customOnError}
        />
      );

      const image = screen.getByTestId('next-image');
      const errorEvent = new Event('error');
      
      await act(async () => {
        image.dispatchEvent(errorEvent);
      });

      await waitFor(() => {
        expect(customOnError).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Priority prop behavior', () => {
    it('should pass priority=true to next/image for above-fold images', () => {
      render(
        <OptimizedImage
          src="/hero-image.jpg"
          alt="Hero image"
          width={1200}
          height={800}
          priority={true}
        />
      );

      const image = screen.getByTestId('next-image');
      expect(image).toHaveAttribute('data-priority', 'true');
    });

    it('should default priority to false for below-fold images', () => {
      render(
        <OptimizedImage
          src="/product-image.jpg"
          alt="Product image"
          width={400}
          height={400}
        />
      );

      const image = screen.getByTestId('next-image');
      expect(image).not.toHaveAttribute('data-priority');
    });

    it('should explicitly set priority=false when specified', () => {
      render(
        <OptimizedImage
          src="/product-image.jpg"
          alt="Product image"
          width={400}
          height={400}
          priority={false}
        />
      );

      const image = screen.getByTestId('next-image');
      expect(image).not.toHaveAttribute('data-priority');
    });
  });

  describe('Dimensions preservation (CLS prevention)', () => {
    it('should always provide width and height for non-fill images', () => {
      render(
        <OptimizedImage
          src="/test-image.jpg"
          alt="Test image"
          width={800}
          height={600}
        />
      );

      const image = screen.getByTestId('next-image');
      expect(image).toHaveAttribute('width', '800');
      expect(image).toHaveAttribute('height', '600');
    });

    it('should not provide width/height when fill is true', () => {
      render(
        <OptimizedImage
          src="/test-image.jpg"
          alt="Test image"
          fill={true}
        />
      );

      const image = screen.getByTestId('next-image');
      expect(image).not.toHaveAttribute('width');
      expect(image).not.toHaveAttribute('height');
      expect(image).toHaveAttribute('data-fill', 'true');
    });

    it('should maintain aspect ratio with explicit dimensions', () => {
      const { rerender } = render(
        <OptimizedImage
          src="/test-image.jpg"
          alt="Test image"
          width={1600}
          height={900}
        />
      );

      let image = screen.getByTestId('next-image');
      const aspectRatio1 = parseInt(image.getAttribute('width')) / parseInt(image.getAttribute('height'));
      expect(aspectRatio1).toBeCloseTo(16 / 9, 2);

      // Rerender with different dimensions but same aspect ratio
      rerender(
        <OptimizedImage
          src="/test-image.jpg"
          alt="Test image"
          width={800}
          height={450}
        />
      );

      image = screen.getByTestId('next-image');
      const aspectRatio2 = parseInt(image.getAttribute('width')) / parseInt(image.getAttribute('height'));
      expect(aspectRatio2).toBeCloseTo(16 / 9, 2);
    });

    it('should handle square images correctly', () => {
      render(
        <OptimizedImage
          src="/square-image.jpg"
          alt="Square image"
          width={500}
          height={500}
        />
      );

      const image = screen.getByTestId('next-image');
      expect(image).toHaveAttribute('width', '500');
      expect(image).toHaveAttribute('height', '500');
    });
  });

  describe('Edge cases', () => {
    it('should handle missing alt text gracefully', () => {
      render(
        <OptimizedImage
          src="/test-image.jpg"
          alt=""
          width={800}
          height={600}
        />
      );

      const image = screen.getByTestId('next-image');
      expect(image).toHaveAttribute('alt', '');
    });

    it('should handle very large dimensions', () => {
      render(
        <OptimizedImage
          src="/large-image.jpg"
          alt="Large image"
          width={4000}
          height={3000}
        />
      );

      const image = screen.getByTestId('next-image');
      expect(image).toHaveAttribute('width', '4000');
      expect(image).toHaveAttribute('height', '3000');
    });

    it('should handle very small dimensions', () => {
      render(
        <OptimizedImage
          src="/thumbnail.jpg"
          alt="Thumbnail"
          width={50}
          height={50}
        />
      );

      const image = screen.getByTestId('next-image');
      expect(image).toHaveAttribute('width', '50');
      expect(image).toHaveAttribute('height', '50');
    });

    it('should not show placeholder before error occurs', () => {
      render(
        <OptimizedImage
          src="/test-image.jpg"
          alt="Test image"
          width={800}
          height={600}
        />
      );

      expect(screen.queryByText('Image unavailable')).not.toBeInTheDocument();
      expect(screen.getByTestId('next-image')).toBeInTheDocument();
    });
  });
});
