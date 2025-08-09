import { useState, useEffect, useCallback } from 'react';

// Hook for managing intersection observer animations
export const useInViewAnimation = (options = {}) => {
  const [ref, setRef] = useState<Element | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1, ...options }
    );

    observer.observe(ref);

    return () => observer.disconnect();
  }, [ref, options]);

  return { ref: setRef, inView };
};

// Hook for staggered animations
export const useStaggeredAnimation = (itemCount: number, delay = 100) => {
  const [activeItems, setActiveItems] = useState<Set<number>>(new Set());

  const triggerStagger = useCallback(() => {
    setActiveItems(new Set());
    
    for (let i = 0; i < itemCount; i++) {
      setTimeout(() => {
        setActiveItems(prev => new Set([...prev, i]));
      }, i * delay);
    }
  }, [itemCount, delay]);

  const isActive = (index: number) => activeItems.has(index);

  return { triggerStagger, isActive };
};

// Hook for managing loading states with animations
export const useAnimatedLoading = (initialState = false) => {
  const [isLoading, setIsLoading] = useState(initialState);
  const [showLoader, setShowLoader] = useState(initialState);

  const startLoading = useCallback(() => {
    setIsLoading(true);
    setShowLoader(true);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
    // Delay hiding loader for smooth animation
    setTimeout(() => setShowLoader(false), 200);
  }, []);

  return { isLoading, showLoader, startLoading, stopLoading };
};

// Hook for managing hover animations
export const useHoverAnimation = () => {
  const [isHovered, setIsHovered] = useState(false);

  const hoverProps = {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
  };

  return { isHovered, hoverProps };
};

// Hook for managing focus animations
export const useFocusAnimation = () => {
  const [isFocused, setIsFocused] = useState(false);

  const focusProps = {
    onFocus: () => setIsFocused(true),
    onBlur: () => setIsFocused(false),
  };

  return { isFocused, focusProps };
};

// Hook for managing page transitions
export const usePageTransition = () => {
  const [isTransitioning, setIsTransitioning] = useState(false);

  const startTransition = useCallback(() => {
    setIsTransitioning(true);
    return new Promise<void>(resolve => {
      setTimeout(() => {
        setIsTransitioning(false);
        resolve();
      }, 300);
    });
  }, []);

  return { isTransitioning, startTransition };
};