import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  containerClassName?: string;
}

export function OptimizedImage({ 
  src, 
  alt, 
  className, 
  containerClassName,
  fallbackSrc = 'https://images.unsplash.com/photo-1605497746444-ac9db1340459?q=80&w=800&auto=format&fit=crop',
  ...props 
}: OptimizedImageProps) {
  const [currentSrc, setCurrentSrc] = useState<string>(src || fallbackSrc);
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const targetSrc = src || fallbackSrc;
    setCurrentSrc(targetSrc);
    setIsError(false);

    // If already complete in browser cache, don't show loading spinner
    if (imgRef.current && imgRef.current.complete) {
      if (imgRef.current.naturalWidth === 0 && targetSrc) {
        handleError();
      } else {
        setIsLoading(false);
      }
    }
  }, [src, fallbackSrc]);

  const handleError = () => {
    if (currentSrc !== fallbackSrc && fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setIsLoading(false);
    } else {
      setIsError(true);
      setIsLoading(false);
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  return (
    <div className={cn("relative overflow-hidden bg-gray-50/40 w-full h-full flex items-center justify-center", containerClassName)}>
      {isLoading && (
        <div className="absolute inset-0 animate-pulse bg-bloom-pink/10 flex items-center justify-center z-10 pointer-events-none">
          <div className="w-8 h-8 rounded-full border-2 border-bloom-rose/20 border-t-bloom-rose animate-spin" />
        </div>
      )}
      
      {isError ? (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-rose-50 to-pink-50 text-gray-400">
          <svg className="w-10 h-10 text-bloom-rose/30 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xs font-serif text-gray-500 text-center line-clamp-1">{alt || 'Bloom & Blossom'}</span>
        </div>
      ) : (
        <img 
          ref={imgRef} 
          src={currentSrc} 
          alt={alt} 
          referrerPolicy="no-referrer"
          loading="lazy"
          onLoad={handleLoad} 
          onError={handleError} 
          className={cn("transition-opacity duration-300", className)} 
          {...props} 
        />
      )}
    </div>
  );
}

