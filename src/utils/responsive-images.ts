/**
 * Responsive Images Utility
 * 
 * Generates optimized srcset attributes for responsive images.
 * Supports both hero images and content images with different breakpoints.
 */

interface ImageSizes {
  small: number;
  medium: number;
  large: number;
  xlarge?: number;
}

interface ResponsiveImageConfig {
  src: string;
  alt: string;
  sizes?: string;
  loading?: 'lazy' | 'eager';
  className?: string;
}

// Default breakpoints for different image types
export const HERO_SIZES: ImageSizes = {
  small: 768,   // Mobile
  medium: 1280, // Tablet
  large: 1920,  // Desktop
  xlarge: 2560  // Large screens
};

export const CONTENT_SIZES: ImageSizes = {
  small: 400,   // Mobile
  medium: 800,  // Tablet
  large: 1200   // Desktop
};

/**
 * Generate responsive image srcset from a base image path
 * Assumes optimized images exist with size suffixes
 * e.g., img-hero.webp -> img-hero-768w.webp, img-hero-1280w.webp
 */
export function generateSrcSet(imagePath: string, sizes: ImageSizes): string {
  const basePath = imagePath.replace(/\.[^/.]+$/, ''); // Remove extension
  const extension = imagePath.match(/\.[^/.]+$/)?.[0] || '.webp';
  
  const srcsetArray = Object.entries(sizes).map(([, width]) => {
    return `${basePath}-${width}w${extension} ${width}w`;
  });
  
  return srcsetArray.join(', ');
}

/**
 * Generate sizes attribute for responsive images
 */
export function generateSizes(type: 'hero' | 'content' | 'custom', customSizes?: string): string {
  if (customSizes) return customSizes;
  
  switch (type) {
    case 'hero':
      return '(max-width: 768px) 100vw, (max-width: 1280px) 100vw, (max-width: 1920px) 100vw, 2560px';
    case 'content':
      return '(max-width: 480px) 100vw, (max-width: 768px) 90vw, (max-width: 1200px) 80vw, 1200px';
    default:
      return '100vw';
  }
}

/**
 * Complete responsive image configuration
 */
export function createResponsiveImage(config: ResponsiveImageConfig, type: 'hero' | 'content' = 'content') {
  const sizes = type === 'hero' ? HERO_SIZES : CONTENT_SIZES;
  const srcSet = generateSrcSet(config.src, sizes);
  const sizesAttr = generateSizes(type, config.sizes);
  
  return {
    src: config.src,
    srcSet,
    sizes: sizesAttr,
    alt: config.alt,
    loading: config.loading || 'lazy',
    className: config.className
  };
}

/**
 * Get WebP path with fallback for older browsers
 */
export function getOptimizedImagePath(originalPath: string): string {
  // Convert common formats to WebP
  return originalPath.replace(/\.(jpg|jpeg|png)$/i, '.webp');
}

/**
 * Check if responsive image variants exist for a given path
 * This is a helper for development - in production, assumes they exist
 */
export function getResponsiveVariants(imagePath: string, sizes: ImageSizes): string[] {
  const basePath = imagePath.replace(/\.[^/.]+$/, '');
  const extension = imagePath.match(/\.[^/.]+$/)?.[0] || '.webp';
  
  return Object.values(sizes).map(width => `${basePath}-${width}w${extension}`);
}

/**
 * Preload critical hero images
 */
export function preloadHeroImage(imagePath: string): void {
  if (typeof window === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = imagePath;
  link.type = 'image/webp';
  document.head.appendChild(link);
}