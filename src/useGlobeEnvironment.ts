import { useEffect, useState } from 'react';

export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);
    updatePreference();
    mediaQuery.addEventListener('change', updatePreference);
    return () => mediaQuery.removeEventListener('change', updatePreference);
  }, []);

  return prefersReducedMotion;
}

export function useSquareSize(size: number | undefined): {
  containerRef: (element: HTMLDivElement | null) => void;
  size: number;
} {
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const [responsiveSize, setResponsiveSize] = useState(0);

  useEffect(() => {
    if (size !== undefined || !element) {
      return;
    }
    const updateSize = () => setResponsiveSize(Math.round(element.clientWidth));
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    return () => observer.disconnect();
  }, [element, size]);

  return { containerRef: setElement, size: size ?? responsiveSize };
}
