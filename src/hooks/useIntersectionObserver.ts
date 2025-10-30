import { useEffect, useRef, useState } from 'react';

interface Options extends IntersectionObserverInit {
  once?: boolean;
}

export function useIntersectionObserver<T extends Element>(options: Options = {}) {
  const { once = true, root, rootMargin, threshold } = options;
  const ref = useRef<T | null>(null);
  const [isIntersecting, setIntersecting] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIntersecting(true);
            if (once) {
              observer.disconnect();
            }
          } else if (!once) {
            setIntersecting(false);
          }
        });
      },
      { root, rootMargin, threshold }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [once, root, rootMargin, threshold]);

  return { ref, isIntersecting } as const;
}
