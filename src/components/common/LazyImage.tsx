import React, { ImgHTMLAttributes } from 'react';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import { Skeleton } from './Skeleton';

interface LazyImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  placeholder?: React.ReactNode;
  threshold?: number;
}

export function LazyImage({
  src,
  alt,
  placeholder,
  threshold = 0.1,
  className,
  ...props
}: LazyImageProps) {
  const { ref, isIntersecting } = useIntersectionObserver<HTMLDivElement>({ threshold });
  const [isLoaded, setIsLoaded] = React.useState(false);

  return (
    <div ref={ref} className={className}>
      {isIntersecting ? (
        <>
          {!isLoaded && (placeholder || <Skeleton width="100%" height="100%" />)}
          <img
            src={src}
            alt={alt}
            onLoad={() => setIsLoaded(true)}
            style={{ display: isLoaded ? 'block' : 'none' }}
            {...props}
          />
        </>
      ) : (
        placeholder || <Skeleton width="100%" height="100%" />
      )}
    </div>
  );
}
