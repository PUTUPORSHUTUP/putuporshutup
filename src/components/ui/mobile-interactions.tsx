import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MobileSwipeableProps {
  children: React.ReactNode[];
  className?: string;
  showIndicators?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

export const MobileSwipeable = ({
  children,
  className,
  showIndicators = true,
  autoPlay = false,
  autoPlayInterval = 5000
}: MobileSwipeableProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startX, setStartX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!autoPlay) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % children.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, children.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const endX = e.changedTouches[0].clientX;
    const diffX = startX - endX;
    const threshold = 50;

    if (Math.abs(diffX) > threshold) {
      if (diffX > 0 && currentIndex < children.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else if (diffX < 0 && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      }
    }

    setIsDragging(false);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : children.length - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % children.length);
  };

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Main content */}
      <div
        className="flex transition-transform duration-300 ease-out touch-pan-y"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children.map((child, index) => (
          <div key={index} className="w-full flex-shrink-0">
            {child}
          </div>
        ))}
      </div>

      {/* Navigation buttons (hidden on mobile) */}
      {children.length > 1 && (
        <>
          <Button
            variant="outline"
            size="sm"
            className="absolute left-2 top-1/2 transform -translate-y-1/2 hidden md:flex h-10 w-10 p-0 bg-background/80 backdrop-blur-sm"
            onClick={goToPrevious}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 hidden md:flex h-10 w-10 p-0 bg-background/80 backdrop-blur-sm"
            onClick={goToNext}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </>
      )}

      {/* Indicators */}
      {showIndicators && children.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {children.map((_, index) => (
            <button
              key={index}
              className={cn(
                'w-2 h-2 rounded-full transition-all duration-200',
                index === currentIndex 
                  ? 'bg-primary w-6' 
                  : 'bg-primary/30 hover:bg-primary/50'
              )}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface MobilePullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
}

export const MobilePullToRefresh = ({
  onRefresh,
  children,
  className
}: MobilePullToRefreshProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [startY, setStartY] = useState(0);

  const threshold = 80;

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentY = e.touches[0].clientY;
    const distance = currentY - startY;
    
    if (distance > 0 && window.scrollY === 0) {
      setPullDistance(Math.min(distance, threshold * 1.5));
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > threshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    setPullDistance(0);
  };

  return (
    <div 
      className={cn('relative', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      {pullDistance > 0 && (
        <div 
          className="absolute top-0 left-0 right-0 flex items-center justify-center bg-primary/10 text-primary transition-all duration-200"
          style={{ height: `${Math.min(pullDistance, threshold)}px` }}
        >
          <div className="text-sm font-medium">
            {pullDistance > threshold ? 'Release to refresh' : 'Pull to refresh'}
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {isRefreshing && (
        <div className="absolute top-0 left-0 right-0 h-16 flex items-center justify-center bg-primary/10">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Content */}
      <div 
        className="transition-transform duration-200"
        style={{ 
          transform: `translateY(${isRefreshing ? 64 : Math.min(pullDistance, threshold)}px)` 
        }}
      >
        {children}
      </div>
    </div>
  );
};