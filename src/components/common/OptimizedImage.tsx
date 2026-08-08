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
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current?.complete) {
      setIsLoading(false);
      setError(false);
    } else {
      setIsLoading(true);
      setError(false);
    }
  }, [src]);

  const handleError = () => {
    setError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
    // Do not reset error state here, otherwise it will loop back to the broken src
  };

  return (
    <div className={cn("relative overflow-hidden bg-transparent w-full h-full", containerClassName)}>
      {isLoading && !error && (
        <div className="absolute inset-0 animate-pulse bg-bloom-pink/10 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-bloom-rose/20 border-t-bloom-rose animate-spin" />
        </div>
      )}
      <img 
        ref={imgRef} 
        src={error ? fallbackSrc : src} 
        alt={alt} 
        onLoad={handleLoad} 
        onError={handleError} 
        className={cn("transition-opacity duration-500", isLoading && !error ? "opacity-0" : "opacity-100", className)} 
        {...props} 
      />
    </div>
  );
}
