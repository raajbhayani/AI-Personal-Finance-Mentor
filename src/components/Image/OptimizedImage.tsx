import React, { useState, useCallback, useRef } from 'react';
import Image, { ImageProps } from 'next/image';

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad' | 'onError'> {
  fallbackSrc?: string;
  skeleton?: React.ReactNode;
  errorComponent?: React.ReactNode;
  lazy?: boolean;
  quality?: number;
  format?: 'webp' | 'avif' | 'auto';
  blur?: boolean;
  onLoadComplete?: () => void;
  onError?: (error: any) => void;
  className?: string;
  containerClassName?: string;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  fallbackSrc = '/images/placeholder.jpg',
  skeleton,
  errorComponent,
  lazy = true,
  quality = 75,
  format = 'auto',
  blur = true,
  onLoadComplete,
  onError,
  className = '',
  containerClassName = '',
  ...props
}) => {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [currentSrc, setCurrentSrc] = useState(src);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleLoad = useCallback(() => {
    setImageState('loaded');
    onLoadComplete?.();
  }, [onLoadComplete]);

  const handleError = useCallback((error: any) => {
    setImageState('error');
    if (currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setImageState('loading');
    } else {
      onError?.(error);
    }
  }, [currentSrc, fallbackSrc, onError]);

  // Generate optimized src with format and quality
  const getOptimizedSrc = (originalSrc: typeof src) => {
    // For StaticImageData or StaticRequire, return as-is (Next.js handles it)
    if (typeof originalSrc !== 'string') {
      return originalSrc;
    }

    if (originalSrc.startsWith('data:') || originalSrc.startsWith('blob:')) {
      return originalSrc;
    }

    // For external URLs, return as-is (Next.js will handle optimization)
    if (originalSrc.startsWith('http')) {
      return originalSrc;
    }

    // For internal images, add query parameters for optimization
    const url = new URL(originalSrc, window.location.origin);
    url.searchParams.set('q', quality.toString());

    if (format !== 'auto') {
      url.searchParams.set('f', format);
    }

    return url.toString();
  };

  // Skeleton placeholder
  const renderSkeleton = () => {
    if (skeleton) {
      return skeleton;
    }

    return (
      <div
        className={`animate-pulse bg-gray-200 dark:bg-gray-700 ${className}`}
        style={{
          width: props.width || '100%',
          height: props.height || '200px',
          aspectRatio: props.width && props.height ? `${props.width}/${props.height}` : undefined
        }}
        role="img"
        aria-label="Loading image..."
      />
    );
  };

  // Error state component
  const renderError = () => {
    if (errorComponent) {
      return errorComponent;
    }

    return (
      <div
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-400 ${className}`}
        style={{
          width: props.width || '100%',
          height: props.height || '200px',
          aspectRatio: props.width && props.height ? `${props.width}/${props.height}` : undefined
        }}
        role="img"
        aria-label="Failed to load image"
      >
        <svg
          className="w-12 h-12"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  };

  // Progressive loading with blur placeholder
  const blurDataURL = blur
    ? 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyejFq1leaSkn+3OzS/d75K1m/m9vMk48hINcJnFtRhKYFKJLiMVCHUVN9kGJmwuefLCuU/WW8PpdfHE6Zf7Uv3OzN/4dOD5dWYxm8vrhtPy3Kf+7qTvwh1LvFHwJnQ33F/2aAehvRcG3zVyO6kOTj9oJHKUNRqp4ROGTLlW8wgPnIiTY8v0p6HdNa4vDNUXjEKbqE4zMoS0a0+YKFnajHcxh9HwOJXjLmz4cFuNUjzHgKvN/vZO5TQ'
    : undefined;

  if (imageState === 'loading') {
    return (
      <div className={containerClassName}>
        {renderSkeleton()}
      </div>
    );
  }

  if (imageState === 'error' && currentSrc === fallbackSrc) {
    return (
      <div className={containerClassName}>
        {renderError()}
      </div>
    );
  }

  return (
    <div className={containerClassName}>
      <Image
        ref={imageRef}
        src={getOptimizedSrc(currentSrc)}
        alt={alt}
        className={`transition-opacity duration-300 ${
          imageState === 'loaded' ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        onLoad={handleLoad}
        onError={handleError}
        quality={quality}
        placeholder={blur ? 'blur' : 'empty'}
        blurDataURL={blurDataURL}
        loading={lazy ? 'lazy' : 'eager'}
        {...props}
      />
    </div>
  );
};

// Avatar component with fallback
export const Avatar: React.FC<{
  src?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallback?: string;
  className?: string;
}> = ({
  src,
  alt,
  size = 'md',
  fallback,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const fallbackComponent = (
    <div
      className={`
        ${sizeClasses[size]}
        rounded-full
        bg-gradient-to-br from-blue-500 to-purple-600
        flex items-center justify-center
        text-white font-semibold
        ${className}
      `}
    >
      {fallback || getInitials(alt)}
    </div>
  );

  if (!src) {
    return fallbackComponent;
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size === 'sm' ? 32 : size === 'md' ? 48 : size === 'lg' ? 64 : 96}
      height={size === 'sm' ? 32 : size === 'md' ? 48 : size === 'lg' ? 64 : 96}
      className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
      errorComponent={fallbackComponent}
      quality={90}
    />
  );
};

// Hero image component for large images
export const HeroImage: React.FC<{
  src: string;
  alt: string;
  overlay?: boolean;
  overlayOpacity?: number;
  className?: string;
  children?: React.ReactNode;
}> = ({
  src,
  alt,
  overlay = false,
  overlayOpacity = 0.4,
  className = '',
  children
}) => {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <OptimizedImage
        src={src}
        alt={alt}
        fill
        style={{ objectFit: 'cover' }}
        quality={85}
        priority
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
      />
      {overlay && (
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: overlayOpacity }}
        />
      )}
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
};

// Logo component with multiple formats
export const Logo: React.FC<{
  variant?: 'light' | 'dark' | 'color';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ variant = 'color', size = 'md', className = '' }) => {
  const sizeMap = {
    sm: { width: 120, height: 40 },
    md: { width: 180, height: 60 },
    lg: { width: 240, height: 80 },
  };

  const srcMap = {
    light: '/images/logo-light.svg',
    dark: '/images/logo-dark.svg',
    color: '/images/logo.svg',
  };

  return (
    <OptimizedImage
      src={srcMap[variant]}
      alt="AI Personal Finance Mentor Logo"
      width={sizeMap[size].width}
      height={sizeMap[size].height}
      className={className}
      priority
      quality={100}
    />
  );
};

export default OptimizedImage;