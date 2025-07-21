import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MobileCardGridProps {
  children: React.ReactNode;
  className?: string;
  columns?: 1 | 2;
  gap?: 'sm' | 'md' | 'lg';
}

export const MobileCardGrid = ({ 
  children, 
  className, 
  columns = 1, 
  gap = 'md' 
}: MobileCardGridProps) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6'
  };

  const gridClasses = isMobile 
    ? `grid grid-cols-1 ${gapClasses[gap]}`
    : `grid grid-cols-1 md:grid-cols-${columns} ${gapClasses[gap]}`;

  return (
    <div className={cn(gridClasses, className)}>
      {children}
    </div>
  );
};

interface MobileOptimizedCardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  badge?: string;
  className?: string;
  onClick?: () => void;
  touchOptimized?: boolean;
}

export const MobileOptimizedCard = ({
  title,
  subtitle,
  children,
  action,
  badge,
  className,
  onClick,
  touchOptimized = true
}: MobileOptimizedCardProps) => {
  const [isPressed, setIsPressed] = useState(false);

  const handleTouchStart = () => {
    if (touchOptimized && onClick) {
      setIsPressed(true);
    }
  };

  const handleTouchEnd = () => {
    if (touchOptimized && onClick) {
      setIsPressed(false);
    }
  };

  return (
    <Card 
      className={cn(
        "transition-all duration-200",
        touchOptimized && onClick && "cursor-pointer active:scale-[0.98]",
        isPressed && "scale-[0.98] shadow-sm",
        className
      )}
      onClick={onClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseLeave={() => setIsPressed(false)}
    >
      <CardContent className="p-4 md:p-6">
        {(title || subtitle || badge) && (
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              {title && (
                <h3 className="font-semibold text-base md:text-lg truncate">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-sm text-muted-foreground truncate">
                  {subtitle}
                </p>
              )}
            </div>
            {badge && (
              <Badge variant="secondary" className="ml-2 shrink-0">
                {badge}
              </Badge>
            )}
          </div>
        )}
        
        <div className="space-y-3">
          {children}
        </div>
        
        {action && (
          <div className="mt-4 pt-3 border-t border-border">
            {action}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface MobileActionButtonProps {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export const MobileActionButton = ({
  children,
  variant = 'default',
  size = 'md',
  fullWidth = false,
  className,
  onClick,
  disabled = false
}: MobileActionButtonProps) => {
  const sizeClasses = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-12 px-4 text-base',
    lg: 'h-14 px-6 text-lg'
  };

  return (
    <Button
      variant={variant}
      className={cn(
        sizeClasses[size],
        fullWidth && 'w-full',
        'touch-manipulation', // Improves touch responsiveness
        className
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </Button>
  );
};